# HERMES v0.1.6 – v0.1.11 – Gesamt-Änderungsbericht (seit Freitag, 13.11.2026)

**Zeitraum:** Freitag, 13.11.2026 bis Montag, 16.11.2026  
**Versionen:** `v0.1.6` → `v0.1.7` → `v0.1.8` → `v0.1.9` → `v0.1.10` → `v0.1.11`  
**Commits:** `e4b27a2`, `ce8a045`, `34d6d10`, `49a968e`, `6f0816d`, `4f65b94`, `25c8482` (13.11.2026) · `d0f08a5` (14.11.2026) · `82b183d`, `15e1781`, `25b4b9b`, sowie Release `v0.1.11` (16.11.2026)  
**Release-Paket:** `HERMES_Windows_Release_Package/` (`HERMES.exe`, `HERMES_Setup_v0.1.11_2026-11-16.exe`, `HERMES_Installer_v0.1.11_2026-11-16.msi`)

---

## 1. Übersicht der Entwicklung seit Freitag

Seit dem Änderungskonzept vom Freitag (`v0.1.6`, 13.11.2026) wurde HERMES in sechs Iterationen grundlegend für die Museumspraxis überarbeitet, vereinheitlicht und durch einen automatisierten **Browser-QA-Agenten (aus Sicht eines Museumsmitarbeiters)** end-to-end getestet:

- **Freitag, 13.11.2026 (`v0.1.6`):** Rollenmodell & Personen-Pool getrennt, 5-Dimensionen-DAP, zentrales Rechte-Modal, `sticky`-Speichern-Leisten, 3D-Dropzone (inkl. GLB-Parsing), Layout-/Kontrast-/Lokalisierungs-Fixes, Feedbackloop Philippe (Pools, Temporal/Spatial-Modals) und `appellation.name`-Fix in `DigitalResourceCrud.vue`.
- **Samstag, 14.11.2026 (`v0.1.7`):** Einheitliche Header-Leiste, Teleport-Modals (`z-[9999]`), gekürzte Menü-Labels und DE/EN-Konsistenz.
- **Montag, 16.11.2026 (`v0.1.8` – `v0.1.11`):**
  - `v0.1.8`: PeriodO-Autofill-Fix, einseitiges Spatial-Modal (Ancient + Modern), GND + HECTOR Historische Urheber mit „Zuletzt verwendet (5)“, BonnData-JSON-Export.
  - `v0.1.9`: Pleiades-Spatial-Fix, PeriodO Ägypten + Regionen-Filter + „Zuletzt verwendet (5)“, mehrsprachige Felder (Statement, Description, Condition, DAP), Flaggen-Layout-Fix, Entfernung von XML-Tag-Jargon.
  - `v0.1.10`: Erster vollständiger E2E-Agenten-Fix-Zyklus (Collection Spatial XML, leere Array-Häkchen in der Seitenleiste, BCE-Anzeigedatum `v. Chr.` / `BCE`, DE/EN-Wording-Korrekturen).
  - `v0.1.11`: Abschluss-Fixes aus dem zweiten E2E-Agententest (Pleiades `<historicalName>` im Collection-XML auch bei vorhandener Quellen-Adresse, `Escape`-Taste in Header-Modals).

---

## 2. Automatisierter Browser-Test-Agent (Museumspraxis-QA)

Zur Qualitätssicherung wurde ein spezialisierter **Browser-QA-Subagent** (*Museum Staff Usability & QA Tester*) eingesetzt, der HERMES ohne Entwickler-/XML-Vorwissen aus Sicht eines normalen Museumsmitarbeiters (Archäologe / Dokumentar) im laufenden Chrome-Browser auf Deutsch und Englisch getestet hat:

1. **Testlauf 1 (`v0.1.9`):** Systematischer 8-Schritte-Praxistest über Header, globale Modals, Sammlung (Temporal Ägypten, Spatial Pleiades/GeoNames), Kulturgut (Urheber, Beschreibung, Erhaltungszustand, Maße/Dimensions), Digitalisat, Aktivität (DAP), Live XML und UI-Sprachwechsel DE/EN.
   - **Gefundene Probleme:**
     - `v. Chr.` / BCE-Daten wurden im Anzeigedatum teils mit doppeltem Minus (`-2686 – -2160`) formatiert.
     - Leere Array-Pflichtfelder wurden in der linken Workflow-Checkliste fälschlich vorab als erledigt (`✓`) markiert.
     - Gemischte/unpräzise DE/EN-Begriffe (z. B. `Sammlungsinformationen`, `Quelle`, `Baujahr`-Labeling, `Rechte` vs. `Rights`, `Speichern`-Button-Beschriftungen).
     - `Escape`-Schließen eines Header-Modals führte beim sofortigen Klick auf ein anderes Header-Modal zu Focus-/Öffnungsproblemen.
