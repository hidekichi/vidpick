//import path from "path";
import { DateTime } from "luxon";
import vitePlugin from "@11ty/eleventy-plugin-vite";
//import tailwind from "@tailwindcss/vite";
// import  Critters  from 'critters';
import pluginRss from "@11ty/eleventy-plugin-rss";
import pluginNavigation from "@11ty/eleventy-navigation";
import { HtmlBasePlugin } from "@11ty/eleventy";
import sitemap from "@quasibit/eleventy-plugin-sitemap";
import Image from "@11ty/eleventy-img";
import syntaxHighlight from "@11ty/eleventy-plugin-syntaxhighlight";
import markdownIt from "markdown-it";
import rubyPlugin from "markdown-it-ruby";
import attrs from "markdown-it-attrs";
import markdownItMultimdTable from "markdown-it-multimd-table-ext";
import youtubeEmbedPlugin, { markdownItYoutube } from "./src/_plugins/markdown-youtube.js";

export default function (eleventyConfig) {

  eleventyConfig.addPassthroughCopy("public");
  eleventyConfig.watchIgnores.add("src/assets/css/style.css");

  // -----------------------------------------------------------------
  // plugins
  // -----------------------------------------------------------------
  eleventyConfig.addPlugin(HtmlBasePlugin);
  eleventyConfig.addPlugin(pluginNavigation);
  eleventyConfig.addPlugin(sitemap, {
    sitemap: {
      hostname: "https://blazechariot.netlify.app",
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

  const isServe = process.env.ELEVENTY_RUN_MODE === "serve";

  eleventyConfig.addPlugin(youtubeEmbedPlugin);
  // オプションを渡す場合
  // eleventyConfig.addPlugin(youtubeEmbedPlugin, { defaultClass: "video-embed" });

  if (isServe) {
    eleventyConfig.setServerPassthroughCopyBehavior("copy");
    eleventyConfig.watchIgnores.add(".11ty-vite/**");
    //eleventyConfig.setServerOptions({
    //  domDiff: false,  // ← これがキー
    //});

    eleventyConfig.addPlugin(vitePlugin, {
      serverOptions: {
        domDiff: false,
      },
      viteOptions: {
        publicDir: "public",
        assetsInclude: ["**/*.xml", "**/*.txt"],
        server: {
          mode: "development",
          middlewareMode: true,
          hmr: { overlay: true },
            watch: {
              // パススルーコピーされるJSはViteの監視対象から除外

              ignored: [
                "**/assets/js/*.js",
                "**/assets/js/**/*.js",
            //"**/assets/css/style.css",
              ],
            },
          },
        build: {
          emptyOutDir: true,
          /*
          manifest: true,
          rollupOptions: {
            output: {
              assetFileNames: "assets/css/[name].[hash].css",
              chunkFileNames: "assets/js/[name].[hash].js",
              entryFileNames: "assets/js/[name].[hash].js",
            },
          },
            */
        },
      },
    });
  }

    // -----------------------------------------------------------------
  // Passthrough
  // -----------------------------------------------------------------

  //eleventyConfig.addPassthroughCopy("src/assets");
  eleventyConfig.addPassthroughCopy("src/assets/css/style.css");
  eleventyConfig.addPassthroughCopy("src/assets/fonts");
  eleventyConfig.addPassthroughCopy("src/assets/images");
  eleventyConfig.addPassthroughCopy("src/assets/js");
  eleventyConfig.addPassthroughCopy("src/_plugins");
  eleventyConfig.addPassthroughCopy("src/blog/img");
  eleventyConfig.addPassthroughCopy("src/guitar/img");
  eleventyConfig.addPassthroughCopy("src/guitar/sound/**/*.ogg");
  eleventyConfig.addPassthroughCopy("src/*.{txt,xsl,jpg}");
  //eleventyConfig.addPassthroughCopy({ "src/public/**/*.css": "/assets/css" });

  /*
  eleventyConfig.addPassthroughCopy({
    "src/images": "images"
  })
  */

  // -----------------------------------------------------------------
  // ignore
  // -----------------------------------------------------------------

  eleventyConfig.ignores.add("src/pretty-atom-feed.xsl");


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

  eleventyConfig.addFilter("dateToRfc3339", pluginRss.dateToRfc3339);


  // -----------------------------------------------------------------
  // collections
  // -----------------------------------------------------------------

  // eleventyConfig.addCollection("blog", (api) =>
  //   api.getFilteredByGlob("src/blog/**/*.md").reverse()
  // );

const noDraft = (items) => {
  return isServe ? [...items] : items.filter(item => !item.data.draft);
};

eleventyConfig.addCollection("posts", (api) => {
  return noDraft(api.getFilteredByGlob("src/posts/**/*.njk")).reverse();
});

  eleventyConfig.addCollection("latestPosts", (api) => {
    return noDraft(api.getFilteredByGlob("src/**/*.[md,njk]")).sort((a, b) => b.date - a.date);
  });

  eleventyConfig.addCollection("allTags", function (collectionApi) {
    const allTags = new Set();
    collectionApi.getAll().forEach((item) => {
      if (item.data.tags) {
        item.data.tags.forEach((tag) => allTags.add(tag));
      }
    });
    return Array.from(allTags).sort();
  });

  eleventyConfig.addCollection("categoryTags", function (collectionApi) {
    let categoryTags = {};
    collectionApi.getAll().forEach((post) => {
      let category = post.filePathStem.split("/")[1];
      let tags = post.data.tags || [];
      if (!categoryTags[category]) categoryTags[category] = {};
      tags.forEach((tag) => {
        categoryTags[category][tag] = (categoryTags[category][tag] || 0) + 1;
      });
    });
    return categoryTags;
  });

  // -----------------------------------------------------------------
  // shortcord
  // -----------------------------------------------------------------

  eleventyConfig.addNunjucksAsyncShortcode(
    "image",
    async (src, alt, sizes = "100vw") => {

      let metadata = await Image(src, {

        widths: [400, 800, 1200],
        formats: ["avif", "webp", "jpeg"],

        outputDir: "_site/images/",
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
    }

  }
