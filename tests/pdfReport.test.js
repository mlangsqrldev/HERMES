import { describe, it, expect } from "vitest";
import { generatePdfReport } from "../src/utils/markdownReportGenerator.js";

describe("PDF Report (generatePdfReport)", () => {
  it("transfers Collection, HeritageAsset, DigitalResources (Master + Derivatives), consistsOf (AI/IPTC), and DAP 1-5 without missing data", () => {
    const allData = {
      Collection: [
        {
          "recordInformation.id": "COL-AKM-2026",
          "recordInformation.source": "Akademisches Kunstmuseum Bonn",
          "appellation.id": "DE-MUS-AKM",
          "appellation.name": [{ _value: "Antike Skulpturen", "appellation.name#lang": "de", "appellation.name#preferred": true }],
          description: "Digitalisierte Skulpturen der Antikensammlung.",
          statement: "Leitbild 3D-Dokumentation",
          keywords: [{ _value: "Photogrammetry", "#termUID": "https://hector.bcdh.uni-bonn.de/Soft_Photo" }],
          contacts: [{ name: "Dr. Anna Becker", role: "Leitung", organization: "AKM Bonn", email: "becker@uni-bonn.de" }],
          "rights.licence": "https://creativecommons.org/licenses/by/4.0/deed.de",
        },
      ],
      HeritageAsset: [
        {
          "recordInformation.id": "HA-AKM-001",
          "appellation.id": "Inv. B 123",
          "appellation.name": [{ _value: "Grabrelief", "appellation.name#lang": "de", "appellation.name#preferred": true }],
          "characters.monumentType": "Grabrelief",
          "characters.materials": "Marmor",
          "characters.temporal": [{ periodName: "Spaetklassik", "timeSpan.startDate": "-0400", "timeSpan.endDate": "-0323" }],
          "characters.dimensions": [{ type: "Artefakt", dimension: "Hoehe", value: "118.5", unit: "cm" }],
          repositoryLocation: "Akademisches Kunstmuseum Bonn",
          "characters.description": "Attisches Grabrelief aus pentelischem Marmor.",
        },
      ],
      DigitalResource: [
        {
          "recordInformation.id": "DR-1",
          "appellation.name": [{ _value: "High-Poly Master", "appellation.name#lang": "de", "appellation.name#preferred": true }],
          type: "3D-Modell",
          format: "model/obj",
          extentList: ["File Size: 480 MB", "Polygon Count: 2.000.000 Faces"],
          softwareList: [{ name: "RealityCapture", version: "1.4", role: "SfM" }],
          isRepresentationOf: ["HA-AKM-001"],
          "rights.licence": "CC BY 4.0",
        },
        {
          "recordInformation.id": "DR-4",
          "appellation.name": [{ _value: "KI-Animation Turntable", "appellation.name#lang": "de", "appellation.name#preferred": true }],
          type: "Film",
          format: "video/mp4",
          extentList: ["File Size: 45 MB"],
          isRepresentationOf: ["HA-AKM-001"],
          isDerivativeOf: ["DR-1"],
          "rights.licence": "CC BY 4.0",
        },
      ],
      Activity: [
        {
          "recordInformation.id": "ACT-AKM-001",
          "appellation.name": [{ _value: "3D-Kampagne AKM", "appellation.name#lang": "de", "appellation.name#preferred": true }],
          eventType: "3D-Digitalisierung",
          temporal: [{ "timeSpan.startDate": "2026-11-10", "timeSpan.endDate": "2026-11-17" }],
          actors: [{ name: "Matthias Lang", roles: "3D-Operator", organization: "BCDH" }],
          wasPresentAt: ["HA-AKM-001"],
          hasCreated: ["DR-1", "DR-4"],
          consistsOf: [
            {
              hadSpecificPurpose: "KI-Texturergaenzung linke Wange",
              startDate: "2026-11-15",
              endDate: "2026-11-16",
              methods: "KI-Inpainting (Texturergaenzung)",
              techniques: "IPTC Digital Source Type: compositeWithTrainedAlgorithmicMedia",
              materials: "Albedo-Map 8K; Prompt: pentelischer Marmor",
              equipment: "Stable Diffusion XL Inpaint",
            },
            {
              isDap: true,
              dapId: "DAP-1",
              hadSpecificPurpose: "Dimension 1 von 5 (DAP-1)",
              methods: "Feine Rissbildung und Bestossungen dokumentiert.",
              "methods#termUID": "http://hector.org/vocab/dap/DAP-1",
            },
            {
              isDap: true,
              dapId: "DAP-5",
              hadSpecificPurpose: "Dimension 5 von 5 (DAP-5)",
              methods: "Alle sichtbaren Spuren massstabsgetreu abgebildet.",
              "methods#termUID": "http://hector.org/vocab/dap/DAP-5",
            },
          ],
        },
      ],
    };

    const doc = generatePdfReport(allData, "de");
    const pdfRaw = doc.output("datauristring");
    expect(pdfRaw.startsWith("data:application/pdf")).toBe(true);

    // Inspect internal jsPDF page streams for key transferred content
    const pagesText = doc.internal.pages.slice(1).map((p) => p.join("\n")).join("\n");
    expect(pagesText).toContain("Akademisches Kunstmuseum Bonn");
    expect(pagesText).toContain("Antike Skulpturen");
    expect(pagesText).toContain("118.5");
    expect(pagesText).toContain("RealityCapture");
    expect(pagesText).toContain("DERIVAT \\(FILM\\)");
    expect(pagesText).toContain("KI-Inpainting");
    expect(pagesText).toContain("compositeWithTrainedAlgorithmicMedia");
    expect(pagesText).toContain("Feine Rissbildung und Bestossungen dokumentiert.");
    expect(pagesText).toContain("Alle sichtbaren Spuren massstabsgetreu abgebildet.");
    expect(pagesText).not.toContain("HERMES v0.1.6");
  });
});
