//import "/assets/css/style.css";
import "@css/style.css";
import { footnote } from "./module/footnote.js";
import { back2top, initPhysicalScrollWatcher } from "./module/back2top.js";
import { formattingSorting, getVideoData } from "./module/formatting-sorting.js";
import { buildList, initCastSearch } from "./module/list-builder.js";
import { embbedYoutubePlayer } from "./module/embedYoutubePlayer.js";
import { insertLoadlazy, externalLink, clearButton } from "./module/utils.js";
import { initTooltip } from "./module/tooltip.js";
import { initIndexCastSearch } from "./module/list-builder.js";
// import { set_isFeatured } from "./module/isFeaturedDiv.js";

const layout = document.querySelector(".layout");

document.addEventListener("DOMContentLoaded", async () => {
  back2top();
  initIndexCastSearch();
  //scrollDirection();
  embbedYoutubePlayer();

  if (document.querySelector(".cast-search")) {
    clearButton();
  }

  const target = document.querySelector('.back-to-top-text');
  initPhysicalScrollWatcher();

  window.addEventListener('scroll-state-change', (e) => {
    const { state } = e.detail;

    if (state === 'up') {
      // ① 上向きスクロールなら（速度に関係なく）即座にボタンを表示！
      target.classList.add('up');
    }
    else if (state === 'down' || state === 'top') {
      // ② 下向きスクロール、または「最上部100pxエリア」に入ったら即座に非表示（初期化）！
      target.classList.remove('up');
    }
    // ③ state === 'stop' の時は「あえて何もしない」のが正解！
    // これにより、上向きスクロールで出現したボタンは、指を離して静止しても消えずに残り、
    // ユーザーが「戻るボタンを押す」という目的を確実に達成できます。
  });

  if (window.location.pathname.includes('/articles/')) {
    insertLoadlazy();
    externalLink();
  }

  if (document.querySelector(".reading-main")) {
    await footnote();
    initTooltip();
  }

  if (document.querySelector(".clear-btn")) {
    initTooltip();
  }

  if (layout) {
    formattingSorting();
    buildList(getVideoData());
    initCastSearch();

    //const busyman = document.querySelector(".busyman");

    const busyman = document.querySelector(".busyman");

    if (busyman) {
      busyman.addEventListener("click", () => {
        const busy = document.querySelector(".busy");
        busy.scrollIntoView();
      });
    }
  }
});

const mediaQuery = window.matchMedia("(min-width: 768px)");

const loadIsFeatured = async () => {
  if (!layout || !mediaQuery.matches) return;

  const { set_isFeatured } = await import("./module/isFeaturedDiv.js");

  set_isFeatured();
};

window.addEventListener("load", loadIsFeatured);
mediaQuery.addEventListener("change", loadIsFeatured);

// サムネイルカードが入る親要素
const container = document.getElementById('genre-menu');

if (container) {
  const observer = new MutationObserver((mutations, obs) => {
    // 親要素の中に対象の a タグが読み込まれたか探す
    const anchors = container.querySelectorAll('li');

    if (anchors.length > 0) {
      initTooltip();

      obs.disconnect();
    }
  });

  observer.observe(container, { childList: true });
}
