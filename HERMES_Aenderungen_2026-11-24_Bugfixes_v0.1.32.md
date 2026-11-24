# HERMES Änderungsbericht & Bugfixes (2026-11-24)

**Basisversion:** `v0.1.32 (2026-11-20)`  
**Anlass:** Rückmeldungen aus dem Praxistest (Valentina, 23.–24.11.2026)  
**Verifikation:** `vitest run` (4 Testdateien / 13 Tests bestanden) & `vite build` erfolgreich

---

## Übersicht der behobenen Fehler

### 1. IPTC-Klick & DAP-Eingaben öffneten ungewollt die Sprachauswahl
- **Problem:** In *Activity → ConsistsOf* öffnete ein Klick auf `IPTC ↗` statt der Website die Sprachauswahl (`DE/EN/FR/IT/ES/EL`). Dasselbe Problem wiederholte sich bei den DAP-Eingaben.
- **Ursache:** In `LanguageBadgePicker.vue` überschrieb Tailwinds Utility-Klasse `flex` auf `<ul class="dropdown-content flex ...">` das `display: none` aus DaisyUI v5 (`@layer daisyui.l1.l2.l3`). Dadurch hing unter jedem Sprach-Button eine unsichtbare, anklickbare Box (`opacity: 0`, `z-[120]`, `tabindex="0"`), die Klicks auf darunterliegende Elemente (u. a. `IPTC ↗` und DAP-Controls) abfing. Zudem nutzten `IPTC ↗` und `HECTOR ↗` `target="_blank"` statt Tauri-`openExternalUrl`.
- **Lösung:**
  - `src/components/LanguageBadgePicker.vue`: Umstellung auf expliziten Vue-Zustand (`isOpen` mit `v-if="isOpen"`), Outside-Click- und `Escape`-Handler — bei geschlossenem Picker existiert kein unsichtbares DOM-Element mehr.
  - `src/output_components/ActivityCrud.vue`: `IPTC ↗` und `HECTOR ↗` rufen nun `openExternalUrl(...)` auf und öffnen die jeweilige Referenz-Website auch in der Desktop-App zuverlässig im Systembrowser. Die 3 IPTC-KI-Begriffe bleiben direkt darunter in HERMES per Klick auswählbar.

---

### 2. Körperschaften erschienen im Personen-Pool
- **Problem:** Organisationen/Körperschaften tauchten unter *Personen* auf.
- **Ursache:** `syncPoolsFromTemplate` in `src/App.vue` übergab beim Speichern von Kontakten/Akteuren keinen `type`/`actorType` an `addOrUpdatePerson(...)`, sodass der Organisations-Filter umgangen wurde. Außerdem erkannte `sharedState.js` nur `organization`/`organisation` (nicht `CorporateBody`, `Körperschaft`, `institution` etc.).
- **Lösung:**
  - `src/App.vue`: `syncPoolsFromTemplate` prüft den Entitätstyp und leitet Körperschaften gezielt in den Organisations-Pool (`addOrUpdateOrganization`) statt in den Personen-Pool.
  - `src/utils/sharedState.js`: Neue Prüfung `isOrganizationEntity()` sowie Abgleich gegen bereits im Organisations-Pool bekannte Einrichtungen verhindern, dass Körperschaften in `savedPersons` landen.
  - `src/components/PersonPickerModal.vue`: Filtert Körperschaften zusätzlich defensiv aus und korrigiert den Hinweistext auf „Personen“.

---

### 3. Doppelte Einträge im Körperschaften-Pool
- **Problem:** Dieselbe Körperschaft konnte im Pool mehrfach mit unterschiedlichen Daten angelegt werden.
- **Ursache:** GND-IDs wurden beim Vergleich nicht normalisiert (z. B. `5035657-4` vs. `https://d-nb.info/gnd/5035657-4`), `updateSavedOrganization` hatte keinerlei Duplikatsprüfung und das Modal warnte nicht vor bestehenden Einträgen.
- **Lösung:**
  - `src/utils/sharedState.js`: Neue Helfer `normalizeGndId()`, `normalizeOrgName()` und `findDuplicateOrganization()`. Sowohl `addOrUpdateOrganization` als auch `updateSavedOrganization` prüfen nun konsistent auf Namens- und GND-Duplikate.
  - `src/components/OrganizationPickerModal.vue`: Bei erkanntem Duplikat erscheint ein klares Warnbanner mit den Optionen **„Vorhandenen Eintrag aktualisieren“** oder **„Vorhandenen Eintrag öffnen“** statt einen zweiten Eintrag anzulegen.

