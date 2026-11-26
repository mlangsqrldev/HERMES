<template>
  <div
    class="col-span-full border border-base-300 bg-base-100 p-4 sm:p-5 rounded-xl mb-5 shadow-2xs"
  >
    <!-- Header -->
    <div
      class="flex flex-wrap justify-between items-center gap-2 mb-4 pb-2 border-b border-base-200"
    >
      <div class="flex flex-row items-center gap-1.5">
        <h4 class="font-bold text-lg capitalize text-base-content/80">
          {{
            title ||
            (currentLocale === "de" ? "Räumliche Verortung (Spatial)" : "Spatial")
          }}
        </h4>
        <div
          v-if="tooltip"
          @click.stop.prevent
          class="tooltip tooltip-accent tooltip-right"
          :data-tip="tooltip"
        >
          <button type="button" class="btn btn-circle w-6 h-6 p-1 cursor-help">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill-rule="evenodd"
              clip-rule="evenodd"
              viewBox="0 0 512 512"
              fill="currentColor"
              class="size-[1.2em]"
            >
              <path
                d="M256 0c70.69 0 134.69 28.66 181.02 74.98C483.34 121.3 512 185.31 512 256c0 70.69-28.66 134.7-74.98 181.02C390.69 483.34 326.69 512 256 512c-70.69 0-134.69-28.66-181.02-74.98C28.66 390.69 0 326.69 0 256c0-70.69 28.66-134.69 74.98-181.02C121.31 28.66 185.31 0 256 0zm-9.96 161.03c0-4.28.76-8.26 2.27-11.91 1.5-3.63 3.77-6.94 6.79-9.91 3-2.95 6.29-5.2 9.84-6.7 3.57-1.5 7.41-2.28 11.52-2.28 4.12 0 7.96.78 11.49 2.27 3.54 1.51 6.78 3.76 9.75 6.73 2.95 2.97 5.16 6.26 6.64 9.91 1.49 3.63 2.22 7.61 2.22 11.89 0 4.17-.73 8.08-2.21 11.69-1.48 3.6-3.68 6.94-6.65 9.97-2.94 3.03-6.18 5.32-9.72 6.84-3.54 1.51-7.38 2.29-11.52 2.29-4.22 0-8.14-.76-11.75-2.26-3.58-1.51-6.86-3.79-9.83-6.79-2.94-3.02-5.16-6.34-6.63-9.97-1.48-3.62-2.21-7.54-2.21-11.77zm13.4 178.16c-1.11 3.97-3.35 11.76 3.3 11.76 1.44 0 3.27-.81 5.46-2.4 2.37-1.71 5.09-4.31 8.13-7.75 3.09-3.5 6.32-7.65 9.67-12.42 3.33-4.76 6.84-10.22 10.49-16.31.37-.65 1.23-.87 1.89-.48l12.36 9.18c.6.43.73 1.25.35 1.86-5.69 9.88-11.44 18.51-17.26 25.88-5.85 7.41-11.79 13.57-17.8 18.43l-.1.06c-6.02 4.88-12.19 8.55-18.51 11.01-17.58 6.81-45.36 5.7-53.32-14.83-5.02-12.96-.9-27.69 3.06-40.37l19.96-60.44c1.28-4.58 2.89-9.62 3.47-14.33.97-7.87-2.49-12.96-11.06-12.96h-17.45c-.76 0-1.38-.62-1.38-1.38l.08-.48 4.58-16.68c.16-.62.73-1.04 1.35-1.02l89.12-2.79c.76-.03 1.41.57 1.44 1.33l-.07.43-37.76 124.7z"
              />
            </svg>
          </button>
        </div>
      </div>

      <button
        v-if="!maxItems || items.length < maxItems"
        type="button"
        class="btn btn-sm btn-outline btn-primary gap-1"
        @click.prevent="openModal(null)"
      >
        <span>+</span>
        {{
          currentLocale === "de"
            ? "Ort / Fundort hinzufügen"
            : "Add Location / Findspot"
        }}
      </button>
    </div>

    <!-- Entries Table -->
    <div v-if="items.length > 0" class="overflow-x-auto rounded-xl border border-base-200">
      <table class="table table-zebra table-sm w-full">
        <thead>
          <tr class="bg-base-200/60">
            <th>{{ currentLocale === "de" ? "Ort" : "Location" }}</th>
            <th>{{ currentLocale === "de" ? "Region" : "Geopolitical Area" }}</th>
            <th>{{ currentLocale === "de" ? "Adresse" : "Address" }}</th>
            <th>{{ currentLocale === "de" ? "Koordinaten" : "Coordinates" }}</th>
            <th class="w-24 text-right">
              {{ currentLocale === "de" ? "Aktionen" : "Actions" }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, idx) in items" :key="idx" class="hover">
            <td class="font-bold text-sm">
              <div class="flex items-center gap-1.5 flex-wrap">
                <span v-if="formatNamedLoc(item['locationSet.historicalName'])" class="badge badge-warning badge-xs">
                  🏛️ {{ currentLocale === "de" ? "Historisch" : "Historical" }}
                </span>
                <span>
                  {{
                    formatNamedLoc(item["locationSet.historicalName"]) ||
                    formatNamedLoc(item["locationSet.namedLocation"]) ||
                    "–"
                  }}
                </span>
              </div>
            </td>
            <td class="text-xs">
              <span
                v-if="item['locationSet.geopoliticalArea']"
                class="badge badge-info/15 text-info border border-info/30 badge-xs font-medium"
              >
                🌍 {{ item["locationSet.geopoliticalArea"] }}
              </span>
              <span v-else class="opacity-40">–</span>
            </td>
            <td class="text-xs text-base-content/75">
              {{ formatAddress(item) || "–" }}
            </td>
            <td class="font-mono text-xs">
              <span v-if="item['geometry.quickpoint.y'] || item['geometry.quickpoint.x']">
                {{ item["geometry.quickpoint.y"] || "0" }},
                {{ item["geometry.quickpoint.x"] || "0" }}
              </span>
              <span v-else class="opacity-40">–</span>
            </td>
            <td class="text-right">
              <div class="flex gap-1 justify-end">
                <button
                  type="button"
                  class="btn btn-xs btn-ghost text-info"
                  @click.prevent="openModal(idx)"
                >
                  {{ currentLocale === "de" ? "Bearbeiten" : "Edit" }}
                </button>
                <button
                  type="button"
                  class="btn btn-xs btn-ghost text-error hover:bg-error/10"
                  @click.prevent="removeItem(idx)"
                  :title="currentLocale === 'de' ? 'Löschen' : 'Delete'"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="size-3.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Empty State -->
    <div
      v-else
      class="text-center py-4 text-xs opacity-60 italic border border-dashed border-base-300 rounded-xl"
    >
      {{
        currentLocale === "de"
          ? "Noch keine räumlichen Einträge vorhanden. Klicken Sie auf „Ort / Fundort hinzufügen“."
          : "No spatial entries yet. Click 'Add Location / Findspot' to add one."
      }}
    </div>

    <!-- Centered Modal -->
    <Teleport to="body">
      <dialog
        v-if="isModalOpen"
        open
        class="modal modal-open z-[9999] bg-black/45 backdrop-blur-xs"
      >
      <div
        class="modal-box max-w-5xl w-11/12 bg-base-100 border border-base-300 shadow-2xl p-0 overflow-hidden flex flex-col max-h-[90vh]"
      >
        <!-- Modal Header -->
        <div
          class="px-5 py-4 bg-base-200/70 border-b border-base-300 flex items-center justify-between gap-3 shrink-0"
        >
          <div class="flex items-center gap-2.5">
            <div
              class="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center text-lg"
            >
              🌍
            </div>
            <div>
              <h3 class="font-bold text-base leading-tight">
                {{
                  editingIndex !== null
                    ? currentLocale === "de"
                      ? "Ort / Fundort bearbeiten"
                      : "Edit Location / Findspot"
                    : currentLocale === "de"
                      ? "Ort / Fundort hinzufügen"
                      : "Add Location / Findspot"
                }}
              </h3>
              <p class="text-xs text-base-content/60">
                {{
                  currentLocale === "de"
                    ? "Ortsname, historische Bezeichnung, Adresse oder Koordinaten erfassen"
                    : "Specify place name, historical findspot, address or coordinates"
                }}
              </p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <button
              v-if="allowOrgPool"
              type="button"
              class="btn btn-xs btn-outline btn-secondary gap-1"
              @click="isOrgPickerOpen = true"
            >
              🏛️ {{ currentLocale === "de" ? "Organisation wählen" : "Pick Organizations" }}
            </button>
            <button
              type="button"
              class="btn btn-sm btn-ghost btn-circle"
              @click="closeModal"
            >
              ✕
            </button>
          </div>
        </div>

        <!-- Modal Body (all fields on one unified page, no tabs) -->
        <div class="p-5 overflow-y-auto space-y-4 flex-1">
          <!-- Ancient (Pleiades) & Modern (Geonames) side by side -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="form-control w-full">
              <label class="label py-1">
                <span class="label-text font-bold text-xs uppercase tracking-wider">
                  {{
                    currentLocale === "de"
                      ? "Antiker Ort (Pleiades)"
                      : "Ancient Place (Pleiades)"
                  }}
                </span>
              </label>
              <PlaceAutocomplete
                v-model="draft['locationSet.historicalName']"
                allowed-modes="ancient"
                :current-locale="currentLocale"
                @select="handleAncientPlaceSelect"
              />
            </div>

            <div class="form-control w-full">
              <label class="label py-1">
                <span class="label-text font-bold text-xs uppercase tracking-wider">
                  {{
                    currentLocale === "de"
                      ? "Heutiger Ort (GeoNames)"
                      : "Modern Place (GeoNames)"
                  }}
                </span>
              </label>
              <PlaceAutocomplete
                v-model="draft['locationSet.namedLocation']"
                allowed-modes="modern"
                :current-locale="currentLocale"
                @select="handlePlaceSelect"
              />
            </div>
          </div>

          <div class="form-control w-full">
            <label class="label py-1">
              <span class="label-text font-bold text-xs uppercase tracking-wider">
                {{
                  currentLocale === "de"
                    ? "Geopolitische Region"
                    : "Geopolitical Area"
                }}
              </span>
            </label>
            <input
              type="text"
              v-model="draft['locationSet.geopoliticalArea']"
              class="input input-sm input-bordered w-full"
              :placeholder="
                currentLocale === 'de'
                  ? 'z. B. Deutschland, Griechenland'
                  : 'e.g. Germany, Greece'
              "
            />
          </div>

          <!-- Interactive Map Picker -->
          <SpatialMapPicker
            :lat="draft['geometry.quickpoint.y']"
            :lng="draft['geometry.quickpoint.x']"
            :current-locale="currentLocale"
            @update:lat="(v) => (draft['geometry.quickpoint.y'] = v)"
            @update:lng="(v) => (draft['geometry.quickpoint.x'] = v)"
            @place-selected="handleMapPlaceSelect"
          />

          <!-- Coordinates Quick Input -->
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div class="form-control">
              <label class="label py-0.5">
                <span class="label-text text-xs font-semibold">
                  {{ currentLocale === "de" ? "Breitengrad (Y)" : "Latitude (Y)" }}
                </span>
              </label>
              <input
                type="text"
                v-model="draft['geometry.quickpoint.y']"
                class="input input-sm input-bordered w-full font-mono text-xs"
                placeholder="50.7374"
              />
            </div>
            <div class="form-control">
              <label class="label py-0.5">
                <span class="label-text text-xs font-semibold">
                  {{ currentLocale === "de" ? "Längengrad (X)" : "Longitude (X)" }}
                </span>
              </label>
              <input
                type="text"
                v-model="draft['geometry.quickpoint.x']"
                class="input input-sm input-bordered w-full font-mono text-xs"
                placeholder="7.0982"
              />
            </div>
            <div class="form-control">
              <label class="label py-0.5">
                <span class="label-text text-xs font-semibold">
                  {{ currentLocale === "de" ? "Koordinatensystem (SRS)" : "Reference System (SRS)" }}
                </span>
              </label>
              <input
                type="text"
                v-model="draft['geometry.spatialReferenceSystem']"
                class="input input-sm input-bordered w-full font-mono text-xs"
                placeholder="WGS84"
              />
            </div>
          </div>

          <!-- Optional Address Details -->
          <div class="p-3.5 rounded-xl bg-base-200/40 border border-base-200 space-y-2.5">
            <div class="text-xs font-bold uppercase tracking-wider text-base-content/70">
              {{ currentLocale === "de" ? "Adressdaten (Optional)" : "Address Details (Optional)" }}
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <input
                type="text"
                v-model="draft['locationSet.address.buildingName']"
                class="input input-sm input-bordered w-full text-xs sm:col-span-3"
                :placeholder="currentLocale === 'de' ? 'Gebäude' : 'Building'"
              />
              <input
                type="text"
                v-model="draft['locationSet.address.roadName']"
                class="input input-sm input-bordered w-full text-xs sm:col-span-2"
                :placeholder="currentLocale === 'de' ? 'Straße' : 'Street'"
              />
              <input
                type="text"
                v-model="draft['locationSet.address.numberInRoad']"
                class="input input-sm input-bordered w-full text-xs"
                :placeholder="currentLocale === 'de' ? 'Hausnr.' : 'No.'"
              />
              <input
                type="text"
                v-model="draft['locationSet.address.postcodeOrZipcode']"
                class="input input-sm input-bordered w-full text-xs font-mono"
                :placeholder="currentLocale === 'de' ? 'PLZ' : 'Postcode'"
              />
              <input
                type="text"
                v-model="draft['locationSet.address.townOrCity']"
                class="input input-sm input-bordered w-full text-xs"
                :placeholder="currentLocale === 'de' ? 'Stadt' : 'City'"
              />
              <input
                type="text"
                v-model="draft['locationSet.address.country']"
                class="input input-sm input-bordered w-full text-xs font-mono uppercase"
                :placeholder="currentLocale === 'de' ? 'Land (DE, GB...)' : 'Country (DE, GB...)'"
              />
            </div>
          </div>
        </div>

        <!-- Modal Footer -->
        <div
          class="px-5 py-3.5 bg-base-200/70 border-t border-base-300 flex justify-end gap-2 shrink-0"
        >
          <button type="button" class="btn btn-sm btn-ghost" @click="closeModal">
            {{ currentLocale === "de" ? "Abbrechen" : "Cancel" }}
          </button>
          <button
            type="button"
            class="btn btn-sm btn-primary font-bold"
            @click="saveEntry"
          >
            {{
              editingIndex !== null
                ? currentLocale === "de"
                  ? "Änderungen speichern"
                  : "Save Changes"
                : currentLocale === "de"
                  ? "Übernehmen"
                  : "Add Entry"
            }}
          </button>
        </div>
      </div>
      <form
        method="dialog"
        class="modal-backdrop bg-black/50 backdrop-blur-sm"
        @click="closeModal"
      >
        <button>close</button>
      </form>
      </dialog>
    </Teleport>

    <OrganizationPickerModal
      v-if="allowOrgPool"
      :isOpen="isOrgPickerOpen"
      mode="select"
      :locale="currentLocale"
      @close="isOrgPickerOpen = false"
      @select="handleOrgPicked"
    />
  </div>
