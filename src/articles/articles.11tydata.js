/*
export default {
 //tags: ["article"],
  // castの各名前をtagsに追加
  eleventyComputed: {
    tags: data => ["article", ...(data.cast ?? [])]
  }
};
*/
console.log("✅ articles.11tydata.js loaded");
export default {
  eleventyComputed: {
    tags: data => {
      const t = Array.isArray(data.tags) ? data.tags : [];
      return t.includes("article") ? t : ["article", ...t];
    }
  }
};
