<template>
  <div
    id="act-3d"
    class="col-span-full border border-base-300 bg-base-100 rounded-xl p-4 sm:p-5 mb-5 shadow-2xs scroll-mt-24"
  >
    <!-- Header -->
    <div
      class="flex flex-wrap items-center justify-between gap-3 pb-3 mb-4 border-b border-base-200"
    >
      <div class="flex items-center gap-2.5">
        <div
          class="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center text-xl font-bold shadow-xs"
        >
          📷
        </div>
        <div>
          <h4 class="font-bold text-base leading-tight flex items-center gap-2">
            <span>{{
              currentLocale === "de"
                ? "3D-Digitalisierungsmethoden, Technik & Equipment"
                : "3D Digitisation Methods, Techniques & Equipment"
            }}</span>
          </h4>
          <p class="text-xs text-base-content/60 mt-0.5 max-w-3xl">
            {{
              currentLocale === "de"
                ? "Erfassen Sie hier die eingesetzten 3D-Aufnahmeverfahren (z. B. Photogrammetrie, Streifenlichtscan, Laserscan), Kameras/Scanner sowie Verarbeitungssoftware."
                : "Record the 3D acquisition methods (e.g. Photogrammetry, Structured-Light, Laser Scanning), hardware/cameras, and processing software used."
            }}
          </p>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="flex flex-wrap items-center gap-2">
        <button
          type="button"
          class="btn btn-xs btn-outline btn-primary gap-1"
          @click="addPredefinedSubactivity('both')"
          :title="
            currentLocale === 'de'
              ? 'Erstellt Erfassungs- und Verarbeitungs-Teilschritt automatisch'
              : 'Creates capture and post-processing steps'
          "
        >
          ⚡
          {{
            currentLocale === "de"
              ? "Standard-Workflow übernehmen (Erfassung + Verarbeitung)"
              : "Apply Full Standard Workflow"
          }}
        </button>
        <button
          type="button"
          class="btn btn-xs btn-outline btn-secondary gap-1"
          @click="addPredefinedSubactivity('ai_inpainting')"
          :title="
            currentLocale === 'de'
              ? 'Vorlage für KI-gestützte Texturergänzung / Inpainting (inkl. IPTC & HECTOR)'
              : 'Template for AI texture inpainting (incl. IPTC & HECTOR)'
          "
        >
          ✨
          {{
            currentLocale === "de"
              ? "KI-Texturergänzung (Inpainting)"
              : "AI Texture Inpainting"
          }}
        </button>
        <button
          type="button"
          class="btn btn-xs btn-outline btn-secondary gap-1"
          @click="addPredefinedSubactivity('ai_animation')"
          :title="
            currentLocale === 'de'
              ? 'Vorlage für KI-gestützte Vermittlungsanimation (Derivat)'
              : 'Template for AI dissemination animation (derivative)'
          "
        >
          🎬
          {{
            currentLocale === "de"
              ? "KI-Animation (Derivat)"
              : "AI Animation (Derivative)"
          }}
        </button>
      </div>
    </div>

    <!-- 1. METHOD SELECTION -->
    <div class="mb-4 p-4 bg-base-200/40 rounded-xl border border-base-300">
      <div class="flex items-center justify-between mb-2">
        <label
          class="label-text font-bold text-xs uppercase tracking-wider text-base-content/80 flex items-center gap-1.5"
        >
          <span>📷</span>
          <span>{{
            currentLocale === "de"
              ? "1. Primäres 3D-Erfassungsverfahren"
              : "1. Primary 3D Acquisition Method"
          }}</span>
        </label>
        <span class="text-[11px] text-base-content/50">
          {{
            currentLocale === "de"
              ? "Wählen Sie das Verfahren zur Vorkonfiguration"
              : "Select method to configure sub-activities"
          }}
        </span>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <button
          type="button"
          class="btn btn-sm flex items-center justify-start gap-2.5 px-3 transition-all"
          :class="
            activeMethod === 'photogrammetry'
              ? 'btn-secondary text-secondary-content font-bold shadow-xs'
              : 'btn-ghost border border-base-300 hover:border-secondary/60'
          "
          @click="selectMethod('photogrammetry')"
        >
          <span>📷</span>
          <span>{{
            currentLocale === "de"
              ? "Photogrammetrie (SfM / MVS)"
              : "Photogrammetry (SfM / MVS)"
          }}</span>
        </button>

        <button
          type="button"
          class="btn btn-sm flex items-center justify-start gap-2.5 px-3 transition-all"
          :class="
            activeMethod === 'sls'
              ? 'btn-primary text-primary-content font-bold shadow-xs'
              : 'btn-ghost border border-base-300 hover:border-primary/60'
          "
          @click="selectMethod('sls')"
        >
          <span>💡</span>
          <span>{{
            currentLocale === "de"
              ? "SLS (Streifenlichtscanning)"
              : "SLS (Structured Light)"
          }}</span>
        </button>

        <button
          type="button"
          class="btn btn-sm flex items-center justify-start gap-2.5 px-3 transition-all"
          :class="
            activeMethod === 'tls'
              ? 'btn-accent text-accent-content font-bold shadow-xs'
              : 'btn-ghost border border-base-300 hover:border-accent/60'
          "
          @click="selectMethod('tls')"
        >
          <span>🌐</span>
          <span>{{
            currentLocale === "de"
              ? "TLS (Terrestrischer Laserscan)"
              : "TLS (Terrestrial Laser Scan)"
          }}</span>
        </button>
      </div>
    </div>

    <!-- 2. HARDWARE / EQUIPMENT KONFIGURATOR -->
    <div class="grid grid-cols-1 gap-4 mb-4">
      <!-- Left: Hardware Equipment -->
      <div
        class="p-4 bg-base-200/40 rounded-xl border border-base-300 flex flex-col justify-between"
      >
        <div>
          <div class="flex flex-wrap items-center justify-between gap-2 mb-2">
            <label
              class="label-text font-bold text-xs uppercase tracking-wider text-base-content/80 flex items-center gap-1.5"
            >
              <span>📷</span>
              <span>{{
                currentLocale === "de"
                  ? "Hardware-Equipment (Kamera / Scanner)"
                  : "Hardware Equipment (Camera / Scanner)"
              }}</span>
            </label>
            <button
              type="button"
              class="btn btn-xs btn-outline btn-secondary gap-1 font-semibold text-[11px]"
              @click.prevent="isEqPickerOpen = true"
            >
              <span>📷</span>
              <span>{{
                currentLocale === "de"
                  ? "Aus Gerätepool wählen"
                  : "Pick from Equipment Pool"
              }}</span>
            </button>
          </div>

          <!-- Saved Equipment Pool Chips -->
          <div v-if="poolHardwareLabels.length > 0" class="flex flex-wrap gap-1.5 mb-2.5">
            <button
              v-for="hwName in poolHardwareLabels"
              :key="hwName"
              type="button"
              class="preset-chip"
              :class="
                selectedHardware.includes(hwName)
                  ? 'ring-2 ring-primary bg-primary/15 font-bold'
                  : ''
              "
              @click="toggleHardware(hwName)"
            >
              <span>{{ selectedHardware.includes(hwName) ? "✓" : "+" }}</span>
              <span>{{ hwName }}</span>
            </button>
          </div>

          <!-- Selected Hardware Tags (when picked from pool) -->
          <div v-else-if="selectedHardware.length > 0" class="flex flex-wrap gap-1.5 mb-2.5">
            <button
              v-for="hwName in selectedHardware"
              :key="hwName"
              type="button"
              class="preset-chip ring-2 ring-primary bg-primary/15 font-bold"
              @click="toggleHardware(hwName)"
            >
              <span>✓</span>
              <span>{{ hwName }}</span>
            </button>
          </div>
        </div>

        <input
          type="text"
          v-model="customHardware"
          class="input input-sm input-bordered w-full text-xs font-mono"
          :placeholder="
            currentLocale === 'de'
              ? 'z. B. Sony A7R V / Nikkor 50mm / Artec Leo'
              : 'e.g. Sony A7R V / Nikkor 50mm / Artec Leo'
          "
        />
      </div>
    </div>

    <!-- 3. PROCESSING & POST-PROCESSING SUB-ACTIVITIES -->
    <div
      id="act-processing"
      class="flex flex-wrap items-center justify-between gap-3 p-3 bg-base-200/40 rounded-xl border border-base-300 scroll-mt-24"
    >
      <div class="text-xs text-base-content/70">
        <span>{{
          currentLocale === "de"
            ? "Erfasste Verarbeitungs- & Teilschritte in dieser Aktivität:"
            : "Processing & sub-activity steps in this activity:"
        }}</span>
        <strong class="ml-1 text-primary">{{
          regularStepsWithIndex.length
        }}</strong>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <button
          type="button"
          class="btn btn-xs btn-primary gap-1 font-bold shadow-xs"
          @click="addPredefinedSubactivity('capture')"
        >
          <span>➕</span>
          <span>{{
            currentLocale === "de"
              ? "Erfassungs-Schritt anlegen"
              : "Add Capture Step"
          }}</span>
        </button>

        <button
          type="button"
          class="btn btn-xs btn-outline btn-primary gap-1 font-bold"
          @click="addPredefinedSubactivity('processing')"
        >
          <span>➕</span>
          <span>{{
            currentLocale === "de"
              ? "Post-Processing-Schritt anlegen"
              : "Add Post-Processing Step"
          }}</span>
        </button>
      </div>
    </div>

    <!-- Active Processing Sub-Activities Mini-List (excluding DAP) -->
    <div v-if="regularStepsWithIndex.length > 0" class="mt-3 space-y-2">
      <div
        v-for="(
          { item, originalIndex: idx }, displayIdx
        ) in regularStepsWithIndex"
        :key="idx"
        class="p-2.5 bg-base-200/50 rounded-lg border border-base-300 flex items-start justify-between gap-3 text-xs"
      >
        <div class="space-y-1 min-w-0 flex-1">
          <div class="flex items-center gap-2 flex-wrap">
            <span class="badge badge-xs badge-neutral font-mono">
              #{{ displayIdx + 1 }}
            </span>
            <span
              class="badge badge-xs badge-outline text-[10px] text-base-content/70"
            >
              {{
                currentLocale === "de"
                  ? "Freier Teilschritt"
                  : "Custom Sub-Activity"
              }}
            </span>
            <span class="font-bold text-base-content leading-snug">
              {{
                getStepPurposeText(item) ||
                (currentLocale === "de"
                  ? "Teilschritt ohne Titel"
                  : "Sub-activity")
              }}
            </span>
            <span
              v-if="item['hadSpecificPurpose#lang'] || item['#lang']"
              class="badge badge-xs badge-ghost uppercase font-mono"
            >
              {{ item["hadSpecificPurpose#lang"] || item["#lang"] }}
            </span>
          </div>

          <div
            class="flex items-center gap-3 text-base-content/70 flex-wrap text-[11px]"
          >
            <span
              v-if="
                item.methods &&
                (!Array.isArray(item.methods) || item.methods.length > 0)
              "
            >
              <strong>{{
                currentLocale === "de" ? "Methode(n):" : "Method(s):"
              }}</strong>
              {{
                Array.isArray(item.methods)
                  ? item.methods.join(" • ")
                  : item.methods
              }}
            </span>
            <span
              v-if="
                item.techniques &&
                (!Array.isArray(item.techniques) || item.techniques.length > 0)
              "
            >
              <strong>{{
                currentLocale === "de" ? "Technik(en):" : "Technique(s):"
              }}</strong>
              {{
                Array.isArray(item.techniques)
                  ? `${item.techniques.length}× (${item.techniques[0]}...)`
                  : item.techniques
              }}
            </span>
            <span
              v-if="
                item.equipment &&
                (!Array.isArray(item.equipment) || item.equipment.length > 0)
              "
            >
              <strong>{{
                currentLocale === "de" ? "Equipment:" : "Equipment:"
              }}</strong>
              {{
                Array.isArray(item.equipment)
                  ? item.equipment.join(" • ")
                  : item.equipment
              }}
            </span>
          </div>
        </div>

        <div class="flex items-center gap-1 shrink-0">
          <button
            type="button"
            class="btn btn-ghost btn-xs text-info"
            @click="$emit('edit-step', idx)"
          >
            {{ currentLocale === "de" ? "Bearbeiten" : "Edit" }}
          </button>
          <button
            type="button"
            class="btn btn-ghost btn-xs text-error"
            @click="$emit('remove-step', idx)"
          >
            ✕
          </button>
        </div>
      </div>
    </div>

    <EquipmentPickerModal
      :is-open="isEqPickerOpen"
      :current-locale="currentLocale"
      @close="isEqPickerOpen = false"
      @select="handleEquipmentPoolSelect"
    />
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import EquipmentPickerModal from "./EquipmentPickerModal.vue";
import { savedEquipment } from "../utils/sharedState";

