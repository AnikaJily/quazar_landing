import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

/**
 * StarfieldConfig — единый источник вида звёздного поля hero.
 * Здесь все «ручки» тюнера; Starfield читает их через контекст.
 * Правка: открыть сайт с `?tune`, настроить, Export JSON → вставить в DEFAULT_STARFIELD_CONFIG.
 */
export interface StarfieldConfig {
  // ── Поле / распределение ──────────────────────────────────────────────────
  seed: number;
  count: number; // число звёзд поля
  minGap: number; // мин. дистанция (0..1) — против скучивания
  edgeBias: number; // тяга к краям (1 — слабо, 3 — сильно)
  avoidBeam: boolean; // вырезать коридор луча квазара
  corridor: number; // полуширина обхода луча (0..1)

  // ── Мерцание ──────────────────────────────────────────────────────────────
  twinkleFraction: number; // 0..1 доля мерцающих звёзд
  twinklePeakBoost: number; // прибавка opacity на пике мерцания
  twinkleScale: number; // scale на пике мерцания
  speed: number; // общий множитель скорости анимации

  // ── Вспышки ───────────────────────────────────────────────────────────────
  flareCount: number; // число крестиков-вспышек
  flarePeriod: number; // секунд между вспышками одного крестика (меньше = чаще)

  // ── Размер / яркость ──────────────────────────────────────────────────────
  sizeSmall: number; // px — обычная точка
  sizeMid: number; // px
  sizeLarge: number; // px — редкая крупная звезда
  staticOpacityMin: number;
  staticOpacityMax: number;
  twinkleOpacityMin: number;
  twinkleOpacityMax: number;
  glowBlur: number; // px — размытие ореола у ярких звёзд
  glowAlpha: number; // 0..1 — сила ореола

  // ── Цвета ─────────────────────────────────────────────────────────────────
  whiteColor: string; // hex — основной цвет звёзд
  softColor: string; // hex — мягкий оттенок (и узлы Плеяд)
  beamColor: string; // hex — редкий оттенок луча квазара
  softFraction: number; // 0..1 доля с softColor
  beamFraction: number; // 0..1 доля с beamColor

  // ── Плеяды (процедурные рассеянные скопления, тип M45) ────────────────────
  pleiades: boolean;
  pleiadesCount: number; // число скоплений (первое привязано вправо-вверх)
  pleiadesStars: number; // звёзд в скоплении
  nebulaOpacity: number; // дымка туманности вокруг скопления
  pleiadesSpread: number; // плотность/разброс скопления
  pleiadesOffsetX: number; // % сдвиг всех скоплений
  pleiadesOffsetY: number;
  nodeScale: number; // множитель размеров звёзд
  nodeOpacity: number; // базовая opacity звёзд
  nodeBreathePeak: number; // opacity на пике «дыхания»
  nodeGlowBlur: number; // px
  nodeGlowAlpha: number; // 0..1
}

// Дефолт сайта: значения, настроенные в панели ?tune.
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

// Небо футера — тот же вид, но разреженнее, без обхода луча и скоплений
// (квазара там нет). Свой сид ради иного разброса.
export const FOOTER_STARFIELD_CONFIG: StarfieldConfig = {
  ...DEFAULT_STARFIELD_CONFIG,
  seed: 0x2f10,
  count: 34,
  avoidBeam: false,
  pleiades: false,
  flareCount: 8,
};

const HEX_RE = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i;

/** "#c2d0f3" → "195, 208, 243" для rgba(var(--tone), a). */
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

/** Слить импортированный (возможно частичный) конфиг с дефолтами, сохраняя типы. */
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
        // Цвет обязан быть валидным hex, иначе — дефолт (защита импорта).
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
 * True только в dev-сборке и при `?tune` — единый ключ к тюнингу и localStorage.
 * В проде тюнер не читается/не пишется, поэтому сайт всегда рендерит конфиг из кода.
 */
export function isTuning(): boolean {
  if (!import.meta.env.DEV) return false;
  if (typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).has("tune");
}

const LS_KEY = "kvz-starfield-config";

/**
 * Оборачивает приложение. Обычно отдаёт DEFAULT_STARFIELD_CONFIG без изменений.
 * Под `?tune` конфиг редактируется и пишется в localStorage (переживает перезагрузку).
 */
export function StarfieldConfigProvider({ children }: { children: ReactNode }) {
  const tuning = isTuning();
  const [config, setConfig] = useState<StarfieldConfig>(() => {
    if (tuning) {
      try {
        const raw = localStorage.getItem(LS_KEY);
        if (raw) return normalizeConfig(JSON.parse(raw));
      } catch {
        /* игнор */
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
