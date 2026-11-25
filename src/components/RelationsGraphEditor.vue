<template>
  <div class="space-y-4 select-none">
    <!-- Top Info & Control Bar -->
    <div
      class="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-base-200/60 border border-base-300"
    >
      <div class="space-y-1 max-w-2xl">
        <div class="flex flex-wrap items-center gap-2">
          <h3 class="font-bold text-base flex items-center gap-2">
            <span>🗺️</span>
            <span>
              {{
                currentLocale === "de"
                  ? "Visuelle Verknüpfungstafel"
                  : "Visual Relations Board"
              }}
            </span>
          </h3>
          <span class="badge badge-sm badge-neutral font-mono">
            {{ health.totalEdges }}
            {{
              currentLocale === "de"
                ? health.totalEdges === 1
                  ? "Verbindung"
                  : "Verbindungen"
                : health.totalEdges === 1
                  ? "link"
                  : "links"
            }}
          </span>
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
            ✓
            {{
              currentLocale === "de"
                ? "Alle Digitalisate verknüpft"
                : "All resources linked"
            }}
          </span>
        </div>
        <p class="text-xs text-base-content/70 leading-relaxed">
          {{
            currentLocale === "de"
              ? "Ziehen Sie eine Karte auf eine andere (Drag & Drop) oder klicken Sie eine Karte an und nutzen Sie die „+ Verbinden“-Buttons. Beide Seiten werden automatisch CARARE-konform synchronisiert."
              : "Drag any card onto another card, or click a card and use the '+ Link' buttons. Both sides are automatically synchronized according to CARARE 2.0.6."
          }}
        </p>
      </div>

      <!-- Primary Actions -->
      <div class="flex flex-wrap items-center gap-2">
        <button
          type="button"
          class="btn btn-sm btn-primary gap-1.5 shadow-sm"
          :disabled="totalRecordsCount === 0"
          @click="runAutoMatch"
        >
          <span>⚡</span>
          <span>
            {{
              currentLocale === "de"
                ? "Auto-Verknüpfen"
                : "Auto-Match"
            }}
          </span>
        </button>

        <button
          type="button"
          class="btn btn-sm gap-1.5"
          :class="
            showLineLabels
              ? 'btn-neutral btn-outline bg-base-100'
              : 'btn-ghost border border-base-300 bg-base-100 opacity-70'
          "
          @click="showLineLabels = !showLineLabels"
          :title="
            currentLocale === 'de'
              ? 'Relationstyp direkt an den Verbindungslinien anzeigen'
              : 'Show relation type directly on connection lines'
          "
        >
          <span>🏷️</span>
          <span>
            {{
              currentLocale === "de" ? "Typen an Linien" : "Line labels"
            }}
          </span>
        </button>

        <button
          type="button"
          class="btn btn-sm gap-1.5"
          :class="
            showOnlyUnlinked
              ? 'btn-warning'
              : 'btn-outline border-base-300 bg-base-100'
          "
          @click="showOnlyUnlinked = !showOnlyUnlinked"
        >
          <span>⚠️</span>
          <span>
            {{
              currentLocale === "de"
                ? "Nur unverknüpfte"
                : "Unlinked only"
            }}
          </span>
          <span
            v-if="health.orphanCount > 0"
            class="badge badge-xs font-mono"
            :class="showOnlyUnlinked ? 'badge-neutral' : 'badge-warning'"
          >
            {{ health.orphanCount }}
          </span>
        </button>
      </div>
    </div>

    <!-- Auto-Match Feedback Toast -->
    <div
      v-if="statusBanner"
      class="alert py-2.5 px-4 text-xs flex items-center justify-between gap-3 rounded-xl"
      :class="
        statusBanner.type === 'success'
          ? 'alert-success'
          : statusBanner.type === 'warning'
            ? 'alert-warning'
            : 'alert-info'
      "
    >
      <span class="font-medium">{{ statusBanner.text }}</span>
      <button
        type="button"
        class="btn btn-xs btn-ghost btn-circle"
        @click="statusBanner = null"
      >
        ✕
      </button>
    </div>

    <!-- Unsaved Drafts Warning Banner -->
    <div
      v-if="unsavedDraftsCount > 0"
      class="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 rounded-xl bg-amber-500/12 border border-amber-500/35 text-xs"
    >
      <div class="flex items-center gap-2 text-amber-900 dark:text-amber-200">
        <span>📝</span>
        <span>
          {{
            currentLocale === "de"
              ? `Es gibt ${unsavedDraftsCount} noch nicht in die Projektliste übernommene(n) Entwurf/Entwürfe in den Formularen oben.`
              : `There ${unsavedDraftsCount === 1 ? "is" : "are"} ${unsavedDraftsCount} unsaved draft(s) in the forms above.`
          }}
        </span>
      </div>
      <button
        type="button"
        class="btn btn-xs btn-warning"
        @click="$emit('save-drafts')"
      >
        💾
        {{
          currentLocale === "de"
            ? "Entwürfe jetzt übernehmen"
            : "Save drafts now"
        }}
      </button>
    </div>

    <!-- Filter & Special-Link Mode Bar -->
    <div
      v-if="totalRecordsCount > 0"
      class="flex flex-wrap items-center justify-between gap-3 px-1"
    >
      <!-- Live Search -->
      <label
        class="input input-sm input-bordered flex items-center gap-2 w-full sm:w-72 bg-base-100"
      >
        <span class="opacity-60 text-xs">🔍</span>
        <input
          v-model="searchQuery"
          type="text"
          class="grow text-xs"
          :placeholder="
            currentLocale === 'de'
              ? 'Nach ID oder Titel filtern...'
              : 'Filter by ID or title...'
          "
        />
        <button
          v-if="searchQuery"
          type="button"
          class="btn btn-ghost btn-xs btn-circle"
          @click="searchQuery = ''"
        >
          ✕
        </button>
      </label>

      <!-- Legend + HA-to-HA link mode -->
      <div class="flex flex-wrap items-center gap-3 text-[11px]">
        <span class="flex items-center gap-1.5">
          <span class="w-3 h-0.5 rounded-full bg-emerald-500 inline-block"></span>
          <span class="opacity-75">{{
            currentLocale === "de"
              ? "Darstellung (isRepresentationOf)"
              : "Representation (isRepresentationOf)"
          }}</span>
        </span>
        <span class="flex items-center gap-1.5">
          <span class="w-3 h-0.5 rounded-full bg-violet-500 inline-block"></span>
          <span class="opacity-75">{{
            currentLocale === "de"
              ? "Derivat (isDerivativeOf)"
              : "Derivative (isDerivativeOf)"
          }}</span>
        </span>
        <span class="flex items-center gap-1.5">
          <span class="w-3 h-0.5 rounded-full bg-amber-500 inline-block"></span>
          <span class="opacity-75">{{
            currentLocale === "de"
              ? "Aktivität (wasDigitizedBy / hasCreated)"
              : "Activity (wasDigitizedBy / hasCreated)"
          }}</span>
        </span>

        <!-- Optional HA-to-HA Relation Mode -->
        <div
          v-if="heritageItems.length > 1"
          class="flex items-center gap-1 pl-2 border-l border-base-300"
        >
          <span class="opacity-60">{{
            currentLocale === "de" ? "HA↔HA:" : "HA↔HA:"
          }}</span>
          <select
            v-model="haToHaMode"
            class="select select-xs select-bordered bg-base-100 text-[11px]"
          >
            <option value="partOf">
              {{
                currentLocale === "de"
                  ? "Enthält Teil (hasPart)"
                  : "Contains Part (hasPart)"
              }}
            </option>
            <option value="replicaOf">
              {{
                currentLocale === "de"
                  ? "Abguss/Kopie (isReplicaOf)"
                  : "Replica Of (isReplicaOf)"
              }}
            </option>
          </select>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div
      v-if="totalRecordsCount === 0"
      class="rounded-2xl border-2 border-dashed border-base-300 bg-base-200/30 p-10 text-center space-y-3"
    >
      <div class="text-4xl">🗺️</div>
      <h4 class="font-bold text-base">
        {{
          currentLocale === "de"
            ? "Noch keine gespeicherten Datensätze zum Verknüpfen"
            : "No saved records to link yet"
        }}
      </h4>
      <p class="text-xs text-base-content/70 max-w-md mx-auto leading-relaxed">
        {{
          currentLocale === "de"
            ? "Erfassen und speichern Sie zuerst mindestens ein Kulturgut (Schritt 2), ein Digitalisat (Schritt 3) oder eine Aktivität (Schritt 4). Danach erscheinen alle Karten hier automatisch."
            : "First create and save at least one Heritage Asset (Step 2), Digital Resource (Step 3), or Activity (Step 4). All cards will appear here automatically."
        }}
      </p>
      <div class="flex flex-wrap justify-center gap-2 pt-2">
        <button
          type="button"
          class="btn btn-sm btn-outline"
          @click="$emit('jump-to-step', 'heritageAssetIdentification')"
        >
          🏛️ {{ currentLocale === "de" ? "Zu Kulturgut" : "Go to Heritage Asset" }}
        </button>
        <button
          type="button"
          class="btn btn-sm btn-outline"
          @click="$emit('jump-to-step', 'digitalResource')"
        >
          🧊 {{ currentLocale === "de" ? "Zu Digitalisat" : "Go to Digital Resource" }}
        </button>
        <button
          type="button"
          class="btn btn-sm btn-outline"
          @click="$emit('jump-to-step', 'activity')"
        >
          🎯 {{ currentLocale === "de" ? "Zu Aktivitäten" : "Go to Activities" }}
        </button>
      </div>
    </div>

    <!-- 3-Column Interactive Graph Board with SVG Bezier Overlay -->
    <div
      v-else
      ref="boardContainerRef"
      class="relative rounded-2xl border border-base-300 bg-base-200/30 p-3 sm:p-4 overflow-x-auto"
    >
      <!-- SVG Connections Layer -->
      <svg
        v-if="svgSize.width > 0 && svgSize.height > 0"
        class="pointer-events-none absolute inset-0 z-10 overflow-visible"
        :width="svgSize.width"
        :height="svgSize.height"
      >
        <defs>
          <marker
            id="hermes-arrow-rep"
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="5"
            markerHeight="5"
            orient="auto-start-reverse"
          >
            <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="#10b981" />
          </marker>
          <marker
            id="hermes-arrow-deriv"
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="5"
            markerHeight="5"
            orient="auto-start-reverse"
          >
            <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="#8b5cf6" />
          </marker>
          <marker
            id="hermes-arrow-act"
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="5"
            markerHeight="5"
            orient="auto-start-reverse"
          >
            <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="#f59e0b" />
          </marker>
          <marker
            id="hermes-arrow-ha"
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="5"
            markerHeight="5"
            orient="auto-start-reverse"
          >
            <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="#0ea5e9" />
          </marker>
        </defs>

        <path
          v-for="line in renderedLines"
          :key="line.id"
          :d="line.d"
          fill="none"
          :stroke="line.color"
          :stroke-width="line.highlighted ? 2.75 : 1.7"
          :stroke-dasharray="line.dashed ? '5 4' : undefined"
          :opacity="line.opacity"
          :marker-end="line.highlighted ? line.marker : undefined"
          class="transition-opacity duration-150"
        />
      </svg>

      <!-- SVG Relation-Type Pill Labels Layer (sits above cards, non-blocking) -->
      <svg
        v-if="svgSize.width > 0 && svgSize.height > 0 && visibleLineLabels.length > 0"
        class="pointer-events-none absolute inset-0 z-30 overflow-visible"
        :width="svgSize.width"
        :height="svgSize.height"
      >
        <g
          v-for="lbl in visibleLineLabels"
          :key="'lbl-' + lbl.id"
          :transform="`translate(${lbl.x}, ${lbl.y})`"
          :opacity="lbl.labelOpacity"
        >
          <rect
            :x="-lbl.width / 2"
            y="-13"
            :width="lbl.width"
            height="26"
            rx="7"
            class="fill-base-100"
            :stroke="lbl.color"
            :stroke-width="lbl.highlighted ? 1.8 : 1.1"
          />
          <text
            x="0"
            y="-2.5"
            text-anchor="middle"
            font-size="9"
            font-weight="700"
            :fill="lbl.color"
            style="font-family: system-ui, -apple-system, sans-serif;"
          >
            {{ currentLocale === "de" ? lbl.shortDe : lbl.shortEn }}
          </text>
          <text
            x="0"
            y="8.5"
            text-anchor="middle"
            font-size="8"
            class="fill-base-content"
            fill-opacity="0.72"
            style="font-family: ui-monospace, SFMono-Regular, Menlo, monospace;"
          >
            {{ lbl.carare }}
          </text>
        </g>
      </svg>

      <!-- 3 Columns Grid -->
      <div
        class="relative z-20 grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-24 min-w-[280px]"
      >
        <!-- COLUMN 1: HERITAGE ASSETS -->
        <div class="flex flex-col gap-2.5">
          <div
            class="flex items-center justify-between px-2 py-1.5 rounded-xl bg-base-100/90 border border-base-300"
          >
            <span class="font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
              <span>🏛️</span>
              <span>{{
                currentLocale === "de" ? "Kulturgüter" : "Heritage Assets"
              }}</span>
            </span>
            <span class="badge badge-xs badge-ghost font-mono">
              {{ filteredHeritageNodes.length }}/{{ heritageItems.length }}
            </span>
          </div>

          <div
            v-if="filteredHeritageNodes.length === 0"
            class="text-xs text-base-content/50 text-center py-6 px-3 rounded-xl border border-dashed border-base-300 bg-base-100/40"
          >
            {{
              heritageItems.length === 0
                ? currentLocale === "de"
                  ? "Keine Kulturgüter gespeichert"
                  : "No heritage assets saved"
                : currentLocale === "de"
                  ? "Kein Treffer für aktuellen Filter"
                  : "No matches for current filter"
            }}
          </div>

          <div
            v-for="node in filteredHeritageNodes"
            :key="node.key"
            :ref="(el) => setCardRef(node.key, el)"
            draggable="true"
            @dragstart="onDragStart(node, $event)"
            @dragend="onDragEnd"
            @dragover.prevent="onDragOver(node)"
            @dragleave="onDragLeave(node)"
            @drop.prevent="onDrop(node)"
            @mouseenter="hoveredNodeKey = node.key"
            @mouseleave="hoveredNodeKey = null"
            @click="selectNode(node)"
            class="group relative rounded-xl border-2 p-3 bg-base-100 cursor-pointer transition-all shadow-xs"
            :class="cardClass(node)"
          >
            <!-- Right connection port dot -->
            <span
              class="hidden lg:block absolute -right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-base-100 transition-transform"
              :class="
                isNodeHighlighted(node.key)
                  ? 'bg-emerald-500 scale-125'
                  : 'bg-base-300 group-hover:bg-primary'
              "
            ></span>

            <div class="flex items-start justify-between gap-2">
              <div class="min-w-0">
                <div class="flex items-center gap-1.5 flex-wrap">
                  <span class="font-mono text-xs font-bold text-primary truncate">
                    {{ node.id }}
                  </span>
                  <span
                    v-if="health.unlinkedAssets.has(node.id)"
                    class="badge badge-xs bg-amber-500/20 text-amber-800 dark:text-amber-200 border-amber-500/40"
                  >
                    ⚠️ {{ currentLocale === "de" ? "Unverknüpft" : "Unlinked" }}
                  </span>
                </div>
                <div
                  class="text-xs font-medium text-base-content/90 truncate mt-0.5"
                  :title="node.title"
                >
                  {{ node.title }}
                </div>
                <div
                  v-if="node.subtitle"
                  class="text-[10px] text-base-content/55 truncate mt-0.5"
                >
                  {{ node.subtitle }}
                </div>
              </div>

              <!-- Link Count Pill or Quick-Connect Button when another node is selected -->
              <div class="shrink-0 flex items-center gap-1">
                <button
                  v-if="canConnectToSelected(node)"
                  type="button"
                  class="btn btn-xs gap-1 font-mono text-[10px]"
                  :class="
                    isConnectedToSelected(node)
                      ? 'btn-success text-success-content'
                      : 'btn-primary btn-outline'
                  "
                  @click.stop="connectSelectedWith(node)"
                >
                  {{ getConnectButtonLabel(selectedNode, node) }}
                </button>
                <span
                  v-else
                  class="badge badge-xs font-mono"
                  :class="
                    node.edgeCount > 0 ? 'badge-success badge-outline' : 'badge-ghost'
                  "
                >
                  🔗 {{ node.edgeCount }}
                </span>
              </div>
            </div>

            <!-- Compact inline relation-type tags on card -->
            <div
              v-if="node.edges.length > 0"
              class="mt-2 pt-1.5 border-t border-base-200/80 flex flex-wrap gap-1"
            >
              <span
                v-for="edge in node.edges.slice(0, 3)"
                :key="edge.id"
                class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md border text-[10px] leading-tight max-w-full"
                :class="edgeBadgeClass(edge.type)"
                :title="getEdgeFullLabel(edge, node)"
              >
                <span class="font-mono font-semibold shrink-0">{{
                  getDirectionalCarareKey(edge, node)
                }}</span>
                <span class="opacity-65">→</span>
                <span class="font-mono truncate max-w-[95px]">{{
                  getOtherEndpointId(edge, node)
                }}</span>
              </span>
              <span
                v-if="node.edges.length > 3"
                class="badge badge-xs badge-ghost font-mono text-[10px]"
              >
                +{{ node.edges.length - 3 }}
              </span>
            </div>
          </div>
        </div>

        <!-- COLUMN 2: DIGITAL RESOURCES -->
        <div class="flex flex-col gap-2.5">
          <div
            class="flex items-center justify-between px-2 py-1.5 rounded-xl bg-base-100/90 border border-base-300"
          >
            <span class="font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
              <span>🧊</span>
              <span>{{
                currentLocale === "de"
                  ? "Digitalisate (3D / Medien)"
                  : "Digital Resources"
              }}</span>
            </span>
            <span class="badge badge-xs badge-ghost font-mono">
              {{ filteredDigitalNodes.length }}/{{ digitalItems.length }}
            </span>
          </div>

          <div
            v-if="filteredDigitalNodes.length === 0"
            class="text-xs text-base-content/50 text-center py-6 px-3 rounded-xl border border-dashed border-base-300 bg-base-100/40"
          >
            {{
              digitalItems.length === 0
                ? currentLocale === "de"
                  ? "Keine Digitalisate gespeichert"
                  : "No digital resources saved"
                : currentLocale === "de"
                  ? "Kein Treffer für aktuellen Filter"
                  : "No matches for current filter"
            }}
          </div>

          <div
            v-for="node in filteredDigitalNodes"
            :key="node.key"
            :ref="(el) => setCardRef(node.key, el)"
            draggable="true"
            @dragstart="onDragStart(node, $event)"
            @dragend="onDragEnd"
            @dragover.prevent="onDragOver(node)"
            @dragleave="onDragLeave(node)"
            @drop.prevent="onDrop(node)"
            @mouseenter="hoveredNodeKey = node.key"
            @mouseleave="hoveredNodeKey = null"
            @click="selectNode(node)"
            class="group relative rounded-xl border-2 p-3 bg-base-100 cursor-pointer transition-all shadow-xs"
            :class="[
              cardClass(node),
              node.isDerivative ? 'ml-5 border-l-4 border-l-violet-500/70' : '',
            ]"
          >
            <!-- Left & Right connection port dots -->
            <span
              class="hidden lg:block absolute -left-1.5 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-base-100 transition-transform"
              :class="
                isNodeHighlighted(node.key)
                  ? 'bg-emerald-500 scale-125'
                  : 'bg-base-300 group-hover:bg-primary'
              "
            ></span>
            <span
              class="hidden lg:block absolute -right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-base-100 transition-transform"
              :class="
                isNodeHighlighted(node.key)
                  ? 'bg-amber-500 scale-125'
                  : 'bg-base-300 group-hover:bg-secondary'
              "
            ></span>

            <div class="flex items-start justify-between gap-2">
              <div class="min-w-0">
                <div class="flex items-center gap-1.5 flex-wrap">
                  <span
                    v-if="node.isDerivative"
                    class="badge badge-xs bg-violet-500/15 text-violet-700 dark:text-violet-300 border-violet-500/30"
                  >
                    ↳ {{ currentLocale === "de" ? "Derivat" : "Deriv." }}
                  </span>
                  <span class="font-mono text-xs font-bold text-accent truncate">
                    {{ node.id }}
                  </span>
                  <span
                    v-if="health.unlinkedResources.has(node.id)"
                    class="badge badge-xs bg-amber-500/20 text-amber-800 dark:text-amber-200 border-amber-500/40"
                    :title="
                      currentLocale === 'de'
                        ? 'Pflichtfeld isRepresentationOf fehlt'
                        : 'Required isRepresentationOf missing'
                    "
                  >
                    ⚠️ {{ currentLocale === "de" ? "Kein Kulturgut" : "No Asset" }}
                  </span>
                </div>
                <div
                  class="text-xs font-medium text-base-content/90 truncate mt-0.5"
                  :title="node.title"
                >
                  {{ node.title }}
                </div>
                <div
                  v-if="node.subtitle"
                  class="text-[10px] text-base-content/55 truncate mt-0.5"
                >
                  {{ node.subtitle }}
                </div>
              </div>

              <div class="shrink-0 flex items-center gap-1">
                <button
                  v-if="canConnectToSelected(node)"
                  type="button"
                  class="btn btn-xs gap-1 font-mono text-[10px]"
                  :class="
                    isConnectedToSelected(node)
                      ? 'btn-success text-success-content'
                      : 'btn-primary btn-outline'
                  "
                  @click.stop="connectSelectedWith(node)"
                >
                  {{ getConnectButtonLabel(selectedNode, node) }}
                </button>
                <span
                  v-else
                  class="badge badge-xs font-mono"
                  :class="
                    node.edgeCount > 0 ? 'badge-success badge-outline' : 'badge-ghost'
                  "
                >
                  🔗 {{ node.edgeCount }}
                </span>
              </div>
            </div>

            <!-- Compact inline relation-type tags on card -->
            <div
              v-if="node.edges.length > 0"
              class="mt-2 pt-1.5 border-t border-base-200/80 flex flex-wrap gap-1"
            >
              <span
                v-for="edge in node.edges.slice(0, 3)"
                :key="edge.id"
                class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md border text-[10px] leading-tight max-w-full"
                :class="edgeBadgeClass(edge.type)"
                :title="getEdgeFullLabel(edge, node)"
              >
                <span class="font-mono font-semibold shrink-0">{{
                  getDirectionalCarareKey(edge, node)
                }}</span>
                <span class="opacity-65">→</span>
                <span class="font-mono truncate max-w-[95px]">{{
                  getOtherEndpointId(edge, node)
                }}</span>
              </span>
              <span
                v-if="node.edges.length > 3"
                class="badge badge-xs badge-ghost font-mono text-[10px]"
              >
                +{{ node.edges.length - 3 }}
              </span>
            </div>
          </div>
        </div>

        <!-- COLUMN 3: ACTIVITIES -->
        <div class="flex flex-col gap-2.5">
          <div
            class="flex items-center justify-between px-2 py-1.5 rounded-xl bg-base-100/90 border border-base-300"
          >
            <span class="font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
              <span>🎯</span>
              <span>{{
                currentLocale === "de" ? "Aktivitäten" : "Activities"
              }}</span>
            </span>
            <span class="badge badge-xs badge-ghost font-mono">
              {{ filteredActivityNodes.length }}/{{ activityItems.length }}
            </span>
          </div>

          <div
            v-if="filteredActivityNodes.length === 0"
            class="text-xs text-base-content/50 text-center py-6 px-3 rounded-xl border border-dashed border-base-300 bg-base-100/40"
          >
            {{
              activityItems.length === 0
                ? currentLocale === "de"
                  ? "Keine Aktivitäten gespeichert"
                  : "No activities saved"
                : currentLocale === "de"
                  ? "Kein Treffer für aktuellen Filter"
                  : "No matches for current filter"
            }}
          </div>

          <div
            v-for="node in filteredActivityNodes"
            :key="node.key"
            :ref="(el) => setCardRef(node.key, el)"
            draggable="true"
            @dragstart="onDragStart(node, $event)"
            @dragend="onDragEnd"
            @dragover.prevent="onDragOver(node)"
            @dragleave="onDragLeave(node)"
            @drop.prevent="onDrop(node)"
            @mouseenter="hoveredNodeKey = node.key"
            @mouseleave="hoveredNodeKey = null"
            @click="selectNode(node)"
            class="group relative rounded-xl border-2 p-3 bg-base-100 cursor-pointer transition-all shadow-xs"
            :class="cardClass(node)"
          >
            <!-- Left connection port dot -->
            <span
              class="hidden lg:block absolute -left-1.5 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-base-100 transition-transform"
              :class="
                isNodeHighlighted(node.key)
                  ? 'bg-amber-500 scale-125'
                  : 'bg-base-300 group-hover:bg-secondary'
              "
            ></span>

            <div class="flex items-start justify-between gap-2">
              <div class="min-w-0">
                <div class="flex items-center gap-1.5 flex-wrap">
                  <span class="font-mono text-xs font-bold text-secondary truncate">
                    {{ node.id }}
                  </span>
                  <span
                    v-if="health.unlinkedActivities.has(node.id)"
                    class="badge badge-xs badge-ghost opacity-70"
                  >
                    {{ currentLocale === "de" ? "Unverknüpft" : "Unlinked" }}
                  </span>
                </div>
                <div
                  class="text-xs font-medium text-base-content/90 truncate mt-0.5"
                  :title="node.title"
                >
                  {{ node.title }}
                </div>
                <div
                  v-if="node.subtitle"
                  class="text-[10px] text-base-content/55 truncate mt-0.5"
                >
                  {{ node.subtitle }}
                </div>
              </div>

              <div class="shrink-0 flex items-center gap-1">
                <button
                  v-if="canConnectToSelected(node)"
                  type="button"
                  class="btn btn-xs gap-1 font-mono text-[10px]"
                  :class="
                    isConnectedToSelected(node)
                      ? 'btn-success text-success-content'
                      : 'btn-secondary btn-outline'
                  "
                  @click.stop="connectSelectedWith(node)"
                >
                  {{ getConnectButtonLabel(selectedNode, node) }}
                </button>
                <span
                  v-else
                  class="badge badge-xs font-mono"
                  :class="
                    node.edgeCount > 0 ? 'badge-success badge-outline' : 'badge-ghost'
                  "
                >
                  🔗 {{ node.edgeCount }}
                </span>
              </div>
            </div>

            <!-- Compact inline relation-type tags on card -->
            <div
              v-if="node.edges.length > 0"
              class="mt-2 pt-1.5 border-t border-base-200/80 flex flex-wrap gap-1"
            >
              <span
                v-for="edge in node.edges.slice(0, 3)"
                :key="edge.id"
                class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md border text-[10px] leading-tight max-w-full"
                :class="edgeBadgeClass(edge.type)"
                :title="getEdgeFullLabel(edge, node)"
              >
                <span class="font-mono font-semibold shrink-0">{{
                  getDirectionalCarareKey(edge, node)
                }}</span>
                <span class="opacity-65">→</span>
                <span class="font-mono truncate max-w-[95px]">{{
                  getOtherEndpointId(edge, node)
                }}</span>
              </span>
              <span
                v-if="node.edges.length > 3"
                class="badge badge-xs badge-ghost font-mono text-[10px]"
              >
                +{{ node.edges.length - 3 }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Selected Node Inspector Bar -->
    <div
      v-if="selectedNode"
      class="rounded-2xl border-2 border-primary/30 bg-base-100 p-4 shadow-sm space-y-3"
    >
      <div class="flex flex-wrap items-center justify-between gap-2">
        <div class="flex items-center gap-2 min-w-0">
          <span class="text-lg">
            {{
              selectedNode.kind === "ha"
                ? "🏛️"
                : selectedNode.kind === "dr"
                  ? "🧊"
                  : "🎯"
            }}
          </span>
          <div class="min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="font-bold text-sm truncate">{{
                selectedNode.title
              }}</span>
              <span class="badge badge-xs badge-neutral font-mono">{{
                selectedNode.id
              }}</span>
            </div>
            <p class="text-[11px] text-base-content/60">
              {{
                currentLocale === "de"
                  ? "Klicken Sie oben bei einem Ziel auf „+ Verbinden“ oder ziehen Sie Karten aufeinander."
                  : "Click '+ Link' on any compatible card above or drag cards onto each other."
              }}
            </p>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <button
            type="button"
            class="btn btn-xs btn-ghost"
            @click="$emit('edit-record', { kind: selectedNode.kind, index: selectedNode.index })"
          >
            ✏️
            {{
              currentLocale === "de" ? "Datensatz bearbeiten" : "Edit record"
            }}
          </button>
          <button
            type="button"
            class="btn btn-xs btn-ghost btn-circle"
            @click="selectedNodeKey = null"
            :title="currentLocale === 'de' ? 'Auswahl aufheben' : 'Deselect'"
          >
            ✕
          </button>
        </div>
      </div>

      <!-- Active links of the selected node -->
      <div class="flex flex-wrap items-center gap-2 pt-1 border-t border-base-200">
        <span class="text-[11px] font-semibold text-base-content/65">
          {{
            currentLocale === "de"
              ? "Aktive Verknüpfungen:"
              : "Active connections:"
          }}
        </span>

        <span
          v-if="selectedNodeEdges.length === 0"
          class="text-xs italic text-base-content/50"
        >
          {{
            currentLocale === "de"
              ? "Noch keine Verbindungen vorhanden."
              : "No connections yet."
          }}
        </span>

        <div
          v-for="edge in selectedNodeEdges"
          :key="edge.id"
          class="badge badge-md gap-1.5 py-2.5 px-2.5 border"
          :class="edgeBadgeClass(edge.type)"
        >
          <span class="text-[11px] font-semibold">
            {{
              currentLocale === "de"
                ? getEdgeTypeMeta(edge.type).shortDe
                : getEdgeTypeMeta(edge.type).shortEn
            }}
          </span>
          <span class="font-mono text-[10px] opacity-80">
            ({{ getDirectionalCarareKey(edge, selectedNode) }})
          </span>
          <span class="opacity-60">→</span>
          <span class="font-mono text-[11px] font-bold">
            {{ getOtherEndpointLabel(edge, selectedNode) }}
          </span>
          <button
            type="button"
            class="hover:text-error font-bold ml-0.5 cursor-pointer"
            @click="unlinkEdge(edge)"
            :title="
              currentLocale === 'de'
                ? 'Verbindung entfernen'
                : 'Remove connection'
            "
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import {
  ref,
  computed,
  watch,
  nextTick,
  onMounted,
  onBeforeUnmount,
} from "vue";
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
  toggleAssetReplicaLink,
  autoMatchRelations,
} from "../utils/relationsHelper.js";