---

### 4. Sammlung → Kontaktpersonen → Rolle-Dropdown reagierte nicht
- **Problem:** Ein Klick auf das Rollen-Feld bei Kontaktpersonen der Sammlung öffnete keine Auswahl.
- **Ursache:** `PersonAssignmentList.vue` verwendete im Modus `contact` ein HTML-`<input :list>` mit `<datalist>`, das unter Windows WebView2 (Tauri) in Kombination mit DaisyUI-Input-Styling beim Klicken häufig nicht aufklappt.
- **Lösung:**
  - `src/components/PersonAssignmentList.vue`: Ersetzt durch ein natives `<select>`-Dropdown mit allen vorgeschlagenen Rollen sowie der Option **„Sonstige / Eigene Rolle eingeben…“** (öffnet bei Bedarf ein Freitextfeld).

---

### 5. Literatur & Referenzen: CARARE-2.0.6-XML-Konformität
- **Frage:** Bleibt die vereinfachte Eingabe (*Literaturangabe / Freitext* + *DOI*) XML-konform?
- **Befund:** **Ja.** Die Eingabe wird korrekt nach `references/appellation/name[@lang]` und `references/appellation/id` serialisiert und erfüllt `CARARE/carare-v2.0.6.xsd`.
- **Verbesserung (`src/App.vue`):** Wenn kein DOI angegeben ist, schreibt `cleanAndValidateNode` nun eine saubere Kurz-ID (`REF-1`, `REF-2`, …) in `<id>` statt den gesamten Zitationstext zu duplizieren.

---

### 6. Absturz nach vielen Datensätzen (~30), blockiertes Digitalisat, tote „Globale Rechte“ & Datenverlust beim Cache-Löschen
- **Problem:** Nach längerer Arbeit mit vielen Datensätzen stürzte die App ab; nach Neustarts ließen sich *Digitalisat* und *Globale Rechte* nicht mehr bedienen. Erst komplettes Cache-Löschen half, löschte aber auch alle Personen und Organisationen.
- **Ursachen:**
  1. Ungeschützte `localStorage.setItem`-Aufrufe (u. a. in `saveGlobalRights`, `defaultMetadataLanguage`, `BrowserStore`): Bei vollem `localStorage` (`QuotaExceededError`) warf `saveGlobalRights` noch vor `emit('apply-rights')` und `emit('close')` — *Globale Rechte* ließen sich weder anwenden noch schließen.
  2. `cloneAsWebDerivative` in `DigitalResourceCrud.vue` setzte `format` auf einen String (`"model/gltf-binary"`) statt ein Array (`["model/gltf-binary"]`), was in `DigitalResource3DMetadata.vue` (`formats`-Array-Verarbeitung) zu Fehlern führte.
  3. Beim Start stellte `App.vue` den Auto-Entwurf (`hermes_session_draft_v1`) blind ohne Typ-/Null-Prüfung wieder her — ein einmal beschädigter Datensatz blockierte das Modul über jeden Neustart hinweg.
  4. Zwei tiefe Watcher bauten bei jeder Eingabe das komplette XML (alle 300 ms, selbst bei geschlossener XML-Vorschau) und den gesamten Session-Draft neu auf.
  5. Es fehlte eine Backup-/Restore-Möglichkeit für Personen- und Organisations-Pools.
- **Lösung:**
  - `src/utils/sharedState.js` & `src/utils/platform.js`: Alle `localStorage`-Schreibvorgänge mit `try/catch` (`safeSetStorage`) abgesichert.
  - `src/components/RightsSettingsModal.vue`: Speichern/Schließen mit `try/catch` abgesichert sowie Null-Filterung für `heritageItems` / `digitalItems`.
  - `src/output_components/DigitalResourceCrud.vue` & `src/components/DigitalResource3DMetadata.vue`: `cloneAsWebDerivative` setzt `format` korrekt als Array; defensive Normalisierung (`normalizedFormats`) und Null-Prüfungen in Tabelle, `edit()` und `save()`.
  - `src/App.vue`:
    - Strikte modulweise Sanitisierung beim Laden von `hermes_session_draft_v1` (beschädigte Entwürfe werden isoliert bereinigt, **ohne** Personen-/Organisations-Pools anzutasten).
    - *„Formulare zurücksetzen“* löscht explizit `hermes_session_draft_v1` und weist darauf hin, dass alle Pools & Vorlagen erhalten bleiben.
    - Live-XML-Aktualisierung läuft nur noch bei geöffneter XML-Vorschau (600 ms Debounce) und sofort beim Aufklappen → deutlich flüssiger bei 30+ Datensätzen.
  - `src/components/PersonPickerModal.vue` & `src/components/OrganizationPickerModal.vue`: Neue Buttons **„Pools sichern“** und **„Pools laden“** für 1-Klick-JSON-Backup/-Wiederherstellung der Personen- und Organisations-Pools.

