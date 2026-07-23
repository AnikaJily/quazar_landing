# Starfield — «Cartographer's echo»

Декоративное звёздное поле для тёмных зон лендинга: **Hero** (под лучом WebGL-квазара) и **Footer** (проще — без луча и плеяд). Мерцающие звёзды, синеватое «квазарное» свечение, редкие 4-лучевые вспышки-крестики, опциональные скопления Плеяд, плёнка-grain (живёт в `Hero.tsx`) и поддержка `prefers-reduced-motion`.

**Ключевые свойства (не ломать при правках):**

- **Детерминизм** — один и тот же `seed` → одно и то же небо. Звёзды — это обычные абсолютно спозиционированные DOM-`<span>`.
- **Вся анимация — на CSS** (keyframes + CSS-переменные). Ни одного пересчёта в JS на кадр, нет canvas, нет сети, нет внешних ассетов.
- **Только композитор** — анимируются исключительно `opacity` и `transform`.
- **Настраивается вживую** через `?tune` (только в dev). Прод-посетители получают фиксированный дефолт и не платят за тюнер (он вырезается из сборки).

---

## Карта файлов (`app/starfield/`)

| Файл | Что внутри |
|---|---|
| `index.ts` | Публичный barrel-экспорт. Импортируй из `"../starfield"`, а не из отдельных файлов. |
| `starfieldConfig.tsx` | Тип `StarfieldConfig` (все «ручки»), `DEFAULT_STARFIELD_CONFIG` (**сюда вставляются экспорты из тюнера**), `FOOTER_STARFIELD_CONFIG`, `hexToRgbTriplet`, `normalizeConfig` (безопасный импорт), React-контекст + `StarfieldConfigProvider`, `isTuning()`. |
| `Starfield.tsx` | `mulberry32` (PRNG), `buildField` (генерация в два прохода), `placeCenters`/`buildClusters` (Плеяды), компонент `Starfield`, вся раздача CSS-переменных. Импортирует свой `./starfield.css`. |
| `StarfieldTuner.tsx` | Панель `?tune`: `GROUPS` (слайдеры/цвета/переключатели), экспорт/копирование/импорт JSON, рандомайзер сида. |
| `starfield.css` | Все `.kvz-*` правила, `@keyframes` (`kvz-twinkle` / `kvz-flare-cross` / `kvz-node-breathe`), `.kvz-nebula` и свой блок `@media (prefers-reduced-motion)`. |
| `beamGeometry.ts` | Геометрия диагонального луча (`BEAM`, `distToBeam`, `inCore`). `BEAM` **выводится** из `SHADER_BEAM` (`components/kvazarBeam.ts`) — см. «Связь с лучом». |

**Внешние точки:** `app/components/KvazarShader.tsx` рисует WebGL-луч; `App.tsx` оборачивает всё в `StarfieldConfigProvider` и монтирует тюнер только в dev; `Hero.tsx` и `Footer.tsx` — две точки использования.

---

## Быстрый старт / интеграция

```tsx
// 1. Один раз обернуть приложение (уже сделано в App.tsx):
<StarfieldConfigProvider>
  <App />
</StarfieldConfigProvider>

// 2. Вставить поле первым ребёнком тёмной секции с position:relative,
//    а контент поднять над ним через z-10:
<section className="relative ...">
  <Starfield className="z-0" />
  <div className="relative z-10">…контент…</div>
</section>
```

- Без `<StarfieldConfigProvider>` компонент молча берёт `DEFAULT_STARFIELD_CONFIG` (ошибки не будет), и тюнер на него не влияет.
- `starfield.css` подключать отдельно **не нужно** — его импортирует сам `Starfield.tsx` (в отличие от grain-оверлея ниже, который переносится руками).
- `Starfield` сам по себе `absolute inset-x-0 top-0`, `pointer-events-none`, `aria-hidden`.
- **Приоритет конфига:** проп `config` → контекст → `DEFAULT`. Передай `config={SOME_CONFIG}`, чтобы зафиксировать вид (Footer передаёт `FOOTER_STARFIELD_CONFIG` и потому **не тюнится** вживую).
- **Уход под следующую секцию:** пропы `heroPx={высота_секции_px}` + `bleedBottom={px}` (в Hero: `heroPx={796}` под `h-[796px]`, `bleedBottom={150}`). `heroPx` обязан совпадать с высотой секции, иначе обход луча смещается.
- **Плёнка-grain НЕ входит в компонент** — это отдельный оверлей в `Hero.tsx:23-31`, по z-слою между шейдером (`z-10`) и контентом (`z-30`), над `Starfield` (`z-0`). Если переиспользуешь `Starfield` в тёмной секции и хочешь ту же «плёнку» — скопируй его руками (иначе вид будет «чище»). Готовый фрагмент:

