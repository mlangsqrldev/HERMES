# Getting Started

HERMES runs either as a **portable standalone Windows desktop executable** (no installation required) or in any modern browser during development.

---

## 1. Running the Desktop Application (Windows)

1. Open `HERMES_Windows_Release_Package/`.
2. Double-click `HERMES_v0.1.36_2026-11-26.exe`.
   - Requirements: 64-bit Windows 10 or Windows 11 with Microsoft Edge WebView2 Runtime (preinstalled on modern Windows).
3. Click **Manual / Handbuch** in the top header at any time to open the embedded bilingual scholarly manual in a dedicated desktop window.

> **Clean Start Behavior (`v0.1.34`+):** HERMES always opens with clean empty forms so stale drafts cannot block a new session. Your central **Persons, Organizations, Collections, Software, and Equipment pools** as well as saved **Templates** and **Global Rights** remain preserved across restarts.

---

## 2. Running from Source (Developers)

```bash
# 1. Install frontend dependencies
npm install

# 2a. Start browser development server (Vite)
npm run dev

# 2b. Start full Tauri 2 desktop application (requires Rust + MSVC Build Tools on Windows)
npm run tauri dev
```

On Windows PowerShell where script execution policy restricts `npm.ps1`, invoke `npm.cmd` (e.g., `npm.cmd run dev`, `npm.cmd test`, `npm.cmd run build`).

> **Building on Linux or macOS?** See the dedicated **[Building from Source (Linux, macOS & Windows)](Building-from-Source.md)** guide for exact system packages (`webkit2gtk-4.1`, Xcode Command Line Tools, `.deb`/`.rpm`/`.AppImage`, `.app`/`.dmg`, Universal macOS binaries, and Rust-free Web mode).

---

## 3. Global Header Bar (Set Once per Project)

Before entering records, configure your project defaults once in the top bar (`GlobalDefaultsBar.vue`):

- **UI Language (`DE` / `EN`)**: Switches all interface labels, tooltips, and validation hints.
- **Metadata Language**: Sets the default `lang` attribute applied to multilingual XML elements (`<name lang="...">`, `<title lang="...">`, `<description lang="...">`).
- **Global Rights (`RightsSettingsModal.vue`)**: Configure the three core fields (**License**, **Access Rights**, **Rights Holder / Credit Line**) or pick a 1-click preset (e.g., `CC BY 4.0 + Open Access`) and apply them to all records. Rarely used rights fields remain tucked under *Advanced global fields*.
- **Central Pools**: Manage reusable **Persons**, **Organizations** (with GND deduplication), **Collections**, **Software**, and **Equipment**, including 1-click **JSON Pool Backup / Restore**.
- **Load Demo / Load CARARE XML**: Import an existing CARARE 2.0.6 XML or BagIt ZIP, or load the bundled demo project to explore all features immediately.

---

## 4. The 6-Step Metadata Workflow

HERMES guides you linearly from top to bottom with a live traffic-light quality indicator in the left sidebar:

1. **Step 1 — Collection (`collectionInformation`)**: Define the project umbrella (ID, title, data provider institution via GND, contacts, temporal/spatial coverage).
2. **Step 2 — Heritage Asset (`heritageAssetIdentification`)**: Document each physical monument or museum object (inventory number, HECTOR type/material, dimensions, dating, findspot/map, historical creators, bibliographic references).
   - Note: `repositoryLocation` (where the object is physically kept) is cleanly separated from `collectionInstitution` (the data provider); use the optional **"Adopt from collection"** button when both are identical.
   - Tip: Click **🖥️ +3D** on any saved asset to create a pre-linked Digital Resource immediately.
3. **Step 3 — Digital Resource (`digitalResource`)**: Document each 3D archival master (`.obj`, `.ply`, `.e57`) and web/realtime derivative (`.glb`). Drop a local 3D file into the Inspector to extract geometry/format metadata automatically, or click **📑 Derivative** to clone a Master into a Web-GLB derivative.
4. **Step 4 — Activities (`activity`)**: Record the digitization campaign(s) — team actors & multi-roles, acquisition method (SfM / SLS / TLS), hardware & software, processing steps, IPTC AI disclosures, and the **5-dimension Digital Authenticity Profile (DAP)**.
5. **Step 5 — Relations (`relations`)**: Assign object hierarchies (`partOf`) and link every Digital Resource to its Heritage Asset, Master (if derivative), and producing Activity in one unified view — or click **Auto-Match**.
6. **Step 6 — Archival Package (`files`)**: Optionally hash a local project directory (SHA-256 via Rust streaming), inspect the **Live XML Preview**, and export CARARE XML, split XML ZIP, BagIt ZIP, scholarly PDF report, or publish directly to **BonnData**.
