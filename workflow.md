# RefSense System Workflow

This document outlines the processing workflow of the `RefSense` plugin for Zotero and its interactions with server-side components (`RefServer`). The system automates PDF handling, OCR processing, bibliographic inference, and document fingerprinting.

---

## 🧬 System Components

| Component | Description |
| --------- | ----------- |
|           |             |

| **RefSense**                | Zotero plugin (WebExtension) responsible for orchestrating local PDF handling and server communication |
| --------------------------- | ------------------------------------------------------------------------------------------------------ |
| **RefServer****:OCR**       | OCR service that converts image-based PDFs to text-layered PDFs                                        |
| **RefServer****:LLM**       | Large Language Model API that extracts bibliographic metadata from text                                |
| **RefServer****:Embedding** | Embedding-based fingerprinting service that generates a unique document identifier (UID)               |

---

## 🔁 Processing Flow

### 1. 📅 Input PDF Attachment

A new PDF file is added to Zotero (e.g. via drag-and-drop or file watch).

---

### 2. 🔍 Check for Extractable Text

- **If text exists**:\
  → Proceed to next step with PDF containing embedded text layer.
- **If not**:\
  → PDF is sent to `RefServer:OCR`.\
  → OCR returns a new PDF with embedded text.\
  → RefSense saves this file as a new Zotero attachment or replaces the original.

---

### 3. 🔗 Check for Parent Item

- **If parent item exists**:\
  → Proceed to next step.
- **If not**:\
  → RefSense extracts text and sends it to `RefServer:LLM`.\
  → The server returns bibliographic metadata (`BibInfo`).\
  → RefSense creates a Zotero parent item and links the PDF.

---

### 4. 🆔 Check for Unique Document ID (UID)

- **If UID exists** (e.g., in item.extra):\
  → Processing ends.
- **If not**:\
  → RefSense extracts the full text of the PDF.\
  → Text is sent to `RefServer:Embedding`.\
  → Embedding vectors are computed and averaged.\
  → SHA256 hash of the mean vector becomes the UID.\
  → RefSense stores UID in the Zotero item.

---

## 📦 Data Payloads

### RefServer\:OCR (PDF/image → PDF/text)

```http
POST /ocr
Content-Type: application/pdf

→ Returns: application/pdf with text layer
```

### RefServer\:LLM (Text → BibInfo)

```http
POST /bibinfo
Content-Type: application/json
{
  "text": "Extracted PDF text..."
}

→ Returns:
{
  "title": "...",
  "authors": [...],
  "year": ...,
  ...
}
```

### RefServer\:Embedding (Text → UID)

```http
POST /embed_batch
Content-Type: application/json
{
  "texts": ["page 1 text", "page 2 text", ...]
}

→ Returns:
{
  "embeddings": [[...], [...], ...]
}

→ RefSense computes: UID = SHA256(mean(embeddings))
```

---

## ✅ Output

By the end of the pipeline:

- The PDF has embedded text (via OCR if needed)
- A Zotero item is associated with the file (via LLM if needed)
- A unique identifier (UID) is generated for deduplication/versioning
- Full-text indexing (via Lucene) is triggered by Zotero automatically

---

## 🚧 Future Extensions (Optional Modules)

- `RefServer:Vision` — Image-based figure/caption extraction
- `RefServer:NER` — Taxon or geological term extraction
- `RefServer:Citation` — Reference parsing and citation graph construction

---


