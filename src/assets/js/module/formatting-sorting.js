const leftDay = (limit) =>
  Math.ceil((new Date(limit) - new Date()) / 864e5);

const getVideoId = (url) =>
  (url.match(/youtu\.be\/([^?&\s]+)/) ?? url.match(/[?&]v=([^&\s]+)/))?.[1] ?? "";

// 終了日文字列 → { endOfDay, leftD, expired }
const calcEndInfo = (rawStr) => {
  if (!rawStr || rawStr.includes("未記載"))
    return { endOfDay: "", leftD: "", expired: false };

  const endOfDay = rawStr.replace("まで", "").trim();

  // 曜日除去してから日付と時刻に分離
  const cleaned = endOfDay.replace(/\(.\)/g, "").trim();
  const [datePart, timePart] = cleaned.split(" ");

  // 年を補完
  const withYear = /^\d{4}/.test(datePart)
    ? datePart
    : `${new Date().getFullYear()}/${datePart}`;

  // "2026/6/12" → "2026-06-12"（ゼロ埋め）
  const [y, m, d] = withYear.split("/");
  const dateStr = `${y}-${m.padStart(2,"0")}-${d.padStart(2,"0")}`;

  // 時刻あり → ローカル時間のdatetime / なし → ローカル深夜0時
  const isoStr = timePart
    ? (() => {
        const [h, min] = timePart.split(":");
        return `${dateStr}T${h.padStart(2,"0")}:${min.padStart(2,"0")}:00`;
      })()
    : `${dateStr}T00:00:00`;

  const days = leftDay(isoStr);
  return { endOfDay, leftD: days > 0 ? days : "", expired: days < 1 };
};

// "2028/3/31" → "2028-03-31" に変換（ゼロ埋め）
const toISO = (str) =>
  str.replace(
    /^(\d{4})\/(\d{1,2})\/(\d{1,2})/,
    (_, y, m, d) => `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`
  );

// ジャンルごとの設定を一か所に集約（これが「答え」を先に置く部分）
const GENRE = {
	ドラマ: { catId: "drama", unit: "話" },
	ドラマSP: { catId: "drama", unit: "話" },
	アニメ: { catId: "anime", unit: "話" },
	バラエティ: { catId: "variety", unit: "回" },
	ドキュメンタリー: { catId: "documentaly", unit: "回" },
	その他: { catId: "other", unit: "回" }
};

// named capture groups でregexを自己文書化
const HEAD_RE = /(?<genre>ドラマSP|ドラマ|バラエティ|アニメ|ドキュメンタリー|その他)\s+(?<title>.+?)\s*\((?<yearSeason>.+?)\)\s*(?<ep>\d+|.*?)?(話|回)?の配信/;

// ── TVer パーサー ─────────────────────────────────────
const parseTver = (p) => {
  const [head, endDay, ...rest] = p.textContent
    .split("\n").map(s => s.trim()).filter(Boolean);

  let artist, linkLines;
  if (rest.at(-1).includes("https://")) {
    const link = rest.pop();
    artist = rest.pop();
    linkLines = [link];
  } else {
    artist = rest.pop();
    linkLines = rest.filter(s => s.includes("https://"));
  }

  let subLine = rest.find(s => !s.includes("https://")) ?? "";
  const { groups: { genre, title, yearSeason, ep } } = head.match(HEAD_RE);
  const rule = GENRE[genre];
  const [year, rawSeason = ""] = yearSeason.split("・");
  const { endOfDay, leftD, expired } = calcEndInfo(endDay);

  const episode = ep
    ? (genre === "ドラマSP" && !/^\d+$/.test(ep) ? ep : `${ep}${rule.unit}`)
    : "";

  const links = linkLines.map(s => {
    const m = s.match(/^(.+?)[：:]\s*(https?:\/\/\S+)$/) ?? s.match(/^()(https?:\/\/\S+)$/);
    return m ? { label: m[1].trim(), url: m[2] } : { label: "", url: s };
  });

  const episodeId = links[0]?.url.split("episodes/")[1] ?? "";

  subLine = subLine.replace(/(▽|▼|★)/g, `<span class="splitTriangle">$1</span>`);
  subLine = subLine.replace(/(【(.*?)】|『(.*?)』|\[(.*?)\])/g, `<span class="feat">$1</span>`);
  subLine = subLine.replace(/(「(.*?)」)/g, `<strong>$1</strong>`);

  return {
    type: "tver",
    genre, title, year,
    season: rawSeason.replace(/(\d+)期/, "シーズン$1"),
    episode, sub: subLine.replace(/^※\s*/, ""),
    endOfDay, leftDay: leftD, expired,
    cast: artist.split(/\s+(他|らが出演しています)/)[0],
    links,
    thumbLinkUrl: links[0]?.url ?? "",
    thumbSrc: `https://image-cdn.tver.jp/w=400/images/content/thumbnail/episode/small/${episodeId}.jpg`,
    catId: rule.catId,
  };
};

