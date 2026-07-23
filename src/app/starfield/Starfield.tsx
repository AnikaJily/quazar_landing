import { Fragment, useMemo, type CSSProperties } from "react";
import { cn } from "../lib/cn";
import { distToBeam, inCore } from "./beamGeometry";
import {
  DEFAULT_STARFIELD_CONFIG,
  hexToRgbTriplet,
  useStarfieldConfig,
  type StarfieldConfig,
} from "./starfieldConfig";
import "./starfield.css";

/**
 * Starfield — "Cartographer's echo"
 * ---------------------------------------------------------------------------
 * A luxury star-chart backdrop for the hero (the one zone carrying the quasar
 * shader). Fully driven by StarfieldConfig; all animation is parameterised via
 * CSS custom properties so the live tuner (`?tune`) can adjust it in real time.
 *
 * The field is generated in TWO independent seeded passes:
 *  - Pass 1 (positions): consumes only the layout knobs, so tuning brightness,
 *    colour, twinkle or flares never reshuffles the sky.
 *  - Pass 2 (styling): a separate seeded stream assigns twinkle / flare / tone /
 *    opacity via reservoir selection, so the fraction sliders are linear and the
 *    flare count is realised exactly (never lost to an unlucky seed).
 *
 * The Pleiades is rendered as a real open star cluster (M45): a tight group of
 * bright blue-white stars of varying magnitude wrapped in a soft reflection-
 * nebula haze — no connecting lines by default.
 *
 * Compositor-only motion (opacity + transform); glow via radial-gradient + a
 * static box-shadow. pointer-events:none, aria-hidden. Freezes tastefully under
 * prefers-reduced-motion (handled in ./starfield.css).
 *
 * REQUIRES: a <StarfieldConfigProvider> ancestor (falls back to
 * DEFAULT_STARFIELD_CONFIG otherwise) and ./starfield.css (imported below).
 * Beam geometry lives in ./beamGeometry (coupled to KvazarShader — see there).
 */

// ── Seeded PRNG ──────────────────────────────────────────────────────────────
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type StarTone = "white" | "soft" | "beam";

const NODE_PERIOD = 12; // seconds
const TWINKLE_BASE = 5; // seconds — shared twinkle period (scaled by speed)

// Field-star size mix, keyed off a uniform 0..1 roll: the rare large star, the
// occasional mid, the common small pinpoint.
const SIZE_LARGE_ABOVE = 0.94; // top ~6% of stars are large
const SIZE_MID_ABOVE = 0.78; // next ~16% are mid, the rest small

interface Star {
  x: number; // %
  y: number; // %
  size: number; // px
  baseOpacity: number;
  tone: StarTone;
  twinkles: boolean;
  flares: boolean;
  peak: number; // per-star twinkle amplitude (opacity added at peak)
  duration: number; // s
  delay: number; // s (negative → desynced)
}

