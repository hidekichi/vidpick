// src/posts-index.json.11ty.js
export const data = {
  permalink: "/posts-index.json",
  eleventyExcludeFromCollections: true,
};

export function render({ collections }) {
  const items = collections.postsWithArticles.map(post => ({
    title: post.data.title,
    url:   post.url,
    date:  post.date,
    cast:  post.data.cast ?? [],
  }));
  return JSON.stringify(items);
}
