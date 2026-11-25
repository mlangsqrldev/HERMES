/**
 * CARARE 2.0.6 Bidirectional Relations Helper & Auto-Matcher
 *
 * Keeps all relation fields strictly compatible with CARARE 2.0.6 XML export
 * and the existing *DcRelations.vue components:
 *  - HeritageAsset <-> DigitalResource:
 *      DR.isRepresentationOf  <->  HA.hasRepresentation
 *  - DigitalResource (Master) <-> DigitalResource (Derivative):
 *      Master.hasDerivative   <->  Derivative.isDerivativeOf
 *  - HeritageAsset <-> Activity:
 *      HA.wasDigitizedBy      <->  Activity.wasPresentAt
 *  - DigitalResource <-> Activity:
 *      Activity.hasCreated    ->   DR ID
 *  - HeritageAsset <-> HeritageAsset:
 *      Parent.hasPart         <->  Child.isPartOf
 *      Replica.isReplicaOf    ->   Original HA ID
 */

export function getRecordId(item) {
  if (!item || typeof item !== "object") return "";
  return String(
    item["recordInformation.id"] ||
      item["appellation.id"] ||
      (typeof item.id === "string" ? item.id : "") ||
      "",
  ).trim();
}

export function getRecordTitle(item, fallback = "") {
  if (!item || typeof item !== "object") return fallback;

  const names = item["appellation.name"] ?? item.title ?? item.name;
  if (Array.isArray(names) && names.length > 0) {
    const preferred = names.find(
      (n) => n && typeof n === "object" && n.preferred === true && (n._value || n.value),
    );
    const chosen = preferred || names[0];
    const val =
      typeof chosen === "object"
        ? chosen?._value || chosen?.value || ""
        : String(chosen || "");
    if (String(val).trim()) return String(val).trim();
  } else if (typeof names === "object" && names !== null) {
    const val = names._value || names.value || "";
    if (String(val).trim()) return String(val).trim();
  } else if (typeof names === "string" && names.trim()) {
    return names.trim();
  }

  return fallback || getRecordId(item);
}

export function extractValueString(entry) {
  if (entry === null || entry === undefined) return "";
  if (typeof entry === "object") {
    return String(entry._value || entry.value || entry.id || "").trim();
  }
  return String(entry).trim();
}

export function getLinkValues(item, key) {
  if (!item || typeof item !== "object") return [];
  const raw = item[key];
  if (Array.isArray(raw)) {
    return raw.map(extractValueString).filter(Boolean);
  }
  if (typeof raw === "string" && raw.trim()) {
    return [raw.trim()];
  }
  return [];
}

export function hasLinkValue(item, key, targetId) {
  const target = String(targetId || "").trim();
  if (!target) return false;
  return getLinkValues(item, key).includes(target);
}

export function addLinkValue(item, key, targetId) {
  const target = String(targetId || "").trim();
  if (!item || typeof item !== "object" || !target) return false;

  if (!Array.isArray(item[key])) {
    const existing = getLinkValues(item, key);
    item[key] = existing;
  }
  if (hasLinkValue(item, key, target)) return false;
  item[key].push(target);
  return true;
}

export function removeLinkValue(item, key, targetId) {
  const target = String(targetId || "").trim();
  if (!item || typeof item !== "object" || !target) return false;
  if (!Array.isArray(item[key])) {
    if (typeof item[key] === "string" && item[key].trim() === target) {
      item[key] = [];
      return true;
    }
    return false;
  }
  const before = item[key].length;
  item[key] = item[key].filter((entry) => extractValueString(entry) !== target);
  return item[key].length !== before;
}

/**
 * Bidirectional: Heritage Asset <-> Digital Resource
 * Writes DR.isRepresentationOf and HA.hasRepresentation
 */