2. **Testlauf 2 (`v0.1.10` – Vollständiger E2E-Datensatz):** Der Agent hat einen kompletten Datensatz über alle 4 Module hinweg angelegt (**Sammlung `DE-MUS-814111_Aegypten_2026`** + **Kulturgut `HA_699203` / `ÄM 14108`** + **Digitalisat** + **Aktivität inkl. 5× DAP**), gespeichert und das resultierende **Live XML** geprüft.
   - **Bestätigte Erfolge:** `2686 – 2160 v. Chr.`-Formatierung, saubere Checklisten-Häkchen, DE/EN-Texte, mehrsprachige Felder, Historische Urheber (`Polyclitus, Sicyonius`), 5-Dimensionen-DAP und vollständige Verknüpfungen im XML.
   - **Letzte 2 verbliebene Bugs (sofort in `v0.1.11` behoben):**
     1. In `<collectionInformation><coverage><spatial>` fehlte `<historicalName>Memphis</historicalName>` im XML, wenn gleichzeitig eine Quellen-Organisation hinterlegt war.
     2. Nach dem Schließen des `Personen`-Modals per `Escape` öffnete der erste Klick auf `Organisationen` das Modal noch nicht.

---

## 3. Wichtige Änderungen & Bugfixes im Detail

### A. Personen, Organisationen & Historische Urheber (`v0.1.6`, `v0.1.8`, `v0.1.11`)
- **Trennung Stammdaten vs. Rollen:** Der globale Personen-Pool speichert nur noch Stammdaten; Rollen werden kontextabhängig in `PersonAssignmentList.vue` vergeben (inkl. **Mehrfachrollen** pro Person in Aktivitäten/Digitalisaten).
- **Historische Urheber (`historical`):** Im Kulturgut-Modul stehen gezielt **GND + HECTOR-Suche**, freie Neuanlage und **„Zuletzt verwendet“ (letzte 5)** zur Verfügung (ohne Verwechslung mit dem modernen Museums-Mitarbeiter-Pool).
- **Modals & `Escape`-Fix (`v0.1.7`, `v0.1.10`, `v0.1.11`):**
  - Alle Header-Modals (`PersonPickerModal.vue`, `OrganizationPickerModal.vue`, `ApiSettingsModal.vue`, `SoftwarePickerModal.vue`, `EquipmentPickerModal.vue`, `RightsSettingsModal.vue`) per `<Teleport to="body">` mit `z-[9999]` zentriert.
  - Globale `window`-`Escape`-Keydown-Handler in `PersonPickerModal.vue`, `OrganizationPickerModal.vue` und `ApiSettingsModal.vue` ergänzen `emitClose()` / `emit("close")`, sodass das Öffnen des nächsten Modals direkt beim **ersten Klick** funktioniert.

### B. Temporal (PeriodO) & Spatial (Pleiades / GeoNames) (`v0.1.6`, `v0.1.8` – `v0.1.11`)
- **PeriodO-Regionenfilter & Ägypten-Integration (`v0.1.8`, `v0.1.9`, `v0.1.10`):**
  - Suche über alle Regionen sowie Schnellfilter (inkl. **Ägypten**, z. B. *Altes Reich*, *Mittleres Reich*, *Neues Reich*) und **Schnellauswahl der letzten 5 verwendeten Perioden**.
  - Automatisches Übernehmen von Periodenname, Beginn, Ende, Normdaten-URI und sauber formatiertem Anzeigedatum (`2686 – 2160 v. Chr.` / `2686 – 2160 BCE` statt `-2686 – -2160`).
- **Einheitliches Spatial-Modal auf einer Seite (`v0.1.8`, `v0.1.9`, `v0.1.11`):**
  - **Ancient (Pleiades / iDAI.gazetteer)** und **Modern (GeoNames)** sowie interaktive Karte und Adressfelder auf einer einzigen Seite ohne doppelte Reiter.
  - **`v0.1.11` XML-Fix:** `CollectionInformationCrud.vue` setzt das flache Fallback-Land (`coverage.spatial.locationSet.address.country`) nicht mehr, wenn bereits Einträge in `form["coverage.spatial"]` vorliegen. `App.vue` prüft in `collectionInformation` über alle `<spatial>`-Kindknoten (`anySpatialHasPlace`), bevor das Fallback `"Bonn, Deutschland"` ergänzt wird – damit erscheint ein über Pleiades gewählter `<historicalName>` (z. B. `Memphis`) zuverlässig im CARARE-XML.

