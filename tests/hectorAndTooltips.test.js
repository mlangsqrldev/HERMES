import { describe, it, expect } from "vitest";
import tooltipsData from "../tooltips_uebersetzung.json";
import { getTooltipText } from "../src/utils/tooltips.js";
import { IPTC_AI_TERMS, CURATED_HECTOR_3D_TERMS } from "../src/utils/hector3dVocab.js";
import { buildBonnDataJson } from "../src/utils/bonndataExporter.js";

describe("Central Tooltips Dictionary", () => {
  it("has zero missing DE or EN translations for all UI-active tooltips", () => {
    const modules = ["CollectionInformation", "HeritageAsset", "DigitalResource", "Activity", "Components"];
    const missing = [];
    for (const mod of modules) {
      for (const [key, entry] of Object.entries(tooltipsData[mod] || {})) {
        if (entry.used_in_ui) {
          if (!entry.de || !entry.de.trim()) missing.push(`${mod}.${key} (de)`);
          if (!entry.en || !entry.en.trim()) missing.push(`${mod}.${key} (en)`);
        }
      }
    }
    expect(missing).toEqual([]);
  });

  it("resolves DE and EN tooltip texts cleanly via getTooltipText", () => {
    expect(getTooltipText("CollectionInformation", "id", "de")).toContain("Kennung");
    expect(getTooltipText("CollectionInformation", "id", "en")).toContain("identifier");
    expect(getTooltipText("Components", "3d.fileSize", "de")).toContain("Dateigröße");
  });
});

describe("HECTOR 3D & IPTC AI Vocabulary", () => {
  it("exposes all 3 IPTC Digital Source Type terms with valid HECTOR 3D URIs", () => {
    expect(IPTC_AI_TERMS).toHaveLength(3);
    for (const item of IPTC_AI_TERMS) {
      expect(item.uri).toMatch(/^http:\/\/vocabs\.bcdh\.uni-bonn\.de\/hector_3d_documentation\/concept_/);
      expect(item.iptcUri).toMatch(/^http:\/\/cv\.iptc\.org\/newscodes\/digitalsourcetype\//);
    }
    expect(CURATED_HECTOR_3D_TERMS.length).toBeGreaterThanOrEqual(15);
  });
});

describe("BonnData / Dataverse Payload Builder", () => {
  it("places metadataLanguage at top-level next to datasetVersion", () => {
    const payload = buildBonnDataJson({
      collectionForm: {
        id: "COL_1",
        title: [{ _value: "Test", "title#lang": "en" }],
        source: "BCDH",
      },
      heritageItems: [],
      digitalItems: [],
      activityItems: [],
      defaultMetadataLanguage: "en",
      metadataLanguage: "en",
    });
    expect(payload.metadataLanguage).toBe("en");
    expect(payload.datasetVersion).toBeDefined();
  });
});