export function toggleAssetResourceLink(ha, dr, forceState = null) {
  const haId = getRecordId(ha);
  const drId = getRecordId(dr);
  if (!haId || !drId) return { changed: false, action: "none" };

  const alreadyLinked =
    hasLinkValue(dr, "isRepresentationOf", haId) &&
    hasLinkValue(ha, "hasRepresentation", drId);
  const partialLinked =
    hasLinkValue(dr, "isRepresentationOf", haId) ||
    hasLinkValue(ha, "hasRepresentation", drId);

  const shouldLink =
    forceState !== null ? Boolean(forceState) : !partialLinked;

  if (shouldLink) {
    if (alreadyLinked) return { changed: false, action: "linked" };
    const c1 = addLinkValue(dr, "isRepresentationOf", haId);
    const c2 = addLinkValue(ha, "hasRepresentation", drId);
    return { changed: c1 || c2, action: "linked" };
  } else {
    const c1 = removeLinkValue(dr, "isRepresentationOf", haId);
    const c2 = removeLinkValue(ha, "hasRepresentation", drId);
    return { changed: c1 || c2, action: "unlinked" };
  }
}

/**
 * Bidirectional: Master Digital Resource <-> Derivative Digital Resource
 * Writes Master.hasDerivative and Derivative.isDerivativeOf
 */
export function toggleMasterDerivativeLink(masterDr, derivDr, forceState = null) {
  const masterId = getRecordId(masterDr);
  const derivId = getRecordId(derivDr);
  if (!masterId || !derivId || masterId === derivId) {
    return { changed: false, action: "none" };
  }

  const alreadyLinked =
    hasLinkValue(masterDr, "hasDerivative", derivId) &&
    hasLinkValue(derivDr, "isDerivativeOf", masterId);
  const partialLinked =
    hasLinkValue(masterDr, "hasDerivative", derivId) ||
    hasLinkValue(derivDr, "isDerivativeOf", masterId);

  const shouldLink =
    forceState !== null ? Boolean(forceState) : !partialLinked;

  if (shouldLink) {
    if (alreadyLinked) return { changed: false, action: "linked" };
    const c1 = addLinkValue(masterDr, "hasDerivative", derivId);
    const c2 = addLinkValue(derivDr, "isDerivativeOf", masterId);
    return { changed: c1 || c2, action: "linked" };
  } else {
    const c1 = removeLinkValue(masterDr, "hasDerivative", derivId);
    const c2 = removeLinkValue(derivDr, "isDerivativeOf", masterId);
    return { changed: c1 || c2, action: "unlinked" };
  }
}

/**
 * Bidirectional: Heritage Asset <-> Activity
 * Writes HA.wasDigitizedBy and Activity.wasPresentAt
 */
export function toggleAssetActivityLink(ha, act, forceState = null) {
  const haId = getRecordId(ha);
  const actId = getRecordId(act);
  if (!haId || !actId) return { changed: false, action: "none" };

  const alreadyLinked =
    hasLinkValue(ha, "wasDigitizedBy", actId) &&
    hasLinkValue(act, "wasPresentAt", haId);
  const partialLinked =
    hasLinkValue(ha, "wasDigitizedBy", actId) ||
    hasLinkValue(act, "wasPresentAt", haId);

  const shouldLink =
    forceState !== null ? Boolean(forceState) : !partialLinked;

  if (shouldLink) {
    if (alreadyLinked) return { changed: false, action: "linked" };
    const c1 = addLinkValue(ha, "wasDigitizedBy", actId);
    const c2 = addLinkValue(act, "wasPresentAt", haId);
    return { changed: c1 || c2, action: "linked" };
  } else {
    const c1 = removeLinkValue(ha, "wasDigitizedBy", actId);
    const c2 = removeLinkValue(act, "wasPresentAt", haId);
    return { changed: c1 || c2, action: "unlinked" };
  }
}

/**
 * Digital Resource <-> Activity
 * Writes Activity.hasCreated -> DR ID
 */
export function toggleResourceActivityLink(dr, act, forceState = null) {
  const drId = getRecordId(dr);
  const actId = getRecordId(act);
  if (!drId || !actId) return { changed: false, action: "none" };

  const isLinked = hasLinkValue(act, "hasCreated", drId);
  const shouldLink = forceState !== null ? Boolean(forceState) : !isLinked;

  if (shouldLink) {
    const c = addLinkValue(act, "hasCreated", drId);
    return { changed: c, action: "linked" };
  } else {
    const c = removeLinkValue(act, "hasCreated", drId);
    return { changed: c, action: "unlinked" };
  }
}

