<template>
  <div
    id="act-dap"
    class="col-span-full border-2 border-primary/20 bg-base-100 rounded-2xl p-5 mb-6 shadow-sm scroll-mt-24"
  >
    <!-- Header -->
    <div
      class="flex flex-wrap items-center justify-between gap-3 pb-3 mb-4 border-b border-base-200"
    >
      <div class="flex items-center gap-3">
        <div
          class="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center text-xl font-bold shadow-xs"
        >
          🛡️
        </div>
        <div>
          <h4 class="font-bold text-base leading-tight text-base-content">
            Digital Authenticity Profile (DAP)
          </h4>
          <p
            class="text-xs text-base-content/70 mt-0.5 max-w-4xl leading-relaxed"
          >
            {{
              currentLocale === "de"
                ? "Dokumentiert in 5 Freitext-Dimensionen die Transformation des Objekts vom analogen Ausgangsbefund bis zum digitalen 3D-Modell."
                : "Documents in 5 free-text dimensions how the object was transformed from its analog state into the digital 3D model."
            }}
          </p>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="flex items-center gap-2 flex-wrap">
        <span
          class="badge badge-sm font-mono gap-1.5 transition-all"
          :class="
            completedCount === 5
              ? 'badge-success text-success-content font-bold'
              : 'badge-warning text-warning-content'
          "
        >
          <span>{{ completedCount === 5 ? "✓" : "⚠️" }}</span>
          <span>{{
            currentLocale === "de"
              ? `${completedCount} von 5 Dimensionen erfasst`
              : `${completedCount} of 5 dimensions complete`
          }}</span>
        </span>

        <button
          type="button"
          class="btn btn-xs btn-outline btn-primary gap-1"
          @click="loadSampleDap"
          :title="
            currentLocale === 'de'
              ? 'Musterbeispiel für alle 5 DAP-Dimensionen laden'
              : 'Load sample data for all 5 DAP dimensions'
          "
        >
          🏛️
          {{
            currentLocale === "de" ? "Musterbeispiel laden" : "Load Sample DAP"
          }}
        </button>

        <button
          type="button"
          class="btn btn-xs btn-ghost text-error"
          @click="clearAllDap"
          :title="
            currentLocale === 'de'
              ? 'Alle DAP-Einträge leeren'
              : 'Clear all DAP entries'
          "
        >
          🗑️
        </button>
      </div>
    </div>

    <!-- AI Step Detection Hint -->
    <div
      v-if="hasAiConsistsOfStep"
      class="mb-4 p-3 rounded-xl bg-secondary/10 border border-secondary/30 text-xs flex items-start gap-2.5"
    >
      <span class="text-base leading-none">✨</span>
      <div>
        <span class="font-bold text-secondary">
          {{
            currentLocale === "de"
              ? "KI-gestützter Arbeitsschritt erkannt:"
              : "AI-assisted step detected:"
          }}
        </span>
        <span class="text-base-content/80 ml-1">
          {{
            currentLocale === "de"
              ? "Bitte erläutern Sie in Dimension 4 (Textur/Shader) oder Dimension 5 (Abbildungsbilanz) kurz, welche Modellbereiche KI-ergänzt wurden und wofür."
              : "Please briefly state in Dimension 4 (Texture/Shader) or Dimension 5 (Representation Balance) which model areas were AI-generated and why."
          }}
        </span>
      </div>
    </div>

    <!-- 5 Dimensions (All visible in clean stacked cards for fast multilingual free-text entry) -->
    <div class="space-y-4">
      <div
        v-for="dim in DAP_DIMENSIONS"
        :key="dim.id"
        class="p-4 rounded-xl border bg-base-200/30 transition-colors"
        :class="
          hasDimContent(dim.id)
            ? 'border-success/40 bg-success/5'
            : 'border-base-300'
        "
      >
        <div class="flex flex-wrap items-center justify-between gap-2 mb-2">
          <div class="flex items-center gap-2 flex-wrap">
            <span
              class="badge badge-sm font-mono font-bold"
              :class="dim.badgeColor"
            >
              {{ dim.id }}
            </span>
            <h5 class="font-bold text-sm text-base-content">
              {{ currentLocale === "de" ? dim.titleDe : dim.titleEn }}
            </h5>
          </div>
          <div class="flex items-center gap-2">
            <span
              class="text-xs font-medium"
              :class="hasDimContent(dim.id) ? 'text-success' : 'text-base-content/40'"
            >
              {{
                hasDimContent(dim.id)
                  ? currentLocale === "de"
                    ? "✓ Erfasst"
                    : "✓ Filled"
                  : currentLocale === "de"
                    ? "Noch leer"
                    : "Empty"
              }}
            </span>
            <button
              type="button"
              class="btn btn-xs btn-outline btn-primary gap-1"
              @click.prevent="addDimLang(dim.id)"
            >
              <span>+</span>
              <span>{{
                currentLocale === "de" ? "Sprache" : "Add Language"
              }}</span>
            </button>
          </div>
        </div>

        <p class="text-xs text-base-content/70 mb-2 leading-relaxed">
          {{ currentLocale === "de" ? dim.hintDe : dim.hintEn }}
        </p>

        <div class="space-y-2">
          <div
            v-for="(entry, eIdx) in dimTexts[dim.id]"
            :key="eIdx"
            class="flex flex-col sm:flex-row items-stretch sm:items-start gap-2"
          >
            <textarea
              v-model="entry._value"
              @input="syncToConsistsOf"
              rows="3"
              class="textarea textarea-bordered w-full flex-1 min-w-0 bg-base-100 text-sm leading-relaxed"
              :placeholder="
                currentLocale === 'de' ? dim.placeholderDe : dim.placeholderEn
              "
            ></textarea>

            <div class="flex items-center gap-1 shrink-0 sm:pt-1">
              <LanguageBadgePicker
                :model-value="entry.lang"
                @update:model-value="
                  entry.lang = $event;
                  syncToConsistsOf();
                "
              />
              <button
                type="button"
                class="btn btn-square btn-xs btn-ghost transition-colors"
                :class="
                  entry.preferred
                    ? 'text-warning opacity-100'
                    : 'text-base-content/35 hover:text-warning'
                "
                :title="
                  currentLocale === 'de'
                    ? 'Als bevorzugt festlegen'
                    : 'Set as preferred'
                "
                @click.prevent="setDimPreferred(dim.id, eIdx)"
              >
                ★
              </button>
              <button
                v-if="dimTexts[dim.id].length > 1"
                type="button"
                class="btn btn-square btn-xs btn-ghost text-error hover:bg-error/10"
                :title="currentLocale === 'de' ? 'Entfernen' : 'Remove'"
                @click.prevent="removeDimLang(dim.id, eIdx)"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, computed, watch, onMounted, inject, ref } from "vue";
