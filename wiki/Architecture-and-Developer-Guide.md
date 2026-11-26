# Architecture & Developer Guide

This guide covers the HERMES codebase architecture, tooling, testing, schema validation, and desktop release packaging.

---

## 1. Tech Stack

| Layer | Technology |
| :--- | :--- |
| **UI Framework** | Vue 3 (`<script setup>` Composition API) |
| **Build Tool** | Vite 6 (`@vitejs/plugin-vue`) |
| **Styling** | Tailwind CSS v4 (`@tailwindcss/vite`) + DaisyUI v5 (`theme-change`) |
| **Desktop Runtime** | Tauri 2 (Rust, `tauri-plugin-dialog`, `tauri-plugin-fs`, `tauri-plugin-opener`, `tauri-plugin-store`) |
| **Maps & Documents** | Leaflet 1.9, JSZip 3.10, jsPDF 4.2, Marked 18 |
| **Testing** | Vitest 5 (`happy-dom` environment) |

---

## 2. Repository Structure

```text
HERMES/
├── src/
│   ├── App.vue                         # Main shell, 6-step workflow, XML serializer, BagIt & template modals
│   ├── main.js                         # Vue bootstrap
│   ├── style.css                       # Tailwind v4 + DaisyUI v5 styles
│   ├── assets/
│   │   ├── schema_dictionary.json      # CARARE field definitions, labels (DE/EN), status & tooltips
│   │   └── default_templates.json      # Built-in starter templates
│   ├── output_components/
│   │   ├── CollectionInformationCrud.vue       # Step 1: Collection
│   │   ├── HeritageAssetIdentificationCrud.vue # Step 2: Heritage Assets
│   │   ├── DigitalResourceCrud.vue             # Step 3: Digital Resources
│   │   └── ActivityCrud.vue                    # Step 4: Activities & DAP
│   ├── components/                     # 33 modular UI components (Relations UI, 3D Metadata, Pickers, Autocompletes, Modals)
│   └── utils/
│       ├── bonndataExporter.js         # Dataverse / BonnData JSON builder & API helper
│       ├── carareXmlParser.js          # CARARE 2.0.6 XML parser & cross-linker
│       ├── hector3dVocab.js            # HECTOR 3D & IPTC vocabulary helpers
│       ├── markdownReportGenerator.js  # Scholarly Markdown & jsPDF report generator
│       ├── platform.js                 # Tauri vs. Browser runtime abstraction (getAppStore, openExternalUrl)
│       ├── relationsHelper.js          # Bidirectional CARARE relations, health check & Auto-Match
│       ├── sharedState.js              # Global rights, language, pools, GND dedup & JSON backup/restore
│       ├── termResolver.js             # Term URI resolver (HECTOR / AAT / PeriodO)
│       ├── tooltips.js                 # Bilingual tooltip loader (reads root tooltips_uebersetzung.json)
│       └── vocabHistory.js             # Local vocabulary lookup helper
├── src-tauri/
│   ├── Cargo.toml                      # Rust crate & Tauri 2 plugin dependencies
│   ├── tauri.conf.json                 # App identity, window config & build hooks
│   └── src/
│       ├── main.rs                     # Tauri commands: generate_bag_hashes, open_manual_window, crash logger
│       └── lib.rs                      # Library crate stub
├── public/
│   ├── manual.html                     # Embedded bilingual scholarly manual (DE/EN, CJK-ready)
│   ├── hermes-logo.svg                 # Favicon
│   ├── hermes-vase-icon.png            # App header signet
│   └── CARARE_Phantasie_Kollektion_3D_Master_und_Derivate.xml  # Built-in Demo Project
├── samples/                            # Sample CARARE 2.0.6 XML datasets (e.g. Giza Pyramid)
├── CARARE/                             # Official carare-v2.0.6.xsd schema, PDFs & reference XMLs
├── tests/                              # Vitest unit & roundtrip test suites
├── wiki/                               # GitHub-Wiki-compatible documentation
└── HERMES_Windows_Release_Package/     # Portable Windows release (.exe, standalone manual, LIESMICH.txt)
```

---

## 3. Runtime Abstraction (`src/utils/platform.js`)

HERMES runs identically in Tauri desktop mode and in standard browsers:
- **`isTauri()`**: Detects the Tauri 2 IPC bridge (`window.__TAURI_INTERNALS__`).
- **`getAppStore(filename)`**: Uses `@tauri-apps/plugin-store` in desktop mode and a `try/catch`-guarded `BrowserStore` (`localStorage`) in web mode.
- **`openExternalUrl(url)`**: Opens external authority links (IPTC, HECTOR, GND, ORCID) via `@tauri-apps/plugin-opener` in desktop mode or `window.open(..., "_blank", "noopener,noreferrer")` in web mode.

---

## 4. Testing & Schema Validation

### Automated Test Suite (Vitest)
```bash
npm test
# On Windows PowerShell with restricted ExecutionPolicy:
npm.cmd test
```

Current test suites in `tests/`:
- `tests/relationsHelper.test.js` — Bidirectional linking, orphan/health analysis, 30-asset batch Auto-Match idempotency, form counters
- `tests/carareRoundtrip.test.js` — CARARE XML parsing & `samples/pyramide_gizeh_carare_2.0.6.xml` roundtrip
- `tests/bugfixesV0132.test.js` — Entity pool separation, GND duplicate prevention, backup/restore, `format` array normalization
- `tests/hectorAndTooltips.test.js` — HECTOR vocabulary & tooltip loading
- `tests/pdfReport.test.js` — Scholarly PDF report generation

### Validating Exported XML Against `carare-v2.0.6.xsd`
With Python `lxml` installed:
```bash
python -c "import lxml.etree as ET; s = ET.XMLSchema(ET.parse('CARARE/carare-v2.0.6.xsd')); d = ET.parse('samples/pyramide_gizeh_carare_2.0.6.xml'); print('Valid:', s.validate(d), s.error_log)"
```

---

## 5. Building a Windows Standalone Release

### Prerequisites
- Node.js (LTS) + npm
- Rust toolchain (`rustup`, `cargo`, `rustc`)
- Microsoft Visual Studio 2022 C++ Build Tools

### Release Checklist
1. Bump version in:
   - `package.json`
   - `src-tauri/tauri.conf.json`
   - `src-tauri/Cargo.toml`
   - `src/App.vue` (header version badge)
   - `public/manual.html` (and copy to `HERMES_Windows_Release_Package/HERMES_Handbuch_Manual.html`)
   - `HERMES_Windows_Release_Package/LIESMICH.txt`
2. Run tests and compile the standalone Windows executable:
   ```powershell
   npm.cmd test
   npm.cmd run tauri build -- --no-bundle
   ```
3. Copy `src-tauri\target\release\hermes.exe` to `HERMES_Windows_Release_Package\HERMES_vX.Y.Z_YYYY-MM-DD.exe`.
4. Note on DaisyUI v5 + Tailwind CSS v4: never add Tailwind's `flex` utility directly to `.dropdown-content` elements (it overrides DaisyUI's `display: none` cascade). Use explicit Vue `v-if` state for dropdown popovers (see `LanguageBadgePicker.vue`).