// ── Field generation (two independent seeded passes) ─────────────────────────
// heroFraction: the top fraction of the (possibly taller) container that is the
// beam-bearing hero. <1 when the field bleeds below the hero into the gap so it
// tucks under the next section — beam geometry is only applied in that top part.
function buildField(c: StarfieldConfig, heroFraction = 1): Star[] {
  const count = Math.max(1, Math.round(c.count));
  const speed = c.speed > 0 ? c.speed : 1;

  // Pass 1 — positions. Depend ONLY on layout knobs, never on look knobs.
  const rndPos = mulberry32(c.seed);
  const positions: { x: number; y: number }[] = [];
  let guard = 0;
  while (positions.length < count && guard < count * 80) {
    guard++;
    let x01 = rndPos();
    let y01 = rndPos();

    if (c.avoidBeam) {
      const pull = (v: number) => {
        const d = v < 0.5 ? v : 1 - v;
        const t = Math.pow(d / 0.5, c.edgeBias) * 0.5;
        return v < 0.5 ? t : 1 - t;
      };
      x01 = pull(x01);
      y01 = pull(y01);
      // Map to hero space for the beam keep-out; below the hero there's no beam.
      const yHero = y01 / heroFraction;
      if (yHero <= 1 && (distToBeam(x01, yHero) < c.corridor || inCore(x01, yHero))) continue;
    }

    let tooClose = false;
    for (const p of positions) {
      if (Math.hypot(p.x - x01, p.y - y01) < c.minGap) {
        tooClose = true;
        break;
      }
    }
    if (tooClose) continue;

    positions.push({ x: x01, y: y01 });
  }

  // Pass 2 — styling. Separate stream; budgets realised exactly via reservoir
  // selection so sliders are linear and flares are never lost to the seed.
  const rndStyle = mulberry32((c.seed ^ 0x9e3779b9) >>> 0);
  const n = positions.length;
  const clampB = (x: number) => Math.max(0, Math.min(n, Math.round(x)));
  let twBudget = clampB(n * c.twinkleFraction);
  let flBudget = clampB(c.flareCount);
  let beamBudget = clampB(n * c.beamFraction);
  let softBudget = clampB(n * c.softFraction);

  const staticSpan = Math.max(0, c.staticOpacityMax - c.staticOpacityMin);
  const twinkleSpan = Math.max(0, c.twinkleOpacityMax - c.twinkleOpacityMin);
  // One shared period → every star twinkles at the SAME speed; only the phase
  // is randomised (per star below), so they sparkle out of step, never in unison.
  const twinklePeriod = TWINKLE_BASE / speed;

  let remStars = n;
  let remTone = n;

  return positions.map((p) => {
    const sr = rndStyle();
    const size =
      sr > SIZE_LARGE_ABOVE ? c.sizeLarge : sr > SIZE_MID_ABOVE ? c.sizeMid : c.sizeSmall;

    // Twinkle and flare are independent reservoir picks over the same pool — a
    // star can both twinkle AND flash a cross — and both counts land exactly.
    const twinkles = remStars > 0 && rndStyle() < twBudget / remStars;
    if (twinkles) twBudget--;
    const flares = remStars > 0 && rndStyle() < flBudget / remStars;
    if (flares) flBudget--;
    remStars--;

    let tone: StarTone = "white";
    const tr = rndStyle();
    if (remTone > 0 && tr < beamBudget / remTone) {
      tone = "beam";
      beamBudget--;
    } else if (remTone > 0 && tr < (beamBudget + softBudget) / remTone) {
      tone = "soft";
      softBudget--;
    }
    remTone--;

    const baseOpacity = twinkles
      ? c.twinkleOpacityMin + rndStyle() * twinkleSpan
      : c.staticOpacityMin + rndStyle() * staticSpan;

    return {
      x: +(p.x * 100).toFixed(3),
      y: +(p.y * 100).toFixed(3),
      size,
      baseOpacity,
      tone,
      twinkles,
      flares,
      // Per-star amplitude jitter — some stars shimmer strongly, others barely.
      peak: c.twinklePeakBoost * (0.6 + rndStyle() * 0.8),
      duration: twinklePeriod,
      // Random phase across the full cycle → same speed, never in unison.
      delay: -+(rndStyle() * twinklePeriod).toFixed(2),
    };
  });
}

// ── Pleiades clusters (procedural open clusters, M45-style) ──────────────────
// Each cluster is a tight group of bright blue-white stars of varying magnitude
// wrapped in a soft reflection-nebula haze — no connecting lines, like the real
// thing. `pleiadesCount` clusters × `pleiadesStars` stars each. The first cluster
// is anchored to the hero's clear top-right corner; any extras are placed by a
// seeded sampler into other dark, beam-free zones with a minimum separation.

const CLUSTER_RADIUS_BASE = 3.3; // % of container at spread 1
const NEBULA_PX_PER_RADIUS = 58; // haze diameter in px per unit of cluster radius (%)

interface ClusterNode {
  x: number;
  y: number;
  size: number;
}
interface Cluster {
  center: { x: number; y: number };
  radius: number;
  nodes: ClusterNode[];
}