```tsx
{/* film grain — над звёздами/шейдером, под контентом; bottom повторяет bleedBottom */}
<div
  className="absolute inset-x-0 top-0 z-20 pointer-events-none mix-blend-soft-light opacity-[0.6]"
  style={{
    bottom: -150, // = bleedBottom, чтобы плёнка накрыла тот же вылет, что и звёзды
    backgroundImage:
      "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='150' height='150'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23g)'/%3E%3C/svg%3E\")",
    backgroundSize: "150px 150px",
  }}
/>
```

---

## Справочник конфига

Группы соответствуют комментариям в типе `StarfieldConfig`:

| Группа | Ключи |
|---|---|
| Поле / распределение | `seed`, `count`, `minGap`, `edgeBias`, `avoidBeam`, `corridor` |
| Мерцание | `twinkleFraction`, `twinklePeakBoost`, `twinkleScale`, `speed` |
| Вспышки | `flareCount`, `flarePeriod` |
| Размер / яркость | `sizeSmall/Mid/Large`, `staticOpacityMin/Max`, `twinkleOpacityMin/Max`, `glowBlur`, `glowAlpha` |
| Цвета | `whiteColor`, `softColor`, `beamColor`, `softFraction`, `beamFraction` |
| Плеяды | `pleiades`, `pleiadesCount`, `pleiadesStars`, `nebulaOpacity`, `pleiadesSpread`, `pleiadesOffsetX/Y`, `nodeScale`, `nodeOpacity`, `nodeBreathePeak`, `nodeGlowBlur`, `nodeGlowAlpha` |

Полезно знать:

- **POSITION-ручки** (проход 1: `seed`, `count`, `minGap`, `edgeBias`, `avoidBeam`, `corridor`) vs **LOOK-ручки** (всё остальное). Только position-ручки пересобирают раскладку неба — это специально (см. «Генерация в два прохода»).
- Жёсткие лимиты в коде, которые тюнер показывает не полностью: `pleiadesCount` зажат `0..6` в `placeCenters`, `pleiadesStars` — `1..20` в `buildClusters`.
- `softColor` используется дважды: мягкий оттенок части звёзд **и** цвет узлов Плеяд.
- **Плеяды в текущем сайте выключены** (`pleiades: false` и в DEFAULT, и в FOOTER). Включи «Показывать плеяды» в `?tune`, чтобы увидеть скопления.

---

## Воркфлоу тюнера (настроить → экспорт → применить)

1. Открой сайт локально с `?tune` (панель есть **только в dev**-сборке и **только** с этим параметром).
2. Крути ручки — всё меняется вживую. Правки сохраняются в `localStorage` (`kvz-starfield-config`), поэтому переживают перезагрузку. Убери `?tune` — сессия сбрасывается к дефолту из кода.
3. **Экспорт JSON** (скачивает `starfield-config.json`) или **Копировать**.
4. **Применение — вручную:** вставь значения из JSON в `DEFAULT_STARFIELD_CONFIG` (`starfieldConfig.tsx`). Автоматизации нет. Кнопка «Импорт» грузит JSON только в живую сессию, не в исходник.
   > ⚠️ `DEFAULT_STARFIELD_CONFIG` — это конфиг **Hero** (он рендерит `Starfield` без пропа `config`). Правя `DEFAULT`, ты меняешь и Hero. Настраиваешь **другую** секцию — не трогай `DEFAULT`: заведи свою константу по образцу футера и передай её пропом.
   >
   > ```tsx
   > export const REVIEWS_STARFIELD_CONFIG: StarfieldConfig = {
   >   ...DEFAULT_STARFIELD_CONFIG,
   >   seed: 12345,
   >   count: 40,
   > };
   > // <Starfield config={REVIEWS_STARFIELD_CONFIG} className="z-0" />
   > ```
   > Секция без пропа `config` тюнится из общего контекста **вместе с Hero** — для отдельной настройки заведи ей свою константу.
5. Футер тюнить вживую нельзя (он передаёт `FOOTER_STARFIELD_CONFIG` напрямую) — правь эту константу.

---

## Как устроена анимация (контракт CSS-переменных)

React выставляет переменные → `starfield.css` описывает keyframes → JS на кадр не работает. Два пространства имён:

- **`--sf-*`** — задаются один раз на корневой обёртке (общие: `--sf-twinkle-peak/scale`, `--sf-glow-blur/alpha/tone`, `--sf-flare-dur`, `--sf-node-op/peak/glow-blur/glow-alpha`).
- **`--kvz-*`** — на каждой звезде (`tone/base/peak/dur/delay`) и каждом узле (`tone/ndur/delay`).