/**
 * Bidirectional: Parent Heritage Asset <-> Child Heritage Asset (Part-Whole)
 * Writes Parent.hasPart and Child.isPartOf
 */
export function toggleAssetPartLink(parentHa, childHa, forceState = null) {
  const parentId = getRecordId(parentHa);
  const childId = getRecordId(childHa);
  if (!parentId || !childId || parentId === childId) {
    return { changed: false, action: "none" };
  }

  const alreadyLinked =
    hasLinkValue(parentHa, "hasPart", childId) &&
    hasLinkValue(childHa, "isPartOf", parentId);
  const partialLinked =
    hasLinkValue(parentHa, "hasPart", childId) ||
    hasLinkValue(childHa, "isPartOf", parentId);

  const shouldLink =
    forceState !== null ? Boolean(forceState) : !partialLinked;

  if (shouldLink) {
    if (alreadyLinked) return { changed: false, action: "linked" };
    const c1 = addLinkValue(parentHa, "hasPart", childId);
    const c2 = addLinkValue(childHa, "isPartOf", parentId);
    return { changed: c1 || c2, action: "linked" };
  } else {
    const c1 = removeLinkValue(parentHa, "hasPart", childId);
    const c2 = removeLinkValue(childHa, "isPartOf", parentId);
    return { changed: c1 || c2, action: "unlinked" };
  }
}

/**
 * Replica Heritage Asset -> Original Heritage Asset
 * Writes Replica.isReplicaOf -> Original ID
 */
export function toggleAssetReplicaLink(replicaHa, originalHa, forceState = null) {
  const replicaId = getRecordId(replicaHa);
  const origId = getRecordId(originalHa);
  if (!replicaId || !origId || replicaId === origId) {
    return { changed: false, action: "none" };
  }

  const isLinked = hasLinkValue(replicaHa, "isReplicaOf", origId);
  const shouldLink = forceState !== null ? Boolean(forceState) : !isLinked;

  if (shouldLink) {
    const c = addLinkValue(replicaHa, "isReplicaOf", origId);
    return { changed: c, action: "linked" };
  } else {
    const c = removeLinkValue(replicaHa, "isReplicaOf", origId);
    return { changed: c, action: "unlinked" };
  }
}

/**
 * Synchronizes Collection hasPart (for all Heritage Assets) and wasDigitizedBy (for all Activities)
 * keeping dcRelation in sync with CollectionDcRelations.vue format.
 */
export function syncCollectionRelations(
  collectionForm,
  heritageItems = [],
  activityItems = [],
) {
  if (!collectionForm || typeof collectionForm !== "object") return 0;
  let added = 0;

  const ensureDcEntry = (prefix, val) => {
    const tag = `${prefix}:${val}`;
    if (!Array.isArray(collectionForm.dcRelation)) {
      collectionForm.dcRelation = [];
    }
    const exists = collectionForm.dcRelation.some((entry) => {
      const s = extractValueString(entry);
      return s === tag || s === val;
    });
    if (!exists) {
      collectionForm.dcRelation.push(tag);
    }
  };

  for (const ha of heritageItems || []) {
    const haId = getRecordId(ha);
    if (!haId) continue;
    if (addLinkValue(collectionForm, "hasPart", haId)) {
      added++;
    }
    ensureDcEntry("hasPart", haId);
  }

  for (const act of activityItems || []) {
    const actId = getRecordId(act);
    if (!actId) continue;
    if (addLinkValue(collectionForm, "wasDigitizedBy", actId)) {
      added++;
    }
    ensureDcEntry("wasDigitizedBy", actId);
  }

  return added;
}

/**
 * Extracts all deduplicated visual edges connecting records currently present in the project.
 */