</template>

<script setup>
import { computed, reactive, ref } from "vue";
import PlaceAutocomplete from "./PlaceAutocomplete.vue";
import SpatialMapPicker from "./SpatialMapPicker.vue";
import OrganizationPickerModal from "./OrganizationPickerModal.vue";
import {
  recentSpatialLocations,
  recordRecentSpatialLocation,
} from "../utils/sharedState.js";

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => [],
  },
  currentLocale: {
    type: String,
    default: "de",
  },
  title: {
    type: String,
    default: "",
  },
  tooltip: {
    type: String,
    default: "",
  },
  allowOrgPool: {
    type: Boolean,
    default: false,
  },
  maxItems: {
    type: Number,
    default: 0, // 0 = unlimited
  },
});

const emit = defineEmits(["update:modelValue"]);

const items = computed(() =>
  Array.isArray(props.modelValue) ? props.modelValue : [],
);

const isModalOpen = ref(false);
const isOrgPickerOpen = ref(false);
const editingIndex = ref(null);
const spatialKind = ref("modern");

const draft = reactive({
  "locationSet.historicalName": "",
  "locationSet.namedLocation": "",
  "locationSet.geopoliticalArea": "",
  "locationSet.address.buildingName": "",
  "locationSet.address.roadName": "",
  "locationSet.address.numberInRoad": "",
  "locationSet.address.postcodeOrZipcode": "",
  "locationSet.address.townOrCity": "",
  "locationSet.address.country": "",
  "geometry.quickpoint.y": "",
  "geometry.quickpoint.x": "",
  "geometry.spatialReferenceSystem": "",
});