const props = defineProps({
  heritageItems: {
    type: Array,
    default: () => [],
  },
  digitalItems: {
    type: Array,
    default: () => [],
  },
  activityItems: {
    type: Array,
    default: () => [],
  },
  collectionForm: {
    type: Object,
    default: null,
  },
  unsavedDraftsCount: {
    type: Number,
    default: 0,
  },
  currentLocale: {
    type: String,
    default: "de",
  },
});

const emit = defineEmits([
  "relations-changed",
  "save-drafts",
  "jump-to-step",
  "edit-record",
]);

const searchQuery = ref("");
const showOnlyUnlinked = ref(false);
const showLineLabels = ref(true);
const selectedNodeKey = ref(null);
const hoveredNodeKey = ref(null);
const draggingNode = ref(null);
const dragOverKey = ref(null);
const haToHaMode = ref("partOf");
const statusBanner = ref(null);
const revision = ref(0);

// SVG layout refs
const boardContainerRef = ref(null);
const cardElements = new Map();
const svgSize = ref({ width: 0, height: 0 });
const renderedLines = ref([]);
let resizeObserver = null;
let rafId = null;

const setCardRef = (key, el) => {
  if (el) {
    cardElements.set(key, el);
  } else {
    cardElements.delete(key);
  }
};

const totalRecordsCount = computed(
  () =>
    (props.heritageItems?.length || 0) +
    (props.digitalItems?.length || 0) +
    (props.activityItems?.length || 0),
);