---

### 7. Vorlagen-Fenster zu klein bei vielen gespeicherten Templates
- **Problem:** Das Vorlagen-Fenster wuchs bei vielen Templates nicht mit und wurde unübersichtlich.
- **Lösung:**
  - `src/App.vue`: Haupt-Vorlagenmodal auf `max-w-3xl` und `max-h-[88vh]` mit großem Scrollbereich (`max-h-[58vh]`), Zähler-Badge und Live-Suchfeld erweitert.
  - `src/output_components/ActivityCrud.vue`, `CollectionInformationCrud.vue`, `DigitalResourceCrud.vue`, `HeritageAssetIdentificationCrud.vue`: Alle 4 Feld-Vorlagenmodals auf `max-w-2xl` + `max-h-[85vh]` mit eigenem Scroll-Container erweitert und den *„Manuell bearbeiten“*-Button (`type="submit"`) zum Schließen repariert.

---

## Geänderte Dateien

- `src/App.vue`
- `src/components/LanguageBadgePicker.vue`
- `src/components/PersonAssignmentList.vue`
- `src/components/PersonPickerModal.vue`
- `src/components/OrganizationPickerModal.vue`
- `src/components/RightsSettingsModal.vue`
- `src/components/DigitalResource3DMetadata.vue`
- `src/output_components/ActivityCrud.vue`
- `src/output_components/CollectionInformationCrud.vue`
- `src/output_components/DigitalResourceCrud.vue`
- `src/output_components/HeritageAssetIdentificationCrud.vue`
- `src/utils/sharedState.js`
- `src/utils/platform.js`
- `tests/bugfixesV0132.test.js` *(neu)*

---

## Kurze Rückmeldung für Valentina (Vorlage)

> Hi Valentina, danke für das ausführliche Feedback und die Videos! Ich habe alle Punkte im Code gefunden und gefixt:
> 1. **IPTC & DAP (Sprachauswahl-Popup):** Das war tatsächlich ein fieser CSS-Bug in der Sprachauswahl — darunter lag eine unsichtbare Klickfläche über dem IPTC-Link und den DAP-Feldern. Ist behoben; die 3 IPTC-Begriffe wählt man direkt als Buttons in HERMES, der `IPTC ↗`-Link öffnet jetzt sauber die IPTC-Website im Browser.
> 2. **Körperschaften unter Personen & Duplikate im Körperschaften-Pool:** Beides gefixt — Körperschaften landen nicht mehr im Personen-Pool, und beim Anlegen/Bearbeiten im Körperschaften-Pool werden doppelte Namen und GND-IDs jetzt abgefangen (mit Option zum Aktualisieren statt Duplizieren).
> 3. **Sammlung → Kontaktpersonen → Rolle-Dropdown:** Auf ein echtes Dropdown (inkl. eigener Rolle) umgestellt, reagiert jetzt direkt beim Klicken.
> 4. **Literatur & Referenzen:** Ja, bleibt vollständig CARARE-2.0.6-XML-konform (ohne DOI wird jetzt eine saubere Kurz-ID `REF-1`, `REF-2`, … erzeugt).
> 5. **Absturz / Digitalisat / Globale Rechte / Cache:** Ursache waren u. a. volle `localStorage`-Speichergrenzen ohne Abfangen, ein String/Array-Typfehler bei 3D-Derivaten sowie ein nicht bereinigter Auto-Entwurf beim Neustart. Alles abgesichert, Live-XML bei vielen Datensätzen entlastet — außerdem gibt es jetzt **„Pools sichern / laden“ (JSON)** direkt im Personen- und Organisations-Pool, damit Personen & Organisationen nie wieder verloren gehen.
> 6. **Vorlagen-Fenster:** Deutlich größer, scrollbar und im Hauptfenster jetzt mit Suchfeld.
