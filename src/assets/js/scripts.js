//import "/assets/css/style.css";
import "@css/style.css";
import { footnote } from "./module/footnote.js";
import { back2top } from "./module/back2top.js";
import { formattingSorting, getVideoData } from "./module/formatting-sorting.js";
import { buildList, initCastSearch } from "./module/list-builder.js";
import { embbedYoutubePlayer } from "./module/embedYoutubePlayer.js";

document.addEventListener("DOMContentLoaded", async () => {
  back2top();
  embbedYoutubePlayer();

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
    busyman.addEventListener("click", () => {
      const busy = document.querySelector(".busy");
        busy.scrollIntoView({ block: "center" });
    });
  }
});