const health = computed(() => {
  // Touch revision so mutations inside plain objects always recompute
  void revision.value;
  return analyzeRelationsHealth(
    props.heritageItems,
    props.digitalItems,
    props.activityItems,
  );
});

const edgesByNodeKey = computed(() => {
  const map = {};
  for (const e of health.value.edges) {
    const k1 = `${e.fromKind}:${e.fromId}`;
    const k2 = `${e.toKind}:${e.toId}`;
    if (!map[k1]) map[k1] = [];
    if (!map[k2]) map[k2] = [];
    map[k1].push(e);
    map[k2].push(e);
  }
  return map;
});

const heritageNodes = computed(() => {
  void revision.value;
  return (props.heritageItems || [])
    .map((item, index) => {
      const id = getRecordId(item);
      if (!id) return null;
      const key = `ha:${id}`;
      const inv = item["repositoryLocation.inventoryNumber"] || "";
      const nodeEdges = edgesByNodeKey.value[key] || [];
      return {
        key,
        kind: "ha",
        id,
        index,
        item,
        title: getRecordTitle(item, id),
        subtitle: inv ? `Inv. ${inv}` : "",
        edges: nodeEdges,
        edgeCount: nodeEdges.length,
      };
    })
    .filter(Boolean);
});

const digitalNodes = computed(() => {
  void revision.value;
  const raw = (props.digitalItems || [])
    .map((item, index) => {
      const id = getRecordId(item);
      if (!id) return null;
      const key = `dr:${id}`;
      const masterIds = getLinkValues(item, "isDerivativeOf");
      const fmt = Array.isArray(item.format)
        ? item.format.filter(Boolean).join(", ")
        : typeof item.format === "string"
          ? item.format
          : "";
      const nodeEdges = edgesByNodeKey.value[key] || [];
      return {
        key,
        kind: "dr",
        id,
        index,
        item,
        title: getRecordTitle(item, id),
        subtitle: fmt,
        parentMasterId: masterIds[0] || "",
        isDerivative: masterIds.length > 0,
        edges: nodeEdges,
        edgeCount: nodeEdges.length,
      };
    })
    .filter(Boolean);

  // Order so derivatives appear cleanly underneath their Master DR
  const byId = new Map(raw.map((n) => [n.id, n]));
  const childrenByMaster = new Map();
  const roots = [];

  for (const node of raw) {
    if (node.parentMasterId && byId.has(node.parentMasterId) && node.parentMasterId !== node.id) {
      if (!childrenByMaster.has(node.parentMasterId)) {
        childrenByMaster.set(node.parentMasterId, []);
      }
      childrenByMaster.get(node.parentMasterId).push(node);
    } else {
      roots.push(node);
    }
  }

  const ordered = [];
  const visited = new Set();
  const pushWithChildren = (node) => {
    if (visited.has(node.id)) return;
    visited.add(node.id);
    ordered.push(node);
    const children = childrenByMaster.get(node.id) || [];
    for (const child of children) {
      pushWithChildren(child);
    }
  };
  for (const root of roots) pushWithChildren(root);
  for (const node of raw) pushWithChildren(node);
  return ordered;
});

