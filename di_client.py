"""Shared client factory — loads .env and builds Document Intelligence clients."""

import os
import sys

from azure.ai.documentintelligence import (
    DocumentIntelligenceAdministrationClient,
    DocumentIntelligenceClient,
)
from azure.core.credentials import AzureKeyCredential
from dotenv import load_dotenv

# Documents contain characters (checkboxes, ligatures) the default Windows
# console codepage can't encode.
sys.stdout.reconfigure(encoding="utf-8", errors="replace")

load_dotenv(os.path.join(os.path.dirname(__file__), ".env"), encoding="utf-8-sig")


def _credential() -> tuple[str, AzureKeyCredential]:
    endpoint = os.environ.get("DOCINTEL_ENDPOINT", "")
    key = os.environ.get("DOCINTEL_KEY", "")
    if not endpoint or not key or "<" in endpoint or "<" in key:
        sys.exit(
            "DOCINTEL_ENDPOINT / DOCINTEL_KEY not configured. "
            "Copy .env.example to .env and fill in your resource values."
        )
    return endpoint, AzureKeyCredential(key)


def analysis_client() -> DocumentIntelligenceClient:
    endpoint, cred = _credential()
    return DocumentIntelligenceClient(endpoint=endpoint, credential=cred)


def admin_client() -> DocumentIntelligenceAdministrationClient:
    endpoint, cred = _credential()
    return DocumentIntelligenceAdministrationClient(endpoint=endpoint, credential=cred)
