// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  savedPersons,
  savedOrganizations,
  addOrUpdatePerson,
  addOrUpdateOrganization,
  updateSavedOrganization,
  findDuplicateOrganization,
  isOrganizationEntity,
  normalizeGndId,
  saveGlobalRights,
  globalRights,
  exportPoolsBackup,
  importPoolsBackup,
  clearAllPersons,
  clearAllOrganizations,
} from "../src/utils/sharedState.js";

describe("v0.1.32 Bugfix Regressions (Pools, Duplicates, Storage Safety)", () => {
  beforeEach(() => {
    clearAllPersons();
    clearAllOrganizations();
  });

  it("blocks organizations / corporate bodies from entering the Persons pool", () => {
    addOrUpdatePerson({ name: "Dr. Valentina Muster", email: "v@uni-bonn.de" });
    addOrUpdatePerson({ name: "Universität Bonn", type: "organization" });
    addOrUpdatePerson({ name: "DAI Berlin", actorType: "CorporateBody" });
    addOrUpdatePerson({ name: "Landesmuseum", type: "institution" });

    expect(isOrganizationEntity({ type: "CorporateBody" })).toBe(true);
    expect(isOrganizationEntity({ type: "person" })).toBe(false);
    expect(savedPersons.value).toHaveLength(1);
    expect(savedPersons.value[0].name).toBe("Dr. Valentina Muster");
  });

  it("also blocks a known organization name without personal email from Persons pool", () => {
    addOrUpdateOrganization({
      name: "Akademisches Kunstmuseum Bonn",
      gnd: "2003578-9",
    });
    addOrUpdatePerson({ name: "Akademisches Kunstmuseum Bonn" });
    expect(savedPersons.value).toHaveLength(0);
  });

  it("normalizes GND IDs and detects/prevents duplicate organizations on add & edit", () => {
    expect(normalizeGndId("https://d-nb.info/gnd/5035657-4")).toBe("5035657-4");
    expect(normalizeGndId("GND: 5035657-4/")).toBe("5035657-4");

    const r1 = addOrUpdateOrganization({
      name: "Antikensammlung Berlin",
      gnd: "5035657-4",
      city: "Berlin",
    });
    expect(r1.status).toBe("added");

    // Duplicate by normalized GND with full URI
    const dupGnd = findDuplicateOrganization({
      name: "Antikensammlung SMB",
      gnd: "https://d-nb.info/gnd/5035657-4",
    });
    expect(dupGnd.index).toBe(0);
    expect(dupGnd.reason).toBe("gnd");

    // Duplicate by case/whitespace-insensitive name
    const dupName = findDuplicateOrganization({
      name: "  antikensammlung   berlin ",
    });
    expect(dupName.index).toBe(0);
    expect(dupName.reason).toBe("name");

    // Add second distinct org and try editing it into a duplicate of the first
    addOrUpdateOrganization({
      name: "Universität Bonn",
      gnd: "36150-1",
      city: "Bonn",
    });
    expect(savedOrganizations.value).toHaveLength(2);

    const editRes = updateSavedOrganization(0, {
      name: "Antikensammlung Berlin",
      gnd: "36150-1",
    });
    expect(editRes.status).toBe("duplicate");
    expect(savedOrganizations.value[0].name).toBe("Universität Bonn");
  });

  it("does not throw when localStorage.setItem fails (QuotaExceededError) in saveGlobalRights", () => {
    const spy = vi
      .spyOn(Storage.prototype, "setItem")
      .mockImplementation(() => {
        throw new DOMException("Quota exceeded", "QuotaExceededError");
      });

    expect(() =>
      saveGlobalRights({
        licence: "https://creativecommons.org/licenses/by/4.0/deed.de",
        accessRights: "Open access",
      }),
    ).not.toThrow();

    expect(globalRights.accessRights).toBe("Open access");
    spy.mockRestore();
  });

  it("exports and imports Persons & Organizations pools backup cleanly", () => {
    addOrUpdatePerson({ name: "Dr. Anna Beispiel", email: "anna@example.org" });
    addOrUpdateOrganization({ name: "BCDH Uni Bonn", gnd: "1234567-8" });

    const backup = exportPoolsBackup();
    expect(backup.persons).toHaveLength(1);
    expect(backup.organizations).toHaveLength(1);

    clearAllPersons();
    clearAllOrganizations();
    expect(savedPersons.value).toHaveLength(0);
    expect(savedOrganizations.value).toHaveLength(0);

    const restored = importPoolsBackup(backup);
    expect(restored.persons).toBe(1);
    expect(restored.organizations).toBe(1);
    expect(savedPersons.value[0].name).toBe("Dr. Anna Beispiel");
    expect(savedOrganizations.value[0].name).toBe("BCDH Uni Bonn");
  });
});
