# Changelog

Consolidated release history for **HERMES (Heritage Metadata Entry System)**.

---

## `v0.1.34` (2026-11-25) — Two-List Relations UI, Simplified Rights & Clean Start
- **Relations & Assignment UI (`RelationsGraphEditor.vue`)**: Streamlined into a clean Two-List layout — (1) Object Hierarchy (`partOf` dropdown per Heritage Asset) and (2) Full-width Digital Resource rows with stacked selectors for Heritage Asset (`isRepresentationOf`), Master (`isDerivativeOf`), and **per-resource Activity** (`hasCreated`).
- **Consistency Check (`relationsHelper.js`)**: `analyzeRelationsHealth` accounts for `partOf` and `replicaOf` links alongside `hasRepresentation` and `wasDigitizedBy`.
- **Simplified Global Rights (`RightsSettingsModal.vue`)**: Focused on 3 core fields (License, Access Rights, Rights Holder / Credit Line) with presets; rarely used fields moved under *Advanced global fields*.
- **Clean Empty Start**: Removed silent auto-restoration of stale `hermes_session_draft_v1` drafts and removed cluttered "Recently used" chip bars.
- **Repository Separation**: Separated `repositoryLocation` (physical repository of a Heritage Asset) from `collectionInstitution` (Collection data provider), keeping optional 1-click *"Adopt from collection"*.
- **EPSG & 3D Fixes**: Migrated EPSG lookup to `spatialreference.org` with offline fallback; fixed Point Cloud formatting and English labels.
- **Dropdown & Modal Hardening**: Fixed `blurActiveElement()` language-badge `TypeError`, widened language dropdowns (`w-36`, `z-[60]`), fixed Spatial/Temporal modal opening, responsive 2-column contact editor, and `getAppStore()` browser fallback.
- **Sample Dataset**: Added `samples/giza_pyramid_carare_2.0.6.xml` (10 hierarchical Heritage Assets, 20 Digital Resources, 1 Activity) with roundtrip test coverage.
- **Code Review & Wiki (2026-11-26)**: Removed 30+ unused legacy/mock/asset files (~2.6 MB), standardized all code comments across `src/` and `src-tauri/` to English, and established the structured `wiki/` documentation.

---

## `v0.1.33` (2026-11-24) — Central Relations Step & Manual Redesign
- **Step 5 Relations**: Moved complex relation management out of Modules 1–4 into a dedicated Step 5 before Archival Package export; added `RelationsPanelCollapse.vue` to collapse inline `*DcRelations` panels with a direct jump link and expandable expert view.
- **Bilingual Manual Redesign (`public/manual.html`)**: Full editorial redesign (14 sections, 3 inline SVG architecture/relations diagrams, live search, light/dark themes, CJK font stack ready for Japanese localization).
- **CARARE Bibliographic References**: Confirmed 100% XSD conformance against `carare-v2.0.6.xsd` and added sequential `REF-N` fallback IDs when DOI is omitted.

---

## `v0.1.32` (2026-11-20 → 2026-11-24) — UX Overhaul, BonnData & Practice-Test Bugfixes
- **3D Scaling & Georeferencing**, Save-All workflow, and **BonnData / Dataverse** collection picker (`BonnDataExportModal.vue`, `bonndataExporter.js`).
- **Practice-Test Bugfixes (2026-11-24)**:
  - Fixed `LanguageBadgePicker.vue` DaisyUI v5 / Tailwind v4 `.dropdown-content.flex` click-trap affecting IPTC & DAP controls; routed `IPTC ↗` / `HECTOR ↗` through Tauri `openExternalUrl`.
  - Separated Organizations from Persons (`isOrganizationEntity()`) and added GND-normalized duplicate detection in `OrganizationPickerModal.vue`.
  - Replaced unresponsive `<datalist>` contact role input with a native `<select>` + custom option for Windows WebView2.
  - Guarded all `localStorage` writes (`safeSetStorage`), fixed `cloneAsWebDerivative` `format` array type, debounced Live XML only while open (`600 ms`), enlarged & made all template modals searchable/scrollable, and added 1-click **Pool Backup / Restore (JSON)**.

---

## `v0.1.31` (2026-11-17) — HECTOR 3D/IPTC, CARARE Cleanup & Scholarly PDF Report
- Added HECTOR 3D & IPTC AI toggle controls in `ActivityCrud.vue`.
- Enhanced CARARE XML cleanup, 3D state reset, and scholarly PDF report generator (`markdownReportGenerator.js`, `tests/pdfReport.test.js`).

---

## `v0.1.30` (2026-11-17) — Senior IT Audit Fixes
- Improved template modal ergonomics, global rights inheritance, and workflow step counters.

---

## `v0.1.11` – `v0.1.29` (2026) — DAP, Authority APIs & Live XML
- Introduced the 5-dimension **Digital Authenticity Profile (DAP)** serialized as CARARE `<consistsOf>` blocks.
- Integrated live HECTOR SKOSMOS, GND (lobid), ORCID, PeriodO, Pleiades, GeoNames, and Leaflet map pickers.
- Added resizable Live XML Split-Screen Inspector, native Rust SHA-256 BagIt hashing (`generate_bag_hashes`), and embedded desktop manual window (`open_manual_window`).

---

## `v0.1.5` – `v0.1.6` (Early Releases)
- Core 4-pillar CARARE 2.0.6 CRUD forms (Collection, Heritage Asset, Digital Resource, Activity), bilingual DE/EN interface, and initial BagIt / CARARE XML export.
