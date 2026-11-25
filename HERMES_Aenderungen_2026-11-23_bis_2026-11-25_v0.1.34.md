# HERMES Änderungsübersicht für das Team (23.11. – 25.11.2026)

**Aktuelle Version:** `v0.1.34 (2026-11-25)`  
**Zeitraum:** Montag, 23.11.2026 bis Mittwoch, 25.11.2026 (`v0.1.32` → `v0.1.33` → `v0.1.34`)  
**Windows-Paket:** `HERMES_Windows_Release_Package/HERMES_v0.1.34_2026-11-25.exe`

---

## Wichtigste Neuerungen im Überblick

### 1. Neue, übersichtliche Verknüpfung („Beziehungen“) — `v0.1.33` & `v0.1.34`
Das frühere, schwer bedienbare Verknüpfungskonzept wurde durch eine **klare Zwei-Listen-Ansicht** (`RelationsGraphEditor.vue`) ersetzt:
- **1. Objekt-Hierarchie (Blau):** Jedes Kulturgut hat eine eigene Zeile; über ein Dropdown wird festgelegt, ob es *Eigenständig* ist oder *Teil von* (`partOf`) einem anderen Kulturgut.
- **2. Digitalisate zuordnen (Grün):** Jedes 3D-Digitalisat erhält eine eigene Zeile über die volle Breite mit drei gestapelten, farbig hinterlegten Auswahlfeldern:
  - **Gehört zu Kulturgut** (Blau)
  - **Ableitung von (Master)** (Grau/Neutral — verknüpft z. B. Low-Poly-Derivate mit dem Master-Modell)
  - **Erzeugt in Aktivität** (Violett/Bernstein — **jetzt für jedes Digitalisat einzeln wählbar**, sodass Modelle aus verschiedenen Scans/Kampagnen sauber getrennt zugeordnet werden können)
- **Automatisch zuordnen:** Übernimmt bei eindeutigen Fällen automatisch passende Verknüpfungen.
- **Konsistenz-Check:** `analyzeRelationsHealth` berücksichtigt nun sowohl `partOf`- als auch `replicaOf`-Beziehungen bei der Prüfung verknüpfter Kulturgüter.

### 2. Vereinfachter Rechte-Manager („Globale Rechte“) — `v0.1.34`
- Der Tab **Globale Rechte** (`RightsSettingsModal.vue`) konzentriert sich auf die 3 wesentlichen Pflichtfelder:
  1. **Lizenz** (z. B. `CC BY 4.0`, `CC0 1.0`, …)
  2. **Zugang** (klare deutsche Bezeichnungen: *Offener Zugang (Open access)* / *Eingeschränkter Zugang (Restricted access)*)
  3. **Rechteinhaber / Credit Line**
- Dazu gibt es Schnell-Presets; selten benötigte Zusatzfelder liegen eingeklappt unter **„Erweiterte globale Felder“**.

### 3. Sauberer Leer-Start & aufgeräumte Formulare — `v0.1.34`
- **Immer leerer Start:** HERMES startet nun ohne stilles Wiederherstellen alter Zwischenstände (`hermes_session_draft_v1`), damit alte/defekte Entwürfe keine neue Sitzung mehr blockieren.
- **Keine „Zuletzt:“-Leisten mehr:** Alle „Zuletzt verwendet / Letzte 10 Referenzen“-Chip-Leisten wurden aus den Formularen und Autocomplete-Komponenten entfernt.
- **Klare Icons:** Das Zielscheiben-Icon (`🎯`) wurde entfernt und durch eindeutige Symbole ersetzt (`📷` für Aktivitäten, `🖥️ +3D` für die 3D-Schnellerfassung).

### 4. Wichtige Bugfixes in den Modulen — `v0.1.34`
- **Kulturgut (`HeritageAssetIdentificationCrud.vue`):**
  - Verstecktes Pflichtfeld `repositoryLocation` blockiert das Speichern nicht mehr; wird automatisch aus `collectionInstitution` vorbelegt.
  - Deutlicher Validierungshinweis direkt neben dem Speichern-Button, wenn noch etwas fehlt.
  - Tabellenzeilen sind direkt per Klick editierbar; Maße (`dimensions`) bleiben beim Duplizieren erhalten; englische Einheiten (`Grams`, `Kilograms`, `Meters`, `Millimeters`, `Centimeters`) ergänzt.
  - Barrierefreier Schließen-Button (`✕`) im Drawer.
