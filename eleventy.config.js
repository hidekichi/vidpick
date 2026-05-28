import { DateTime } from "luxon";
import EleventyVitePlugin from "@11ty/eleventy-plugin-vite";
import tailwind from "@tailwindcss/vite";
import pluginRss from "@11ty/eleventy-plugin-rss";
import pluginNavigation from "@11ty/eleventy-navigation";
import sitemap from "@quasibit/eleventy-plugin-sitemap";
import Image from "@11ty/eleventy-img";
import syntaxHighlight from "@11ty/eleventy-plugin-syntaxhighlight";
import { HtmlBasePlugin } from "@11ty/eleventy";
import markdownIt from "markdown-it";
import rubyPlugin from "markdown-it-ruby";
import attrs from "markdown-it-attrs";
import markdownItMultimdTable from "markdown-it-multimd-table-ext";
import youtubeEmbedPlugin, { markdownItYoutube } from "./src/_plugins/markdown-youtube.js";

const isServe = process.env.ELEVENTY_RUN_MODE === "serve";

export default function (eleventyConfig) {

  eleventyConfig.addPassthroughCopy("public");

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

  eleventyConfig.addPlugin(youtubeEmbedPlugin);
  // オプションを渡す場合
  // eleventyConfig.addPlugin(youtubeEmbedPlugin, { defaultClass: "video-embed" });

  if (isServe) {
      eleventyConfig.watchIgnores.add(".11ty-vite/**"); //おまじない的な意味で
      eleventyConfig.setServerPassthroughCopyBehavior("copy");

      eleventyConfig.addPlugin(EleventyVitePlugin, {
        serverOptions: {
          domDiff: false,
        },
        viteOptions: {
          publicDir: "public",
          assetsInclude: ["**/*.xml", "**/*.xsl", "**/*.txt"],
          build: {},
        },
      });
    }

  // -----------------------------------------------------------------
  // Passthrough
  // -----------------------------------------------------------------

  eleventyConfig.addPassthroughCopy("src/assets");
  eleventyConfig.addPassthroughCopy("src/_plugins");
  eleventyConfig.addPassthroughCopy("src/blog/img");
  eleventyConfig.addPassthroughCopy("src/guitar/img");
  eleventyConfig.addPassthroughCopy("src/*.{txt,xml,xsl}");

  /*
  eleventyConfig.addPassthroughCopy({
    "src/images": "images"
  })
  */

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

  eleventyConfig.addFilter("excludeTag", (tags, exclude) => {
      return (tags || []).filter((tag) => tag !== exclude);
    });

  eleventyConfig.addNunjucksFilter("readableDate", (dateObj) => {
    const date = new Date(dateObj);
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
  });

  eleventyConfig.addFilter("dateToRfc3339", pluginRss.dateToRfc3339);

  eleventyConfig.addFilter("blogImage", function (filePath) {
    if (!filePath) return "";
    const filename = filePath.split("/").pop();
    return `/blog/img/${filename}`;
  });

  // -----------------------------------------------------------------
  // collections
  // -----------------------------------------------------------------

  eleventyConfig.addCollection("blog", (api) =>
    api.getFilteredByGlob("src/blog/**/*.md").reverse()
  );
  eleventyConfig.addCollection("guitar", (api) =>
    api.getFilteredByGlob("src/guitar/**/*.md")
  );
  eleventyConfig.addCollection("guitarAll", (api) =>
    api.getFilteredByGlob("src/guitar/**/*.md")
  );
  eleventyConfig.addCollection("latestPosts", (api) => {
    return api.getFilteredByGlob("src/**/*.md").sort((a, b) => b.date - a.date);
  });
  eleventyConfig.addCollection("allPosts", (api) =>
    api.getFilteredByGlob("src/**/*.md")
  );
  eleventyConfig.addCollection("posts", (api) => {
    return api.getFilteredByGlob("src/blog/*.md").sort((a, b) => b.date - a.date);
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
  eleventyConfig.addCollection("postsSortedByUpdate", (api) => {
    const normalizeDate = (val) => {
      if (!val) return "0000-00-00";
      const d = new Date(val);
      return isNaN(d.getTime()) ? "0000-00-00" : d.toISOString().slice(0, 10);
    };
    return api.getFilteredByGlob("src/blog/*.md").sort((a, b) => {
      const dateA = normalizeDate(a.data.update || a.data.updated || a.data.lastmod || a.data.date);
      const dateB = normalizeDate(b.data.update || b.data.updated || b.data.lastmod || b.data.date);
      return dateB.localeCompare(dateA);
    });
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
