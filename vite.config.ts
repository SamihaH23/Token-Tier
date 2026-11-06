/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [react()],
  // GitHub Pages serves the site from /<repo>/; dev server stays at /.
  base: command === "build" ? "/Token-Tier/" : "/",
  build: {
    // The o200k tokenizer table (~2.3MB) is its own lazy-loaded chunk.
    chunkSizeWarningLimit: 2400,
  },
  server: {
    port: 3001,
    open: false,
  },
  test: {
    environment: "node",
  },
}));
