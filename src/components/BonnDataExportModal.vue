<template>
  <Teleport to="body">
    <div
      v-if="isOpen"
      class="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      @click.self="emitClose"
    >
      <div
        role="dialog"
        aria-modal="true"
        :aria-label="
          currentLocale === 'de'
            ? 'Direkt-Export nach BonnData'
            : 'Direct Export to BonnData'
        "
        class="bg-base-100 rounded-2xl shadow-2xl border border-base-300 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden"
      >
        <!-- Header -->
        <div
          class="flex items-center justify-between px-6 py-4 border-b border-base-200 bg-base-200/40"
        >
          <div class="flex items-center gap-3">
            <span class="text-2xl">🏛️</span>
            <div>
              <h3 class="font-bold text-lg leading-tight">
                {{
                  currentLocale === "de"
                    ? "Direkt-Export nach BonnData (Dataverse)"
                    : "Direct Export to BonnData (Dataverse)"
                }}
              </h3>
              <p class="text-xs text-base-content/60">
                {{
                  currentLocale === "de"
                    ? "Metadaten, CARARE-XML & 3D-Dateien direkt als Dataset hochladen"
                    : "Upload metadata, CARARE XML & 3D files directly as a dataset"
                }}
              </p>
            </div>
          </div>
          <button
            type="button"
            class="btn btn-sm btn-circle btn-ghost"
            @click="emitClose"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <!-- Body -->
        <div class="flex-1 overflow-y-auto p-6 space-y-5">
          <!-- API Key & Target Collection -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="form-control">
              <label class="label py-1">
                <span class="label-text font-semibold text-xs">
                  {{
                    currentLocale === "de"
                      ? "BonnData API-Token (X-Dataverse-key) *"
                      : "BonnData API Token (X-Dataverse-key) *"
                  }}
                </span>
              </label>
              <div class="join w-full">
                <input
                  v-model="apiToken"
                  :type="showToken ? 'text' : 'password'"
                  class="input input-bordered input-sm join-item w-full font-mono text-xs"
                  :placeholder="
                    currentLocale === 'de'
                      ? 'z. B. 4f66954c-...'
                      : 'e.g. 4f66954c-...'
                  "
                />
                <button
                  type="button"
                  class="btn btn-sm btn-outline join-item"
                  @click="showToken = !showToken"
                  :title="showToken ? 'Hide' : 'Show'"
                >
                  {{ showToken ? "🙈" : "👁️" }}
                </button>
              </div>
              <label class="label py-0.5">
                <span class="label-text-alt text-[11px] text-base-content/55">
                  {{
                    currentLocale === "de"
                      ? "Wird lokal im Browser gespeichert (bonndata.uni-bonn.de → API Token)."
                      : "Stored locally in browser (bonndata.uni-bonn.de → API Token)."
                  }}
                </span>
              </label>
            </div>

            <div class="form-control">
              <div class="flex items-center justify-between">
                <label class="label py-1">
                  <span class="label-text font-semibold text-xs">
                    {{
                      currentLocale === "de"
                        ? "Ziel-Collection (Dataverse Alias) *"
                        : "Target Collection (Dataverse Alias) *"
                    }}
                  </span>
                </label>
                <button
                  type="button"
                  class="btn btn-xs btn-ghost text-primary"
                  :disabled="isLoadingDataverses"
                  @click="fetchAvailableDataverses"
                >
                  <span v-if="isLoadingDataverses" class="loading loading-spinner loading-xs"></span>
                  <span v-else>↻ {{ currentLocale === "de" ? "Dataverses laden" : "Load Dataverses" }}</span>
                </button>
              </div>
              <div class="flex flex-wrap gap-1.5 mb-1.5">
                <select
                  v-if="availableDataverses.length > 0"
                  v-model="dataverseAlias"
                  @change="fetchAllowedLanguages"
                  class="select select-bordered select-xs flex-1 min-w-[180px]"
                >
                  <option
                    v-for="dv in availableDataverses"
                    :key="dv.alias"
                    :value="dv.alias"
                  >
                    {{ dv.name }} ({{ dv.alias }})
                  </option>
                </select>
                <input
                  v-model="dataverseAlias"
                  type="text"
                  class="input input-bordered input-xs w-36 font-mono"
                  @blur="fetchAllowedLanguages"
                  placeholder="Alias..."
                />
              </div>
              <div class="flex items-center gap-2">
                <span class="text-[11px] text-base-content/65">
                  {{
                    currentLocale === "de"
                      ? "Metadatensprache:"
                      : "Metadata language:"
                  }}
                </span>
                <select
                  v-model="selectedLanguage"
                  class="select select-bordered select-xs font-mono"
                >
                  <option
                    v-for="lang in allowedLanguages"
                    :key="lang.locale"
                    :value="lang.locale"
                  >
                    {{ lang.locale }} ({{ lang.title }})
                  </option>
                </select>
                <span
                  v-if="isCheckingLangs"
                  class="loading loading-spinner loading-xs text-primary"
                ></span>
              </div>
            </div>
          </div>

          <!-- Included generated files -->
          <div class="p-3.5 rounded-xl bg-base-200/50 border border-base-300 space-y-2">
            <div class="text-xs font-bold text-base-content/80">
              {{
                currentLocale === "de"
                  ? "Automatisch generierte HERMES-Dateien anhängen:"
                  : "Attach automatically generated HERMES files:"
              }}
            </div>
            <div class="flex flex-wrap gap-4 text-xs">
              <label class="label cursor-pointer gap-2 py-0">
                <input
                  v-model="includeCarareXml"
                  type="checkbox"
                  class="checkbox checkbox-xs checkbox-primary"
                />
                <span class="font-mono">carare.xml</span>
                <span class="text-base-content/60">(CARARE 2.0.6)</span>
              </label>
              <label class="label cursor-pointer gap-2 py-0">
                <input
                  v-model="includeArchivalReport"
                  type="checkbox"
                  class="checkbox checkbox-xs checkbox-primary"
                />
                <span class="font-mono">HERMES_Archivbericht.md</span>
              </label>
            </div>
          </div>

          <!-- User Data Files Dropzone -->
          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold text-base-content/80">
                {{
                  currentLocale === "de"
                    ? "3D-Modelle & Forschungsdaten anhängen (optional):"
                    : "Attach 3D models & research files (optional):"
                }}
              </span>
              <button
                type="button"
                class="btn btn-xs btn-outline"
                @click="fileInputRef?.click()"
              >
                + {{ currentLocale === "de" ? "Dateien wählen" : "Select files" }}
              </button>
              <input
                ref="fileInputRef"
                type="file"
                multiple
                class="hidden"
                @change="handleFilesSelected"
              />
            </div>

            <div
              class="border-2 border-dashed rounded-xl p-4 text-center text-xs transition-colors cursor-pointer"
              :class="
                isDragging
                  ? 'border-primary bg-primary/10'
                  : 'border-base-300 hover:border-primary/50'
              "
              @dragover.prevent="isDragging = true"
              @dragleave.prevent="isDragging = false"
              @drop.prevent="handleDrop"
              @click="fileInputRef?.click()"
            >
              <p class="text-base-content/70">
                {{
                  currentLocale === "de"
                    ? "3D-Dateien (.glb, .obj, .ply, .stl), Texturen oder PDFs hierher ziehen oder klicken"
                    : "Drag & drop 3D files (.glb, .obj, .ply, .stl), textures or PDFs here or click"
                }}
              </p>
            </div>

            <div v-if="attachedFiles.length > 0" class="space-y-1.5 max-h-36 overflow-y-auto">
              <div
                v-for="(f, idx) in attachedFiles"
                :key="f.name + idx"
                class="flex items-center justify-between px-3 py-1.5 rounded-lg bg-base-200/60 text-xs"
              >
                <span class="font-mono truncate max-w-[75%]">
                  📎 {{ f.name }}
                  <span class="text-base-content/50">({{ formatBytes(f.size) }})</span>
                </span>
                <button
                  type="button"
                  class="btn btn-ghost btn-xs text-error"
                  @click="attachedFiles.splice(idx, 1)"
                >
                  ✕
                </button>
              </div>
            </div>
          </div>

          <!-- Progress / Result / Error -->
          <div
            v-if="uploadProgress"
            class="p-3 rounded-xl bg-info/10 border border-info/30 text-xs flex items-center gap-2"
          >
            <span class="loading loading-spinner loading-xs text-info"></span>
            <span>{{ uploadProgress }}</span>
          </div>

          <div
            v-if="uploadError"
            class="p-3 rounded-xl bg-error/10 border border-error/30 text-xs text-error"
          >
            ⚠️ {{ uploadError }}
          </div>

          <div
            v-if="createdPersistentId"
            class="p-4 rounded-xl bg-success/15 border border-success/40 text-xs space-y-1.5"
          >
            <div class="font-bold text-success flex items-center gap-1.5">
              <span>✓</span>
              <span>
                {{
                  currentLocale === "de"
                    ? "Dataset erfolgreich auf BonnData angelegt!"
                    : "Dataset successfully created on BonnData!"
                }}
              </span>
            </div>
            <div>
              <strong>DOI:</strong>
              <span class="font-mono ml-1">{{ createdPersistentId }}</span>
            </div>
            <div>
              <a
                :href="`${baseUrl}/dataset.xhtml?persistentId=${encodeURIComponent(createdPersistentId)}`"
                target="_blank"
                rel="noopener noreferrer"
                class="link link-primary font-semibold"
              >
                🔗 {{ baseUrl }}/dataset.xhtml?persistentId={{ createdPersistentId }}
              </a>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div
          class="px-6 py-4 border-t border-base-200 bg-base-200/30 flex flex-wrap items-center justify-between gap-2"
        >
          <button
            type="button"
            class="btn btn-sm btn-outline"
            :disabled="isUploading"
            @click="emit('download-json', selectedLanguage)"
          >
            💾
            {{
              currentLocale === "de"
                ? "Nur JSON speichern"
                : "Download JSON only"
            }}
          </button>

          <div class="flex items-center gap-2">
            <button
              type="button"
              class="btn btn-sm btn-ghost"
              :disabled="isUploading"
              @click="emitClose"
            >
              {{ currentLocale === "de" ? "Schließen" : "Close" }}
            </button>
            <button
              type="button"
              class="btn btn-sm btn-primary gap-1.5"
              :disabled="isUploading || !apiToken.trim() || !dataverseAlias.trim()"
              @click="uploadToBonnData"
            >
              <span v-if="isUploading" class="loading loading-spinner loading-xs"></span>
              <span>🚀</span>
              <span>
                {{
                  currentLocale === "de"
                    ? "Direkt nach BonnData hochladen"
                    : "Upload directly to BonnData"
                }}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, watch, onMounted, onBeforeUnmount } from "vue";
