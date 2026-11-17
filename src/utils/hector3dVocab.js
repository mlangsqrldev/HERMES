import { ref } from "vue";

const HECTOR_3D_BASE = "http://vocabs.bcdh.uni-bonn.de/hector_3d_documentation/";
const SKOSMOS_3D_API = "https://vocabs.bcdh.uni-bonn.de/rest/v1/hector_3d_documentation";

export const IPTC_AI_TERMS = [
  {
    key: "compositeWithTrainedAlgorithmicMedia",
    uri: `${HECTOR_3D_BASE}concept_cef1191a`,
    iptcUri: "http://cv.iptc.org/newscodes/digitalsourcetype/compositeWithTrainedAlgorithmicMedia",
    de: "Teilweise KI-generierte Medien (compositeWithTrainedAlgorithmicMedia)",
    en: "Composite with AI-generated media (compositeWithTrainedAlgorithmicMedia)",
    shortDe: "Teilweise KI-generiert",
    shortEn: "Composite AI media",
  },
  {
    key: "trainedAlgorithmicMedia",
    uri: `${HECTOR_3D_BASE}concept_dfee2781`,
    iptcUri: "http://cv.iptc.org/newscodes/digitalsourcetype/trainedAlgorithmicMedia",
    de: "Vollständig KI-generierte Medien (trainedAlgorithmicMedia)",
    en: "Fully AI-generated media (trainedAlgorithmicMedia)",
    shortDe: "Vollständig KI-generiert",
    shortEn: "Fully AI-generated",
  },
  {
    key: "algorithmicallyEnhanced",
    uri: `${HECTOR_3D_BASE}concept_7042efdc`,
    iptcUri: "http://cv.iptc.org/newscodes/digitalsourcetype/algorithmicallyEnhanced",
    de: "KI-verbesserte Medien (algorithmicallyEnhanced)",
    en: "Algorithmically enhanced media (algorithmicallyEnhanced)",
    shortDe: "KI-verbessert (Upscaling/Denoising)",
    shortEn: "Algorithmically enhanced",
  },
];

export const CURATED_HECTOR_3D_TERMS = [
  ...IPTC_AI_TERMS.map((t) => ({
    uri: t.uri,
    de: t.de,
    en: t.en,
    category: "ai_iptc",
  })),
  {
    uri: `${HECTOR_3D_BASE}concept_4441ef06`,
    de: "KI-Inpainting (Texturergänzung)",
    en: "AI texture inpainting",
    category: "ai",
  },
  {
    uri: `${HECTOR_3D_BASE}concept_f9b6733c`,
    de: "Diffusionsbasierte Bild-/Textursynthese",
    en: "Diffusion-based image/texture synthesis",
    category: "ai",
  },
  {
    uri: `${HECTOR_3D_BASE}concept_4d4d5300`,
    de: "KI-Geometrie-Rekonstruktion (Fehlstellen)",
    en: "AI geometry completion",
    category: "ai",
  },
  {
    uri: `${HECTOR_3D_BASE}concept_27e37823`,
    de: "KI-Upscaling / Super-Resolution",
    en: "AI upscaling / super-resolution",
    category: "ai",
  },
  {
    uri: `${HECTOR_3D_BASE}concept_6dd1bf49`,
    de: "KI-Denoising (Entrauschung)",
    en: "AI denoising",
    category: "ai",
  },
  {
    uri: `${HECTOR_3D_BASE}concept_c5219268`,
    de: "Image-to-Video (KI-Animation)",
    en: "Image-to-Video (AI animation)",
    category: "ai",
  },
  {
    uri: `${HECTOR_3D_BASE}concept_f8ea3fc3`,
    de: "Image-to-3D / Text-to-3D",
    en: "Image-to-3D / Text-to-3D",
    category: "ai",
  },
  {
    uri: `${HECTOR_3D_BASE}concept_76a06b74`,
    de: "Neural Radiance Fields (NeRF)",
    en: "Neural Radiance Fields (NeRF)",
    category: "ai",
  },
  {
    uri: `${HECTOR_3D_BASE}concept_54442277`,
    de: "3D Gaussian Splatting (3DGS)",
    en: "3D Gaussian Splatting (3DGS)",
    category: "ai",
  },
  {
    uri: `${HECTOR_3D_BASE}concept_559c89c6`,
    de: "KI-Segmentierung / Maskierung",
    en: "AI segmentation / masking",
    category: "ai",
  },
  {
    uri: `${HECTOR_3D_BASE}concept_0f86e6c8`,
    de: "Laserscanning",
    en: "laser scanning",
    category: "method",
  },
  {
    uri: `${HECTOR_3D_BASE}concept_2e187bd6`,
    de: "Texturerzeugung",
    en: "Texture generation",
    category: "method",
  },
  {
    uri: `${HECTOR_3D_BASE}concept_2bd7d892`,
    de: "Direkte Georeferenzierung",
    en: "Direct georeferencing",
    category: "method",
  },
  {
    uri: `${HECTOR_3D_BASE}concept_0deecf2d`,
    de: "Targetbasierte Registrierung",
    en: "Target-based registration",
    category: "method",
  },
];

const cachedRemoteTerms = ref({});

export async function searchHector3dVocabulary(query, lang = "de") {
  const q = String(query || "").trim().toLowerCase();
  const local = CURATED_HECTOR_3D_TERMS.filter(
    (t) =>
      !q ||
      t.de.toLowerCase().includes(q) ||
      t.en.toLowerCase().includes(q),
  ).map((t) => ({
    prefLabel: lang === "de" ? t.de : t.en,
    uri: t.uri,
    source: "HECTOR 3D",
  }));

  if (!q || q.length < 2) {
    return local.slice(0, 12);
  }

  try {
    const cacheKey = `${lang}:${q}`;
    if (cachedRemoteTerms.value[cacheKey]) {
      return cachedRemoteTerms.value[cacheKey];
    }
    const res = await fetch(
      `${SKOSMOS_3D_API}/search?query=${encodeURIComponent(q)}*&lang=${lang}&maxhits=20`,
    );
    if (res.ok) {
      const data = await res.json();
      const apiItems = Array.isArray(data.results)
        ? data.results.map((r) => ({
            prefLabel: r.prefLabel || r.altLabel || "",
            uri: r.uri || "",
            source: "HECTOR 3D",
          }))
        : [];
      const seen = new Set(local.map((x) => x.uri));
      const merged = [...local];
      for (const item of apiItems) {
        if (item.prefLabel && !seen.has(item.uri)) {
          seen.add(item.uri);
          merged.push(item);
        }
      }
      cachedRemoteTerms.value[cacheKey] = merged.slice(0, 15);
      return merged.slice(0, 15);
    }
  } catch (e) {
    // Offline fallback is already in `local`
  }
  return local.slice(0, 15);
}
