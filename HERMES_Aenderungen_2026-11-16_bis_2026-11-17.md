# HERMES – Änderungsübersicht (16.11.2026 – 17.11.2026)

Zeitraum: **2026-11-16 (`v0.1.8`) bis 2026-11-17 (`v0.1.31`)**

---

## 17.11.2026 (`v0.1.25` – `v0.1.31`)

### `v0.1.31` (`e199d6a`) – HECTOR-3D/IPTC-Toggle, Aktivität-Speichern, XML-Bereinigung & PDF-Bericht
- **HECTOR-3D- & IPTC-Picker im `consistsOf`-Drawer**: Einheitliche `btn-xs`-Panels mit Live-Suche (`HECTOR 3D suchen...`), Auswählen **und** Entfernen (`✓ ... ×`) sowie direktem Vokabular-Link (`ActivityCrud.vue`, `DigitalResourceCrud.vue`).
- **`Aktivität speichern` direkt funktionsfähig**: Eingeklappte `recordInformation`-Pflichtfelder blockieren das Speichern nicht mehr still (`recordInformation.source` & `creation.date` werden automatisch vorbefüllt); alle 5 DAP-Dimensionen bleiben beim direkten Speichern erhalten.
- **CARARE-2.0.6-XML-Bereinigung & deutsches `<type>`-Mapping**: Interne UI-Flags (`_isDraft`, `isDap`, `dapId`) werden nicht mehr ins XML exportiert; deutsche Ressourcentypen (`Film`, `Bild`, `Ton`) mappen korrekt auf `Movie`, `Image`, `Sound`.
- **3D-Metadaten-Reset & `repositoryLocation`-Prefill**: Bei `➕ Neue Digitale Ressource` werden lokale 3D-Felder (`Polygon Count`, `Vertex Count` etc.) sauber zurückgesetzt (`DigitalResource3DMetadata.vue`); `Standort / Sammlungsort` übernimmt den vollständigen Institutionsnamen aus der Sammlung (`HeritageAssetIdentificationCrud.vue`).
- **UI & Sicherheit**: Linke Seitenleiste bei geöffnetem Live-XML scrollbar gemacht; Bestätigungsdialog (`confirm`) für `🗑️ Formulare zurücksetzen`.
- **PDF-Bericht (`Bericht (PDF)`) komplett überarbeitet** (`markdownReportGenerator.js` + neuer Test `tests/pdfReport.test.js`): Überlaufende Boxen/Pills durch Umbruch- und Kürzungslogik behoben; übernimmt nun Sammlung (Kapitel 0), Kulturgüter inkl. `characters.*`/Maße/Epochen, Digitalisate (Master & Derivate inkl. Typ), reguläre `consistsOf`-Arbeitsschritte (SfM/SLS/KI/IPTC) sowie alle DAP-1–5-Antworten.

### `v0.1.30` (`132c3c3`) – Senior-IT-Audit-Fixes
- **Template-Modal (`addTemplateModal`)**: Schließen-Button (`✕`), `Abbrechen`-Button und Backdrop-Klick ergänzt.
- **HECTOR-Materialien im XML**: Doppelte URI-Ausgabe im Textknoten bei gesetzter `termUID` verhindert.
- **Globale Rechte & Lizenz-Anzeige**: Header-Button zeigt `"Nicht gesetzt"` (`badge-warning`) statt vorgetäuschtem `"CC BY 4.0"`, solange keine Lizenz gewählt ist; zuverlässige Rechte-Übernahme in Datensätze und XML.
- **Workflow-Fortschrittszähler**: `completedSectionsCount` nutzt einheitlich `getSectionQualityStatus` (konsistente Prozent- und Punktanzeige in der Seitenleiste).

### `v0.1.29` (`9984fc8`) – Sauberes Anzeigedatum (`TemporalSection`)
- Führende Nullen bei Jahreszahlen im `Anzeigedatum` entfernt (z. B. `14 – 37` statt `0014 – 0037`).

### `v0.1.28` (`a5168a1`) – Roundtrip-Sicherheit, KI-DAP-Hinweis & Vitest-Tests
- CARARE-XML-Roundtrip-Tests (`tests/carareRoundtrip.test.js`) und HECTOR/Tooltip-Tests (`tests/hectorAndTooltips.test.js`) ergänzt.
- Automatischer KI-Hinweis im DAP-Bereich, sobald ein KI-gestützter `consistsOf`-Arbeitsschritt erkannt wird.

