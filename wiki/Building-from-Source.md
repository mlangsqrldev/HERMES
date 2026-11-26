# Building HERMES from Source (Linux, macOS & Windows)

HERMES is built with **Vue 3 + Vite 6** and **Tauri 2 (Rust)**, so it compiles natively for **Linux**, **macOS (Apple Silicon & Intel)**, and **Windows** — and also runs directly in any modern browser without Rust.

---

## Option 0 — Run as a Web App (No Rust Required, Any OS)

If you want to run HERMES on Linux, macOS, or Windows without installing Rust or native toolchains, you can run the browser build directly (with `localStorage` persistence and Web Crypto SHA-256 hashing):

```bash
git clone https://github.com/mlangsqrldev/HERMES.git
cd HERMES
npm install

# Development server (opens in your browser)
npm run dev

# Or build a static web bundle in dist/
npm run build
npm run preview
```

---

## Common Prerequisites (Native Desktop Build)

For native Tauri 2 desktop builds on **all platforms**, install:

1. **Git**
2. **Node.js 20+ (LTS)** and **npm** — https://nodejs.org/
3. **Rust (stable toolchain via `rustup`)**:
   - macOS / Linux:
     ```bash
     curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
     source "$HOME/.cargo/env"
     ```
   - Windows:
     ```powershell
     winget install --id Rustlang.Rustup -e
     ```

Verify both toolchains before building:
```bash
node -v
npm -v
rustc --version
cargo --version
```

---

## 1. Building on Linux

Tauri 2 uses **WebKitGTK 4.1** on Linux. Install the native system dependencies for your distribution first:

### Debian / Ubuntu (22.04 / 24.04+)
```bash
sudo apt update
sudo apt install -y \
  build-essential \
  curl \
  wget \
  file \
  libxdo-dev \
  libssl-dev \
  libayatana-appindicator3-dev \
  librsvg2-dev \
  libwebkit2gtk-4.1-dev
```

### Fedora
```bash
sudo dnf check-update
sudo dnf group install -y "c-development"
sudo dnf install -y \
  webkit2gtk4.1-devel \
  openssl-devel \
  curl \
  wget \
  file \
  libappindicator-gtk3-devel \
  librsvg2-devel
```

### Arch Linux / Manjaro
```bash
sudo pacman -Syu --needed \
  webkit2gtk-4.1 \
  base-devel \
  curl \
  wget \
  file \
  openssl \
  appmenu-gtk-module \
  libappindicator-gtk3 \
  librsvg
```

### Build Commands (Linux)
```bash
git clone https://github.com/mlangsqrldev/HERMES.git
cd HERMES
npm install
npm test

# Full release build (.deb, .rpm, .AppImage)
npm run tauri build

# Or build only the standalone binary without installers:
npm run tauri build -- --no-bundle
```

### Output Artifacts (Linux)
- Standalone executable: `src-tauri/target/release/hermes`
- Debian/Ubuntu package: `src-tauri/target/release/bundle/deb/hermes_*.deb`
- Fedora/RHEL package: `src-tauri/target/release/bundle/rpm/hermes-*.rpm`
- Portable AppImage: `src-tauri/target/release/bundle/appimage/hermes_*.AppImage`

> **Linux AppImage Tip:** On newer distributions (e.g., Arch Linux or Fedora 40+), if `linuxdeploy` fails during `.AppImage` stripping, build with `NO_STRIP=1 npm run tauri build` or target only `.deb`/`.rpm` via `npm run tauri build -- --bundles deb`.

---

## 2. Building on macOS (Apple Silicon & Intel)

### Prerequisites
1. Install **Xcode Command Line Tools**:
   ```bash
   xcode-select --install
   ```
2. Install Node.js (e.g., via Homebrew `brew install node`) and Rust via `rustup` (see above).

### Build Commands (macOS)
```bash
git clone https://github.com/mlangsqrldev/HERMES.git
cd HERMES
npm install
npm test

# Native build for your Mac's architecture (Apple Silicon or Intel)
npm run tauri build
```

### Optional: Universal macOS Binary (Apple Silicon + Intel)
```bash
rustup target add aarch64-apple-darwin x86_64-apple-darwin
npm run tauri build -- --target universal-apple-darwin
```

### Output Artifacts (macOS)
- App bundle: `src-tauri/target/release/bundle/macos/hermes.app`
- Disk image: `src-tauri/target/release/bundle/dmg/hermes_*.dmg`

> **macOS Gatekeeper Note (Unsigned Local Builds):** If you copy a self-built unsigned `hermes.app` to another Mac, macOS may show an *"unidentified developer"* warning. Either right-click → **Open**, or clear the quarantine attribute with:
> ```bash
> xattr -cr /Applications/hermes.app
> ```

---

## 3. Building on Windows (10 / 11, 64-bit)

### Prerequisites
1. **Node.js (LTS)** and **Rustup** (`winget install --id Rustlang.Rustup -e`)
2. **Microsoft Visual Studio 2022 Build Tools** with the **Desktop development with C++** workload (MSVC compiler + Windows SDK)
3. **Microsoft Edge WebView2 Runtime** (preinstalled on Windows 10 / 11)

### Build Commands (Windows PowerShell)
*(Use `npm.cmd` if Windows PowerShell ExecutionPolicy blocks `npm.ps1`.)*
```powershell
git clone https://github.com/mlangsqrldev/HERMES.git
cd HERMES
npm.cmd install
npm.cmd test

# Portable standalone .exe (no installer needed)
npm.cmd run tauri build -- --no-bundle

# Full build including MSI & NSIS installers
npm.cmd run tauri build
```

### Output Artifacts (Windows)
- Portable standalone executable: `src-tauri/target/release/hermes.exe`
- MSI installer: `src-tauri/target/release/bundle/msi/hermes_*.msi`
- NSIS installer: `src-tauri/target/release/bundle/nsis/hermes_*-setup.exe`

---

## Troubleshooting

| Issue | Solution |
| :--- | :--- |
| `cargo: program not found` after installing `rustup` | Open a new terminal or add `$HOME/.cargo/bin` (Windows: `%USERPROFILE%\.cargo\bin`) to `PATH`. |
| Windows PowerShell blocks `npm` (`PSSecurityException`) | Run `npm.cmd` instead of `npm` (e.g., `npm.cmd run tauri build`). |
| Linux missing `webkit2gtk-4.1` on older Ubuntu 20.04 | Tauri 2 requires WebKitGTK 4.1 (available on Ubuntu 22.04+, Debian 12+, Fedora 38+, Arch). Use Ubuntu 22.04+ or run HERMES in Web Mode (`npm run dev`). |
| First Rust compilation takes 2–4 minutes | Normal on the first run while Cargo compiles Tauri 2 crates; subsequent incremental rebuilds finish in seconds. |