// ── YouTube パーサー ──────────────────────────────────
const parseYT = (p) => {
  const lines = p.textContent.split("\n").map(s => s.trim()).filter(Boolean);
  const [head, ...rest] = lines;

  // ヘッダー: タイトル｜配信日｜配信者｜時間
  const [title = "", date = "", channel = "", duration = ""] =
    head.split(/[|｜]/).map(s => s.trim());

  // 末尾のURL
  //const url = rest.pop() ?? "";
  const mainUrlIdx = rest.findLastIndex(l => /^https?:\/\//.test(l.trim()));
  const mainUrl = mainUrlIdx >= 0 ? rest.splice(mainUrlIdx, 1)[0].trim() : "";
  //const videoId = getVideoId(mainUrl);
  //const links = [{ label: "", url: mainUrl }];
const links = [];
  const subParts = [];
  const castNames = [];

  let endDayRaw = "";

  for (const line of rest) {
    if (!line) continue;
    if (line.startsWith("※")) {
      const info = line.replace(/^※\s*/, "");
      // 期限パターンを探す（「まで」があるもの）
      const m = info.match(/^((\d{4}\/)?\d{1,2}\/\d{1,2}(?:\(.\))?(?:\s*\d{1,2}:\d{2})?)\s*まで/);
      if (m && !endDayRaw) endDayRaw = m[0];
      subParts.push(info);
    } else if (/^.+?[：:]\s*https?:\/\//.test(line)) {
      const m = line.match(/^(.+?)[：:]\s*(https?:\/\/\S+)$/);
      if (m) links.push({ label: m[1].trim(), url: m[2] });
    } else if (line.includes("https://")) {
      //} else if (line.match(/https?:\/\//)[1],includes("https://")) {
      const m = line.match(/^(.+?)[：:]\s*(https?:\/\/\S+)$/);
        if (m) {
          links.push({ label: m[1].trim(), url: m[2] });
        } else {
          links.push({ label: "", url: line });
        }

      //} else if (line.includes("：") || line.includes("|") || line.includes("｜")) {
    } else if (line.includes("：") || line.includes("｜")) {
      // キャスト：キャラクター 形式（複数行）
      //castNames.push(line.split("：")[0].replace(/[\s　]+/g, ""));
		castNames.push(line);
    } else if (line.includes("、") || line.includes("らが出演")) {
      let withoutLastSpace = line.replace(/\s+?(他|らが出演)/,"|").split("|")[0];
      // 読点区切りキャスト
      castNames.push(withoutLastSpace);

    } else {
      // その他の情報行
      subParts.push(line);
    }
  }

  const { endOfDay, leftD, expired } = calcEndInfo(endDayRaw || "未記載");

  // サムネイルのリンク先：mainUrl優先、なければ最初のラベル付きリンク
  const thumbLinkUrl = mainUrl || links[0]?.url || "";
  const videoId = getVideoId(thumbLinkUrl);

  return {
    type: "youtube",
    genre: "YouTube",
    title, year: date, season: channel, episode: duration,
    sub: subParts.join(" "),
    endOfDay: endDayRaw ? endOfDay : "",
    leftDay: leftD, expired,
    cast: castNames,
    links,
    thumbSrc: `https://i.ytimg.com/vi_webp/${videoId}/maxresdefault.webp`,
      fallbackSrc: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
      thumbLinkUrl,
      catId: "youtube",
  };
};


// ── レンダリング ──────────────────────────────────────
const renderLinks = (links, mainUrl = "") => {
  if (links.length > 0) {
    return links.map(({ label, url }) =>
      label ?
        `<a class="part-link" href="${url}" target="_blank" title="${label}へのリンク">${label || url}</a>`
        :`<a class="part-link" href="${url}" target="_blank" title="リンク">${label || url}</a>`

    ).join("");
  }
  // ラベル付きリンクがない場合はmainUrlを表示
  return mainUrl
    ? `<a href="${mainUrl}" target="_blank" title="動画ページのリンク">${mainUrl}</a>`
    : "";
};


let castIdCounter = 0;

const buildCast = (cast) => {
 const isArray = Array.isArray(cast);
 const hasRoles = isArray && cast.some(c => c.includes("："));

 // 「、」区切り → 従来通り
 if (!hasRoles) {
   const inner = isArray ? cast.join("、") : cast;
   return `<div class="cast">${inner}</div>`;
 }

 // キャスト：キャラクター → popover
 const id = `cast-pop-${castIdCounter++}`;
 const rows = cast.map(line => {
   const [actor, role = ""] = line.split("：");
   return `<div class="cast-entry">
     <span class="cast-actor">${actor.trim()}</span>
     <span class="cast-role">${role.trim()}</span>
   </div>`;
 }).join("");

 return `
   <button class="cast-toggle" popovertarget="${id}">
     出演者 ${cast.length}名をPickup
   </button>
   <div id="${id}" popover class="cast-popover">
     <div class="cast-popover-grid">${rows}</div>
   </div>`;
};

// head部分はTVerとYoutubeで構造が違う
const buildHead = (d) => d.type === "youtube"
  ? `<span class="title">${d.title}</span>
     <span class="channel">${d.season}</span>
     <span class="date">${d.year}</span>
     <span class="duration">${d.episode}</span>`
  : `<span class="title">${d.title}</span>
     <span class="broadcastYear">${d.year}<span class="season">${d.season}</span></span>
     <span class="episode">${d.episode}</span>`;

const allVideoData = [];

const render = (d, p) => {

  if (d.genre === "アニメ") {
    d.genre = `${d.genre}<span class="genre-hero">(ヒーロー)</span>`;
  } else if (d.genre === "ドキュメンタリー") {
    d.genre = `${d.genre}<span class="genre-documentaly">(報道)</span>`;
  }

  p.innerHTML = `
    <div class="category ${d.catId}">${d.genre}</div>
    <div class="head">${buildHead(d)}</div>
    ${d.endOfDay
      ? `<div class="endOfDay">${d.endOfDay}<span class="leftDay">${d.leftDay}</span></div>`
      : ""}
    <div class="sub">${d.sub}</div>
    <div class="cast">${buildCast(d.cast)}</div>
    <div class="thumbnail"></div>
    <div class="link">${renderLinks(d.links, d.thumbLinkUrl ?? "")}</div>`;

  if (d.expired) p.classList.add("period");
  document.querySelector(`#${d.catId}`).appendChild(p);

  allVideoData.push({
    title:        d.title,
    episode:      d.episode,
    genre:        d.genre,
    catId:        d.catId,
    links:        d.links,
    thumbLinkUrl: d.thumbLinkUrl ?? "",  // ← これが抜けていると空になる
    year:         d.year,
    cast:         Array.isArray(d.cast) ? d.cast : d.cast.split("、"),
    endOfDay:     d.endOfDay,
    leftDay:      d.leftDay,
    expired:      d.expired,
  });
  //console.log("ls", d.links)
};
export const getVideoData = () => allVideoData;

// ── サムネイル非同期ロード ─────────────────────────────
const loadThumbnail = (cardEl, thumbSrc, linkUrl, fallbackSrc = null, timeoutMs = 8000) => {
  const thumbEl = cardEl.querySelector(".thumbnail");

  const tryLoad = (src, onFail) => {
    const img = new Image();
    img.alt = "サムネイル";
    let settled = false;

    const settle = (fn) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      fn();
    };

    const timer = setTimeout(() =>
      settle(() => { img.src = ""; thumbEl.textContent = "（タイムアウト）"; }),
      timeoutMs
    );

    img.onload = () => settle(() => {
      if (img.naturalWidth === 120 && img.naturalHeight === 90) {
        const dv = document.createElement("div");
        dv.classList.add("no-thumb");
        thumbEl.appendChild(dv);
      } else {
      const a = Object.assign(document.createElement("a"),
        { href: linkUrl, target: "_blank", title: "リンク" });
      a.appendChild(img);
        thumbEl.appendChild(a);
      }
    });

    img.onerror = () => settle(onFail);
    img.src = src;
  };

  tryLoad(thumbSrc, () =>
    fallbackSrc
      ? tryLoad(fallbackSrc, () => { thumbEl.textContent = "（画像なし）"; })
      : (thumbEl.textContent = "（画像なし）")
  );
};

