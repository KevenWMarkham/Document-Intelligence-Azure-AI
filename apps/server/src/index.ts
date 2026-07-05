/**
 * Relay server — holds the Document Intelligence API key so the browser never
 * sees it. Accepts a document (URL or base64) plus a model id, submits the
 * analyze job to Azure, polls until it finishes, and returns the result.
 */
import path from "node:path";
import { fileURLToPath } from "node:url";

import { scenarios } from "@docintel/scenarios";
import { config } from "dotenv";
import express from "express";

const here = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.resolve(here, "../../../.env") });

const endpoint = (process.env.DOCINTEL_ENDPOINT ?? "").replace(/\/+$/, "");
const key = process.env.DOCINTEL_KEY ?? "";
if (!endpoint || !key) {
  console.error("DOCINTEL_ENDPOINT / DOCINTEL_KEY missing — create .env at the repo root.");
  process.exit(1);
}

const API_VERSION = "2024-11-30";
const POLL_INTERVAL_MS = 2000;
const POLL_TIMEOUT_MS = 180_000;

const app = express();
app.use(express.json({ limit: "30mb" }));

app.get("/api/scenarios", (_req, res) => {
  res.json(scenarios);
});

interface AnalyzeBody {
  modelId?: string;
  urlSource?: string;
  base64Source?: string;
}

app.post("/api/analyze", async (req, res) => {
  const { modelId, urlSource, base64Source } = req.body as AnalyzeBody;
  if (!modelId || (!urlSource && !base64Source)) {
    res.status(400).json({ error: "modelId and one of urlSource | base64Source are required" });
    return;
  }

  try {
    const submit = await fetch(
      `${endpoint}/documentintelligence/documentModels/${encodeURIComponent(modelId)}:analyze?api-version=${API_VERSION}`,
      {
        method: "POST",
        headers: {
          "Ocp-Apim-Subscription-Key": key,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(urlSource ? { urlSource } : { base64Source }),
      },
    );
    if (submit.status !== 202) {
      const detail = await submit.text();
      console.error(`analyze submit failed (${submit.status}):`, detail);
      res.status(submit.status).json({ error: `Azure rejected the request: ${detail}` });
      return;
    }

    const operationUrl = submit.headers.get("operation-location");
    if (!operationUrl) {
      res.status(502).json({ error: "Azure did not return an operation-location header" });
      return;
    }

    const deadline = Date.now() + POLL_TIMEOUT_MS;
    while (Date.now() < deadline) {
      await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
      const poll = await fetch(operationUrl, {
        headers: { "Ocp-Apim-Subscription-Key": key },
      });
      const body = (await poll.json()) as {
        status: string;
        analyzeResult?: unknown;
        error?: { code?: string; message?: string };
      };
      if (body.status === "succeeded") {
        res.json({ analyzeResult: body.analyzeResult });
        return;
      }
      if (body.status === "failed") {
        console.error("analyze failed:", body.error);
        res.status(502).json({ error: body.error?.message ?? "Analysis failed" });
        return;
      }
    }
    res.status(504).json({ error: "Analysis timed out" });
  } catch (err) {
    console.error("analyze error:", err);
    res.status(500).json({ error: err instanceof Error ? err.message : "Unexpected error" });
  }
});

const port = Number(process.env.PORT ?? 8788);
app.listen(port, () => {
  console.log(`Document Intelligence relay listening on http://localhost:${port}`);
  console.log(`  endpoint: ${endpoint}`);
  console.log(`  scenarios: ${scenarios.length}`);
});