### C. Mehrsprachigkeit, DAP, UI & Export (`v0.1.6` – `v0.1.10`)
- **Mehrsprachige Textfelder (`+ Sprache hinzufügen`)** in `Statement` (Sammlung), `Description` & `Condition Assessment` (Kulturgut) sowie in allen **5 Freitext-Dimensionen des Digital Authenticity Profile (DAP-1 bis DAP-5)** (`v0.1.9`).
- **Flaggen-/Sprach-Buttons:** Saubere einzeilige Darstellung ohne unerwünschten Umbruch, auch bei aktiver **Live-XML-Vorschau** (`v0.1.9`).
- **Digitalisat (`DigitalResourceCrud.vue`):** `appellation.name`-Objektanzeige repariert (`v0.1.6`), überflüssiges `Note`-Feld und XML-Klammer-Jargon (`<extent>`, `<accuracy>`, `<consistsOf>`) aus den Formularen entfernt (`v0.1.6`, `v0.1.9`), **3D-Datei-Inspektor-Dropzone** (`.glb`, `.gltf`, `.obj`, `.ply`, `.stl`) integriert (`v0.1.6`).
- **BonnData-JSON-Export (`src/utils/bonndataExporter.js`):** Neuer Export für BonnData neben CARARE 2.0.6 XML (`v0.1.8`).
- **Workflow-Checkliste & Validierung (`v0.1.6`, `v0.1.10`):** Leere Pflichtfeld-Arrays werden in der Seitenleiste nicht mehr vorab als abgehakt angezeigt; `sticky bottom-0`-Speichern-Leisten, automatisches Aufklappen ungültiger Bereiche beim Speichern und eindeutige DE/EN-Beschriftungen in allen 4 Modulen.

---

## 4. Nachtrag `v0.1.12` (16.11.2026) – Verbleibende QA-Agenten-Befunde behoben

- **Spatial-Übernahme für antike Orte (`src/components/SpatialSection.vue`):**
  - Ein verbliebener `spatialKind`-Standardwert (`"modern"`) führte in `saveEntry()` dazu, dass `locationSet.historicalName` verworfen wurde, wenn im einseitigen Spatial-Modal ein Pleiades-Ort (z. B. *Memphis*) ausgewählt wurde. `saveEntry()` speichert nun alle ausgefüllten Felder (`locationSet.historicalName`, `namedLocation`, Adress-/Geodaten) einheitlich, wodurch **Räumlich** auch im Kulturgut-Modul korrekt als ausgefüllt markiert wird.
- **Barrierefreiheit & Tastatur-/Automation-Zugriff für Slide-over-Drawer (`src/output_components/HeritageAssetIdentificationCrud.vue`):**
  - `.drawer-side` und das innere Drawer-Panel (z. B. *Abmessungen hinzufügen*) erhalten `role="dialog"`, `:aria-modal`, `:aria-label`, `:aria-hidden` sowie explizites `visibility: visible` im geöffneten Zustand, sodass alle Formularfelder im Accessibility-Tree und per Tastatur direkt ansteuerbar sind.
- **Erstellungs-Tooltip geglättet (`src/output_components/CollectionInformationCrud.vue`):**
  - Der CARARE-Text (`"Informationen darüber, wie die geernteten Ressourcen gesammelt wurden, umfassen:"`) wurde in `creation.docDe` / `creation.docEn` durch eine klare, praxisnahe Beschreibung ersetzt.

---

## 5. Nachtrag `v0.1.13` (16.11.2026) – PeriodO ARK-IDs, Ägyptische Epochen & Live-Suche

- **Alle 37 PeriodO-ARK-IDs gegen `https://data.perio.do/dataset/` verifiziert & korrigiert (`src/components/PeriodoAutocomplete.vue`):**
  - Sämtliche ungültigen ARK-IDs (u. a. `p05krdx8w33` / `p0868m...`, die auf `perio.do` einen `404`-Fehler lieferten) wurden durch **37 echte, verifizierte PeriodO-ARK-IDs** ersetzt (u. a. `UCLA Encyclopedia of Egyptology`, `EDH`, `FASTI`, `ARIADNE`, `LCSH`).
- **Ägyptische Epochen in `PERIODO_CATALOG` verschoben & Regionenfilter korrigiert:**
  - Die 13 ägyptischen Hauptepochen (`Prädynastisch` bis `Römische Zeit (Ägypten)`) liegen nun direkt in `PERIODO_CATALOG` (statt `HECTOR_EPOCHS_CATALOG`), sodass sie sowohl im Modus **Alle** als auch **PeriodO** und über den Filter **Ägypten** gefunden werden.
  - `normalizeStr` wandelt Umlaute (`ä` -> `ae`) nun **vor** `normalize("NFD")` um.
- **Live-PeriodO-Suche (`https://data.perio.do/dataset/`):**
  - Bei Eingaben ab 2 Zeichen im Modus **Alle** oder **PeriodO** wird der vollständige PeriodO-Datensatz (9.537 Epochen, inkl. aller 362 Ägypten-Einträge) einmalig pro Sitzung gecacht und live durchsucht.
