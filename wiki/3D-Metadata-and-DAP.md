# 3D Metadata, IPTC AI Transparency & Digital Authenticity Profile (DAP)

HERMES provides specialized scholarly metadata workflows for 3D cultural heritage acquisition, metrology, AI disclosure, and paradata.

---

## 1. Digital Resource 3D Inspector & Formats (`DigitalResource3DMetadata.vue`)

In **Step 3 (Digital Resource)**, HERMES supports three primary 3D acquisition methods and automatically adapts the technical fields:

| Method | Key Metadata Captured |
| :--- | :--- |
| **Photogrammetry (SfM)** | Camera/lens hardware, sensor resolution, RAW photo documentation, color calibration targets |
| **Structured Light Scanning (SLS)** | Scanner hardware, scan resolution & accuracy, SLS RAW captures & texture images |
| **Terrestrial Laser Scanning (TLS)** | Laser scanner hardware, point spacing/accuracy, TLS RAW images & HDR panoramas for colorization |

### Automatic File Inspection & Derivatives
- **Drag & Drop 3D Inspector**: Drop local `.glb`, `.obj`, or `.stl` files to read format, polygon/vertex count, textures, and file size automatically.
- **Mesh vs. Point Cloud Distinction (`v0.1.34`)**: Point-cloud formats (`.e57`, `.las`, `.laz`, `.xyz`, `.ply` clouds) avoid false mesh prefixes and display dedicated point-cloud metrics.
- **1-Click Web-GLB Derivative (`cloneAsWebDerivative`)**: Clones a saved archival master into a web-ready derivative (`format: ["model/gltf-binary"]`), automatically linking `isDerivativeOf` ↔ `hasDerivative` and inheriting the Heritage Asset `isRepresentationOf`.

### Metrology, Scaling & Georeferencing
- **Scaling (HECTOR)**: Controlled vocabulary for scale bars, total stations, GNSS, or known reference dimensions.
- **EPSG Georeferencing (`v0.1.34`)**: Online lookup against `https://spatialreference.org/ref/epsg/<code>/projjson.json` with an offline fallback table for common EPSG codes (WGS84 `EPSG:4326`, ETRS89 / UTM Zones 31N–33N, Web Mercator, etc.).

---

## 2. Activity Workflow & IPTC AI Transparency (`ActivityCrud.vue`, `ActivityConsistsOf3D.vue`)

In **Step 4 (Activities)**, each digitization campaign is structured into five clear blocks:

1. **Basics & Time Span**: Campaign title, ID, activity type, calendar start/end dates (future dates rejected).
2. **Actors & Multi-Roles**: Digitization team from the central Persons/Organizations pools, supporting multiple roles per actor (e.g., *Scan Operator*, *3D Modeler*, *Post-Processing*).
3. **3D Acquisition**: Capture event type, hardware/equipment, calibration targets.
4. **Processing Steps (`<consistsOf>`)**: Regular processing stages (alignment, meshing, hole filling, retopology, texturing), software & versions, and **IPTC AI Transparency** tags (e.g., *Composite with trained algorithmic media*, *Algorithmic media*, *Digital capture*) with direct external links (`openExternalUrl`) to the official IPTC & HECTOR definitions.
5. **Digital Authenticity Profile (DAP)**: Five structured scholarly dimensions documenting *why* and *how far* the 3D model represents the physical original.

---

## 3. The 5-Dimension Digital Authenticity Profile (DAP)

Each DAP dimension is entered as a dedicated free-text statement guided by a concrete scholarly prompt and exported as a standards-compliant CARARE `<consistsOf>` block:

| Dimension | Focus | Vocabulary URI |
| :--- | :--- | :--- |
| **DAP-1** | **Original Physical State** — material traces, damage, losses, historic restorations | `http://hector.org/vocab/dap/DAP-1` |
| **DAP-2** | **Capture Scope & Omissions** — covered areas, uncaptured/occluded zones, conservation constraints | `http://hector.org/vocab/dap/DAP-2` |
| **DAP-3** | **Geometry Processing & Modeling** — hole filling, smoothing, hypothetical reconstructions/simulations | `http://hector.org/vocab/dap/DAP-3` |
| **DAP-4** | **Texture, Color & Surface Material** — color calibration, normal maps, visual distinction of simulated parts | `http://hector.org/vocab/dap/DAP-4` |
| **DAP-5** | **Representational Balance** — research questions the 3D model supports and methodological limits | `http://hector.org/vocab/dap/DAP-5` |

### CARARE XML Serialization
```xml
<consistsOf>
  <hadSpecificPurpose lang="de">Digital Authenticity Profile, Dimension 1 von 5: Ausgangsbefund am Objekt (http://hector.org/vocab/dap/DAP-1)</hadSpecificPurpose>
  <methods lang="de">An der linken Körperseite befindet sich eine Kriegsbeschädigung...</methods>
</consistsOf>
```
