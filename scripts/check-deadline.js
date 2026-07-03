// scripts/check-deadline.js
import fs from "fs";
import path from "path";

const POSTS_DIR = "src/posts";
const OUTPUT = "deadline/changes.txt";
const LAST_RUN_FILE = "deadline/.last-run";
const DELAY_MS = 3000;

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// <p class="tver">ブロックのうち「終了日未記載」を含むものだけ抽出
const extractUnconfirmed = (content) => {
  const dateMatch = content.match(/^date:\s*(.+)$/m);
  const fileDate = dateMatch?.[1].trim() ?? null;

  const today = new Date();
  const diffDays = fileDate
      ? Math.floor((today - new Date(fileDate)) / 864e5)
      : 999;

  // 作成から3日未満はスキップ
  if (diffDays < 3) return [];

  const blocks = [...content.matchAll(/<p\s+class="tver">([\s\S]*?)<\/p>/g)];

  return blocks
    .map(m => m[1])
    .filter(b => /終了日未記載|終了時間未記載/.test(b))
    .map(b => {
      const lines = b.split("\n").map(s => s.trim()).filter(Boolean);
      const headLine = lines[0] ?? "(不明)";

      // タイトル抽出できればそちら優先、失敗時はheadLineそのまま使う
      const titleMatch = headLine.match(
        /(?:ドラマSP|ドラマ|バラエティ|アニメ|ドキュメンタリー|その他)\s+(.+?)\s*\(/
      );
      const title = titleMatch?.[1] ?? headLine;

      const urlMatch = b.match(/https:\/\/tver\.jp\/episodes\/\S+/);
      return urlMatch ? { title, url: urlMatch[0] } : null;
    })
    .filter(Boolean);
};

const fetchDeadline = async (url) => {
  try {
    const episodeId = url.split("episodes/")[1];
    const jsonUrl = `https://statics.tver.jp/content/episode/${episodeId}.json`;

    const res = await fetch(jsonUrl);
    if (!res.ok) return { status: "error", reason: `HTTP ${res.status}` };

    const data = await res.json();
    const endAt = data?.viewStatus?.endAt;
    if (!endAt) return { status: "error", reason: "endAtが見つからない" };

    const endDate = new Date(endAt * 1000); // UnixタイムスタンプはミリSecに変換
    const mo  = endDate.getMonth() + 1;
    const d   = endDate.getDate();
    const h   = String(endDate.getHours()).padStart(2, "0");
    const min = String(endDate.getMinutes()).padStart(2, "0");

    // 年をまたぐ場合は西暦も付ける
    const today = new Date();
    const deadline = endDate.getFullYear() !== today.getFullYear()
      ? `${endDate.getFullYear()}/${mo}/${d} ${h}:${min}まで`
      : `${mo}/${d} ${h}:${min}まで`;

    return { status: "confirmed", deadline };

  } catch (e) {
    return { status: "error", reason: e.message };
  }
};

const main = async () => {
  if (!fs.existsSync(POSTS_DIR)) {
    console.error(`✗ ${POSTS_DIR} が存在しません`);
    return;
  }

  const files = fs.readdirSync(POSTS_DIR).filter(f => f.endsWith(".njk"));
  const report = [];

  for (const file of files) {
    const content = fs.readFileSync(path.join(POSTS_DIR, file), "utf-8");
    const items = extractUnconfirmed(content);
    if (!items.length) continue;

    const results = [];
    for (const item of items) {
      const r = await fetchDeadline(item.url);
      // over_week はそもそも記録しない（①の方針）
      if (r.status !== "over_week") {
        results.push({ ...item, ...r });
      }
      await sleep(DELAY_MS);
    }

    if (results.length) report.push({ file, results });
  }

  if (!report.length) {
    console.log("✅ 更新対象なし（すべて1週間以上 or 未記載アイテムなし）");
    return;
  }

  const lines = report.flatMap(({ file, results }) => [
    "",
    file,
    ...results.map(r =>
      r.status === "confirmed"
        ? `${r.title}\t${r.deadline}`
        : `${r.title}\t(取得失敗: ${r.reason})`
    ),
  ]);

  fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
  fs.writeFileSync(OUTPUT, lines.join("\n"), "utf-8");
  console.log(`✅ ${OUTPUT} に書き出しました（対象 ${report.length}ファイル）`);
};

main();

const shouldRunToday = () => {
  const today = new Date().toISOString().slice(0, 10);
  if (!fs.existsSync(LAST_RUN_FILE)) return true;
  const last = fs.readFileSync(LAST_RUN_FILE, "utf-8").trim();
  return last !== today;
};

const markRunToday = () => {
  fs.mkdirSync(path.dirname(LAST_RUN_FILE), { recursive: true });
  fs.writeFileSync(LAST_RUN_FILE, new Date().toISOString().slice(0, 10));
};

export const runDeadlineCheckOnce = async () => {
  if (!shouldRunToday()) {
    console.log("ℹ️ 終了日チェックは本日実行済みのためスキップ");
    return;
  }
  console.log("🔍 終了日チェックを開始します...");
  try {
    await main();
  } catch (e) {
    console.error("チェック中にエラー:", e.message);
  } finally {
    markRunToday(); // 成功・失敗に関わらず必ず実行
    console.log("✅ .last-run を更新しました");
  }
};
