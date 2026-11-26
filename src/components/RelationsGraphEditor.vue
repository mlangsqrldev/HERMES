<template>
  <div class="space-y-4">
    <!-- Top Summary Bar with KPIs -->
    <div
      class="rounded-xl border border-base-300 bg-base-100 p-4 shadow-2xs"
    >
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div class="space-y-1.5 min-w-0 flex-1">
          <div class="flex flex-wrap items-center gap-2">
            <span
              class="w-8 h-8 rounded-xl bg-primary/15 text-primary flex items-center justify-center text-base shrink-0"
              >🔗</span
            >
            <h3 class="font-bold text-base text-base-content">
              {{
                currentLocale === "de"
                  ? "Verknüpfungen & Objekt-Zuordnung"
                  : "Relations & Asset Assignment"
              }}
            </h3>
            <span
              v-if="health.missingRequiredCount > 0"
              class="badge badge-sm bg-amber-500/20 text-amber-800 dark:text-amber-200 border-amber-500/40 font-semibold gap-1"
            >
              ⚠️ {{ health.missingRequiredCount }}
              {{
                currentLocale === "de"
                  ? "Digitalisate ohne Kulturgut"
                  : "resources without asset"
              }}
            </span>
            <span
              v-else-if="digitalItems.length > 0 && heritageItems.length > 0"
              class="badge badge-sm badge-success text-success-content font-semibold gap-1"
            >
              ✓ {{ currentLocale === "de" ? "Alles vollständig zugeordnet" : "All linked" }}
            </span>
          </div>
          <p class="text-xs text-base-content/70 leading-relaxed">
            {{
              currentLocale === "de"
                ? "Legen Sie links/oben fest, welches Kulturgut worin liegt, und wählen Sie für jedes Digitalisat einzeln Kulturgut, Master-Datei und Aktivität."
                : "Set where each Heritage Asset is located, and assign Heritage Asset, Master file, and Activity for each Digital Resource individually."
            }}
          </p>
        </div>

        <!-- Compact KPI Chips + Auto-Match -->
        <div class="flex flex-wrap items-center gap-2 shrink-0">
          <div class="hidden sm:flex items-center gap-1.5 bg-base-100/80 border border-base-300 rounded-xl px-3 py-1.5 text-xs">
            <span class="font-semibold text-sky-600 dark:text-sky-400">🏛️ {{ heritageNodes.length }}</span>
            <span class="opacity-30">|</span>
            <span class="font-semibold text-emerald-600 dark:text-emerald-400">🖥️ {{ digitalNodes.length }}</span>
            <span class="opacity-30">|</span>
            <span class="font-semibold text-amber-600 dark:text-amber-400">📷 {{ activityNodes.length }}</span>
            <span class="opacity-30">|</span>
            <span class="font-mono font-bold">{{ health.totalEdges }} {{ currentLocale === "de" ? "Links" : "links" }}</span>
          </div>

          <button
            type="button"
            class="btn btn-sm btn-primary gap-1.5 shadow-xs"
            :disabled="totalRecordsCount === 0"
            @click="runAutoMatch"
          >
            <span>⚡</span>
            <span>{{
              currentLocale === "de" ? "Automatisch zuordnen" : "Auto-Match"
            }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Status Banner -->
    <div
      v-if="statusBanner"
      class="alert py-2.5 px-4 text-xs flex items-center justify-between gap-3 rounded-xl shadow-2xs"
      :class="statusBanner.type === 'success' ? 'alert-success' : 'alert-info'"
    >
      <span class="font-medium">{{ statusBanner.text }}</span>
      <button type="button" class="btn btn-xs btn-ghost btn-circle" @click="statusBanner = null">✕</button>
    </div>

    <!-- Unsaved Drafts Banner -->
    <div
      v-if="unsavedDraftsCount > 0"
      class="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 rounded-xl bg-amber-500/12 border border-amber-500/35 text-xs"
    >
      <span class="text-amber-900 dark:text-amber-200 font-medium">
        📝
        {{
          currentLocale === "de"
            ? `${unsavedDraftsCount} ungespeicherte(r) Entwurf/Entwürfe in den Formularen.`
            : `${unsavedDraftsCount} unsaved draft(s) in forms.`
        }}
      </span>
      <button type="button" class="btn btn-xs btn-warning" @click="$emit('save-drafts')">
        {{ currentLocale === "de" ? "Entwürfe übernehmen" : "Save Drafts" }}
      </button>
    </div>

    <!-- Full-Width Stacked Panels -->
    <div class="grid grid-cols-1 gap-4 items-start">
      <!-- PANEL 1: HERITAGE ASSET HIERARCHY -->
      <div
        class="rounded-xl border border-base-300 bg-base-100 overflow-hidden shadow-2xs"
      >
        <div class="px-4 py-3 bg-base-200/40 border-b border-base-200 flex items-center justify-between gap-2">
          <div class="flex items-center gap-2">
            <span class="text-base">🏛️</span>
            <div>
              <h4 class="font-bold text-xs uppercase tracking-wider text-sky-700 dark:text-sky-300">
                {{ currentLocale === "de" ? "1. Objekt-Hierarchie" : "1. Object Hierarchy" }}
              </h4>
              <p class="text-[11px] text-base-content/60">
                {{ currentLocale === "de" ? "Welches Objekt liegt worin?" : "What is located inside what?" }}
              </p>
            </div>
          </div>
          <span class="badge badge-sm badge-ghost font-mono">{{ heritageNodes.length }}</span>
        </div>

        <div v-if="heritageNodes.length === 0" class="p-8 text-center text-xs text-base-content/60 space-y-2">
          <div class="text-2xl opacity-50">🏛️</div>
          <p>{{ currentLocale === "de" ? "Noch keine Kulturgüter vorhanden." : "No Heritage Assets yet." }}</p>
        </div>

        <div v-else class="divide-y divide-base-200/80">
          <div
            v-for="row in treeRows"
            :key="row.node.id"
            class="px-4 py-2.5 hover:bg-sky-500/4 transition-colors grid grid-cols-1 sm:grid-cols-12 gap-2 items-center"
          >
            <div class="sm:col-span-7 min-w-0">
              <div
                class="flex items-center gap-1.5"
                :style="{ paddingLeft: `${Math.min(row.depth, 4) * 16}px` }"
              >
                <span
                  v-if="row.depth > 0"
                  class="text-sky-500/70 font-mono text-xs shrink-0"
                  >└─</span
                >
                <span
                  v-else
                  class="w-2 h-2 rounded-full bg-sky-500 shrink-0"
                ></span>
                <span class="font-semibold text-xs text-base-content truncate" :title="row.node.title">
                  {{ row.node.title }}
                </span>
                <span class="badge badge-xs badge-ghost font-mono shrink-0">{{ row.node.id }}</span>
              </div>
            </div>

            <div class="sm:col-span-5">
              <select
                class="select select-sm select-bordered w-full pr-8 text-[13px] border-base-300 transition-colors"
                :class="row.parentId ? 'bg-sky-100 text-sky-950 font-semibold dark:bg-sky-900/50 dark:text-sky-100' : 'bg-base-100'"
                :value="row.parentId"
                @change="setHaParent(row.node, $event.target.value)"
              >
                <option value="" class="bg-base-100 text-base-content font-normal">
                  {{ currentLocale === "de" ? "— Eigenständig —" : "— Top-level —" }}
                </option>
                <option
                  v-for="cand in getParentCandidates(row.node)"
                  :key="cand.id"
                  :value="cand.id"
                  class="bg-base-100 text-base-content font-normal"
                >
                  ↳ {{ cand.title }} ({{ cand.id }})
                </option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <!-- PANEL 2: DIGITAL RESOURCES ASSIGNMENT -->
      <div
        class="rounded-xl border border-base-300 bg-base-100 overflow-hidden shadow-2xs"
      >
        <div class="px-4 py-3 bg-base-200/40 border-b border-base-200 flex items-center justify-between gap-2">
          <div class="flex items-center gap-2">
            <span class="text-base">🖥️</span>
            <div>
              <h4 class="font-bold text-xs uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                {{ currentLocale === "de" ? "2. Digitalisate zuordnen" : "2. Assign Digital Resources" }}
              </h4>
              <p class="text-[11px] text-base-content/60">
                {{
                  currentLocale === "de"
                    ? "Jedes 3D-Modell einzeln mit Kulturgut, Master & Aktivität verknüpfen"
                    : "Link each 3D model individually to Asset, Master & Activity"
                }}
              </p>
            </div>
          </div>
          <span class="badge badge-sm badge-ghost font-mono">{{ digitalNodes.length }}</span>
        </div>

        <div v-if="digitalNodes.length === 0" class="p-8 text-center text-xs text-base-content/60 space-y-2">
          <div class="text-2xl opacity-50">🖥️</div>
          <p>{{ currentLocale === "de" ? "Noch keine Digitalisate vorhanden." : "No Digital Resources yet." }}</p>
        </div>

        <div v-else class="divide-y divide-base-200/80">
          <div
            v-for="dr in digitalNodes"
            :key="dr.id"
            class="p-3.5 hover:bg-emerald-500/4 transition-colors space-y-2.5"
            :class="dr.linkedHaId ? '' : 'bg-amber-50/60 dark:bg-amber-950/20'"
          >
            <!-- Row Header: Digital Resource Name + Status -->
            <div class="flex flex-wrap items-center justify-between gap-2">
              <div class="flex items-center gap-2 min-w-0">
                <span class="font-bold text-xs text-base-content truncate" :title="dr.title">
                  {{ dr.title }}
                </span>
                <span class="badge badge-xs badge-ghost font-mono">{{ dr.id }}</span>
                <span
                  class="badge badge-xs font-mono"
                  :class="dr.masterId || dr.isDerivativeHint ? 'badge-secondary badge-outline' : 'badge-primary badge-outline'"
                >
                  {{
                    dr.masterId || dr.isDerivativeHint
                      ? currentLocale === "de"
                        ? "Low-Poly / Derivat"
                        : "Low-Poly / Derivative"
                      : "Master"
                  }}
                </span>
              </div>

              <span
                v-if="!dr.linkedHaId"
                class="text-[11px] font-semibold text-amber-700 dark:text-amber-300"
              >
                ⚠️ {{ currentLocale === "de" ? "Kulturgut fehlt" : "Asset missing" }}
              </span>
              <span
                v-else
                class="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400"
              >
                ✓ {{ currentLocale === "de" ? "Zugeordnet" : "Linked" }}
              </span>
            </div>

            <!-- Full-Width Stacked Rows (each dropdown gets full width, zero text/arrow overlap) -->
            <div class="space-y-2">
              <div class="grid grid-cols-1 sm:grid-cols-[200px_1fr] items-center gap-2">
                <label class="text-xs font-bold tracking-wide text-base-content/75">
                  🏛️ {{ currentLocale === "de" ? "Gehört zu Kulturgut" : "Heritage Asset" }}
                </label>
                <select
                  class="select select-sm select-bordered w-full pr-8 text-[13px] border-base-300 transition-colors"
                  :class="dr.linkedHaId ? 'bg-emerald-100 text-emerald-950 font-semibold dark:bg-emerald-900/50 dark:text-emerald-100' : 'bg-amber-100 text-amber-950 font-semibold dark:bg-amber-900/50 dark:text-amber-100'"
                  :value="dr.linkedHaId"
                  @change="setDrAsset(dr, $event.target.value)"
                >
                  <option value="" class="bg-base-100 text-base-content font-normal">
                    {{ currentLocale === "de" ? "— Kulturgut wählen —" : "— Select Asset —" }}
                  </option>
                  <option v-for="ha in heritageNodes" :key="ha.id" :value="ha.id" class="bg-base-100 text-base-content font-normal">
                    {{ ha.title }} ({{ ha.id }})
                  </option>
                </select>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-[200px_1fr] items-center gap-2">
                <label class="text-xs font-bold tracking-wide text-base-content/75">
                  🔗 {{ currentLocale === "de" ? "Ableitung von (Master)" : "Derivative of (Master)" }}
                </label>
                <select
                  class="select select-sm select-bordered w-full pr-8 text-[13px] border-base-300 transition-colors"
                  :class="dr.masterId ? 'bg-violet-100 text-violet-950 font-semibold dark:bg-violet-900/50 dark:text-violet-100' : 'bg-base-100'"
                  :value="dr.masterId"
                  @change="setDrMaster(dr, $event.target.value)"
                >
                  <option value="" class="bg-base-100 text-base-content font-normal">
                    {{ currentLocale === "de" ? "— Ist Master (kein Derivat) —" : "— Master (no parent) —" }}
                  </option>
                  <option
                    v-for="m in getMasterCandidates(dr)"
                    :key="m.id"
                    :value="m.id"
                    class="bg-base-100 text-base-content font-normal"
                  >
                    {{ m.title }} ({{ m.id }})
                  </option>
                </select>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-[200px_1fr] items-center gap-2">
                <label class="text-xs font-bold tracking-wide text-base-content/75">
                  📷 {{ currentLocale === "de" ? "Erzeugt in Aktivität" : "Created in Activity" }}
                </label>
                <select
                  class="select select-sm select-bordered w-full pr-8 text-[13px] border-base-300 transition-colors"
                  :class="dr.activityId ? 'bg-amber-100 text-amber-950 font-semibold dark:bg-amber-900/50 dark:text-amber-100' : 'bg-base-100'"
                  :value="dr.activityId"
                  @change="setDrActivity(dr, $event.target.value)"
                >
                  <option value="" class="bg-base-100 text-base-content font-normal">
                    {{ currentLocale === "de" ? "— Keine Aktivität —" : "— None —" }}
                  </option>
                  <option v-for="act in activityNodes" :key="act.id" :value="act.id" class="bg-base-100 text-base-content font-normal">
                    {{ act.title }} ({{ act.id }})
                  </option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- PANEL 3: COLLECTION DC-RELATIONS (CARARE 2.0.6 strictly dcRelation only) -->
      <div
        v-if="collectionForm"
        class="rounded-xl border border-base-300 bg-base-100 overflow-hidden shadow-2xs"
      >
        <div class="px-4 py-3 bg-base-200/40 border-b border-base-200 flex items-center justify-between gap-2">
          <div class="flex items-center gap-2">
            <span class="text-base">📂</span>
            <div>
              <h4 class="font-bold text-xs uppercase tracking-wider text-base-content/85">
                {{
                  currentLocale === "de"
                    ? "3. Sammlung – Externe Verweise (dcRelation)"
                    : "3. Collection – External References (dcRelation)"
                }}
              </h4>
              <p class="text-[11px] text-base-content/60">
                {{
                  currentLocale === "de"
                    ? "Optionale DOIs, Katalog-URLs oder verwandte Sammlungen (CARARE 2.0.6 erlaubt hier ausschließlich dcRelation)"
                    : "Optional DOIs, catalog URLs, or related collections (CARARE 2.0.6 allows dcRelation only)"
                }}
              </p>
            </div>
          </div>
          <span class="badge badge-sm badge-ghost font-mono">{{ collectionDcRelations.length }}</span>
        </div>

        <div class="p-4 space-y-3">
          <div class="flex flex-wrap sm:flex-nowrap items-center gap-2">
            <input
              type="text"
              v-model="newCollectionDcRelation"
              @keydown.enter.prevent="addCollectionDcRelation"
              class="input input-sm input-bordered w-full bg-base-100 font-mono text-xs"
              :placeholder="
                currentLocale === 'de'
                  ? 'https://doi.org/10.xxxx/... oder Sammlungs-URI eingeben'
                  : 'Enter https://doi.org/10.xxxx/... or collection URI'
              "
            />
            <button
              type="button"
              class="btn btn-sm btn-outline btn-primary shrink-0"
              :disabled="!newCollectionDcRelation.trim()"
              @click="addCollectionDcRelation"
            >
              + {{ currentLocale === "de" ? "Hinzufügen" : "Add" }}
            </button>
          </div>

          <div
            v-if="collectionDcRelations.length > 0"
            class="divide-y divide-base-200 rounded-lg border border-base-200 bg-base-100"
          >
            <div
              v-for="(relVal, rIdx) in collectionDcRelations"
              :key="rIdx"
              class="px-3 py-2 flex items-center justify-between gap-2 text-xs"
            >
              <span class="font-mono truncate text-base-content/85" :title="relVal">{{ relVal }}</span>
              <button
                type="button"
                class="btn btn-xs btn-ghost text-error hover:bg-error/10 shrink-0"
                @click="removeCollectionDcRelation(rIdx)"
                :title="currentLocale === 'de' ? 'Entfernen' : 'Remove'"
              >
                ✕
              </button>
            </div>
          </div>
          <p v-else class="text-xs text-base-content/50 italic">
            {{
              currentLocale === "de"
                ? "Keine externen Sammlungsverweise hinterlegt."
                : "No external collection references added."
            }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import {
  getRecordId,
  getRecordTitle,
  getLinkValues,
  analyzeRelationsHealth,
  toggleAssetResourceLink,
  toggleMasterDerivativeLink,
  toggleAssetActivityLink,
  toggleResourceActivityLink,
  toggleAssetPartLink,
  autoMatchRelations,
} from "../utils/relationsHelper.js";

const props = defineProps({
  heritageItems: { type: Array, default: () => [] },
  digitalItems: { type: Array, default: () => [] },
  activityItems: { type: Array, default: () => [] },
  collectionForm: { type: Object, default: null },
  unsavedDraftsCount: { type: Number, default: 0 },
  currentLocale: { type: String, default: "de" },
});

const emit = defineEmits([
  "relations-changed",
  "save-drafts",
  "jump-to-step",
  "edit-record",
]);

const statusBanner = ref(null);
const revision = ref(0);
const newCollectionDcRelation = ref("");

const collectionDcRelations = computed(() => {
  void revision.value;
  const raw = props.collectionForm?.dcRelation;
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) =>
      typeof item === "object" && item !== null ? item._value || item.value || "" : String(item || ""),
    )
    .map((s) => s.trim())
    .filter(Boolean);
});