const activityNodes = computed(() => {
  void revision.value;
  return (props.activityItems || [])
    .map((item, index) => {
      const id = getRecordId(item);
      if (!id) return null;
      const key = `act:${id}`;
      const period =
        Array.isArray(item.temporal) && item.temporal[0]
          ? item.temporal[0].periodName ||
            item.temporal[0].startDate ||
            ""
          : "";
      const nodeEdges = edgesByNodeKey.value[key] || [];
      return {
        key,
        kind: "act",
        id,
        index,
        item,
        title: getRecordTitle(item, id),
        subtitle: period,
        edges: nodeEdges,
        edgeCount: nodeEdges.length,
      };
    })
    .filter(Boolean);
});

const allNodesMap = computed(() => {
  const m = new Map();
  for (const n of heritageNodes.value) m.set(n.key, n);
  for (const n of digitalNodes.value) m.set(n.key, n);
  for (const n of activityNodes.value) m.set(n.key, n);
  return m;
});

const matchesFilter = (node, unlinkedSet) => {
  if (showOnlyUnlinked.value && !unlinkedSet.has(node.id)) {
    // Keep selected node visible so user can still connect it!
    if (selectedNodeKey.value !== node.key) return false;
  }
  const q = searchQuery.value.trim().toLowerCase();
  if (!q) return true;
  return (
    node.id.toLowerCase().includes(q) ||
    node.title.toLowerCase().includes(q) ||
    (node.subtitle && node.subtitle.toLowerCase().includes(q))
  );
};

