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
  const blocks = [...content.matchAll(/<p\s+class="tver">([\s\S]*?)<\/p>/g)];

  return blocks
    .map(m => m[1])
    .filter(b => b.includes("終了日未記載"))
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
    const res = await fetch(url);
    if (!res.ok) return { status: "error", reason: `HTTP ${res.status}` };

    const html = await res.text();

    // SubInfo要素のテキストを抽出（構造変化時はここがエラーになる想定）
    //const m = html.match(/SubInfo_root__[^"]*"[^>]*>([^<]+)</);
    const m = htme.match(/EpisodeDescription_endAtLabel__[^"]*"[^>]*>([^<]+)</);
    if (!m) return { status: "error", reason: "該当要素が見つからない（構造変化の可能性）" };

    const text = m[1].trim();

    if (text.includes("1週間以上")) return { status: "over_week" };

    // 西暦の有無どちらにも対応
const dateMatch = text.match(/(?:(\d{4})年)?(\d{1,2})月(\d{1,2})日.*?(\d{1,2}:\d{2})/);
if (!dateMatch) return { status: "error", reason: `日付パース失敗: "${text}"` };

const [, year, mo, d, time] = dateMatch;
const deadline = year
  ? `${year}/${mo}/${d} ${time}まで`
  : `${mo}/${d} ${time}まで`;

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
  console.log("🔍 終了日未記載チェックを開始します...");
  await main();
  markRunToday();
};
