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
 * Starfield — звёздный фон hero (зона с шейдером квазара).
 * ---------------------------------------------------------------------------
 * Полностью задаётся StarfieldConfig; анимация — через CSS-переменные, чтобы
 * live-тюнер (`?tune`) правил её в реальном времени.
 *
 * Поле строится в ДВУХ независимых сид-проходах:
 *  - Проход 1 (позиции): зависит только от layout — правка яркости/цвета/
 *    мерцания/вспышек не пересобирает небо.
 *  - Проход 2 (стилизация): отдельный поток, назначает мерцание/вспышку/тон/
 *    opacity через reservoir-выбор → слайдеры-доли линейны, число вспышек точно.
 *
 * Плеяды — реальное рассеянное скопление (M45): плотная группа ярких бело-
 * голубых звёзд разной величины в дымке отражательной туманности, без линий.
 *
 * Только композиторная анимация (opacity + transform); свечение — radial-
 * gradient + статичный box-shadow. pointer-events:none, aria-hidden. Замирает
 * под prefers-reduced-motion (см. ./starfield.css).
 *
 * ТРЕБУЕТ: предка <StarfieldConfigProvider> (иначе fallback на
 * DEFAULT_STARFIELD_CONFIG) и ./starfield.css. Геометрия луча — в ./beamGeometry
 * (связана с KvazarShader).
 */

// ── Сид-PRNG ──────────────────────────────────────────────────────────────
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

const NODE_PERIOD = 12; // с
const TWINKLE_BASE = 5; // с — общий период мерцания (масштабируется speed)

// Смесь размеров звёзд по броску 0..1: редкая крупная, изредка средняя,
// обычно мелкая точка.
const SIZE_LARGE_ABOVE = 0.94; // верхние ~6% — крупные
const SIZE_MID_ABOVE = 0.78; // следующие ~16% — средние, остальные мелкие

interface Star {
  x: number; // %
  y: number; // %
  size: number; // px
  baseOpacity: number;
  tone: StarTone;
  twinkles: boolean;
  flares: boolean;
  peak: number; // амплитуда мерцания звезды (прибавка opacity на пике)
  duration: number; // с
  delay: number; // с (отрицательный → рассинхрон)
}

// ── Генерация поля (два независимых сид-прохода) ─────────────────────────
// heroFraction: верхняя доля контейнера, занятая hero с лучом. <1, когда поле
// «подтекает» ниже hero в стык со следующей секцией — геометрия луча действует
// только в этой верхней части.
function buildField(c: StarfieldConfig, heroFraction = 1): Star[] {
  const count = Math.max(1, Math.round(c.count));
  const speed = c.speed > 0 ? c.speed : 1;

  // Проход 1 — позиции. Зависят ТОЛЬКО от layout, не от look-параметров.
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
      // В координаты hero для обхода луча; ниже hero луча нет.
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

  // Проход 2 — стилизация. Отдельный поток; бюджеты реализуются точно через
  // reservoir-выбор → слайдеры линейны, вспышки не теряются из-за сида.
  const rndStyle = mulberry32((c.seed ^ 0x9e3779b9) >>> 0);
  const n = positions.length;
  const clampB = (x: number) => Math.max(0, Math.min(n, Math.round(x)));
  let twBudget = clampB(n * c.twinkleFraction);
  let flBudget = clampB(c.flareCount);
  let beamBudget = clampB(n * c.beamFraction);
  let softBudget = clampB(n * c.softFraction);

  const staticSpan = Math.max(0, c.staticOpacityMax - c.staticOpacityMin);
  const twinkleSpan = Math.max(0, c.twinkleOpacityMax - c.twinkleOpacityMin);
  // Общий период → все звёзды мерцают с ОДНОЙ скоростью; рандомна лишь фаза
  // (у каждой ниже), поэтому вспыхивают вразнобой, не в унисон.
  const twinklePeriod = TWINKLE_BASE / speed;

  let remStars = n;
  let remTone = n;

  return positions.map((p) => {
    const sr = rndStyle();
    const size =
      sr > SIZE_LARGE_ABOVE ? c.sizeLarge : sr > SIZE_MID_ABOVE ? c.sizeMid : c.sizeSmall;

    // Мерцание и вспышка — независимые reservoir-выборки из общего пула: звезда
    // может и мерцать, И давать крестик; оба счётчика сходятся точно.
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
      // Джиттер амплитуды: одни звёзды мерцают сильно, другие едва.
      peak: c.twinklePeakBoost * (0.6 + rndStyle() * 0.8),
      duration: twinklePeriod,
      // Случайная фаза по всему циклу → та же скорость, но не в унисон.
      delay: -+(rndStyle() * twinklePeriod).toFixed(2),
    };
  });
}

// ── Скопления Плеяд (процедурные рассеянные, в духе M45) ──────────────────
// Скопление — плотная группа ярких бело-голубых звёзд разной величины в дымке
// отражательной туманности, без линий. `pleiadesCount` скоплений × `pleiadesStars`
// звёзд. Центры раскладывает сид-сэмплер по тёмным зонам без луча с минимальным
// разделением.