const filteredHeritageNodes = computed(() =>
  heritageNodes.value.filter((n) => matchesFilter(n, health.value.unlinkedAssets)),
);

const filteredDigitalNodes = computed(() =>
  digitalNodes.value.filter((n) =>
    matchesFilter(n, health.value.unlinkedResources),
  ),
);

const filteredActivityNodes = computed(() =>
  activityNodes.value.filter((n) =>
    matchesFilter(n, health.value.unlinkedActivities),
  ),
);

const selectedNode = computed(() =>
  selectedNodeKey.value ? allNodesMap.value.get(selectedNodeKey.value) || null : null,
);

const activeFocusKey = computed(
  () => hoveredNodeKey.value || selectedNodeKey.value,
);

const selectedNodeEdges = computed(() => {
  if (!selectedNode.value) return [];
  const k = selectedNode.value.key;
  return health.value.edges.filter(
    (e) => `${e.fromKind}:${e.fromId}` === k || `${e.toKind}:${e.toId}` === k,
  );
});

const selectNode = (node) => {
  if (selectedNodeKey.value === node.key) {
    selectedNodeKey.value = null;
  } else {
    selectedNodeKey.value = node.key;
  }
};

const isNodeHighlighted = (key) => {
  if (!activeFocusKey.value) return false;
  if (activeFocusKey.value === key) return true;
  return health.value.edges.some(
    (e) =>
      (`${e.fromKind}:${e.fromId}` === activeFocusKey.value &&
        `${e.toKind}:${e.toId}` === key) ||
      (`${e.toKind}:${e.toId}` === activeFocusKey.value &&
        `${e.fromKind}:${e.fromId}` === key),
  );
};

