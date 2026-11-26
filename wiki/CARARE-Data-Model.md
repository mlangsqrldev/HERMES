# CARARE 2.0.6 Data Model & XSD Conformance

HERMES generates XML validated against the official **CARARE 2.0.6** schema bundled in this repository at `CARARE/carare-v2.0.6.xsd` (namespace `http://www.carare.eu/carareSchema`).

---

## 1. The Four-Pillar Model

CARARE 2.0.6 (derived from **CIDOC-CRM / ISO 21127**) strictly separates physical objects, digital surrogates, and creation events:

| Pillar | XML Element | Multiplicity | Purpose |
| :--- | :--- | :--- | :--- |
| **1. Collection** | `<collectionInformation>` | `1` per package | Project umbrella: providing institution, title, contacts, overall coverage, rights |
| **2. Heritage Asset** | `<heritageAssetIdentification>` | `0..n` | Physical cultural heritage object or monument (inventory no., type, material, dimensions, dating, findspot, historical creators, references) |
| **3. Digital Resource** | `<digitalResource>` | `0..n` | Digital surrogate representing a Heritage Asset (3D master mesh, point cloud, Web-GLB derivative, RAW photo set) |
| **4. Activity** | `<activity>` | `0..n` | Digitization campaign & paradata: actors, acquisition method, hardware/software, processing steps, IPTC AI steps, and DAP dimensions 1–5 |

All records are wrapped inside `<carareWrap><carare id="...">...</carare></carareWrap>`.

---

## 2. Clean Role & Entity Separation

A common source of metadata errors in cultural heritage projects is conflating historical creators, dataset curators, and 3D scanning staff. HERMES enforces strict separation:

- **Collection / Record Information → `contacts`**: Modern administrative contacts (data provider, cataloger, curator).
- **Heritage Asset → `actors`**: **Historical creators only** (sculptor, architect, potter, workshop). Left empty for anonymous ancient works.
- **Activity → `actors`**: **Modern digitization team** (scan operator, photographer, 3D modeler, conservator) with `actorType` (`person` or `organisation`) and repeatable `<roles>` tags.
- **Collection Institution vs. Heritage Asset Repository (`v0.1.34`)**: `collectionInformation` stores the data-providing institution; `heritageAssetIdentification/repositoryLocation` independently stores where the physical object is housed (with an optional 1-click *"Adopt from collection"* shortcut).

---

## 3. Bibliographic References (`<references>`) XSD Conformance

In Step 2 (*Heritage Asset*), bibliographic references use a streamlined two-field drawer (**Full Citation** + optional **DOI**). This remains **100% conformant** with `CARARE/carare-v2.0.6.xsd`:

- All sub-elements of `<references>` (`appellation`, `actors`, `type`, `rights`, `publicationStatement`, `note`, `link`) have `minOccurs="0"`.
- Inside `<appellation>`, the schema requires `<name lang="...">` (`minOccurs="1"`, `lang` required) followed strictly by `<id>` (`minOccurs="1"`, `xs:string`).
- When the user omits a DOI, the XML serializer (`src/App.vue`) automatically generates clean sequential fallback IDs (`REF-1`, `REF-2`, ...).

```xml
<references>
  <appellation>
    <name lang="de">D'Alessio, A.: La sinagoga e la comunità ebraica di Ostia (Rom 2023) 17-26.</name>
    <id>10.11588/diglit.3456</id>
  </appellation>
</references>
<references>
  <appellation>
    <name lang="de">Furtwängler, Beschreibung der geschnittenen Steine (1891) Nr. 740</name>
    <id>REF-1</id>
  </appellation>
</references>
```

---

## 4. Schema Sequence & Normalization Guarantees

Before serializing XML, `src/App.vue` executes a deterministic schema sanitization pipeline:

1. **Strict element ordering (`schemaSequenceMap`)**: Children of every complex element (`heritageAssetIdentification`, `digitalResource`, `activity`, `appellation`, `spatial`, `characters`, `references`, `consistsOf`, etc.) are sorted to match `carare-v2.0.6.xsd` `<xs:sequence>` declarations.
2. **Required attributes & defaults**: Guarantees `lang` attributes on `<name>`, `<description>`, `<provenance>`, `<namedLocation>`, and valid `<recordInformation><id>` + `<creation><date>`.
3. **Decimal normalization**: Formats `xs:decimal` coordinates and dimensions cleanly.
4. **No future dates**: Calendar inputs block future dates (`isFutureDate` guard), while historical dating supports negative years (BCE) without restriction.
5. **Roundtrip verified**: Tested continuously in `tests/carareRoundtrip.test.js` (including the 10-asset / 20-resource Giza Pyramid sample dataset).
