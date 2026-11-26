import { jsPDF } from "jspdf";
import { resolveTermUri, resolveTermList } from "./termResolver.js";

// Rock-solid helper to safely extract clean string from strings, arrays, or multilingual CARARE objects
function extractCleanText(val, fallback = "—") {
  if (val === null || val === undefined || val === "") return fallback;
  if (typeof val === "string") return val.trim() || fallback;
  if (typeof val === "number") return String(val);
  if (Array.isArray(val)) {
    if (val.length === 0) return fallback;
    const pref =
      val.find(
        (v) =>
          v &&
          (v["title#preferred"] ||
            v["name#preferred"] ||
            v.preferred === true ||
            v.preferred === "true"),
      ) || val[0];
    return extractCleanText(pref, fallback);
  }
  if (typeof val === "object") {
    const extracted =
      val._value ||
      val["#text"] ||
      val.label ||
      val.prefLabel ||
      val.name ||
      val.title ||
      val.value;
    if (extracted !== undefined && extracted !== null && extracted !== "") {
      return extractCleanText(extracted, fallback);
    }
    return fallback;
  }
  return String(val);
}

/**
 * Helper to extract clean entity ID
 */
function getEntityId(entity, fallback = "") {
  if (!entity) return fallback;
  if (typeof entity === "string") return entity.trim();
  const id =
    entity["recordInformation.id"] ||
    entity.id ||
    entity["appellation.id"] ||
    entity._id ||
    fallback;
  return typeof id === "string" ? id.trim() : fallback;
}

/**
 * Helper to extract clean entity Name / Title
 */
function getEntityName(entity, fallback = "") {
  if (!entity) return fallback;
  if (typeof entity === "string") return entity.trim();
  const raw =
    entity["appellation.name"] ||
    entity.name ||
    entity.title ||
    entity["title"] ||
    fallback;

  if (Array.isArray(raw)) {
    if (raw.length === 0) return fallback;
    const pref = raw.find(
      (t) => t && (t["title#preferred"] || t["name#preferred"]),
    );
    if (pref)
      return String(pref._value || pref.value || pref.name || fallback).trim();
    const first = raw[0];
    if (typeof first === "object" && first !== null) {
      return String(
        first._value || first.value || first.name || fallback,
      ).trim();
    }
    return String(first || fallback).trim();
  }

  if (typeof raw === "object" && raw !== null) {
    return String(raw._value || raw.value || raw.name || fallback).trim();
  }

  return String(raw || fallback).trim();
}

/**
 * Helper to extract array of IDs from string, object or array
 */
function extractIdList(val) {
  if (!val) return [];
  const rawList = Array.isArray(val) ? val : [val];
  const out = [];
  rawList.forEach((item) => {
    if (!item) return;
    if (typeof item === "string") {
      const trimmed = item.trim();
      if (trimmed && trimmed !== "—" && trimmed !== "-") out.push(trimmed);
    } else if (typeof item === "object") {
      const v = item._value || item.id || item.value || item["#term"] || "";
      if (v && typeof v === "string") {
        const trimmed = v.trim();
        if (trimmed && trimmed !== "—" && trimmed !== "-") out.push(trimmed);
      }
    }
  });
  return [...new Set(out)];
}

/**
 * Helper to format terms with their resolved URIs
 */
function formatValueWithUri(val) {
  if (!val) return "—";
  if (Array.isArray(val)) {
    return val
      .map((item) => formatSingleValueWithUri(item))
      .filter(Boolean)
      .join("; ");
  }
  return formatSingleValueWithUri(val);
}

function formatSingleValueWithUri(val) {
  if (!val) return "—";
  if (typeof val === "object") {
    const label =
      val._value ||
      val["#term"] ||
      val.label ||
      val.prefLabel ||
      val.name ||
      "";
    const uri = val["#termUID"] || val.uri || "";
    return uri ? `${label} (${uri})` : label || "—";
  }
  const str = String(val).trim();
  const res = resolveTermUri(str);
  if (res && res.uri) {
    if (str.includes(res.uri)) return str;
    return `${res.label} (${res.uri})`;
  }
  return str;
}

/**
 * Builds a project-wide relational index connecting:
 * Collections <-> Heritage Assets <-> Digital Resources (Master & Derivative) <-> Activities & DAP
 */
function buildProjectRelationshipIndex(allData = {}) {
  const collections = allData.Collection || [];
  const heritageAssets = allData.HeritageAsset || [];
  const digitalResources = allData.DigitalResource || [];
  const activities = allData.Activity || [];

  const entityRegistry = {}; // id -> { id, type, name, subType, record }
  const relations = {
    haToDr: {},
    haToAct: {},
    drToHa: {},
    drToAct: {},
    drToMaster: {},
    drToDerivatives: {},
    actToHa: {},
    actToDr: {},
  };

  // 1. Index Collections
  collections.forEach((col, idx) => {
    const id = getEntityId(col, `COL-${idx + 1}`);
    entityRegistry[id] = {
      id,
      type: "Collection",
      name: getEntityName(col, `Sammlung ${idx + 1}`),
      record: col,
    };
  });

  // 2. Index Heritage Assets
  heritageAssets.forEach((ha, idx) => {
    const id = getEntityId(ha, `HA-${idx + 1}`);
    const name = getEntityName(ha, `Kulturgut ${idx + 1}`);
    entityRegistry[id] = { id, type: "HeritageAsset", name, record: ha };
    relations.haToDr[id] = new Set();
    relations.haToAct[id] = new Set();
  });

  // 3. Index Digital Resources & classify Master vs. Realtime Derivative
  digitalResources.forEach((dr, idx) => {
    const id = getEntityId(dr, `DR-${idx + 1}`);
    const name = getEntityName(dr, `3D-Digitalisat ${idx + 1}`);

    const isDerivExplicit = extractIdList(dr.isDerivativeOf).length > 0;
    const hasDerivExplicit = extractIdList(dr.hasDerivative).length > 0;
    const format = String(dr.format || "").toLowerCase();
    const extent = String(dr.extent || "").toLowerCase();
    const idStr = String(id || "").toLowerCase();
    const nameStr = String(name || "").toLowerCase();

    let subType = "unknown";
    if (
      isDerivExplicit ||
      idStr.includes("realtime") ||
      idStr.includes("glb") ||
      idStr.includes("lod") ||
      nameStr.includes("realtime") ||
      format.includes("gltf") ||
      format.includes("glb")
    ) {
      subType = "derivative";
    } else if (
      hasDerivExplicit ||
      idStr.includes("master") ||
      idStr.includes("hp") ||
      nameStr.includes("master") ||
      extent.includes("master") ||
      format.includes("obj") ||
      format.includes("ply") ||
      format.includes("e57")
    ) {
      subType = "master";
    } else {
      // Default: master if it has high poly or no parent derivative
      subType = "master";
    }

    entityRegistry[id] = {
      id,
      type: "DigitalResource",
      name,
      subType,
      record: dr,
    };
    relations.drToHa[id] = new Set();
    relations.drToAct[id] = new Set();
    relations.drToMaster[id] = new Set();
    relations.drToDerivatives[id] = new Set();
  });

  // 4. Index Activities
  activities.forEach((act, idx) => {
    const id = getEntityId(act, `ACT-${idx + 1}`);
    const name = getEntityName(act, `Aktivität ${idx + 1}`);
    entityRegistry[id] = { id, type: "Activity", name, record: act };
    relations.actToHa[id] = new Set();
    relations.actToDr[id] = new Set();
  });

  // 5. Connect explicit relations across entities
  // Connect DR relations
  digitalResources.forEach((dr, idx) => {
    const drId = getEntityId(dr, `DR-${idx + 1}`);

    extractIdList(dr.isRepresentationOf).forEach((haId) => {
      relations.drToHa[drId]?.add(haId);
      relations.haToDr[haId]?.add(drId);
    });

    extractIdList(dr.isDerivativeOf).forEach((mId) => {
      relations.drToMaster[drId]?.add(mId);
      relations.drToDerivatives[mId]?.add(drId);
    });

    extractIdList(dr.hasDerivative).forEach((dId) => {
      relations.drToDerivatives[drId]?.add(dId);
      relations.drToMaster[dId]?.add(drId);
    });

    extractIdList(dr.dcRelation).forEach((relId) => {
      if (entityRegistry[relId]?.type === "Activity") {
        relations.drToAct[drId]?.add(relId);
        relations.actToDr[relId]?.add(drId);
      }
    });
  });

  // Connect HA relations
  heritageAssets.forEach((ha, idx) => {
    const haId = getEntityId(ha, `HA-${idx + 1}`);

    extractIdList(ha.wasDigitizedBy).forEach((actId) => {
      relations.haToAct[haId]?.add(actId);
      relations.actToHa[actId]?.add(haId);
    });

    extractIdList(ha.hasRepresentation).forEach((drId) => {
      relations.haToDr[haId]?.add(drId);
      relations.drToHa[drId]?.add(haId);
    });

    extractIdList(ha.dcRelation).forEach((relId) => {
      if (entityRegistry[relId]?.type === "Activity") {
        relations.haToAct[haId]?.add(relId);
        relations.actToHa[relId]?.add(haId);
      }
    });
  });

  // Connect Activity relations
  activities.forEach((act, idx) => {
    const actId = getEntityId(act, `ACT-${idx + 1}`);

    extractIdList(act.hasCreated).forEach((drId) => {
      relations.actToDr[actId]?.add(drId);
      relations.drToAct[drId]?.add(actId);
    });

    extractIdList(act.wasPresentAt).forEach((haId) => {
      relations.actToHa[actId]?.add(haId);
      relations.haToAct[haId]?.add(actId);
    });

    extractIdList(act.dcRelation).forEach((relId) => {
      if (entityRegistry[relId]?.type === "HeritageAsset") {
        relations.actToHa[actId]?.add(relId);
        relations.haToAct[relId]?.add(actId);
      } else if (entityRegistry[relId]?.type === "DigitalResource") {
        relations.actToDr[actId]?.add(relId);
        relations.drToAct[relId]?.add(actId);
      }
    });
  });

  // Transitive closure: If DR represents HA and DR is created by ACT, link HA <-> ACT!
  digitalResources.forEach((dr) => {
    const drId = getEntityId(dr);
    const haList = relations.drToHa[drId] || [];
    const actList = relations.drToAct[drId] || [];

    haList.forEach((haId) => {
      actList.forEach((actId) => {
        relations.haToAct[haId]?.add(actId);
        relations.actToHa[actId]?.add(haId);
      });
    });
  });

  return { entityRegistry, relations };
}

