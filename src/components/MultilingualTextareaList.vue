<template>
  <div class="col-span-full border border-base-300 bg-base-100 p-4 sm:p-5 rounded-xl mb-5 shadow-2xs">
    <!-- Header -->
    <div class="flex flex-wrap justify-between items-center gap-2 mb-3 pb-2 border-b border-base-200">
      <div class="flex flex-row items-center gap-1.5 min-w-0">
        <h4 class="font-bold text-base sm:text-lg capitalize text-base-content/80">
          {{ label }}
          <span v-if="required" class="text-accent font-black">*</span>
          <span v-else-if="recommended" class="text-warning font-black">~</span>
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
        type="button"
        class="btn btn-sm btn-primary gap-1 shrink-0"
        @click.prevent="addEntry"
      >
        <span>+</span>
        <span>{{ currentLocale === "de" ? "Sprache hinzufügen" : "Add Language" }}</span>
      </button>
    </div>

    <!-- Entries -->
    <div class="space-y-3">
      <div
        v-for="(entry, idx) in normalizedEntries"
        :key="idx"
        class="flex flex-col sm:flex-row items-stretch sm:items-start gap-2.5 p-3 rounded-xl bg-base-200/40 border border-base-300"
      >
        <textarea
          :value="entry._value"
          @input="updateText(idx, $event.target.value)"
          @blur="recordRecentText(entry._value, entry[langKey])"
          class="textarea textarea-bordered w-full min-h-[5.5rem] flex-1 min-w-0 bg-base-100"
          :placeholder="placeholder"
        ></textarea>

        <div class="flex items-center gap-1.5 shrink-0 sm:pt-1">
          <LanguageBadgePicker
            :model-value="entry[langKey]"
            @update:model-value="updateLang(idx, $event)"
          />

          <button
            type="button"
            class="btn btn-square btn-sm btn-ghost transition-colors"
            :class="
              entry[preferredKey]
                ? 'text-warning opacity-100'
                : 'text-base-content/35 hover:text-warning'
            "
            :title="
              currentLocale === 'de'
                ? 'Als bevorzugt festlegen'
                : 'Set as preferred'
            "
            @click.prevent="setPreferred(idx)"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="size-[1.2em]"
              :fill="entry[preferredKey] ? 'currentColor' : 'none'"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
              />
            </svg>
          </button>

          <button
            v-if="normalizedEntries.length > 1"
            type="button"
            class="btn btn-square btn-sm btn-ghost text-error hover:bg-error/10"
            :title="currentLocale === 'de' ? 'Entfernen' : 'Remove'"
            @click.prevent="removeEntry(idx)"
          >
            <svg
              class="size-[1.15em]"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Reusable recent entries for active language -->
    <div
      v-if="visibleRecentEntries.length > 0"
      class="mt-3 pt-2.5 border-t border-base-200/80 flex flex-wrap items-center gap-1.5"
    >
      <button
        v-for="(rec, rIdx) in visibleRecentEntries"
        :key="rIdx"
        type="button"
        class="btn btn-xs btn-ghost border border-base-300 bg-base-200/40 hover:border-primary/60 hover:bg-primary/10 normal-case font-normal max-w-[260px] truncate"
        :title="rec.text"
        @click.prevent="applyRecentEntry(rec)"
      >
        <span class="truncate">{{ rec.text }}</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed, inject, ref, watch } from "vue";
import LanguageBadgePicker from "./LanguageBadgePicker.vue";

