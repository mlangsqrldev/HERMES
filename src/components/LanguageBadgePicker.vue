<template>
  <div ref="rootRef" class="relative shrink-0 inline-block">
    <button
      type="button"
      class="btn btn-xs btn-ghost gap-1.5 px-2 h-7 min-h-0 border border-base-300 hover:border-primary/60 bg-base-200/50 hover:bg-base-200 shadow-2xs rounded-lg transition-all whitespace-nowrap flex-nowrap shrink-0"
      :title="titleText"
      :aria-expanded="isOpen"
      aria-haspopup="listbox"
      @click.stop="toggleOpen"
    >
      <FlagIcon :code="activeLang" size="xs" />
      <span class="text-[11px] font-bold uppercase tracking-wider font-mono">{{
        activeLang
      }}</span>
      <span class="text-[8px] opacity-40">▼</span>
    </button>
    <ul
      v-if="isOpen"
      role="listbox"
      class="absolute right-0 top-full flex flex-col gap-0.5 p-1.5 shadow-2xl bg-base-100 rounded-xl w-44 min-w-[11rem] max-w-none z-[200] border border-base-300 mt-1"
    >
      <li v-for="lang in availableLanguages" :key="lang.code" class="w-full">
        <button
          type="button"
          class="flex items-center justify-between w-full py-1.5 px-2.5 rounded-lg cursor-pointer whitespace-nowrap text-left"
          :class="
            activeLang === lang.code
              ? 'font-bold bg-primary text-primary-content'
              : 'hover:bg-base-200 text-base-content'
          "
          @click.stop="selectLang(lang.code)"
        >
          <div class="flex items-center gap-1.5">
            <FlagIcon :code="lang.code" size="xs" />
            <span class="text-xs">{{ lang.name }}</span>
          </div>
          <span class="text-[10px] font-mono uppercase opacity-70">{{
            lang.code
          }}</span>
        </button>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { computed, inject, onBeforeUnmount, onMounted, ref } from "vue";
import FlagIcon from "./FlagIcon.vue";

const props = defineProps({
  modelValue: {
    type: String,
    default: "",
  },
  defaultLanguage: {
    type: String,
    default: "",
  },
});

const emit = defineEmits(["update:modelValue", "change"]);

const injectedLocale = inject("currentLocale", ref("de"));
const defaultMetadataLanguage = inject("defaultMetadataLanguage", ref("de"));

const rootRef = ref(null);
const isOpen = ref(false);

const activeLang = computed(() => {
  return (
    props.modelValue ||
    props.defaultLanguage ||
    defaultMetadataLanguage.value ||
    injectedLocale.value ||
    "de"
  ).toLowerCase();
});

const availableLanguages = [
  { code: "de", name: "Deutsch" },
  { code: "en", name: "English" },
  { code: "fr", name: "Français" },
  { code: "it", name: "Italiano" },
  { code: "es", name: "Español" },
  { code: "el", name: "Ελληνικά" },
];

const titleText = computed(() => {
  return injectedLocale.value === "de"
    ? `Sprache (@lang="${activeLang.value}") ändern`
    : `Change language (@lang="${activeLang.value}")`;
});

const toggleOpen = () => {
  isOpen.value = !isOpen.value;
};

const selectLang = (code) => {
  emit("update:modelValue", code);
  emit("change", code);
  isOpen.value = false;
};

const handleDocumentClick = (e) => {
  if (isOpen.value && rootRef.value && !rootRef.value.contains(e.target)) {
    isOpen.value = false;
  }
};

const handleKeyDown = (e) => {
  if (isOpen.value && e.key === "Escape") {
    isOpen.value = false;
  }
};

onMounted(() => {
  document.addEventListener("mousedown", handleDocumentClick);
  document.addEventListener("keydown", handleKeyDown);
});

onBeforeUnmount(() => {
  document.removeEventListener("mousedown", handleDocumentClick);
  document.removeEventListener("keydown", handleKeyDown);
});
</script>