export function formattingSorting() {
  const cards = [];

  const process = (p, parseFn) => {
    try {
      const d = parseFn(p);
      render(d, p);
      cards.push({
        p,
        thumbSrc: d.thumbSrc,
        fallbackSrc: d.fallbackSrc ?? null,
        linkUrl: d.thumbLinkUrl ?? d.links[0]?.url ?? "",
      });
    } catch (e) {
      console.error("パースエラー:", e.message, p.textContent.slice(0, 60));
    }
  };

  // 要素を配列に取得してからexpired順にソート
  const sortByExpired = (selector, parseFn) => {
    const els = [...document.querySelectorAll(selector)];
    const parsed = els.flatMap(p => {
      try {
        return [{ p, d: parseFn(p) }];
      } catch (e) {
        console.error("パースエラー:", e.message, p.textContent.slice(0, 60));
        return [];
      }
    });

    // 配信中を先頭、終了済みを末尾
    parsed.sort((a, b) => (a.d.expired ? 1 : 0) - (b.d.expired ? 1 : 0));

    parsed.forEach(({ p, d }) => {
      render(d, p);
      cards.push({
        p,
        thumbSrc: d.thumbSrc,
        fallbackSrc: d.fallbackSrc ?? null,
        linkUrl: d.thumbLinkUrl ?? d.links[0]?.url ?? "",
      });
    });
  };

  sortByExpired(".tver", parseTver);
  sortByExpired(".yt", parseYT);

  cards.forEach(({ p, thumbSrc, fallbackSrc, linkUrl }) =>
    loadThumbnail(p, thumbSrc, linkUrl, fallbackSrc)
  );
}
