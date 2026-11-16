/**
 * Maps HERMES / CARARE 2.0.6 project metadata to a Dataverse / bonndata
 * Native API Dataset JSON payload (`POST /api/dataverses/:alias/datasets`).
 */

const LANG_MAP = {
  de: "German",
  en: "English",
  fr: "French",
  it: "Italian",
  es: "Spanish",
  el: "Greek",
  la: "Latin",
};

const LICENCE_MAP = [
  {
    match: /cc0|public\s*domain/i,
    name: "CC0 1.0",
    uri: "http://creativecommons.org/publicdomain/zero/1.0",
  },
  {
    match: /by-nc-sa/i,
    name: "CC BY-NC-SA 4.0",
    uri: "http://creativecommons.org/licenses/by-nc-sa/4.0",
  },
  {
    match: /by-nc/i,
    name: "CC BY-NC 4.0",
    uri: "http://creativecommons.org/licenses/by-nc/4.0",
  },
  {
    match: /by-sa/i,
    name: "CC BY-SA 4.0",
    uri: "http://creativecommons.org/licenses/by-sa/4.0",
  },
  {
    match: /by/i,
    name: "CC BY 4.0",
    uri: "http://creativecommons.org/licenses/by/4.0",
  },
];

const primitive = (typeName, value) => ({
  typeName,
  typeClass: "primitive",
  multiple: false,
  value: String(value),
});

const vocab = (typeName, values) => ({
  typeName,
  typeClass: "controlledVocabulary",
  multiple: true,
  value: values,
});

const compound = (typeName, items) => ({
  typeName,
  typeClass: "compound",
  multiple: true,
  value: items,
});

const extractLocalizedText = (val) => {
  if (!val) return "";
  if (typeof val === "string") return val.trim();
  if (Array.isArray(val)) {
    const preferred = val.find(
      (v) => v && (v["appellation.name#preferred"] || v.preferred),
    );
    const first = preferred || val[0];
    return extractLocalizedText(first);
  }
  if (typeof val === "object") {
    return String(val._value || val.name || val.label || val.value || "").trim();
  }
  return "";
};

const extractAllTexts = (val) => {
  if (!val) return [];
  if (typeof val === "string") return val.trim() ? [val.trim()] : [];
  if (Array.isArray(val)) {
    return val.map(extractLocalizedText).filter(Boolean);
  }
  const single = extractLocalizedText(val);
  return single ? [single] : [];
};

const normalizeDate = (d) => {
  if (!d) return "";
  const s = String(d).trim();
  // Dataverse accepts YYYY, YYYY-MM, or YYYY-MM-DD
  if (/^\d{4}(-\d{2}(-\d{2})?)?$/.test(s)) return s;
  return "";
};

const inferIdScheme = (idStr) => {
  if (!idStr) return "";
  if (/orcid\.org|\d{4}-\d{4}-\d{4}-\d{3}[\dX]/i.test(idStr)) return "ORCID";
  if (/d-nb\.info\/gnd|gnd/i.test(idStr)) return "GND";
  if (/ror\.org/i.test(idStr)) return "ROR";
  return "";
};

const mapLicence = (licenceStr) => {
  const s = String(licenceStr || "").trim();
  for (const entry of LICENCE_MAP) {
    if (entry.match.test(s)) {
      return { name: entry.name, uri: entry.uri };
    }
  }
  return {
    name: "CC BY 4.0",
    uri: "http://creativecommons.org/licenses/by/4.0",
  };
};