/**
 * Generates an academic, human-readable Markdown documentation report
 * from HERMES form data (CARARE + DAP 6-Dimensions).
 */
export function generateMarkdownReport(allData = {}, locale = "de") {
  const isDe = locale === "de";
  const now = new Date().toISOString().substring(0, 10);

  const collections = allData.Collection || [];
  const heritageAssets = allData.HeritageAsset || [];
  const digitalResources = allData.DigitalResource || [];
  const activities = allData.Activity || [];

  const { entityRegistry, relations } = buildProjectRelationshipIndex(allData);

  let md = "";

  // Title & Metadata Banner
  md += `# ${isDe ? "HERMES Metadaten-Dokumentation & Digital Authenticity Profile" : "HERMES Metadata Documentation & Digital Authenticity Profile"}\n`;
  md += `## ${isDe ? "CARARE 2.0.6 Langzeitarchivierung & 3D-Dokumentation" : "CARARE 2.0.6 Digital Preservation & 3D Documentation Report"}\n\n`;

  md += `| ${isDe ? "Archiv-Parameter" : "Archival Parameter"} | ${isDe ? "Spezifikation" : "Specification"} |\n`;
  md += `|---|---|\n`;
  md += `| **${isDe ? "Erstellungsdatum" : "Generation Date"}** | ${now} |\n`;
  md += `| **${isDe ? "Software-Agent" : "Software Agent"}** | HERMES (Heritage Metadata Entry System) v0.1.6 |\n`;
  md += `| **${isDe ? "Metadaten-Schema" : "Metadata Schema"}** | CARARE 2.0.6 (\`metadata/carare-v2.0.6.xml\`, 100% XSD-validiert) |\n`;
  md += `| **${isDe ? "Paketstandard" : "Packaging Standard"}** | RFC 8493 BagIt mit kryptographischen SHA-256 Prüfsummen |\n`;
  md += `| **${isDe ? "Vokabular-Standard" : "Vocabulary Standard"}** | HECTOR (BCDH Uni Bonn), Pleiades, Getty AAT, GND |\n`;
  md += `| **${isDe ? "Authentizitäts-Profil" : "Authenticity Profile"}** | Digital Authenticity Profile (DAP-1 bis DAP-6) |\n\n`;

  md += `---\n\n`;

  // 1. Collections
  if (collections.length > 0) {
    md += `## 1. ${isDe ? "Sammlung & Trägerinstitution (Collection)" : "Collection & Provider"}\n\n`;
    collections.forEach((col, idx) => {
      const recId = getEntityId(col, `COL-${idx + 1}`);
      const title =
        col.title ||
        col.name ||
        (isDe ? "Unbenannte Sammlung" : "Untitled Collection");
      const desc = col.description || "—";
      const source = col["recordInformation.source"] || col.source || "—";
      const rights = col["rights.copyrightCreditLine"] || "—";

      md += `<a id="${recId}"></a>\n`;
      md += `### ${idx + 1}. ${title} (\`${recId}\`)\n\n`;
      md += `- **${isDe ? "Verwaltende Institution / Quelle" : "Institution / Source"}:** ${source}\n`;
      md += `- **${isDe ? "Rechteangabe / Credit Line" : "Credit Line"}:** ${rights}\n`;
      if (desc && desc !== "—") {
        md += `- **${isDe ? "Beschreibung" : "Description"}:**\n  > ${desc}\n\n`;
      }

      if (heritageAssets.length > 0) {
        md += `- **${isDe ? "Enthaltene Kulturgüter (Heritage Assets)" : "Contained Heritage Assets"}:**\n`;
        heritageAssets.forEach((ha) => {
          const hId = getEntityId(ha);
          const hName = getEntityName(ha);
          md += `  - [${hName} (\`${hId}\`)](#${hId})\n`;
        });
        md += `\n`;
      }
    });
  }

  // 2. Heritage Asset Identification
  md += `## 2. ${isDe ? "Kulturgut (Heritage Asset)" : "Heritage Asset"}\n\n`;
  if (heritageAssets.length === 0) {
    md += `*${isDe ? "Keine Kulturgüter erfasst." : "No heritage assets recorded."}*\n\n`;
  } else {
    heritageAssets.forEach((ha, idx) => {
      const recId = getEntityId(ha, `HA-${idx + 1}`);
      const name = getEntityName(
        ha,
        isDe ? "Unbenanntes Kulturgut" : "Untitled Heritage Asset",
      );
      const desc = ha.description || "—";
      const type = formatValueWithUri(
        ha["characters.heritageAssetType"] || ha.heritageAssetType,
      );
      const materials = formatValueWithUri(
        ha["characters.materials"] || ha.materials,
      );
      const period = formatValueWithUri(ha["characters.temporal.periodName"]);
      const startDate = ha["characters.temporal.timeSpan.startDate"] || "";
      const endDate = ha["characters.temporal.timeSpan.endDate"] || "";
      const locName = formatValueWithUri(
        ha["spatial.locationSet.namedLocation"],
      );
      const town = ha["spatial.locationSet.address.townOrCity"] || "";
      const country = ha["spatial.locationSet.address.country"] || "";
      const repo = formatValueWithUri(ha.repositoryLocation);
      const condition = ha.condition || "—";

      const linkedDrs = Array.from(relations.haToDr[recId] || []);
      const linkedActs = Array.from(relations.haToAct[recId] || []);

      md += `<a id="${recId}"></a>\n`;
      md += `### ${idx + 1}. ${name} (\`${recId}\`)\n\n`;
      md += `| ${isDe ? "Attribut" : "Attribute"} | ${isDe ? "Wert / Fachvokabular" : "Value / Controlled Vocabulary"} |\n`;
      md += `|---|---|\n`;
      md += `| **${isDe ? "Typologie / Monument" : "Typology"}** | ${type} |\n`;
      md += `| **${isDe ? "Materialien (HECTOR)" : "Materials"}** | ${materials} |\n`;
      md += `| **${isDe ? "Datierung / Epoche" : "Dating / Period"}** | ${period}${startDate || endDate ? ` (${startDate} bis ${endDate})` : ""} |\n`;
      md += `| **${isDe ? "Standort / Fundort" : "Location"}** | ${locName}${town ? `, ${town}` : ""}${country ? ` (${country})` : ""} |\n`;
      if (repo && repo !== "—")
        md += `| **${isDe ? "Aufbewahrungsort / Depot" : "Repository"}** | ${repo} |\n`;
      if (condition && condition !== "—")
        md += `| **${isDe ? "Zustand" : "Condition"}** | ${condition} |\n`;
      md += `\n`;

      if (desc && desc !== "—") {
        md += `**${isDe ? "Wissenschaftliche Beschreibung:" : "Curatorial Description:"}**\n\n> ${desc}\n\n`;
      }

      // Explicit Relations
      if (linkedDrs.length > 0 || linkedActs.length > 0) {
        md += `**${isDe ? "Relationales Gefüge (Digitalisate & Aktivitäten):" : "Relational Network (Digital Resources & Activities):"}**\n\n`;
        if (linkedDrs.length > 0) {
          md += `- **${isDe ? "3D-Repräsentationen" : "3D Representations"}:**\n`;
          linkedDrs.forEach((drId) => {
            const drInfo = entityRegistry[drId];
            const tag =
              drInfo?.subType === "master"
                ? "[3D-Master]"
                : "[Realtime-Derivat]";
            md += `  - ${tag} [${drInfo?.name || drId} (\`${drId}\`)](#${drId})\n`;
          });
        }
        if (linkedActs.length > 0) {
          md += `- **${isDe ? "Digitalisierungskampagne(n)" : "Digitisation Campaign(s)"}:**\n`;
          linkedActs.forEach((actId) => {
            const actInfo = entityRegistry[actId];
            md += `  - [${actInfo?.name || actId} (\`${actId}\`)](#${actId})\n`;
          });
        }
        md += `\n`;
      }
    });
  }

  // 3. Digital Resources (3D Models: Master vs. Derivatives)
  md += `## 3. ${isDe ? "Digitale 3D-Ressourcen (Digital Resources)" : "Digital Resources (3D Models & Assets)"}\n\n`;
  if (digitalResources.length === 0) {
    md += `*${isDe ? "Keine digitalen Ressourcen erfasst." : "No digital resources recorded."}*\n\n`;
  } else {
    digitalResources.forEach((dr, idx) => {
      const recId = getEntityId(dr, `DR-${idx + 1}`);
      const info = entityRegistry[recId] || {};
      const isMaster = info.subType === "master";
      const name = dr["appellation.name"] || info.name || `3D Model`;
      const type = dr.type || "3D";
      const format = dr.format || "model/gltf-binary";
      const extent = dr.extent || "—";
      const formatDetails = dr.formatDetails || "—";
      const link = dr.link || "";
      const object = dr.object || "";
      const licence =
        dr["rights.licence"] || "https://creativecommons.org/licenses/by/4.0/";
      const europeanaRights =
        dr["rights.europeanaRights"] || "Creative Commons - Attribution (BY)";
      const credit = dr["rights.copyrightCreditLine"] || "—";

      const pubList = Array.isArray(dr.publicationStatement)
        ? dr.publicationStatement
        : [];
      const pub = pubList[0] || {};
      const publisher = pub.publisher || "—";
      const pubPlace = pub.place || "";
      const pubDate = pub.date || "";

      const parentHaList = Array.from(relations.drToHa[recId] || []);
      const masterList = Array.from(relations.drToMaster[recId] || []);
      const derivList = Array.from(relations.drToDerivatives[recId] || []);
      const linkedActs = Array.from(relations.drToAct[recId] || []);

      const badgeText = isMaster
        ? isDe
          ? "3D-Archiv-Master (High-Poly)"
          : "3D Archival Master (High-Poly)"
        : isDe
          ? "3D-Realtime-Derivat (Web GLB / LOD)"
          : "3D Realtime Derivative (Web GLB / LOD)";

      md += `<a id="${recId}"></a>\n`;
      md += `### ${idx + 1}. ${name} (\`${recId}\`) — **[${badgeText}]**\n\n`;
      md += `- **${isDe ? "Modell-Kategorie" : "Model Category"}:** \`${badgeText}\`\n`;
      md += `- **${isDe ? "Medientyp" : "Media Type"}:** \`${type}\`\n`;
      md += `- **${isDe ? "Dateiformat / MIME" : "File Format / MIME"}:** \`${format}\`\n`;
      md += `- **${isDe ? "Dateigröße / Geometrie-Umfang" : "Extent / Geometry"}:** ${extent}\n`;
      if (link)
        md += `- **${isDe ? "Online-Ressource" : "Web Resource"}:** [${link}](${link})\n`;
      if (object)
        md += `- **${isDe ? "Master-Objektdatei" : "Master File"}:** [${object}](${object})\n`;
      if (publisher && publisher !== "—") {
        md += `- **${isDe ? "Herausgeber / Publikation" : "Publisher"}:** ${publisher}${pubPlace ? ` (${pubPlace})` : ""}${pubDate ? `, ${pubDate}` : ""}\n`;
      }
      md += `- **${isDe ? "Lizenz" : "Licence"}:** [${licence}](${licence})\n`;
      md += `- **${isDe ? "Europeana Rights" : "Europeana Rights"}:** ${europeanaRights}\n`;
      md += `- **${isDe ? "Rechteinhaber / Credit Line" : "Credit Line"}:** ${credit}\n`;
      if (formatDetails && formatDetails !== "—") {
        md += `- **${isDe ? "3D-Parameter & Technische Spezifikationen" : "Technical 3D Parameters"}:**\n  > ${formatDetails}\n`;
      }

      // Relational cross references
      if (
        parentHaList.length > 0 ||
        masterList.length > 0 ||
        derivList.length > 0 ||
        linkedActs.length > 0
      ) {
        md += `\n**${isDe ? "Relationales Gefüge & Herkunft:" : "Relational Lineage & Connections:"}**\n\n`;
        if (parentHaList.length > 0) {
          md += `- **${isDe ? "Repräsentiertes Kulturgut" : "Represented Heritage Asset"}:** `;
          md +=
            parentHaList
              .map(
                (hId) =>
                  `[${entityRegistry[hId]?.name || hId} (\`${hId}\`)](#${hId})`,
              )
              .join(", ") + "\n";
        }
        if (!isMaster && masterList.length > 0) {
          md += `- **${isDe ? "Ursprung (High-Poly Master)" : "Source (High-Poly Master)"}:** `;
          md +=
            masterList
              .map(
                (mId) =>
                  `[${entityRegistry[mId]?.name || mId} (\`${mId}\`)](#${mId})`,
              )
              .join(", ") + "\n";
        }
        if (isMaster && derivList.length > 0) {
          md += `- **${isDe ? "Abgeleitete Realtime-Derivate" : "Derived Realtime Assets"}:** `;
          md +=
            derivList
              .map(
                (dId) =>
                  `[${entityRegistry[dId]?.name || dId} (\`${dId}\`)](#${dId})`,
              )
              .join(", ") + "\n";
        }
        if (linkedActs.length > 0) {
          md += `- **${isDe ? "Aufnahme- & Verarbeitungskampagne" : "Digitisation Campaign"}:** `;
          md +=
            linkedActs
              .map(
                (aId) =>
                  `[${entityRegistry[aId]?.name || aId} (\`${aId}\`)](#${aId})`,
              )
              .join(", ") + "\n";
        }
      }
      md += `\n`;
    });
  }

  // 4. Activity & Campaign (Digitalisierungsereignis)
  md += `## 4. ${isDe ? "Digitalisierungsaktivität & Aufnahmekampagne" : "Digitisation Activity & Campaign"}\n\n`;
  if (activities.length === 0) {
    md += `*${isDe ? "Keine Aktivitäten erfasst." : "No activities recorded."}*\n\n`;
  } else {
    activities.forEach((act, idx) => {
      const recId = getEntityId(act, `ACT-${idx + 1}`);
      const name = extractCleanText(
        act["appellation.name"],
        isDe ? "Digitalisierungskampagne" : "Digitisation Campaign",
      );
      const actType = formatValueWithUri(
        act.eventType || act.activityType || "3D-Digitalisierung",
      );
      const date =
        act["event.date.date"] || act["event.date.dateRangeQualifier"] || "—";
      const purpose = act.hasGeneralPurpose || act.description || "—";

      const linkedHaList = Array.from(relations.actToHa[recId] || []);
      const linkedDrList = Array.from(relations.actToDr[recId] || []);

      md += `<a id="${recId}"></a>\n`;
      md += `### ${idx + 1}. ${name} (\`${recId}\`)\n\n`;
      md += `- **${isDe ? "Aktivitätstyp (HECTOR)" : "Event Type (HECTOR)"}:** ${actType}\n`;
      md += `- **${isDe ? "Datum / Zeitraum" : "Date / Timespan"}:** ${date}\n`;
      if (purpose && purpose !== "—") {
        md += `- **${isDe ? "Ziel & Vorhaben" : "Purpose & Objectives"}:**\n  > ${purpose}\n`;
      }

      // Linked Assets
      if (linkedHaList.length > 0 || linkedDrList.length > 0) {
        md += `- **${isDe ? "Erfasste Kulturgüter" : "Target Heritage Assets"}:** `;
        md +=
          linkedHaList
            .map(
              (hId) =>
                `[${entityRegistry[hId]?.name || hId} (\`${hId}\`)](#${hId})`,
            )
            .join(", ") + "\n";
        md += `- **${isDe ? "Generierte 3D-Digitalisate" : "Generated 3D Resources"}:** `;
        md +=
          linkedDrList
            .map(
              (dId) =>
                `[${entityRegistry[dId]?.name || dId} (\`${dId}\`)](#${dId})`,
            )
            .join(", ") + "\n";
      }

      // Actors
      const actors = Array.isArray(act.actors) ? act.actors : [];
      if (actors.length > 0) {
        md += `\n**${isDe ? "Beteiligte Akteure & Institutionen:" : "Participating Actors & Institutions:"}**\n\n`;
        actors.forEach((a) => {
          const aName = a.name || "Unbekannt";
          const aRole =
            a.roles || a.role || (isDe ? "Mitwirkende(r)" : "Contributor");
          const aOrg = a.organization ? ` (${a.organization})` : "";
          const aId = a.id ? ` [${a.id}]` : "";
          md += `- **${aName}**${aOrg}: *${aRole}*${aId}\n`;
        });
      }
      md += `\n`;
    });
  }

  // 5. Digital Authenticity Profile (DAP 1-6) - Structured per Activity
  md += `## 5. ${isDe ? "Digital Authenticity Profile (DAP) – Sechs Dimensionen der materiellen Evidenz" : "Digital Authenticity Profile (DAP) – Six Dimensions of Material Evidence"}\n\n`;
  md += `${
    isDe
      ? "Das Digital Authenticity Profile dokumentiert die Transformation eines materiellen Kulturguts in das digitale Medium und macht die Grenzen dieser Übersetzung explizit transparent (Ausgangslage -> Erfassungsprozess -> Begründung -> Ergebnis)."
      : "The Digital Authenticity Profile systematically documents the translation from material evidence to digital representation."
  }\n\n`;

  const dapDefs = [
    {
      id: "DAP-1",
      phase: isDe
        ? "Reference (vor der Digitalisierung)"
        : "Reference (Pre-Capture)",
      name: isDe
        ? "DAP-1: Materielle Spuren & Merkmale"
        : "DAP-1: Material Traces & Features",
      question: isDe
        ? "Welche materielle Evidenz seiner Geschichte trägt das Objekt (Beschädigungen, Bearbeitungs- und Gebrauchsspuren, Restaurierungen)?"
        : "What material evidence of its history does the asset carry?",
      uri: "http://hector.org/vocab/dap/DAP-1",
    },
    {
      id: "DAP-2",
      phase: isDe
        ? "Capture (während der Digitalisierung)"
        : "Capture (During Digitisation)",
      name: isDe
        ? "DAP-2: Aufnahmeprozess & Erfassungsumfang"
        : "DAP-2: Acquisition Process & Scope of Capture",
      question: isDe
        ? "Was wurde erfasst, was nicht, und warum? (Standflächen, Hohlräume, Sensorauflösung, optische Grenzen)."
        : "What physical areas were captured, what was omitted, and why?",
      uri: "http://hector.org/vocab/dap/DAP-2",
    },
    {
      id: "DAP-3",
      phase: isDe
        ? "Representation (nach der Digitalisierung)"
        : "Representation (Post-Capture)",
      name: isDe
        ? "DAP-3: Geometrie-Bearbeitung"
        : "DAP-3: Geometry Processing & Interventions",
      question: isDe
        ? "Welche Eingriffe gab es an der Form (Rauschfilterung, Löcherschließung, Dezimierung, Glättung)?"
        : "What interventions altered the 3D geometry?",
      uri: "http://hector.org/vocab/dap/DAP-3",
    },
    {
      id: "DAP-4",
      phase: isDe
        ? "Representation (nach der Digitalisierung)"
        : "Representation (Post-Capture)",
      name: isDe
        ? "DAP-4: Textur, Shader & Material"
        : "DAP-4: Texture, Shader & Material Processing",
      question: isDe
        ? "Welche Eingriffe gab es an der Oberfläche (Delighting, ColorChecker-Kalibrierung, PBR-Shader, Normal-Maps)?"
        : "What interventions were performed on texture, lighting and color?",
      uri: "http://hector.org/vocab/dap/DAP-4",
    },
    {
      id: "DAP-5",
      phase: isDe ? "Übergreifend" : "Overarching Principles",
      name: isDe
        ? "DAP-5: Wissenschaftliche Begründung"
        : "DAP-5: Scholarly Rationale & Ethical Framework",
      question: isDe
        ? "Warum wurde so entschieden (London Charter Prinzip 4, Sevilla-Prinzipien, minimale Intervention)?"
        : "What methodological principles justified the interventions?",
      uri: "http://hector.org/vocab/dap/DAP-5",
    },
    {
      id: "DAP-6",
      phase: isDe ? "Ergebnis" : "Final Balance",
      name: isDe
        ? "DAP-6: Abbildungsbilanz & Transformationsgrenzen"
        : "DAP-6: Balance of Evidence & Transformation Boundaries",
      question: isDe
        ? "Was ist aus den Spuren und Merkmalen aus DAP-1 im Endprodukt geworden: erhalten, verändert, verloren oder nicht erfasst?"
        : "What became of the material traces from DAP-1 in the final 3D asset?",
      uri: "http://hector.org/vocab/dap/DAP-6",
    },
  ];

  let totalDapFound = 0;

  activities.forEach((act, actIdx) => {
    const actId = getEntityId(act, `ACT-${actIdx + 1}`);
    const actName = extractCleanText(
      act["appellation.name"],
      `Aktivität ${actIdx + 1}`,
    );
    const consistsOfList = Array.isArray(act.consistsOf) ? act.consistsOf : [];

    const matchingDaps = dapDefs.filter((def) => {
      return consistsOfList.some((co) => {
        const m = String(co.methods || "");
        const p = String(co.hadSpecificPurpose || "");
        return m.includes(def.id) || p.includes(def.id);
      });
    });

    if (matchingDaps.length > 0) {
      totalDapFound += matchingDaps.length;
      const targetHaList = Array.from(relations.actToHa[actId] || []);

      md += `### ${isDe ? "DAP-Dokumentation für Aktivität" : "DAP Documentation for Activity"}: ${actName} (\`${actId}\`)\n\n`;
      if (targetHaList.length > 0) {
        md += `- **${isDe ? "Untersuchtes Kulturgut" : "Investigated Heritage Asset"}:** `;
        md +=
          targetHaList
            .map(
              (hId) =>
                `[${entityRegistry[hId]?.name || hId} (\`${hId}\`)](#${hId})`,
            )
            .join(", ") + "\n\n";
      }

      matchingDaps.forEach((def) => {
        const match = consistsOfList.find((co) => {
          const m = String(co.methods || "");
          const p = String(co.hadSpecificPurpose || "");
          return m.includes(def.id) || p.includes(def.id);
        });

        const content =
          match.techniques ||
          match.materials ||
          (match.hadSpecificPurpose
            ? match.hadSpecificPurpose.split(":").slice(1).join(":").trim()
            : "") ||
          "—";
        const equipment = match.equipment || "";

        const fieldTitle =
          def.id === "DAP-1"
            ? isDe
              ? "Materielle Evidenz & Befund"
              : "Material Evidence & Condition"
            : def.id === "DAP-2"
              ? isDe
                ? "Erfassungsumfang & Auslassungsgründe"
                : "Capture Scope & Omissions"
              : def.id === "DAP-3"
                ? isDe
                  ? "Geometrie-Operationen (HECTOR)"
                  : "Geometry Operations (HECTOR)"
                : def.id === "DAP-4"
                  ? isDe
                    ? "Oberflächen- & Textur-Verfahren"
                    : "Surface & Texture Operations"
                  : def.id === "DAP-5"
                    ? isDe
                      ? "Wissenschaftliche Begründung & Leitlinien"
                      : "Scholarly Rationale & Charters"
                    : isDe
                      ? "Abbildungsbilanz (Evaluationsurteil)"
                      : "Balance of Evidence (Evaluation Verdict)";

        md += `#### ${def.name}\n\n`;
        md += `- **${isDe ? "Phase" : "Phase"}:** ${def.phase}\n`;
        md += `- **${isDe ? "Forschungsfrage" : "Research Question"}:** *${def.question}*\n`;
        md += `- **HECTOR URI:** \`${def.uri}\`\n`;
        md += `- **${fieldTitle}:**\n  ${resolveTermList(content)}\n`;
        if (equipment) {
          md += `- **${isDe ? "Eingesetzte Hardware / Software" : "Equipment & Software"}:** ${equipment}\n`;
        }
        md += `\n`;
      });
    }
  });

  if (totalDapFound === 0) {
    md += `*${isDe ? "Keine expliziten DAP-Einträge in den Aktivitäten gefunden." : "No explicit DAP entries found."}*\n\n`;
  }

  // Footer Sign-Off
  md += `---\n\n`;
  md += `*${isDe ? "Dieser Metadatenbericht wurde automatisch von HERMES erzeugt und ist fester Bestandteil des BagIt-Archivs." : "This metadata report was generated automatically by HERMES and is a permanent component of the BagIt archive."}*\n`;

  return md;
}

