import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig({
  plugins: [tailwindcss()],
  root: path.resolve(process.cwd(), "_site"),
  resolve: {
    alias: {
      '/assets/css': path.resolve(process.cwd(), 'src/assets/css'),
      // '/assets/images': path.resolve(process.cwd(), 'src/assets/images'),
    }
  },
  server: {
    host: "localhost",
    port: 5173,
    open: false,
    fs: {
      allow: [
        path.resolve(process.cwd(), 'src'),
        path.resolve(process.cwd(), '_site'),
      ]
    },
    watch: {
      usePolling: true,
      // CSSだけ除外、HTMLなどは_site/の変更を監視
      ignored: ['**/_site/assets/css/**'],
    },
  },
});
