import { load } from "@tauri-apps/plugin-store";
import { openUrl } from "@tauri-apps/plugin-opener";
import defaultTemplates from "../assets/default_templates.json";

export const isTauri = () => {
  return typeof window !== "undefined" && Boolean(window.__TAURI_INTERNALS__);
};

export const openExternalUrl = async (url) => {
  if (!url) return;
  let parsedUrl;
  try {
    parsedUrl = new URL(String(url).trim());
  } catch {
    console.warn("Blocked invalid external URL:", url);
    return;
  }
  if (!["https:", "http:", "mailto:"].includes(parsedUrl.protocol)) {
    console.warn("Blocked unsafe URL protocol:", parsedUrl.protocol);
    return;
  }
  const safeHref = parsedUrl.href;
  try {
    if (isTauri()) {
      await openUrl(safeHref);
    } else {
      window.open(safeHref, "_blank", "noopener,noreferrer");
    }
  } catch (e) {
    console.warn(
      "Failed to open URL with Tauri opener, falling back to window.open:",
      e,
    );
    window.open(safeHref, "_blank", "noopener,noreferrer");
  }
};

const cloneDefaults = () =>
  defaultTemplates ? JSON.parse(JSON.stringify(defaultTemplates)) : {};

class BrowserStore {
  constructor(name = "templates.json") {
    this.name = name;
  }

  _getData() {
    try {
      const stored = localStorage.getItem(`hermes_${this.name}`);
      if (stored) {
        return JSON.parse(stored);
      }
      if (this.name === "templates.json" && defaultTemplates) {
        try {
          localStorage.setItem(
            `hermes_${this.name}`,
            JSON.stringify(defaultTemplates),
          );
        } catch (e) {
          console.warn("Failed to seed default templates in localStorage:", e);
        }
        return cloneDefaults();
      }
      return {};
    } catch {
      return this.name === "templates.json" && defaultTemplates
        ? cloneDefaults()
        : {};
    }
  }

  async get(key) {
    const data = this._getData();
    return data[key] !== undefined ? data[key] : null;
  }

  async set(key, val) {
    const data = this._getData();
    data[key] = val;
    try {
      localStorage.setItem(`hermes_${this.name}`, JSON.stringify(data));
    } catch (e) {
      console.warn(`BrowserStore failed to persist "${this.name}":`, e);
    }
  }

  async save() {
    // Already persisted to localStorage
  }

  async keys() {
    return Object.keys(this._getData());
  }
}

export const getAppStore = async (
  name = "templates.json",
  options = { autoSave: true },
) => {
  if (isTauri()) {
    try {
      return await load(name, options);
    } catch (e) {
      console.warn(
        "Tauri store load failed, falling back to browser storage:",
        e,
      );
      return new BrowserStore(name);
    }
  }
  return new BrowserStore(name);
};
