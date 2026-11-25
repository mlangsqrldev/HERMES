<template>
  <div
    class="col-span-full rounded-2xl border border-base-300 bg-base-200/35 overflow-hidden mb-4 transition-all"
  >
    <!-- Compact Collapsed Header Bar -->
    <div
      class="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-base-100/80"
    >
      <div class="flex items-center gap-2.5 min-w-0">
        <span
          class="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-base shrink-0"
        >
          🔗
        </span>
        <div class="min-w-0">
          <div class="flex flex-wrap items-center gap-2">
            <span class="font-semibold text-sm text-base-content">
              {{
                currentLocale === "de"
                  ? "Verknüpfungen & Beziehungen"
                  : "Relations & Cross-Links"
              }}
            </span>
            <span
              class="badge badge-xs font-mono"
              :class="
                count > 0
                  ? 'badge-primary badge-outline'
                  : missingRequired
                    ? 'badge-warning'
                    : 'badge-ghost'
              "
            >
              {{ count }}
              {{
                currentLocale === "de"
                  ? count === 1
                    ? "Link"
                    : "Links"
                  : count === 1
                    ? "link"
                    : "links"
              }}
            </span>
          </div>
          <p class="text-[11px] text-base-content/60 leading-snug mt-0.5">
            {{
              currentLocale === "de"
                ? "Tipp: Erfassen Sie erst alle Einträge in Ruhe — am Ende können Sie alles bequem in Schritt 5 (Grafischer Editor) verknüpfen."
                : "Tip: Enter all records first — at the end, link everything visually in Step 5 (Visual Relations Editor)."
            }}
          </p>
        </div>
      </div>

      <div class="flex flex-wrap items-center gap-2 shrink-0">
        <button
          v-if="openRelationsEditor"
          type="button"
          class="btn btn-xs sm:btn-sm btn-primary btn-outline gap-1.5"
          @click="openRelationsEditor()"
        >
          <span>🗺️</span>
          <span>
            {{
              currentLocale === "de"
                ? "Im Grafischen Editor verknüpfen →"
                : "Open Visual Editor →"
            }}
          </span>
        </button>

        <button
          type="button"
          class="btn btn-xs sm:btn-sm btn-ghost text-base-content/70 gap-1"
          @click="isExpanded = !isExpanded"
          :aria-expanded="isExpanded"
        >
          <span
            class="transition-transform inline-block text-[10px]"
            :class="isExpanded ? 'rotate-90' : ''"
          >
            ▶
          </span>
          <span>
            {{
              isExpanded
                ? currentLocale === "de"
                  ? "Expertenansicht ausblenden"
                  : "Hide advanced view"
                : currentLocale === "de"
                  ? "Expertenansicht / Externe Links"
                  : "Advanced / External Links"
            }}
          </span>
        </button>
      </div>
    </div>

    <!-- Expandable Slot holding the full inline *DcRelations component -->
    <div
      v-if="isExpanded"
      class="p-3 sm:p-4 border-t border-base-300 bg-base-100/60"
    >
      <slot />
    </div>
  </div>
</template>

<script setup>
import { ref, inject } from "vue";

defineProps({
  count: {
    type: Number,
    default: 0,
  },
  currentLocale: {
    type: String,
    default: "de",
  },
  missingRequired: {
    type: Boolean,
    default: false,
  },
});

const openRelationsEditor = inject("openRelationsEditor", null);
const isExpanded = ref(false);
</script>
