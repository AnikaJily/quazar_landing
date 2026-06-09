import {
  animate,
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
}

/** Even 60° spacing; slot 0 = top (Frontend), clockwise */
const ORBIT_ANGLE_STEP = (2 * Math.PI) / 6;
const orbitAngle = (slot: number) => -Math.PI / 2 + slot * ORBIT_ANGLE_STEP;

const PILLS: Pill[] = [
  { label: "Frontend",             icon: <img alt="" src={imgIconFrontend}  className="size-[28px] shrink-0 -scale-x-100 rotate-180" />, angle: orbitAngle(0) },
  { label: "Дизайн",               icon: <img alt="" src={imgIconDesign}    className="size-[28px] shrink-0" />, angle: orbitAngle(1) },
  { label: "Мобильная разработка", icon: <img alt="" src={imgIconMobile} className="size-[28px] shrink-0" />, angle: orbitAngle(2), compact: true },
  { label: "DevOps",               icon: <img alt="" src={imgIconDevops}    className="size-[28px] shrink-0 -scale-x-100 rotate-180" />, angle: orbitAngle(3) },
  { label: "Аналитика",            icon: <img alt="" src={imgIconAnalytics} className="size-[28px] shrink-0" />, angle: orbitAngle(4) },
  { label: "Backend",              icon: <img alt="" src={imgIconBackend}   className="size-[28px] shrink-0 -scale-x-100 rotate-180" />, angle: orbitAngle(5) },
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
}: {
  pill: Pill;
  index: number;
  orbitOffset: MotionValue<number>;
  entranceProgress: MotionValue<number>;
  entranceDone: boolean;
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
    <motion.div className="absolute z-[2] will-change-transform" style={{ x, y, opacity, scale }}>
      <div ref={ref}>
        <div
          className={`bg-[#030303] flex gap-[15px] items-center justify-center py-[15px] rounded-[40px] ${
            pill.compact ? "px-[20px]" : "w-[270px]"
          }`}
        >
          {pill.icon}
          <span className="font-['Inter:Regular',sans-serif] text-white text-[25px] tracking-[-1px] leading-[99.915%] whitespace-nowrap">
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
  const entranceStartedRef = useRef(false);
  const orbitRampDoneRef = useRef(false);

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
    if (!orbitActive || reducedMotion) return;

    let cancelled = false;
    let raf = 0;
    const baseSpeed = (Math.PI * 2) / ORBIT_DURATION_S;
    const rampMs = ORBIT_RAMP_S * 1000;
    const rampDone = orbitRampDoneRef.current;
    let last = performance.now();
    const startedAt = performance.now();

    const tick = (now: number) => {
      if (cancelled) return;

      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;

      let speedFactor = 1;
      if (!rampDone) {
        const t = Math.min((now - startedAt) / rampMs, 1);
        const smooth = t * t * (3 - 2 * t);
        speedFactor = 0.35 + 0.65 * smooth;
        if (t >= 1) orbitRampDoneRef.current = true;
      }

      orbitOffset.set(orbitOffset.get() + baseSpeed * speedFactor * dt);
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
  }, [orbitActive, reducedMotion, orbitOffset]);

  return (
    <div
      ref={ref}
      className="relative mx-auto"
      style={{ width: CONTAINER_W, height: CONTAINER_H }}
    >
      <OrbitRing entranceProgress={entranceProgress} entranceDone={entranceDone} />
      <h2 className="absolute left-[286px] top-[168px] z-[1] w-[450px] text-center font-['Manrope:ExtraBold',sans-serif] font-extrabold text-black text-[48px] leading-[1.2]">
        В команде есть специалисты всех направлений
      </h2>
      {PILLS.map((pill, index) => (
        <PillItem
          key={pill.label}
          pill={pill}
          index={index}
          orbitOffset={orbitOffset}
          entranceProgress={entranceProgress}
          entranceDone={entranceDone}
        />
      ))}
    </div>
  );
}
