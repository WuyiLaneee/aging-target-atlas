import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
const repo = process.env.GITHUB_REPOSITORY?.split("/")[1];
const base =
  process.env.VITE_BASE_PATH ||
  (repo && !repo.endsWith(".github.io") ? `/${repo}/` : "/");
export default defineConfig({
  plugins: [react()],
  base,
  server: {
    watch: {
      ignored: ["**/output/**", "**/research/raw/**", "**/.playwright-cli/**"],
    },
  },
  build: { chunkSizeWarningLimit: 700 },
});
