import { useEffect, useRef, useState } from "react";

import type { DocScenario } from "@docintel/scenarios";

import type { AnalyzeResult } from "./api";
import { analyzeFile, analyzeUrl, fetchScenarios } from "./api";
import ResultView from "./ResultView";

const ACCEPT = ".pdf,.jpg,.jpeg,.png,.tif,.tiff,.bmp,.heif,.docx,.xlsx,.pptx";

interface RunMeta {
  scenario: DocScenario;
  sourceLabel: string;
  ms: number;
}

export default function App() {
  const [scenarios, setScenarios] = useState<DocScenario[]>([]);
  const [selectedId, setSelectedId] = useState<string>();
  const [busyLabel, setBusyLabel] = useState<string>();
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState<string>();
  const [result, setResult] = useState<AnalyzeResult>();
  const [meta, setMeta] = useState<RunMeta>();
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchScenarios().then(setScenarios).catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    if (!busyLabel) return;
    setElapsed(0);
    const started = Date.now();
    const timer = setInterval(() => setElapsed(Math.round((Date.now() - started) / 1000)), 500);
    return () => clearInterval(timer);
  }, [busyLabel]);

  const selected = scenarios.find((s) => s.id === selectedId);

  async function run(scenario: DocScenario, sourceLabel: string, job: Promise<AnalyzeResult>) {
    setBusyLabel(`Analyzing ${sourceLabel} with ${scenario.modelId} …`);
    setError(undefined);
    setResult(undefined);
    const started = Date.now();
    try {
      const analyzeResult = await job;
      setResult(analyzeResult);
      setMeta({ scenario, sourceLabel, ms: Date.now() - started });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusyLabel(undefined);
    }
  }

  function runSample(scenario: DocScenario) {
    void run(scenario, scenario.sampleLabel, analyzeUrl(scenario.modelId, scenario.sampleUrl));
  }

  function runFile(scenario: DocScenario, file: File) {
    void run(scenario, file.name, analyzeFile(scenario.modelId, file));
  }

  return (
    <div className="app">
      <header>
        <h1>
          <span className="logo">🔍</span> Document Intelligence Workbench
        </h1>
        <p className="tagline">
          Pick a scenario, then analyze the built-in sample or upload your own document. Powered by
          Azure AI Document Intelligence.
        </p>
      </header>

      <div className="scenario-grid">
        {scenarios.map((s) => (
          <button
            key={s.id}
            className={`card ${s.id === selectedId ? "selected" : ""}`}
            onClick={() => setSelectedId(s.id)}
          >
            <div className="card-title">
              <span className="card-emoji">{s.emoji}</span> {s.name}
            </div>
            <div className="card-desc">{s.description}</div>
            <div className="chips">
              {s.extracts.map((x) => (
                <span key={x} className="chip">
                  {x}
                </span>
              ))}
            </div>
          </button>
        ))}
      </div>

      {selected && (
        <div
          className="run-panel"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const file = e.dataTransfer.files[0];
            if (file && !busyLabel) runFile(selected, file);
          }}
        >
          <div className="run-actions">
            <button
              className="primary"
              disabled={!!busyLabel}
              onClick={() => runSample(selected)}
            >
              ▶ Analyze sample: {selected.sampleLabel}
            </button>
            <button
              disabled={!!busyLabel}
              onClick={() => fileInput.current?.click()}
            >
              ⬆ Upload a document…
            </button>
            <span className="hint">or drop a file here ({ACCEPT.replaceAll(",", " ")})</span>
            <input
              ref={fileInput}
              type="file"
              accept={ACCEPT}
              hidden
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) runFile(selected, file);
                e.target.value = "";
              }}
            />
          </div>

          {busyLabel && (
            <div className="status">
              <span className="spinner" /> {busyLabel} {elapsed}s
            </div>
          )}
          {error && <div className="error">⚠ {error}</div>}
          {result && meta && (
            <>
              <div className="run-summary">
                {meta.scenario.emoji} <strong>{meta.sourceLabel}</strong> analyzed in{" "}
                {(meta.ms / 1000).toFixed(1)}s
              </div>
              <ResultView result={result} />
            </>
          )}
        </div>
      )}
    </div>
  );
}
