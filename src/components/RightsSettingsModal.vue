<template>
  <dialog class="modal z-[9999]" :class="{ 'modal-open': isOpen }">
    <div
      class="modal-box max-w-4xl w-11/12 bg-base-100 border border-base-300 shadow-2xl p-0 overflow-hidden flex flex-col max-h-[90vh]"
    >
      <!-- Header -->
      <div
        class="px-5 py-4 bg-base-200/70 border-b border-base-300 flex items-center justify-between gap-3 shrink-0"
      >
        <div class="flex items-center gap-2.5">
          <div
            class="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center text-lg shadow-2xs"
          >
            ⚖️
          </div>
          <div>
            <h3 class="font-bold text-base leading-tight text-base-content">
              {{
                locale === "de"
                  ? "Rechte & Lizenzen verwalten"
                  : "Rights & Licenses Management"
              }}
            </h3>
            <p class="text-xs text-base-content/60">
              {{
                locale === "de"
                  ? "Global für das gesamte Projekt festlegen oder gezielt für einzelne Bereiche anpassen"
                  : "Configure globally for the entire project or override for specific sections"
              }}
            </p>
          </div>
        </div>
        <button
          type="button"
          class="btn btn-sm btn-ghost btn-circle"
          @click="emitClose"
        >
          ✕
        </button>
      </div>

      <!-- Mode Tabs: Global vs. Section Overrides -->
      <div
        class="px-5 pt-3 bg-base-200/30 border-b border-base-200 flex flex-wrap items-center justify-between gap-2 shrink-0"
      >
        <div class="tabs tabs-boxed bg-base-200/70 p-1 gap-1">
          <button
            type="button"
            class="tab tab-sm font-semibold rounded-lg transition-all"
            :class="
              activeTab === 'global'
                ? 'tab-active bg-primary text-primary-content'
                : ''
            "
            @click="activeTab = 'global'"
          >
            🌐 {{ locale === "de" ? "Global (Standard)" : "Global (Default)" }}
          </button>
          <button
            type="button"
            class="tab tab-sm font-semibold rounded-lg transition-all"
            :class="
              activeTab === 'collection'
                ? 'tab-active bg-primary text-primary-content'
                : ''
            "
            @click="activeTab = 'collection'"
          >
            📂 {{ locale === "de" ? "Sammlung" : "Collection" }}
          </button>
          <button
            type="button"
            class="tab tab-sm font-semibold rounded-lg transition-all"
            :class="
              activeTab === 'heritage'
                ? 'tab-active bg-primary text-primary-content'
                : ''
            "
            @click="activeTab = 'heritage'"
          >
            🏛️ {{ locale === "de" ? "Kulturgüter" : "Heritage Assets" }}
            <span
              v-if="heritageItems.length > 0"
              class="badge badge-xs ml-1.5 opacity-80"
              >{{ heritageItems.length }}</span
            >
          </button>
          <button
            type="button"
            class="tab tab-sm font-semibold rounded-lg transition-all"
            :class="
              activeTab === 'digital'
                ? 'tab-active bg-primary text-primary-content'
                : ''
            "
            @click="activeTab = 'digital'"
          >
            💻 {{ locale === "de" ? "3D-Modelle" : "Digital Resources" }}
            <span
              v-if="digitalItems.length > 0"
              class="badge badge-xs ml-1.5 opacity-80"
              >{{ digitalItems.length }}</span
            >
          </button>
        </div>

        <!-- Quick Presets on Global Tab -->
        <div v-if="activeTab === 'global'" class="flex flex-wrap gap-1 pb-2">
          <span
            class="text-[11px] opacity-60 font-semibold uppercase self-center mr-1"
          >
            {{ locale === "de" ? "Vorlagen:" : "Presets:" }}
          </span>
          <button
            type="button"
            class="btn btn-xs btn-outline normal-case font-normal"
            @click="applyPreset('ccby')"
          >
            CC-BY 4.0
          </button>
          <button
            type="button"
            class="btn btn-xs btn-outline normal-case font-normal"
            @click="applyPreset('cc0')"
          >
            CC0 1.0
          </button>
          <button
            type="button"
            class="btn btn-xs btn-outline normal-case font-normal"
            @click="applyPreset('ccbysa')"
          >
            CC-BY-SA 4.0
          </button>
        </div>
      </div>

      <!-- Body -->
      <div class="p-5 overflow-y-auto space-y-4 flex-1">
        <!-- TAB 1: GLOBAL (Simplified for everyday use) -->
        <div v-if="activeTab === 'global'" class="space-y-4">
          <div class="p-4 bg-primary/5 rounded-xl border border-primary/20 space-y-3">
            <div class="flex items-center justify-between border-b border-primary/15 pb-1.5">
              <span class="font-bold text-xs uppercase tracking-wider text-primary">
                {{
                  locale === "de"
                    ? "Basis-Rechte (gelten für das gesamte Projekt)"
                    : "Core Rights (apply to the entire project)"
                }}
              </span>
              <span class="badge badge-primary badge-outline badge-xs">Standard</span>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="label py-0.5">
                  <span class="label-text text-xs font-semibold">
                    {{ locale === "de" ? "Lizenz (3D-Modelle & Sammlung):" : "License (Digital & Collection):" }}
                  </span>
                </label>
                <select
                  v-model="globalRights.licence"
                  class="select select-sm select-bordered w-full text-xs"
                >
                  <option
                    v-for="lic in CC_LICENCES"
                    :key="lic.code"
                    :value="locale === 'en' ? lic.uriEn : lic.uriDe"
                  >
                    {{ lic.code }} —
                    {{ locale === "de" ? lic.labelDe : lic.labelEn }}
                  </option>
                  <option v-if="isCustomLicence" :value="globalRights.licence">
                    {{ globalRights.licence }}
                  </option>
                </select>
              </div>

              <div>
                <label class="label py-0.5">
                  <span class="label-text text-xs font-semibold">
                    {{ locale === "de" ? "Zugang:" : "Access:" }}
                  </span>
                </label>
                <select
                  v-model="globalRights.accessRights"
                  class="select select-sm select-bordered w-full text-xs"
                >
                  <option value="Open access">
                    {{
                      locale === "de"
                        ? "Offener Zugang (Open access)"
                        : "Open access"
                    }}
                  </option>
                  <option value="Restricted access">
                    {{
                      locale === "de"
                        ? "Eingeschränkter Zugang (Restricted access)"
                        : "Restricted access"
                    }}
                  </option>
                </select>
              </div>

              <div class="sm:col-span-2">
                <label class="label py-0.5">
                  <span class="label-text text-xs font-semibold">
                    {{
                      locale === "de"
                        ? "Rechteinhaber / Credit Line:"
                        : "Rights Holder / Credit Line:"
                    }}
                  </span>
                </label>
                <input
                  type="text"
                  v-model="globalRights.copyrightCreditLine"
                  class="input input-sm input-bordered w-full text-xs"
                  :placeholder="
                    locale === 'de'
                      ? 'z.B. Staatliche Museen zu Berlin, Antikensammlung / BCDH Uni Bonn'
                      : 'e.g. Antikensammlung Berlin / BCDH University of Bonn'
                  "
                />
              </div>
            </div>
          </div>

          <!-- Collapsible Advanced Rights -->
          <div class="rounded-xl border border-base-300 bg-base-200/30 overflow-hidden">
            <button
              type="button"
              class="w-full px-4 py-2.5 flex items-center justify-between text-xs font-semibold text-base-content/75 hover:bg-base-200/50 transition-colors"
              @click="showAdvancedGlobal = !showAdvancedGlobal"
            >
              <span>
                ⚙️
                {{
                  locale === "de"
                    ? "Erweiterte Rechtefelder (Metadaten-Lizenz, Original-Rechte, Reproduktion)"
                    : "Advanced Rights Fields (Metadata License, Physical Asset, Reproduction)"
                }}
              </span>
              <span class="badge badge-xs badge-ghost">
                {{
                  showAdvancedGlobal
                    ? locale === "de"
                      ? "Ausblenden ▲"
                      : "Hide ▲"
                    : locale === "de"
                      ? "Optional ▼"
                      : "Optional ▼"
                }}
              </span>
            </button>

            <div
              v-if="showAdvancedGlobal"
              class="p-4 pt-2 border-t border-base-300 grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              <!-- Metadata Rights -->
              <div class="space-y-2">
                <span class="font-bold text-[11px] uppercase tracking-wider text-base-content/70 block">
                  {{ locale === "de" ? "Metadaten-Rechte (Europeana)" : "Metadata Rights (Europeana)" }}
                </span>
                <input
                  type="text"
                  v-model="globalRights.metadataRights"
                  class="input input-sm input-bordered w-full font-mono text-xs"
                  placeholder="CC0 1.0 Universal"
                />
                <div class="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    class="badge badge-xs cursor-pointer"
                    :class="
                      globalRights.metadataRights === 'CC0 1.0 Universal'
                        ? 'badge-primary font-bold'
                        : 'badge-ghost border border-base-300'
                    "
                    @click="globalRights.metadataRights = 'CC0 1.0 Universal'"
                  >
                    CC0 1.0
                  </button>
                  <button
                    type="button"
                    class="badge badge-xs cursor-pointer"
                    :class="
                      globalRights.metadataRights === 'Public Domain Mark 1.0'
                        ? 'badge-primary font-bold'
                        : 'badge-ghost border border-base-300'
                    "
                    @click="globalRights.metadataRights = 'Public Domain Mark 1.0'"
                  >
                    Public Domain
                  </button>
                </div>
              </div>

              <!-- Physical Asset Rights -->
              <div class="space-y-2">
                <span class="font-bold text-[11px] uppercase tracking-wider text-amber-700 dark:text-amber-400 block">
                  {{ locale === "de" ? "Rechte am physischen Original" : "Physical Asset Rights" }}
                </span>
                <input
                  type="text"
                  v-model="globalRights.haCopyrightCreditLine"
                  class="input input-sm input-bordered w-full text-xs"
                  :placeholder="locale === 'de' ? 'Eigentümer (z.B. Antikensammlung Berlin)' : 'Owner (e.g. Antikensammlung Berlin)'"
                />
                <div class="grid grid-cols-2 gap-2">
                  <select
                    v-model="globalRights.haAccessRights"
                    class="select select-sm select-bordered w-full text-xs"
                  >
                    <option value="">— {{ locale === "de" ? "Original-Zugang" : "Original Access" }} —</option>
                    <option value="Öffentlich ausgestellt">
                      {{ locale === "de" ? "Öffentlich ausgestellt" : "On public display" }}
                    </option>
                    <option value="Im Museumsdepot / Eingeschränkt">
                      {{ locale === "de" ? "Im Museumsdepot" : "In museum depot" }}
                    </option>
                    <option value="Restricted access">Restricted access</option>
                    <option value="Open access">Open access</option>
                  </select>
                  <input
                    type="text"
                    v-model="globalRights.haReproductionRights"
                    class="input input-sm input-bordered w-full text-xs"
                    :placeholder="locale === 'de' ? 'Reproduktion (Original)' : 'Reproduction (Original)'"
                  />
                </div>
              </div>

              <!-- Digital Reproduction Rights -->
              <div class="md:col-span-2">
                <label class="label py-0.5">
                  <span class="label-text text-xs font-semibold">
                    {{ locale === "de" ? "Reproduktionsrechte (Digitalisate):" : "Reproduction Rights (Digital):" }}
                  </span>
                </label>
                <input
                  type="text"
                  v-model="globalRights.reproductionRights"
                  class="input input-sm input-bordered w-full text-xs"
                  :placeholder="locale === 'de' ? 'z.B. Freie Nutzung für Forschung' : 'e.g. Free use for research'"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- TAB 2: COLLECTION -->
        <div v-else-if="activeTab === 'collection'" class="space-y-4">
          <div
            class="alert alert-info bg-info/10 border-info/30 text-xs py-2.5"
          >
            <span>
              {{
                locale === "de"
                  ? "Hier legen Sie die Rechte speziell für die aktuelle Sammlung fest. Standardmäßig übernimmt die Sammlung die globalen Vorgaben."
                  : "Configure rights specifically for the active collection. By default it inherits global settings."
              }}
            </span>
            <button
              type="button"
              class="btn btn-xs btn-outline"
              @click="copyGlobalToTarget(collectionForm, true)"
            >
              {{
                locale === "de"
                  ? "Globale Rechte übernehmen"
                  : "Copy Global Rights"
              }}
            </button>
          </div>
          <div
            v-if="collectionForm"
            class="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-base-200/30 rounded-xl border border-base-300"
          >
            <div>
              <label class="label py-0.5">
                <span class="label-text text-xs font-semibold">
                  {{ locale === "de" ? "Lizenz:" : "License:" }}
                </span>
              </label>
              <select
                v-model="collectionForm['rights.licence']"
                class="select select-sm select-bordered w-full text-xs"
              >
                <option value="">
                  — {{ locale === "de" ? "Bitte wählen" : "Select" }} —
                </option>
                <option
                  v-for="lic in CC_LICENCES"
                  :key="lic.code"
                  :value="locale === 'en' ? lic.uriEn : lic.uriDe"
                >
                  {{ lic.code }} —
                  {{ locale === "de" ? lic.labelDe : lic.labelEn }}
                </option>
                <option
                  v-if="
                    collectionForm['rights.licence'] &&
                    !CC_LICENCES.some(
                      (l) =>
                        (locale === 'en' ? l.uriEn : l.uriDe) ===
                        collectionForm['rights.licence'],
                    )
                  "
                  :value="collectionForm['rights.licence']"
                >
                  {{ collectionForm["rights.licence"] }}
                </option>
              </select>
            </div>
            <div>
              <label class="label py-0.5">
                <span class="label-text text-xs font-semibold">
                  {{ locale === "de" ? "Zugangsrechte:" : "Access Rights:" }}
                </span>
              </label>
              <select
                v-model="collectionForm['rights.accessRights']"
                class="select select-sm select-bordered w-full text-xs"
              >
                <option value="">
                  — {{ locale === "de" ? "Bitte wählen" : "Select" }} —
                </option>
                <option value="Open access">Open access</option>
                <option value="Restricted access">Restricted access</option>
              </select>
            </div>
            <div>
              <label class="label py-0.5">
                <span class="label-text text-xs font-semibold">
                  {{ locale === "de" ? "Credit Line:" : "Credit Line:" }}
                </span>
              </label>
              <input
                type="text"
                v-model="collectionForm['rights.copyrightCreditLine']"
                class="input input-sm input-bordered w-full text-xs"
              />
            </div>
            <div>
              <label class="label py-0.5">
                <span class="label-text text-xs font-semibold">
                  {{
                    locale === "de"
                      ? "Reproduktionsrechte:"
                      : "Reproduction Rights:"
                  }}
                </span>
              </label>
              <input
                type="text"
                v-model="collectionForm['rights.reproductionRights']"
                class="input input-sm input-bordered w-full text-xs"
              />
            </div>
          </div>
          <div v-else class="text-sm opacity-60 italic p-4 text-center">
            {{
              locale === "de"
                ? "Noch keine Sammlung geladen."
                : "No collection loaded yet."
            }}
          </div>
        </div>

        <!-- TAB 3: HERITAGE ASSETS -->
        <div v-else-if="activeTab === 'heritage'" class="space-y-3">
          <div
            v-if="heritageItems.length === 0"
            class="text-sm opacity-60 italic p-6 text-center border border-dashed border-base-300 rounded-xl"
          >
            {{
              locale === "de"
                ? "Es wurden noch keine Kulturgüter gespeichert. Änderungen im Tab 'Global' gelten automatisch für neu angelegte Objekte."
                : "No saved heritage assets yet. Global settings automatically apply to new items."
            }}
          </div>
          <div v-else class="space-y-2.5">
            <div
              v-for="(item, idx) in safeHeritageItems"
              :key="idx"
              class="p-3.5 bg-base-200/30 rounded-xl border border-base-300 space-y-2"
            >
              <div class="flex items-center justify-between">
                <span class="font-bold text-xs text-base-content">
                  🏛️ {{ getRecordTitle(item, idx, "HA") }}
                </span>
                <button
                  type="button"
                  class="btn btn-xs btn-ghost text-primary"
                  @click="copyGlobalHaToTarget(item)"
                >
                  {{ locale === "de" ? "Global übernehmen" : "Apply Global" }}
                </button>
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input
                  type="text"
                  v-model="item['rights.copyrightCreditLine']"
                  class="input input-xs input-bordered w-full"
                  :placeholder="locale === 'de' ? 'Credit Line' : 'Credit Line'"
                />
                <input
                  type="text"
                  v-model="item['rights.accessRights']"
                  class="input input-xs input-bordered w-full"
                  :placeholder="
                    locale === 'de' ? 'Zugangsrechte' : 'Access Rights'
                  "
                />
                <input
                  type="text"
                  v-model="item['rights.reproductionRights']"
                  class="input input-xs input-bordered w-full"
                  :placeholder="
                    locale === 'de'
                      ? 'Reproduktionsrechte'
                      : 'Reproduction Rights'
                  "
                />
              </div>
            </div>
          </div>
        </div>

        <!-- TAB 4: DIGITAL RESOURCES -->
        <div v-else-if="activeTab === 'digital'" class="space-y-3">
          <div
            v-if="digitalItems.length === 0"
            class="text-sm opacity-60 italic p-6 text-center border border-dashed border-base-300 rounded-xl"
          >
            {{
              locale === "de"
                ? "Es wurden noch keine 3D-Modelle gespeichert. Änderungen im Tab 'Global' gelten automatisch für neu angelegte Modelle."
                : "No saved digital resources yet. Global settings automatically apply to new items."
            }}
          </div>
          <div v-else class="space-y-2.5">
            <div
              v-for="(item, idx) in safeDigitalItems"
              :key="idx"
              class="p-3.5 bg-base-200/30 rounded-xl border border-base-300 space-y-2"
            >
              <div class="flex items-center justify-between">
                <span class="font-bold text-xs text-base-content">
                  💻 {{ getRecordTitle(item, idx, "DR") }}
                </span>
                <button
                  type="button"
                  class="btn btn-xs btn-ghost text-primary"
                  @click="copyGlobalToTarget(item)"
                >
                  {{ locale === "de" ? "Global übernehmen" : "Apply Global" }}
                </button>
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <select
                  v-model="item['rights.licence']"
                  class="select select-xs select-bordered w-full"
                >
                  <option value="">
                    — {{ locale === "de" ? "Lizenz" : "License" }} —
                  </option>
                  <option
                    v-for="lic in CC_LICENCES"
                    :key="lic.code"
                    :value="locale === 'en' ? lic.uriEn : lic.uriDe"
                  >
                    {{ lic.code }}
                  </option>
                  <option
                    v-if="
                      item['rights.licence'] &&
                      !CC_LICENCES.some(
                        (l) =>
                          (locale === 'en' ? l.uriEn : l.uriDe) ===
                          item['rights.licence'],
                      )
                    "
                    :value="item['rights.licence']"
                  >
                    {{ item["rights.licence"] }}
                  </option>
                </select>
                <select
                  v-model="item['rights.accessRights']"
                  class="select select-xs select-bordered w-full"
                >
                  <option value="Open access">Open access</option>
                  <option value="Restricted access">Restricted access</option>
                </select>
                <input
                  type="text"
                  v-model="item['rights.copyrightCreditLine']"
                  class="input input-xs input-bordered w-full"
                  :placeholder="
                    locale === 'de' ? 'Digitalisierungs-Credit' : 'Credit Line'
                  "
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div
        class="px-5 py-3.5 bg-base-200/50 border-t border-base-300 flex flex-wrap items-center justify-between gap-2 shrink-0"
      >
        <div class="text-xs text-base-content/60">
          {{
            locale === "de"
              ? "Änderungen an einzelnen Bereichen überschreiben nur die jeweiligen Datensätze."
              : "Per-section edits only override the selected records."
          }}
        </div>
        <div class="flex items-center gap-2">
          <button
            v-if="activeTab === 'global'"
            type="button"
            class="btn btn-sm btn-primary gap-1.5"
            @click="saveAndApplyGlobal"
          >
            <span>✓</span>
            <span>{{
              locale === "de"
                ? "Global auf alle anwenden & schließen"
                : "Apply Globally & Close"
            }}</span>
          </button>
          <button
            v-else
            type="button"
            class="btn btn-sm btn-primary"
            @click="emitClose"
          >
            {{ locale === "de" ? "Fertig" : "Done" }}
          </button>
        </div>
      </div>
    </div>
    <form
      method="dialog"
      class="modal-backdrop bg-black/50 backdrop-blur-sm"
      @click="emitClose"
    >
      <button>close</button>
    </form>
  </dialog>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import {
  globalRights,
  saveGlobalRights,
  CC_LICENCES,
  resolveLicenceUri,
} from "../utils/sharedState.js";

