import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";
import { RECRUITER_ROUTES } from "./src/server/routes";

const previewDirectoryRoutes = new Set([
  ...RECRUITER_ROUTES
    .filter((route) => route.output.endsWith("/index.html"))
    .map((route) => route.path),
  "/ascii",
  "/game"
]);

function servePrerenderedPreviewRoutes(): Plugin {
  return {
    name: "serve-prerendered-preview-routes",
    configurePreviewServer(server) {
      server.middlewares.use((request, _response, next) => {
        if (!request.url) return next();
        const [pathname, query] = request.url.split("?", 2);
        if (previewDirectoryRoutes.has(pathname)) {
          request.url = `${pathname}/${query ? `?${query}` : ""}`;
        }
        next();
      });
    }
  };
}

export default defineConfig({
  plugins: [react(), servePrerenderedPreviewRoutes()],
  build: {
    manifest: true,
    target: "es2022",
    sourcemap: true,
    chunkSizeWarningLimit: 1200
  },
  server: {
    host: "127.0.0.1",
    port: 4173
  },
  preview: {
    host: "127.0.0.1",
    port: 4173
  }
});
