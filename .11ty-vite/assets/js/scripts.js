console.log("test4");
//import "/assets/css/style.css";
import "@css/style.css";
import { footnote } from "./module/footnote.js";
//import { back2top, scrollDirection } from "./module/back2top.js";
import { back2top, initPhysicalScrollWatcher } from "./module/back2top.js";
import { formattingSorting, getVideoData } from "./module/formatting-sorting.js";
import { buildList, initCastSearch } from "./module/list-builder.js";
import { embbedYoutubePlayer } from "./module/embedYoutubePlayer.js";

document.addEventListener("DOMContentLoaded", async () => {
  back2top();
  //scrollDirection();
  embbedYoutubePlayer();

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

const layout = document.querySelector(".layout");

  if (document.querySelector(".reading-main")) {
    await footnote();
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