/**
 * Generates an executive, publication-grade vector PDF report with:
 * - 100% collision-free dynamic column wrapping (eliminates text overlap)
 * - Distinct visual hierarchy and color coding (Master Terracotta vs Realtime Emerald)
 * - Bidirectional relational pills with interactive cross-reference jumping (doc.link)
 * - Padded, structured DAP dimensional cards grouped by Activity
 */
export function generatePdfReport(allData = {}, locale = "de") {
  const isDe = locale === "de";
  const now = new Date().toISOString().substring(0, 10);

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - 2 * margin;
  const footerReserved = 14;

  let y = margin;

  // Build relational index
  const { entityRegistry, relations } = buildProjectRelationshipIndex(allData);

  // Link Hotspots: { fromPage, x, y, w, h, targetId }
  const linkHotspots = [];
  // Entity Starting Page Registry: id -> pageNumber
  const entityPageMap = {};

  // Insert soft wrap points inside long unbroken URLs/URIs/tokens so jsPDF never overflows a box
  const wrapLongTokens = (text) =>
    String(text || "").replace(/([\/_\-?&=.:;#]{1})(?=\S{16,})/g, "$1 ");

  const safeSplit = (text, maxWidth) => {
    const str = String(text || "");
    const lines = doc.splitTextToSize(str, maxWidth);
    const out = [];
    lines.forEach((line) => {
      if (doc.getTextWidth(line) > maxWidth + 0.5) {
        out.push(...doc.splitTextToSize(wrapLongTokens(line), maxWidth));
      } else {
        out.push(line);
      }
    });
    return out;
  };

  const truncateToWidth = (text, maxWidth) => {
    const str = String(text || "");
    if (doc.getTextWidth(str) <= maxWidth) return str;
    let lo = 0;
    let hi = str.length;
    while (lo < hi) {
      const mid = Math.ceil((lo + hi) / 2);
      if (doc.getTextWidth(str.slice(0, mid) + "…") <= maxWidth) {
        lo = mid;
      } else {
        hi = mid - 1;
      }
    }
    return lo > 0 ? str.slice(0, lo) + "…" : "…";
  };

  // Clean term formatter: keeps crisp readable terms (and optional URI summary)
  const formatSingleMuseumTerm = (val) => {
    if (!val) return "—";
    if (typeof val === "object") {
      const label =
        val._value ||
        val["#term"] ||
        val.label ||
        val.prefLabel ||
        val.name ||
        "";
      return label ? String(label).trim() : "—";
    }
    let str = String(val).trim();
    str = str.replace(/\s*\(https?:\/\/[^\)]+\)/g, "");
    return str || "—";
  };

  const formatMuseumTerm = (val) => {
    if (!val) return "—";
    if (Array.isArray(val)) {
      const joined = val
        .map(formatSingleMuseumTerm)
        .filter((s) => s && s !== "—")
        .join(", ");
      return joined || "—";
    }
    return formatSingleMuseumTerm(val);
  };

  // Extract human-readable date for Activity
  const getActivityDate = (act) => {
    if (!act) return "—";
    if (Array.isArray(act.temporal) && act.temporal.length > 0) {
      const t = act.temporal[0];
      if (t) {
        const start = t["timeSpan.startDate"] || t.startDate || "";
        const end = t["timeSpan.endDate"] || t.endDate || "";
        const period = t.periodName || t.displayDate || "";
        if (start && end)
          return `${start} bis ${end}${period ? ` (${period})` : ""}`;
        if (start) return `${start}${period ? ` (${period})` : ""}`;
        if (period) return period;
      }
    }
    if (act["startDate"] || act["endDate"]) {
      const s = act["startDate"] || "";
      const e = act["endDate"] || "";
      if (s && e) return `${s} bis ${e}`;
      return s || e;
    }
    if (Array.isArray(act.consistsOf) && act.consistsOf.length > 0) {
      const starts = act.consistsOf.map((c) => c.startDate).filter(Boolean);
      const ends = act.consistsOf.map((c) => c.endDate).filter(Boolean);
      if (starts.length && ends.length)
        return `${starts[0]} bis ${ends[ends.length - 1]}`;
    }
    return (
      act["recordInformation.creation.date"] || act["event.date.date"] || "—"
    );
  };

  // Header helper for subsequent pages
  const drawPageHeader = () => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(
      "HERMES • CARARE 2.0.6 Archival Documentation & Digital Authenticity Profile",
      margin,
      11,
    );
    doc.text(now, pageWidth - margin, 11, { align: "right" });
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(margin, 13, pageWidth - margin, 13);
  };

  // Check page break helper
  const checkPageBreak = (neededHeight = 16) => {
    if (y + neededHeight > pageHeight - margin - footerReserved) {
      doc.addPage();
      y = margin + 4;
      drawPageHeader();
    }
  };

  // Section Header helper
  const printSectionHeader = (title, accentColor = [3, 105, 161]) => {
    checkPageBreak(18);
    y += 2;
    doc.setFillColor(241, 245, 249);
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.3);
    doc.roundedRect(margin, y, contentWidth, 8.5, 1.5, 1.5, "FD");

    doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
    doc.roundedRect(margin, y, 2.8, 8.5, 1, 1, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text(truncateToWidth(title, contentWidth - 10), margin + 5.5, y + 5.7);
    y += 11.5;
  };

  // Dynamic Entity Header Box: wraps title cleanly so it NEVER overflows
  const printEntityHeader = (
    title,
    badge,
    { fill, border, accent, titleColor, badgeColor },
  ) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    const badgeW = doc.getTextWidth(badge) + 8;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    const titleMaxW = Math.max(60, contentWidth - badgeW - 10);
    const titleLines = safeSplit(title, titleMaxW);
    const boxH = Math.max(8.5, titleLines.length * 4.4 + 4.2);

    checkPageBreak(boxH + 4);

    doc.setFillColor(...fill);
    doc.setDrawColor(...border);
    doc.setLineWidth(0.3);
    doc.roundedRect(margin, y, contentWidth, boxH, 1.2, 1.2, "FD");

    doc.setFillColor(...accent);
    doc.roundedRect(margin, y, 2.5, boxH, 0.5, 0.5, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(...titleColor);
    doc.text(titleLines, margin + 4.5, y + 5.4);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(...badgeColor);
    doc.text(badge, pageWidth - margin - 3, y + 5.2, { align: "right" });

    y += boxH + 2;
  };

  // Robust Field Printer helper: GUARANTEES ZERO OVERFLOW
  const printFieldRow = (label, value, bg = false) => {
    if (value === null || value === undefined) return;
    const cleanVal = extractCleanText(value, "—");
    if (!cleanVal || cleanVal === "—") return;

    const labelColWidth = 54;
    const valueColWidth = contentWidth - labelColWidth - 5;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.2);
    const labelLines = safeSplit(String(label), labelColWidth - 6);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    const valueLines = safeSplit(cleanVal, valueColWidth);

    const lineCount = Math.max(labelLines.length, valueLines.length);
    const rowHeight = Math.max(7.0, lineCount * 4.3 + 3.4);

    checkPageBreak(rowHeight + 2);

    if (bg) {
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, y - 0.5, contentWidth, rowHeight, "F");
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.2);
    doc.setTextColor(71, 85, 105);
    doc.text(labelLines, margin + 2.5, y + 3.8);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text(valueLines, margin + labelColWidth, y + 3.8);

    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.2);
    doc.line(
      margin,
      y + rowHeight - 0.5,
      margin + contentWidth,
      y + rowHeight - 0.5,
    );

    y += rowHeight;
  };

  // Interactive Clickable Pills for Relations: guaranteed inside box bounds
  const printRelationRow = (label, targetIds, bg = false) => {
    const validTargets = (targetIds || []).filter(Boolean);
    if (validTargets.length === 0) return;

    const labelColWidth = 54;
    const valueColWidth = contentWidth - labelColWidth - 4;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.2);
    const labelLines = safeSplit(String(label), labelColWidth - 6);

    const pills = [];
    let curX = margin + labelColWidth;
    let curYOffset = 0;
    const pillHeight = 5.4;
    const pillPaddingX = 2.5;
    const maxPillTextW = valueColWidth - pillPaddingX * 2;

    validTargets.forEach((targetId) => {
      const info = entityRegistry[targetId] || {};
      let rawPillText = `-> ${targetId}`;
      let badgeType = "default";

      if (info.type === "HeritageAsset") {
        const shortName =
          info.name && info.name.length > 26
            ? info.name.substring(0, 24) + "…"
            : info.name || "";
        rawPillText = `-> [HA] ${targetId}${shortName ? ` (${shortName})` : ""}`;
        badgeType = "ha";
      } else if (info.type === "DigitalResource") {
        const drRec = info.record || {};
        const drType = String(drRec.type || "").trim();
        const tag =
          info.subType === "master"
            ? "Master"
            : drType && drType !== "3D" && drType !== "3D-Modell"
              ? drType
              : "Derivat";
        rawPillText = `-> [${tag}] ${targetId}`;
        badgeType = info.subType === "master" ? "dr-master" : "dr-deriv";
      } else if (info.type === "Activity") {
        rawPillText = `-> [Aktivität] ${targetId}`;
        badgeType = "activity";
      }

      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      const pillText = truncateToWidth(rawPillText, maxPillTextW);
      const textWidth = doc.getTextWidth(pillText);
      const pillWidth = Math.min(valueColWidth, textWidth + pillPaddingX * 2);

      if (curX + pillWidth > margin + contentWidth) {
        curX = margin + labelColWidth;
        curYOffset += pillHeight + 1.8;
      }

      pills.push({
        targetId,
        text: pillText,
        x: curX,
        yOffset: curYOffset,
        w: pillWidth,
        h: pillHeight,
        badgeType,
      });

      curX += pillWidth + 2.2;
    });

    const contentBlockHeight = curYOffset + pillHeight + 3.2;
    const labelHeight = labelLines.length * 4.2 + 2.5;
    const totalRowHeight = Math.max(contentBlockHeight, labelHeight, 7.8);

    checkPageBreak(totalRowHeight + 2);
    const actualY = y;

    if (bg) {
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, actualY - 0.5, contentWidth, totalRowHeight, "F");
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.2);
    doc.setTextColor(71, 85, 105);
    doc.text(labelLines, margin + 2.5, actualY + 3.8);

    pills.forEach((pill) => {
      const pillY = actualY + pill.yOffset + 1;
      const pillX = pill.x;

      if (pill.badgeType === "dr-master") {
        doc.setFillColor(254, 243, 199);
        doc.setDrawColor(217, 119, 6);
        doc.setTextColor(180, 83, 9);
      } else if (pill.badgeType === "dr-deriv") {
        doc.setFillColor(209, 250, 229);
        doc.setDrawColor(16, 185, 129);
        doc.setTextColor(4, 120, 87);
      } else if (pill.badgeType === "ha") {
        doc.setFillColor(224, 242, 254);
        doc.setDrawColor(14, 165, 233);
        doc.setTextColor(3, 105, 161);
      } else if (pill.badgeType === "activity") {
        doc.setFillColor(238, 242, 255);
        doc.setDrawColor(99, 102, 241);
        doc.setTextColor(67, 56, 202);
      } else {
        doc.setFillColor(241, 245, 249);
        doc.setDrawColor(203, 213, 225);
        doc.setTextColor(15, 23, 42);
      }

      doc.setLineWidth(0.25);
      doc.roundedRect(pillX, pillY, pill.w, pill.h, 1, 1, "FD");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.text(pill.text, pillX + pillPaddingX, pillY + 3.7);

      linkHotspots.push({
        fromPage: doc.internal.getCurrentPageInfo().pageNumber,
        x: pillX,
        y: pillY,
        w: pill.w,
        h: pill.h,
        targetId: pill.targetId,
      });
    });

    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.2);
    doc.line(
      margin,
      actualY + totalRowHeight - 0.5,
      margin + contentWidth,
      actualY + totalRowHeight - 0.5,
    );

    y += totalRowHeight;
  };

  // --- PAGE 1: TITLE BANNER ---
  doc.setFillColor(30, 41, 59);
  doc.roundedRect(margin, y, contentWidth, 25, 3, 3, "F");

  doc.setFillColor(217, 119, 6);
  doc.roundedRect(margin, y + 23.5, contentWidth, 1.5, 0, 0, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13.5);
  doc.text(
    isDe
      ? "HERMES METADATEN- & 3D-ARCHIVBERICHT"
      : "HERMES 3D METADATA & ARCHIVAL REPORT",
    margin + 6,
    y + 10,
  );

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(224, 242, 254);
  doc.text(
    isDe
      ? "Museumsdokumentation • Digital Authenticity Profile (DAP 1–5) • CARARE 2.0.6"
      : "Museum Documentation • Digital Authenticity Profile (DAP 1–5) • CARARE 2.0.6",
    margin + 6,
    y + 17.5,
  );

  y += 30;

  // Overview Statistics Box
  const collections = allData.Collection || [];
  const heritageAssets = allData.HeritageAsset || [];
  const digitalResources = allData.DigitalResource || [];
  const activities = allData.Activity || [];

  const colPrimary = collections[0] || {};
  const colContactOrg =
    Array.isArray(colPrimary.contacts) && colPrimary.contacts[0]
      ? colPrimary.contacts[0].organization || ""
      : "";
  const institutionName = extractCleanText(
    colPrimary["recordInformation.source"] ||
      colPrimary.source ||
      colPrimary.institution ||
      colContactOrg,
    "—",
  );
  const collectionTitle = extractCleanText(
    colPrimary["appellation.name"] || colPrimary.title || colPrimary.name,
    isDe ? "Unbenannte Sammlung" : "Untitled Collection",
  );

  const rawOverviewRows = [
    [isDe ? "Institution / Museum" : "Institution / Museum", institutionName],
    [isDe ? "Sammlung / Projekt" : "Collection / Project", collectionTitle],
    [
      isDe ? "Projektumfang" : "Project Scope",
      `${collections.length} ${isDe ? "Sammlung" : "Collection"} • ${heritageAssets.length} ${isDe ? "Kulturgüter" : "Heritage Assets"} • ${digitalResources.length} ${isDe ? "Digitalisate" : "Digital Resources"} • ${activities.length} ${isDe ? "Aktivitäten" : "Activities"}`,
    ],
    [
      isDe ? "Archivstandard" : "Archival Standard",
      "CARARE 2.0.6 XML (XSD) • BagIt RFC 8493 (SHA-256) • HECTOR / IPTC",
    ],
    [
      isDe ? "Paradata-Standard" : "Paradata Standard",
      "Digital Authenticity Profile (DAP-1 bis DAP-5)",
    ],
    [
      isDe ? "Erstellungsdatum & Software" : "Generated On & Software",
      `${now} • HERMES v0.1.32 (Heritage Metadata Entry System)`,
    ],
  ];

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.2);

  let totalOverviewHeight = 4;
  const processedOverviewRows = rawOverviewRows.map(([k, v]) => {
    const cleanText = extractCleanText(v, "—");
    const vLines = safeSplit(cleanText, contentWidth - 54);
    const rowH = Math.max(6.2, vLines.length * 4.2 + 2.0);
    totalOverviewHeight += rowH;
    return { k: String(k), vLines, rowH };
  });

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, y, contentWidth, totalOverviewHeight + 3, 2, 2, "FD");

  y += 3.5;
  processedOverviewRows.forEach(({ k, vLines, rowH }) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.2);
    doc.setTextColor(71, 85, 105);
    doc.text(k + ":", margin + 4, y + 3.2);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(15, 23, 42);
    doc.text(vLines, margin + 50, y + 3.2);
    y += rowH;
  });

  y += 6;

  // --- CHAPTER 0: COLLECTION INFORMATION ---
  if (collections.length > 0) {
    printSectionHeader(
      isDe
        ? "0. Sammlung & Projektkontext (Collection Information)"
        : "0. Collection Information & Project Context",
      [15, 118, 110],
    );

    collections.forEach((col, idx) => {
      const colId = getEntityId(col, `COL-${idx + 1}`);
      const colName = getEntityName(col, collectionTitle);
      printEntityHeader(
        `${idx + 1}. ${colName} [ID: ${colId}]`,
        isDe ? "SAMMLUNG" : "COLLECTION",
        {
          fill: [240, 253, 250],
          border: [153, 246, 228],
          accent: [15, 118, 110],
          titleColor: [17, 94, 89],
          badgeColor: [15, 118, 110],
        },
      );

      printFieldRow(
        isDe ? "Datenanbieter / Institution" : "Data Provider",
        col["recordInformation.source"] || col.source || institutionName,
        true,
      );
      printFieldRow(
        isDe ? "Sammlungs-ID (Appellation)" : "Collection ID",
        col["appellation.id"],
        false,
      );
      printFieldRow(
        isDe ? "Beschreibung" : "Description",
        col.description,
        true,
      );
      printFieldRow(
        isDe ? "Leitbild / Statement" : "Statement",
        col.statement,
        false,
      );
      if (Array.isArray(col.keywords) && col.keywords.length > 0) {
        printFieldRow(
          isDe ? "Schlagwörter (HECTOR)" : "Keywords",
          formatMuseumTerm(col.keywords),
          true,
        );
      }
      if (Array.isArray(col.contacts) && col.contacts.length > 0) {
        const contactSummary = col.contacts
          .map((c) =>
            [
              c.name,
              c.role ? `(${c.role})` : "",
              c.organization,
              c.email,
            ]
              .filter(Boolean)
              .join(" "),
          )
          .filter(Boolean)
          .join("; ");
        printFieldRow(isDe ? "Kontakt" : "Contacts", contactSummary, false);
      }
      const colRights = [
        col["rights.licence"] ? `Lizenz: ${col["rights.licence"]}` : "",
        col["rights.copyrightCreditLine"]
          ? `Credit: ${col["rights.copyrightCreditLine"]}`
          : "",
        col["rights.accessRights"]
          ? `Zugang: ${col["rights.accessRights"]}`
          : "",
        col["rights.reproductionRights"]
          ? `Reproduktion: ${col["rights.reproductionRights"]}`
          : "",
        col["recordInformation.metadataRights"]
          ? `Metadaten: ${col["recordInformation.metadataRights"]}`
          : "",
      ]
        .filter(Boolean)
        .join(" • ");
      if (colRights) {
        printFieldRow(isDe ? "Rechte & Lizenzen" : "Rights & Licence", colRights, true);
      }
      y += 3;
    });
  }

  // --- CHAPTER 1: HERITAGE ASSETS (PHYSICAL ASSETS) ---
  printSectionHeader(
    isDe
      ? "1. Dokumentierte Kulturgüter (Heritage Assets)"
      : "1. Documented Heritage Assets (Museum Objects)",
    [3, 105, 161],
  );

  if (heritageAssets.length === 0) {
    printFieldRow(
      isDe ? "Status" : "Status",
      isDe ? "Keine Kulturgüter erfasst" : "No assets recorded",
    );
  } else {
    heritageAssets.forEach((ha, idx) => {
      const recId = getEntityId(ha, `HA-${idx + 1}`);
      const name = getEntityName(ha, `Kulturgut ${idx + 1}`);
      const invId = extractCleanText(ha["appellation.id"], "");
      const type = formatMuseumTerm(
        ha["characters.monumentType"] ||
          ha.monumentType ||
          ha.generalType ||
          ha.type ||
          "Artefact",
      );
      const materials = formatMuseumTerm(
        ha["characters.materials"] || ha.materials || ha.material,
      );

      // Temporal array support (characters.temporal)
      let temporalText = "";
      const tempArr = Array.isArray(ha["characters.temporal"])
        ? ha["characters.temporal"]
        : Array.isArray(ha.temporal)
          ? ha.temporal
          : [];
      if (tempArr.length > 0) {
        temporalText = tempArr
          .map((t) => {
            const p = formatSingleMuseumTerm(t.periodName || t.displayDate || "");
            const s = t["timeSpan.startDate"] || t.startDate || "";
            const e = t["timeSpan.endDate"] || t.endDate || "";
            const span = s || e ? ` (${s} bis ${e})` : "";
            return `${p !== "—" ? p : ""}${span}`.trim();
          })
          .filter(Boolean)
          .join("; ");
      } else {
        const period = formatMuseumTerm(ha.periodName || ha.epoch);
        const startDate =
          ha["characters.temporal.timeSpan.startDate"] || ha.startDate || "";
        const endDate =
          ha["characters.temporal.timeSpan.endDate"] || ha.endDate || "";
        if (period !== "—" || startDate || endDate) {
          temporalText = `${period !== "—" ? period : ""}${startDate || endDate ? ` (${startDate} bis ${endDate})` : ""}`.trim();
        }
      }

      // Dimensions array support (characters.dimensions)
      const dimArr = Array.isArray(ha["characters.dimensions"])
        ? ha["characters.dimensions"]
        : [];
      const dimText = dimArr
        .map((d) =>
          [
            d.type ? `${d.type}:` : "",
            d.dimension,
            d.value,
            d.unit,
          ]
            .filter(Boolean)
            .join(" "),
        )
        .filter(Boolean)
        .join("; ");

      const loc =
        ha["spatial.locationSet.namedLocation"] ||
        ha["spatial.namedLocation"] ||
        ha.location ||
        "";
      const town = ha["spatial.locationSet.address.townOrCity"] || "";
      const country = ha["spatial.locationSet.address.country"] || "";
      const repo = formatMuseumTerm(ha.repositoryLocation);
      const desc = extractCleanText(
        ha["characters.description"] || ha.description,
        "",
      );
      const condition = extractCleanText(
        ha["characters.condition"] ||
          ha.condition ||
          ha["conditions.conditionText"],
        "",
      );
      const inscription = extractCleanText(ha["characters.inscription"], "");

      const linkedDrs = Array.from(relations.haToDr[recId] || []);
      const linkedActs = Array.from(relations.haToAct[recId] || []);

      entityPageMap[recId] = doc.internal.getCurrentPageInfo().pageNumber;

      printEntityHeader(
        `${idx + 1}. ${name} [ID: ${recId}]`,
        isDe ? "KULTURGUT" : "HERITAGE ASSET",
        {
          fill: [240, 249, 255],
          border: [186, 230, 253],
          accent: [3, 105, 161],
          titleColor: [3, 105, 161],
          badgeColor: [14, 116, 144],
        },
      );

      if (invId && invId !== "—" && invId !== recId)
        printFieldRow(isDe ? "Inventar- / Objekt-ID" : "Asset ID", invId, false);
      printFieldRow(isDe ? "Objektart / Typologie" : "Typology", type, true);
      printFieldRow(
        isDe ? "Material" : "Materials",
        materials,
        false,
      );
      if (temporalText)
        printFieldRow(
          isDe ? "Datierung & Epoche" : "Dating & Period",
          temporalText,
          true,
        );
      if (dimText)
        printFieldRow(isDe ? "Abmessungen" : "Dimensions", dimText, false);
      if (repo && repo !== "—")
        printFieldRow(
          isDe ? "Standort / Sammlung" : "Repository",
          repo,
          true,
        );
      if (loc || town)
        printFieldRow(
          isDe ? "Fundort / Herkunft" : "Location / Provenance",
          `${loc}${town ? `, ${town}` : ""}${country ? ` (${country})` : ""}`,
          false,
        );
      if (condition && condition !== "—")
        printFieldRow(
          isDe ? "Erhaltungszustand" : "Condition",
          condition,
          true,
        );
      if (inscription && inscription !== "—")
        printFieldRow(isDe ? "Inschrift" : "Inscription", inscription, false);
      if (desc && desc !== "—")
        printFieldRow(isDe ? "Beschreibung" : "Description", desc, true);

      const haRights = [
        ha["rights.licence"] ? `Lizenz: ${ha["rights.licence"]}` : "",
        ha["rights.copyrightCreditLine"]
          ? `Credit: ${ha["rights.copyrightCreditLine"]}`
          : "",
      ]
        .filter(Boolean)
        .join(" • ");
      if (haRights)
        printFieldRow(isDe ? "Rechte & Lizenz" : "Rights", haRights, false);

      if (linkedDrs.length > 0) {
        printRelationRow(
          isDe ? "Zugehörige Digitalisate" : "Digital Representations",
          linkedDrs,
          true,
        );
      }
      if (linkedActs.length > 0) {
        printRelationRow(
          isDe ? "Digitalisierungskampagne" : "Digitisation Campaign",
          linkedActs,
          false,
        );
      }
      y += 3;
    });
  }

  // --- CHAPTER 2: DIGITAL RESOURCES (MASTER & DERIVATIVES) ---
  printSectionHeader(
    isDe
      ? "2. Digitale Ressourcen (Master & Derivate)"
      : "2. Digital Resources (Master & Derivatives)",
    [180, 83, 9],
  );

  if (digitalResources.length === 0) {
    printFieldRow(
      isDe ? "Status" : "Status",
      isDe ? "Keine digitalen Ressourcen erfasst" : "None recorded",
    );
  } else {
    digitalResources.forEach((dr, idx) => {
      const recId = getEntityId(dr, `DR-${idx + 1}`);
      const info = entityRegistry[recId] || {};
      const isMaster = info.subType === "master";
      const drTypeLabel = extractCleanText(dr.type, "3D");

      const name = extractCleanText(
        dr["appellation.name"] || info.name,
        isMaster ? "3D Master Model" : "Digital Derivative",
      );
      const format =
        dr.format || (isMaster ? "model/obj" : "model/gltf-binary");
      const extentList = Array.isArray(dr.extentList) ? dr.extentList : [];
      const extentDisplay =
        extentList.length > 0
          ? extentList.join(" • ")
          : extractCleanText(dr.extent, "—");
      const formatDetails = extractCleanText(dr.formatDetails, "");
      const object = extractCleanText(dr.object, "");
      const drDesc = extractCleanText(dr.description, "");
      const drNote = Array.isArray(dr.note)
        ? dr.note.filter(Boolean).join(" • ")
        : extractCleanText(dr.note, "");
      const licence = dr["rights.licence"] || "";
      const credit = dr["rights.copyrightCreditLine"] || "";
      const acc = dr.accuracy || {};
      const res = dr.resolution || {};
      const swList = Array.isArray(dr.softwareList) ? dr.softwareList : [];

      const parentHaList = Array.from(relations.drToHa[recId] || []);
      const masterList = Array.from(relations.drToMaster[recId] || []);
      const derivList = Array.from(relations.drToDerivatives[recId] || []);
      const linkedActs = Array.from(relations.drToAct[recId] || []);

      entityPageMap[recId] = doc.internal.getCurrentPageInfo().pageNumber;

      const badgeLabel = isMaster
        ? isDe
          ? "ARCHIVMASTER"
          : "ARCHIVAL MASTER"
        : isDe
          ? `DERIVAT (${drTypeLabel.toUpperCase()})`
          : `DERIVATIVE (${drTypeLabel.toUpperCase()})`;

      printEntityHeader(
        `${idx + 1}. ${name} [ID: ${recId}]`,
        badgeLabel,
        isMaster
          ? {
              fill: [254, 243, 199],
              border: [245, 158, 11],
              accent: [217, 119, 6],
              titleColor: [180, 83, 9],
              badgeColor: [180, 83, 9],
            }
          : {
              fill: [209, 250, 229],
              border: [16, 185, 129],
              accent: [5, 150, 105],
              titleColor: [4, 120, 87],
              badgeColor: [4, 120, 87],
            },
      );

      printFieldRow(
        isDe ? "Typ & Format" : "Type & Format",
        `${drTypeLabel} • ${format}${dr.createdOn ? ` • Erstellt: ${dr.createdOn}` : ""}`,
        true,
      );
      if (extentDisplay && extentDisplay !== "—")
        printFieldRow(
          isDe ? "Umfang & Geometrie" : "Extent & Geometry",
          extentDisplay,
          false,
        );
      if (object && object !== "—")
        printFieldRow(
          isDe ? "Datei / URI" : "File / URI",
          object,
          true,
        );
      const metrologyBits = [
        res.spatialResolution ? `Räuml. Auflösung: ${res.spatialResolution}` : "",
        res.textureResolution ? `Textur: ${res.textureResolution}` : "",
        res.gsd ? `GSD: ${res.gsd}` : "",
        acc.pointAccuracy ? `Punktgenauigkeit: ${acc.pointAccuracy}` : "",
        acc.registrationRmse ? `RMSE: ${acc.registrationRmse}` : "",
        acc.calibrationMethod ? `Kalibrierung: ${acc.calibrationMethod}` : "",
      ]
        .filter(Boolean)
        .join(" • ");
      if (metrologyBits)
        printFieldRow(
          isDe ? "Auflösung & Metrologie" : "Resolution & Metrology",
          metrologyBits,
          false,
        );
      if (swList.length > 0) {
        const swText = swList
          .map(
            (s) =>
              `${s.name}${s.version ? ` v${s.version}` : ""}${s.role ? ` (${s.role})` : ""}`,
          )
          .join("; ");
        printFieldRow(isDe ? "Software" : "Software", swText, true);
      }
      if (formatDetails && formatDetails !== "—")
        printFieldRow(
          isDe ? "Technische Details" : "Technical Details",
          formatDetails,
          false,
        );
      if (drDesc && drDesc !== "—")
        printFieldRow(isDe ? "Beschreibung" : "Description", drDesc, true);
      if (drNote && drNote !== "—")
        printFieldRow(isDe ? "Hinweise" : "Notes", drNote, false);
      if (licence || credit) {
        printFieldRow(
          isDe ? "Rechte & Lizenz" : "Licence & Rights",
          `${licence || "—"}${credit ? ` • ${credit}` : ""}`,
          true,
        );
      }

      if (parentHaList.length > 0) {
        printRelationRow(
          isDe ? "Repräsentiertes Kulturgut" : "Represented Asset",
          parentHaList,
          false,
        );
      }
      if (!isMaster && masterList.length > 0) {
        printRelationRow(
          isDe ? "Ursprung (Archivmaster)" : "Source Master File",
          masterList,
          true,
        );
      }
      if (isMaster && derivList.length > 0) {
        printRelationRow(
          isDe ? "Abgeleitete Derivate" : "Derived Assets",
          derivList,
          true,
        );
      }
      if (linkedActs.length > 0) {
        printRelationRow(
          isDe ? "Erzeugende Aktivität" : "Digitisation Activity",
          linkedActs,
          false,
        );
      }

      y += 3;
    });
  }

  // --- CHAPTER 3: ACTIVITIES, WORKFLOW STEPS (consistsOf) & DAP 1–5 ---
  printSectionHeader(
    isDe
      ? "3. Aktivitäten, Arbeitsschritte & Authentizitätsprofil (DAP 1–5)"
      : "3. Activities, Workflow Steps & Authenticity Protocol (DAP 1–5)",
    [67, 56, 202],
  );

  const dapDefs = [
    {
      id: "DAP-1",
      phase: "REFERENCE",
      name: isDe
        ? "DAP-1: Materielle Evidenz & Befund"
        : "DAP-1: Material Traces & Features",
      question: isDe
        ? "Welche materielle Evidenz und Spuren (Bearbeitung, Zustand, Restaurierung) trägt das Objekt?"
        : "What material evidence does the asset carry?",
    },
    {
      id: "DAP-2",
      phase: "CAPTURE",
      name: isDe
        ? "DAP-2: Aufnahmeprozess & Erfassungsumfang"
        : "DAP-2: Scope of Capture & Omissions",
      question: isDe
        ? "Welche Bereiche wurden erfasst, was wurde ausgelassen und warum (Scanner, Optik, Hohlräume)?"
        : "What physical areas were captured, what was omitted, and why?",
    },
    {
      id: "DAP-3",
      phase: "REPRESENTATION",
      name: isDe
        ? "DAP-3: Geometriebearbeitung & Mesh-Fusion"
        : "DAP-3: Geometry Processing",
      question: isDe
        ? "Welche Eingriffe veränderten die 3D-Form (Rauschfilterung, Registrierung, Dezimierung)?"
        : "What interventions altered the 3D geometry?",
    },
    {
      id: "DAP-4",
      phase: "REPRESENTATION",
      name: isDe
        ? "DAP-4: Textur, Delighting & Shader"
        : "DAP-4: Texture & Surface Shaders",
      question: isDe
        ? "Welche Maßnahmen erfolgten an Textur, Farbe und Oberflächenreflexion (Delighting, PBR)?"
        : "What interventions were performed on texture, lighting and color?",
    },
    {
      id: "DAP-5",
      phase: "EVALUATION",
      name: isDe
        ? "DAP-5: Abbildungsbilanz & Gesamturteil"
        : "DAP-5: Balance of Evidence & Verdict",
      question: isDe
        ? "Wie verlässlich bildet das 3D-Modell die Realität ab (Soll-Ist-Abweichung, Einschränkungen)?"
        : "How reliably does the 3D asset represent reality?",
    },
  ];

  const isDapItem = (co) =>
    Boolean(
      co &&
        (co.isDap ||
          co.dapId ||
          String(co["methods#termUID"] || "").includes("/dap/DAP-") ||
          String(co.hadSpecificPurpose || "").includes("Digital Authenticity Profile")),
    );

  if (activities.length === 0) {
    printFieldRow(
      isDe ? "Status" : "Status",
      isDe ? "Keine Digitalisierungsaktivitäten erfasst" : "None recorded",
    );
  } else {
    activities.forEach((act, idx) => {
      const recId = getEntityId(act, `ACT-${idx + 1}`);
      const name = extractCleanText(
        act["appellation.name"],
        isDe ? "3D-Digitalisierung & Paradata" : "3D Digitisation",
      );
      const actType = formatMuseumTerm(
        act.eventType || act.activityType || "3D-Digitalisierung",
      );
      const date = getActivityDate(act);
      const purpose = extractCleanText(
        act.hasGeneralPurpose || act.description,
        "",
      );

      const linkedHaList = Array.from(relations.actToHa[recId] || []);
      const linkedDrList = Array.from(relations.actToDr[recId] || []);
      const consistsOfList = Array.isArray(act.consistsOf)
        ? act.consistsOf
        : [];
      const regularSteps = consistsOfList.filter((co) => !isDapItem(co));

      entityPageMap[recId] = doc.internal.getCurrentPageInfo().pageNumber;

      printEntityHeader(
        `${idx + 1}. ${name} [ID: ${recId}]`,
        isDe ? "AKTIVITÄT" : "ACTIVITY",
        {
          fill: [238, 242, 255],
          border: [199, 210, 254],
          accent: [79, 70, 229],
          titleColor: [67, 56, 202],
          badgeColor: [79, 70, 229],
        },
      );

      printFieldRow(
        isDe ? "Verfahren & Aktivitätstyp" : "Method & Event Type",
        actType,
        true,
      );
      printFieldRow(
        isDe ? "Zeitraum & Kampagnendatum" : "Date & Timespan",
        date,
        false,
      );
      if (purpose && purpose !== "—")
        printFieldRow(
          isDe ? "Erkenntnisziel & Zweck" : "Scholarly Purpose",
          purpose,
          true,
        );

      const actors = Array.isArray(act.actors) ? act.actors : [];
      if (actors.length > 0) {
        const actorSummary = actors
          .map(
            (a) =>
              `${a.name || "Akteur"} (${a.roles || a.role || "Dokumentation"}${a.organization ? `, ${a.organization}` : ""})`,
          )
          .join("; ");
        printFieldRow(
          isDe ? "Beteiligte Fachleute" : "Actors & Contributors",
          actorSummary,
          false,
        );
      }

      if (linkedHaList.length > 0) {
        printRelationRow(
          isDe ? "Digitalisiertes Kulturgut" : "Target Heritage Asset",
          linkedHaList,
          true,
        );
      }
      if (linkedDrList.length > 0) {
        printRelationRow(
          isDe ? "Erzeugte Digitalisate" : "Generated Digital Resources",
          linkedDrList,
          false,
        );
      }

      // Render regular consistsOf work steps (SfM, SLS, Post-Processing, AI)
      if (regularSteps.length > 0) {
        y += 2.5;
        checkPageBreak(12);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8.5);
        doc.setTextColor(51, 65, 85);
        doc.text(
          isDe
            ? `Durchgeführte Arbeitsschritte (${regularSteps.length}):`
            : `Workflow Sub-Steps (${regularSteps.length}):`,
          margin + 2,
          y + 3,
        );
        y += 6;

        regularSteps.forEach((step, sIdx) => {
          const stepTitle = `${isDe ? "Schritt" : "Step"} #${sIdx + 1}: ${extractCleanText(step.hadSpecificPurpose || step.methods, isDe ? "Arbeitsschritt" : "Step")}`;
          const stepSpan =
            step.startDate || step.endDate
              ? `${step.startDate || ""}${step.endDate ? ` – ${step.endDate}` : ""}`
              : "";
          printEntityHeader(stepTitle, stepSpan || "CONSISTS OF", {
            fill: [248, 250, 252],
            border: [203, 213, 225],
            accent: [100, 116, 139],
            titleColor: [30, 41, 59],
            badgeColor: [100, 116, 139],
          });

          if (step.methods)
            printFieldRow(
              isDe ? "Methoden" : "Methods",
              extractCleanText(step.methods, "—"),
              true,
            );
          if (step.techniques)
            printFieldRow(
              isDe ? "Techniken (inkl. IPTC)" : "Techniques",
              extractCleanText(step.techniques, "—"),
              false,
            );
          if (step.materials)
            printFieldRow(
              isDe ? "Materialien / Eingaben" : "Materials / Inputs",
              extractCleanText(step.materials, "—"),
              true,
            );
          if (step.equipment)
            printFieldRow(
              isDe ? "Ausrüstung & KI-Modell" : "Equipment & AI Model",
              extractCleanText(step.equipment, "—"),
              false,
            );
          y += 1.5;
        });
      }

      // Render the 5 DAP authenticity dimensions
      const activeDaps = dapDefs
        .map((def) => {
          const match = consistsOfList.find((co) => {
            const uid = String(co["methods#termUID"] || "");
            const p = String(co.hadSpecificPurpose || "");
            const m = String(co.methods || "");
            return (
              co.dapId === def.id ||
              uid.endsWith(`/${def.id}`) ||
              p.includes(def.id) ||
              m.includes(def.id)
            );
          });
          return match ? { def, match } : null;
        })
        .filter(Boolean);

      if (activeDaps.length > 0) {
        y += 2;
        checkPageBreak(12);

        doc.setFont("helvetica", "bold");
        doc.setFontSize(8.5);
        doc.setTextColor(51, 65, 85);
        doc.text(
          isDe
            ? "Digital Authenticity Profile (DAP-1 bis DAP-5):"
            : "Digital Authenticity Profile (DAP-1 to DAP-5):",
          margin + 2,
          y + 3,
        );
        y += 6;

        activeDaps.forEach(({ def, match }) => {
          const answer =
            extractCleanText(match.methods, "") ||
            extractCleanText(match.techniques, "") ||
            extractCleanText(match.materials, "") ||
            "—";
          const equipment = extractCleanText(match.equipment, "");

          checkPageBreak(14);
          doc.setFillColor(248, 250, 252);
          doc.setDrawColor(226, 232, 240);
          doc.roundedRect(margin, y, contentWidth, 6.2, 1, 1, "FD");

          doc.setFillColor(2, 132, 199);
          doc.roundedRect(margin, y, 2, 6.2, 0.5, 0.5, "F");

          doc.setFont("helvetica", "bold");
          doc.setFontSize(8);
          doc.setTextColor(15, 23, 42);
          doc.text(def.name, margin + 4, y + 4.3);

          doc.setFont("helvetica", "bold");
          doc.setFontSize(7);
          doc.setTextColor(100, 116, 139);
          doc.text(`[${def.phase}]`, pageWidth - margin - 2, y + 4.3, {
            align: "right",
          });
          y += 7.2;

          doc.setFont("helvetica", "italic");
          doc.setFontSize(7.5);
          doc.setTextColor(100, 116, 139);
          const qLines = safeSplit(
            `${isDe ? "Leitfrage" : "Question"}: ${def.question}`,
            contentWidth - 8,
          );
          const qBoxHeight = qLines.length * 3.9 + 4.2;
          checkPageBreak(qBoxHeight + 10);

          doc.setFillColor(248, 250, 252);
          doc.rect(margin + 1, y - 0.5, contentWidth - 2, qBoxHeight, "F");
          doc.text(qLines, margin + 4, y + 3.2);
          y += qBoxHeight + 1.5;

          printFieldRow(
            isDe ? "Dokumentation" : "Documentation",
            answer,
            true,
          );
          if (equipment && equipment !== "—") {
            printFieldRow(
              isDe ? "Geräte & Software" : "Equipment & Software",
              equipment,
              false,
            );
          }
          y += 1.5;
        });
      }

      y += 4;
    });
  }

  // --- FINAL PASS: JUMP LINKS & FOOTER (Page X of Y) ---
  const totalPages = doc.getNumberOfPages();

  linkHotspots.forEach((spot) => {
    const targetPage = entityPageMap[spot.targetId];
    if (targetPage) {
      doc.setPage(spot.fromPage);
      doc.link(spot.x, spot.y, spot.w, spot.h, { pageNumber: targetPage });
    }
  });

  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);

    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);

    doc.text(
      "HERMES v0.1.32 • Heritage Metadata Entry System • BCDH Universität Bonn",
      margin,
      pageHeight - 8,
    );
    const pageStr = isDe
      ? `Seite ${p} von ${totalPages}`
      : `Page ${p} of ${totalPages}`;
    doc.text(pageStr, pageWidth - margin, pageHeight - 8, { align: "right" });
  }

  return doc;
}
