// Pure Node.js HTTP Server for EduQuest (Production Static & SPA Server)
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 5173;
const DIST_DIR = path.resolve(__dirname, "dist");

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

// Standard OWASP Security Headers
function setSecurityHeaders(res, extraHeaders = {}) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  for (const [key, val] of Object.entries(extraHeaders)) {
    res.setHeader(key, val);
  }
}

const server = http.createServer(async (req, res) => {
  // 0. Parse URI safely first so API proxy and static handler share cleanPath
  let cleanPath = "/";
  try {
    const rawUrl = req.url || "/";
    cleanPath = decodeURIComponent(rawUrl.split("?")[0]);
  } catch (err) {
    setSecurityHeaders(res);
    res.writeHead(400, { "Content-Type": "text/plain" });
    res.end("Bad Request: Malformed URI");
    return;
  }

  // Proxy NVIDIA NIM API requests server-side to avoid browser CORS blocks
  if (cleanPath === "/api/nvidia/chat/completions") {
    if (req.method !== "POST") {
      setSecurityHeaders(res);
      res.writeHead(405, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Method Not Allowed" }));
      return;
    }

    const chunks = [];
    let totalBytes = 0;
    const MAX_BODY_BYTES = 2 * 1024 * 1024;

    req.on("data", (chunk) => {
      totalBytes += chunk.length;
      if (totalBytes <= MAX_BODY_BYTES) {
        chunks.push(chunk);
      }
    });

    req.on("end", async () => {
      if (totalBytes > MAX_BODY_BYTES) {
        setSecurityHeaders(res);
        res.writeHead(413, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Payload too large" }));
        return;
      }

      const authHeader =
        req.headers.authorization ||
        (process.env.NVIDIA_API_KEY ? `Bearer ${process.env.NVIDIA_API_KEY}` : "");

      if (!authHeader) {
        setSecurityHeaders(res);
        res.writeHead(401, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Missing NVIDIA API key" }));
        return;
      }

      try {
        const upstream = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: authHeader
          },
          body: Buffer.concat(chunks).toString("utf8")
        });
        const text = await upstream.text();
        setSecurityHeaders(res, {
          "Content-Type": upstream.headers.get("content-type") || "application/json; charset=utf-8",
          "Cache-Control": "no-store"
        });
        res.writeHead(upstream.status);
        res.end(text);
      } catch (err) {
        setSecurityHeaders(res, { "Content-Type": "application/json; charset=utf-8" });
        res.writeHead(502);
        res.end(JSON.stringify({ error: "NVIDIA upstream request failed" }));
      }
    });
    return;
  }

  // 1. Method restriction: Allow only GET and HEAD for static serving
  if (req.method !== "GET" && req.method !== "HEAD") {
    setSecurityHeaders(res);
    res.writeHead(405, { "Content-Type": "text/plain" });
    res.end("Method Not Allowed");
    return;
  }

  // 3. Strict Path Traversal Prevention
  // Normalize and resolve against DIST_DIR, ensuring the target never escapes DIST_DIR
  const normalizedPath = path.normalize(cleanPath).replace(/^(\.\.[\/\\])+/, "");
  let filePath = path.resolve(DIST_DIR, "." + normalizedPath);

  if (!filePath.startsWith(DIST_DIR + path.sep) && filePath !== DIST_DIR) {
    setSecurityHeaders(res);
    res.writeHead(403, { "Content-Type": "text/plain" });
    res.end("Forbidden: Access Denied");
    return;
  }

  // 4. Directory mapping: e.g. "/" -> "dist/index.html"
  try {
    if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
      filePath = path.join(filePath, "index.html");
    }
  } catch (e) {
    // Stat error fallback
  }

  // 5. Serve static file if it exists inside DIST_DIR
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || "application/octet-stream";
    const isHtml = ext === ".html";

    setSecurityHeaders(res, {
      "Content-Type": contentType,
      "Cache-Control": isHtml ? "no-cache, no-store, must-revalidate" : "public, max-age=31536000, immutable"
    });

    if (req.method === "HEAD") {
      res.writeHead(200);
      res.end();
      return;
    }

    fs.createReadStream(filePath).pipe(res);
    return;
  }

  // 6. SPA Route Fallback: Serve index.html for client-side routing
  const indexHtml = path.join(DIST_DIR, "index.html");
  if (fs.existsSync(indexHtml)) {
    setSecurityHeaders(res, {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-cache, no-store, must-revalidate"
    });

    if (req.method === "HEAD") {
      res.writeHead(200);
      res.end();
      return;
    }

    fs.createReadStream(indexHtml).pipe(res);
    return;
  }

  // 7. Not Found
  setSecurityHeaders(res);
  res.writeHead(404, { "Content-Type": "text/plain" });
  res.end("Dist folder not found. Please run 'npm run build' first.");
});

server.listen(PORT, "0.0.0.0", () => {
  console.log("\n========================================================");
  console.log("       EDUQUEST SECURE NODE.JS SERVER");
  console.log("========================================================");
  console.log(`\n  ➜  Local:   http://localhost:${PORT}/`);
  console.log(`  ➜  Network: http://127.0.0.1:${PORT}/`);
  console.log("\n  Running on pure Node.js with OWASP security headers enabled.");
  console.log("  Press Ctrl + C in this terminal to stop the server.\n");
});
