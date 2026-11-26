// @vitest-environment happy-dom
import { describe, it, expect } from "vitest";
import { parseCarareXml } from "../src/utils/carareXmlParser.js";

const SAMPLE_CARARE_XML = `<?xml version="1.0" encoding="UTF-8"?>
<carareWrap xmlns="http://www.carare.eu/carareSchema">
  <carare id="COL_TEST_1">
    <collectionInformation>
      <id>DE-MUS-TEST-2026</id>
      <title lang="de" preferred="true">Test-Sammlung Ägypten</title>
      <source lang="de">Akademisches Kunstmuseum Bonn</source>
      <statement lang="de">Sammlung steinerner Grabstelen.</statement>
      <keywords lang="de" term="Grabmal" namespace="http://vocabs.bcdh.uni-bonn.de/hector/" termUID="http://vocabs.bcdh.uni-bonn.de/hector/c_123">Grabmal</keywords>
      <keywords lang="de">Haus12</keywords>
      <creation>
        <createdOn>2026-11-17</createdOn>
      </creation>
      <coverage>
        <temporal>
          <timeSpan>
            <startDate>-2686</startDate>
            <endDate>-2160</endDate>
          </timeSpan>
          <periodName lang="de">Altes Reich</periodName>
          <displayDate lang="de">2686 – 2160 v. Chr.</displayDate>
        </temporal>
        <spatial>
          <locationSet>
            <namedLocation lang="de">Memphis</namedLocation>
            <historicalName lang="de">Memphis (Antike)</historicalName>
            <geopoliticalArea lang="de">Ägypten</geopoliticalArea>
          </locationSet>
        </spatial>
      </coverage>
    </collectionInformation>
  </carare>
  <carare id="HA_1">
    <heritageAssetIdentification>
      <recordInformation>
        <id>HA_1</id>
        <source>Akademisches Kunstmuseum Bonn</source>
      </recordInformation>
      <appellation>
        <id>ÄM 12345</id>
        <name lang="de" preferred="true">Sitzstatue eines Schreibers</name>
      </appellation>
      <description lang="de">Kalksteinstatue aus dem Alten Reich.</description>
      <generalType>object</generalType>
      <characters>
        <materials lang="de" term="Kalkstein" namespace="http://vocabs.bcdh.uni-bonn.de/hector/" termUID="https://hector.bcdh.uni-bonn.de/limestone">Kalkstein</materials>
        <materials lang="de">Haus12</materials>
        <dimensions>
          <extent>Artefakt</extent>
          <measurementType>Höhe</measurementType>
          <value>45.5</value>
          <units>cm</units>
        </dimensions>
      </characters>
      <repositoryLocation>Akademisches Kunstmuseum Bonn</repositoryLocation>
      <references>
        <appellation>
          <id>https://doi.org/10.1234/test</id>
          <name>Grabungsbericht Memphis</name>
        </appellation>
        <type>Buch</type>
      </references>
    </heritageAssetIdentification>
  </carare>
  <carare id="ACT_1">
    <activity>
      <recordInformation>
        <id>ACT_1</id>
        <source>BCDH</source>
      </recordInformation>
      <appellation>
        <id>ACT_1</id>
        <name lang="de" preferred="true">3D-Kampagne Herbst 2026</name>
      </appellation>
      <eventType>3D-Digitalisierung</eventType>
      <temporal>
        <timeSpan>
          <startDate>2026-10-01</startDate>
          <endDate>2026-10-31</endDate>
        </timeSpan>
        <periodName>Kampagne Herbst 2026</periodName>
      </temporal>
      <consistsOf>
        <hadSpecificPurpose lang="de">KI-gestützte Texturergänzung der Rückseite</hadSpecificPurpose>
        <startDate>2026-10-15</startDate>
        <endDate>2026-10-16</endDate>
        <methods lang="de" term="KI-Inpainting (Texturergänzung)" namespace="http://vocabs.bcdh.uni-bonn.de/hector_3d_documentation/" termUID="http://vocabs.bcdh.uni-bonn.de/hector_3d_documentation/concept_4441ef06">Generative Texturergänzung (KI-Inpainting)</methods>
        <techniques lang="de" term="Teilweise KI-generierte Medien (compositeWithTrainedAlgorithmicMedia)" namespace="http://vocabs.bcdh.uni-bonn.de/hector_3d_documentation/" termUID="http://vocabs.bcdh.uni-bonn.de/hector_3d_documentation/concept_cef1191a">Diffusionsbasiertes Inpainting; IPTC Digital Source Type: compositeWithTrainedAlgorithmicMedia</techniques>
        <materials lang="de">Albedo-Map 8K; Maske; Seed: 48213</materials>
        <equipment lang="de">KI-Modell: SDXL Inpaint v1.0; Blender 4.3 LTS</equipment>
      </consistsOf>
    </activity>
  </carare>
</carareWrap>`;