- **Digitalisat & 3D-Metadaten (`DigitalResource3DMetadata.vue`):**
  - EPSG-Online-Suche von defektem `epsg.io` auf `https://spatialreference.org/ref/epsg/<code>/projjson.json` inkl. Fallback für gängige EPSG-Codes umgestellt.
  - Point-Cloud-Dateien erzeugen keinen falschen `"3D-Mesh: ."`-Präfix mehr; englische Platzhalter/Labels (`3D Models:`, `Point Clouds:`, `RAW & Textures:`, `Scale bar`, `Total station`) vervollständigt.
- **Aktivität (`ActivityCrud.vue`):**
  - Neue Aktivität startet direkt mit 1 leeren Titelzeile; leere Titel werden in der Tabelle sauber als `-` statt Roh-JSON angezeigt.
- **Sammlung (`CollectionInformationCrud.vue`):**
  - Überschrift bereinigt (ohne doppeltes `(Collection)`) und `+ Weiterer Titel`-Funktion ergänzt (`addTitleRow`).
- **Sprachauswahl, Modals & Kontakte:**
  - `TypeError` beim Wechseln des Sprach-Badges behoben (`blurActiveElement()` statt direktem `document.activeElement?.blur()` im Template).
  - Sprach-Dropdowns in allen 4 Modulen mit ausreichender Breite (`w-36 min-w-[9rem]`), `z-[60]` und `aria-label` ausgestattet; `.menu` in `style.css` gezielt gescoped, damit Dropdowns nicht überlagern.
  - Räumliche & zeitliche Modals (`SpatialSection.vue`, `TemporalSection.vue`) öffnen zuverlässig mit `open`-Attribut.
  - Kontakt-Bearbeitung (`PersonAssignmentList.vue`) nutzt ein responsives 2-Spalten-Layout (`grid-cols-1 sm:grid-cols-2`).
  - Browser-Startfehler durch Tauri-Store-Aufrufe über `getAppStore(...)` aus `platform.js` behoben.

### 5. Handbuch & Beispieldaten — `v0.1.33` & `v0.1.34`
- **Handbuch (`public/manual.html` & `HERMES_Windows_Release_Package/HERMES_Handbuch_Manual.html`):** Komplett überarbeitet und auf die neue Zwei-Listen-Verknüpfung, den vereinfachten Rechte-Manager und die Aktivitäts-Regel (DAP pro Objekt) aktualisiert.
- **Neuer Beispieldatensatz (`samples/`):**
  - `samples/pyramide_gizeh_carare_2.0.6.xml` (1 Sammlung, 10 Kulturgüter in 4-stufiger Hierarchie, 20 Digitalisate [Master + Low-Poly], 1 Aktivität) + `samples/README.md`, abgesichert durch einen Roundtrip-Test in `tests/carareRoundtrip.test.js`.

---

## Hinweis zur Vorgänger-Version `v0.1.32` (24.11.)
Bereits am 24.11. (`HERMES_Aenderungen_2026-11-24_Bugfixes_v0.1.32.md`) behoben und in den aktuellen Stand eingeflossen:
- `LanguageBadgePicker`: Klicks auf `IPTC ↗` / DAP öffnen nicht mehr versehentlich das Sprach-Menü; externe Links öffnen zuverlässig im Systembrowser.
- Saubere Trennung von Personen- und Körperschaften-Pool inkl. GND-Duplikatsprüfung.
- Natives `<select>` für Rollen bei Sammlungskontakten (Windows WebView2-Fix).
- Schutz vor vollem `localStorage`, robuster `CARARE`-XML-Export (Kurz-IDs `REF-1`, `REF-2` bei Literatur ohne DOI) und Performance-Optimierungen.