export function extractAllEdges(
  heritageItems = [],
  digitalItems = [],
  activityItems = [],
) {
  const haIds = new Set((heritageItems || []).map(getRecordId).filter(Boolean));
  const drIds = new Set((digitalItems || []).map(getRecordId).filter(Boolean));
  const actIds = new Set(
    (activityItems || []).map(getRecordId).filter(Boolean),
  );

  const edgesMap = new Map();
  const addEdge = (edge) => {
    if (!edgesMap.has(edge.id)) {
      edgesMap.set(edge.id, edge);
    }
  };

  // 1. HA <-> DR (isRepresentationOf / hasRepresentation)
  for (const dr of digitalItems || []) {
    const drId = getRecordId(dr);
    if (!drId) continue;
    for (const target of getLinkValues(dr, "isRepresentationOf")) {
      if (haIds.has(target)) {
        addEdge({
          id: `rep:${target}->${drId}`,
          type: "representation",
          fromKind: "ha",
          fromId: target,
          toKind: "dr",
          toId: drId,
          labelDe: "ist Darstellung von",
          labelEn: "isRepresentationOf",
        });
      }
    }
    // DR <-> DR (isDerivativeOf)
    for (const masterId of getLinkValues(dr, "isDerivativeOf")) {
      if (drIds.has(masterId) && masterId !== drId) {
        addEdge({
          id: `deriv:${masterId}->${drId}`,
          type: "derivative",
          fromKind: "dr",
          fromId: masterId,
          toKind: "dr",
          toId: drId,
          labelDe: "Derivat von",
          labelEn: "isDerivativeOf",
        });
      }
    }
    // DR <-> DR (hasDerivative)
    for (const derivId of getLinkValues(dr, "hasDerivative")) {
      if (drIds.has(derivId) && derivId !== drId) {
        addEdge({
          id: `deriv:${drId}->${derivId}`,
          type: "derivative",
          fromKind: "dr",
          fromId: drId,
          toKind: "dr",
          toId: derivId,
          labelDe: "Derivat von",
          labelEn: "hasDerivative",
        });
      }
    }
  }

  for (const ha of heritageItems || []) {
    const haId = getRecordId(ha);
    if (!haId) continue;
    for (const drId of getLinkValues(ha, "hasRepresentation")) {
      if (drIds.has(drId)) {
        addEdge({
          id: `rep:${haId}->${drId}`,
          type: "representation",
          fromKind: "ha",
          fromId: haId,
          toKind: "dr",
          toId: drId,
          labelDe: "dargestellt durch",
          labelEn: "hasRepresentation",
        });
      }
    }
    // HA <-> Activity (wasDigitizedBy)
    for (const actId of getLinkValues(ha, "wasDigitizedBy")) {
      if (actIds.has(actId)) {
        addEdge({
          id: `ha-act:${haId}->${actId}`,
          type: "digitizedAsset",
          fromKind: "ha",
          fromId: haId,
          toKind: "act",
          toId: actId,
          labelDe: "erfasst durch",
          labelEn: "wasDigitizedBy",
        });
      }
    }
    // HA <-> HA (hasPart / isPartOf)
    for (const childId of getLinkValues(ha, "hasPart")) {
      if (haIds.has(childId) && childId !== haId) {
        addEdge({
          id: `part:${haId}->${childId}`,
          type: "partOf",
          fromKind: "ha",
          fromId: haId,
          toKind: "ha",
          toId: childId,
          labelDe: "enthält Teil",
          labelEn: "hasPart",
        });
      }
    }
    for (const parentId of getLinkValues(ha, "isPartOf")) {
      if (haIds.has(parentId) && parentId !== haId) {
        addEdge({
          id: `part:${parentId}->${haId}`,
          type: "partOf",
          fromKind: "ha",
          fromId: parentId,
          toKind: "ha",
          toId: haId,
          labelDe: "enthält Teil",
          labelEn: "isPartOf",
        });
      }
    }
    // HA <-> HA (isReplicaOf)
    for (const origId of getLinkValues(ha, "isReplicaOf")) {
      if (haIds.has(origId) && origId !== haId) {
        addEdge({
          id: `replica:${haId}->${origId}`,
          type: "replicaOf",
          fromKind: "ha",
          fromId: haId,
          toKind: "ha",
          toId: origId,
          labelDe: "Abguss/Kopie von",
          labelEn: "isReplicaOf",
        });
      }
    }
  }

  for (const act of activityItems || []) {
    const actId = getRecordId(act);
    if (!actId) continue;
    for (const haId of getLinkValues(act, "wasPresentAt")) {
      if (haIds.has(haId)) {
        addEdge({
          id: `ha-act:${haId}->${actId}`,
          type: "digitizedAsset",
          fromKind: "ha",
          fromId: haId,
          toKind: "act",
          toId: actId,
          labelDe: "erfasst durch",
          labelEn: "wasPresentAt",
        });
      }
    }
    for (const drId of getLinkValues(act, "hasCreated")) {
      if (drIds.has(drId)) {
        addEdge({
          id: `dr-act:${drId}->${actId}`,
          type: "createdResource",
          fromKind: "dr",
          fromId: drId,
          toKind: "act",
          toId: actId,
          labelDe: "erstellt durch",
          labelEn: "hasCreated",
        });
      }
    }
  }

  return Array.from(edgesMap.values());
}

