export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method Not Allowed" });
    return;
  }

  const authHeader =
    req.headers.authorization ||
    (process.env.NVIDIA_API_KEY ? `Bearer ${process.env.NVIDIA_API_KEY}` : "");

  if (!authHeader) {
    res.status(401).json({ error: "Missing NVIDIA API key" });
    return;
  }

  try {
    const body = typeof req.body === "string" ? req.body : JSON.stringify(req.body || {});
    const upstream = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader
      },
      body
    });
    const text = await upstream.text();
    res.setHeader("Content-Type", upstream.headers.get("content-type") || "application/json; charset=utf-8");
    res.status(upstream.status).send(text);
  } catch {
    res.status(502).json({ error: "NVIDIA upstream request failed" });
  }
}
