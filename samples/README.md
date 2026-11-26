# HERMES Sample Datasets (`samples/`)

This folder contains complete, **CARARE 2.0.6**-compliant sample datasets ready to load directly into HERMES (*Load CARARE*).

## `giza_pyramid_carare_2.0.6.xml`

Complete archaeological hierarchy dataset (**1 Collection · 10 Heritage Assets · 20 Digital Resources · 1 Activity**):

- **Collection**: `COL-GIZEH-01` (*Giza Pyramid Complex*)
- **Heritage Asset Hierarchy (`hasPart` / `isPartOf`)**:
  - `HA-PYRAMIDE` (Pyramid)
    - `HA-GRAB` (Burial Chamber)
      - `HA-SARKOPHAG` (Granite Sarcophagus)
        - `HA-SARKOPHAG-T1` (Sarcophagus Trough)
        - `HA-SARKOPHAG-T2` (Sarcophagus Lid)
        - `HA-SARKOPHAG-T3` (Sarcophagus Head End)
        - `HA-SARKOPHAG-T4` (Sarcophagus Foot End)
      - `HA-MUMIE` (Mummy)
      - `HA-KANOPENKASTEN` (Canopic Chest)
        - `HA-KANOPEN-INHALT` (Canopic Chest Contents / 4 Canopic Jars)
- **Digital Resources (`20` total)**: Each of the 10 Heritage Assets has **1 high-resolution Master model** (`*-MASTER`) and **1 Web Low-Poly derivative** (`*-LP`, linked via `hasDerivative` / `isDerivativeOf`).
- **Activity (`1` shared campaign)**: `ACT-GIZEH-SCAN` (*3D Documentation Campaign Giza*), linked to all 10 Heritage Assets (`wasPresentAt`) and all 20 Digital Resources (`hasCreated`).
