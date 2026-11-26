// @vitest-environment happy-dom
import { describe, it, expect, vi } from "vitest";
import { autoMatchRelations, countFormRelations } from "../src/utils/relationsHelper.js";
import { parseCarareXml } from "../src/utils/carareXmlParser.js";
import { buildBonnDataJson } from "../src/utils/bonndataExporter.js";
import { openExternalUrl } from "../src/utils/platform.js";

describe("v0.1.36 Triple-Agent Audit Remediation Tests", () => {
  it("autoMatchRelations supports both options object and positional arguments", () => {
    const makeFixtures = () => ({
      collectionForm: { id: "COL-1" },
      heritageItems: [
        { "recordInformation.id": "HA-SK740", "appellation.id": "SK 740" },
      ],
      digitalItems: [
        { "recordInformation.id": "DR-SK740-MASTER" },
        { "recordInformation.id": "DR-SK740-LP" },
      ],
      activityItems: [{ "recordInformation.id": "ACT-2026-01" }],
    });

    const f1 = makeFixtures();
    const resObj = autoMatchRelations(f1);
    expect(resObj.createdCount).toBeGreaterThan(0);
    expect(resObj.totalAdded).toBe(resObj.createdCount);
    expect(f1.digitalItems[1].isDerivativeOf).toContain("DR-SK740-MASTER");
    expect(f1.digitalItems[0].isRepresentationOf).toContain("HA-SK740");
    expect(f1.activityItems[0].hasCreated).toContain("DR-SK740-MASTER");

    const f2 = makeFixtures();
    const resPos = autoMatchRelations(
      f2.heritageItems,
      f2.digitalItems,
      f2.activityItems,
      f2.collectionForm,
    );
    expect(resPos.createdCount).toBe(resObj.createdCount);
    expect(resPos.totalAdded).toBe(resObj.totalAdded);
  });

  it("countFormRelations ignores non-XSD isSuccessorOf on activity", () => {
    const count = countFormRelations(
      {
        wasPresentAt: ["HA-1"],
        isSuccessorOf: ["ACT-OLD"],
      },
      "activity",
    );
    expect(count).toBe(1);
  });

  it("carareXmlParser does not fabricate dates, licences, or inject colId into isPartOf", () => {
    const minimalXml = `<?xml version="1.0" encoding="UTF-8"?>
<carareWrap xmlns="http://www.carare.eu/carareSchema">
  <carare id="HA-MIN-1">
    <collectionInformation>
      <id>COL-MIN-1</id>
      <title lang="en" preferred="true">Minimal Collection</title>
    </collectionInformation>
    <heritageAssetIdentification>
      <recordInformation><id>HA-MIN-1</id></recordInformation>
      <appellation><name lang="en" preferred="true">Minimal Asset</name></appellation>
    </heritageAssetIdentification>
  </carare>
</carareWrap>`;

    const parsed = parseCarareXml(minimalXml);
    const ha = parsed.HeritageAsset[0];
    expect(ha["recordInformation.creation.date"]).toBe("");
    expect(ha["recordInformation.metadataRights"]).toBe("");
    expect(ha["recordInformation.country"]).toBe("");
    expect(ha.isPartOf || []).not.toContain("COL-MIN-1");
    expect(ha.id).toBeUndefined();
  });

  it("bonndataExporter maps licences, references, authors, dates, and geospatial cleanly", () => {
    const payload = buildBonnDataJson({
      collectionForm: {
        id: "COL-TEST",
        title: [{ _value: "Test Collection", "title#preferred": true }],
        statement: "Collection abstract.",
        "creation.createdOn": "2026-11-26T10:30:00Z",
        "rights.licence": "https://creativecommons.org/licenses/by-nc-nd/4.0/",
        contacts: [
          {
            name: "Dr. Jane Doe",
            organization: "University of Bonn",
            email: "jane.doe@uni-bonn.de",
          },
        ],
      },
      heritageItems: [
        {
          "recordInformation.id": "HA-1",
          "appellation.name": [{ _value: "Ancient Statue" }],
          actors: [{ name: "Polyklet (Ancient Sculptor)", actorType: "person" }],
          references: [
            {
              "appellation.name": "Lehner, M.: Complete Pyramids",
              "appellation.id": "10.60507/FK2/TEST",
              link: "https://doi.org/10.60507/FK2/TEST",
            },
          ],
          spatial: [
            {
              "locationSet.address.country": "DE",
              "locationSet.address.townOrCity": "Bonn",
              "geometry.quickpoint.y": "50.7339",
              "geometry.quickpoint.x": "7.1025",
            },
          ],
        },
      ],
      digitalItems: [],
      activityItems: [
        {
          "recordInformation.id": "ACT-1",
          actors: [{ name: "Max Mustermann", actorType: "person" }],
        },
      ],
    });

    const dv = payload.datasetVersion;
    expect(dv.license.name).toBe("CC BY-NC-ND 4.0");

    const citationFields = dv.metadataBlocks.citation.fields;
    const authorField = citationFields.find((f) => f.typeName === "author");
    const authorNames = authorField.value.map((a) => a.authorName.value);
    expect(authorNames).not.toContain("Polyklet (Ancient Sculptor)");
    expect(authorNames).toContain("Max Mustermann");

    const pubField = citationFields.find((f) => f.typeName === "publication");
    expect(pubField).toBeDefined();
    expect(pubField.value[0].publicationCitation.value).toBe(
      "Lehner, M.: Complete Pyramids",
    );
    expect(pubField.value[0].publicationCitation.value).not.toContain(
      "[object Object]",
    );
    expect(pubField.value[0].publicationIDType.value).toBe("doi");

    const prodDate = citationFields.find((f) => f.typeName === "productionDate");
    expect(prodDate.value).toBe("2026-11-26");

    const geoFields = dv.metadataBlocks.geospatial?.fields || [];
    const geoCov = geoFields.find((f) => f.typeName === "geographicCoverage");
    expect(geoCov.value[0].country.value).toBe("Germany");
    expect(geoCov.value[0].city.value).toBe("Bonn");

    const bbox = geoFields.find((f) => f.typeName === "geographicBoundingBox");
    expect(bbox.value[0].northLatitude.value).toBe("50.7339");
    expect(bbox.value[0].eastLongitude.value).toBe("7.1025");
  });

  it("openExternalUrl blocks unsafe protocols like javascript: and file:", async () => {
    const openSpy = vi.spyOn(window, "open").mockImplementation(() => null);
    await openExternalUrl("javascript:alert(1)");
    await openExternalUrl("file:///C:/Windows/win.ini");
    expect(openSpy).not.toHaveBeenCalled();

    await openExternalUrl("https://www.bcdh.uni-bonn.de/");
    expect(openSpy).toHaveBeenCalledWith(
      "https://www.bcdh.uni-bonn.de/",
      "_blank",
      "noopener,noreferrer",
    );
    openSpy.mockRestore();
  });
});
