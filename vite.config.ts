import path from "node:path";
import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

// Собираем расширение для Owlbear Rodeo:
//  - index.html      → приложение расширения (popover мастера / полноэкранный показ)
//  - background.html → фоновый iframe (контекстное меню + синхронизация показа)
export default defineConfig({
  base: "./",
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(rootDir, "src"),
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    target: "es2020",
    rollupOptions: {
      input: {
        app: path.resolve(rootDir, "index.html"),
        background: path.resolve(rootDir, "background.html"),
      },
    },
  },
  server: {
    host: true,
    allowedHosts: true,
  },
});
