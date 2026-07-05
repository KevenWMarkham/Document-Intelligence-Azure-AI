"""Analyze a document (local file or URL) with Azure Document Intelligence.

Usage:
  python analyze.py <path-or-url> [--model layout|read|invoice|receipt|<custom-model-id>]
                    [--out output.json]

Examples:
  python analyze.py invoice.pdf --model invoice
  python analyze.py https://raw.githubusercontent.com/Azure-Samples/cognitive-services-REST-api-samples/master/curl/form-recognizer/sample-invoice.pdf --model invoice
  python analyze.py scan.png                     # defaults to prebuilt-layout
"""

import argparse
import json
import os

from azure.ai.documentintelligence.models import AnalyzeDocumentRequest, AnalyzeResult

from di_client import analysis_client

MODEL_ALIASES = {
    "layout": "prebuilt-layout",
    "read": "prebuilt-read",
    "invoice": "prebuilt-invoice",
    "receipt": "prebuilt-receipt",
}


def analyze(source: str, model_id: str) -> AnalyzeResult:
    client = analysis_client()
    if source.lower().startswith(("http://", "https://")):
        poller = client.begin_analyze_document(
            model_id, AnalyzeDocumentRequest(url_source=source)
        )
    else:
        with open(source, "rb") as f:
            poller = client.begin_analyze_document(model_id, body=f)
    return poller.result()


def print_layout(result: AnalyzeResult) -> None:
    if result.styles and any(style.is_handwritten for style in result.styles):
        print("Document contains handwritten content.")
    for page in result.pages or []:
        lines = page.lines or []
        print(f"--- Page {page.page_number} ({page.width}x{page.height} {page.unit}, {len(lines)} lines)")
        for line in lines:
            print(f"    {line.content}")
    for i, table in enumerate(result.tables or []):
        print(f"--- Table {i + 1}: {table.row_count} rows x {table.column_count} columns")
        for cell in table.cells:
            print(f"    [{cell.row_index},{cell.column_index}] {cell.content}")


def print_fields(result: AnalyzeResult) -> None:
    for idx, doc in enumerate(result.documents or []):
        print(f"--- Document {idx + 1} (type: {doc.doc_type}, confidence: {doc.confidence:.2f})")
        for name, field in (doc.fields or {}).items():
            confidence = f"{field.confidence:.2f}" if field.confidence is not None else "n/a"
            if field.type == "array":
                print(f"    {name}: ({len(field.value_array or [])} items)")
                for item in field.value_array or []:
                    if item.type == "object":
                        parts = ", ".join(
                            f"{k}={v.content}" for k, v in (item.value_object or {}).items()
                        )
                        print(f"      - {parts}")
                    else:
                        print(f"      - {item.content}")
            else:
                print(f"    {name}: {field.content}  (confidence {confidence})")


def main() -> None:
    parser = argparse.ArgumentParser(description="Analyze a document with Azure Document Intelligence")
    parser.add_argument("source", help="Path to a local file or an https:// URL")
    parser.add_argument("--model", default="layout",
                        help="layout | read | invoice | receipt | <custom-model-id> (default: layout)")
    parser.add_argument("--out", help="Also write the full result as JSON to this path")
    args = parser.parse_args()

    model_id = MODEL_ALIASES.get(args.model, args.model)
    print(f"Analyzing with model '{model_id}' ...")
    result = analyze(args.source, model_id)

    if result.documents:
        print_fields(result)
    else:
        print_layout(result)

    if args.out:
        os.makedirs(os.path.dirname(os.path.abspath(args.out)), exist_ok=True)
        with open(args.out, "w", encoding="utf-8") as f:
            json.dump(result.as_dict(), f, indent=2, default=str)
        print(f"\nFull result written to {args.out}")


if __name__ == "__main__":
    main()