const CLUSTER_RADIUS_BASE = 3.3; // % контейнера при spread 1
const NEBULA_PX_PER_RADIUS = 58; // диаметр дымки, px на единицу радиуса (%)

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

// Центры скоплений в % hero (0..100). Жмутся к диагональному лучу: рядом с ним,
// но вне яркого ядра, по обе стороны и вдоль всей длины.
function placeCenters(c: StarfieldConfig): { x: number; y: number }[] {
  const wanted = Math.max(0, Math.min(6, Math.round(c.pleiadesCount)));
  if (wanted === 0) return [];
  const centers: { x: number; y: number }[] = [];
  const rnd = mulberry32((c.seed ^ 0x00c0ffee) >>> 0);
  let guard = 0;
  let band = 0.14; // макс. перпендикуляр от луча → держится у диагонали
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
    if (d < 0.05 || d > band || inCore(x, y)) continue; // вплотную к лучу, но вне ядра
    const xp = x * 100;
    const yp = y * 100;
    if (centers.some((ct) => Math.hypot(ct.x - xp, ct.y - yp) < minSep)) continue;
    centers.push({ x: xp, y: yp });
  }
  return centers;
}

function buildClusters(c: StarfieldConfig, heroFraction = 1): Cluster[] {
  const centers = placeCenters(c); // % hero
  const radius = CLUSTER_RADIUS_BASE * c.pleiadesSpread;
  const perCluster = Math.max(1, Math.min(20, Math.round(c.pleiadesStars)));
  return centers.map((center, ci) => {
    const rnd = mulberry32((c.seed ^ (0x51ac0000 + ci * 0x9e3779b9)) >>> 0);
    const nodes: ClusterNode[] = [];
    for (let i = 0; i < perCluster; i++) {
      let gx = 0;
      let gy = 0;
      if (i > 0) {
        // Гауссов разброс по Box–Muller → естественно плотное круглое скопление.
        const u1 = Math.max(1e-6, rnd());
        const u2 = rnd();
        const rr = Math.sqrt(-2 * Math.log(u1)) * 0.5;
        gx = rr * Math.cos(2 * Math.PI * u2);
        gy = rr * Math.sin(2 * Math.PI * u2);
      }
      // Самая яркая звезда — в центре; величины гаснут с лёгким джиттером.
      // Размер px от ~3.6 (t=0, ярчайшая) до ~1.4 (t=1), затем × nodeScale,
      // ±15% джиттер, пол 1.1px чтобы ни одна не исчезла.
      const t = perCluster > 1 ? i / (perCluster - 1) : 0;
      const size = Math.max(1.1, (3.6 - t * 2.2) * c.nodeScale * (0.85 + rnd() * 0.3));
      nodes.push({
        x: center.x + c.pleiadesOffsetX + gx * radius,
        // y — в % hero, масштабируется к контейнеру.
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

// ── Рендер скоплений ────────────────────────────────────────────────────────
function PleiadesClusters({ c, heroFraction }: { c: StarfieldConfig; heroFraction: number }) {
  const clusters = useMemo(() => buildClusters(c, heroFraction), [c, heroFraction]);
  const speed = c.speed > 0 ? c.speed : 1;
  const nodeTone = hexToRgbTriplet(c.softColor);
  let nodeIndex = 0;

  return (
    <>
      {clusters.map((cl, ci) => (
        <Fragment key={ci}>
          {/* Дымка отражательной туманности — мягкое свечение вокруг скопления,
              как синяя туманность M45. Под звёздами. `nebulaOpacity` гасит весь
              элемент ПОВЕРХ альф градиента (0.9→0), поэтому слайдер — общий
              димер, реальный пик чуть ниже значения — намеренный мягкий спад. */}
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

// ── Публичный компонент ─────────────────────────────────────────────────────
export interface StarfieldProps {
  className?: string;
  /** Переопределяет конфиг из контекста (по умолчанию — общий тюнимый). */
  config?: StarfieldConfig;
  /** Продлить поле на столько px ниже hero, чтобы оно заходило под следующую секцию. */
  bleedBottom?: number;
  /** Высота самого hero в px — держит обход луча выровненным при bleed. */
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

  // CSS-переменные из конфига каскадом идут к каждой звезде и узлу. Мемоизация
  // как у stars/toneRgb — пересборка только при смене конфига или layout.
  const rootVars: CSSProperties = useMemo(
    () =>
      ({
        "--sf-twinkle-peak": `${c.twinklePeakBoost}`,
        "--sf-twinkle-scale": `${c.twinkleScale}`,
        "--sf-glow-blur": `${c.glowBlur}px`,
        "--sf-glow-alpha": `${c.glowAlpha}`,
        "--sf-glow-tone": toneRgb.beam, // тот же триплет, что у звёзд тона "beam"
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
