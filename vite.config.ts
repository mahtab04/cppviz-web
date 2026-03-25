import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  // For GitHub Pages: set to your repo name (e.g. '/cppviz-web/')
  // For custom domain or Vercel/Netlify: use '/'
  base: process.env.GITHUB_ACTIONS ? "/cppviz-web/" : "/",
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
  },
});
