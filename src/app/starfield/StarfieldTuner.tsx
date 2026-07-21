import { useRef, useState, type ChangeEvent } from "react";
import {
  DEFAULT_STARFIELD_CONFIG,
  isTuning,
  normalizeConfig,
  useStarfieldConfig,
  type StarfieldConfig,
} from "./starfieldConfig";

/**
 * StarfieldTuner — a live control panel for the hero starfield.
 * Only renders when the page is opened with `?tune`. Adjust the sliders and the
 * sky updates in real time; Export the JSON, send it back, and it becomes the
 * new default. Never shown to normal visitors.
 */

type NumKey = {
  [K in keyof StarfieldConfig]: StarfieldConfig[K] extends number ? K : never;
}[keyof StarfieldConfig];

interface SliderSpec {
  key: NumKey;
  label: string;
  min: number;
  max: number;
  step: number;
}

interface Group {
  title: string;
  open?: boolean; // whether the group starts expanded (default true)
  sliders?: SliderSpec[];
  colors?: { key: keyof StarfieldConfig; label: string }[];
  toggles?: { key: keyof StarfieldConfig; label: string }[];
  seed?: boolean;
}

// Only the essentials show by default; everything fine-grained lives in the
// collapsed "Ещё · …" groups so the panel stays clean.
const GROUPS: Group[] = [
  {
    title: "Звёзды",
    sliders: [
      { key: "count", label: "Количество", min: 10, max: 90, step: 1 },
      { key: "speed", label: "Скорость мерцания", min: 0.3, max: 2.5, step: 0.05 },
      { key: "twinkleFraction", label: "Доля мерцающих", min: 0, max: 1, step: 0.02 },
      { key: "glowAlpha", label: "Свечение", min: 0, max: 1, step: 0.02 },
    ],
    seed: true,
  },
  {
    title: "Вспышки",
    sliders: [
      { key: "flareCount", label: "Кол-во вспышек", min: 0, max: 30, step: 1 },
      { key: "flarePeriod", label: "Частота (меньше = чаще)", min: 2, max: 14, step: 0.5 },
    ],
  },
  {
    title: "Плеяды (скопления)",
    toggles: [{ key: "pleiades", label: "Показывать плеяды" }],
    sliders: [
      { key: "pleiadesCount", label: "Кол-во скоплений", min: 0, max: 4, step: 1 },
      { key: "pleiadesStars", label: "Звёзд в скоплении", min: 3, max: 14, step: 1 },
      { key: "nebulaOpacity", label: "Туманность (нимб)", min: 0, max: 0.4, step: 0.01 },
      { key: "nodeScale", label: "Размер звёзд", min: 0.4, max: 2.2, step: 0.05 },
      { key: "pleiadesSpread", label: "Разброс", min: 0.4, max: 1.8, step: 0.05 },
    ],
  },
  {
    title: "Ещё · поле",
    open: false,
    toggles: [{ key: "avoidBeam", label: "Обходить луч квазара" }],
    sliders: [
      { key: "minGap", label: "Мин. расстояние", min: 0.02, max: 0.14, step: 0.005 },
      { key: "edgeBias", label: "Прижим к краям", min: 1, max: 3, step: 0.1 },
      { key: "corridor", label: "Коридор луча", min: 0, max: 0.25, step: 0.005 },
      { key: "sizeSmall", label: "Размер: мелкие", min: 0.5, max: 6, step: 0.1 },
      { key: "sizeMid", label: "Размер: средние", min: 0.5, max: 6, step: 0.1 },
      { key: "sizeLarge", label: "Размер: крупные", min: 0.5, max: 7, step: 0.1 },
      { key: "staticOpacityMin", label: "Непрозрачность: мин", min: 0, max: 1, step: 0.02 },
      { key: "staticOpacityMax", label: "Непрозрачность: макс", min: 0, max: 1, step: 0.02 },
      { key: "glowBlur", label: "Свечение: радиус", min: 0, max: 16, step: 0.5 },
    ],
  },
  {
    title: "Ещё · мерцание",
    open: false,
    sliders: [
      { key: "twinklePeakBoost", label: "Яркость на пике", min: 0, max: 0.9, step: 0.02 },
      { key: "twinkleScale", label: "Раздувание на пике", min: 1, max: 1.7, step: 0.02 },
      { key: "twinkleOpacityMin", label: "Мерцающие: мин", min: 0, max: 1, step: 0.02 },
      { key: "twinkleOpacityMax", label: "Мерцающие: макс", min: 0, max: 1, step: 0.02 },
    ],
  },
  {
    title: "Ещё · цвета",
    open: false,
    colors: [
      { key: "whiteColor", label: "Основной" },
      { key: "softColor", label: "Мягкий оттенок" },
      { key: "beamColor", label: "Оттенок луча" },
    ],
    sliders: [
      { key: "softFraction", label: "Доля мягкого", min: 0, max: 1, step: 0.02 },
      { key: "beamFraction", label: "Доля луча", min: 0, max: 1, step: 0.02 },
    ],
  },
  {
    title: "Ещё · плеяды",
    open: false,
    sliders: [
      { key: "pleiadesOffsetX", label: "Сдвиг по X", min: -40, max: 40, step: 0.5 },
      { key: "pleiadesOffsetY", label: "Сдвиг по Y", min: -40, max: 40, step: 0.5 },
      { key: "nodeOpacity", label: "Яркость", min: 0, max: 1, step: 0.02 },
      { key: "nodeBreathePeak", label: "Яркость на пике", min: 0, max: 1, step: 0.02 },
      { key: "nodeGlowBlur", label: "Свечение: радиус", min: 0, max: 18, step: 0.5 },
      { key: "nodeGlowAlpha", label: "Свечение: сила", min: 0, max: 1, step: 0.02 },
    ],
  },
];

