import {
  animate,
  AnimatePresence,
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
  useTransform,
  type MotionValue,
} from "motion/react";
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import imgIconBackend from "figma:asset/icon-backend.svg";
import imgIconFrontend from "figma:asset/icon-frontend.svg";
import imgIconAnalytics from "figma:asset/icon-analytics.svg";
import imgIconDevops from "figma:asset/icon-devops.svg";
import imgIconDesign from "figma:asset/icon-design.svg";
import imgIconMobile from "figma:asset/icon-mobile.svg";

interface Pill {
  label: string;
  icon: ReactNode;
  /** Starting angle on the orbit, radians */
  angle: number;
  /** Narrower horizontal padding (long label) */
  compact?: boolean;
  /** Текст тултипа в центре при наведении; ключевые фразы оборачиваем в <Accent> */
  description?: ReactNode;
}

/** Общий текст-заглушка (fallback) — используется, только если у пилла нет description */
const PLACEHOLDER_DESCRIPTION =
  "Настроим корпоративную инфраструктуру под ключ: CI/CD, автоматизация сборки, мониторинг и безопасность.\n\nСистемы работают отказоустойчиво — падение одного сервиса не положит весь продукт.";

/** id центрального тултипа — на него ссылается aria-describedby активного пилла */
const TOOLTIP_ID = "team-direction-tooltip";

/** Синий акцент на ключевой фразе внутри описания (цвет из Figma), обычным начертанием */
function Accent({ children }: { children: ReactNode }) {
  return <span className="text-[#6d90ff]">{children}</span>;
}

/** Even 60° spacing; slot 0 = top (Frontend), clockwise */
const ORBIT_ANGLE_STEP = (2 * Math.PI) / 6;
const orbitAngle = (slot: number) => -Math.PI / 2 + slot * ORBIT_ANGLE_STEP;

const PILLS: Pill[] = [
  {
    label: "Frontend",
    icon: <img alt="" src={imgIconFrontend} className="size-[28px] shrink-0 -scale-x-100 rotate-180" />,
    angle: orbitAngle(0),
    description: (
      <>
        Соберем интерфейс, который <Accent>быстро грузится</Accent> и одинаково работает во всех
        браузерах. Пользователь не ждет, не путается и доходит до покупки без лишних кликов.
      </>
    ),
  },
  {
    label: "Дизайн",
    icon: <img alt="" src={imgIconDesign} className="size-[28px] shrink-0" />,
    angle: orbitAngle(1),
    description: (
      <>
        Спроектируем UX/UI, который <Accent>решает задачи бизнеса</Accent>, а не просто красиво
        выглядит: понятные сценарии, продуманные интерфейсы, единая дизайн-система.
      </>
    ),
  },
  {
    label: "Мобильная разработка",
    icon: <img alt="" src={imgIconMobile} className="size-[28px] shrink-0" />,
    angle: orbitAngle(2),
    compact: true,
    description: (
      <>
        Разработаем нативные или кроссплатформенные приложения под <Accent>iOS и Android</Accent>.
        Быстрые, стабильные, с пушами и офлайн-режимом, готовые к публикации в сторах.
      </>
    ),
  },
  {
    label: "DevOps",
    icon: <img alt="" src={imgIconDevops} className="size-[28px] shrink-0 -scale-x-100 rotate-180" />,
    angle: orbitAngle(3),
    description: (
      <>
        Настроим корпоративную инфраструктуру <Accent>под ключ</Accent>: CI/CD, автоматизация сборки,
        мониторинг и безопасность.{"\n\n"}Системы работают <Accent>отказоустойчиво</Accent> — падение
        одного сервиса не положит весь продукт.
      </>
    ),
  },
  {
    label: "Аналитика",
    icon: <img alt="" src={imgIconAnalytics} className="size-[28px] shrink-0" />,
    angle: orbitAngle(4),
    description: (
      <>
        Найдем слабые места в продукте и воронке, определим целевые действия пользователей и настроим
        сквозную аналитику. В среднем клиенты <Accent>растут в продажах на 30%</Accent>.
      </>
    ),
  },
  {
    label: "Backend",
    icon: <img alt="" src={imgIconBackend} className="size-[28px] shrink-0 -scale-x-100 rotate-180" />,
    angle: orbitAngle(5),
    description: (
      <>
        Построим архитектуру, которая держит нагрузку: сайт не виснет, API отвечает быстро, данные в
        безопасности. Продукт <Accent>масштабируется</Accent> вместе с вашим бизнесом.
      </>
    ),
  },
];

const CONTAINER_W = 1019;
const CONTAINER_H = 458;