const resetDraft = () => {
  Object.keys(draft).forEach((k) => {
    draft[k] = "";
  });
};

const formatNamedLoc = (val) => {
  if (!val) return "";
  if (Array.isArray(val)) {
    return val
      .map((v) => (typeof v === "object" && v !== null ? v._value || v.label || "" : v))
      .filter(Boolean)
      .join(", ");
  }
  if (typeof val === "object") {
    return val._value || val.label || "";
  }
  return String(val);
};

const formatAddress = (item) => {
  const parts = [
    item["locationSet.address.buildingName"],
    [
      item["locationSet.address.roadName"],
      item["locationSet.address.numberInRoad"],
    ]
      .filter(Boolean)
      .join(" "),
    [
      item["locationSet.address.postcodeOrZipcode"],
      item["locationSet.address.townOrCity"],
    ]
      .filter(Boolean)
      .join(" "),
    item["locationSet.address.country"],
  ].filter(Boolean);
  return parts.join(", ");
};

const setSpatialKind = (kind) => {
  spatialKind.value = kind;
};

const openModal = (idx = null) => {
  resetDraft();
  if (idx !== null && items.value[idx]) {
    editingIndex.value = idx;
    const item = items.value[idx];
    draft["locationSet.historicalName"] =
      item["locationSet.historicalName"] || "";
    draft["locationSet.namedLocation"] = formatNamedLoc(
      item["locationSet.namedLocation"],
    );
    draft["locationSet.geopoliticalArea"] =
      item["locationSet.geopoliticalArea"] || "";
    draft["locationSet.address.buildingName"] =
      item["locationSet.address.buildingName"] || "";
    draft["locationSet.address.roadName"] =
      item["locationSet.address.roadName"] || "";
    draft["locationSet.address.numberInRoad"] =
      item["locationSet.address.numberInRoad"] || "";
    draft["locationSet.address.postcodeOrZipcode"] =
      item["locationSet.address.postcodeOrZipcode"] || "";
    draft["locationSet.address.townOrCity"] =
      item["locationSet.address.townOrCity"] || "";
    draft["locationSet.address.country"] =
      item["locationSet.address.country"] || "";
    draft["geometry.quickpoint.y"] = item["geometry.quickpoint.y"] || "";
    draft["geometry.quickpoint.x"] = item["geometry.quickpoint.x"] || "";
    draft["geometry.spatialReferenceSystem"] =
      item["geometry.spatialReferenceSystem"] ||
      item["spatialReferenceSystem"] ||
      "";

    spatialKind.value =
      draft["locationSet.historicalName"] && !draft["locationSet.namedLocation"]
        ? "historical"
        : "modern";
  } else {
    editingIndex.value = null;
    spatialKind.value = "modern";
  }
  isModalOpen.value = true;
};

