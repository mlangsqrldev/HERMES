<template>
  <div class="relative w-full">
    <!-- Provider Toggle (HECTOR Epochen vs. PeriodO) -->
    <div class="flex flex-wrap items-center justify-between gap-1.5 mb-2">
      <div class="flex items-center gap-1.5 text-xs">
        <span class="text-[10px] uppercase font-bold text-base-content/50 mr-1">
          {{
            currentLocale === "de"
              ? "Vokabular / Katalog:"
              : "Vocabulary / Source:"
          }}
        </span>
        <button
          type="button"
          class="btn btn-xs gap-1 normal-case transition-all"
          :class="
            providerMode === 'hector'
              ? 'btn-primary font-bold shadow-xs'
              : 'btn-ghost border border-base-300 font-medium opacity-75 hover:opacity-100'
          "
          @click="setProviderMode('hector')"
        >
          <span>🏛️</span>
          <span>HECTOR Epochen</span>
          <span
            class="badge badge-xs text-[9px]"
            :class="providerMode === 'hector' ? 'badge-neutral' : 'badge-ghost'"
            >BCDH</span
          >
        </button>
        <button
          type="button"
          class="btn btn-xs gap-1 normal-case transition-all"
          :class="
            providerMode === 'periodo'
              ? 'btn-primary font-bold shadow-xs'
              : 'btn-ghost border border-base-300 font-medium opacity-75 hover:opacity-100'
          "
          @click="setProviderMode('periodo')"
        >
          <span>🌐</span>
          <span>PeriodO</span>
          <span
            class="badge badge-xs text-[9px]"
            :class="
              providerMode === 'periodo' ? 'badge-neutral' : 'badge-ghost'
            "
            >ARK</span
          >
        </button>
        <button
          type="button"
          class="btn btn-xs gap-1 normal-case transition-all"
          :class="
            providerMode === 'all'
              ? 'btn-primary font-bold shadow-xs'
              : 'btn-ghost border border-base-300 font-medium opacity-75 hover:opacity-100'
          "
          @click="setProviderMode('all')"
        >
          <span>🔍</span>
          <span>{{ currentLocale === "de" ? "Alle durchsuchen" : "All" }}</span>
        </button>
      </div>

      <span
        v-if="providerMode === 'hector'"
        class="text-[10px] text-base-content/50 font-mono hidden sm:inline"
      >
        vocabs.bcdh.uni-bonn.de/hector_epochs
      </span>
      <span
        v-else-if="providerMode === 'periodo'"
        class="text-[10px] text-base-content/50 font-mono hidden sm:inline"
      >
        perio.do (ARK gazetteer)
      </span>
    </div>

    <!-- Optional Region Filter Chips (Default: All Regions) -->
    <div class="flex flex-wrap items-center gap-1 mb-1.5">
      <button
        v-for="reg in REGION_FILTERS"
        :key="reg.id"
        type="button"
        class="btn btn-xs h-6 min-h-0 px-2 text-[11px]"
        :class="
          regionFilter === reg.id
            ? 'btn-secondary font-bold'
            : 'btn-ghost border border-base-300 opacity-75 hover:opacity-100'
        "
        @click="
          regionFilter = reg.id;
          isOpen = true;
        "
      >
        {{ currentLocale === "de" ? reg.de : reg.en }}
      </button>
    </div>

    <!-- Search Input Bar -->
    <div class="relative flex items-center">
      <div
        class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-base-content/40"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="size-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>

      <input
        type="text"
        v-model="searchQuery"
        @focus="isOpen = true"
        @input="onSearchInput"
        @keydown.down.prevent="highlightNext"
        @keydown.up.prevent="highlightPrev"
        @keydown.enter.prevent="selectHighlighted"
        @keydown.esc.prevent="isOpen = false"
        :placeholder="computedPlaceholder"
        class="input input-bordered w-full pl-9 pr-36 text-sm focus:input-primary rounded-xl transition-all shadow-sm"
      />

      <div class="absolute inset-y-0 right-0 flex items-center pr-2 gap-1.5">
        <span
          v-if="searchQuery"
          @click="clearSearch"
          class="cursor-pointer text-xs badge badge-ghost badge-sm hover:badge-error"
          >✕</span
        >
        <span
          class="badge text-[10px] font-bold tracking-wider px-2 py-0.5 shadow-2xs"
          :class="
            providerMode === 'hector'
              ? 'badge-primary'
              : providerMode === 'periodo'
                ? 'badge-info badge-outline'
                : 'badge-ghost border border-base-300'
          "
        >
          {{
            providerMode === "hector"
              ? "HECTOR"
              : providerMode === "periodo"
                ? "PeriodO"
                : "HECTOR + PeriodO"
          }}
        </span>
      </div>
    </div>

    <!-- HECTOR Chronology note -->
    <div
      v-if="providerMode === 'hector'"
      class="text-[10px] text-base-content/50 mt-1 px-1 flex items-center gap-1"
    >
      <span>ℹ️</span>
      <span>{{
        currentLocale === "de"
          ? "Hinweis: HECTOR liefert Epochen-Konzepte & URIs. Angezeigte Datierungsspannen basieren auf archäologischen Standardwerten."
          : "Note: HECTOR provides epoch concepts & URIs. Year spans are derived from standard archaeological dating."
      }}</span>
    </div>

    <!-- Quick Selection Chips based on active catalog mode -->
    <div class="flex flex-wrap gap-1 mt-1.5 px-0.5">
      <span
        class="text-[10px] uppercase font-bold text-base-content/40 self-center mr-1"
      >
        {{ currentLocale === "de" ? "Häufig:" : "Popular:" }}
      </span>
      <button
        v-for="quick in activeQuickEpochs"
        :key="quick.id || quick.uri"
        type="button"
        @click.prevent="selectPeriod(quick)"
        class="badge badge-sm badge-ghost hover:badge-primary text-[11px] cursor-pointer transition-colors py-0.5 px-2"
        :title="`${quick.authority}: ${quick.start || '-'} → ${quick.stop || '-'}`"
      >
        <span class="mr-0.5 text-[10px]">{{
          quick.authority === "HECTOR" ? "🏛️" : "🌐"
        }}</span>
        <span>{{
          quick.shortLabel ||
          (currentLocale === "de" && quick.labelDe
            ? quick.labelDe
            : quick.label)
        }}</span>
      </button>
    </div>

    <!-- Dropdown Results Panel -->
    <div
      v-if="isOpen && (displayedPeriods.length > 0 || isLiveSearching)"
      class="absolute left-0 right-0 z-50 mt-1 max-h-84 overflow-y-auto rounded-2xl border border-base-300 bg-base-100 shadow-2xl p-1.5 backdrop-blur-xl"
    >
      <div
        class="px-2 py-1 text-[11px] font-semibold text-base-content/50 uppercase tracking-wider flex justify-between items-center border-b border-base-200 mb-1"
      >
        <span>
          {{
            providerMode === "hector"
              ? "HECTOR Epochen (BCDH Skosmos)"
              : providerMode === "periodo"
                ? "PeriodO Epochenkatalog"
                : "HECTOR & PeriodO Epochen"
          }}
        </span>
        <span
          v-if="isLiveSearching"
          class="flex items-center gap-1 text-primary"
        >
          <span class="loading loading-spinner loading-xs"></span>
          {{
            currentLocale === "de" ? "Lade Skosmos..." : "Searching Skosmos..."
          }}
        </span>
        <span v-else
          >{{ displayedPeriods.length }}
          {{ currentLocale === "de" ? "Treffer" : "matches" }}</span
        >
      </div>

      <ul class="menu menu-compact p-0">
        <li
          v-for="(p, idx) in displayedPeriods"
          :key="p.id || p.uri || idx"
          class="rounded-xl overflow-hidden mb-1"
        >
          <a
            @click.prevent="selectPeriod(p)"
            :class="[
              'flex flex-col items-start gap-1 p-2.5 rounded-xl transition-colors',
              highlightedIndex === idx
                ? 'bg-primary/10 text-primary border border-primary/20'
                : 'hover:bg-base-200',
            ]"
          >
            <div class="flex items-center justify-between w-full">
              <div class="flex items-center gap-2">
                <span
                  class="badge badge-xs font-bold text-[9px]"
                  :class="
                    p.authority === 'HECTOR' ? 'badge-primary' : 'badge-neutral'
                  "
                >
                  {{ p.authority === "HECTOR" ? "🏛️ HECTOR" : "🌐 PeriodO" }}
                </span>
                <span class="font-bold text-sm text-base-content">{{
                  currentLocale === "de" && p.labelDe ? p.labelDe : p.label
                }}</span>
                <span
                  v-if="
                    currentLocale === 'de' && p.labelDe && p.label !== p.labelDe
                  "
                  class="text-xs text-base-content/50 italic"
                  >({{ p.label }})</span
                >
              </div>
              <span
                v-if="p.start || p.stop"
                class="badge badge-sm badge-ghost text-xs font-mono font-bold tracking-tight bg-base-200/80"
              >
                {{ formatYear(p.start) }} → {{ formatYear(p.stop) }}
              </span>
            </div>

            <div
              class="flex items-center gap-2 text-xs text-base-content/60 w-full justify-between mt-0.5"
            >
              <div class="flex items-center gap-1.5">
                <span
                  v-if="p.region"
                  class="badge badge-xs badge-ghost text-[10px]"
                  >{{ p.region }}</span
                >
                <span class="text-[11px] text-base-content/40">{{
                  p.source
                }}</span>
              </div>
              <span
                class="font-mono text-[10px] text-primary/70 truncate max-w-[240px]"
              >
                {{
                  (p.id || p.uri || "")
                    .replace("http://n2t.net/", "")
                    .replace(
                      "http://vocabs.bcdh.uni-bonn.de/hector_epochs/",
                      "hector:",
                    )
                }}
              </span>
            </div>
          </a>
        </li>
      </ul>
    </div>

    <!-- Active Selection Pill & Quick Apply -->
    <div
      v-if="selectedPeriod"
      class="mt-2 p-2.5 rounded-xl bg-primary/5 border border-primary/20 flex items-center justify-between gap-3 text-xs"
    >
      <div class="flex items-center gap-2 overflow-hidden flex-wrap">
        <span class="badge badge-primary badge-sm font-bold">
          {{
            selectedPeriod.authority === "HECTOR" ? "🏛️ HECTOR" : "✓ PeriodO"
          }}
        </span>
        <span class="font-bold text-base-content truncate">
          {{
            currentLocale === "de" && selectedPeriod.labelDe
              ? selectedPeriod.labelDe
              : selectedPeriod.label
          }}
        </span>
        <span
          v-if="selectedPeriod.start || selectedPeriod.stop"
          class="font-mono text-primary font-semibold"
        >
          [{{ formatYear(selectedPeriod.start) }} /
          {{ formatYear(selectedPeriod.stop) }}]
        </span>
        <span
          v-if="selectedPeriod.region"
          class="badge badge-outline badge-xs text-base-content/50"
          >{{ selectedPeriod.region }}</span
        >
      </div>
      <div class="flex items-center gap-1 shrink-0">
        <a
          :href="selectedPeriod.id || selectedPeriod.uri"
          target="_blank"
          rel="noopener"
          class="btn btn-ghost btn-xs text-primary underline"
          :title="
            selectedPeriod.authority === 'HECTOR'
              ? 'Open in BCDH Skosmos'
              : 'Open in perio.do'
          "
        >
          {{ selectedPeriod.authority === "HECTOR" ? "HECTOR ↗" : "ARK ↗" }}
        </a>
        <button
          type="button"
          @click="selectedPeriod = null"
          class="btn btn-ghost btn-xs text-error"
        >
          ✕
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from "vue";