const cardClass = (node) => {
  if (dragOverKey.value === node.key) {
    return "border-primary bg-primary/10 scale-[1.01] shadow-md";
  }
  if (selectedNodeKey.value === node.key) {
    return "border-primary ring-2 ring-primary/25 shadow-md";
  }
  if (activeFocusKey.value && isNodeHighlighted(node.key)) {
    return "border-emerald-500/70 bg-emerald-500/5";
  }
  if (
    (node.kind === "dr" && health.value.unlinkedResources.has(node.id)) ||
    (node.kind === "ha" && health.value.unlinkedAssets.has(node.id))
  ) {
    return "border-amber-400/60 hover:border-primary/60";
  }
  return "border-base-300 hover:border-primary/50";
};

const canConnectPair = (a, b) => {
  if (!a || !b || a.key === b.key) return false;
  // Disallow Activity <-> Activity in the visual board for simplicity (still available in advanced view)
  if (a.kind === "act" && b.kind === "act") return false;
  return true;
};

const canConnectToSelected = (node) => {
  return selectedNode.value && canConnectPair(selectedNode.value, node);
};

const isConnectedPair = (a, b) => {
  if (!a || !b) return false;
  return health.value.edges.some(
    (e) =>
      (`${e.fromKind}:${e.fromId}` === a.key &&
        `${e.toKind}:${e.toId}` === b.key) ||
      (`${e.fromKind}:${e.fromId}` === b.key &&
        `${e.toKind}:${e.toId}` === a.key),
  );
};

const isConnectedToSelected = (node) => {
  return selectedNode.value ? isConnectedPair(selectedNode.value, node) : false;
};

const applyPairToggle = (source, target) => {
  if (!canConnectPair(source, target)) return;

  let result = { changed: false, action: "none" };

  if (source.kind === "ha" && target.kind === "dr") {
    result = toggleAssetResourceLink(source.item, target.item);
  } else if (source.kind === "dr" && target.kind === "ha") {
    result = toggleAssetResourceLink(target.item, source.item);
  } else if (source.kind === "dr" && target.kind === "dr") {
    // Source = Master, Target = Derivative (unless reversed link already exists)
    const reversed = health.value.edges.some(
      (e) =>
        e.type === "derivative" &&
        e.fromId === target.id &&
        e.toId === source.id,
    );
    if (reversed) {
      result = toggleMasterDerivativeLink(target.item, source.item, false);
    } else {
      result = toggleMasterDerivativeLink(source.item, target.item);
    }
  } else if (source.kind === "ha" && target.kind === "act") {
    result = toggleAssetActivityLink(source.item, target.item);
  } else if (source.kind === "act" && target.kind === "ha") {
    result = toggleAssetActivityLink(target.item, source.item);
  } else if (source.kind === "dr" && target.kind === "act") {
    result = toggleResourceActivityLink(source.item, target.item);
  } else if (source.kind === "act" && target.kind === "dr") {
    result = toggleResourceActivityLink(target.item, source.item);
  } else if (source.kind === "ha" && target.kind === "ha") {
    if (haToHaMode.value === "replicaOf") {
      result = toggleAssetReplicaLink(source.item, target.item);
    } else {
      result = toggleAssetPartLink(source.item, target.item);
    }
  }

  if (result.changed) {
    revision.value++;
    emit("relations-changed");
    scheduleLineRecalc();
  }
};

const connectSelectedWith = (targetNode) => {
  if (!selectedNode.value) return;
  applyPairToggle(selectedNode.value, targetNode);
};

const unlinkEdge = (edge) => {
  const fromNode = allNodesMap.value.get(`${edge.fromKind}:${edge.fromId}`);
  const toNode = allNodesMap.value.get(`${edge.toKind}:${edge.toId}`);
  if (!fromNode || !toNode) return;

  if (edge.type === "representation") {
    toggleAssetResourceLink(fromNode.item, toNode.item, false);
  } else if (edge.type === "derivative") {
    toggleMasterDerivativeLink(fromNode.item, toNode.item, false);
  } else if (edge.type === "digitizedAsset") {
    toggleAssetActivityLink(fromNode.item, toNode.item, false);
  } else if (edge.type === "createdResource") {
    toggleResourceActivityLink(fromNode.item, toNode.item, false);
  } else if (edge.type === "partOf") {
    toggleAssetPartLink(fromNode.item, toNode.item, false);
  } else if (edge.type === "replicaOf") {
    toggleAssetReplicaLink(fromNode.item, toNode.item, false);
  }

  revision.value++;
  emit("relations-changed");
  scheduleLineRecalc();
};