const closeModal = () => {
  isModalOpen.value = false;
  editingIndex.value = null;
};

const handleAncientPlaceSelect = (place) => {
  if (!place) return;
  if (place.name) draft["locationSet.historicalName"] = place.name;
  if (place.countryName || place.country) {
    if (!draft["locationSet.geopoliticalArea"]) {
      draft["locationSet.geopoliticalArea"] = place.countryName || place.country;
    }
  }
  if (place.lat != null && place.lng != null) {
    if (!draft["geometry.quickpoint.y"]) draft["geometry.quickpoint.y"] = String(place.lat);
    if (!draft["geometry.quickpoint.x"]) draft["geometry.quickpoint.x"] = String(place.lng);
  }
};

const handlePlaceSelect = (place) => {
  if (!place) return;
  if (place.name) draft["locationSet.namedLocation"] = place.name;
  if (place.countryName || place.country) {
    draft["locationSet.geopoliticalArea"] = place.countryName || place.country;
  }
  if (place.lat != null && place.lng != null) {
    draft["geometry.quickpoint.y"] = String(place.lat);
    draft["geometry.quickpoint.x"] = String(place.lng);
  }
};

const handleMapPlaceSelect = (place) => {
  if (!place) return;
  if (place.city || place.name) {
    draft["locationSet.namedLocation"] = place.city || place.name;
  }
  if (place.country) {
    draft["locationSet.geopoliticalArea"] = place.country;
  }
  if (place.countryCode) {
    draft["locationSet.address.country"] = place.countryCode.toUpperCase();
  }
};

