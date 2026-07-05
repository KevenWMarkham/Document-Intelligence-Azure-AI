import type { DocScenario } from "@docintel/scenarios";

/** Subset of the Azure AnalyzeResult shape the UI renders. */
export interface DIField {
  type: string;
  content?: string;
  confidence?: number;
  valueArray?: DIField[];
  valueObject?: Record<string, DIField>;
}

export interface DITableCell {
  rowIndex: number;
  columnIndex: number;
  content: string;
  kind?: string;
}

export interface DITable {
  rowCount: number;
  columnCount: number;
  cells: DITableCell[];
}

export interface DIPage {
  pageNumber: number;
  width?: number;
  height?: number;
  unit?: string;
  lines?: { content: string }[];
}

export interface DIDocument {
  docType: string;
  confidence: number;
  fields?: Record<string, DIField>;
}

export interface AnalyzeResult {
  modelId: string;
  content: string;
  pages?: DIPage[];
  tables?: DITable[];
  documents?: DIDocument[];
  languages?: { locale: string; confidence: number }[];
  styles?: { isHandwritten?: boolean }[];
}

async function postAnalyze(body: Record<string, string>): Promise<AnalyzeResult> {
  const res = await fetch("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? `Request failed (${res.status})`);
  return json.analyzeResult as AnalyzeResult;
}

export async function fetchScenarios(): Promise<DocScenario[]> {
  const res = await fetch("/api/scenarios");
  if (!res.ok) throw new Error("Could not load scenarios — is the relay server running?");
  return res.json();
}

export function analyzeUrl(modelId: string, urlSource: string): Promise<AnalyzeResult> {
  return postAnalyze({ modelId, urlSource });
}

export async function analyzeFile(modelId: string, file: File): Promise<AnalyzeResult> {
  const base64Source = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(",", 2)[1]);
    reader.onerror = () => reject(new Error("Could not read the file"));
    reader.readAsDataURL(file);
  });
  return postAnalyze({ modelId, base64Source });
}
