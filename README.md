# Document Intelligence Workbench — Azure AI

A monorepo of document-analysis scenarios built on **Azure AI Document Intelligence**.
Pick a scenario in the web workbench — invoices, receipts, IDs, contracts, and more —
then analyze a built-in sample or upload your own document and watch the extracted
fields, tables, and text come back with confidence scores.

Two ways to run scenarios:

- **Web workbench** (`apps/web` + `apps/server`) — a React app with a scenario picker,
  one-click sample documents, and drag-and-drop upload.
- **Python console** (`apps/console-py`) — CLI analysis plus custom-model training.

## Repository layout

```
├─ apps/
│  ├─ web/          React + Vite + TS — scenario cards, upload, results renderer
│  ├─ server/       Node relay — holds the API key, submits analyze jobs to Azure,
│  │                polls the operation until it completes
│  └─ console-py/   Python CLI (analyze, custom-model training) + smoke test
├─ packages/
│  └─ scenarios/    Shared scenario catalog (model id, sample doc, description)
└─ package.json     npm workspaces root
```

### How the web workbench works

```
 Browser ── POST /api/analyze {modelId, base64Source | urlSource} ──► apps/server
                                                                          │ api-key injected here
                                                                          ▼
                             Azure Document Intelligence  ◄── analyze + poll (REST 2024-11-30)
```

The browser never sees the API key — the relay submits the analyze job, polls the
operation, and returns the finished `analyzeResult`.

## Scenarios

Defined once in [packages/scenarios/src/index.ts](packages/scenarios/src/index.ts) and used by both the
relay and the web UI:

| Scenario | Model | Extracts |
| --- | --- | --- |
| 📄 Layout & Tables | `prebuilt-layout` | text, tables, checkboxes, structure |
| 📖 Read (OCR) | `prebuilt-read` | printed & handwritten text, languages |
| 🧾 Invoice Processing | `prebuilt-invoice` | vendor, customer, totals, line items |
| 🛒 Receipt & Expense | `prebuilt-receipt` | merchant, items, tax, total |
| 🪪 ID Document | `prebuilt-idDocument` | name, DOB, document number, expiry |
| 📑 Contract Review | `prebuilt-contract` | parties, title, dates, jurisdictions |
| 💳 Credit Card | `prebuilt-creditCard` | card number, holder, expiration |
| 🏥 Health Insurance Card | `prebuilt-healthInsuranceCard.us` | insurer, member, plan, copays |

Each scenario ships with a public Microsoft-hosted sample document for instant demos.
Add a scenario by appending to that one file — it appears in the web app immediately.

## Setup

### 1. Azure (one time)

```powershell
az group create --name rg-doc-intelligence --location eastus
az cognitiveservices account create `
  --name docintel-kmarkham-sandbox `
  --resource-group rg-doc-intelligence `
  --kind FormRecognizer --sku S0 --location eastus `
  --custom-domain docintel-kmarkham-sandbox --yes
```

### 2. Configuration

Create `.env` at the repo root (used by the relay server) — see
`apps/console-py/.env.example` for the format:

```
DOCINTEL_ENDPOINT=https://<your-resource>.cognitiveservices.azure.com/
DOCINTEL_KEY=<key1>
```

The Python console reads its own copy at `apps/console-py/.env`.

```powershell
az cognitiveservices account show -n docintel-kmarkham-sandbox -g rg-doc-intelligence --query properties.endpoint -o tsv
az cognitiveservices account keys list -n docintel-kmarkham-sandbox -g rg-doc-intelligence --query key1 -o tsv
```

### 3. Install

```powershell
npm install                        # web + server + scenarios workspaces

# python console (optional)
py -3 -m venv apps\console-py\.venv
apps\console-py\.venv\Scripts\python.exe -m pip install -r apps\console-py\requirements.txt
```

## Run the web workbench

```powershell
npm run dev
```

This starts the relay server (http://localhost:8788) and the web app
(http://localhost:5174) together. Open http://localhost:5174, pick a scenario, and
click **Analyze sample** — or drop in your own PDF/image.

## Run the Python console

```powershell
cd apps\console-py
.venv\Scripts\python.exe smoke_test.py                          # connectivity check
.venv\Scripts\python.exe analyze.py invoice.pdf --model invoice # any file or URL
.venv\Scripts\python.exe train_custom.py train my-model "<container-sas-url>"
```

`analyze.py` accepts `--model layout | read | invoice | receipt | <custom-model-id>`
and `--out result.json` for the full response. Custom-model training needs 5+ samples
labeled in [Document Intelligence Studio](https://documentintelligence.ai.azure.com/studio)
in a blob container (SAS URL with read + list).

## Where to take it next

- **Custom scenarios** — train a model on your own forms (`train_custom.py`), then add
  it to the catalog with its `modelId` — the workbench runs custom models as-is.
- **Query fields** — extract ad-hoc fields without training via the query-fields add-on.
- **Classification** — route mixed document streams with a custom classifier first.
- **Deploy** — containerize `apps/server` (serving the built `apps/web`) to Azure
  Container Apps; swap the API key for managed identity + Entra tokens.