### `v0.1.27` (`70f1c86`) – Activity-Datumsformatierung & HECTOR-3D-Vollabgleich
- Einheitliche ISO-Datumsformatierung für Activity-Zeitspannen und `consistsOf`-Daten; Abgleich mit dem `hector_3d_documentation`-Vokabular.

### `v0.1.26` (`bbbc748`) – HECTOR 3D Documentation & KI-Arbeitsschritte (`consistsOf`)
- Integration von `hector_3d_documentation` inkl. KI-Verfahren und IPTC *Digital Source Type* (`trainedAlgorithmicMedia`, `compositeWithTrainedAlgorithmicMedia`, `algorithmicallyEnhanced`) in `consistsOf` und Vorlagen (`ActivityConsistsOf3D.vue`).

### `v0.1.25` (`4c82b59`) – Review-Feedback & QA-Erstnutzer-Fixes
- Verbesserungen aus dem Erstnutzer- und Review-Durchlauf eingearbeitet.

---

## 16.11.2026 (`v0.1.8` – `v0.1.24`)

- **`v0.1.24` (`f21c208`)**: Räumliche & zeitliche Abdeckung (`Coverage`) in `CollectionInformation` an die Darstellung von `HeritageAsset` angeglichen.
- **`v0.1.23` (`1d3e38b`)**: Zentrale, museumstaugliche Tooltips (DE/EN) eingeführt.
- **`v0.1.22` (`309d031`)**: Rückmeldungen aus der Feedback-Schleife (`v0.1.18`) behoben.
- **`v0.1.20` – `v0.1.21` (`88e8759`, `4baef40`)**: UX/UI-Review-Fixes (Tabellenlayout, Dark-Mode-Kontrast, `Creation`-Felder, doppelte Header/Banner entfernt, kompaktes `Appellation`/`Description`-Layout).
- **`v0.1.19` (`37ea9c8`)**: Dropdown-Breite im `LanguageBadgePicker` korrigiert.
- **`v0.1.18` (`14cc9cf`, `467ba8e`, `3bb5702`)**: BonnData-Direktupload-Modal mit API-Token & Datei-Upload; Windows-Release-Paket auf eine einzelne portable EXE mit Datum umgestellt.
- **`v0.1.17` (`149e638`)**: `extractCleanText`-ReferenceError beim BagIt-Export behoben, Drawer per `Teleport` korrigiert, QA-Feinschliff.
- **`v0.1.16` (`ee287a3`)**: 3D-Defaultwerte bereinigt und Organisations-/Personen-Pools beim Template-Import synchronisiert.
- **`v0.1.15` (`8ae43c4`)**: BonnData `metadataLanguage`, vollständiges Schema-Mapping & Handbuch-Kapitel 10 ergänzt.
- **`v0.1.14` (`87a533f`, `b125c4e`)**: Klare ID-Labels, Button `Als Entwurf zwischenspeichern`, mehrtägige Session-Auto-Speicherung und Animations-Hinweis.
- **`v0.1.13` (`a5c90a6`)**: Verifizierte PeriodO-ARK-IDs, ägyptische Epochen im PeriodO-Katalog und Live-PeriodO-Suche.
- **`v0.1.11` – `v0.1.12` (`03500ef`, `8b66342`)**: `Spatial` `historicalName` (Collection & HA) gespeichert, Modals per `Escape` schließbar, Drawer-Bedienbarkeit und `Creation`-Tooltips verbessert.
- **`v0.1.10` (`25b4b9b`)**: Collection-Spatial-XML, leere Array-Häkchen in der Seitenleiste, v.-Chr.-Anzeigedatum (`BCE`), DE/EN-Texte und Modal-Fokus bei `Escape` korrigiert.
- **`v0.1.9` (`15e1781`)**: Pleiades-Spatial-Fix, PeriodO Ägypten + Regionsfilter + *Zuletzt 5*, mehrsprachige `Statement`/`Description`/`Condition`/`DAP`-Felder, Flaggen-Umbruch und XML-Tag-Bereinigung.
- **`v0.1.8` (`82b183d`)**: Temporal-PeriodO-Autofill, einheitliches Spatial-Modal (Antik/Modern), GND+HECTOR historische Schöpfer inkl. *Zuletzt 5* und BonnData-JSON-Export.
