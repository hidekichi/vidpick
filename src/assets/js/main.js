import "/assets/css/main.css";
import { footnote } from "./module/footnote.js";
import { formattingSorting } from "./module/formatting-sorting.js";

document.addEventListener("DOMContentLoaded", async () => {
const layout = document.querySelector(".layout");

  if (document.querySelector(".body-copy")) {
    await footnote();
  }

  if (layout) {
    await formattingSorting();
  }
});