Keyframes:
- `kvz-twinkle` — плавный подъём `opacity` + лёгкий `scale` (используют и мерцающие, и вспышки).
- `kvz-flare-cross` — 4-лучевой крестик на `::before`, невиден почти весь цикл, вспыхивает на пике.
- `kvz-node-breathe` — узлы Плеяд «дышат» на одном медленном общем периоде.

Тайминги: все мерцающие звёзды делят **один** период `TWINKLE_BASE / speed` (`TWINKLE_BASE = 5s`), но с **случайной отрицательной задержкой** у каждой → сверкают вразнобой, не одновременно. Узлы — `NODE_PERIOD / speed` (12s), крестик — `flarePeriod / speed`. Свечение (`box-shadow` + `radial-gradient`) **статичное**, специально не анимируется — так дешевле.

> В каждом `var()` fallback совпадает с дефолтом из конфига (`--sf-twinkle-peak` = 0.5, `--sf-glow-alpha` = 0.5, `--sf-node-op` = 0.8 …) — это лишь подстраховка: реальные значения всегда приходят из React (`rootVars` в `Starfield.tsx`), fallback виден, только если переменная не задана. **Два исключения:** `--sf-glow-tone` подставляет цепочку `var(--kvz-tone)`, а не число; `--sf-flare-dur` хранит `flarePeriod / speed` (уже поделённое на скорость), а не сырой период. Меняешь семантику ключа — синхронизируй и fallback.

---

## Генерация в два прохода (внутренности)

`buildField` строит поле двумя **независимыми** сид-потоками:

- **Проход 1 — позиции** (`mulberry32(c.seed)`): rejection sampling с прижимом к краям, `minGap` против скучивания и (если `avoidBeam`) вырезанием коридора луча + ядра. Зависит **только** от layout-ручек.
- **Проход 2 — стиль** (`mulberry32(c.seed ^ 0x9e3779b9)`): reservoir-выбор делает `twinkleFraction`/`softFraction`/`beamFraction` линейными, а `flareCount` — **точным** (не теряется на неудачном сиде).

> **Не сливать потоки и не менять порядок чтений PRNG** — иначе настройка внешнего вида начнёт пересобирать позиции и сломается детерминизм.

Плеяды: `placeCenters` (`seed ^ 0x00c0ffee`) держит скопления вдоль луча, но вне ядра; `buildClusters` рассыпает звёзды гауссом (Box–Muller) вокруг яркого центра. `heroFraction = heroPx / (heroPx + bleedBottom)` масштабирует `y`, чтобы геометрия луча применялась только к верхней (hero) части, когда поле уходит вниз.

---

## Связь с лучом

Числа луча живут в **одном месте** — `app/components/kvazarBeam.ts` (`SHADER_BEAM`). Оттуда их читают обе стороны: шейдер `KvazarShader.tsx` интерполирует их прямо в GLSL, а `beamGeometry.ts` **выводит** из них экранный `BEAM`:

- шейдер работает в uv (y вверх), поле — в экранных координатах (y вниз);
- отсюда `cy = 1 − shader.cy` и смена знака у y-направления → «/» диагональ (та, что видно).

> **Правило сопровождения:** хочешь сдвинуть/повернуть луч — правь только `SHADER_BEAM`, шейдер и обход луча звёздами подстроятся сами (раньше эти числа копировались руками в два места и молча расходились). Единственное, что осталось «на глаз», — радиусы эллипса `inCore` в `beamGeometry.ts`: меняешь толщину луча — перепроверь их.

---

## Reduced motion, производительность, прод

- **Reduced motion** целиком в `starfield.css` (`@media prefers-reduced-motion`): `animation: none` везде; мерцающие замирают на `base + peak*0.5`, узлы — на середине между `node-op` и `node-peak`, крестик прячется. Без `matchMedia`/JS. `calc()` повторяет семантику конфига — обнови, если меняешь её.
- **Перф:** анимируются только `opacity`/`transform`; `will-change` — только на анимируемых элементах; свечение статично; количество умеренное (70 hero / 34 footer); генерация мемоизирована (`useMemo` по конфигу + `heroFraction`).
- **Прод:** `StarfieldTuner` под `import.meta.env.DEV` → вырезается из сборки; без `?tune` в `localStorage` ничего не пишется; посетитель всегда получает `DEFAULT` (или `FOOTER`) конфиг.
- `normalizeConfig` (при восстановлении из `localStorage` и импорте файла) молча отбрасывает неизвестные/битые поля и не-hex цвета — руками отредактированный JSON импортировать безопасно, но плохие значения тихо исчезнут.