// Cluster centres, in HERO % (0..100). Placed to HUG the diagonal beam: near it
// but off its bright core, on either side, scattered along its length.
function placeCenters(c: StarfieldConfig): { x: number; y: number }[] {
  const wanted = Math.max(0, Math.min(6, Math.round(c.pleiadesCount)));
  if (wanted === 0) return [];
  const centers: { x: number; y: number }[] = [];
  const rnd = mulberry32((c.seed ^ 0x00c0ffee) >>> 0);
  let guard = 0;
  let band = 0.14; // max perpendicular distance from the beam → hugs the diagonal
  let minSep = 16;
  while (centers.length < wanted && guard < 3000) {
    guard++;
    if (guard % 400 === 0) {
      band += 0.03;
      minSep *= 0.85;
    }
    const x = 0.06 + rnd() * 0.88;
    const y = 0.06 + rnd() * 0.88;
    const d = distToBeam(x, y);
    if (d < 0.05 || d > band || inCore(x, y)) continue; // right beside the beam, off its core
    const xp = x * 100;
    const yp = y * 100;
    if (centers.some((ct) => Math.hypot(ct.x - xp, ct.y - yp) < minSep)) continue;
    centers.push({ x: xp, y: yp });
  }
  return centers;
}

function buildClusters(c: StarfieldConfig, heroFraction = 1): Cluster[] {
  const centers = placeCenters(c); // hero %
  const radius = CLUSTER_RADIUS_BASE * c.pleiadesSpread;
  const perCluster = Math.max(1, Math.min(20, Math.round(c.pleiadesStars)));
  return centers.map((center, ci) => {
    const rnd = mulberry32((c.seed ^ (0x51ac0000 + ci * 0x9e3779b9)) >>> 0);
    const nodes: ClusterNode[] = [];
    for (let i = 0; i < perCluster; i++) {
      let gx = 0;
      let gy = 0;
      if (i > 0) {
        // Box–Muller gaussian scatter → a naturally tight, round cluster.
        const u1 = Math.max(1e-6, rnd());
        const u2 = rnd();
        const rr = Math.sqrt(-2 * Math.log(u1)) * 0.5;
        gx = rr * Math.cos(2 * Math.PI * u2);
        gy = rr * Math.sin(2 * Math.PI * u2);
      }
      // Brightest star anchors the centre; magnitudes fade out with a little jitter.
      // px size runs from ~3.6 (t=0, brightest) down to ~1.4 (t=1) across the
      // cluster, then × nodeScale, ±15% jitter, floored at 1.1px so none vanish.
      const t = perCluster > 1 ? i / (perCluster - 1) : 0;
      const size = Math.max(1.1, (3.6 - t * 2.2) * c.nodeScale * (0.85 + rnd() * 0.3));
      nodes.push({
        x: center.x + c.pleiadesOffsetX + gx * radius,
        // y is in hero %, scaled to the (possibly taller) container.
        y: (center.y + c.pleiadesOffsetY + gy * radius) * heroFraction,
        size,
      });
    }
    return {
      center: {
        x: center.x + c.pleiadesOffsetX,
        y: (center.y + c.pleiadesOffsetY) * heroFraction,
      },
      radius,
      nodes,
    };
  });
}

// ── Clusters renderer ────────────────────────────────────────────────────────
function PleiadesClusters({ c, heroFraction }: { c: StarfieldConfig; heroFraction: number }) {
  const clusters = useMemo(() => buildClusters(c, heroFraction), [c, heroFraction]);
  const speed = c.speed > 0 ? c.speed : 1;
  const nodeTone = hexToRgbTriplet(c.softColor);
  let nodeIndex = 0;

  return (
    <>
      {clusters.map((cl, ci) => (
        <Fragment key={ci}>
          {/* Reflection-nebula haze — a soft periwinkle glow wrapping the cluster,
              the way M45 sits in wispy blue nebulosity. Drawn under the stars.
              `nebulaOpacity` dims the whole element ON TOP OF the gradient's own
              stop alphas (0.9→0), so the slider is an overall dimmer whose real
              peak sits a bit below its value — intentional soft falloff. */}
          {c.nebulaOpacity > 0 && (
            <div
              className="kvz-nebula absolute"
              style={{
                left: `${cl.center.x}%`,
                top: `${cl.center.y}%`,
                width: `${cl.radius * NEBULA_PX_PER_RADIUS}px`,
                height: `${cl.radius * NEBULA_PX_PER_RADIUS}px`,
                opacity: c.nebulaOpacity,
                background: `radial-gradient(circle, rgba(${nodeTone}, 0.9) 0%, rgba(${nodeTone}, 0.28) 32%, rgba(${nodeTone}, 0) 68%)`,
              }}
            />
          )}

          {cl.nodes.map((n, i) => {
            const idx = nodeIndex++;
            return (
              <span
                key={i}
                className="kvz-star kvz-star--node absolute rounded-full"
                style={
                  {
                    left: `${n.x}%`,
                    top: `${n.y}%`,
                    width: `${n.size}px`,
                    height: `${n.size}px`,
                    "--kvz-tone": nodeTone,
                    "--kvz-ndur": `${NODE_PERIOD / speed}s`,
                    "--kvz-delay": `${-(idx * 0.6)}s`,
                  } as CSSProperties
                }
              />
            );
          })}
        </Fragment>
      ))}
    </>
  );
}

