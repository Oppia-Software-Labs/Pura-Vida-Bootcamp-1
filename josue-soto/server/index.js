import "dotenv/config";
import express from "express";
import Anthropic from "@anthropic-ai/sdk";
import { chat } from "./agent.js";
import { analyzePair, NETWORKS } from "./horizon.js";

const app = express();
app.use(express.json({ limit: "200kb" }));

const ADDRESS_RE = /^G[A-Z2-7]{55}$/;

function readCommon(body) {
  const network = body.network === "mainnet" ? "mainnet" : "testnet";
  const address = typeof body.address === "string" && ADDRESS_RE.test(body.address) ? body.address : undefined;
  return { network, address };
}

app.get("/api/config", (_req, res) => {
  res.json(Object.fromEntries(Object.entries(NETWORKS).map(([k, v]) => [k, { horizonUrl: v.horizonUrl, passphrase: v.passphrase, usdcIssuer: v.usdcIssuer }])));
});

// Live market panel (no LLM involved).
app.get("/api/market", async (req, res) => {
  try {
    const network = req.query.network === "mainnet" ? "mainnet" : "testnet";
    res.json(await analyzePair(network, String(req.query.base ?? "XLM"), String(req.query.counter ?? "USDC"), Number(req.query.size) || 100));
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.post("/api/chat", async (req, res) => {
  const { network, address } = readCommon(req.body);
  const message = String(req.body.message ?? "").slice(0, 4000);
  const history = Array.isArray(req.body.history)
    ? req.body.history
        .filter((m) => (m.role === "user" || m.role === "assistant") && typeof m.text === "string" && m.text)
        .map((m) => ({ role: m.role, text: m.text.slice(0, 8000) }))
    : [];
  if (!message) return res.status(400).json({ error: "message is required" });

  try {
    res.json(await chat({ network, address, history, message }));
  } catch (e) {
    console.error(e);
    if (e instanceof Anthropic.AuthenticationError) return res.status(500).json({ error: "Invalid or missing ANTHROPIC_API_KEY on the server." });
    if (e instanceof Anthropic.RateLimitError) return res.status(429).json({ error: "Rate limited by the Claude API, try again shortly." });
    if (e instanceof Anthropic.APIError) return res.status(502).json({ error: `Claude API error ${e.status}: ${e.message}` });
    res.status(500).json({ error: e.message ?? "Unexpected error" });
  }
});

const port = Number(process.env.PORT) || 8787;
app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
  if (!process.env.ANTHROPIC_API_KEY) console.warn("ANTHROPIC_API_KEY is not set: /api/chat will fail unless an `ant auth login` profile exists.");
});
