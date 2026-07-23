import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

/**
 * StarfieldConfig — the single source of truth for the hero starfield look.
 *
 * Every knob the tuner exposes lives here. The Starfield component reads this
 * (via context) to generate the field and to drive the CSS animation variables.
 *
 * WORKFLOW: open the site with `?tune` to get the live tuner panel, adjust,
 * then Export JSON. Send that JSON back and it becomes the new
 * DEFAULT_STARFIELD_CONFIG below (paste the values in), so the live site adopts it.
 */
export interface StarfieldConfig {
  // ── Field / distribution ──────────────────────────────────────────────────
  seed: number;
  count: number; // number of field stars
  minGap: number; // min separation (0..1 space) — anti-clump
  edgeBias: number; // pull toward edges (1 = mild, 3 = strong)
  avoidBeam: boolean; // carve out the quasar beam corridor
  corridor: number; // half-width of the beam keep-out (0..1 space)

  // ── Twinkle ───────────────────────────────────────────────────────────────
  twinkleFraction: number; // 0..1 share of stars that twinkle
  twinklePeakBoost: number; // extra opacity at the peak of a twinkle
  twinkleScale: number; // scale at the peak of a twinkle
  speed: number; // global animation speed multiplier (twinkle share one period)

  // ── Flares ────────────────────────────────────────────────────────────────
  flareCount: number; // number of 4-point cross flares
  flarePeriod: number; // seconds between blooms of a single flare (lower = чаще)

  // ── Size / brightness ─────────────────────────────────────────────────────
  sizeSmall: number; // px — the common pinpoint
  sizeMid: number; // px
  sizeLarge: number; // px — the rare larger star
  staticOpacityMin: number;
  staticOpacityMax: number;
  twinkleOpacityMin: number;
  twinkleOpacityMax: number;
  glowBlur: number; // px — halo blur on shining stars
  glowAlpha: number; // 0..1 — halo strength

  // ── Colours ───────────────────────────────────────────────────────────────
  whiteColor: string; // hex — dominant star colour
  softColor: string; // hex — soft tint (also the Pleiades nodes)
  beamColor: string; // hex — rarer quasar-beam tint
  softFraction: number; // 0..1 share tinted with softColor
  beamFraction: number; // 0..1 share tinted with beamColor

  // ── Pleiades (procedural open clusters, M45-style) ────────────────────────
  pleiades: boolean;
  pleiadesCount: number; // number of clusters (first is anchored top-right)
  pleiadesStars: number; // stars per cluster
  nebulaOpacity: number; // soft reflection-nebula haze around each cluster
  pleiadesSpread: number; // cluster tightness/spread
  pleiadesOffsetX: number; // % nudge applied to all clusters
  pleiadesOffsetY: number;
  nodeScale: number; // multiplies star sizes
  nodeOpacity: number; // base star opacity
  nodeBreathePeak: number; // star opacity at breathe peak
  nodeGlowBlur: number; // px
  nodeGlowAlpha: number; // 0..1
}

// Tuned by the user in the ?tune panel and applied here as the site default.
export const DEFAULT_STARFIELD_CONFIG: StarfieldConfig = {
  seed: 20908,
  count: 70,
  minGap: 0.062,
  edgeBias: 1.7,
  avoidBeam: true,
  corridor: 0.12,

  twinkleFraction: 1,
  twinklePeakBoost: 0.5,
  twinkleScale: 1.28,
  speed: 1.45,

  flareCount: 27,
  flarePeriod: 6.5,

  sizeSmall: 1.7,
  sizeMid: 2.4,
  sizeLarge: 3.4,
  staticOpacityMin: 0.36,
  staticOpacityMax: 0.66,
  twinkleOpacityMin: 0.5,
  twinkleOpacityMax: 0.72,
  glowBlur: 6,
  glowAlpha: 0.5,

  whiteColor: "#ffffff",
  softColor: "#c2d0f3",
  beamColor: "#979efe",
  softFraction: 0.22,
  beamFraction: 0.14,

  pleiades: false,
  pleiadesCount: 4,
  pleiadesStars: 8,
  nebulaOpacity: 0.21,
  pleiadesSpread: 1,
  pleiadesOffsetX: 0,
  pleiadesOffsetY: 0,
  nodeScale: 1.1,
  nodeOpacity: 0.8,
  nodeBreathePeak: 1,
  nodeGlowBlur: 10,
  nodeGlowAlpha: 0.45,
};