const isEqPickerOpen = ref(false);

const poolHardwareLabels = computed(() => {
  const list = Array.isArray(savedEquipment.value) ? savedEquipment.value : [];
  return list
    .map((eq) => {
      if (!eq) return "";
      const brand = String(eq.manufacturer || "").trim();
      const model = String(eq.model || eq.name || "").trim();
      if (brand && model && !model.toLowerCase().includes(brand.toLowerCase())) {
        return `${brand} ${model}`;
      }
      return model || brand;
    })
    .filter(Boolean);
});

const handleEquipmentPoolSelect = (eq) => {
  if (!eq) return;
  const brand = String(eq.manufacturer || "").trim();
  const model = String(eq.model || eq.name || "").trim();
  const label =
    brand && model && !model.toLowerCase().includes(brand.toLowerCase())
      ? `${brand} ${model}`
      : model || brand;
  if (label && !selectedHardware.value.includes(label)) {
    selectedHardware.value.push(label);
  }
  isEqPickerOpen.value = false;
};

const props = defineProps({
  consistsOfList: {
    type: Array,
    default: () => [],
  },
  currentLocale: {
    type: String,
    default: "de",
  },
});

const emit = defineEmits(["add-step", "edit-step", "remove-step"]);

const getStepPurposeText = (item) => {
  const val = item?.hadSpecificPurpose;
  if (!val) return "";
  if (typeof val === "string") return val;
  if (Array.isArray(val)) {
    const loc = String(props.currentLocale || "de").toLowerCase();
    const byLang = val.find(
      (e) => String(e?.["hadSpecificPurpose#lang"] || e?.lang || "").toLowerCase() === loc && e?._value,
    );
    if (byLang) return byLang._value;
    const pref = val.find((e) => (e?.["hadSpecificPurpose#preferred"] || e?.preferred) && e?._value);
    if (pref) return pref._value;
    const first = val.find((e) => e?._value || typeof e === "string");
    return typeof first === "string" ? first : first?._value || "";
  }
  return String(val._value || "");
};