const ORBIT = { x: 43, y: 60, w: 937, h: 375 };
const ORBIT_CX = ORBIT.x + ORBIT.w / 2;
const ORBIT_CY = ORBIT.y + ORBIT.h / 2;
const ORBIT_RX = ORBIT.w / 2;
const ORBIT_RY = ORBIT.h / 2;

/** Clockwise from top — matches pill order */
const ORBIT_PATH = `M ${ORBIT_CX} ${ORBIT_CY - ORBIT_RY} A ${ORBIT_RX} ${ORBIT_RY} 0 1 1 ${ORBIT_CX} ${ORBIT_CY + ORBIT_RY} A ${ORBIT_RX} ${ORBIT_RY} 0 1 1 ${ORBIT_CX} ${ORBIT_CY - ORBIT_RY}`;

const ORBIT_DURATION_S = 110;
const ORBIT_RAMP_S = 1.2;
const ENTRANCE_DRAW_S = 1.65;
/** Fast start, gentle finish — no slow ramp-up */
const ENTRANCE_EASE = [0.22, 1, 0.36, 1] as const;
const PILL_FADE = 0.07;
const PILL_COUNT = PILLS.length;

function orbitPoint(angle: number, w: number, h: number) {
  const cx = ORBIT_CX + ORBIT_RX * Math.cos(angle);
  const cy = ORBIT_CY + ORBIT_RY * Math.sin(angle);
  return { x: cx - w / 2, y: cy - h / 2, cx, cy };
}

function pillRevealThreshold(index: number) {
  return index === 0 ? 0.001 : index / PILL_COUNT;
}

function pillRevealAmount(progress: number, threshold: number, done: boolean) {
  if (done) return 1;
  if (progress <= threshold) return 0;
  if (progress >= threshold + PILL_FADE) return 1;
  return (progress - threshold) / PILL_FADE;
}

function OrbitRing({
  entranceProgress,
  entranceDone,
}: {
  entranceProgress: MotionValue<number>;
  entranceDone: boolean;
}) {
  const pathLength = useTransform(entranceProgress, (p) => (entranceDone ? 1 : p));

  return (
    <svg
      className="pointer-events-none absolute inset-0 overflow-visible"
      width={CONTAINER_W}
      height={CONTAINER_H}
      viewBox={`0 0 ${CONTAINER_W} ${CONTAINER_H}`}
      fill="none"
      aria-hidden
    >
      <motion.path
        d={ORBIT_PATH}
        stroke="rgba(3, 3, 3, 0.45)"
        strokeWidth={2}
        strokeLinecap="round"
        fill="none"
        style={{ pathLength }}
      />
    </svg>
  );
}