const props = defineProps({
  isOpen: { type: Boolean, default: false },
  locale: { type: String, default: "de" },
  collectionForm: { type: Object, default: null },
  heritageItems: { type: Array, default: () => [] },
  digitalItems: { type: Array, default: () => [] },
});

const emit = defineEmits(["close", "apply-rights"]);

const activeTab = ref("global");
const showAdvancedGlobal = ref(false);

const safeHeritageItems = computed(() =>
  Array.isArray(props.heritageItems)
    ? props.heritageItems.filter((item) => item && typeof item === "object")
    : [],
);

const safeDigitalItems = computed(() =>
  Array.isArray(props.digitalItems)
    ? props.digitalItems.filter((item) => item && typeof item === "object")
    : [],
);

const isCustomLicence = computed(() => {
  if (!globalRights.licence) return false;
  return !CC_LICENCES.some(
    (l) => l.uriDe === globalRights.licence || l.uriEn === globalRights.licence,
  );
});

const emitClose = () => {
  try {
    saveGlobalRights(globalRights);
  } catch (e) {
    console.warn("Could not persist global rights on close:", e);
  }
  emit("close");
};

const saveAndApplyGlobal = () => {
  try {
    saveGlobalRights(globalRights);
  } catch (e) {
    console.warn("Could not persist global rights:", e);
  }
  emit("apply-rights", globalRights);
  emit("close");
};