const addCollectionDcRelation = () => {
  if (!props.collectionForm) return;
  const val = newCollectionDcRelation.value.trim();
  if (!val) return;
  const current = [...collectionDcRelations.value];
  if (!current.includes(val)) {
    current.push(val);
    props.collectionForm.dcRelation = current;
    revision.value++;
    emit("relations-changed");
  }
  newCollectionDcRelation.value = "";
};

const removeCollectionDcRelation = (idx) => {
  if (!props.collectionForm) return;
  const current = [...collectionDcRelations.value];
  current.splice(idx, 1);
  props.collectionForm.dcRelation = current;
  revision.value++;
  emit("relations-changed");
};

const health = computed(() => {
  void revision.value;
  return analyzeRelationsHealth(
    props.heritageItems,
    props.digitalItems,
    props.activityItems,
  );
});

const totalRecordsCount = computed(
  () =>
    (props.heritageItems?.length || 0) +
    (props.digitalItems?.length || 0) +
    (props.activityItems?.length || 0),
);

const heritageNodes = computed(() => {
  void revision.value;
  return (props.heritageItems || [])
    .map((item, index) => {
      const id = getRecordId(item);
      if (!id) return null;
      return {
        id,
        index,
        item,
        title: getRecordTitle(item, id),
        parentIds: getLinkValues(item, "isPartOf"),
        childIds: getLinkValues(item, "hasPart"),
      };
    })
    .filter(Boolean);
});

