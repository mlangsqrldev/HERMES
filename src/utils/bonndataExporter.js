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
  metadataLanguage = "",
}) {
  const citationFields = [];

  const collectionSource = String(
    collectionForm["recordInformation.source"] || collectionForm.source || "",
  ).trim();
  const collectionCreationDate = normalizeDate(
    collectionForm["recordInformation.creation.date"] ||
      collectionForm.createdOn ||
      "",
  );
  const collectionContacts = [
    ...(Array.isArray(collectionForm.contacts) ? collectionForm.contacts : []),
    ...(Array.isArray(collectionForm["recordInformation.creation.contacts"])
      ? collectionForm["recordInformation.creation.contacts"]
      : []),
  ];

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
  const subtitleText = String(collectionForm.subtitle || "").trim();
  if (subtitleText) {
    citationFields.push(primitive("subtitle", subtitleText));
  }
  if (altTitles.size > 0) {
    citationFields.push({
      typeName: "alternativeTitle",
      typeClass: "primitive",
      multiple: true,
      value: [...altTitles],
    });
  }

  // 1b. Alternative URL (from Digital Resource isShownAt / link)
  const firstAltUrl = digitalItems
    .map((d) => String(d?.isShownAt || d?.link || "").trim())
    .find((u) => /^https?:\/\//i.test(u));
  if (firstAltUrl) {
    citationFields.push(primitive("alternativeURL", firstAltUrl));
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

  pushOtherId(collectionSource || "HERMES", collectionForm.id);
  for (const h of heritageItems) {
    pushOtherId("Heritage Asset ID", h["appellation.id"]);
    pushOtherId(
      "Inventory Number",
      h["repositoryLocation.inventoryNumber"],
    );
  }
  for (const d of digitalItems) {
    pushOtherId("Digital Resource ID", d["recordInformation.id"]);
    if (d["appellation.id"] && d["appellation.id"] !== d["recordInformation.id"]) {
      pushOtherId("Digital Resource URI/DOI", d["appellation.id"]);
    }
  }
  for (const act of activityItems) {
    pushOtherId("Activity ID", act["appellation.id"] || act["recordInformation.id"]);
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
        const cleanId = idVal
          .replace(/^https?:\/\/d-nb\.info\/gnd\//i, "")
          .replace(/^https?:\/\/orcid\.org\//i, "");
        entry.authorIdentifier = primitive("authorIdentifier", cleanId);
      }
      authors.push(entry);
    }
  };

  collectActors(collectionContacts);
  for (const a of activityItems) collectActors(a.actors);
  for (const d of digitalItems) collectActors(d.actors);
  for (const h of heritageItems) collectActors(h.actors);

  if (authors.length === 0 && collectionSource) {
    authors.push({
      authorName: primitive("authorName", collectionSource),
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

  collectContacts(collectionContacts);
  for (const d of digitalItems) collectContacts(d["recordInformation.creation.contacts"]);
  for (const h of heritageItems) collectContacts(h["recordInformation.creation.contacts"]);
  if (contacts.length === 0) {
    contacts.push({
      datasetContactName: primitive(
        "datasetContactName",
        collectionSource || "HERMES Data Provider",
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
    const entry = {
      dsDescriptionValue: primitive("dsDescriptionValue", clean),
    };
    if (collectionCreationDate) {
      entry.dsDescriptionDate = primitive("dsDescriptionDate", collectionCreationDate);
    }
    descriptions.push(entry);
  };

  addDesc(extractLocalizedText(collectionForm.statement));
  for (const h of heritageItems) {
    const hName = extractLocalizedText(h["appellation.name"]);
    const hDesc = extractLocalizedText(h["characters.description"] || h.description);
    if (hDesc) addDesc(hName ? `${hName}: ${hDesc}` : hDesc);
  }
  for (const d of digitalItems) {
    const dName = extractLocalizedText(d["appellation.name"]);
    const dDesc = extractLocalizedText(d.description);
    if (dDesc) addDesc(dName ? `${dName}: ${dDesc}` : dDesc);
  }
  for (const act of activityItems) {
    const paradata = act.paradata || {};
    const coList = Array.isArray(act.consistsOf) ? act.consistsOf : [];
    const getDapText = (id, legacyVal) => {
      if (legacyVal) return legacyVal;
      const found = coList.find(
        (c) =>
          c &&
          (c.dapId === id ||
            String(c["methods#termUID"] || "").endsWith(`/${id}`) ||
            String(c.hadSpecificPurpose || "").includes(id)),
      );
      return found ? extractLocalizedText(found.methods || found.techniques) : "";
    };
    const dapLines = [
      getDapText("DAP-1", paradata.dap1) && `DAP-1 (Material traces): ${getDapText("DAP-1", paradata.dap1)}`,
      getDapText("DAP-2", paradata.dap2) && `DAP-2 (Capture & coverage): ${getDapText("DAP-2", paradata.dap2)}`,
      getDapText("DAP-3", paradata.dap3) && `DAP-3 (Geometry processing): ${getDapText("DAP-3", paradata.dap3)}`,
      getDapText("DAP-4", paradata.dap4) && `DAP-4 (Texture & shaders): ${getDapText("DAP-4", paradata.dap4)}`,
      getDapText("DAP-5", paradata.dap5) && `DAP-5 (Imaging balance): ${getDapText("DAP-5", paradata.dap5)}`,
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

  // 7. FreeKeywords (REQUIRED on bonndata.uni-bonn.de) + Controlled Keywords + Topic Classification
  const freeKeywords = [];
  const seenFreeKw = new Set();
  const keywords = [];
  const seenKw = new Set();
  const topicClassifications = [];
  const seenTopics = new Set();

  const inferVocabName = (uri, explicit = "") => {
    if (explicit) return explicit;
    if (!uri) return "";
    if (uri.includes("vocabs.bcdh.uni-bonn.de") || uri.includes("hector")) return "HECTOR";
    if (uri.includes("getty.edu")) return "Getty AAT";
    if (uri.includes("wikidata.org")) return "Wikidata";
    if (uri.includes("n2t.net/ark:/99152") || uri.includes("perio.do")) return "PeriodO";
    if (uri.includes("pleiades.stoa.org")) return "Pleiades";
    if (uri.includes("geonames.org")) return "GeoNames";
    if (uri.includes("d-nb.info/gnd")) return "GND";
    if (uri.includes("orcid.org")) return "ORCID";
    return "";
  };

  const pushTopic = (term, vocabName = "", vocabUri = "", key = "") => {
    const t = String(term || "").trim();
    const v = String(vocabName || "").trim();
    const u = String(vocabUri || "").trim();
    if (!t || (!v && !u)) return;
    const dedupKey = `${t.toLowerCase()}|${v.toLowerCase()}|${u.toLowerCase()}`;
    if (seenTopics.has(dedupKey)) return;
    seenTopics.add(dedupKey);
    const entry = { topicClassValue: primitive("topicClassValue", t) };
    if (key) entry.topicClassKey = primitive("topicClassKey", String(key));
    if (v) entry.topicClassVocab = primitive("topicClassVocab", v);
    if (u) entry.topicClassVocabURI = primitive("topicClassVocabURI", u);
    topicClassifications.push(entry);
  };

  const pushKeyword = (val, voc = "", uri = "") => {
    const label =
      typeof val === "string"
        ? val.trim()
        : String(val?.label || val?.name || val?._value || "").trim();
    if (!label) return;
    const kwUri = String(uri || val?.["#termUID"] || val?.uri || val?.id || "").trim();
    const kwVoc = inferVocabName(kwUri, String(voc || val?.vocabulary || val?.authority || "").trim());
    if (kwUri || kwVoc) {
      if (!seenKw.has(label.toLowerCase())) {
        seenKw.add(label.toLowerCase());
        const entry = { keywordValue: primitive("keywordValue", label) };
        if (kwVoc) entry.keywordVocabulary = primitive("keywordVocabulary", kwVoc);
        if (kwUri)
          entry.keywordVocabularyURI = primitive("keywordVocabularyURI", kwUri);
        keywords.push(entry);
      }
    } else if (!seenFreeKw.has(label.toLowerCase())) {
      seenFreeKw.add(label.toLowerCase());
      freeKeywords.push({
        freeKeywordValue: primitive("freeKeywordValue", label),
      });
    }
  };

  const kwSources = [
    ...(Array.isArray(collectionForm.keywords) ? collectionForm.keywords : []),
    ...heritageItems.flatMap((h) => [
      ...(Array.isArray(h.keywords) ? h.keywords : []),
      ...(Array.isArray(h["characters.materials"]) ? h["characters.materials"] : []),
      ...(Array.isArray(h["characters.heritageAssetType"]) ? h["characters.heritageAssetType"] : []),
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
  if (topicClassifications.length > 0) {
    citationFields.push(compound("topicClassification", topicClassifications));
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
  const pushSoftwareEntry = (rawSw) => {
    if (!rawSw) return;
    if (typeof rawSw === "string") {
      for (const part of rawSw.split(/[;,]/)) {
        const s = part.trim();
        if (!s) continue;
        // Split trailing version like "Artec Studio 19 Pro" or "Blender 4.3 LTS"
        const m = s.match(/^(.+?)\s+(v?\d+(?:\.\d+)*(?:\s+(?:Pro|LTS|SE|Plus))?)$/i);
        const swName = m ? m[1].trim() : s;
        const swVer = m ? m[2].trim() : "";
        const key = `${swName.toLowerCase()}|${swVer.toLowerCase()}`;
        if (seenSw.has(key)) continue;
        seenSw.add(key);
        const entry = { softwareName: primitive("softwareName", swName) };
        if (swVer) entry.softwareVersion = primitive("softwareVersion", swVer);
        softwareList.push(entry);
      }
      return;
    }
    const swName = String(rawSw?.name || rawSw?.softwareName || "").trim();
    const swVer = String(rawSw?.version || rawSw?.softwareVersion || "").trim();
    const key = `${swName.toLowerCase()}|${swVer.toLowerCase()}`;
    if (!swName || seenSw.has(key)) return;
    seenSw.add(key);
    const entry = { softwareName: primitive("softwareName", swName) };
    if (swVer) entry.softwareVersion = primitive("softwareVersion", swVer);
    softwareList.push(entry);
  };

  for (const act of activityItems) {
    if (act.software) {
      const topSw = Array.isArray(act.software) ? act.software : [act.software];
      topSw.forEach(pushSoftwareEntry);
    }
    const steps = Array.isArray(act.consistsOf) ? act.consistsOf : [];
    for (const st of steps) {
      if (Array.isArray(st?.software)) {
        st.software.forEach(pushSoftwareEntry);
      } else if (typeof st?.software === "string" && st.software.trim()) {
        pushSoftwareEntry(st.software);
      } else if (st?.softwareName) {
        pushSoftwareEntry({ name: st.softwareName, version: st.softwareVersion });
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

  // 10. Producer, Contributors, Depositor, Date of Collection & Data Source fields
  if (collectionSource) {
    citationFields.push(
      compound("producer", [{ producerName: primitive("producerName", collectionSource) }]),
    );
  }
  if (collectionCreationDate) {
    citationFields.push(primitive("productionDate", collectionCreationDate));
  }

  const contributors = [];
  const seenContrib = new Set();
  const pushContrib = (name, type = "Project Member") => {
    const n = String(name || "").trim();
    if (!n || seenContrib.has(`${type}|${n.toLowerCase()}`)) return;
    seenContrib.add(`${type}|${n.toLowerCase()}`);
    contributors.push({
      contributorType: {
        typeName: "contributorType",
        typeClass: "controlledVocabulary",
        multiple: false,
        value: type,
      },
      contributorName: primitive("contributorName", n),
    });
  };
  for (const c of collectionContacts) pushContrib(c?.name || c, "Data Curator");
  for (const a of activityItems) {
    for (const actActor of a.actors || []) {
      pushContrib(actActor?.name || actActor, "Data Collector");
    }
  }
  for (const d of digitalItems) {
    for (const digActor of d.actors || []) {
      pushContrib(digActor?.name || digActor, "Researcher");
    }
  }
  if (contributors.length > 0) {
    citationFields.push(compound("contributor", contributors));
  }

  const firstContactName = contacts[0]?.datasetContactName?.value;
  if (firstContactName) {
    citationFields.push(primitive("depositor", firstContactName));
  }
  if (collectionCreationDate) {
    citationFields.push(primitive("dateOfDeposit", collectionCreationDate));
  }

  const collectionDates = [];
  for (const a of activityItems) {
    for (const t of Array.isArray(a.temporal) ? a.temporal : []) {
      const start = normalizeDate(t?.startDate || t?.["timeSpan.startDate"]);
      const end = normalizeDate(t?.endDate || t?.["timeSpan.endDate"]);
      if (start || end) {
        const entry = {};
        if (start) entry.dateOfCollectionStart = primitive("dateOfCollectionStart", start);
        if (end) entry.dateOfCollectionEnd = primitive("dateOfCollectionEnd", end);
        collectionDates.push(entry);
      }
    }
  }
  if (collectionDates.length > 0) {
    citationFields.push(compound("dateOfCollection", collectionDates));
  }

  const origins = heritageItems
    .map((h) => [extractLocalizedText(h.provenance), extractLocalizedText(h.repositoryLocation)].filter(Boolean).join(" | "))
    .filter(Boolean);
  if (origins.length > 0) {
    citationFields.push(primitive("originOfSources", origins.join("; ")));
  }

  const charParts = heritageItems
    .map((h) => {
      const mats = Array.isArray(h["characters.materials"])
        ? h["characters.materials"].map(extractLocalizedText).filter(Boolean).join(", ")
        : "";
      const types = Array.isArray(h["characters.heritageAssetType"])
        ? h["characters.heritageAssetType"].map(extractLocalizedText).filter(Boolean).join(", ")
        : "";
      return [types && `Type: ${types}`, mats && `Materials: ${mats}`].filter(Boolean).join(" | ");
    })
    .filter(Boolean);
  if (charParts.length > 0) {
    citationFields.push(primitive("characteristicOfSources", charParts.join("; ")));
  }

  if (firstAltUrl) {
    citationFields.push(primitive("accessToSources", firstAltUrl));
  }

  // 10b. Series & Related Publications (from Collection & Heritage Asset References)
  if (collectionTitle) {
    const seriesObj = { seriesName: primitive("seriesName", collectionTitle) };
    if (collectionForm.id) {
      seriesObj.seriesInformation = primitive(
        "seriesInformation",
        `Collection ID: ${collectionForm.id}`,
      );
    }
    citationFields.push(compound("series", [seriesObj]));
  }

  const publications = [];
  for (const h of heritageItems) {
    for (const refItem of Array.isArray(h.references) ? h.references : []) {
      const cit = String(refItem?.citation || refItem?.title || refItem?.name || refItem || "").trim();
      if (!cit) continue;
      const pub = {
        publicationRelationType: {
          typeName: "publicationRelationType",
          typeClass: "controlledVocabulary",
          multiple: false,
          value: "References",
        },
        publicationCitation: primitive("publicationCitation", cit),
      };
      if (refItem?.uri && /^https?:\/\//i.test(refItem.uri)) {
        pub.publicationURL = primitive("publicationURL", refItem.uri);
      }
      publications.push(pub);
    }
  }
  if (publications.length > 0) {
    citationFields.push(compound("publication", publications));
  }

  // 10b. Notes (Technical 3D summary)
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
    const baseGeoName = String(
      sp["locationSet.historicalName"] ||
        sp["locationSet.namedLocation"] ||
        sp.locationName ||
        sp.namedPlace ||
        sp.address ||
        "",
    ).trim();
    const spUri = String(sp.pleiadesUri || sp.geonamesUri || sp.uri || "").trim();
    const otherGeo =
      baseGeoName && spUri ? `${baseGeoName} (${spUri})` : baseGeoName || spUri;
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

  // Dataverse Native API expects top-level `metadataLanguage` next to `datasetVersion`
  // (e.g. "en" for collection `3D`, "en" or "de-DE" for `bcdh` via GET /api/dataverses/:alias/allowedMetadataLanguages)
  const resolvedMetadataLanguage =
    metadataLanguage ||
    (String(defaultMetadataLanguage || "en").toLowerCase().startsWith("de")
      ? "de-DE"
      : "en");

  return {
    metadataLanguage: resolvedMetadataLanguage,
    datasetVersion: {
      license: mapLicence(globalRights?.licence),
      metadataBlocks,
    },
  };
}
