# Exports, Checksums, Reports & BonnData Integration

Step 6 (**Archival Package**) and the top toolbar turn your project metadata into archival-grade outputs.

---

## 1. Live XML Split-Screen Preview (`LiveXmlPreview.vue`)

- Toggleable side-by-side split-screen panel with resizable width (persisted in `hermes_xml_panel_width`).
- Uses a debounced refresh (`600 ms`) that runs **only while the preview is open**, keeping typing fast even with 30–100+ records.
- Shows live record counts, syntax-highlighted CARARE 2.0.6 XML, and quick section navigation.

---

## 2. Export Formats

| Output | Description | Implementation |
| :--- | :--- | :--- |
| **Combined CARARE 2.0.6 XML** | Single `<carareWrap>` XML file containing Collection, all Heritage Assets, all Digital Resources, and all Activities | `src/App.vue` (`buildXml`) |
| **Split Single-Record XML ZIP** | ZIP archive with one standalone `CARARE_<ID>.xml` file per record for aggregators requiring per-entity ingest | `src/App.vue` (JSZip) |
| **BagIt Archive (RFC 8493) ZIP** | Standard archival package including `bagit.txt`, `bag-info.txt`, `manifest-sha256.txt`, `tagmanifest-sha256.txt`, and CARARE metadata | `src/App.vue` + Rust `generate_bag_hashes` (`src-tauri/src/main.rs`) |
| **Scholarly PDF & Markdown Report** | Print-ready, structured project report (Collection overview, Heritage Assets, Master & Derivative 3D resources, Activities, and full 5-dimension DAP) with internal jump links & pagination | `src/utils/markdownReportGenerator.js` (jsPDF) |
| **BonnData / Dataverse Export** | Direct API upload or JSON download mapped to Dataverse citation/geospatial/archaeology metadata blocks, with Dataverse collection picker | `src/utils/bonndataExporter.js`, `src/components/BonnDataExportModal.vue` |
| **JSON Templates (Single / Module / All)** | Export and import reusable field or record templates across team members (`hermes-templates-v1`) | `src/App.vue` + CRUD template modals |

---

## 3. Native Rust SHA-256 Streaming (Desktop Mode)

When hashing large 3D project folders (multi-gigabyte `.obj`, `.ply`, `.e57`, and RAW photo directories) in the Windows desktop app:

- The frontend invokes the async Tauri command `generate_bag_hashes(base_dir)` in `src-tauri/src/main.rs`.
- Rust walks the directory with `walkdir`, streams files in `4 MiB` chunks via `tokio::fs::File` and `sha2::Sha256`, normalizes relative paths to forward slashes for RFC 8493 manifests, and emits live `hash-progress` events back to the Vue UI.
- In browser mode, HERMES falls back seamlessly to Web Crypto (`crypto.subtle.digest("SHA-256", ...)`).

---

## 4. Importing Existing CARARE XML & BagIt Packages

Click **Load CARARE File** in the top header to import either:
- A standalone CARARE 2.0.6 `.xml` file, or
- A BagIt `.zip` archive (HERMES automatically locates the CARARE XML inside the archive).

Parsing is handled by `src/utils/carareXmlParser.js`, which reconstructs all four modules, cross-links Master/Derivative resources and relations, and populates the form lists cleanly.
