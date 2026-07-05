"""Connectivity smoke test — verifies endpoint + key without analyzing anything.

Usage: python smoke_test.py
"""

from di_client import admin_client


def main() -> None:
    client = admin_client()
    info = client.get_resource_details()
    details = info.custom_document_models
    print("Connected to Document Intelligence resource.")
    print(f"  Custom models: {details.count} used of {details.limit} allowed")

    print("  Prebuilt models available (first 10):")
    for i, model in enumerate(client.list_models()):
        if i >= 10:
            print("    ...")
            break
        print(f"    {model.model_id}")


if __name__ == "__main__":
    main()
