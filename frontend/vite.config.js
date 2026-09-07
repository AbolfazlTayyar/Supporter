/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { visualizer } from "rollup-plugin-visualizer";

// ANALYZE=true npm run build writes frontend/dist/stats.html, a treemap of what
// actually ended up in the production bundle (post tree-shaking/minification).
const analyzeBundle = process.env.ANALYZE === "true";

export default defineConfig({
  plugins: [
    react(),
    analyzeBundle &&
      visualizer({
        filename: "dist/stats.html",
        gzipSize: true,
        brotliSize: true,
        template: "treemap",
      }),
  ].filter(Boolean),
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.js"],
    globals: true,
  },
});