const copyGlobalToTarget = (target, isCollection = false) => {
  if (!target) return;
  if (!isCollection) {
    target["recordInformation.metadataRights"] =
      globalRights.metadataRights || "";
  }
  target["rights.licence"] =
    resolveLicenceUri(globalRights.licence, props.locale) || "";
  target["rights.accessRights"] = globalRights.accessRights || "";
  target["rights.copyrightCreditLine"] = globalRights.copyrightCreditLine || "";
  target["rights.reproductionRights"] = globalRights.reproductionRights || "";
};

const handleModalEscape = (e) => {
  if (e.key === "Escape" && props.isOpen) {
    e.preventDefault();
    emitClose();
  }
};
onMounted(() => window.addEventListener("keydown", handleModalEscape));
onBeforeUnmount(() => window.removeEventListener("keydown", handleModalEscape));

const copyGlobalHaToTarget = (target) => {
  if (!target) return;
  target["recordInformation.metadataRights"] =
    globalRights.metadataRights || "";
  target["rights.licence"] =
    resolveLicenceUri(globalRights.licence, props.locale) || "";
  target["rights.copyrightCreditLine"] =
    globalRights.haCopyrightCreditLine ||
    globalRights.copyrightCreditLine ||
    "";
  target["rights.accessRights"] =
    globalRights.haAccessRights || globalRights.accessRights || "";
  target["rights.reproductionRights"] =
    globalRights.haReproductionRights || globalRights.reproductionRights || "";
};