export function buildBonnDataJson({
  collectionForm = {},
  heritageItems = [],
  digitalItems = [],
  activityItems = [],
  globalRights = {},
  defaultMetadataLanguage = "de",
}) {
  const citationFields = [];

  // 1. Title & Alternative Titles
  const collectionTitle = extractLocalizedText(collectionForm.title);
  const firstDigitalTitle = extractLocalizedText(
    digitalItems[0]?.["appellation.name"],
  );
  const firstHeritageTitle = extractLocalizedText(
    heritageItems[0]?.["appellation.name"],
  );
  const mainTitle =
    collectionTitle ||
    firstDigitalTitle ||
    firstHeritageTitle ||
    "HERMES 3D Cultural Heritage Dataset";

  citationFields.push(primitive("title", mainTitle));

  const altTitles = new Set([
    ...extractAllTexts(collectionForm.title),
    ...heritageItems.flatMap((h) => extractAllTexts(h["appellation.name"])),
    ...digitalItems.flatMap((d) => extractAllTexts(d["appellation.name"])),
  ]);
  altTitles.delete(mainTitle);
  if (altTitles.size > 0) {
    citationFields.push({
      typeName: "alternativeTitle",
      typeClass: "primitive",
      multiple: true,
      value: [...altTitles],
    });
  }

  // 2. Other IDs (Collection ID, Inventory numbers, Record IDs)
  const otherIds = [];
  const seenIds = new Set();
  const pushOtherId = (agency, value) => {
    const val = String(value || "").trim();
    if (!val || seenIds.has(val)) return;
    seenIds.add(val);
    const obj = {
      otherIdValue: primitive("otherIdValue", val),
    };
    if (agency) {
      obj.otherIdAgency = primitive("otherIdAgency", agency);
    }
    otherIds.push(obj);
  };

  pushOtherId(collectionForm.source || "HERMES", collectionForm.id);
  for (const h of heritageItems) {
    pushOtherId("Heritage Asset ID", h["appellation.id"]);
    pushOtherId(
      "Inventory Number",
      h["repositoryLocation.inventoryNumber"],
    );
  }
  for (const d of digitalItems) {
    pushOtherId("Digital Resource ID", d["recordInformation.id"]);
  }
  if (otherIds.length > 0) {
    citationFields.push(compound("otherId", otherIds));
  }

  // 3. Authors (Actors from Collection, Heritage Assets, Digital Resources, Activities)
  const authors = [];
  const seenAuthors = new Set();
  const collectActors = (list) => {
    if (!Array.isArray(list)) return;
    for (const a of list) {
      const name = typeof a === "string" ? a.trim() : String(a?.name || "").trim();
      if (!name || seenAuthors.has(name.toLowerCase())) continue;
      seenAuthors.add(name.toLowerCase());
      const entry = {
        authorName: primitive("authorName", name),
      };
      const aff = String(a?.organization || a?.affiliation || "").trim();
      if (aff) {
        entry.authorAffiliation = primitive("authorAffiliation", aff);
      }
      const idVal = String(a?.id || a?.uri || a?.orcid || a?.gnd || "").trim();
      const scheme = inferIdScheme(idVal);
      if (idVal && scheme) {
        entry.authorIdentifierScheme = {
          typeName: "authorIdentifierScheme",
          typeClass: "controlledVocabulary",
          multiple: false,
          value: scheme,
        };
        entry.authorIdentifier = primitive("authorIdentifier", idVal);
      }
      authors.push(entry);
    }
  };

  collectActors(collectionForm.contacts);
  for (const a of activityItems) collectActors(a.actors);
  for (const d of digitalItems) collectActors(d.actors);
  for (const h of heritageItems) collectActors(h.actors);

  if (authors.length === 0 && collectionForm.source) {
    authors.push({
      authorName: primitive("authorName", collectionForm.source),
    });
  }
  if (authors.length > 0) {
    citationFields.push(compound("author", authors));
  }

  // 4. Dataset Contact (Dataverse requires at least one contact; email is required on bonndata)
  const contacts = [];
  const seenContacts = new Set();
  const collectContacts = (list) => {
    if (!Array.isArray(list)) return;
    for (const c of list) {
      const name = typeof c === "string" ? c.trim() : String(c?.name || "").trim();
      const email = String(c?.email || "").trim();
      if (!name && !email) continue;
      const key = `${name.toLowerCase()}|${email.toLowerCase()}`;
      if (seenContacts.has(key)) continue;
      seenContacts.add(key);
      const entry = {};
      if (name) entry.datasetContactName = primitive("datasetContactName", name);
      if (c?.organization) {
        entry.datasetContactAffiliation = primitive(
          "datasetContactAffiliation",
          c.organization,
        );
      }
      entry.datasetContactEmail = primitive(
        "datasetContactEmail",
        email || "contact@example.org",
      );
      contacts.push(entry);
    }
  };

  collectContacts(collectionForm.contacts);
  for (const d of digitalItems) collectContacts(d["recordInformation.creation.contacts"]);
  for (const h of heritageItems) collectContacts(h["recordInformation.creation.contacts"]);
  if (contacts.length === 0) {
    contacts.push({
      datasetContactName: primitive(
        "datasetContactName",
        collectionForm.source || "HERMES Data Provider",
      ),
      datasetContactEmail: primitive(
        "datasetContactEmail",
        "contact@example.org",
      ),
    });
  }
  citationFields.push(compound("datasetContact", contacts));

  // 5. Descriptions (Collection statement, Heritage/Digital descriptions, DAP-1..5)
  const descriptions = [];
  const addDesc = (text) => {
    const clean = String(text || "").trim();
    if (!clean) return;
    descriptions.push({
      dsDescriptionValue: primitive("dsDescriptionValue", clean),
    });
  };

  addDesc(extractLocalizedText(collectionForm.statement));
  for (const h of heritageItems) {
    const hName = extractLocalizedText(h["appellation.name"]);
    const hDesc = extractLocalizedText(h.description);
    if (hDesc) addDesc(hName ? `${hName}: ${hDesc}` : hDesc);
  }
  for (const d of digitalItems) {
    const dName = extractLocalizedText(d["appellation.name"]);
    const dDesc = extractLocalizedText(d.description);
    if (dDesc) addDesc(dName ? `${dName}: ${dDesc}` : dDesc);
  }
  for (const act of activityItems) {
    const paradata = act.paradata || {};
    const dapLines = [
      paradata.dap1 && `DAP-1 (Material traces): ${paradata.dap1}`,
      paradata.dap2 && `DAP-2 (Capture & coverage): ${paradata.dap2}`,
      paradata.dap3 && `DAP-3 (Geometry processing): ${paradata.dap3}`,
      paradata.dap4 && `DAP-4 (Texture & shaders): ${paradata.dap4}`,
      paradata.dap5 && `DAP-5 (Imaging balance): ${paradata.dap5}`,
    ].filter(Boolean);
    if (dapLines.length > 0) {
      addDesc(`Digital Authenticity Profile (DAP):\n${dapLines.join("\n")}`);
    }
  }
  if (descriptions.length === 0) {
    addDesc("3D cultural heritage metadata exported from HERMES (CARARE 2.0.6).");
  }
  citationFields.push(compound("dsDescription", descriptions));

  // 6. Subject (Dataverse controlled vocabulary)
  citationFields.push(vocab("subject", ["Arts and Humanities"]));

  // 7. FreeKeywords (REQUIRED on bonndata.uni-bonn.de) + Controlled Keywords
  const freeKeywords = [];
  const seenFreeKw = new Set();
  const keywords = [];
  const seenKw = new Set();
  const pushKeyword = (val, voc = "", uri = "") => {
    const label =
      typeof val === "string"
        ? val.trim()
        : String(val?.label || val?.name || val?._value || "").trim();
    if (!label) return;
    if (!seenFreeKw.has(label.toLowerCase())) {
      seenFreeKw.add(label.toLowerCase());
      freeKeywords.push({
        freeKeywordValue: primitive("freeKeywordValue", label),
      });
    }
    const kwUri = String(uri || val?.uri || "").trim();
    const kwVoc = String(
      voc ||
        val?.vocabulary ||
        (kwUri.includes("getty.edu")
          ? "Getty AAT"
          : kwUri.includes("wikidata.org")
            ? "Wikidata"
            : ""),
    ).trim();
    if ((kwUri || kwVoc) && !seenKw.has(label.toLowerCase())) {
      seenKw.add(label.toLowerCase());
      const entry = { keywordValue: primitive("keywordValue", label) };
      if (kwVoc) entry.keywordVocabulary = primitive("keywordVocabulary", kwVoc);
      if (kwUri)
        entry.keywordVocabularyURI = primitive("keywordVocabularyURI", kwUri);
      keywords.push(entry);
    }
  };

  const kwSources = [
    ...(Array.isArray(collectionForm.keywords) ? collectionForm.keywords : []),
    ...heritageItems.flatMap((h) => [
      ...(Array.isArray(h.keywords) ? h.keywords : []),
      ...(Array.isArray(h["characters.materials"]) ? h["characters.materials"] : []),
      ...(Array.isArray(h["characters.monumentType"]) ? h["characters.monumentType"] : []),
    ]),
  ];
  for (const k of kwSources) pushKeyword(k);
  if (freeKeywords.length === 0) {
    freeKeywords.push({
      freeKeywordValue: primitive("freeKeywordValue", "3D Cultural Heritage"),
    });
  }
  citationFields.push(compound("freeKeyword", freeKeywords));
  if (keywords.length > 0) {
    citationFields.push(compound("keyword", keywords));
  }

  // 7b. Data Type (kindOfData) & Software (from Activity consistsOf)
  if (digitalItems.length > 0) {
    citationFields.push({
      typeName: "kindOfData",
      typeClass: "primitive",
      multiple: true,
      value: ["3d-model"],
    });
  }

  const softwareList = [];
  const seenSw = new Set();
  for (const act of activityItems) {
    const steps = Array.isArray(act.consistsOf) ? act.consistsOf : [];
    for (const st of steps) {
      const swItems = Array.isArray(st?.software)
        ? st.software
        : st?.softwareName
          ? [{ name: st.softwareName, version: st.softwareVersion }]
          : [];
      for (const sw of swItems) {
        const swName =
          typeof sw === "string" ? sw.trim() : String(sw?.name || "").trim();
        const swVer = typeof sw === "object" ? String(sw?.version || "").trim() : "";
        const key = `${swName.toLowerCase()}|${swVer.toLowerCase()}`;
        if (!swName || seenSw.has(key)) continue;
        seenSw.add(key);
        const entry = { softwareName: primitive("softwareName", swName) };
        if (swVer) entry.softwareVersion = primitive("softwareVersion", swVer);
        softwareList.push(entry);
      }
    }
  }
  if (softwareList.length > 0) {
    citationFields.push(compound("software", softwareList));
  }

  // 8. Language
  const langCode = String(
    collectionForm["recordInformation.language"]?.[0] ||
      defaultMetadataLanguage ||
      "de",
  ).toLowerCase();
  const mappedLang = LANG_MAP[langCode];
  if (mappedLang) {
    citationFields.push(vocab("language", [mappedLang]));
  }

  // 9. Time Period Covered (from Temporal entries)
  const temporals = [
    ...(Array.isArray(collectionForm["coverage.temporal"])
      ? collectionForm["coverage.temporal"]
      : []),
    ...heritageItems.flatMap((h) =>
      Array.isArray(h["characters.temporal"]) ? h["characters.temporal"] : [],
    ),
    ...activityItems.flatMap((a) => (Array.isArray(a.temporal) ? a.temporal : [])),
  ];
  const timePeriods = [];
  for (const t of temporals) {
    const start = normalizeDate(t?.startDate || t?.["timeSpan.startDate"]);
    const end = normalizeDate(t?.endDate || t?.["timeSpan.endDate"]);
    if (start || end) {
      const entry = {};
      if (start) entry.timePeriodCoveredStart = primitive("timePeriodCoveredStart", start);
      if (end) entry.timePeriodCoveredEnd = primitive("timePeriodCoveredEnd", end);
      timePeriods.push(entry);
    }
  }
  if (timePeriods.length > 0) {
    citationFields.push(compound("timePeriodCovered", timePeriods));
  }

  // 10. Notes (Technical 3D summary)
  const noteParts = [
    `Exported from HERMES (CARARE 2.0.6)`,
    `Heritage Assets: ${heritageItems.length}`,
    `Digital Resources / 3D Models: ${digitalItems.length}`,
    `Activities: ${activityItems.length}`,
  ];
  citationFields.push(primitive("notesText", noteParts.join(" | ")));

  // 11. Geospatial Metadata Block (if spatial data exists)
  const spatialEntries = [
    ...(Array.isArray(collectionForm["coverage.spatial"])
      ? collectionForm["coverage.spatial"]
      : []),
    ...heritageItems.flatMap((h) => (Array.isArray(h.spatial) ? h.spatial : [])),
    ...activityItems.flatMap((a) => (Array.isArray(a.spatial) ? a.spatial : [])),
  ];

  const geoCoverages = [];
  const geoBoxes = [];
  for (const sp of spatialEntries) {
    if (!sp || typeof sp !== "object") continue;
    const country = String(sp.country || sp["spatial.country"] || "").trim();
    const city = String(
      sp.city || sp.locality || sp["spatial.locality"] || sp.placeName || "",
    ).trim();
    const otherGeo = String(sp.locationName || sp.namedPlace || sp.address || "").trim();
    if (country || city || otherGeo) {
      const entry = {};
      if (country) entry.country = { typeName: "country", typeClass: "controlledVocabulary", multiple: false, value: country };
      if (city) entry.city = primitive("city", city);
      if (otherGeo) entry.otherGeographicCoverage = primitive("otherGeographicCoverage", otherGeo);
      geoCoverages.push(entry);
    }
    const lat = parseFloat(sp.latitude ?? sp.lat);
    const lon = parseFloat(sp.longitude ?? sp.lon ?? sp.lng);
    if (!Number.isNaN(lat) && !Number.isNaN(lon)) {
      geoBoxes.push({
        westLongitude: primitive("westLongitude", lon),
        eastLongitude: primitive("eastLongitude", lon),
        northLatitude: primitive("northLatitude", lat),
        southLatitude: primitive("southLatitude", lat),
      });
    }
  }

  const metadataBlocks = {
    citation: {
      displayName: "Citation Metadata",
      fields: citationFields,
    },
  };

  if (geoCoverages.length > 0 || geoBoxes.length > 0) {
    const geoFields = [];
    if (geoCoverages.length > 0) geoFields.push(compound("geographicCoverage", geoCoverages));
    if (geoBoxes.length > 0) geoFields.push(compound("geographicBoundingBox", geoBoxes));
    metadataBlocks.geospatial = {
      displayName: "Geospatial Metadata",
      fields: geoFields,
    };
  }

  return {
    datasetVersion: {
      license: mapLicence(globalRights?.licence),
      metadataBlocks,
    },
  };
}