const runAutoMatch = () => {
  const res = autoMatchRelations(
    props.heritageItems,
    props.digitalItems,
    props.activityItems,
    props.collectionForm,
  );
  revision.value++;
  emit("relations-changed");
  scheduleLineRecalc();

  if (res.createdCount > 0) {
    statusBanner.value = {
      type: "success",
      text:
        props.currentLocale === "de"
          ? `⚡ Auto-Verknüpfen erfolgreich: ${res.createdCount} neue Verknüpfung(en) gesetzt (${res.assetResourceLinks} Kulturgut↔Digitalisat, ${res.masterDerivativeLinks} Master↔Derivat, ${res.activityLinks} Aktivität).`
          : `⚡ Auto-Match complete: ${res.createdCount} new link(s) created (${res.assetResourceLinks} asset↔resource, ${res.masterDerivativeLinks} master↔derivative, ${res.activityLinks} activity).`,
    };
  } else {
    statusBanner.value = {
      type: "info",
      text:
        props.currentLocale === "de"
          ? "Alle eindeutig zuordenbaren Datensätze sind bereits verknüpft. Verbleibende Karten können per Drag & Drop oder Klick verbunden werden."
          : "All unambiguously matchable records are already linked. Connect remaining cards via drag & drop or click.",
    };
  }
};

// Drag & Drop handlers
const onDragStart = (node, event) => {
  draggingNode.value = node;
  selectedNodeKey.value = node.key;
  if (event?.dataTransfer) {
    event.dataTransfer.effectAllowed = "link";
    event.dataTransfer.setData("text/plain", node.key);
  }
};

const onDragOver = (node) => {
  if (draggingNode.value && canConnectPair(draggingNode.value, node)) {
    dragOverKey.value = node.key;
  }
};

const onDragLeave = (node) => {
  if (dragOverKey.value === node.key) {
    dragOverKey.value = null;
  }
};

const onDrop = (targetNode) => {
  if (draggingNode.value && canConnectPair(draggingNode.value, targetNode)) {
    applyPairToggle(draggingNode.value, targetNode);
  }
  draggingNode.value = null;
  dragOverKey.value = null;
};

const onDragEnd = () => {
  draggingNode.value = null;
  dragOverKey.value = null;
};

const edgeBadgeClass = (type) => {
  if (type === "representation")
    return "bg-emerald-500/15 text-emerald-800 dark:text-emerald-200 border-emerald-500/35";
  if (type === "derivative")
    return "bg-violet-500/15 text-violet-800 dark:text-violet-200 border-violet-500/35";
  if (type === "digitizedAsset" || type === "createdResource")
    return "bg-amber-500/15 text-amber-800 dark:text-amber-200 border-amber-500/35";
  return "bg-sky-500/15 text-sky-800 dark:text-sky-200 border-sky-500/35";
};

const EDGE_TYPE_META = {
  representation: {
    shortDe: "Darstellung",
    shortEn: "Representation",
    carare: "isRepresentationOf",
    width: 106,
  },
  derivative: {
    shortDe: "Derivat",
    shortEn: "Derivative",
    carare: "isDerivativeOf",
    width: 88,
  },
  digitizedAsset: {
    shortDe: "Digitalisiert",
    shortEn: "Digitized",
    carare: "wasDigitizedBy",
    width: 92,
  },
  createdResource: {
    shortDe: "Erstellt",
    shortEn: "Created",
    carare: "hasCreated",
    width: 78,
  },
  partOf: {
    shortDe: "Enthält Teil",
    shortEn: "Has Part",
    carare: "hasPart / isPartOf",
    width: 100,
  },
  replicaOf: {
    shortDe: "Abguss / Kopie",
    shortEn: "Replica Of",
    carare: "isReplicaOf",
    width: 88,
  },
};

const getEdgeTypeMeta = (type) => {
  return (
    EDGE_TYPE_META[type] || {
      shortDe: "Beziehung",
      shortEn: "Relation",
      carare: "dcRelation",
      width: 86,
    }
  );
};

const getDirectionalCarareKey = (edge, node) => {
  const isFrom = `${edge.fromKind}:${edge.fromId}` === node.key;
  if (edge.type === "representation") {
    return isFrom ? "hasRepresentation" : "isRepresentationOf";
  }
  if (edge.type === "derivative") {
    return isFrom ? "hasDerivative" : "isDerivativeOf";
  }
  if (edge.type === "digitizedAsset") {
    return isFrom ? "wasDigitizedBy" : "wasPresentAt";
  }
  if (edge.type === "createdResource") {
    return isFrom ? "createdBy" : "hasCreated";
  }
  if (edge.type === "partOf") {
    return isFrom ? "hasPart" : "isPartOf";
  }
  if (edge.type === "replicaOf") {
    return isFrom ? "isReplicaOf" : "hasReplica";
  }
  return "dcRelation";
};

const getOtherEndpointId = (edge, node) => {
  const isFrom = `${edge.fromKind}:${edge.fromId}` === node.key;
  return isFrom ? edge.toId : edge.fromId;
};

const getEdgeFullLabel = (edge, node) => {
  const meta = getEdgeTypeMeta(edge.type);
  const key = getDirectionalCarareKey(edge, node);
  const label = props.currentLocale === "de" ? meta.shortDe : meta.shortEn;
  return `${label} (${key}) → ${getOtherEndpointLabel(edge, node)}`;
};

const getConnectButtonLabel = (source, target) => {
  if (!source || !target) return "";
  const linked = isConnectedPair(source, target);
  let relKey = "";
  if (
    (source.kind === "ha" && target.kind === "dr") ||
    (source.kind === "dr" && target.kind === "ha")
  ) {
    relKey = "isRepresentationOf";
  } else if (source.kind === "dr" && target.kind === "dr") {
    relKey = "isDerivativeOf";
  } else if (
    (source.kind === "ha" && target.kind === "act") ||
    (source.kind === "act" && target.kind === "ha")
  ) {
    relKey = "wasDigitizedBy";
  } else if (
    (source.kind === "dr" && target.kind === "act") ||
    (source.kind === "act" && target.kind === "dr")
  ) {
    relKey = "hasCreated";
  } else if (source.kind === "ha" && target.kind === "ha") {
    relKey = haToHaMode.value === "replicaOf" ? "isReplicaOf" : "hasPart";
  }
  return linked ? `✓ ${relKey}` : `+ ${relKey}`;
};

const getOtherEndpointLabel = (edge, node) => {
  const isFrom = `${edge.fromKind}:${edge.fromId}` === node.key;
  const otherKey = isFrom
    ? `${edge.toKind}:${edge.toId}`
    : `${edge.fromKind}:${edge.fromId}`;
  const other = allNodesMap.value.get(otherKey);
  if (!other) return isFrom ? edge.toId : edge.fromId;
  return other.title !== other.id ? `${other.id} (${other.title})` : other.id;
};

