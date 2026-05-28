// -----------------------------------------------------------------
// YouTube埋め込み用 11ty 公式プラグイン
//
// 使い方（Markdownファイル内）:
//   { ytp :: VIDEO_ID :: タイトル }
//   { ytp aspect-wide :: VIDEO_ID :: タイトル }
//   { ytp :: VIDEO_ID }   ← タイトルなし
//
// eleventy.config.js での読み込み:
//   import youtubeEmbedPlugin from "./_plugins/markdown-youtube.js";
//
//   export default function (eleventyConfig) {
//     // オプションなし
//     eleventyConfig.addPlugin(youtubeEmbedPlugin);
//
//     // オプションあり
//     eleventyConfig.addPlugin(youtubeEmbedPlugin, {
//       defaultClass: "video-embed",
//     });
//   };
// -----------------------------------------------------------------

/** 正規表現のメタ文字をエスケープするユーティリティ */
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * markdown-it に渡すブロックルール＋レンダラーを登録する内部関数
 *
 * @param {import("markdown-it")} md
 * @param {object} options
 * @param {string} options.defaultClass
 * @param {string} options.separator
 */
function markdownItYoutube(md, { defaultClass, separator }) {
  const BLOCK_RE = new RegExp(
    `^\\{\\s*(ytp(?:\\s+[a-zA-Z0-9\\-]+)*)${escapeRegex(separator)}(.+?)\\}$`
  );

  md.block.ruler.before(
    "paragraph",
    "ytp_block",
    function ytpBlock(state, startLine, _endLine, silent) {
      const pos  = state.bMarks[startLine] + state.tShift[startLine];
      const line = state.src.slice(pos, state.eMarks[startLine]).trim();

      const match = line.match(BLOCK_RE);
      if (!match) return false;

      const fullClasses = match[1].trim();
      const rest        = match[2];
      const sepIdx      = rest.lastIndexOf(separator);
      const address     = sepIdx !== -1 ? rest.slice(0, sepIdx).trim() : rest.trim();
      const title       = sepIdx !== -1 ? rest.slice(sepIdx + separator.length).trim() : "";

      if (!address) return false;

      if (!silent) {
        const token   = state.push("ytp_block", "", 0);
        token.content = address;
        token.meta    = { title, classes: fullClasses };
        state.line    = startLine + 1;
      }
      return true;
    },
    { alt: ["paragraph", "blockquote"] }
  );

  md.renderer.rules["ytp_block"] = function (tokens, idx) {
    const { content, meta } = tokens[idx];
    const address   = md.utils.escapeHtml(content);
    const title     = md.utils.escapeHtml(meta.title);
    const classes   = md.utils.escapeHtml(meta.classes || defaultClass);
    const titleAttr = title ? ` data-title="${title}"` : "";
    return `<div class="${classes}"${titleAttr}>${address}</div>\n`;
  };
}

// -----------------------------------------------------------------
// 11ty 公式プラグインエントリーポイント
// eleventyConfig.addPlugin(youtubeEmbedPlugin, options?) で呼ばれる
// -----------------------------------------------------------------

/**
 * @param {import("@11ty/eleventy").UserConfig} eleventyConfig
 * @param {object}  [options]
 * @param {string}  [options.defaultClass="ytp"]  divのクラス名デフォルト値
 * @param {string}  [options.separator="::"]      フィールド区切り文字
 */
export { markdownItYoutube };
export default function youtubeEmbedPlugin(eleventyConfig, options = {}) {
  const { defaultClass = "ytp", separator = "::" } = options;

  eleventyConfig.amendLibrary("md", (md) =>
    md.use(markdownItYoutube, { defaultClass, separator })
  );
}
