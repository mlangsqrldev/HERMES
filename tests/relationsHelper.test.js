import { describe, it, expect } from "vitest";
import {
  getRecordId,
  getRecordTitle,
  toggleAssetResourceLink,
  toggleMasterDerivativeLink,
  toggleAssetActivityLink,
  toggleResourceActivityLink,
  toggleAssetPartLink,
  toggleAssetReplicaLink,
  syncCollectionRelations,
  extractAllEdges,
  analyzeRelationsHealth,
  normalizeMatchStem,
  autoMatchRelations,
  countFormRelations,
} from "../src/utils/relationsHelper.js";

describe("relationsHelper (Graphical Relations Editor & Auto-Match)", () => {
  it("resolves canonical IDs and preferred titles cleanly", () => {
    const ha = {
      "recordInformation.id": "HA-SK740",
      "appellation.name": [
        { _value: "Stele of Nikarete", preferred: false },
        { _value: "Grabstele der Nikarete", preferred: true },
      ],
    };
    expect(getRecordId(ha)).toBe("HA-SK740");
    expect(getRecordTitle(ha)).toBe("Grabstele der Nikarete");
  });

  it("toggles bidirectional HeritageAsset <-> DigitalResource links cleanly", () => {
    const ha = { "recordInformation.id": "HA-SK740" };
    const dr = { "recordInformation.id": "DR-SK740-MASTER" };

    const linkRes = toggleAssetResourceLink(ha, dr);
    expect(linkRes).toEqual({ changed: true, action: "linked" });
    expect(dr.isRepresentationOf).toEqual(["HA-SK740"]);
    expect(ha.hasRepresentation).toEqual(["DR-SK740-MASTER"]);

    // Second toggle unlinks both sides
    const unlinkRes = toggleAssetResourceLink(ha, dr);
    expect(unlinkRes).toEqual({ changed: true, action: "unlinked" });
    expect(dr.isRepresentationOf).toEqual([]);
    expect(ha.hasRepresentation).toEqual([]);
  });

  it("toggles Master <-> Derivative, Asset <-> Activity, Resource <-> Activity, Part & Replica links", () => {
    const ha1 = { "recordInformation.id": "HA-01" };
    const ha2 = { "recordInformation.id": "HA-02" };
    const drMaster = { "recordInformation.id": "DR-01-MASTER" };
    const drWeb = { "recordInformation.id": "DR-01-WEB-GLB" };
    const act = { "recordInformation.id": "ACT-2026-01" };

    expect(toggleMasterDerivativeLink(drMaster, drWeb).changed).toBe(true);
    expect(drMaster.hasDerivative).toEqual(["DR-01-WEB-GLB"]);
    expect(drWeb.isDerivativeOf).toEqual(["DR-01-MASTER"]);

    // Self-link is rejected
    expect(toggleMasterDerivativeLink(drMaster, drMaster).changed).toBe(false);

    expect(toggleAssetActivityLink(ha1, act).changed).toBe(true);
    expect(ha1.wasDigitizedBy).toEqual(["ACT-2026-01"]);
    expect(act.wasPresentAt).toEqual(["HA-01"]);

    expect(toggleResourceActivityLink(drMaster, act).changed).toBe(true);
    expect(act.hasCreated).toEqual(["DR-01-MASTER"]);

    expect(toggleAssetPartLink(ha1, ha2).changed).toBe(true);
    expect(ha1.hasPart).toEqual(["HA-02"]);
    expect(ha2.isPartOf).toEqual(["HA-01"]);

    expect(toggleAssetReplicaLink(ha2, ha1).changed).toBe(true);
    expect(ha2.isReplicaOf).toEqual(["HA-01"]);

    const edges = extractAllEdges([ha1, ha2], [drMaster, drWeb], [act]);
    expect(edges.map((e) => e.type).sort()).toEqual([
      "createdResource",
      "derivative",
      "digitizedAsset",
      "partOf",
      "replicaOf",
    ]);
  });

  it("detects unlinked orphans and missing mandatory isRepresentationOf", () => {
    const ha1 = { "recordInformation.id": "HA-1" };
    const ha2 = { "recordInformation.id": "HA-2" };
    const dr1 = {
      "recordInformation.id": "DR-1",
      isRepresentationOf: ["HA-1"],
    };
    const drOrphan = { "recordInformation.id": "DR-2" };

    const health = analyzeRelationsHealth([ha1, ha2], [dr1, drOrphan], []);
    expect(health.unlinkedAssets.has("HA-1")).toBe(false);
    expect(health.unlinkedAssets.has("HA-2")).toBe(true);
    expect(health.unlinkedResources.has("DR-1")).toBe(false);
    expect(health.unlinkedResources.has("DR-2")).toBe(true);
    expect(health.missingRequiredCount).toBe(1);
    expect(health.orphanCount).toBe(2);
  });

  it("auto-matches 30 heritage assets, master models, web-glb derivatives, single activity, and collection idempotently", () => {
    const heritage = [];
    const digital = [];
    for (let i = 1; i <= 30; i++) {
      const code = `RELIEF_${String(i).padStart(2, "0")}`;
      heritage.push({
        "recordInformation.id": `HA-${code}`,
        "repositoryLocation.inventoryNumber": code,
      });
      digital.push({
        "recordInformation.id": `DR-${code}-MASTER`,
      });
      digital.push({
        "recordInformation.id": `DR-${code}-WEB-GLB`,
      });
    }
    const activities = [{ "recordInformation.id": "ACT-CAMPAIGN-2026" }];
    const collection = { id: "COL-RELIEFS-2026", dcRelation: [] };

    expect(normalizeMatchStem("DR-RELIEF_05-WEB-GLB")).toBe("RELIEF_05");
    expect(normalizeMatchStem("HA-RELIEF_05")).toBe("RELIEF_05");

    const res1 = autoMatchRelations(heritage, digital, activities, collection);
    expect(res1.masterDerivativeLinks).toBe(30);
    expect(res1.assetResourceLinks).toBe(60); // 30 masters + 30 web derivatives
    expect(res1.activityLinks).toBe(90); // 30 HA + 60 DR linked to single activity
    expect(res1.collectionLinks).toBe(31); // 30 HA + 1 ACT stored exclusively in dcRelation

    const health = analyzeRelationsHealth(heritage, digital, activities);
    expect(health.missingRequiredCount).toBe(0);
    expect(health.orphanCount).toBe(0);
    // CARARE 2.0.6: collectionInformation allows ONLY <dcRelation> (no hasPart / wasDigitizedBy)
    expect(collection.hasPart).toBeUndefined();
    expect(collection.wasDigitizedBy).toBeUndefined();
    expect(collection.dcRelation).toHaveLength(31);
    expect(collection.dcRelation).toContain("hasPart:HA-RELIEF_01");
    expect(collection.dcRelation).toContain("wasDigitizedBy:ACT-CAMPAIGN-2026");

    // Second run must be completely idempotent (0 new links)
    const res2 = autoMatchRelations(heritage, digital, activities, collection);
    expect(res2.createdCount).toBe(0);
  });

  it("counts active relations per CRUD form accurately", () => {
    expect(
      countFormRelations(
        { isRepresentationOf: ["HA-1"], isDerivativeOf: ["DR-M"] },
        "digital",
      ),
    ).toBe(2);

    const col = { dcRelation: [] };
    syncCollectionRelations(
      col,
      [{ "recordInformation.id": "HA-1" }],
      [{ "recordInformation.id": "ACT-1" }],
    );
    expect(col.hasPart).toBeUndefined();
    expect(col.wasDigitizedBy).toBeUndefined();
    expect(countFormRelations(col, "collection")).toBe(2);
  });
});
