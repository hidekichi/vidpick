const leftDay = (limit) =>
  Math.ceil((new Date(limit) - new Date()) / 864e5);

const getVideoId = (url) =>
  (url.match(/youtu\.be\/([^?&\s]+)/) ?? url.match(/[?&]v=([^&\s]+)/))?.[1] ?? "";

// 終了日文字列 → { endOfDay, leftD, expired }
const calcEndInfo = (rawStr) => {
  if (!rawStr || rawStr.includes("未記載"))
    return { endOfDay: "", leftD: "", expired: false };

  const endOfDay = rawStr.replace("まで", "").trim();

  // 曜日"(木)"などを除去し日付部分だけ Date に渡す
  const datePart = endOfDay.replace(/\(.\)/g, "").split(" ")[0].trim();
  const withYear = /^\d{4}/.test(datePart)
    ? datePart
    : `${new Date().getFullYear()}/${datePart}`;
  const days = leftDay(withYear.replace(/\//g, "-"));

  return { endOfDay, leftD: days > 0 ? days : "", expired: days < 1 };
};

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

  const subLine = rest.find(s => !s.includes("https://")) ?? "";
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

  return {
    type: "tver",
    genre, title, year,
    season: rawSeason.replace("期", "シーズン"),
    episode, sub: subLine.replace(/^※\s*/, ""),
    endOfDay, leftDay: leftD, expired,
    cast: artist.split(" ")[0],
    links,
    thumbSrc: `https://image-cdn.tver.jp/w=800/images/content/thumbnail/episode/small/${episodeId}.jpg`,
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
  const url = rest.pop() ?? "";
  const videoId = getVideoId(url);
  const links = [{ label: "", url }];

  const subParts = [];
  const castNames = [];
  let endDayRaw = "";

  for (const line of rest) {
    if (!line) continue;

    if (line.startsWith("※")) {
      const info = line.replace(/^※\s*/, "");
      // 期限パターンを探す（「まで」があるもの）
      const m = info.match(/(\d{1,2}\/\d{1,2}(?:\(.\))?(?:\s*\d{1,2}:\d{2})?)\s*まで/);
      if (m && !endDayRaw) endDayRaw = m[0];
      subParts.push(info);

    } else if (line.includes("https://")) {
      // 追加URLはlinksに加える
      links.push({ label: "", url: line });

    } else if (line.includes("：")) {
      // キャスト：キャラクター 形式（複数行）
      //castNames.push(line.split("：")[0].replace(/[\s　]+/g, ""));
		castNames.push(...line.split("\n"));
    } else if (line.includes("、") || line.includes("らが出演")) {
      // 読点区切りキャスト
      castNames.push(...line.split(" ")[0].split("、"));

    } else {
      // その他の情報行
      subParts.push(line);
    }
  }

  const { endOfDay, leftD, expired } = calcEndInfo(endDayRaw || "未記載");

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
    catId: "youtube",
  };
};


// ── レンダリング ──────────────────────────────────────
const renderLinks = (links) => {
  if (links.length === 1)
    return `<a href="${links[0].url}" target="_blank">${links[0].url}</a>`;
  return links.map(({ label, url }) =>
    `<a class="part-link" href="${url}" target="_blank">${label || url}</a>`
  ).join("");
};

// head部分はTVerとYoutubeで構造が違う
const buildHead = (d) => d.type === "youtube"
  ? `<span class="title">${d.title}</span>
     <span class="channel">${d.season}</span>
     <span class="duration">${d.episode}</span>`
  : `<span class="title">${d.title}</span>
     <span class="broadcastYear">${d.year}<span class="season">${d.season}</span></span>
     <span class="episode">${d.episode}</span>`;

const render = (d, p) => {
	let rCast;
	if (Array.isArray(d.cast)) {
		rCast = d.cast.some((c) => c.includes("：")) ? d.cast.join("<br>") : d.cast.join("、");
	} else {
		rCast = d.cast;
	}

  p.innerHTML = `
    <div class="category ${d.catId}">${d.genre}</div>
    <div class="head">${buildHead(d)}</div>
    ${d.endOfDay
      ? `<div class="endOfDay">${d.endOfDay}<span class="leftDay">${d.leftDay}</span></div>`
      : ""}
    <div class="sub">${d.sub}</div>
    <div class="cast">${rCast}</div>
    <div class="thumbnail"></div>
    <div class="link">${renderLinks(d.links)}</div>`;

  if (d.expired) p.classList.add("period");
  document.querySelector(`#${d.catId}`).appendChild(p);
};

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
      const a = Object.assign(document.createElement("a"),
        { href: linkUrl, target: "_blank", title: "リンク" });
      a.appendChild(img);
      thumbEl.appendChild(a);
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

export async function formattingSorting() {

  const cards = [];

  const process = (p, parseFn) => {
    try {
      const d = parseFn(p);
      render(d, p);
      cards.push({
        p,
        thumbSrc: d.thumbSrc,
        fallbackSrc: d.fallbackSrc ?? null,
        linkUrl: d.links[0].url,
      });
    } catch (e) {
      console.error("パースエラー:", e.message, "\n", p.textContent.slice(0, 60));
    }
  };

  document.querySelectorAll(".tver").forEach(p => process(p, parseTver));
  document.querySelectorAll(".yt").forEach(p => process(p, parseYT));

  cards.forEach(({ p, thumbSrc, fallbackSrc, linkUrl }) =>
    loadThumbnail(p, thumbSrc, linkUrl, fallbackSrc)
  );

};
