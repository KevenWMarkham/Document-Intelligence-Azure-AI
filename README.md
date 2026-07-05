# Document Intelligence — Azure AI

Python console tools for **Azure AI Document Intelligence**: general OCR/layout,
invoice and receipt extraction with prebuilt models, plus custom extraction-model
training.

## Layout

```
├─ analyze.py        Analyze a file or URL with any model (layout/read/invoice/receipt/custom)
├─ train_custom.py   Build / list / inspect / delete custom extraction models
├─ smoke_test.py     Connectivity check — no documents needed
├─ di_client.py      Shared client factory (.env loading)
└─ .env.example      Configuration template
```

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

Copy `.env.example` to `.env` and fill in:

```powershell
az cognitiveservices account show -n docintel-kmarkham-sandbox -g rg-doc-intelligence --query properties.endpoint -o tsv
az cognitiveservices account keys list -n docintel-kmarkham-sandbox -g rg-doc-intelligence --query key1 -o tsv
```

### 3. Install

```powershell
py -3 -m venv .venv
.venv\Scripts\python.exe -m pip install -r requirements.txt
.venv\Scripts\python.exe smoke_test.py     # verify connectivity
```

## Analyze documents

```powershell
# General OCR / layout (text, tables, structure) — any PDF or image
.venv\Scripts\python.exe analyze.py scan.pdf

# Invoices — vendor, totals, line items
.venv\Scripts\python.exe analyze.py invoice.pdf --model invoice

# Receipts — merchant, date, totals
.venv\Scripts\python.exe analyze.py receipt.jpg --model receipt

# Save the full JSON result
.venv\Scripts\python.exe analyze.py invoice.pdf --model invoice --out output\invoice.json
```

URLs work anywhere a path does. Microsoft-hosted samples for a quick test:

```powershell
.venv\Scripts\python.exe analyze.py https://raw.githubusercontent.com/Azure-Samples/cognitive-services-REST-api-samples/master/curl/form-recognizer/sample-invoice.pdf --model invoice
.venv\Scripts\python.exe analyze.py https://raw.githubusercontent.com/Azure-Samples/cognitive-services-REST-api-samples/master/curl/form-recognizer/sample-layout.pdf --model layout
```

## Custom models

1. Upload 5+ representative sample documents to an Azure Blob container.
2. Label them in [Document Intelligence Studio](https://documentintelligence.ai.azure.com/studio)
   (Custom extraction project pointed at that container).
3. Generate a container SAS URL (read + list) and train:

```powershell
.venv\Scripts\python.exe train_custom.py train my-model "<container-sas-url>"          # template mode
.venv\Scripts\python.exe train_custom.py train my-model "<container-sas-url>" --mode neural
.venv\Scripts\python.exe train_custom.py list
.venv\Scripts\python.exe analyze.py newdoc.pdf --model my-model
```

Template mode is fast and free-tier friendly for fixed forms; neural handles
layout variation better but trains slower and costs more.

## Where to take it next

- **Batch processing** — point a loop or Azure Function at a blob container of incoming documents.
- **Query fields add-on** — extract ad-hoc fields without training (`features=[DocumentAnalysisFeature.QUERY_FIELDS]`).
- **Classification** — route mixed document streams with a custom classifier before extraction.
- **Managed identity** — swap the API key for `DefaultAzureCredential` (`azure-identity` is already in requirements).