describe("CARARE XML Roundtrip Parser", () => {
  it("parses Collection coverage arrays and HECTOR vs custom keywords", () => {
    const parsed = parseCarareXml(SAMPLE_CARARE_XML);
    expect(parsed.Collection).toHaveLength(1);
    const col = parsed.Collection[0];

    // Coverage arrays for TemporalSection & SpatialSection
    expect(col["coverage.temporal"]).toHaveLength(1);
    expect(col["coverage.temporal"][0]["timeSpan.startDate"]).toBe("-2686");
    expect(col["coverage.temporal"][0].periodName).toBe("Altes Reich");

    expect(col["coverage.spatial"]).toHaveLength(1);
    expect(col["coverage.spatial"][0]["locationSet.namedLocation"]).toBe("Memphis");
    expect(col["coverage.spatial"][0]["locationSet.historicalName"]).toBe("Memphis (Antike)");

    // Structured keywords: HECTOR keeps term/namespace/termUID; custom stays empty
    expect(col.keywords).toHaveLength(2);
    expect(col.keywords[0]["#term"]).toBe("Grabmal");
    expect(col.keywords[0]["#namespace"]).toBe("http://vocabs.bcdh.uni-bonn.de/hector/");
    expect(col.keywords[1]._value).toBe("Haus12");
    expect(col.keywords[1]["#term"]).toBe("");
    expect(col.keywords[1]["#namespace"]).toBe("");
  });

  it("parses HeritageAsset materials without fabricating term on custom terms", () => {
    const parsed = parseCarareXml(SAMPLE_CARARE_XML);
    expect(parsed.HeritageAsset).toHaveLength(1);
    const ha = parsed.HeritageAsset[0];

    expect(ha["characters.materials"]).toHaveLength(2);
    expect(ha["characters.materials"][0]["#term"]).toBe("Kalkstein");
    expect(ha["characters.materials"][1]._value).toBe("Haus12");
    expect(ha["characters.materials"][1]["#term"]).toBe("");
    expect(ha["characters.materials"][1]["#namespace"]).toBe("");
    expect(ha["characters.dimensions"]).toHaveLength(1);
    expect(ha.references).toHaveLength(1);
  });

  it("parses Activity temporal range and AI/HECTOR consistsOf steps", () => {
    const parsed = parseCarareXml(SAMPLE_CARARE_XML);
    expect(parsed.Activity).toHaveLength(1);
    const act = parsed.Activity[0];

    expect(act.temporal).toHaveLength(1);
    expect(act.temporal[0]["timeSpan.startDate"]).toBe("2026-10-01");
    expect(act.temporal[0]["timeSpan.endDate"]).toBe("2026-10-31");

    expect(act.consistsOf).toHaveLength(1);
    const step = act.consistsOf[0];
    expect(step.startDate).toBe("2026-10-15");
    expect(step["methods#term"]).toBe("KI-Inpainting (Texturergänzung)");
    expect(step["techniques#termUID"]).toBe(
      "http://vocabs.bcdh.uni-bonn.de/hector_3d_documentation/concept_cef1191a",
    );
    expect(step.materials).toContain("Seed: 48213");
    expect(step.equipment).toContain("SDXL");
  });

  it("parses samples/giza_pyramid_carare_2.0.6.xml completely", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const xml = fs.readFileSync(
      path.resolve(process.cwd(), "samples/giza_pyramid_carare_2.0.6.xml"),
      "utf-8",
    );
    const parsed = parseCarareXml(xml);
    expect(parsed.Collection).toHaveLength(1);
    expect(parsed.HeritageAsset).toHaveLength(10);
    expect(parsed.DigitalResource).toHaveLength(20);
    expect(parsed.Activity).toHaveLength(1);
  });
});