const props = defineProps({
  currentLocale: {
    type: String,
    default: "de",
  },
  modelValue: {
    type: String,
    default: "",
  },
});

const emit = defineEmits(["select", "update:modelValue"]);

const REGION_FILTERS = [
  { id: "all", de: "Alle Regionen", en: "All Regions" },
  { id: "egypt", de: "Ägypten", en: "Egypt" },
  { id: "mediterranean", de: "Mittelmeer & Antike", en: "Mediterranean" },
  { id: "europe", de: "Europa", en: "Europe" },
];
const regionFilter = ref("all");

const RECENT_PERIODS_KEY = "hermes_recent_periods_v1";
const loadRecentPeriods = () => {
  try {
    const raw = localStorage.getItem(RECENT_PERIODS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.slice(0, 5) : [];
  } catch {
    return [];
  }
};
const recentPeriods = ref(loadRecentPeriods());
const recordRecentPeriod = (period) => {
  if (!period || (!period.label && !period.labelDe)) return;
  const key = period.id || period.uri || period.label;
  const next = [
    period,
    ...recentPeriods.value.filter((p) => (p.id || p.uri || p.label) !== key),
  ].slice(0, 5);
  recentPeriods.value = next;
  try {
    localStorage.setItem(RECENT_PERIODS_KEY, JSON.stringify(next));
  } catch {
    // ignore storage error
  }
};

const providerMode = ref("all"); // 'hector' | 'periodo' | 'all'
const searchQuery = ref(props.modelValue || "");
const isOpen = ref(false);
const highlightedIndex = ref(-1);
const selectedPeriod = ref(null);
const isLiveSearching = ref(false);
const liveSkosmosResults = ref([]);
const livePeriodoResults = ref([]);

let livePeriodoCache = null;
let livePeriodoPromise = null;
async function ensureLivePeriodoCache() {
  if (livePeriodoCache) return livePeriodoCache;
  if (livePeriodoPromise) return livePeriodoPromise;
  livePeriodoPromise = fetch("https://data.perio.do/dataset/", {
    headers: { Accept: "application/json" },
  })
    .then((r) => (r.ok ? r.json() : null))
    .then((data) => {
      if (!data?.authorities) return [];
      const list = [];
      for (const auth of Object.values(data.authorities)) {
        const authTitle = auth.source?.title || "PeriodO";
        for (const [pId, p] of Object.entries(auth.periods || {})) {
          const start = p.start?.in?.year || p.start?.in?.earliestYear || "";
          const stop = p.stop?.in?.year || p.stop?.in?.latestYear || "";
          if (!p.label || (!start && !stop)) continue;
          const spatial =
            p.spatialCoverageDescription ||
            (p.spatialCoverage || []).map((s) => s.label).join(", ") ||
            "";
          list.push({
            id: `http://n2t.net/ark:/99152/${pId}`,
            uri: `http://n2t.net/ark:/99152/${pId}`,
            label: p.label,
            labelDe: p.label,
            start: String(start),
            stop: String(stop),
            region: spatial || "PeriodO",
            source: `PeriodO (${String(authTitle).slice(0, 28)})`,
            authority: "PeriodO",
            aliases: [spatial].filter(Boolean),
          });
        }
      }
      livePeriodoCache = list;
      return list;
    })
    .catch((e) => {
      console.warn("Live PeriodO dataset fetch failed:", e);
      livePeriodoPromise = null;
      return [];
    });
  return livePeriodoPromise;
}

const setProviderMode = (mode) => {
  providerMode.value = mode;
  isOpen.value = true;
};

const computedPlaceholder = computed(() => {
  if (providerMode.value === "hector") {
    return props.currentLocale === "de"
      ? "HECTOR Epoche suchen (z. B. Römische Kaiserzeit, Spätklassik, Hellenismus, Eisenzeit...)"
      : "Search HECTOR epoch (e.g. Roman Imperial, Late Classical, Hellenistic, Iron Age...)";
  } else if (providerMode.value === "periodo") {
    return props.currentLocale === "de"
      ? "PeriodO Epoche suchen (z. B. Augustus, Frühe Kaiserzeit, Tiberius, Spätklassik...)"
      : "Search PeriodO epoch (e.g. Augustus, Early Imperial, Tiberius, Late Classical...)";
  }
  return props.currentLocale === "de"
    ? "Epoche in HECTOR oder PeriodO suchen..."
    : "Search epoch in HECTOR or PeriodO...";
});

// Curated canonical HECTOR epochs dataset from vocabs.bcdh.uni-bonn.de/hector_epochs/
const HECTOR_EPOCHS_CATALOG = [
  {
    id: "http://vocabs.bcdh.uni-bonn.de/hector_epochs/c_e4a9851a",
    uri: "http://vocabs.bcdh.uni-bonn.de/hector_epochs/c_e4a9851a",
    label: "Roman Imperial Period",
    labelDe: "Römische Kaiserzeit",
    start: "-0027",
    stop: "0284",
    region: "Römisches Reich",
    source: "HECTOR Epochen (BCDH)",
    authority: "HECTOR",
    aliases: [
      "römische kaiserzeit",
      "roemische kaiserzeit",
      "kaiserzeit",
      "imperial",
    ],
  },
  {
    id: "http://vocabs.bcdh.uni-bonn.de/hector_epochs/c_6d1aeb13",
    uri: "http://vocabs.bcdh.uni-bonn.de/hector_epochs/c_6d1aeb13",
    label: "Early Imperial Period",
    labelDe: "Frühe Kaiserzeit",
    start: "-0027",
    stop: "0096",
    region: "Römisches Reich",
    source: "HECTOR Epochen (BCDH)",
    authority: "HECTOR",
    aliases: [
      "frühe kaiserzeit",
      "fruehe kaiserzeit",
      "early imperial",
      "julisch-claudisch",
    ],
  },
  {
    id: "http://vocabs.bcdh.uni-bonn.de/hector_epochs/c_4b0ed540",
    uri: "http://vocabs.bcdh.uni-bonn.de/hector_epochs/c_4b0ed540",
    label: "Middle Imperial Period",
    labelDe: "Mittlere Kaiserzeit",
    start: "0096",
    stop: "0192",
    region: "Römisches Reich",
    source: "HECTOR Epochen (BCDH)",
    authority: "HECTOR",
    aliases: ["mittlere kaiserzeit", "adoptivkaiser", "trajan", "hadrian"],
  },
  {
    id: "http://vocabs.bcdh.uni-bonn.de/hector_epochs/c_c6fe0856",
    uri: "http://vocabs.bcdh.uni-bonn.de/hector_epochs/c_c6fe0856",
    label: "Late Imperial Period",
    labelDe: "Späte Kaiserzeit",
    start: "0193",
    stop: "0284",
    region: "Römisches Reich",
    source: "HECTOR Epochen (BCDH)",
    authority: "HECTOR",
    aliases: [
      "späte kaiserzeit",
      "spaete kaiserzeit",
      "severer",
      "soldatenkaiser",
    ],
  },
  {
    id: "http://vocabs.bcdh.uni-bonn.de/hector_epochs/c_ac0e5ec7",
    uri: "http://vocabs.bcdh.uni-bonn.de/hector_epochs/c_ac0e5ec7",
    label: "Augustus (Period)",
    labelDe: "Augustus (Augusteische Zeit)",
    start: "-0027",
    stop: "0014",
    region: "Römisches Reich",
    source: "HECTOR Epochen (BCDH)",
    authority: "HECTOR",
    aliases: ["augustus", "augusteisch", "oktavian"],
  },
  {
    id: "http://vocabs.bcdh.uni-bonn.de/hector_epochs/c_9b22217a",
    uri: "http://vocabs.bcdh.uni-bonn.de/hector_epochs/c_9b22217a",
    label: "Late Classical Period",
    labelDe: "Spätklassische Epoche (Spätklassik)",
    start: "-0400",
    stop: "-0323",
    region: "Griechenland & Attika",
    source: "HECTOR Epochen (BCDH)",
    authority: "HECTOR",
    aliases: [
      "spätklassik",
      "spätklassische epoche",
      "late classical",
      "nikarete",
      "attika",
    ],
  },
  {
    id: "http://vocabs.bcdh.uni-bonn.de/hector_epochs/c_90ffba6d",
    uri: "http://vocabs.bcdh.uni-bonn.de/hector_epochs/c_90ffba6d",
    label: "High Classical Period",
    labelDe: "Hochklassische Epoche (Hochklassik)",
    start: "-0450",
    stop: "-0400",
    region: "Griechenland",
    source: "HECTOR Epochen (BCDH)",
    authority: "HECTOR",
    aliases: ["hochklassik", "perikles", "parthenon"],
  },
  {
    id: "http://vocabs.bcdh.uni-bonn.de/hector_epochs/c_91f42aa0",
    uri: "http://vocabs.bcdh.uni-bonn.de/hector_epochs/c_91f42aa0",
    label: "Early Classical Period",
    labelDe: "Frühklassische Epoche (Frühklassik)",
    start: "-0480",
    stop: "-0450",
    region: "Griechenland",
    source: "HECTOR Epochen (BCDH)",
    authority: "HECTOR",
    aliases: ["frühklassik", "strenger stil"],
  },
  {
    id: "http://vocabs.bcdh.uni-bonn.de/hector_epochs/c_acc34558",
    uri: "http://vocabs.bcdh.uni-bonn.de/hector_epochs/c_acc34558",
    label: "Classical Greece",
    labelDe: "Klassische Epoche (Klassik)",
    start: "-0480",
    stop: "-0323",
    region: "Griechenland & Mittelmeer",
    source: "HECTOR Epochen (BCDH)",
    authority: "HECTOR",
    aliases: ["klassik", "klassische epoche", "athen"],
  },
  {
    id: "http://vocabs.bcdh.uni-bonn.de/hector_epochs/c_268a1738",
    uri: "http://vocabs.bcdh.uni-bonn.de/hector_epochs/c_268a1738",
    label: "Hellenistic Period",
    labelDe: "Hellenismus",
    start: "-0323",
    stop: "-0031",
    region: "Östlicher Mittelmeerraum",
    source: "HECTOR Epochen (BCDH)",
    authority: "HECTOR",
    aliases: ["hellenismus", "hellenistisch", "alexander"],
  },
  {
    id: "http://vocabs.bcdh.uni-bonn.de/hector_epochs/c_733a7405",
    uri: "http://vocabs.bcdh.uni-bonn.de/hector_epochs/c_733a7405",
    label: "Bronze Age",
    labelDe: "Bronzezeit",
    start: "-02200",
    stop: "-00800",
    region: "Europa & Ägäis",
    source: "HECTOR Epochen (BCDH)",
    authority: "HECTOR",
    aliases: ["bronzezeit", "mykenisch", "minoisch"],
  },
  {
    id: "http://vocabs.bcdh.uni-bonn.de/hector_epochs/c_20bac33e",
    uri: "http://vocabs.bcdh.uni-bonn.de/hector_epochs/c_20bac33e",
    label: "Iron Age",
    labelDe: "Eisenzeit",
    start: "-00800",
    stop: "0050",
    region: "Europa",
    source: "HECTOR Epochen (BCDH)",
    authority: "HECTOR",
    aliases: ["eisenzeit", "hallstatt", "latene"],
  },
  {
    id: "http://vocabs.bcdh.uni-bonn.de/hector_epochs/c_6f64b8ff",
    uri: "http://vocabs.bcdh.uni-bonn.de/hector_epochs/c_6f64b8ff",
    label: "Roman Iron Age",
    labelDe: "Römische Eisenzeit",
    start: "0001",
    stop: "0400",
    region: "Mitteleuropa & Skandinavien",
    source: "HECTOR Epochen (BCDH)",
    authority: "HECTOR",
    aliases: ["römische eisenzeit", "germanien"],
  },
  {
    id: "http://vocabs.bcdh.uni-bonn.de/hector_epochs/c_ba983e27",
    uri: "http://vocabs.bcdh.uni-bonn.de/hector_epochs/c_ba983e27",
    label: "Copper Age / Chalcolithic",
    labelDe: "Kupferzeit (Chalkolithikum)",
    start: "-04000",
    stop: "-02200",
    region: "Europa",
    source: "HECTOR Epochen (BCDH)",
    authority: "HECTOR",
    aliases: ["kupferzeit", "chalkolithikum", "ötzi"],
  },
  {
    id: "http://vocabs.bcdh.uni-bonn.de/hector_epochs/c_be027feb",
    uri: "http://vocabs.bcdh.uni-bonn.de/hector_epochs/c_be027feb",
    label: "Stone Age",
    labelDe: "Steinzeit",
    start: "-2500000",
    stop: "-02200",
    region: "Europa",
    source: "HECTOR Epochen (BCDH)",
    authority: "HECTOR",
    aliases: ["steinzeit", "paläolithikum", "neolithikum"],
  },
  {
    id: "http://vocabs.bcdh.uni-bonn.de/hector_epochs/c_b750d7f6",
    uri: "http://vocabs.bcdh.uni-bonn.de/hector_epochs/c_b750d7f6",
    label: "Antiquity",
    labelDe: "Altertum (Antike)",
    start: "-0800",
    stop: "0500",
    region: "Mittelmeerraum",
    source: "HECTOR Epochen (BCDH)",
    authority: "HECTOR",
    aliases: ["altertum", "antike"],
  },
  {
    id: "http://vocabs.bcdh.uni-bonn.de/hector_epochs/c_63260e46",
    uri: "http://vocabs.bcdh.uni-bonn.de/hector_epochs/c_63260e46",
    label: "Middle Ages",
    labelDe: "Mittelalter",
    start: "0500",
    stop: "1500",
    region: "Europa",
    source: "HECTOR Epochen (BCDH)",
    authority: "HECTOR",
    aliases: [
      "mittelalter",
      "frühmittelalter",
      "hochmittelalter",
      "spätmittelalter",
    ],
  },
  {
    id: "http://vocabs.bcdh.uni-bonn.de/hector_epochs/c_b6182e52",
    uri: "http://vocabs.bcdh.uni-bonn.de/hector_epochs/c_b6182e52",
    label: "Modern Era",
    labelDe: "Neuzeit",
    start: "1500",
    stop: "2025",
    region: "Europa",
    source: "HECTOR Epochen (BCDH)",
    authority: "HECTOR",
    aliases: ["neuzeit", "frühe neuzeit"],
  },
];

// Curated canonical PeriodO dataset with verified ARK identifiers from data.perio.do
const PERIODO_CATALOG = [
  {
    id: "http://n2t.net/ark:/99152/p0jrrjb7g67",
    label: "Augustan Age",
    labelDe: "Augusteische Zeit (Augustus)",
    start: "-0026",
    stop: "0014",
    region: "Römisches Reich",
    source: "PeriodO (EDH)",
    authority: "PeriodO",
    aliases: [
      "augustus",
      "ausgutus",
      "augusteisch",
      "octavian",
      "oktavian",
      "frühe kaiserzeit",
      "early imperial",
    ],
  },
  {
    id: "http://n2t.net/ark:/99152/p06c6g34dd8",
    label: "Tiberius, 14-37",
    labelDe: "Tiberische Zeit (Kaiser Tiberius)",
    start: "0014",
    stop: "0037",
    region: "Römisches Reich",
    source: "PeriodO (LCSH)",
    authority: "PeriodO",
    aliases: ["tiberius", "tiberisch", "kaiser tiberius", "frühe kaiserzeit"],
  },
  {
    id: "http://n2t.net/ark:/99152/p06c6g3w825",
    label: "Claudius, 41-54",
    labelDe: "Claudische Zeit (Kaiser Claudius)",
    start: "0041",
    stop: "0054",
    region: "Römisches Reich",
    source: "PeriodO (LCSH)",
    authority: "PeriodO",
    aliases: ["claudius", "claudisch", "kaiser claudius"],
  },
  {
    id: "http://n2t.net/ark:/99152/p0jrrjbr7m9",
    label: "Neronian",
    labelDe: "Neronische Zeit (Kaiser Nero)",
    start: "0054",
    stop: "0068",
    region: "Römisches Reich",
    source: "PeriodO (EDH)",
    authority: "PeriodO",
    aliases: ["nero", "neronisch", "kaiser nero"],
  },
  {
    id: "http://n2t.net/ark:/99152/p0jrrjbj7h3",
    label: "Trajanic",
    labelDe: "Trajanische Zeit (Kaiser Trajan)",
    start: "0098",
    stop: "0117",
    region: "Römisches Reich",
    source: "PeriodO (EDH)",
    authority: "PeriodO",
    aliases: ["trajan", "trajanisch", "kaiser trajan"],
  },
  {
    id: "http://n2t.net/ark:/99152/p077pzfwxfr",
    label: "Hadrianic",
    labelDe: "Hadrianische Zeit (Kaiser Hadrian)",
    start: "0117",
    stop: "0138",
    region: "Römisches Reich",
    source: "PeriodO",
    authority: "PeriodO",
    aliases: ["hadrian", "hadrianisch", "kaiser hadrian"],
  },
  {
    id: "http://n2t.net/ark:/99152/p06v8w498hd",
    label: "Early Imperial",
    labelDe: "Frühe Römische Kaiserzeit",
    start: "0001",
    stop: "0100",
    region: "Römisches Reich",
    source: "PeriodO (FASTI)",
    authority: "PeriodO",
    aliases: ["frühe kaiserzeit", "fruehe kaiserzeit", "early imperial"],
  },
  {
    id: "http://n2t.net/ark:/99152/p0qhb66dt5q",
    label: "Roman Imperial",
    labelDe: "Römische Kaiserzeit",
    start: "-0030",
    stop: "0399",
    region: "Römisches Reich",
    source: "PeriodO (ARIADNE)",
    authority: "PeriodO",
    aliases: ["römische kaiserzeit", "kaiserzeit", "roman imperial"],
  },
  {
    id: "http://n2t.net/ark:/99152/p077pzfr5f7",
    label: "Severan",
    labelDe: "Severische Dynastie (Severerzeit)",
    start: "0193",
    stop: "0235",
    region: "Römisches Reich",
    source: "PeriodO",
    authority: "PeriodO",
    aliases: ["severer", "severan", "septimius severus"],
  },
  {
    id: "http://n2t.net/ark:/99152/p06v8w4k77h",
    label: "Roman Republican",
    labelDe: "Römische Republik",
    start: "-0349",
    stop: "0029",
    region: "Rom & Italien",
    source: "PeriodO (FASTI)",
    authority: "PeriodO",
    aliases: ["republik", "caesar", "cicero", "roman republic"],
  },
  {
    id: "http://n2t.net/ark:/99152/p0z5nvh5rr9",
    label: "Late Classical Period",
    labelDe: "Spätklassische Periode (Spätklassik)",
    start: "-0399",
    stop: "-0322",
    region: "Griechenland & Attika",
    source: "PeriodO",
    authority: "PeriodO",
    aliases: ["spätklassik", "spätklassisch", "late classical", "nikarete"],
  },
  {
    id: "http://n2t.net/ark:/99152/p083p5rbj32",
    label: "High Classical",
    labelDe: "Hochklassik (Perikleische Zeit)",
    start: "-0449",
    stop: "-0399",
    region: "Griechenland & Ägäis",
    source: "PeriodO",
    authority: "PeriodO",
    aliases: ["hochklassik", "perikles", "parthenon"],
  },
  {
    id: "http://n2t.net/ark:/99152/p083p5rb9mx",
    label: "Early Classical",
    labelDe: "Frühklassik (Strenger Stil)",
    start: "-0479",
    stop: "-0449",
    region: "Griechenland & Ägäis",
    source: "PeriodO",
    authority: "PeriodO",
    aliases: ["frühklassik", "strenger stil"],
  },
  {
    id: "http://n2t.net/ark:/99152/p0mn2ndtsjq",
    label: "Classical Period",
    labelDe: "Klassische Zeit (Klassik)",
    start: "-0480",
    stop: "-0324",
    region: "Griechenland & Mittelmeer",
    source: "PeriodO",
    authority: "PeriodO",
    aliases: ["klassik", "klassisch", "athen", "classical greece"],
  },
  {
    id: "http://n2t.net/ark:/99152/p0mn2ndq6bv",
    label: "Hellenistic Period",
    labelDe: "Hellenismus (Hellenistische Zeit)",
    start: "-0323",
    stop: "-0101",
    region: "Östlicher Mittelmeerraum",
    source: "PeriodO",
    authority: "PeriodO",
    aliases: ["hellenistisch", "hellenismus", "alexander"],
  },
  {
    id: "http://n2t.net/ark:/99152/p0mn2nddc8k",
    label: "Archaic Period",
    labelDe: "Archaische Zeit (Archaik)",
    start: "-0700",
    stop: "-0481",
    region: "Griechenland & Ägäis",
    source: "PeriodO",
    authority: "PeriodO",
    aliases: ["archaisch", "archaik"],
  },
  {
    id: "http://n2t.net/ark:/99152/p05krdx2khc",
    label: "Geometric Period",
    labelDe: "Geometrische Zeit",
    start: "-0899",
    stop: "-0699",
    region: "Griechenland",
    source: "PeriodO",
    authority: "PeriodO",
    aliases: ["geometrisch", "dipylon"],
  },
  {
    id: "http://n2t.net/ark:/99152/p0mn2ndq6m8",
    label: "Bronze Age Period",
    labelDe: "Bronzezeit",
    start: "-3100",
    stop: "-1051",
    region: "Mittelmeerraum & Ägäis",
    source: "PeriodO",
    authority: "PeriodO",
    aliases: ["bronzezeit", "bronze age", "ägäis"],
  },
  {
    id: "http://n2t.net/ark:/99152/p0hrtx5dm4p",
    label: "Cultura de Hallstatt",
    labelDe: "Hallstattzeit (Frühe Eisenzeit)",
    start: "-0599",
    stop: "-0449",
    region: "Mitteleuropa",
    source: "PeriodO",
    authority: "PeriodO",
    aliases: ["hallstatt", "frühe eisenzeit", "kelten"],
  },
  {
    id: "http://n2t.net/ark:/99152/p0ctc359kcx",
    label: "La Tene",
    labelDe: "Latènezeit (Späte Eisenzeit)",
    start: "-0449",
    stop: "-0054",
    region: "Mitteleuropa",
    source: "PeriodO",
    authority: "PeriodO",
    aliases: ["latène", "la tene", "späte eisenzeit", "kelten"],
  },
  {
    id: "http://n2t.net/ark:/99152/p0jrrjb67vs",
    label: "Late Antiquity",
    labelDe: "Spätantike",
    start: "0284",
    stop: "0476",
    region: "Mittelmeerraum & Europa",
    source: "PeriodO (EDH)",
    authority: "PeriodO",
    aliases: ["spätantike", "justinian"],
  },
  {
    id: "http://n2t.net/ark:/99152/p0jrrjbbvc7",
    label: "Early Middle Ages",
    labelDe: "Frühmittelalter",
    start: "0477",
    stop: "0830",
    region: "Europa",
    source: "PeriodO (EDH)",
    authority: "PeriodO",
    aliases: ["frühmittelalter", "ottonen"],
  },
  {
    id: "http://n2t.net/ark:/99152/p0pf7xr2szm",
    label: "Middle Ages",
    labelDe: "Mittelalter",
    start: "0450",
    stop: "1499",
    region: "Europa",
    source: "PeriodO",
    authority: "PeriodO",
    aliases: ["mittelalter", "hochmittelalter", "middle ages"],
  },
  {
    id: "http://n2t.net/ark:/99152/p0cwscs3p46",
    label: "Late Middle Ages",
    labelDe: "Spätmittelalter",
    start: "1100",
    stop: "1415",
    region: "Europa",
    source: "PeriodO",
    authority: "PeriodO",
    aliases: ["spätmittelalter", "gotik"],
  },
  // --- Ägyptische Epochen (PeriodO – UCLA Encyclopedia of Egyptology) ---
  {
    id: "http://n2t.net/ark:/99152/p0qk76zvrnc",
    label: "Predynastic",
    labelDe: "Prädynastische Zeit (Ägypten)",
    start: "-4499",
    stop: "-2949",
    region: "Ägypten",
    source: "PeriodO (UCLA Egyptology)",
    authority: "PeriodO",
    aliases: ["ägypten", "aegypten", "egypt", "prädynastisch", "predynastic", "naqada"],
  },
  {
    id: "http://n2t.net/ark:/99152/p0qk76zkc72",
    label: "Early Dynastic",
    labelDe: "Frühdynastische Zeit (Ägypten)",
    start: "-2949",
    stop: "-2669",
    region: "Ägypten",
    source: "PeriodO (UCLA Egyptology)",
    authority: "PeriodO",
    aliases: ["ägypten", "aegypten", "egypt", "frühdynastisch", "early dynastic", "thinite"],
  },
  {
    id: "http://n2t.net/ark:/99152/p0qk76z92f9",
    label: "Old Kingdom",
    labelDe: "Altes Reich (Ägypten)",
    start: "-2669",
    stop: "-2167",
    region: "Ägypten",
    source: "PeriodO (UCLA Egyptology)",
    authority: "PeriodO",
    aliases: ["ägypten", "aegypten", "egypt", "altes reich", "old kingdom", "pyramidenzeit"],
  },
  {
    id: "http://n2t.net/ark:/99152/p0qk76zqqr2",
    label: "First Intermediate Period",
    labelDe: "Erste Zwischenzeit (Ägypten)",
    start: "-2167",
    stop: "-2039",
    region: "Ägypten",
    source: "PeriodO (UCLA Egyptology)",
    authority: "PeriodO",
    aliases: ["ägypten", "aegypten", "egypt", "erste zwischenzeit", "first intermediate"],
  },
  {
    id: "http://n2t.net/ark:/99152/p0qk76zkb23",
    label: "Middle Kingdom",
    labelDe: "Mittleres Reich (Ägypten)",
    start: "-2039",
    stop: "-1639",
    region: "Ägypten",
    source: "PeriodO (UCLA Egyptology)",
    authority: "PeriodO",
    aliases: ["ägypten", "aegypten", "egypt", "mittleres reich", "middle kingdom"],
  },
  {
    id: "http://n2t.net/ark:/99152/p0qk76zxgwt",
    label: "Second Intermediate Period",
    labelDe: "Zweite Zwischenzeit (Ägypten)",
    start: "-1639",
    stop: "-1547",
    region: "Ägypten",
    source: "PeriodO (UCLA Egyptology)",
    authority: "PeriodO",
    aliases: ["ägypten", "aegypten", "egypt", "zweite zwischenzeit", "second intermediate", "hyksos"],
  },
  {
    id: "http://n2t.net/ark:/99152/p0qk76zvjkw",
    label: "New Kingdom",
    labelDe: "Neues Reich (Ägypten)",
    start: "-1547",
    stop: "-1085",
    region: "Ägypten",
    source: "PeriodO (UCLA Egyptology)",
    authority: "PeriodO",
    aliases: ["ägypten", "aegypten", "egypt", "neues reich", "new kingdom", "amarna", "ramessidisch"],
  },
  {
    id: "http://n2t.net/ark:/99152/p0qk76zpmnv",
    label: "Third Intermediate Period",
    labelDe: "Dritte Zwischenzeit (Ägypten)",
    start: "-1085",
    stop: "-0663",
    region: "Ägypten",
    source: "PeriodO (UCLA Egyptology)",
    authority: "PeriodO",
    aliases: ["ägypten", "aegypten", "egypt", "dritte zwischenzeit", "third intermediate"],
  },
  {
    id: "http://n2t.net/ark:/99152/p0qk76zh6n2",
    label: "Late Period",
    labelDe: "Spätzeit (Ägypten)",
    start: "-0663",
    stop: "-0331",
    region: "Ägypten",
    source: "PeriodO (UCLA Egyptology)",
    authority: "PeriodO",
    aliases: ["ägypten", "aegypten", "egypt", "spätzeit", "spaetzeit", "late period", "saitisch"],
  },
  {
    id: "http://n2t.net/ark:/99152/p0qk76zgqb7",
    label: "Persian Period",
    labelDe: "Perserzeit (Ägypten)",
    start: "-0524",
    stop: "-0401",
    region: "Ägypten",
    source: "PeriodO (UCLA Egyptology)",
    authority: "PeriodO",
    aliases: ["ägypten", "aegypten", "egypt", "perserzeit", "persian period"],
  },
  {
    id: "http://n2t.net/ark:/99152/p0qk76z756b",
    label: "Macedonian",
    labelDe: "Makedonische Zeit (Ägypten)",
    start: "-0331",
    stop: "-0303",
    region: "Ägypten",
    source: "PeriodO (UCLA Egyptology)",
    authority: "PeriodO",
    aliases: ["ägypten", "aegypten", "egypt", "makedonisch", "macedonian", "alexander"],
  },
  {
    id: "http://n2t.net/ark:/99152/p0qk76zn9c9",
    label: "Ptolemaic",
    labelDe: "Ptolemäische Zeit (Ägypten)",
    start: "-0303",
    stop: "-0029",
    region: "Ägypten",
    source: "PeriodO (UCLA Egyptology)",
    authority: "PeriodO",
    aliases: ["ägypten", "aegypten", "egypt", "ptolemäisch", "ptolemaic", "hellenistisch ägypten"],
  },
  {
    id: "http://n2t.net/ark:/99152/p0qk76zbv62",
    label: "Roman",
    labelDe: "Römische Zeit (Ägypten)",
    start: "-0029",
    stop: "0394",
    region: "Ägypten",
    source: "PeriodO (UCLA Egyptology)",
    authority: "PeriodO",
    aliases: ["ägypten", "aegypten", "egypt", "römische zeit ägypten", "roman egypt", "koptisch"],
  },
];

const HECTOR_QUICK_EPOCHS = [
  { ...HECTOR_EPOCHS_CATALOG[0], shortLabel: "Röm. Kaiserzeit" },
  { ...HECTOR_EPOCHS_CATALOG[1], shortLabel: "Frühe Kaiserzeit" },
  { ...HECTOR_EPOCHS_CATALOG[4], shortLabel: "Augustus" },
  { ...HECTOR_EPOCHS_CATALOG[5], shortLabel: "Spätklassik" },
  { ...HECTOR_EPOCHS_CATALOG[9], shortLabel: "Hellenismus" },
  { ...HECTOR_EPOCHS_CATALOG[10], shortLabel: "Bronzezeit" },
  { ...HECTOR_EPOCHS_CATALOG[11], shortLabel: "Eisenzeit" },
];

const PERIODO_QUICK_EPOCHS = [
  { ...PERIODO_CATALOG[1], shortLabel: "Tiberius (14–37 n. Chr.)" },
  { ...PERIODO_CATALOG[0], shortLabel: "Augustus (-27–14)" },
  { ...PERIODO_CATALOG[6], shortLabel: "Frühe Kaiserzeit" },
  { ...PERIODO_CATALOG[10], shortLabel: "Spätklassik" },
  { ...PERIODO_CATALOG[14], shortLabel: "Hellenismus" },
  { ...PERIODO_CATALOG[17], shortLabel: "Bronzezeit" },
];

const activeQuickEpochs = computed(() => {
  if (providerMode.value === "hector") return HECTOR_QUICK_EPOCHS;
  if (providerMode.value === "periodo") return PERIODO_QUICK_EPOCHS;
  return [
    ...HECTOR_QUICK_EPOCHS.slice(0, 4),
    ...PERIODO_QUICK_EPOCHS.slice(0, 3),
  ];
});

// Normalize strings for typo-tolerant / umlaut-neutral search
function normalizeStr(str) {
  return String(str || "")
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

function filterCatalog(catalog, queryNorm, rawQuery) {
  return catalog.filter((p) => {
    const labelNorm = normalizeStr(p.label);
    const labelDeNorm = normalizeStr(p.labelDe);
    const regionNorm = normalizeStr(p.region);

    if (
      labelNorm.includes(queryNorm) ||
      labelDeNorm.includes(queryNorm) ||
      regionNorm.includes(queryNorm)
    ) {
      return true;
    }

    if (
      (p.start && p.start.includes(rawQuery)) ||
      (p.stop && p.stop.includes(rawQuery))
    ) {
      return true;
    }

    if (Array.isArray(p.aliases)) {
      return p.aliases.some((alias) => {
        const aNorm = normalizeStr(alias);
        return aNorm.includes(queryNorm) || queryNorm.includes(aNorm);
      });
    }

    return false;
  });
}

const displayedPeriods = computed(() => {
  const rawQuery = searchQuery.value.trim();
  const queryNorm = normalizeStr(rawQuery);

  let pool = [];
  if (providerMode.value === "hector") {
    pool = [...liveSkosmosResults.value, ...HECTOR_EPOCHS_CATALOG];
  } else if (providerMode.value === "periodo") {
    pool = [...PERIODO_CATALOG, ...livePeriodoResults.value];
  } else {
    pool = [
      ...liveSkosmosResults.value,
      ...HECTOR_EPOCHS_CATALOG,
      ...PERIODO_CATALOG,
      ...livePeriodoResults.value,
    ];
  }

  // Deduplicate by id/uri
  const seen = new Set();
  let uniquePool = [];
  pool.forEach((item) => {
    const key = item.id || item.uri;
    if (key && !seen.has(key)) {
      seen.add(key);
      uniquePool.push(item);
    }
  });

  // Optional region filter (Default: 'all')
  if (regionFilter.value !== "all") {
    uniquePool = uniquePool.filter((item) => {
      const reg = normalizeStr(item.region || "");
      if (regionFilter.value === "egypt") {
        return (
          reg.includes("aegypt") ||
          reg.includes("agypt") ||
          reg.includes("egypt")
        );
      }
      if (regionFilter.value === "mediterranean") {
        return (
          reg.includes("griech") ||
          reg.includes("rom") ||
          reg.includes("mittelmeer") ||
          reg.includes("agais") ||
          reg.includes("mediterranean")
        );
      }
      if (regionFilter.value === "europe") {
        return reg.includes("europa") || reg.includes("europe");
      }
      return true;
    });
  }

  if (!rawQuery) {
    return uniquePool.slice(0, 14);
  }

  const matched = filterCatalog(uniquePool, queryNorm, rawQuery);

  return matched
    .sort((a, b) => {
      const aLabels = [a.labelDe, a.label, ...(a.aliases || [])].map(
        normalizeStr,
      );
      const bLabels = [b.labelDe, b.label, ...(b.aliases || [])].map(
        normalizeStr,
      );
      const aExact = aLabels.some((l) => l === queryNorm);
      const bExact = bLabels.some((l) => l === queryNorm);
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;

      const aStarts = aLabels.some((l) => l.startsWith(queryNorm));
      const bStarts = bLabels.some((l) => l.startsWith(queryNorm));
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;

      return 0;
    })
    .slice(0, 18);
});

let liveSearchTimer = null;
const onSearchInput = () => {
  isOpen.value = true;
  highlightedIndex.value = -1;

  const query = searchQuery.value.trim();
  if (!query || query.length < 2) {
    return;
  }

  if (liveSearchTimer) clearTimeout(liveSearchTimer);
  liveSearchTimer = setTimeout(async () => {
    try {
      isLiveSearching.value = true;
      const tasks = [];
      if (providerMode.value !== "periodo") {
        const lang = props.currentLocale === "de" ? "de" : "en";
        tasks.push(
          fetch(
            `https://vocabs.bcdh.uni-bonn.de/rest/v1/hector_epochs/search?query=${encodeURIComponent(query)}*&lang=${lang}`,
          )
            .then((res) => (res.ok ? res.json() : null))
            .then((data) => {
              if (data && Array.isArray(data.results)) {
                liveSkosmosResults.value = data.results.map((r) => ({
                  id: r.uri,
                  uri: r.uri,
                  label: r.prefLabel || query,
                  labelDe: r.prefLabel || query,
                  start: "",
                  stop: "",
                  region: "HECTOR",
                  source: "HECTOR Skosmos (Live)",
                  authority: "HECTOR",
                  aliases: [r.prefLabel || ""],
                }));
              }
            })
            .catch((e) => console.warn("Live Skosmos search failed:", e)),
        );
      }
      if (providerMode.value !== "hector") {
        tasks.push(
          ensureLivePeriodoCache().then((all) => {
            const qNorm = normalizeStr(query);
            livePeriodoResults.value = all
              .filter(
                (p) =>
                  normalizeStr(p.label).includes(qNorm) ||
                  normalizeStr(p.region).includes(qNorm),
              )
              .slice(0, 40);
          }),
        );
      }
      await Promise.all(tasks);
    } finally {
      isLiveSearching.value = false;
    }
  }, 250);
};

function clearSearch() {
  searchQuery.value = "";
  isOpen.value = false;
  selectedPeriod.value = null;
  liveSkosmosResults.value = [];
  emit("update:modelValue", "");
}

function formatYear(yearStr) {
  if (!yearStr) return "";
  const num = parseInt(yearStr, 10);
  if (isNaN(num)) return yearStr;
  if (num < 0) {
    return `${Math.abs(num)} v. Chr.`;
  }
  return `${num} n. Chr.`;
}

function selectPeriod(period) {
  selectedPeriod.value = period;
  recordRecentPeriod(period);
  searchQuery.value =
    props.currentLocale === "de" && period.labelDe
      ? period.labelDe
      : period.label;
  isOpen.value = false;

  emit("update:modelValue", searchQuery.value);
  emit("select", {
    periodName: searchQuery.value,
    startDate: period.start || "",
    endDate: period.stop || "",
    dateRangeQualifier: period.id || period.uri,
    authority:
      period.authority || (period.id?.includes("ark:") ? "PeriodO" : "HECTOR"),
    region: period.region || "",
    raw: period,
  });
}

function highlightNext() {
  if (highlightedIndex.value < displayedPeriods.value.length - 1) {
    highlightedIndex.value++;
  }
}

function highlightPrev() {
  if (highlightedIndex.value > 0) {
    highlightedIndex.value--;
  }
}

function selectHighlighted() {
  if (
    highlightedIndex.value >= 0 &&
    highlightedIndex.value < displayedPeriods.value.length
  ) {
    selectPeriod(displayedPeriods.value[highlightedIndex.value]);
  }
}

function handleClickOutside(e) {
  if (!e.target.closest(".relative")) {
    isOpen.value = false;
  }
}

onMounted(() => {
  document.addEventListener("click", handleClickOutside);
});

onBeforeUnmount(() => {
  document.removeEventListener("click", handleClickOutside);
});
</script>
