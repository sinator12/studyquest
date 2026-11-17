// Pure Node.js HTTP Server for StudyQuest (No Vite or external dependencies needed)
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 5173;
const DIST_DIR = path.join(__dirname, "dist");

// MIME types for web assets
const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".mjs": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".eot": "application/vnd.ms-fontobject",
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".mp4": "video/mp4"
};

const server = http.createServer((req, res) => {
  const rawUrl = req.url || "/";
  const cleanPath = decodeURI(rawUrl.split("?")[0]);
  let filePath = path.join(DIST_DIR, cleanPath);

  // Security check: prevent directory traversal
  if (!filePath.startsWith(DIST_DIR)) {
    res.writeHead(403, { "Content-Type": "text/plain" });
    res.end("Forbidden");
    return;
  }

  // Check if target is a directory (e.g. "/" -> "/index.html")
  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, "index.html");
  }

  // If the static file exists, serve it
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || "application/octet-stream";
    res.writeHead(200, {
      "Content-Type": contentType,
      "Cache-Control": ext === ".html" ? "no-cache" : "public, max-age=31536000"
    });
    fs.createReadStream(filePath).pipe(res);
    return;
  }

  // SPA Fallback: for routes like /dashboard, /games, /games/study-cafe, /games/angry-nerds
  const indexHtml = path.join(DIST_DIR, "index.html");
  if (fs.existsSync(indexHtml)) {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    fs.createReadStream(indexHtml).pipe(res);
    return;
  }

  // Fallback
  res.writeHead(404, { "Content-Type": "text/plain" });
  res.end("Dist folder not found. Please run 'npm run build' once first.");
});

server.listen(PORT, "0.0.0.0", () => {
  console.log("\n========================================================");
  console.log("       STUDYQUEST NODE.JS SERVER (PURE NODE)");
  console.log("========================================================");
  console.log(`\n  ➜  Local:   http://localhost:${PORT}/`);
  console.log(`  ➜  Network: http://127.0.0.1:${PORT}/`);
  console.log("\n  Running on pure Node.js (no Vite required).");
  console.log("  Press Ctrl + C in this terminal to stop the server.\n");
});
