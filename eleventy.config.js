import path from "path";
import { fileURLToPath } from "url";
//import fs from 'fs-extra';
import { DateTime } from "luxon";
import { HtmlBasePlugin } from "@11ty/eleventy";
import pluginRss from "@11ty/eleventy-plugin-rss";
import pluginNavigation from "@11ty/eleventy-navigation";
import tailwindcss from "@tailwindcss/vite";
import sitemap from "@quasibit/eleventy-plugin-sitemap";
import Image from "@11ty/eleventy-img";
import EleventyVitePlugin from "@11ty/eleventy-plugin-vite";
import syntaxHighlight from "@11ty/eleventy-plugin-syntaxhighlight";
import markdownIt from "markdown-it";
import rubyPlugin from "markdown-it-ruby";
import attrs from "markdown-it-attrs";
import markdownItMultimdTable from "markdown-it-multimd-table-ext";
import youtubeEmbedPlugin, { markdownItYoutube } from "./src/_plugins/markdown-youtube.js";
//import EleventyPassthroughBridge from './src/_plugins/eleventy-passthrough-bridge.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const isServe = process.env.ELEVENTY_RUN_MODE === "serve";

export default function (eleventyConfig) {
  //ignore
  //eleventyConfig.watchIgnores.add("src/assets");

  // passthrough を実コピーにする（Vite の root から見えるようにするため）
  //eleventyConfig.setServerPassthroughCopyBehavior("copy");
  //eleventyConfig.addPassthroughCopy("public");

  // -----------------------------------------------------------------
  // plugins
  // -----------------------------------------------------------------
  eleventyConfig.addPlugin(HtmlBasePlugin);
  eleventyConfig.addPlugin(pluginNavigation);
  eleventyConfig.addPlugin(sitemap, {
    sitemap: {
      hostname: "https://vidpick.pages.dev/",
    },
  });
  eleventyConfig.addPlugin(pluginRss);
  eleventyConfig.addPlugin(syntaxHighlight, {
    lineSeparator: "\n",
    templateFormats: ["*"],
    preAttributes: {
      tabindex: 0,
      "data-language": function ({ language }) {
        return language;
      },
    },
    errorOnInvalidLanguage: false,
  });

  // オプションを渡す場合
  // eleventyConfig.addPlugin(youtubeEmbedPlugin, { defaultClass: "video-embed" });
  eleventyConfig.addPlugin(youtubeEmbedPlugin);

  // Vite プラグインは最後に追加
  eleventyConfig.addPlugin(EleventyVitePlugin, {
      tempFolderName: ".11ty-vite",

      // Dev Server 設定
      serverOptions: {
        module: "@11ty/eleventy-dev-server",
        domDiff: false,
      },

      // Vite 設定（デフォルトとディープマージされる）
      viteOptions: {
        clearScreen: false,
        appType: "mpa",

        plugins: [
          tailwindcss(),
          // パススルーファイルをビルド後に保護するプラグイン
          preservePassthroughFiles([
            "CNAME",
            "robots.txt",
            "favicon.ico",
          ]),
        ],

        server: {
          middlewareMode: true,
        },

        build: {
          emptyOutDir: true,
          // Rollup の入力エントリポイントを明示
          // HTML は自動注入されるので JS/CSS だけ書く
          rollupOptions: {
            input: {
              main: path.resolve(__dirname, "src/assets/js/scripts.js"),
            },
          },
          // ソースマップ（デプロイ時はオフ推奨）
          sourcemap: false,
        },

        resolve: {
          alias: {
            "/node_modules": path.resolve(".", "node_modules"),
          },
        },
      },
    });


  // ────────────────────────────────────────────
  // パススルーファイル保護プラグイン
  // Vite の emptyOutDir:true が _site をクリアした後に
  // 11ty がパススルーコピーしたファイルを復元する
  // ────────────────────────────────────────────
  function preservePassthroughFiles(files) {
    let outDir;

    return {
      name: "preserve-eleventy-passthrough",
      apply: "build",                // ビルド時のみ動作
      configResolved(config) {
        outDir = config.build.outDir;
      },
      async closeBundle() {
        const { promises: fs } = await import("fs");
        const path = await import("path");

        for (const file of files) {
          // .11ty-vite/ (Vite の root) にあるファイルを _site/ に復元
          const src = path.resolve(outDir, "..", file);
          const dest = path.resolve(outDir, file);
          try {
            await fs.copyFile(src, dest);
            console.log(`[passthrough] restored: ${file}`);
          } catch {
            // ファイルが存在しない場合はスキップ
          }
        }
      },
    };
  }

  //eleventyConfig.addPlugin(EleventyPassthroughBridge, { verbose: true });


  // -----------------------------------------------------------------
  // Passthrough
  // -----------------------------------------------------------------

  eleventyConfig.addPassthroughCopy("src/assets");
  //eleventyConfig.addPassthroughCopy("src/assets/css/style.css");
  eleventyConfig.addPassthroughCopy("src/assets/fonts");
  eleventyConfig.addPassthroughCopy("src/assets/images");
  eleventyConfig.addPassthroughCopy("src/assets/images/favicons");
  eleventyConfig.addPassthroughCopy("src/assets/js");
  //eleventyConfig.addPassthroughCopy("src/assets/css");
  eleventyConfig.addPassthroughCopy("src/_plugins");
  eleventyConfig.addPassthroughCopy("src/public/*.{txt,xsl,jpg,png,svg}");
  //eleventyConfig.addPassthroughCopy({ "src/public/**/*.css": "/assets/css" });

  // -----------------------------------------------------------------
  // filter
  // -----------------------------------------------------------------

  eleventyConfig.addFilter("shortDateString", (dateObj) => {
    return DateTime.fromJSDate(dateObj, { zone: "utc" }).toFormat("yyyy-LL-dd");
  });

  eleventyConfig.addFilter("getNewestUpdateDate", function (collection) {
    if (!collection || collection.length === 0) return null;
    return collection
      .map((item) => item.data.update || item.date)
      .sort((a, b) => new Date(b) - new Date(a))[0];
  });

  eleventyConfig.addFilter("excerpt", (post) => {
    if (!post) return "";
    return post
      .replace(/(<([^>]+)>)/gi, "")
      .replace(/&nbsp/gi, "&#160;")
      .split(" ")
      .slice(0, 5)
      .join(" ");
  });

  // 1. 日付を「2024年1月1日」形式に
  eleventyConfig.addFilter("dateJP", (date) => {
    const d = new Date(date);
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
  });

  // 2. 日付をISO形式に（<time datetime=""> 用）

  eleventyConfig.addFilter("dateISO", (date) => {
    return new Date(date).toISOString().split("T")[0];
  });

  // 3. 件数を制限する（トップページの最新3件など）
  eleventyConfig.addFilter("limit", (array, n) => {
    return array.slice(0, n);
  });

  // 4. タグからpostsを除外（タグ一覧表示用）
    eleventyConfig.addFilter("excludeTag", (tags, exclude) => {
      return (tags || []).filter((tag) => tag !== exclude);
    });

  eleventyConfig.addFilter("sortByTagMatch", (posts, currentTags, currentUrl) => {
    if (!currentTags || currentTags.length === 0) return [];
    return [...posts]
      .filter((post) => post.url !== currentUrl)
      .map((post) => {
        const postTags = post.data.tags || [];
        const matchCount = postTags.filter((tag) => currentTags.includes(tag)).length;
        return { post, matchCount };
      })
      .filter((item) => item.matchCount > 0)
      .sort((a, b) => b.matchCount - a.matchCount)
      .map((item) => item.post);
  });

  eleventyConfig.addNunjucksFilter("readableDate", (dateObj) => {
    const date = new Date(dateObj);
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
  });

  //eleventyConfig.addFilter("dateToRfc3339", pluginRss.dateToRfc3339);

  // -----------------------------------------------------------------
  // collections
  // -----------------------------------------------------------------

  // eleventyConfig.addCollection("blog", (api) =>
  //   api.getFilteredByGlob("src/blog/**/*.md").reverse()
  // );

  // ドラフト記事を除外する関数
  // isServeの設定必須
  // const isServe = process.env.ELEVENTY_RUN_MODE === "serve";
  const noDraft = (items) => {
    return isServe ? [...items] : items.filter(item => !item.data.draft);
  };

  eleventyConfig.addCollection("posts", (api) => {
    return noDraft(api.getFilteredByGlob("src/posts/**/*.njk")).reverse();
  });

  eleventyConfig.addCollection("allTags", (api) => {
    return [
      ...new Set(
        noDraft(api.getAll()).flatMap((item) => item.data.tags || [])
      )
    ].sort();
  });

  eleventyConfig.addCollection("categoryTags", (api) => {
    let categoryTags = {};
    noDraft(api.getAll()).forEach((post) => {
      let category = post.filePathStem.split("/")[1];
      let tags = post.data.tags || [];
      if (!categoryTags[category]) categoryTags[category] = {};
      tags.forEach((tag) => {
        categoryTags[category][tag] = (categoryTags[category][tag] || 0) + 1;
      });
    });
    return categoryTags;
  });

  eleventyConfig.addCollection("postsSortedByUpdate", (api) => {
    const rawPosts = api.getFilteredByGlob("src/blog/*.md");
    let posts = noDraft(rawPosts);

    const normalizeDate = (val) => {
      if (!val) return "0000-00-00";
      const d = new Date(val);
      return isNaN(d.getTime()) ? "0000-00-00" : d.toISOString().slice(0, 10);
    };

    return posts.sort((a, b) => {
      const dateA = normalizeDate(a.data.update || a.data.updated || a.data.lastmod || a.data.date);
      const dateB = normalizeDate(b.data.update || b.data.updated || b.data.lastmod || b.data.date);
      return dateB.localeCompare(dateA);
    });
  });

  eleventyConfig.addCollection("postsWithArticles", (collection) => {
    const posts    = collection.getFilteredByTag("vidpick")
                               .sort((a, b) => b.date - a.date);
    const articles = collection.getFilteredByTag("article");

    return posts.map(post => {
      const postCast = post.data.cast ?? [];
          post.relatedArticles = articles.filter(art => {
            const artCast = art.data.cast ?? [];
            return artCast.some(c => postCast.includes(c));
          });
          return post;
    });
  });

  // articlesをコレクション
  eleventyConfig.addCollection("article", (api) => {
     return noDraft(api.getFilteredByGlob("src/articles/**/*.md")).reverse();
   });

  // -----------------------------------------------------------------
  // shortcode
  // -----------------------------------------------------------------

  eleventyConfig.addNunjucksAsyncShortcode(
    "image",
    async (src, alt, sizes = "100vw") => {

      let metadata = await Image(src, {

        widths: [400, 800, 1200],
        formats: ["avif", "webp", "jpeg"],

        outputDir: "_site/assets/images/",
        urlPath: "/images/"
      })

      let imageAttributes = {
        alt,
        sizes,
        loading: "lazy",
        decoding: "async"
      }

      return Image.generateHTML(metadata, imageAttributes)
    }
  )

  // -----------------------------------------------------------------
  // Markdown Library
  // -----------------------------------------------------------------
  const mdLib = markdownIt({
    html: true,
    xhtmlOut: true,
    breaks: true,
    linkify: true,
    typographer: true,
  })
    .use(rubyPlugin, { rp: ["(", ")"] })
    .use(markdownItYoutube, { defaultClass: "ytp", separator: "::" })
    .use(attrs, { selectorExceptions: ["table", "table tbody", "tbody"] })
    .use(markdownItMultimdTable, {
      multiline: true,
      rowspan: true,
      headerless: false,
      Multibody: true,
    });

  mdLib.renderer.rules.softbreak = () => '<cr></cr>';
  mdLib.renderer.rules.hardbreak = () => '<cr></cr>';

  eleventyConfig.setLibrary("md", mdLib);

  return {
    templateFormats: ["md", "njk", "html"],
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",

    dir: {
      input: "src",
      output: "_site",
      includes: "_includes",
      layouts: "_includes/layouts"
    }
  };
}