const props = defineProps({
  modelValue: {
    type: [Array, String],
    default: () => [],
  },
  defaultLang: {
    type: String,
    default: "",
  },
  langKey: {
    type: String,
    default: "lang",
  },
  historyKey: {
    type: String,
    default: "",
  },
  preferredKey: {
    type: String,
    default: "preferred",
  },
  label: {
    type: String,
    required: true,
  },
  tooltip: {
    type: String,
    default: "",
  },
  placeholder: {
    type: String,
    default: "",
  },
  currentLocale: {
    type: String,
    default: "de",
  },
  required: {
    type: Boolean,
    default: false,
  },
  recommended: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["update:modelValue"]);
const defaultMetadataLanguage = inject("defaultMetadataLanguage", ref("de"));

const fallbackLang = computed(
  () => props.defaultLang || defaultMetadataLanguage.value || "de",
);

const normalizedEntries = computed(() => {
  if (Array.isArray(props.modelValue) && props.modelValue.length > 0) {
    return props.modelValue.map((item, idx) => {
      if (typeof item === "string") {
        return {
          _value: item,
          [props.langKey]: fallbackLang.value,
          [props.preferredKey]: idx === 0,
        };
      }
      return {
        _value: item?._value ?? "",
        [props.langKey]: item?.[props.langKey] || item?.lang || fallbackLang.value,
        [props.preferredKey]:
          item?.[props.preferredKey] ?? item?.preferred ?? idx === 0,
      };
    });
  }
  if (typeof props.modelValue === "string") {
    return [
      {
        _value: props.modelValue,
        [props.langKey]: fallbackLang.value,
        [props.preferredKey]: true,
      },
    ];
  }
  return [
    {
      _value: "",
      [props.langKey]: fallbackLang.value,
      [props.preferredKey]: true,
    },
  ];
});

const emitNext = (list) => {
  emit(
    "update:modelValue",
    list.map((e) => ({ ...e })),
  );
};

const updateText = (idx, text) => {
  const next = normalizedEntries.value.map((e) => ({ ...e }));
  next[idx]._value = text;
  emitNext(next);
};

const updateLang = (idx, lang) => {
  const next = normalizedEntries.value.map((e) => ({ ...e }));
  next[idx][props.langKey] = lang;
  emitNext(next);
};

const setPreferred = (idx) => {
  const next = normalizedEntries.value.map((e, i) => ({
    ...e,
    [props.preferredKey]: i === idx,
  }));
  emitNext(next);
};

const addEntry = () => {
  const next = normalizedEntries.value.map((e) => ({ ...e }));
  const used = new Set(next.map((e) => e[props.langKey]));
  const nextLang = !used.has("en") ? "en" : !used.has("de") ? "de" : "fr";
  next.push({
    _value: "",
    [props.langKey]: nextLang,
    [props.preferredKey]: false,
  });
  emitNext(next);
};

const removeEntry = (idx) => {
  const next = normalizedEntries.value.map((e) => ({ ...e }));
  if (next.length <= 1) return;
  const wasPreferred = next[idx][props.preferredKey];
  next.splice(idx, 1);
  if (wasPreferred && next.length > 0) {
    next[0][props.preferredKey] = true;
  }
  emitNext(next);
};

// Last 3 reusable entries persisted strictly per module+field
const recentStorageKey = computed(() => {
  const rawKey = props.historyKey || `${props.langKey}_${props.label || "text"}`;
  return `hermes_recent_text_${String(rawKey).replace(/[^a-zA-Z0-9_-]/g, "_")}_v2`;
});

const loadRecentEntries = () => {
  try {
    const raw = localStorage.getItem(recentStorageKey.value);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.slice(0, 6) : [];
  } catch {
    return [];
  }
};

const recentEntries = ref(loadRecentEntries());

const visibleRecentEntries = computed(() => {
  const activeLang = String(props.currentLocale || fallbackLang.value || "de").toLowerCase();
  return recentEntries.value
    .filter((r) => String(r?.lang || "").toLowerCase() === activeLang)
    .slice(0, 3);
});

const recordRecentText = (text, lang) => {
  const trimmed = String(text || "").trim();
  if (trimmed.length < 4) return;
  const normalizedLang = String(lang || fallbackLang.value || "de").toLowerCase();
  const entry = { text: trimmed, lang: normalizedLang };
  const otherLangs = recentEntries.value.filter(
    (r) => r.lang !== normalizedLang,
  );
  const sameLangOthers = recentEntries.value
    .filter((r) => r.lang === normalizedLang && r.text !== trimmed)
    .slice(0, 2);
  const next = [entry, ...sameLangOthers, ...otherLangs].slice(0, 12);
  recentEntries.value = next;
  try {
    localStorage.setItem(recentStorageKey.value, JSON.stringify(next));
  } catch {}
};

// Auto-seed from loaded examples/templates across all languages
watch(
  normalizedEntries,
  (entries) => {
    if (!Array.isArray(entries)) return;
    entries.forEach((e) => {
      if (e && String(e._value || "").trim().length >= 4) {
        recordRecentText(e._value, e[props.langKey]);
      }
    });
  },
  { immediate: true, deep: true },
);

const applyRecentEntry = (rec) => {
  if (!rec || !rec.text) return;
  const next = normalizedEntries.value.map((e) => ({ ...e }));
  const recLang = String(rec.lang || fallbackLang.value || "de").toLowerCase();
  const emptySameLang = next.findIndex(
    (e) =>
      !String(e._value || "").trim() &&
      String(e[props.langKey] || "").toLowerCase() === recLang,
  );
  const anyEmpty = next.findIndex((e) => !String(e._value || "").trim());
  const existingSameLang = next.findIndex(
    (e) => String(e[props.langKey] || "").toLowerCase() === recLang,
  );
  if (emptySameLang >= 0) {
    next[emptySameLang]._value = rec.text;
  } else if (anyEmpty >= 0) {
    next[anyEmpty]._value = rec.text;
    next[anyEmpty][props.langKey] = recLang;
  } else if (existingSameLang >= 0) {
    next[existingSameLang]._value = rec.text;
  } else {
    next.push({
      _value: rec.text,
      [props.langKey]: recLang,
      [props.preferredKey]: false,
    });
  }
  emitNext(next);
};
</script>