const handleOrgPicked = (org) => {
  if (!org) return;
  spatialKind.value = "modern";
  draft["locationSet.namedLocation"] = org.city
    ? `${org.city} (${(org.country || "DE").toUpperCase()})`
    : org.name || "";
  draft["locationSet.geopoliticalArea"] = org.country
    ? org.country.toUpperCase()
    : "";
  draft["locationSet.address.buildingName"] =
    org.buildingName || org.name || "";
  draft["locationSet.address.roadName"] = org.roadName || "";
  draft["locationSet.address.numberInRoad"] = org.numberInRoad || "";
  draft["locationSet.address.postcodeOrZipcode"] = org.postcodeOrZipcode || "";
  draft["locationSet.address.townOrCity"] = org.city || "";
  draft["locationSet.address.country"] = (org.country || "").toUpperCase();
  isOrgPickerOpen.value = false;
};

const saveEntry = () => {
  const entry = {};
  Object.keys(draft).forEach((k) => {
    const val = String(draft[k] || "").trim();
    if (val) entry[k] = val;
  });

  if (Object.keys(entry).length === 0) {
    closeModal();
    return;
  }

  recordRecentSpatialLocation(entry);

  const next = [...items.value];
  if (editingIndex.value !== null) {
    next[editingIndex.value] = entry;
  } else {
    next.push(entry);
  }
  emit("update:modelValue", next);
  closeModal();
};

const applyRecentSpatial = (locChip) => {
  const clone = { ...locChip };
  delete clone.label;
  emit("update:modelValue", [...items.value, clone]);
};

const removeItem = (idx) => {
  const next = [...items.value];
  next.splice(idx, 1);
  emit("update:modelValue", next);
};
</script>

