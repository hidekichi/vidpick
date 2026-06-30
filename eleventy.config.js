import path from "path";
import fs from 'fs-extra';
import { DateTime } from "luxon";
import { HtmlBasePlugin } from "@11ty/eleventy";
import pluginRss from "@11ty/eleventy-plugin-rss";
import pluginNavigation from "@11ty/eleventy-navigation";
import tailwind from "@tailwindcss/vite";
import sitemap from "@quasibit/eleventy-plugin-sitemap";
import Image from '@11ty/eleventy-img';
import EleventyVitePlugin from "@11ty/eleventy-plugin-vite";
import syntaxHighlight from "@11ty/eleventy-plugin-syntaxhighlight";
import markdownIt from "markdown-it";
import rubyPlugin from "markdown-it-ruby";
import attrs from "markdown-it-attrs";
import markdownItMultimdTable from "markdown-it-multimd-table-ext";
import youtubeEmbedPlugin, { markdownItYoutube } from "./src/_plugins/markdown-youtube.js";
import EleventyPassthroughBridge from './src/_plugins/eleventy-passthrough-bridge.js';

const isServe = process.env.ELEVENTY_RUN_MODE === "serve";

export default async function (eleventyConfig) {
  if (isServe) {
    const { runDeadlineCheckOnce } = await import("./scripts/check-deadline.js");
    // ビルドをブロックしないよう非同期で裏走り
    runDeadlineCheckOnce().catch(e =>
      console.error("終了日チェックでエラー:", e.message)
    );
  }

  //ignore
  eleventyConfig.watchIgnores.add("src/assets");

  // passthrough を実コピーにする（Vite の root から見えるようにするため）
  eleventyConfig.setServerPassthroughCopyBehavior("copy");
  eleventyConfig.addPassthroughCopy("public");

  // -----------------------------------------------------------------
  // plugins
  // -----------------------------------------------------------------
  eleventyConfig.addPlugin(HtmlBasePlugin);
  eleventyConfig.addPlugin(pluginNavigation);
  eleventyConfig.addPlugin(sitemap, {
    sitemap: {
      hostname: "https://vidpick.pages.dev",
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
  //eleventyConfig.addPlugin(image);
  // オプションを渡す場合
  // eleventyConfig.addPlugin(youtubeEmbedPlugin, { defaultClass: "video-embed" });
  eleventyConfig.addPlugin(youtubeEmbedPlugin);

  // Vite プラグインは最後に追加
  eleventyConfig.addPlugin(EleventyVitePlugin, {
    tempFolderName: ".11ty-vite",
    serverOptions: {
      module: "@11ty/eleventy-dev-server",
      domDiff: false, // Vite HMR と競合するため無効化推奨
    },
    viteOptions: {
      plugins: [tailwind(
        //{ content: ['./src/**/*.{html,njk,md,js}'],}
      ),
      {
        name: 'serve-src-js',
        configureServer(server) {
          server.middlewares.use(async (req, res, next) => {
            if (req.url?.startsWith('/assets/js/')) {
              const relPath = req.url.split('?')[0].slice('/assets/js/'.length);
              const absPath = path.resolve('./src/assets/js', relPath)
                .replace(/\\/g, '/');
              const fsUrl = '/@fs/' + absPath;
              try {
                const result = await server.transformRequest(fsUrl);
                if (result) {
                  res.setHeader('Content-Type', 'application/javascript');
                  res.setHeader('Cache-Control', 'no-store');
                  res.end(result.code);
                  return;
                }
              } catch (e) {
                console.error('[serve-src-js]', e);
              }
            }
            next();
          });

          server.watcher.add(path.resolve('./src/assets/js'));
          server.watcher.on('change', (file) => {
            if (file.replace(/\\/g, '/').includes('src/assets/js')) {
              server.moduleGraph.invalidateAll();
              server.ws.send({ type: 'full-reload' });
            }
          });
        }
      }
      ],
      //plugins: [tailwind()],
      publicDir: "public",
      clearScreen: false,
      appType: "mpa",
      assetsInclude: ["**/*.xml", "**/*.txt"],
      server: {
        middlewareMode: true,
        fs: {
          allow: ['..'],  // ← 追加
        },
        headers: {
          'Cache-Control': 'no-store', // ← devは常に新鮮なファイルを取得
        },
        watch: {
          ignored: [
            //'**/.11ty-vite/assets/js/**',
            '**/.11ty-vite/assets/images/**',
            '**/.11ty-vite/assets/fonts/**',
            '**/.11ty-vite/*.11ty.js',
            '**/_site/**',
          ]
        }
      },
      build: {
        emptyOutDir: true,
        //manifest: true,
        assetsInlineLimit: 0,
        rollupOptions: {
          output: {
            /*
            // Viteがアセットをbase64でcss化してしまう場合に
            assetFileNames: (assetInfo) => {
              if (assetInfo.name?.endsWith('.css')) {
                return 'assets/css/[name].[hash][extname]';
              }
              if (/\.(png|jpe?g|gif|svg|avif|webp|ico)$/.test(assetInfo.name ?? '')) {
                return 'assets/images/[name].[hash][extname]';
              }
              if (/\.(woff2?|ttf|eot|otf)$/.test(assetInfo.name ?? '')) {
                return 'assets/fonts/[name].[hash][extname]';
              }
              return 'assets/[name].[hash][extname]';
            },
            */
            // assetFileNames: "assets/css/[name].[hash].css",
            //chunkFileNames: "assets/js/[name].[hash].js",
            //entryFileNames: "assets/js/[name].[hash].js",
          },
        },
      },
      resolve: {
        alias: {
          '@css': path.resolve('./src/assets/css'),
          "/node_modules": path.resolve(".", "node_modules"),
        },
      },
    },
  });

  eleventyConfig.addPlugin(EleventyPassthroughBridge, { verbose: true });


  // -----------------------------------------------------------------
  // Passthrough
  // -----------------------------------------------------------------

  eleventyConfig.addPassthroughCopy("src/assets");
  //eleventyConfig.addPassthroughCopy("src/assets/css/style.css");
  eleventyConfig.addPassthroughCopy("src/assets/fonts");
  eleventyConfig.addPassthroughCopy("src/assets/images");
  eleventyConfig.addPassthroughCopy("src/images");
  eleventyConfig.addPassthroughCopy("src/assets/images/favicons");
  eleventyConfig.addPassthroughCopy("src/assets/js");
  //eleventyConfig.addPassthroughCopy("src/assets/css");
  eleventyConfig.addPassthroughCopy("src/_plugins");
  eleventyConfig.addPassthroughCopy("src/public/*.{txt,xsl,jpg,png,svg,json}");

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
    const posts = noDraft(api.getFilteredByGlob("src/posts/**/*.njk")).reverse();

      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

      const old = posts.filter(p => new Date(p.date) < oneMonthAgo);
      if (old.length) {
        console.log("\n⚠️  1ヶ月経過したピックアップページ:");
        old.forEach(p => console.log(`  - ${p.data.title} (${p.date.toISOString().slice(0, 10)})`));
        console.log("");
      }

      return posts;
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
    const posts = collection.getFilteredByTag("vidpick")
      .sort((a, b) => b.date - a.date);
    const articles = collection.getFilteredByTag("article");

    const calcLeft = (expiry) => {
      if (!expiry) return null;

      // DateオブジェクトまたはISO文字列どちらにも対応
      const dateStr = expiry instanceof Date
        ? expiry.toISOString().slice(0, 10)
        : String(expiry).slice(0, 10);

      const [y, m, d] = dateStr.split("-");
      const deadline = new Date(y, m - 1, d, 23, 59, 59);
      const days = Math.ceil((deadline - new Date()) / 864e5);
      return days;
    };

    return posts.map(post => {
      post.relatedArticles = articles
        .filter(art => (art.data.cast ?? []).some(c => (post.data.cast ?? []).includes(c)))
        .map(art => {
          art.daysLeft = calcLeft(art.data.expiry); // ← 直接追加
          return art;
        })
        .filter(art => art.daysLeft === null || art.daysLeft > 0);
      return post;
    });
  });

  // articlesをコレクション
  eleventyConfig.addCollection("article", (api) => {
    return noDraft(api.getFilteredByGlob("src/articles/**/*.md")).reverse();
  });

  eleventyConfig.addCollection("ongoing", (api) => {
    return noDraft(api.getFilteredByTag("ongoing")).reverse();
  });

  // -----------------------------------------------------------------
  // shortcode
  // -----------------------------------------------------------------

  eleventyConfig.addShortcode("image", async function (src, alt, widths = [400, 800, 1200], sizes = "") {
    const inputPath = path.join("src", src);
    //const dirPath = isServe ? "/images/" : "./_site/images/";
    //const oudDirPath = isServe ? "./src/images/" : "./_site/images/";
//.11ty-vite
    return Image(inputPath, {
      widths,
      formats: ["avif", "webp"],
      returnType: "html",
      urlPath: "/images/",
      outputDir: "./src/images/",
      htmlOptions: {
        imgAttributes: {
          alt,
          sizes,
          loading: "lazy",
          decoding: "async",
        }
      }
    });
  });


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
    templateFormats: ["md", "njk", "11ty.js", "html"],
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