const isDapItem = (item) => {
  if (!item) return false;
  if (item.isDap) return true;
  const m = String(item.methods || "");
  const p = getStepPurposeText(item);
  const uid = String(item["methods#termUID"] || "");
  return (
    /DAP-[1-6]/i.test(m) ||
    /DAP-[1-6]/i.test(p) ||
    p.includes("Digital Authenticity Profile") ||
    uid.includes("/dap/DAP-")
  );
};

const regularStepsWithIndex = computed(() => {
  const list = Array.isArray(props.consistsOfList) ? props.consistsOfList : [];
  return list
    .map((item, originalIndex) => ({ item, originalIndex }))
    .filter(({ item }) => !isDapItem(item));
});

const getDapBadge = (item) => {
  if (!item) return "";
  const match = (
    String(item.methods || "") +
    " " +
    String(item.hadSpecificPurpose || "")
  ).match(/DAP-[1-6]/i);
  return match ? match[0].toUpperCase() : "";
};

const activeMethod = ref("photogrammetry");
const selectedHardware = ref([]);
const customHardware = ref("");
const selectedSoftware = ref([]);
const customSoftware = ref("");

const PHOTO_HW = [
  { name: "Sony A7R V (61 MP)" },
  { name: "Nikon Z 8 (45.7 MP)" },
  { name: "NIKKOR Z 50mm f/1.8 S" },
  { name: "Sony FE 50mm f/1.4 GM" },
  { name: "Phase One IQ4 150MP" },
  { name: "Polfilter & Ringlicht" },
  { name: "Elektrischer Drehteller" },
];