/**
 * Analyzes missing required relations & orphan nodes across the project.
 */
export function analyzeRelationsHealth(
  heritageItems = [],
  digitalItems = [],
  activityItems = [],
) {
  const edges = extractAllEdges(heritageItems, digitalItems, activityItems);

  const linkedHa = new Set();
  const linkedDrToHa = new Set();
  const linkedAct = new Set();

  for (const e of edges) {
    if (e.type === "representation") {
      linkedHa.add(e.fromId);
      linkedDrToHa.add(e.toId);
    } else if (e.type === "digitizedAsset") {
      linkedHa.add(e.fromId);
      linkedAct.add(e.toId);
    } else if (e.type === "createdResource") {
      linkedAct.add(e.toId);
    }
  }

  const unlinkedAssets = new Set();
  for (const ha of heritageItems || []) {
    const id = getRecordId(ha);
    if (!id) continue;
    // Also consider external/manual hasRepresentation values
    const hasManualRep = getLinkValues(ha, "hasRepresentation").length > 0;
    if (!linkedHa.has(id) && !hasManualRep) {
      unlinkedAssets.add(id);
    }
  }

  const unlinkedResources = new Set();
  for (const dr of digitalItems || []) {
    const id = getRecordId(dr);
    if (!id) continue;
    // Mandatory CARARE field: isRepresentationOf (internal or external URI/ID)
    const hasAnyRep = getLinkValues(dr, "isRepresentationOf").length > 0;
    if (!linkedDrToHa.has(id) && !hasAnyRep) {
      unlinkedResources.add(id);
    }
  }

  const unlinkedActivities = new Set();
  for (const act of activityItems || []) {
    const id = getRecordId(act);
    if (!id) continue;
    const hasManual =
      getLinkValues(act, "wasPresentAt").length > 0 ||
      getLinkValues(act, "hasCreated").length > 0;
    if (!linkedAct.has(id) && !hasManual) {
      unlinkedActivities.add(id);
    }
  }

  return {
    edges,
    totalEdges: edges.length,
    unlinkedAssets,
    unlinkedResources,
    unlinkedActivities,
    missingRequiredCount: unlinkedResources.size,
    orphanCount: unlinkedAssets.size + unlinkedResources.size,
  };
}

/**
 * Normalizes an ID into a comparable stem for conservative Auto-Matching.
 */
export function normalizeMatchStem(raw) {
  if (!raw) return "";
  let s = String(raw).trim().toUpperCase();
  // Strip common project/entity prefixes
  s = s.replace(
    /^(HERMES[-_])?(HA|DR|DO|ACT|OBJ|MOD|3D|ASSET|RES|MODEL)[-_]+/,
    "",
  );
  // Repeatedly strip common technical/variant suffixes
  let prev = "";
  while (prev !== s) {
    prev = s;
    s = s.replace(
      /[-_]+(WEB[-_]?GLB|WEB[-_]?3D|WEB|GLB|GLTF|OBJ|PLY|STL|FBX|USDZ|MASTER|HIGH[-_]?POLY|LOW[-_]?POLY|HP|LP|RAW|DERIV(?:ATIVE)?|PREVIEW|LIGHT|GAME[-_]?READY|ARCHIVE|ARCHIV|TEX|TEXTURES?)$/,
      "",
    );
  }
  // Collapse separators to uniform underscore
  s = s.replace(/[\s\-./]+/g, "_").replace(/^_+|_+$/g, "");
  return s;
}

