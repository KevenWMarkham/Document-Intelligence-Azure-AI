"""Manage custom extraction models.

Training data must be in an Azure Blob container: 5+ sample documents labeled with
Document Intelligence Studio (https://documentintelligence.ai.azure.com/studio),
which writes the .labels.json / .ocr.json files alongside them. Pass a container
SAS URL with read + list permissions.

Usage:
  python train_custom.py train <model-id> <container-sas-url> [--mode template|neural]
  python train_custom.py list
  python train_custom.py get <model-id>
  python train_custom.py delete <model-id>

After training, analyze with:  python analyze.py <file> --model <model-id>
"""

import argparse

from azure.ai.documentintelligence.models import (
    AzureBlobContentSource,
    BuildDocumentModelRequest,
    DocumentBuildMode,
)

from di_client import admin_client


def train(model_id: str, container_url: str, mode: str) -> None:
    client = admin_client()
    build_mode = DocumentBuildMode.NEURAL if mode == "neural" else DocumentBuildMode.TEMPLATE
    print(f"Building model '{model_id}' ({build_mode}) — this can take a few minutes ...")
    poller = client.begin_build_document_model(
        BuildDocumentModelRequest(
            model_id=model_id,
            build_mode=build_mode,
            azure_blob_source=AzureBlobContentSource(container_url=container_url),
        )
    )
    model = poller.result()
    print(f"Model '{model.model_id}' created on {model.created_date_time}")
    for doc_type, details in (model.doc_types or {}).items():
        print(f"  Doc type '{doc_type}' fields:")
        for name in details.field_schema:
            confidence = (details.field_confidence or {}).get(name)
            suffix = f" (confidence {confidence:.2f})" if confidence is not None else ""
            print(f"    {name}{suffix}")


def list_models() -> None:
    client = admin_client()
    print("Custom models:")
    found = False
    for model in client.list_models():
        if model.model_id.startswith("prebuilt-"):
            continue
        found = True
        print(f"  {model.model_id}  (created {model.created_date_time})")
    if not found:
        print("  (none)")


def get_model(model_id: str) -> None:
    model = admin_client().get_model(model_id)
    print(f"{model.model_id}: created {model.created_date_time}")
    if model.description:
        print(f"  {model.description}")
    for doc_type in model.doc_types or {}:
        print(f"  doc type: {doc_type}")


def delete_model(model_id: str) -> None:
    admin_client().delete_model(model_id)
    print(f"Deleted '{model_id}'")


def main() -> None:
    parser = argparse.ArgumentParser(description="Manage custom Document Intelligence models")
    sub = parser.add_subparsers(dest="command", required=True)

    p_train = sub.add_parser("train", help="Build a custom model from labeled blobs")
    p_train.add_argument("model_id")
    p_train.add_argument("container_sas_url")
    p_train.add_argument("--mode", choices=["template", "neural"], default="template")

    sub.add_parser("list", help="List custom models")
    sub.add_parser("get", help="Show a model").add_argument("model_id")
    sub.add_parser("delete", help="Delete a model").add_argument("model_id")

    args = parser.parse_args()
    if args.command == "train":
        train(args.model_id, args.container_sas_url, args.mode)
    elif args.command == "list":
        list_models()
    elif args.command == "get":
        get_model(args.model_id)
    elif args.command == "delete":
        delete_model(args.model_id)


if __name__ == "__main__":
    main()