const SLS_HW = [
  { name: "Artec Leo (VCSEL 3D-Scanner)" },
  { name: "EinScan Pro HD (Streifenlicht)" },
  { name: "GOM ATOS Q (Blaues Streifenlicht)" },
  { name: "Breuckmann smartSCAN" },
  { name: "Artec Eva" },
  { name: "Optische Kalibriertargets" },
];

const TLS_HW = [
  { name: "Leica RTC360 (3D-Laserscanner)" },
  { name: "Faro Focus Core / Premium" },
  { name: "Z+F IMAGER 5016" },
  { name: "Leica BLK360 G2" },
  { name: "Geodätische Passmarken" },
];

const currentHwPresets = computed(() => {
  if (activeMethod.value === "photogrammetry") return PHOTO_HW;
  if (activeMethod.value === "sls") return SLS_HW;
  if (activeMethod.value === "tls") return TLS_HW;
  return [...PHOTO_HW.slice(0, 3), ...SLS_HW.slice(0, 3)];
});

const SOFTWARE_PRESETS = [
  "RealityCapture 1.4",
  "Agisoft Metashape Pro 2.1",
  "Artec Studio 19 Pro",
  "FARO SCENE",
  "CloudCompare",
  "MeshLab",
  "Blender 4.3 LTS",
  "Substance 3D Painter",
];

