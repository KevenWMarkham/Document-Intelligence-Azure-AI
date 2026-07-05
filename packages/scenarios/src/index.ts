export interface DocScenario {
  id: string;
  name: string;
  emoji: string;
  description: string;
  /** Document Intelligence model id, e.g. prebuilt-invoice. */
  modelId: string;
  /** What the model extracts — shown as chips on the scenario card. */
  extracts: string[];
  /** Public sample document for a one-click demo run. */
  sampleUrl: string;
  sampleLabel: string;
}

const SAMPLES_A =
  "https://raw.githubusercontent.com/Azure-Samples/cognitive-services-REST-api-samples/master/curl/form-recognizer";
const SAMPLES_B =
  "https://raw.githubusercontent.com/Azure-Samples/document-intelligence-code-samples/main/Data";

export const scenarios: DocScenario[] = [
  {
    id: "layout",
    name: "Layout & Tables",
    emoji: "📄",
    description:
      "General document structure: text, tables, checkboxes, and reading order from any PDF or image.",
    modelId: "prebuilt-layout",
    extracts: ["text lines", "tables", "selection marks", "structure"],
    sampleUrl: `${SAMPLES_A}/sample-layout.pdf`,
    sampleLabel: "SEC Form 10-Q filing",
  },
  {
    id: "read",
    name: "Read (OCR)",
    emoji: "📖",
    description:
      "Fast text extraction — printed and handwritten — with per-word confidence and language detection.",
    modelId: "prebuilt-read",
    extracts: ["printed text", "handwriting", "languages"],
    sampleUrl: `${SAMPLES_B}/read/read-resume.png`,
    sampleLabel: "Scanned resume",
  },
  {
    id: "invoice",
    name: "Invoice Processing",
    emoji: "🧾",
    description:
      "Vendor, customer, totals, tax, payment terms, and every line item from sales invoices.",
    modelId: "prebuilt-invoice",
    extracts: ["vendor & customer", "totals & tax", "line items", "dates"],
    sampleUrl: `${SAMPLES_A}/sample-invoice.pdf`,
    sampleLabel: "Contoso invoice",
  },
  {
    id: "receipt",
    name: "Receipt & Expense",
    emoji: "🛒",
    description:
      "Merchant, transaction date and time, itemized purchases, tax, tip, and total from receipts.",
    modelId: "prebuilt-receipt",
    extracts: ["merchant", "items", "tax & tip", "total"],
    sampleUrl: `${SAMPLES_B}/receipt/contoso-receipt.png`,
    sampleLabel: "Contoso store receipt",
  },
  {
    id: "id-document",
    name: "ID Document",
    emoji: "🪪",
    description:
      "Identity verification fields from driver licenses, passports, and other government IDs.",
    modelId: "prebuilt-idDocument",
    extracts: ["name & DOB", "document number", "expiry", "address"],
    sampleUrl: `${SAMPLES_B}/id-card/DriverLicense.png`,
    sampleLabel: "US driver license",
  },
  {
    id: "contract",
    name: "Contract Review",
    emoji: "📑",
    description:
      "Parties, title, execution date, effective date, and jurisdictions from legal agreements.",
    modelId: "prebuilt-contract",
    extracts: ["parties", "title", "dates", "jurisdictions"],
    sampleUrl: `${SAMPLES_B}/contract/contract.png`,
    sampleLabel: "Service agreement",
  },
  {
    id: "credit-card",
    name: "Credit Card",
    emoji: "💳",
    description:
      "Card number, holder name, expiration, and issuing network from payment card images.",
    modelId: "prebuilt-creditCard",
    extracts: ["card number", "holder", "expiration", "network"],
    sampleUrl: `${SAMPLES_B}/credit-card/credit-cards-horizontal.png`,
    sampleLabel: "Sample credit cards",
  },
  {
    id: "insurance-card",
    name: "Health Insurance Card (US)",
    emoji: "🏥",
    description:
      "Insurer, member, plan, group number, and copay details from US health insurance cards.",
    modelId: "prebuilt-healthInsuranceCard.us",
    extracts: ["insurer & member", "plan & group", "copays"],
    sampleUrl: `${SAMPLES_B}/health-insurance-card/insurance-card.png`,
    sampleLabel: "Insurance card",
  },
];