function fmt(v: number): string {
  if (Number.isInteger(v)) return String(v);
  return v.toFixed(Math.abs(v) < 1 ? 3 : 2).replace(/0+$/, "").replace(/\.$/, "");
}

export function StarfieldTuner() {
  const { config, setConfig, reset } = useStarfieldConfig();
  const [collapsed, setCollapsed] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  if (!isTuning()) return null;

  const set = <K extends keyof StarfieldConfig>(key: K, value: StarfieldConfig[K]) =>
    setConfig((prev) => ({ ...prev, [key]: value }));

  const toast = (msg: string) => {
    setFlash(msg);
    window.setTimeout(() => setFlash(null), 1600);
  };

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "starfield-config.json";
    a.click();
    URL.revokeObjectURL(url);
    toast("Файл starfield-config.json сохранён");
  };

  const copyJSON = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(config, null, 2));
      toast("JSON скопирован в буфер");
    } catch {
      toast("Не удалось скопировать");
    }
  };

  const onFile = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        setConfig(normalizeConfig(JSON.parse(String(reader.result))));
        toast("Настройки загружены");
      } catch {
        toast("Не удалось прочитать файл");
      }
    };
    reader.readAsText(f);
    e.target.value = "";
  };

  const btn =
    "px-2.5 py-1.5 rounded-md text-[11px] font-medium transition-colors cursor-pointer";

  if (collapsed) {
    return (
      <button
        type="button"
        onClick={() => setCollapsed(false)}
        className="fixed right-4 top-4 z-[9999] rounded-full bg-[#0b0c12]/95 px-3.5 py-2 text-[12px] font-semibold text-white shadow-lg ring-1 ring-white/15 backdrop-blur cursor-pointer"
      >
        ✦ Тюнер
      </button>
    );
  }

  return (
    <div className="fixed right-4 top-4 bottom-4 z-[9999] flex w-[330px] flex-col overflow-hidden rounded-2xl bg-[#0b0c12]/95 text-white shadow-2xl ring-1 ring-white/12 backdrop-blur-md">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-semibold tracking-tight">✦ Starfield Tuner</span>
        </div>
        <button
          type="button"
          onClick={() => setCollapsed(true)}
          className="rounded-md px-2 py-1 text-[11px] text-white/60 hover:bg-white/10 hover:text-white cursor-pointer"
        >
          Свернуть
        </button>
      </div>

      {/* Controls */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {GROUPS.map((g) => (
          <details key={g.title} open={g.open ?? true} className="group mb-2 border-b border-white/5 pb-2">
            <summary className="cursor-pointer list-none py-1 text-[12px] font-semibold text-white/85 marker:content-none select-none">
              <span className="mr-1 inline-block transition-transform group-open:rotate-90">▸</span>
              {g.title}
            </summary>

            <div className="mt-1.5 flex flex-col gap-2.5 pl-1">
              {g.toggles?.map((t) => (
                <label key={t.key} className="flex items-center justify-between gap-2 text-[11px] text-white/70">
                  <span>{t.label}</span>
                  <input
                    type="checkbox"
                    checked={config[t.key] as boolean}
                    onChange={(e) => set(t.key, e.target.checked as StarfieldConfig[typeof t.key])}
                    className="h-3.5 w-3.5 cursor-pointer accent-[#979efe]"
                  />
                </label>
              ))}

              {g.sliders?.map((s) => (
                <div key={s.key}>
                  <div className="mb-0.5 flex items-center justify-between text-[11px]">
                    <span className="text-white/70">{s.label}</span>
                    <span className="tabular-nums text-white/45">{fmt(config[s.key])}</span>
                  </div>
                  <input
                    type="range"
                    min={s.min}
                    max={s.max}
                    step={s.step}
                    value={config[s.key]}
                    onChange={(e) => set(s.key, Number(e.target.value) as StarfieldConfig[typeof s.key])}
                    className="h-1 w-full cursor-pointer appearance-none rounded-full bg-white/15 accent-[#979efe]"
                  />
                </div>
              ))}

              {g.colors?.map((cc) => (
                <label key={cc.key} className="flex items-center justify-between gap-2 text-[11px] text-white/70">
                  <span>{cc.label}</span>
                  <span className="flex items-center gap-1.5">
                    <span className="tabular-nums text-[10px] text-white/40">{config[cc.key] as string}</span>
                    <input
                      type="color"
                      value={config[cc.key] as string}
                      onChange={(e) => set(cc.key, e.target.value as StarfieldConfig[typeof cc.key])}
                      className="h-5 w-8 cursor-pointer rounded border border-white/15 bg-transparent p-0"
                    />
                  </span>
                </label>
              ))}

              {g.seed && (
                <div className="flex items-center justify-between gap-2 text-[11px] text-white/70">
                  <span>Сид (раскладка)</span>
                  <span className="flex items-center gap-1.5">
                    <span className="tabular-nums text-[10px] text-white/40">{config.seed}</span>
                    <button
                      type="button"
                      onClick={() => set("seed", Math.floor(Math.random() * 0xffffffff))}
                      className="rounded-md bg-white/10 px-2 py-1 text-[11px] hover:bg-white/20 cursor-pointer"
                      title="Случайная раскладка"
                    >
                      🎲
                    </button>
                  </span>
                </div>
              )}
            </div>
          </details>
        ))}
      </div>

      {/* Footer actions */}
      <div className="border-t border-white/10 px-4 py-3">
        <div className="grid grid-cols-2 gap-2">
          <button type="button" onClick={exportJSON} className={`${btn} bg-[#979efe] text-[#0b0c12] hover:bg-[#a9aeff]`}>
            ⬇ Экспорт JSON
          </button>
          <button type="button" onClick={() => fileRef.current?.click()} className={`${btn} bg-white/10 hover:bg-white/20`}>
            ⬆ Импорт
          </button>
          <button type="button" onClick={copyJSON} className={`${btn} bg-white/10 hover:bg-white/20`}>
            ⧉ Копировать
          </button>
          <button
            type="button"
            onClick={() => {
              reset();
              toast("Сброшено к дефолту");
            }}
            className={`${btn} bg-white/10 hover:bg-white/20`}
          >
            ↺ Сброс
          </button>
        </div>
        <p className="mt-2 text-[10px] leading-snug text-white/35">
          Настрой → «Экспорт JSON» → пришли файл, и я применю его к сайту.
        </p>
        <input ref={fileRef} type="file" accept="application/json,.json" onChange={onFile} className="hidden" />
      </div>

      {flash && (
        <div className="pointer-events-none absolute bottom-20 left-1/2 -translate-x-1/2 rounded-full bg-black/85 px-3 py-1.5 text-[11px] text-white ring-1 ring-white/15">
          {flash}
        </div>
      )}
    </div>
  );
}

/** Convenience: the default config, handy if you want a "compare to default" later. */
export { DEFAULT_STARFIELD_CONFIG };