const selectMethod = (method) => {
  activeMethod.value = method;
  if (method === "photogrammetry") {
    selectedHardware.value = [
      "Nikon Z 8 (45.7 MP)",
      "NIKKOR Z 50mm f/1.8 S",
      "Polfilter & Ringlicht",
    ];
    selectedSoftware.value = ["RealityCapture 1.4", "Blender 4.3 LTS"];
  } else if (method === "sls") {
    selectedHardware.value = [
      "Artec Leo (VCSEL 3D-Scanner)",
      "Optische Kalibriertargets",
    ];
    selectedSoftware.value = ["Artec Studio 19 Pro", "Blender 4.3 LTS"];
  } else if (method === "tls") {
    selectedHardware.value = [
      "Leica RTC360 (3D-Laserscanner)",
      "Geodätische Passmarken",
    ];
    selectedSoftware.value = ["FARO SCENE", "CloudCompare"];
  } else if (method === "hybrid") {
    selectedHardware.value = [
      "Artec Leo (VCSEL 3D-Scanner)",
      "Sony A7R V (61 MP)",
    ];
    selectedSoftware.value = [
      "Artec Studio 19 Pro",
      "RealityCapture 1.4",
      "Blender 4.3 LTS",
    ];
  }
};

const toggleHardware = (name) => {
  const idx = selectedHardware.value.indexOf(name);
  if (idx >= 0) {
    selectedHardware.value.splice(idx, 1);
  } else {
    selectedHardware.value.push(name);
  }
};