const applyPreset = (type) => {
  const isEn = props.locale === "en";
  if (type === "ccby") {
    globalRights.metadataRights = "CC0 1.0 Universal";
    globalRights.licence = isEn
      ? "https://creativecommons.org/licenses/by/4.0/deed.en"
      : "https://creativecommons.org/licenses/by/4.0/deed.de";
    globalRights.accessRights = "Open access";
    globalRights.reproductionRights = isEn
      ? "Free use for science and research citing the source"
      : "Freie Nutzung für Wissenschaft und Forschung unter Nennung der Quelle";
  } else if (type === "cc0") {
    globalRights.metadataRights = "CC0 1.0 Universal";
    globalRights.licence = isEn
      ? "https://creativecommons.org/publicdomain/zero/1.0/deed.en"
      : "https://creativecommons.org/publicdomain/zero/1.0/deed.de";
    globalRights.accessRights = "Open access";
    globalRights.reproductionRights = isEn
      ? "Public Domain"
      : "Gemeinfrei / Public Domain";
  } else if (type === "ccbysa") {
    globalRights.metadataRights = "CC0 1.0 Universal";
    globalRights.licence = isEn
      ? "https://creativecommons.org/licenses/by-sa/4.0/deed.en"
      : "https://creativecommons.org/licenses/by-sa/4.0/deed.de";
    globalRights.accessRights = "Open access";
    globalRights.reproductionRights = isEn
      ? "ShareAlike under same conditions"
      : "Weitergabe unter gleichen Bedingungen";
  }
};

const getRecordTitle = (item, idx, prefix) => {
  if (!item) return `${prefix}-${idx + 1}`;
  const id =
    item["recordInformation.id"] ||
    item["appellation.id"] ||
    `${prefix}-${idx + 1}`;
  let name = "";
  if (Array.isArray(item["appellation.name"]) && item["appellation.name"][0]) {
    name = item["appellation.name"][0]._value || "";
  } else if (Array.isArray(item["title"]) && item["title"][0]) {
    name = item["title"][0]._value || "";
  }
  return name ? `${id} – ${name}` : id;
};
</script>