const activityNodes = computed(() => {
  void revision.value;
  return (props.activityItems || [])
    .map((item, index) => {
      const id = getRecordId(item);
      if (!id) return null;
      return {
        id,
        index,
        item,
        title: getRecordTitle(item, id),
        createdIds: getLinkValues(item, "hasCreated"),
      };
    })
    .filter(Boolean);
});

const digitalNodes = computed(() => {
  void revision.value;
  return (props.digitalItems || [])
    .map((item, index) => {
      const id = getRecordId(item);
      if (!id) return null;
      const title = getRecordTitle(item, id);
      const linkedHaId =
        getLinkValues(item, "isRepresentationOf")[0] ||
        heritageNodes.value.find((h) =>
          getLinkValues(h.item, "hasRepresentation").includes(id),
        )?.id ||
        "";
      const masterId = getLinkValues(item, "isDerivativeOf")[0] || "";
      const activityId =
        activityNodes.value.find((a) => a.createdIds.includes(id))?.id || "";
      const isDerivativeHint =
        /(^|[-_])(lp|lowpoly|low|web|deriv|preview)\b/i.test(id) ||
        /low[- ]?poly|derivat/i.test(title);
      return {
        id,
        index,
        item,
        title,
        linkedHaId,
        masterId,
        activityId,
        isDerivativeHint,
      };
    })
    .filter(Boolean);
});