import LanguageBadgePicker from "./LanguageBadgePicker.vue";

const props = defineProps({
  form: {
    type: Object,
    required: true,
  },
  description: {
    type: String,
    default: "",
  },
  currentLocale: {
    type: String,
    default: "de",
  },
});

const DAP_DIMENSIONS = [
  {
    id: "DAP-1",
    num: 1,
    uri: "http://hector.org/vocab/dap/DAP-1",
    badgeColor: "badge-primary",
    titleDe:
      "Dimension 1 von 5: Materielle Spuren und Merkmale (Ausgangsbefund am Objekt)",
    titleEn:
      "Dimension 1 of 5: Material Traces and Features (Object Condition)",
    purposeDe:
      "Digital Authenticity Profile, Dimension 1 von 5: Materielle Spuren und Merkmale (Ausgangsbefund am Objekt)",
    purposeEn:
      "Digital Authenticity Profile, Dimension 1 of 5: Material Traces and Features (Object Condition)",
    hintDe:
      "Welche materiellen Spuren, Beschädigungen, Bearbeitungsspuren oder historischen Restaurierungen weist das physische Objekt auf?",
    hintEn:
      "Which material traces, damages, tool marks, or historical restorations are present on the physical object?",
    placeholderDe:
      "z. B. Abgebrochene rechte Hand, Bestoßungen am Gewand, Brandspuren auf der Rückseite, antike Drehspuren, historische Restaurierungskittung am Hals...",
    placeholderEn:
      "e.g. Broken right hand, chips along the drapery, burn marks on the reverse, historical restoration fills...",
  },
  {
    id: "DAP-2",
    num: 2,
    uri: "http://hector.org/vocab/dap/DAP-2",
    badgeColor: "badge-secondary",
    titleDe: "Dimension 2 von 5: Aufnahmeprozess und Erfassungsumfang",
    titleEn: "Dimension 2 of 5: Acquisition Process and Coverage",
    purposeDe:
      "Digital Authenticity Profile, Dimension 2 von 5: Aufnahmeprozess und Erfassungsumfang",
    purposeEn:
      "Digital Authenticity Profile, Dimension 2 of 5: Acquisition Process and Coverage",
    hintDe:
      "Wie wurde das Objekt erfasst? Welche Bereiche blieben ausgespart oder abgeschattet (z. B. Standfläche, Hohlräume)?",
    hintEn:
      "How was the object captured? Which areas were omitted or occluded (e.g. base, cavities)?",
    placeholderDe:
      "z. B. 360°-Rundumerfassung mittels Streifenlichtscan; Standfläche aus Standsicherheitsgründen ausgespart; Innenhohlraum teilweise abgeschattet.",
    placeholderEn:
      "e.g. 360° capture using structured-light scanning; base omitted for stability; interior cavity partially occluded.",
  },
  {
    id: "DAP-3",
    num: 3,
    uri: "http://hector.org/vocab/dap/DAP-3",
    badgeColor: "badge-accent",
    titleDe: "Dimension 3 von 5: Geometrie-Bearbeitung",
    titleEn: "Dimension 3 of 5: Geometry Processing",
    purposeDe:
      "Digital Authenticity Profile, Dimension 3 von 5: Geometrie-Bearbeitung",
    purposeEn:
      "Digital Authenticity Profile, Dimension 3 of 5: Geometry Processing",
    hintDe:
      "Welche Eingriffe wurden an der 3D-Geometrie vorgenommen (z. B. Löcher geschlossen, Ausrichtung, Dezimierung, Glättung)?",
    hintEn:
      "Which operations were performed on the 3D geometry (e.g. hole filling, alignment, decimation, smoothing)?",
    placeholderDe:
      "z. B. Ausrichtung der Einzelscans per ICP, Entfernung von Messrauschen, geschlossene Löcher an der Standfläche, Dezimierung auf 250k Polygone für Web-Derivat.",
    placeholderEn:
      "e.g. ICP alignment of single scans, noise removal, watertight hole filling at the base, decimation to 250k polygons.",
  },
  {
    id: "DAP-4",
    num: 4,
    uri: "http://hector.org/vocab/dap/DAP-4",
    badgeColor: "badge-info",
    titleDe: "Dimension 4 von 5: Textur, Shader und Material",
    titleEn: "Dimension 4 of 5: Texture, Shader and Material",
    purposeDe:
      "Digital Authenticity Profile, Dimension 4 von 5: Textur, Shader und Material",
    purposeEn:
      "Digital Authenticity Profile, Dimension 4 of 5: Texture, Shader and Material",
    hintDe:
      "Wie wurden Texturen, Farben, Lichteffekte (Delighting) und Materialeigenschaften (PBR/Shader) erzeugt bzw. angepasst?",
    hintEn:
      "How were textures, colors, lighting (delighting), and material properties (PBR/shaders) generated or adjusted?",
    placeholderDe:
      "z. B. Farbkalibrierung mittels ColorChecker, Delighting der Texturkacheln, Normal-Map-Bake aus High-Poly-Mesh.",
    placeholderEn:
      "e.g. Color calibration using ColorChecker, delighting of texture tiles, normal map bake from high-poly mesh.",
  },
  {
    id: "DAP-5",
    num: 5,
    uri: "http://hector.org/vocab/dap/DAP-5",
    badgeColor: "badge-success",
    titleDe: "Dimension 5 von 5: Abbildungsbilanz",
    titleEn: "Dimension 5 of 5: Representation Balance",
    purposeDe:
      "Digital Authenticity Profile, Dimension 5 von 5: Abbildungsbilanz",
    purposeEn:
      "Digital Authenticity Profile, Dimension 5 of 5: Representation Balance",
    hintDe:
      "Abschließende Bewertung: Was bildet das digitale 3D-Modell authentisch ab und wo liegen bewusste Grenzen oder Abweichungen zum Original?",
    hintEn:
      "Final assessment: What does the digital 3D model represent authentically and where are intentional limits or deviations from the original?",
    placeholderDe:
      "z. B. Alle sichtbaren Oberflächenspuren und Beschädigungen sind maßstabsgetreu erhalten; lediglich die Standfläche wurde plan geschlossen.",
    placeholderEn:
      "e.g. All visible surface traces and damages are preserved to scale; only the base was closed flat.",
  },
];