function PillItem({
  pill,
  index,
  orbitOffset,
  entranceProgress,
  entranceDone,
  isActive,
  onActivate,
}: {
  pill: Pill;
  index: number;
  orbitOffset: MotionValue<number>;
  entranceProgress: MotionValue<number>;
  entranceDone: boolean;
  isActive: boolean;
  onActivate: (index: number | null) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: pill.compact ? 200 : 270, h: 58 });
  const threshold = pillRevealThreshold(index);

  useLayoutEffect(() => {
    if (ref.current) {
      setSize({
        w: ref.current.offsetWidth,
        h: ref.current.offsetHeight,
      });
    }
  }, []);

  const x = useTransform(orbitOffset, (offset) =>
    orbitPoint(pill.angle + offset, size.w, size.h).x,
  );

  const y = useTransform(orbitOffset, (offset) =>
    orbitPoint(pill.angle + offset, size.w, size.h).y,
  );

  const opacity = useTransform(entranceProgress, (p) =>
    pillRevealAmount(p, threshold, entranceDone),
  );

  const scale = useTransform(entranceProgress, (p) => {
    const t = pillRevealAmount(p, threshold, entranceDone);
    return 0.94 + t * 0.06;
  });

  return (
    <motion.div
      className="absolute z-[2] cursor-pointer rounded-[40px] outline-offset-4 will-change-transform focus-visible:outline-2 focus-visible:outline-[#030303]"
      style={{ x, y, opacity, scale }}
      tabIndex={0}
      aria-describedby={isActive ? TOOLTIP_ID : undefined}
      onHoverStart={() => onActivate(index)}
      onHoverEnd={() => onActivate(null)}
      onFocus={() => onActivate(index)}
      onBlur={() => onActivate(null)}
      onKeyDown={(e) => {
        // Escape убирает тултип, возвращая орбиту в движение
        if (e.key === "Escape") e.currentTarget.blur();
      }}
    >
      <div ref={ref}>
        <div
          className={`bg-[#030303] flex gap-[15px] items-center justify-center py-[15px] rounded-[40px] ${
            pill.compact ? "px-[20px]" : "w-[270px]"
          }`}
        >
          {pill.icon}
          <span className="font-['Inter',sans-serif] text-white text-[25px] tracking-[-1px] leading-[99.915%] whitespace-nowrap">
            {pill.label}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

export function Team() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.3, margin: "0px 0px -100px 0px" });
  const reducedMotion = useReducedMotion();
  const orbitOffset = useMotionValue(0);
  const entranceProgress = useMotionValue(0);
  const [orbitActive, setOrbitActive] = useState(false);
  const [entranceDone, setEntranceDone] = useState(false);
  const [orbitReady, setOrbitReady] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const entranceStartedRef = useRef(false);
  /** Накопленное «активное» время разгона, мс (пауза его не сбрасывает) */
  const orbitRampElapsedRef = useRef(0);
  /** Наведение или фокус на пилл ставит орбиту на паузу */
  const paused = activeIndex !== null;

  useEffect(() => {
    if (!inView) {
      setOrbitActive(false);
      return;
    }
    if (orbitReady || entranceDone) {
      setOrbitActive(!reducedMotion);
    }
  }, [inView, orbitReady, entranceDone, reducedMotion]);

  useEffect(() => {
    if (entranceStartedRef.current || !inView) return;
    entranceStartedRef.current = true;

    if (reducedMotion) {
      entranceProgress.set(1);
      setOrbitReady(true);
      setEntranceDone(true);
      return;
    }

    entranceProgress.set(0);
    animate(entranceProgress, 1, {
      duration: ENTRANCE_DRAW_S,
      ease: ENTRANCE_EASE,
      onUpdate: (v) => {
        if (v >= 0.88) setOrbitReady(true);
      },
      onComplete: () => {
        setOrbitReady(true);
        setEntranceDone(true);
      },
    });
  }, [inView, reducedMotion, entranceProgress]);

  useEffect(() => {
    if (!orbitActive || reducedMotion || paused) return;

    let cancelled = false;
    let raf = 0;
    const baseSpeed = (Math.PI * 2) / ORBIT_DURATION_S;
    const rampMs = ORBIT_RAMP_S * 1000;
    let last = performance.now();

    const tick = (now: number) => {
      if (cancelled) return;

      const frameMs = now - last;
      const dt = Math.min(frameMs / 1000, 0.05);
      last = now;

      // Разгон копит только «активное» время: пауза (hover/фокус) его не сбрасывает,
      // поэтому при возобновлении орбита не откатывается к 35% скорости
      let speedFactor = 1;
      if (orbitRampElapsedRef.current < rampMs) {
        orbitRampElapsedRef.current = Math.min(orbitRampElapsedRef.current + frameMs, rampMs);
        const t = orbitRampElapsedRef.current / rampMs;
        const smooth = t * t * (3 - 2 * t);
        speedFactor = 0.35 + 0.65 * smooth;
      }

      orbitOffset.set(orbitOffset.get() + baseSpeed * speedFactor * dt);
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
  }, [orbitActive, reducedMotion, paused, orbitOffset]);

  return (
    <div
      ref={ref}
      className="relative mx-auto"
      style={{ width: CONTAINER_W, height: CONTAINER_H }}
    >
      <OrbitRing entranceProgress={entranceProgress} entranceDone={entranceDone} />
      <motion.h2
        className="pointer-events-none absolute left-[286px] top-[168px] z-[1] w-[450px] text-center font-['Manrope',sans-serif] font-extrabold text-black text-[48px] leading-[1.2]"
        animate={{ opacity: paused ? 0 : 1, scale: paused && !reducedMotion ? 0.98 : 1 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
      >
        В команде есть специалисты всех направлений
      </motion.h2>

      <div
        className="pointer-events-none absolute z-[1] w-[424px] -translate-x-1/2 -translate-y-1/2"
        style={{ left: ORBIT_CX, top: ORBIT_CY }}
      >
        <AnimatePresence>
          {activeIndex !== null && (
            <motion.div
              key="tooltip"
              id={TOOLTIP_ID}
              role="tooltip"
              initial={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 8 }}
              animate={reducedMotion ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
              exit={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 8 }}
              transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
              className="rounded-[24px] bg-[#030303] px-[20px] pt-[18px] pb-[20px] shadow-[0px_12px_32px_0px_rgba(0,0,0,0.25)]"
            >
              <p className="whitespace-pre-wrap font-['Inter',sans-serif] text-[16px] tracking-[-0.64px] leading-[24px] text-white">
                {PILLS[activeIndex].description ?? PLACEHOLDER_DESCRIPTION}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {PILLS.map((pill, index) => (
        <PillItem
          key={pill.label}
          pill={pill}
          index={index}
          orbitOffset={orbitOffset}
          entranceProgress={entranceProgress}
          entranceDone={entranceDone}
          isActive={activeIndex === index}
          onActivate={setActiveIndex}
        />
      ))}
    </div>
  );
}