const treeRows = computed(() => {
  void revision.value;
  const nodes = heritageNodes.value;
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const childrenMap = new Map(nodes.map((n) => [n.id, new Set()]));
  const parentOf = new Map();

  for (const n of nodes) {
    for (const pid of n.parentIds) {
      if (byId.has(pid) && pid !== n.id) {
        childrenMap.get(pid).add(n.id);
        if (!parentOf.has(n.id)) parentOf.set(n.id, pid);
      }
    }
    for (const cid of n.childIds) {
      if (byId.has(cid) && cid !== n.id) {
        childrenMap.get(n.id).add(cid);
        if (!parentOf.has(cid)) parentOf.set(cid, n.id);
      }
    }
  }

  const rows = [];
  const visited = new Set();

  const walk = (id, depth) => {
    if (visited.has(id)) return;
    const node = byId.get(id);
    if (!node) return;
    visited.add(id);
    rows.push({
      node,
      depth,
      parentId: parentOf.get(id) || "",
    });
    for (const cid of childrenMap.get(id) || []) {
      walk(cid, depth + 1);
    }
  };

  for (const n of nodes) {
    if (!parentOf.has(n.id)) walk(n.id, 0);
  }
  for (const n of nodes) {
    walk(n.id, 0);
  }
  return rows;
});

