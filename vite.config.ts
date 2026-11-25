import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const nvidiaProxy = {
  "/api/nvidia": {
    target: "https://integrate.api.nvidia.com/v1",
    changeOrigin: true,
    rewrite: (path: string) => path.replace(/^\/api\/nvidia/, "")
  }
};

export default defineConfig({
  plugins: [react()],
  server: { proxy: nvidiaProxy },
  preview: { proxy: nvidiaProxy }
});