const visibleLineLabels = computed(() => {
  if (!showLineLabels.value) return [];
  const focus = activeFocusKey.value;
  const lines = renderedLines.value || [];
  // For focused state: show labels for all highlighted edges cleanly.
  // Without focus: show all labels up to 16 edges so small/medium boards show every type immediately.
  if (focus) {
    return lines.filter((l) => l.highlighted);
  }
  if (lines.length <= 16) {
    return lines;
  }
  return [];
});

// SVG Bezier calculation
const recalculateLines = () => {
  const container = boardContainerRef.value;
  if (!container) {
    renderedLines.value = [];
    return;
  }

  const cRect = container.getBoundingClientRect();
  svgSize.value = {
    width: container.scrollWidth,
    height: container.scrollHeight,
  };

  // On narrow single-column screens, skip overlapping SVG lines (inspector & card badges remain full-featured)
  if (cRect.width < 760) {
    renderedLines.value = [];
    return;
  }

  const focus = activeFocusKey.value;
  const lines = [];
  const placedLabels = [];

  for (const edge of health.value.edges) {
    const k1 = `${edge.fromKind}:${edge.fromId}`;
    const k2 = `${edge.toKind}:${edge.toId}`;
    const el1 = cardElements.get(k1);
    const el2 = cardElements.get(k2);
    if (!el1 || !el2) continue;

    const r1 = el1.getBoundingClientRect();
    const r2 = el2.getBoundingClientRect();

    const scrollLeft = container.scrollLeft || 0;
    const scrollTop = container.scrollTop || 0;

    const sameColumn = Math.abs(r1.left - r2.left) < 80;
    let d = "";
    let lx = 0;
    let ly = 0;

    if (sameColumn) {
      // Neat side-arc along the left edge for DR->DR (derivative) or HA->HA (part/replica)
      const x1 = r1.left - cRect.left + scrollLeft;
      const y1 = r1.top - cRect.top + scrollTop + r1.height / 2;
      const x2 = r2.left - cRect.left + scrollLeft;
      const y2 = r2.top - cRect.top + scrollTop + r2.height / 2;
      const bulge = Math.min(38, Math.max(22, Math.abs(y2 - y1) * 0.25));
      const c1x = x1 - bulge;
      const c2x = x2 - bulge;
      d = `M ${x1} ${y1} C ${c1x} ${y1}, ${c2x} ${y2}, ${x2} ${y2}`;
      lx = 0.125 * x1 + 0.375 * c1x + 0.375 * c2x + 0.125 * x2;
      ly = 0.5 * (y1 + y2);
    } else {
      const leftToRight = r1.left < r2.left;
      const x1 =
        (leftToRight ? r1.right : r1.left) - cRect.left + scrollLeft;
      const y1 = r1.top - cRect.top + scrollTop + r1.height / 2;
      const x2 =
        (leftToRight ? r2.left : r2.right) - cRect.left + scrollLeft;
      const y2 = r2.top - cRect.top + scrollTop + r2.height / 2;
      const dx = Math.abs(x2 - x1);
      const cpOffset = Math.max(40, dx * 0.45);
      const c1x = leftToRight ? x1 + cpOffset : x1 - cpOffset;
      const c2x = leftToRight ? x2 - cpOffset : x2 + cpOffset;

      // For HA -> ACT (spanning across middle column), bow upward so label sits cleanly above middle cards
      if (edge.type === "digitizedAsset") {
        const lift = -26;
        d = `M ${x1} ${y1} C ${c1x} ${y1 + lift}, ${c2x} ${y2 + lift}, ${x2} ${y2}`;
        lx = 0.125 * x1 + 0.375 * c1x + 0.375 * c2x + 0.125 * x2;
        ly =
          0.125 * y1 +
          0.375 * (y1 + lift) +
          0.375 * (y2 + lift) +
          0.125 * y2;
      } else {
        d = `M ${x1} ${y1} C ${c1x} ${y1}, ${c2x} ${y2}, ${x2} ${y2}`;
        lx = 0.125 * x1 + 0.375 * c1x + 0.375 * c2x + 0.125 * x2;
        ly = 0.5 * (y1 + y2);
      }
    }

    // Light collision-avoidance stagger if two line labels land right on top of each other
    for (let attempt = 0; attempt < 5; attempt++) {
      const collides = placedLabels.some(
        (p) => Math.abs(p.x - lx) < 76 && Math.abs(p.y - ly) < 28,
      );
      if (!collides) break;
      ly += attempt % 2 === 0 ? 28 : -28;
    }
    placedLabels.push({ x: lx, y: ly });

    const isFocused = Boolean(focus && (k1 === focus || k2 === focus));
    const meta = getEdgeTypeMeta(edge.type);
    const color =
      edge.type === "representation"
        ? "#10b981"
        : edge.type === "derivative"
          ? "#8b5cf6"
          : edge.type === "digitizedAsset" || edge.type === "createdResource"
            ? "#f59e0b"
            : "#0ea5e9";
    const marker =
      edge.type === "representation"
        ? "url(#hermes-arrow-rep)"
        : edge.type === "derivative"
          ? "url(#hermes-arrow-deriv)"
          : edge.type === "digitizedAsset" || edge.type === "createdResource"
            ? "url(#hermes-arrow-act)"
            : "url(#hermes-arrow-ha)";

    lines.push({
      id: edge.id,
      d,
      x: lx,
      y: ly,
      width: meta.width,
      shortDe: meta.shortDe,
      shortEn: meta.shortEn,
      carare: meta.carare,
      color,
      marker,
      dashed: edge.type === "digitizedAsset" || edge.type === "replicaOf",
      highlighted: isFocused,
      opacity: !focus ? 0.42 : isFocused ? 0.95 : 0.08,
      labelOpacity: !focus ? 0.92 : isFocused ? 1 : 0,
    });
  }

  // Draw highlighted lines last so they sit on top
  lines.sort((a, b) => Number(a.highlighted) - Number(b.highlighted));
  renderedLines.value = lines;
};

const scheduleLineRecalc = () => {
  if (rafId !== null) cancelAnimationFrame(rafId);
  rafId = requestAnimationFrame(() => {
    rafId = null;
    nextTick(recalculateLines);
  });
};

watch(
  [
    () => props.heritageItems?.length,
    () => props.digitalItems?.length,
    () => props.activityItems?.length,
    searchQuery,
    showOnlyUnlinked,
    showLineLabels,
    selectedNodeKey,
    hoveredNodeKey,
    revision,
  ],
  () => {
    scheduleLineRecalc();
  },
  { flush: "post" },
);

const attachResizeObserver = (el) => {
  if (resizeObserver) {
    resizeObserver.disconnect();
    resizeObserver = null;
  }
  if (el && typeof ResizeObserver !== "undefined") {
    resizeObserver = new ResizeObserver(() => scheduleLineRecalc());
    resizeObserver.observe(el);
  }
};

watch(boardContainerRef, (el) => {
  attachResizeObserver(el);
  if (el) scheduleLineRecalc();
});

onMounted(() => {
  attachResizeObserver(boardContainerRef.value);
  scheduleLineRecalc();
  window.addEventListener("resize", scheduleLineRecalc);
});

onBeforeUnmount(() => {
  if (resizeObserver) resizeObserver.disconnect();
  if (rafId !== null) cancelAnimationFrame(rafId);
  window.removeEventListener("resize", scheduleLineRecalc);
});
</script>