const getParentCandidates = (node) =>
  heritageNodes.value.filter((n) => n.id !== node.id);

const setHaParent = (node, newParentId) => {
  const oldParentIds = getLinkValues(node.item, "isPartOf");
  for (const oldPid of oldParentIds) {
    if (oldPid !== newParentId) {
      const oldParent = heritageNodes.value.find((n) => n.id === oldPid);
      if (oldParent) toggleAssetPartLink(oldParent.item, node.item, false);
    }
  }
  if (newParentId) {
    const newParent = heritageNodes.value.find((n) => n.id === newParentId);
    if (newParent) toggleAssetPartLink(newParent.item, node.item, true);
  }
  revision.value++;
  emit("relations-changed");
};

const getMasterCandidates = (dr) =>
  digitalNodes.value.filter((m) => m.id !== dr.id);

const setDrAsset = (dr, newHaId) => {
  for (const oldHaId of getLinkValues(dr.item, "isRepresentationOf")) {
    if (oldHaId !== newHaId) {
      const oldHa = heritageNodes.value.find((h) => h.id === oldHaId);
      if (oldHa) toggleAssetResourceLink(oldHa.item, dr.item, false);
    }
  }
  if (newHaId) {
    const ha = heritageNodes.value.find((h) => h.id === newHaId);
    if (ha) toggleAssetResourceLink(ha.item, dr.item, true);
  }
  revision.value++;
  emit("relations-changed");
};