const toggleSoftware = (name) => {
  const idx = selectedSoftware.value.indexOf(name);
  if (idx >= 0) {
    selectedSoftware.value.splice(idx, 1);
  } else {
    selectedSoftware.value.push(name);
  }
};

const getEffectiveHardware = () => {
  const list = [...selectedHardware.value];
  if (customHardware.value.trim()) list.push(customHardware.value.trim());
  return list.join("; ");
};

const getEffectiveSoftware = () => {
  const list = [...selectedSoftware.value];
  if (customSoftware.value.trim()) list.push(customSoftware.value.trim());
  return list.join("; ");
};

const addPredefinedSubactivity = (kind) => {
  const isDe = props.currentLocale === "de";
  const lang = isDe ? "de" : "en";

  if (kind === "capture" || kind === "both") {
    let methodText = "";
    let techText = "";
    let matText = "";
    let purposeText = "";

    if (activeMethod.value === "photogrammetry") {
      methodText = isDe
        ? "Nahbereichs-Photogrammetrie (Structure-from-Motion / SfM)"
        : "Close-range photogrammetry (SfM / MVS)";
      techText = isDe
        ? "Polarisierte Beleuchtung (Cross-Polarisation), Drehteller-Multiwinkel, Farbkalibrierung"
        : "Cross-polarised lighting, turntable multi-angle, color calibration";
      matText = isDe
        ? "X-Rite ColorChecker Classic, kalibrierte Passmarken"
        : "X-Rite ColorChecker Classic, calibrated scale bars";
      purposeText = isDe
        ? "Hochauflösende 3D-Oberflächenerfassung und Texturierung mittels Nahbereichsphotogrammetrie"
        : "High-resolution 3D surface capture and texturing via close-range photogrammetry";
    } else if (activeMethod.value === "sls") {
      methodText = isDe
        ? "Streifenlicht-3D-Scanning (Structured light scanning)"
        : "Structured light 3D scanning";
      techText = isDe
        ? "Optische Streifenmusterprojektion, berührungslose Sub-Millimeter-Abtastung"
        : "Optical fringe projection, non-contact sub-millimeter sampling";
      matText = isDe ? "3D-Kalibriertargets" : "3D calibration targets";
      purposeText = isDe
        ? "Berührungslose hochpräzise Streifenlicht-3D-Erfassung der geometrischen Oberfläche"
        : "Non-contact high-precision structured light 3D capture of geometric surface";
    } else if (activeMethod.value === "tls") {
      methodText = isDe
        ? "Terrestrisches Laserscanning (TLS)"
        : "Terrestrial laser scanning (TLS)";
      techText = isDe
        ? "Phasenvergleichs-/Laufzeitmessung, geodätische Scan-Registrierung"
        : "Phase-shift / time-of-flight LiDAR, geodetic station alignment";
      matText = isDe
        ? "Retroreflektierende Passmarken"
        : "Retroreflective targets";
      purposeText = isDe
        ? "Großräumige hochpräzise 3D-Laserscan-Erfassung des Denkmals / Objekts"
        : "Large-scale high-precision 3D terrestrial laser scan acquisition";
    } else {
      methodText = isDe
        ? "Hybride 3D-Erfassung (Streifenlichtscanning & Nahbereichsphotogrammetrie)"
        : "Hybrid 3D acquisition (Structured light & photogrammetry)";
      techText = isDe
        ? "Multisensor-Fusion, optische Geometrieabtastung und PBR-Farbaufnahme"
        : "Multi-sensor data fusion, optical geometry sampling and PBR color capture";
      matText = isDe
        ? "Kalibrierkörper, Passmarken, ColorChecker"
        : "Calibration targets, scale bars, ColorChecker";
      purposeText = isDe
        ? "Kombinierte 3D-Erfassung für maximale Geometrie-Genauigkeit und Texturauflösung"
        : "Combined 3D acquisition for maximum geometric precision and texture resolution";
    }

    const captureStep = {
      stepKind: "capture",
      hadSpecificPurpose: purposeText,
      "hadSpecificPurpose#lang": lang,
      startDate: new Date().toISOString().slice(0, 10),
      endDate: new Date().toISOString().slice(0, 10),
      methods: methodText,
      "methods#lang": lang,
      techniques: techText,
      "techniques#lang": lang,
      materials: matText,
      "materials#lang": lang,
      equipment: `Hardware: ${getEffectiveHardware()}; Software: ${getEffectiveSoftware()}`,
      "equipment#lang": lang,
    };

    emit("add-step", captureStep);
  }

  if (kind === "processing" || kind === "both") {
    const procStep = {
      stepKind: "processing",
      hadSpecificPurpose: isDe
        ? "3D-Post-Processing: Bereinigung der Punktwolke, Netzoptimierung, UV-Unwrapping und Textur-Baking"
        : "3D post-processing: point cloud cleanup, mesh decimation, UV unwrapping and texture baking",
      "hadSpecificPurpose#lang": lang,
      startDate: new Date().toISOString().slice(0, 10),
      endDate: new Date().toISOString().slice(0, 10),
      methods: isDe
        ? "Polygondezimierung, Quad-Remeshing, PBR-Textur-Baking"
        : "Polygon decimation, quad remeshing, PBR texture baking",
      "methods#lang": lang,
      techniques: isDe
        ? "Poisson-Rekonstruktion, Non-overlapping UV-Packing, Tangent-Space Normal Baking"
        : "Poisson reconstruction, non-overlapping UV packing, tangent-space normal baking",
      "techniques#lang": lang,
      materials: "",
      equipment: `Software: ${getEffectiveSoftware() || "Blender 4.3 LTS, Instant Meshes, RealityCapture"}`,
      "equipment#lang": lang,
    };

    emit("add-step", procStep);
  }

  if (kind === "ai_inpainting") {
    const aiInpaintStep = {
      hadSpecificPurpose: isDe
        ? "KI-gestützte Ergänzung der Textur im Bereich [betroffene Partie, z. B. linke Wange / Abschattung beim Scan]; Ziel: geschlossene Textur für das Webmodell, nicht für das Archivmaster"
        : "AI-assisted texture completion in [affected area, e.g. left cheek / scan occlusion]; goal: closed texture for web model, not archival master",
      "hadSpecificPurpose#lang": lang,
      startDate: new Date().toISOString().slice(0, 10),
      endDate: new Date().toISOString().slice(0, 10),
      methods: isDe
        ? "Generative Texturergänzung (KI-Inpainting) einer Fehlstelle; ca. [X] % der Texturfläche betroffen"
        : "Generative texture completion (AI inpainting) of a missing area; approx. [X]% of texture area affected",
      "methods#lang": lang,
      "methods#term": isDe
        ? "KI-Inpainting (Texturergänzung)"
        : "AI texture inpainting",
      "methods#namespace":
        "http://vocabs.bcdh.uni-bonn.de/hector_3d_documentation/",
      "methods#termUID":
        "http://vocabs.bcdh.uni-bonn.de/hector_3d_documentation/concept_4441ef06",
      techniques: isDe
        ? "Diffusionsbasiertes Inpainting auf maskiertem UV-Bereich; prompt-gesteuert mit Referenzbildern; IPTC Digital Source Type: compositeWithTrainedAlgorithmicMedia (http://cv.iptc.org/newscodes/digitalsourcetype/compositeWithTrainedAlgorithmicMedia)"
        : "Diffusion-based inpainting on masked UV area; prompt-guided with reference photos; IPTC Digital Source Type: compositeWithTrainedAlgorithmicMedia (http://cv.iptc.org/newscodes/digitalsourcetype/compositeWithTrainedAlgorithmicMedia)",
      "techniques#lang": lang,
      "techniques#term": isDe
        ? "Teilweise KI-generierte Medien (compositeWithTrainedAlgorithmicMedia)"
        : "Composite with AI-generated media (compositeWithTrainedAlgorithmicMedia)",
      "techniques#namespace":
        "http://vocabs.bcdh.uni-bonn.de/hector_3d_documentation/",
      "techniques#termUID":
        "http://vocabs.bcdh.uni-bonn.de/hector_3d_documentation/concept_cef1191a",
      materials: isDe
        ? "Eingabe: Albedo-Map 8K (Mastertextur), UV-Maske; Referenzfotos der Kampagne; Prompt: „...“; Seed: [...]"
        : "Input: 8K Albedo map (master texture), UV mask; campaign reference photos; Prompt: '...'; Seed: [...]",
      "materials#lang": lang,
      equipment: isDe
        ? "KI-Modell: [Name, Version, Anbieter; lokal oder Cloud]; Software: [z. B. Bildbearbeitung/Texturierung, Version]; Hardware: [GPU]"
        : "AI model: [Name, Version, Provider; local or cloud]; Software: [e.g. image/texture tool, version]; Hardware: [GPU]",
      "equipment#lang": lang,
    };
    emit("add-step", aiInpaintStep);
  }

  if (kind === "ai_animation") {
    const aiAnimStep = {
      hadSpecificPurpose: isDe
        ? "Erzeugung einer Vermittlungsanimation (Kamerafahrt mit KI-generierter Lichtstimmung) aus dem Webmodell; keine Veränderung der Geometrie"
        : "Generation of a dissemination animation (camera flight with AI-generated lighting) from the web model; no geometry changes",
      "hadSpecificPurpose#lang": lang,
      startDate: new Date().toISOString().slice(0, 10),
      endDate: new Date().toISOString().slice(0, 10),
      methods: isDe
        ? "KI-gestützte Videogenerierung auf Basis gerenderter Einzelbilder"
        : "AI-assisted video generation based on rendered still frames",
      "methods#lang": lang,
      "methods#term": isDe
        ? "Image-to-Video (KI-Animation)"
        : "Image-to-Video (AI animation)",
      "methods#namespace":
        "http://vocabs.bcdh.uni-bonn.de/hector_3d_documentation/",
      "methods#termUID":
        "http://vocabs.bcdh.uni-bonn.de/hector_3d_documentation/concept_c5219268",
      techniques: isDe
        ? "Image-to-Video; Stiltransfer der Beleuchtung; IPTC Digital Source Type: compositeWithTrainedAlgorithmicMedia (http://cv.iptc.org/newscodes/digitalsourcetype/compositeWithTrainedAlgorithmicMedia)"
        : "Image-to-Video; lighting style transfer; IPTC Digital Source Type: compositeWithTrainedAlgorithmicMedia (http://cv.iptc.org/newscodes/digitalsourcetype/compositeWithTrainedAlgorithmicMedia)",
      "techniques#lang": lang,
      "techniques#term": isDe
        ? "Teilweise KI-generierte Medien (compositeWithTrainedAlgorithmicMedia)"
        : "Composite with AI-generated media (compositeWithTrainedAlgorithmicMedia)",
      "techniques#namespace":
        "http://vocabs.bcdh.uni-bonn.de/hector_3d_documentation/",
      "techniques#termUID":
        "http://vocabs.bcdh.uni-bonn.de/hector_3d_documentation/concept_cef1191a",
      materials: isDe
        ? "Eingabe: [120] Renderbilder aus Blender (Webmodell); Prompt: „...“"
        : "Input: [120] rendered frames from Blender (web model); Prompt: '...'",
      "materials#lang": lang,
      equipment: isDe
        ? "KI-Modell: [Name, Version, Anbieter]; Software: Blender 4.3 LTS (Rendering)"
        : "AI model: [Name, Version, Provider]; Software: Blender 4.3 LTS (Rendering)",
      "equipment#lang": lang,
    };
    emit("add-step", aiAnimStep);
  }
};
</script>
