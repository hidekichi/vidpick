//console.log("✅ posts.11tydata.js loaded");
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { extractCast } from "../../_utils/cast-extractor.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
  // ── 全postsページの共通設定 ──────────────────────
  //layout: "post.njk",
  tags:   ["vidpick"],

  // ── ビルド時にcastを自動生成 ──────────────────────
  eleventyComputed: {
    cast: (data) => {
      if (!data.page?.inputPath) return [];
      try {
        const content = fs.readFileSync(data.page.inputPath, "utf-8");
        return extractCast(content);
      } catch (e) {
        console.warn(`[cast抽出スキップ] ${data.page.inputPath}: ${e.message}`);
        return [];
      }
    }
  }
};