const setDrMaster = (dr, newMasterId) => {
  for (const oldMid of getLinkValues(dr.item, "isDerivativeOf")) {
    if (oldMid !== newMasterId) {
      const oldM = digitalNodes.value.find((m) => m.id === oldMid);
      if (oldM) toggleMasterDerivativeLink(oldM.item, dr.item, false);
    }
  }
  if (newMasterId) {
    const master = digitalNodes.value.find((m) => m.id === newMasterId);
    if (master) toggleMasterDerivativeLink(master.item, dr.item, true);
  }
  revision.value++;
  emit("relations-changed");
};

const setDrActivity = (dr, newActId) => {
  for (const act of activityNodes.value) {
    if (act.id !== newActId && act.createdIds.includes(dr.id)) {
      toggleResourceActivityLink(dr.item, act.item, false);
    }
  }
  if (newActId) {
    const act = activityNodes.value.find((a) => a.id === newActId);
    if (act) {
      toggleResourceActivityLink(dr.item, act.item, true);
      if (dr.linkedHaId) {
        const ha = heritageNodes.value.find((h) => h.id === dr.linkedHaId);
        if (ha) toggleAssetActivityLink(ha.item, act.item, true);
      }
    }
  }
  revision.value++;
  emit("relations-changed");
};

const runAutoMatch = () => {
  const result = autoMatchRelations(
    props.heritageItems,
    props.digitalItems,
    props.activityItems,
    props.collectionForm,
  );
  revision.value++;
  emit("relations-changed");
  statusBanner.value = {
    type: result.createdCount > 0 ? "success" : "info",
    text:
      props.currentLocale === "de"
        ? `Automatische Zuordnung: ${result.createdCount} neue Verbindung(en) angelegt.`
        : `Auto-Match: ${result.createdCount} new link(s) created.`,
  };
};
</script>