// Footer sky — the same look, thinned out, no beam keep-out or clusters
// (there's no quasar down there). Its own seed for a distinct scatter.
export const FOOTER_STARFIELD_CONFIG: StarfieldConfig = {
  ...DEFAULT_STARFIELD_CONFIG,
  seed: 0x2f10,
  count: 34,
  avoidBeam: false,
  pleiades: false,
  flareCount: 8,
};

const HEX_RE = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i;

/** "#c2d0f3" → "195, 208, 243" for use inside rgba(var(--tone), a). */
export function hexToRgbTriplet(hex: string): string {
  const m = HEX_RE.exec((hex || "").trim());
  if (!m) return "255, 255, 255";
  const h = m[1];
  const full =
    h.length === 3
      ? h
          .split("")
          .map((c) => c + c)
          .join("")
      : h;
  const n = parseInt(full, 16);
  return `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`;
}

/** Merge an imported (possibly partial) config onto the defaults, keeping types. */
export function normalizeConfig(input: unknown): StarfieldConfig {
  const merged = { ...DEFAULT_STARFIELD_CONFIG };
  if (input && typeof input === "object") {
    for (const key of Object.keys(DEFAULT_STARFIELD_CONFIG) as (keyof StarfieldConfig)[]) {
      const v = (input as Record<string, unknown>)[key];
      if (v === undefined || v === null) continue;
      const def = DEFAULT_STARFIELD_CONFIG[key];
      if (typeof def === "number" && typeof v === "number" && Number.isFinite(v)) {
        (merged[key] as number) = v;
      } else if (typeof def === "boolean" && typeof v === "boolean") {
        (merged[key] as boolean) = v;
      } else if (typeof def === "string" && typeof v === "string") {
        // Colour fields must be valid hex, else keep the default (import safety).
        if (def.startsWith("#") && !HEX_RE.test(v)) continue;
        (merged[key] as string) = v;
      }
    }
  }
  return merged;
}

interface StarfieldConfigCtx {
  config: StarfieldConfig;
  setConfig: (updater: StarfieldConfig | ((prev: StarfieldConfig) => StarfieldConfig)) => void;
  reset: () => void;
}

const StarfieldConfigContext = createContext<StarfieldConfigCtx>({
  config: DEFAULT_STARFIELD_CONFIG,
  setConfig: () => {},
  reset: () => {},
});

export const useStarfieldConfig = () => useContext(StarfieldConfigContext);

/**
 * True only in a dev build AND when the page was opened with `?tune`. This is
 * the single gate for live tuning + localStorage persistence: production
 * visitors never read or write the tuner's stored config — even if they add
 * `?tune` to the URL — so the live site always renders the config from code.
 */
export function isTuning(): boolean {
  if (!import.meta.env.DEV) return false;
  if (typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).has("tune");
}

const LS_KEY = "kvz-starfield-config";

/**
 * Wraps the app. In normal viewing it just serves DEFAULT_STARFIELD_CONFIG and
 * never mutates it. Under `?tune` it becomes editable and persists to
 * localStorage so an in-progress tuning survives reloads. Production visitors
 * are never affected.
 */
export function StarfieldConfigProvider({ children }: { children: ReactNode }) {
  const tuning = isTuning();
  const [config, setConfig] = useState<StarfieldConfig>(() => {
    if (tuning) {
      try {
        const raw = localStorage.getItem(LS_KEY);
        if (raw) return normalizeConfig(JSON.parse(raw));
      } catch {
        /* ignore */
      }
    }
    return DEFAULT_STARFIELD_CONFIG;
  });

  useEffect(() => {
    if (!tuning) return;
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(config));
    } catch {
      /* ignore */
    }
  }, [config, tuning]);

  const reset = () => setConfig(DEFAULT_STARFIELD_CONFIG);

  return (
    <StarfieldConfigContext.Provider value={{ config, setConfig, reset }}>
      {children}
    </StarfieldConfigContext.Provider>
  );
}
