# Authority Files, Controlled Vocabularies & Central Pools

HERMES integrates live cultural-heritage authority services with resilient offline fallbacks and local reusable entity pools.

---

## 1. Controlled Vocabularies & Authority APIs

| Domain | Service / Vocabulary | Component / Utility | Offline Fallback |
| :--- | :--- | :--- | :--- |
| **Monument Types, Materials, Keywords, 3D Methods** | HECTOR SKOSMOS (BCDH / NFDI4Objects) & Getty AAT | `HectorMonumentTypeInput.vue`, `HectorMaterialInput.vue`, `HectorKeywordInput.vue`, `SkosmosAutocomplete.vue`, `src/utils/hector3dVocab.js`, `src/utils/termResolver.js` | Bundled curated bilingual dictionaries |
| **Organizations & Institutions** | GND (lobid.org) | `InstitutionAutocomplete.vue`, `OrganizationPickerModal.vue` | Local Organization Pool |
| **Persons & Historical Creators** | GND (lobid.org) & ORCID | `PersonPickerModal.vue`, `PersonAssignmentList.vue` | Local Person Pool |
| **Epochs & Dating** | HECTOR Epochs & PeriodO | `PeriodoAutocomplete.vue` | Curated regional/historical epochs (incl. Egyptian, Classical, Medieval, etc.) |
| **Ancient Places** | Pleiades Gazetteer | `PlaceAutocomplete.vue` | Manual historical place entry |
| **Modern Places & Coordinates** | GeoNames, OpenStreetMap Nominatim & Leaflet Map | `PlaceAutocomplete.vue`, `SpatialMapPicker.vue`, `SpatialSection.vue` | Interactive coordinate picker & manual entry |
| **Coordinate Reference Systems** | SpatialReference.org (`projjson.json`) | `DigitalResource3DMetadata.vue` | Common EPSG lookup table (`4326`, `25832`, `3857`, etc.) |

> **API Settings (`ApiSettingsModal.vue`):** Configure optional credentials such as a GeoNames username or BonnData API token directly inside the app; credentials are stored locally in `localStorage` under `hermes_api_credentials`.

---

## 2. Central Local Entity Pools (`src/utils/sharedState.js`)

To eliminate repetitive typing across 30+ objects, HERMES maintains five local pools shared across all modules:

1. **Persons Pool (`hermes_saved_persons`)**: Stores natural persons only (first/last name, GND, ORCID, affiliation, email). `isOrganizationEntity()` actively blocks corporate bodies from entering the Person Pool and routes them to Organizations instead.
2. **Organizations Pool (`hermes_saved_organizations`)**: Stores institutions, museums, universities, and workshops with GND normalization (`normalizeGndId`) and duplicate detection (`findDuplicateOrganization`) so identical organizations cannot be duplicated with conflicting data.
3. **Collections Pool (`hermes_saved_collections`)**: Reusable collection records.
4. **Software Pool (`hermes_saved_software`)**: Processing software & version presets (Metashape, RealityCapture, MeshLab, Blender, CloudCompare, etc.).
5. **Equipment Pool (`hermes_saved_equipment`)**: Cameras, lenses, structured-light and laser scanners, and calibration targets.

### Storage Safety & JSON Pool Backup / Restore
- All `localStorage` writes are guarded by `safeSetStorage(...)` (`try/catch` against `QuotaExceededError`).
- Both **PersonPickerModal** and **OrganizationPickerModal** provide 1-click **Backup Pools (JSON)** (`exportPoolsBackup`) and **Restore Pools (JSON)** (`importPoolsBackup`) buttons so teams can share institutional pools across computers or safeguard them before clearing browser cache.
