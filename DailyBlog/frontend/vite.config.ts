import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { viteSingleFile } from "vite-plugin-singlefile";
import { fileURLToPath, URL } from "node:url";
import { contentPlugin } from "./scripts/content";
export default defineConfig({
  base: "./",
  plugins: [vue(), contentPlugin(), viteSingleFile()],
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  build: {
    outDir: "dist-vue",
    copyPublicDir: false,
    assetsInlineLimit: 10_000_000,
    cssCodeSplit: false,
  },
  server: { host: "127.0.0.1", port: 3000 },
});
