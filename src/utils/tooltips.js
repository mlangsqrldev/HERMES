import tooltipsData from "../../tooltips_uebersetzung.json";

/**
 * Returns the localized tooltip text for a module field from the central
 * tooltips_uebersetzung.json dictionary.
 */
export function getTooltipText(moduleName, path, lang = "de", fallback = "") {
  const entry = tooltipsData?.[moduleName]?.[path];
  if (!entry) return fallback;
  const key = lang === "de" ? "de" : "en";
  return entry[key] || fallback;
}