// ── Public component ─────────────────────────────────────────────────────────
export interface StarfieldProps {
  className?: string;
  /** Override the context config (defaults to the shared tunable config). */
  config?: StarfieldConfig;
  /** Extend the field this many px below the hero so it tucks under the next section. */
  bleedBottom?: number;
  /** The hero's own height in px — keeps the beam keep-out aligned while bleeding. */
  heroPx?: number;
}

export function Starfield({ className, config, bleedBottom = 0, heroPx = 0 }: StarfieldProps) {
  const ctx = useStarfieldConfig();
  const c = config ?? ctx.config ?? DEFAULT_STARFIELD_CONFIG;
  const speed = c.speed > 0 ? c.speed : 1;
  const heroFraction =
    heroPx > 0 && bleedBottom > 0 ? heroPx / (heroPx + bleedBottom) : 1;

  const stars = useMemo(() => buildField(c, heroFraction), [c, heroFraction]);

  const toneRgb: Record<StarTone, string> = useMemo(
    () => ({
      white: hexToRgbTriplet(c.whiteColor),
      soft: hexToRgbTriplet(c.softColor),
      beam: hexToRgbTriplet(c.beamColor),
    }),
    [c.whiteColor, c.softColor, c.beamColor],
  );

  // Config-driven CSS variables cascade to every star + node below. Memoised
  // like stars/toneRgb so it's rebuilt only when the config or layout changes.
  const rootVars: CSSProperties = useMemo(
    () =>
      ({
        "--sf-twinkle-peak": `${c.twinklePeakBoost}`,
        "--sf-twinkle-scale": `${c.twinkleScale}`,
        "--sf-glow-blur": `${c.glowBlur}px`,
        "--sf-glow-alpha": `${c.glowAlpha}`,
        "--sf-glow-tone": toneRgb.beam, // same triplet as the "beam"-toned stars
        "--sf-flare-dur": `${(c.flarePeriod > 0 ? c.flarePeriod : 5) / speed}s`,
        "--sf-node-op": `${c.nodeOpacity}`,
        "--sf-node-peak": `${c.nodeBreathePeak}`,
        "--sf-node-glow-blur": `${c.nodeGlowBlur}px`,
        "--sf-node-glow-alpha": `${c.nodeGlowAlpha}`,
        bottom: `${-bleedBottom}px`,
      }) as CSSProperties,
    [c, speed, bleedBottom, toneRgb],
  );

  return (
    <div
      aria-hidden="true"
      style={rootVars}
      className={cn(
        "pointer-events-none absolute inset-x-0 top-0 overflow-hidden select-none",
        className,
      )}
    >
      {stars.map((s, i) => (
        <span
          key={i}
          className={cn(
            "kvz-star absolute rounded-full",
            s.twinkles && "kvz-star--twinkle",
            s.flares && "kvz-star--flare",
          )}
          style={
            {
              left: `${s.x}%`,
              top: `${s.y}%`,
              width: `${s.size}px`,
              height: `${s.size}px`,
              "--kvz-tone": toneRgb[s.tone],
              "--kvz-base": s.baseOpacity.toFixed(3),
              "--kvz-peak": s.peak.toFixed(3),
              "--kvz-dur": `${s.duration}s`,
              "--kvz-delay": `${s.delay}s`,
            } as CSSProperties
          }
        />
      ))}

      {c.pleiades && <PleiadesClusters c={c} heroFraction={heroFraction} />}
    </div>
  );
}
