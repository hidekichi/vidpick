//import "/assets/css/main.css";
import "@css/style.css";
import { footnote } from "./module/footnote.js";
import { back2top } from "./module/back2top.js";
import { formattingSorting } from "./module/formatting-sorting.js";

document.addEventListener("DOMContentLoaded", async () => {
  back2top();


const layout = document.querySelector(".layout");

  if (document.querySelector(".body-copy")) {
    await footnote();
  }

  if (layout) {
    await formattingSorting();
  }
});
