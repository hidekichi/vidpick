// Node.js用：ファイルコンテンツからキャストを抽出

const leftDay = (limit) =>
  Math.ceil((new Date(limit) - new Date()) / 864e5);

const checkExpired = (rawStr) => {
  if (!rawStr || rawStr.includes("未記載")) return false;
  const cleaned = rawStr
    .replace("まで", "")
    .replace(/\(.\)/g, "")
    .split(" ")[0].trim();
  const withYear = /^\d{4}/.test(cleaned)
    ? cleaned
    : `${new Date().getFullYear()}/${cleaned}`;
  return leftDay(withYear.replace(/\//g, "-")) < 1;
};

// グループ名(name1、name2、...) → name1(グループ名)、name2(グループ名)
const expandGroupNotation = (line) =>
  line.replace(/([^、\s()]+)\(([^()]*、[^()]*)\)/g, (_, group, names) =>
    names.split("、").map(n => `${n.trim()}(${group})`).join("、")
  );

// TVer形式ブロックからキャスト抽出
const fromTver = (blockText) => {
  const lines = blockText.split("\n").map(s => s.trim()).filter(Boolean);

  // 2行目が終了日 → 期限切れならスキップ
  if (checkExpired(lines[1])) return [];

  const castLine = lines.find(l =>
    //l.includes("らが出演しています") ||
    //(l.includes("、") && !l.startsWith("※") && !l.includes("https://"))
    l.includes(" らが出演しています") || l.includes(" 他")
  );
  if (!castLine) return [];

  //console.log("casts: ", expandGroupNotation(castLine).split(/\s+(話|らが出演しています)/)[0].split("、").map(s => s.trim()).filter(Boolean));
  return expandGroupNotation(castLine)
    //.split(" ")[0]   // "らが出演しています"より前
    //.replace(/\s*(らが出演しています。?|話)\s*$/, "")
    .split(/\s+(他|らが出演しています)/)[0]
    .split("、")
    .map(s => s.trim())
    .filter(Boolean);
};

// YouTube形式ブロックからキャスト抽出
const fromYT = (blockText) => {
  const lines = blockText.split("\n").map(s => s.trim()).filter(Boolean);

  // ※行から期限を検出
  for (const line of lines) {
    if (!line.startsWith("※")) continue;
    const m = line.match(/(\d{1,2}\/\d{1,2}(?:\(.\))?(?:\s*\d{1,2}:\d{2})?)\s*まで/);
    if (m && checkExpired(m[0])) return [];
  }

  const cast = [];
  for (const line of lines) {
    if (line.startsWith("※") || line.includes("https://")) continue;

    if (line.includes("：")) {
      // キャスト：キャラクター形式
      cast.push(line.split("：")[0].replace(/[\s　]+/g, "").trim());
    } else if (line.includes("、") || line.includes("らが出演")) {
      // 読点区切り形式
      cast.push(
        ...expandGroupNotation(line.split(" ")[0])
              .split("、").map(s => s.trim()).filter(Boolean)
      );
    }
  }
  return cast;
};

// メイン：ファイル全体からキャストを抽出（重複なし・期限切れ除外）
const extractCast = (fileContent) => {
  const result = new Set();

  for (const [re, fn] of [
    [/<p\s+class="tver">([\s\S]*?)<\/p>/g, fromTver],
    [/<p\s+class="yt">([\s\S]*?)<\/p>/g,   fromYT  ],
  ]) {
    let m;
    while ((m = re.exec(fileContent)) !== null) {
      fn(m[1]).forEach(c => result.add(c));
    }
  }

  return [...result];
};

export { extractCast };
