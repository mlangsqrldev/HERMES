# Relations & Object Hierarchy

Instead of forcing users to enter Dublin Core / CARARE relation IDs piecemeal while filling out forms, HERMES keeps Modules 1–4 completely free of inline relation panels and centralizes all linking exclusively in **Step 5: Relations (`RelationsGraphEditor.vue`)**.

---

## 1. The Unified Assignment Interface (`v0.1.36`)

Step 5 presents three clean, uniform sections that stay readable even with 30–100+ records:

### Section 1 — Heritage Asset Hierarchy (`hasPart` / `isPartOf`)
Every saved Heritage Asset appears as a row with a dropdown allowing you to define whether it is:
- **Standalone** (top-level object), or
- **Part of (`isPartOf`)** another Heritage Asset (e.g., *Lid* → *Sarcophagus*, or *Burial Chamber* → *Great Pyramid*).

Both sides (`parent.hasPart` and `child.isPartOf`) are synchronized automatically.

### Section 2 — Digital Resource Assignment
Every saved Digital Resource appears as a full-width row with three color-coded selectors:

1. **Belongs to Heritage Asset (`isRepresentationOf` ↔ `hasRepresentation`)** — *Mandatory CARARE link (`*`)*. Links the 3D model or media resource to the physical object it depicts.
2. **Derivative of Master (`isDerivativeOf` ↔ `hasDerivative`)** — Optional. Links a web/realtime model (e.g., `-WEB-GLB`, Low-Poly) to its uncompressed archival master (`.obj` / `.ply`).
3. **Created in Activity (`hasCreated` / `wasDigitizedBy` ↔ `wasPresentAt`)** — Selectable **individually per Digital Resource**, so models produced in different scanning campaigns or post-processing runs stay cleanly separated.

---

## 2. Relation Mapping Reference

All bidirectional mutations are implemented in `src/utils/relationsHelper.js`:

| Visual Assignment | Source Record Field | Target Record Field | CARARE Meaning |
| :--- | :--- | :--- | :--- |
| Asset ↔ Digital Resource | `HA.hasRepresentation` | `DR.isRepresentationOf` (`*`) | Digital resource depicts the physical heritage asset |
| Master ↔ Derivative | `Master.hasDerivative` | `Derivative.isDerivativeOf` | Web/Low-Poly derivative derived from archival master |
| Asset ↔ Activity | `HA.wasDigitizedBy` | `Activity.wasPresentAt` | Heritage asset was captured during this activity |
| Resource ↔ Activity | `Activity.hasCreated` | *(target DR ID)* | Activity produced this digital resource |
| Parent ↔ Child Asset | `Parent.hasPart` | `Child.isPartOf` | Multi-part monument or archaeological ensemble |
| Replica → Original Asset | `Replica.isReplicaOf` | *(target HA ID)* | Plaster cast, historic copy, or reconstruction |
| Collection Sync | `Collection.dcRelation` *(only relation element in CARARE 2.0.6)* | *(HA & Activity IDs / URIs)* | Collection-level Dublin Core relations (`<dcRelation>`) |

---

## 3. 1-Click Auto-Match & Health Check

- **Auto-Match (`autoMatchRelations`)**:
  - Conservatively and idempotently pairs derivative suffixes (`-WEB-GLB`, `-LP`, `-LOWPOLY`, `-DERIV`, etc.) to their matching Master Digital Resource.
  - Matches unlinked Digital Resources to Heritage Assets by normalized ID or inventory-number stem (e.g., `DR-SK740-MASTER` ↔ `HA-SK740`), inherits the Master's Heritage Asset for derivatives, or links automatically when only 1 Heritage Asset exists.
  - Links records to the Activity automatically when a single project Activity exists (or by ID stem).
  - Synchronizes Collection links strictly into `Collection.dcRelation` (in CARARE 2.0.6 XSD, `<collectionInformation>` only supports `<dcRelation>`, never `<hasPart>` or `<wasDigitizedBy>`).
- **Health & Orphan Check (`analyzeRelationsHealth`)**:
  - Flags any Digital Resource missing the mandatory `isRepresentationOf` link.
  - Counts unlinked Heritage Assets (accounting for `hasRepresentation`, `wasDigitizedBy`, `partOf`, and `replicaOf`) and drives the Step 5 sidebar quality badge.

---

## 4. Collection External References (`dcRelation`)

In **Section 3 of Step 5**, users can add or remove external URIs, DOIs, or related collection identifiers directly on the project's `<collectionInformation>` record. In strict conformance with CARARE 2.0.6 XSD, only `<dcRelation>` elements are written on Collection records.