import { buildBonnDataJson } from "../utils/bonndataExporter.js";

const TOKEN_STORAGE_KEY = "hermes_bonndata_api_token";

const props = defineProps({
  isOpen: { type: Boolean, default: false },
  currentLocale: { type: String, default: "de" },
  defaultMetadataLanguage: { type: String, default: "de" },
  exportData: { type: Object, default: () => ({}) },
  getXmlString: { type: Function, default: null },
  getMarkdownReport: { type: Function, default: null },
});

const emit = defineEmits(["close", "download-json"]);

const baseUrl = ref("https://bonndata.uni-bonn.de");
const apiToken = ref(localStorage.getItem(TOKEN_STORAGE_KEY) || "");
const showToken = ref(false);
const dataverseAlias = ref("3D");
const availableDataverses = ref([
  { alias: "3D", name: "3D" },
  { alias: "bcdh", name: "BCDH" },
]);
const isLoadingDataverses = ref(false);
const allowedLanguages = ref([{ locale: "en", title: "English" }]);
const selectedLanguage = ref("en");
const isCheckingLangs = ref(false);

const includeCarareXml = ref(true);
const includeArchivalReport = ref(true);
const attachedFiles = ref([]);
const fileInputRef = ref(null);
const isDragging = ref(false);

const isUploading = ref(false);
const uploadProgress = ref("");
const uploadError = ref("");
const createdPersistentId = ref("");