const DERIVATIVE_SUFFIX_REGEX =
  /[-_]+(WEB[-_]?GLB|WEB[-_]?3D|WEB|GLB|GLTF|LOW[-_]?POLY|LP|DERIV(?:ATIVE)?|PREVIEW|LIGHT|GAME[-_]?READY)$/i;

export function isLikelyDerivativeId(id) {
  return DERIVATIVE_SUFFIX_REGEX.test(String(id || "").trim());
}

/**
 * Conservative, idempotent 1-Click Auto-Matcher:
 *  1. Links Derivative DRs (-WEB-GLB, -LP, etc.) to matching Master DRs.
 *  2. Links DRs (without isRepresentationOf) to matching Heritage Assets by ID/inventory stem,
 *     or by inheriting their Master DR's HA, or when only 1 HA exists in the project.
 *  3. Links HAs & DRs to the project Activity when 1 Activity exists (or by stem match).
 *  4. Optionally syncs Collection hasPart & wasDigitizedBy.
 */
export function autoMatchRelations(
  heritageItems = [],
  digitalItems = [],
  activityItems = [],
  collectionForm = null,
) {
  let assetResourceLinks = 0;
  let masterDerivativeLinks = 0;
  let activityLinks = 0;
  let collectionLinks = 0;

  const drList = (digitalItems || []).filter((d) => Boolean(getRecordId(d)));
  const haList = (heritageItems || []).filter((h) => Boolean(getRecordId(h)));
  const actList = (activityItems || []).filter((a) => Boolean(getRecordId(a)));

  // 1. Master <-> Derivative matching
  const masterCandidates = drList.filter((dr) => !isLikelyDerivativeId(getRecordId(dr)));
  for (const dr of drList) {
    const drId = getRecordId(dr);
    if (!isLikelyDerivativeId(drId)) continue;
    if (getLinkValues(dr, "isDerivativeOf").length > 0) continue;

    const derivStem = normalizeMatchStem(drId);
    if (derivStem.length < 2) continue;

    // Prefer exact stem match against non-derivative master candidates
    const pool = masterCandidates.length > 0 ? masterCandidates : drList;
    const match = pool.find((cand) => {
      const candId = getRecordId(cand);
      if (candId === drId) return false;
      return normalizeMatchStem(candId) === derivStem;
    });

    if (match) {
      const res = toggleMasterDerivativeLink(match, dr, true);
      if (res.changed) masterDerivativeLinks++;
    }
  }

  // 2. Heritage Asset <-> Digital Resource matching
  const haStemIndex = haList.map((ha) => {
    const id = getRecordId(ha);
    const inv = String(ha["repositoryLocation.inventoryNumber"] || "").trim();
    const stems = new Set();
    const sId = normalizeMatchStem(id);
    if (sId.length >= 2) stems.add(sId);
    const sInv = normalizeMatchStem(inv);
    if (sInv.length >= 2) stems.add(sInv);
    return { ha, id, stems };
  });

  // Pass 2a: stem matching for DRs without isRepresentationOf
  for (const dr of drList) {
    if (getLinkValues(dr, "isRepresentationOf").length > 0) {
      // Ensure bidirectional HA.hasRepresentation is also populated if internal HA exists
      for (const targetHaId of getLinkValues(dr, "isRepresentationOf")) {
        const matchedHa = haList.find((h) => getRecordId(h) === targetHaId);
        if (matchedHa) {
          const res = toggleAssetResourceLink(matchedHa, dr, true);
          if (res.changed) assetResourceLinks++;
        }
      }
      continue;
    }

    const drId = getRecordId(dr);
    const drStem = normalizeMatchStem(drId);

    let matchedHa = null;
    if (drStem.length >= 2) {
      const exactMatches = haStemIndex.filter((entry) =>
        entry.stems.has(drStem),
      );
      if (exactMatches.length === 1) {
        matchedHa = exactMatches[0].ha;
      }
    }

    // Fallback: if exactly 1 Heritage Asset in project
    if (!matchedHa && haList.length === 1) {
      matchedHa = haList[0];
    }

    if (matchedHa) {
      const res = toggleAssetResourceLink(matchedHa, dr, true);
      if (res.changed) assetResourceLinks++;
    }
  }

  // Pass 2b: derivatives inherit HA from their linked Master DR if still unlinked
  for (const dr of drList) {
    if (getLinkValues(dr, "isRepresentationOf").length > 0) continue;
    const masterIds = getLinkValues(dr, "isDerivativeOf");
    for (const mId of masterIds) {
      const master = drList.find((d) => getRecordId(d) === mId);
      if (!master) continue;
      for (const haId of getLinkValues(master, "isRepresentationOf")) {
        const ha = haList.find((h) => getRecordId(h) === haId);
        if (ha) {
          const res = toggleAssetResourceLink(ha, dr, true);
          if (res.changed) assetResourceLinks++;
        }
      }
    }
  }

  // 3. Activity matching
  if (actList.length === 1) {
    const singleAct = actList[0];
    for (const ha of haList) {
      const res = toggleAssetActivityLink(ha, singleAct, true);
      if (res.changed) activityLinks++;
    }
    for (const dr of drList) {
      const res = toggleResourceActivityLink(dr, singleAct, true);
      if (res.changed) activityLinks++;
    }
  } else if (actList.length > 1) {
    for (const act of actList) {
      const actStem = normalizeMatchStem(getRecordId(act));
      if (actStem.length < 2) continue;
      for (const entry of haStemIndex) {
        if (entry.stems.has(actStem)) {
          const res = toggleAssetActivityLink(entry.ha, act, true);
          if (res.changed) activityLinks++;
        }
      }
      for (const dr of drList) {
        if (normalizeMatchStem(getRecordId(dr)) === actStem) {
          const res = toggleResourceActivityLink(dr, act, true);
          if (res.changed) activityLinks++;
        }
      }
    }
  }

  // 4. Optional Collection sync
  if (collectionForm) {
    collectionLinks = syncCollectionRelations(collectionForm, haList, actList);
  }

  return {
    createdCount:
      assetResourceLinks +
      masterDerivativeLinks +
      activityLinks +
      collectionLinks,
    assetResourceLinks,
    masterDerivativeLinks,
    activityLinks,
    collectionLinks,
  };
}

