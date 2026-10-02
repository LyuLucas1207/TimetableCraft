import path from "node:path";
import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

const root = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, root, "");
  const port = Number(env.VITE_PORT) || 10404;
  return {
    plugins: [react(), tailwindcss()],
    base: "/",
    resolve: {
      alias: {
        "@": path.resolve(root, "./src"),
      },
    },
    server: {
      port,
      host: "0.0.0.0",
      open: true,
    },
    build: {
      outDir: "dist",
      sourcemap: true,
    },
    preview: {
      port,
      host: "0.0.0.0",
    },
  };
});