watch(apiToken, (val) => {
  try {
    localStorage.setItem(TOKEN_STORAGE_KEY, val || "");
  } catch {
    // ignore storage errors
  }
});

const emitClose = () => {
  if (!isUploading.value) emit("close");
};

const handleEscape = (e) => {
  if (e.key === "Escape" && props.isOpen) emitClose();
};

onMounted(() => window.addEventListener("keydown", handleEscape));
onBeforeUnmount(() => window.removeEventListener("keydown", handleEscape));

const fetchAllowedLanguages = async () => {
  const alias = dataverseAlias.value.trim();
  if (!alias) return;
  isCheckingLangs.value = true;
  try {
    const res = await fetch(
      `${baseUrl.value}/api/dataverses/${encodeURIComponent(alias)}/allowedMetadataLanguages`,
    );
    if (res.ok) {
      const json = await res.json();
      if (Array.isArray(json?.data) && json.data.length > 0) {
        allowedLanguages.value = json.data;
        const preferred =
          props.defaultMetadataLanguage === "de" ? "de-DE" : "en";
        const match = json.data.find((l) => l.locale === preferred);
        selectedLanguage.value = match ? match.locale : json.data[0].locale;
      }
    }
  } catch {
    // keep current fallback list
  } finally {
    isCheckingLangs.value = false;
  }
};

const selectAlias = (alias) => {
  dataverseAlias.value = alias;
  fetchAllowedLanguages();
};

