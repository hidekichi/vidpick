const STATUS = {
  expired:  { order: 2, label: "配信終了" },
  deadline: { order: 0, label: (d) => `あと${d.leftDay}日` },
  unknown:  { order: 1, label: "期限未記載" },
};

const getStatus = (d) =>
  d.expired ? "expired" : d.endOfDay ? "deadline" : "unknown";

const buildItem = (d) => {
  console.log(d.title, "links:", d.links, "thumbLinkUrl:", d.thumbLinkUrl);
  const status = getStatus(d);
  const label  = typeof STATUS[status].label === "function"
    ? STATUS[status].label(d)
    : STATUS[status].label;
  const castStr = d.cast.map(c => c.split("：")[0].trim()).join("、");
  const url = d.thumbLinkUrl ?? d.links[0]?.url ?? "";
  return `<div class="list-item status-${status}" data-cast="${castStr}">
    <span class="list-badge status-${status}">${label}</span>
    <a href="${url}" target="_blank">
      ${d.title}${d.episode ? `　${d.episode}` : ""}
    </a>
  </div>`;
};

export const buildList = (data) => {
  // ステータス順 → 期限あり内は残日数昇順
  const sorted = [...data].sort((a, b) => {
    const sa = getStatus(a), sb = getStatus(b);
    if (sa !== sb) return STATUS[sa].order - STATUS[sb].order;
    if (sa === "deadline") return (a.leftDay || 99) - (b.leftDay || 99);
    return 0;
  });

  // catId別に振り分けてレンダリング
  sorted.forEach(d => {
    document.querySelector(`.list.${d.catId}`)
      ?.insertAdjacentHTML("beforeend", buildItem(d));
  });
};

// キャスト検索
export const initCastSearch = () => {
  document.querySelector("#cast-search")
    ?.addEventListener("input", ({ target }) => {
      const q = target.value.trim();
      document.querySelectorAll(".list-item").forEach(el => {
        el.hidden = q !== "" && !el.dataset.cast.includes(q);
      });
    });
};
