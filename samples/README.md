# HERMES Beispiel-Datensätze (`samples/`)

Dieser Ordner enthält vollständige, **CARARE 2.0.6**-konforme Beispieldatensätze zum direkten Laden in HERMES (*„Importieren / Load CARARE“*).

## `pyramide_gizeh_carare_2.0.6.xml`

Vollständiger archäologischer Hierarchie-Datensatz (**1 Sammlung · 10 Kulturgüter · 20 Digitalisate · 1 gemeinsame Aktivität**):

- **Sammlung**: `COL-GIZEH-01` (*Pyramidenkomplex Gizeh / Giza Pyramid Complex*)
- **Kulturgüter-Hierarchie (`hasPart` / `isPartOf`)**:
  - `HA-PYRAMIDE` (Pyramide)
    - `HA-GRAB` (Grabkammer)
      - `HA-SARKOPHAG` (Granitsarkophag)
        - `HA-SARKOPHAG-T1` (Sarkophag-Wanne)
        - `HA-SARKOPHAG-T2` (Sarkophag-Deckel)
        - `HA-SARKOPHAG-T3` (Sarkophag-Kopfseite)
        - `HA-SARKOPHAG-T4` (Sarkophag-Fußseite)
      - `HA-MUMIE` (Mumie)
      - `HA-KANOPENKASTEN` (Kanopenkasten)
        - `HA-KANOPEN-INHALT` (Inhalt des Kanopenkastens / 4 Kanopenkrüge)
- **Digitalisate (`20` Stück)**: Jedes der 10 Kulturgüter besitzt genau **1 hochauflösende Master-Datei** (`*-MASTER`) und **1 Web-Low-Poly-Ableitung** (`*-LP`, verknüpft via `hasDerivative` / `isDerivativeOf`).
- **Aktivität (`1` gemeinsame Kampagne)**: `ACT-GIZEH-SCAN` (*3D-Dokumentationskampagne Gizeh*), die alle 10 Kulturgüter (`wasPresentAt`) und alle 20 Digitalisate (`hasCreated`) erzeugt hat.