const defaultMetadataLanguage = inject("defaultMetadataLanguage", ref("de"));
const defaultLang = () => defaultMetadataLanguage.value || "de";

const dimTexts = reactive({
  "DAP-1": [{ _value: "", lang: defaultLang(), preferred: true }],
  "DAP-2": [{ _value: "", lang: defaultLang(), preferred: true }],
  "DAP-3": [{ _value: "", lang: defaultLang(), preferred: true }],
  "DAP-4": [{ _value: "", lang: defaultLang(), preferred: true }],
  "DAP-5": [{ _value: "", lang: defaultLang(), preferred: true }],
});

const hasDimContent = (dimId) =>
  Array.isArray(dimTexts[dimId]) &&
  dimTexts[dimId].some((e) => Boolean((e?._value || "").trim()));

const completedCount = computed(() => {
  return DAP_DIMENSIONS.filter((d) => hasDimContent(d.id)).length;
});

const hasAiConsistsOfStep = computed(() => {
  const list = props.form?.consistsOf;
  if (!Array.isArray(list)) return false;
  return list.some((s) => {
    if (!s || typeof s !== "object") return false;
    const blob = [
      s.hadSpecificPurpose,
      s.methods,
      s.techniques,
      s["techniques#termUID"],
      s["methods#termUID"],
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return (
      blob.includes("iptc") ||
      blob.includes("ki-inpainting") ||
      blob.includes("ki-animation") ||
      blob.includes("trainedalgorithmicmedia") ||
      blob.includes("concept_cef1191a") ||
      blob.includes("concept_dfee2781") ||
      blob.includes("concept_7042efdc") ||
      blob.includes("concept_4441ef06") ||
      blob.includes("concept_c5219268")
    );
  });
});

const addDimLang = (dimId) => {
  const list = dimTexts[dimId] || [];
  const used = new Set(list.map((e) => e.lang));
  const nextLang = !used.has("en") ? "en" : !used.has("de") ? "de" : "fr";
  list.push({ _value: "", lang: nextLang, preferred: list.length === 0 });
  dimTexts[dimId] = list;
  syncToConsistsOf();
};

const setDimPreferred = (dimId, idx) => {
  (dimTexts[dimId] || []).forEach((e, i) => {
    e.preferred = i === idx;
  });
  syncToConsistsOf();
};

const removeDimLang = (dimId, idx) => {
  const list = dimTexts[dimId] || [];
  if (list.length <= 1) return;
  const wasPref = list[idx]?.preferred;
  list.splice(idx, 1);
  if (wasPref && list.length > 0) list[0].preferred = true;
  syncToConsistsOf();
};

const isDapEntry = (item) => {
  if (!item) return false;
  if (item.isDap) return true;
  const p = String(item.hadSpecificPurpose || "");
  const uid = String(item["methods#termUID"] || "");
  return (
    p.includes("Digital Authenticity Profile") ||
    p.includes("DAP-") ||
    uid.includes("/dap/DAP-")
  );
};

let isSyncing = false;

const syncToConsistsOf = () => {
  if (!props.form) return;
  isSyncing = true;
  const existing = Array.isArray(props.form["consistsOf"])
    ? props.form["consistsOf"]
    : [];
  const regularSteps = existing.filter((item) => !isDapEntry(item));

  const dapSteps = [];
  DAP_DIMENSIONS.forEach((dim) => {
    const entries = Array.isArray(dimTexts[dim.id]) ? dimTexts[dim.id] : [];
    entries.forEach((entry) => {
      const val = (entry?._value || "").trim();
      if (val) {
        const entryLang = entry.lang || defaultLang();
        const useEn = entryLang === "en" || props.currentLocale === "en";
        dapSteps.push({
          isDap: true,
          dapId: dim.id,
          hadSpecificPurpose: useEn ? dim.purposeEn : dim.purposeDe,
          "hadSpecificPurpose#lang": useEn ? "en" : "de",
          methods: val,
          "methods#lang": entryLang,
          "methods#preferred": Boolean(entry.preferred),
          "methods#termUID": dim.uri,
        });
      }
    });
  });

  props.form["consistsOf"] = [...regularSteps, ...dapSteps];
  setTimeout(() => {
    isSyncing = false;
  }, 0);
};

const initFromConsistsOf = () => {
  if (isSyncing || !props.form || !Array.isArray(props.form["consistsOf"])) {
    return;
  }
  const list = props.form["consistsOf"];

  DAP_DIMENSIONS.forEach((dim) => {
    const matches = list.filter((item) => {
      const p = String(item.hadSpecificPurpose || "");
      const uid = String(item["methods#termUID"] || "");
      const m = Array.isArray(item.methods)
        ? item.methods.join(" ")
        : String(item.methods || "");
      return (
        item.dapId === dim.id ||
        uid.endsWith(`/${dim.id}`) ||
        p.includes(`Dimension ${dim.num} von 5`) ||
        p.includes(`Dimension ${dim.num} of 5`) ||
        p.includes(dim.id) ||
        m.includes(dim.id)
      );
    });

    if (matches.length > 0) {
      dimTexts[dim.id] = matches.map((found, idx) => {
        const methodText = Array.isArray(found.methods)
          ? found.methods.join("; ")
          : String(found.methods || "");
        const techText = Array.isArray(found.techniques)
          ? found.techniques.join("; ")
          : String(found.techniques || "");
        return {
          _value: (methodText || techText || "").trim(),
          lang: found["methods#lang"] || defaultLang(),
          preferred: found["methods#preferred"] ?? idx === 0,
        };
      });
    } else {
      dimTexts[dim.id] = [{ _value: "", lang: defaultLang(), preferred: true }];
    }
  });
};

const loadSampleDap = () => {
  if (completedCount.value > 0) {
    const msg =
      props.currentLocale === "de"
        ? "Vorhandene DAP-Einträge mit dem Beispieltext überschreiben?"
        : "Overwrite existing DAP entries with the sample text?";
    if (typeof window !== "undefined" && !window.confirm(msg)) return;
  }
  const isEn = props.currentLocale === "en";
  dimTexts["DAP-1"] = [
    {
      _value: isEn
        ? "Broken sections and surface chips, fine hairline cracks, and historical restoration fills documented."
        : "Abgebrochene Partien und Bestoßungen an der Oberfläche, feine Rissbildung sowie historische Restaurierungskittungen dokumentiert.",
      lang: isEn ? "en" : "de",
      preferred: true,
    },
  ];
  dimTexts["DAP-2"] = [
    {
      _value: isEn
        ? "360° capture in the museum; base omitted for stability; deep cavities partially occluded."
        : "360°-Rundumerfassung im Museum; Standfläche aus Standsicherheitsgründen ausgespart; tiefer liegende Hohlräume teilweise abgeschattet.",
      lang: isEn ? "en" : "de",
      preferred: true,
    },
  ];
  dimTexts["DAP-3"] = [
    {
      _value: isEn
        ? "ICP alignment of individual scans, noise removal, flat closing of the base, and decimation for web derivative."
        : "ICP-Ausrichtung der Einzelscans, Entfernung von Messrauschen, plane Schließung der Standfläche und Dezimierung für Web-Derivat.",
      lang: isEn ? "en" : "de",
      preferred: true,
    },
  ];
  dimTexts["DAP-4"] = [
    {
      _value: isEn
        ? "Color calibration via ColorChecker, delighting of texture captures, and normal-map bake from high-resolution mesh."
        : "Farbkalibrierung mittels ColorChecker, Delighting der Texturaufnahmen und Normal-Map-Bake aus dem hochauflösenden Modell.",
      lang: isEn ? "en" : "de",
      preferred: true,
    },
  ];
  dimTexts["DAP-5"] = [
    {
      _value: isEn
        ? "All visible surface traces and damages are preserved to scale; only the omitted base was closed flat."
        : "Alle sichtbaren Oberflächenspuren und Beschädigungen sind maßstabsgetreu abgebildet; lediglich die ausgesparte Standfläche wurde plan geschlossen.",
      lang: isEn ? "en" : "de",
      preferred: true,
    },
  ];
  syncToConsistsOf();
};

const clearAllDap = () => {
  if (completedCount.value > 0) {
    const msg =
      props.currentLocale === "de"
        ? "Möchten Sie alle erfassten DAP-Einträge wirklich leeren?"
        : "Are you sure you want to clear all DAP entries?";
    if (typeof window !== "undefined" && !window.confirm(msg)) return;
  }
  DAP_DIMENSIONS.forEach((dim) => {
    dimTexts[dim.id] = [{ _value: "", lang: defaultLang(), preferred: true }];
  });
  syncToConsistsOf();
};

watch(
  () => props.form["consistsOf"],
  () => {
    initFromConsistsOf();
  },
  { deep: true },
);

onMounted(() => {
  initFromConsistsOf();
});
</script>