const fetchAvailableDataverses = async () => {
  isLoadingDataverses.value = true;
  try {
    const headers = {};
    if (apiToken.value.trim()) {
      headers["X-Dataverse-key"] = apiToken.value.trim();
    }
    const res = await fetch(
      `${baseUrl.value}/api/search?q=*&type=dataverse&per_page=100`,
      { headers },
    );
    if (res.ok) {
      const json = await res.json();
      const items = Array.isArray(json?.data?.items) ? json.data.items : [];
      const parsed = items
        .map((it) => ({
          alias: it.identifier || it.alias || "",
          name: it.name || it.identifier || "",
        }))
        .filter((d) => d.alias);
      if (parsed.length > 0) {
        availableDataverses.value = parsed;
        if (!parsed.some((d) => d.alias === dataverseAlias.value)) {
          dataverseAlias.value = parsed[0].alias;
        }
      }
    }
  } catch {
    // keep fallback list
  } finally {
    isLoadingDataverses.value = false;
  }
};

watch(
  () => props.isOpen,
  (open) => {
    if (open) {
      uploadError.value = "";
      uploadProgress.value = "";
      fetchAvailableDataverses();
      fetchAllowedLanguages();
    }
  },
);

const handleFilesSelected = (e) => {
  const files = Array.from(e.target?.files || []);
  attachedFiles.value.push(...files);
  if (e.target) e.target.value = "";
};

const handleDrop = (e) => {
  isDragging.value = false;
  const files = Array.from(e.dataTransfer?.files || []);
  attachedFiles.value.push(...files);
};

const formatBytes = (bytes) => {
  if (!bytes) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const uploadFileToDataset = async (persistentId, fileObj, description) => {
  const formData = new FormData();
  formData.append("file", fileObj);
  formData.append(
    "jsonData",
    JSON.stringify({ description, categories: ["Data"] }),
  );
  const res = await fetch(
    `${baseUrl.value}/api/datasets/:persistentId/add?persistentId=${encodeURIComponent(persistentId)}`,
    {
      method: "POST",
      headers: { "X-Dataverse-key": apiToken.value.trim() },
      body: formData,
    },
  );
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Upload ${fileObj.name} (${res.status}): ${errText}`);
  }
};

const uploadToBonnData = async () => {
  isUploading.value = true;
  uploadError.value = "";
  createdPersistentId.value = "";

  try {
    const isDe = props.currentLocale === "de";
    uploadProgress.value = isDe
      ? "1/2 Dataset-Metadaten auf BonnData anlegen..."
      : "1/2 Creating dataset metadata on BonnData...";

    const payload = buildBonnDataJson({
      ...props.exportData,
      metadataLanguage: selectedLanguage.value,
    });

    const createRes = await fetch(
      `${baseUrl.value}/api/dataverses/${encodeURIComponent(dataverseAlias.value.trim())}/datasets`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Dataverse-key": apiToken.value.trim(),
        },
        body: JSON.stringify(payload),
      },
    );

    const createData = await createRes.json().catch(() => null);
    if (!createRes.ok || createData?.status !== "OK") {
      throw new Error(
        createData?.message || `HTTP ${createRes.status} beim Anlegen`,
      );
    }

    const persistentId = createData.data.persistentId;
    // Record immediately so partial file-upload retries never lose the created dataset PID
    createdPersistentId.value = persistentId;
    const filesToUpload = [];

    if (includeCarareXml.value && typeof props.getXmlString === "function") {
      const xmlStr = props.getXmlString();
      if (xmlStr) {
        filesToUpload.push({
          file: new File([xmlStr], "carare.xml", { type: "application/xml" }),
          desc: "CARARE 2.0.6 XML metadata exported from HERMES",
        });
      }
    }
    if (
      includeArchivalReport.value &&
      typeof props.getMarkdownReport === "function"
    ) {
      const mdStr = props.getMarkdownReport();
      if (mdStr) {
        filesToUpload.push({
          file: new File([mdStr], "HERMES_Archivbericht.md", {
            type: "text/markdown",
          }),
          desc: "HERMES Archival Report (Markdown)",
        });
      }
    }
    for (const f of attachedFiles.value) {
      filesToUpload.push({
        file: f,
        desc: "Uploaded from HERMES",
      });
    }

    for (let i = 0; i < filesToUpload.length; i++) {
      const item = filesToUpload[i];
      uploadProgress.value = isDe
        ? `Datei ${i + 1}/${filesToUpload.length} hochladen: ${item.file.name}...`
        : `Uploading file ${i + 1}/${filesToUpload.length}: ${item.file.name}...`;
      await uploadFileToDataset(persistentId, item.file, item.desc);
    }

    createdPersistentId.value = persistentId;
    uploadProgress.value = "";
  } catch (err) {
    console.error("BonnData direct upload failed:", err);
    uploadError.value = err.message || String(err);
    uploadProgress.value = "";
  } finally {
    isUploading.value = false;
  }
};
</script>