/**
 * Counts active relations on a single CRUD form (used by collapsed inline panels).
 */
export function countFormRelations(form, kind) {
  if (!form || typeof form !== "object") return 0;
  const keysByKind = {
    collection: ["hasPart", "wasDigitizedBy", "isPartOf", "dcRelation"],
    heritage: [
      "hasRepresentation",
      "wasDigitizedBy",
      "wasPresentAt",
      "hasPart",
      "isPartOf",
      "isSuccessorOf",
      "isReplicaOf",
      "dcRelation",
    ],
    digital: [
      "isRepresentationOf",
      "isDerivativeOf",
      "hasDerivative",
      "createdDerivative",
      "hasPart",
      "isPartOf",
      "nextInSequence",
      "isPreviousInSequence",
      "dcRelation",
    ],
    activity: [
      "wasPresentAt",
      "hasCreated",
      "hasPart",
      "isPartOf",
      "isSuccessorOf",
      "dcRelation",
    ],
  };

  const keys = keysByKind[kind] || [];
  if (kind === "collection") {
    // Deduplicate collection hasPart/wasDigitizedBy also mirrored in dcRelation
    const seen = new Set();
    for (const k of keys) {
      for (const v of getLinkValues(form, k)) {
        const normalized = v.includes(":") && !v.startsWith("http") && !v.startsWith("doi:")
          ? v
          : `${k}:${v}`;
        seen.add(normalized);
      }
    }
    return seen.size;
  }

  let total = 0;
  for (const k of keys) {
    total += getLinkValues(form, k).length;
  }
  return total;
}
