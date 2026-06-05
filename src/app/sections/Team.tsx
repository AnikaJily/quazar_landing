import { motion, useInView } from "motion/react";
import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import imgIconBackend from "figma:asset/icon-backend.svg";
import imgIconFrontend from "figma:asset/icon-frontend.svg";
import imgIconAnalytics from "figma:asset/icon-analytics.svg";
import imgIconDevops from "figma:asset/icon-devops.svg";
import imgIconDesign from "figma:asset/icon-design.svg";
import { MobileIcon } from "../components/MobileIcon";

interface Pill {
  label: string;
  icon: ReactNode;
  /** Position within the 868×366 container, in px */
  x: number;
  y: number;
}

const PILLS: Pill[] = [
  { label: "Backend",               icon: <img alt="" src={imgIconBackend}   className="size-[28px] shrink-0" style={{ transform: "scaleY(-1)" }} />, x:  55, y:  48 },
  { label: "Frontend",              icon: <img alt="" src={imgIconFrontend}  className="size-[28px] shrink-0" />, x: 355, y:   0 },
  { label: "Аналитика",             icon: <img alt="" src={imgIconAnalytics} className="size-[28px] shrink-0" />, x:   0, y: 209 },
  { label: "Дизайн",                icon: <img alt="" src={imgIconDesign}    className="size-[28px] shrink-0" />, x: 671, y:  43 },
  { label: "DevOps",                icon: <img alt="" src={imgIconDevops}    className="size-[28px] shrink-0" />, x: 692, y: 200 },
  { label: "Мобильные приложения",  icon: <MobileIcon fit={28} stroke="#6D90FF" strokeWidth={4} className="shrink-0" />, x: 266, y: 308 },
];

const CONTAINER_W = 868;
const CONTAINER_H = 366;
const ORIGIN_X = CONTAINER_W / 2;
const ORIGIN_Y = CONTAINER_H / 2;

function PillItem({
  pill,
  inView,
}: {
  pill: Pill;
  inView: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [meta, setMeta] = useState<{ dx: number; dy: number; w: number; h: number } | null>(null);
  const [hovered, setHovered] = useState(false);

  useLayoutEffect(() => {
    if (ref.current) {
      const w = ref.current.offsetWidth;
      const h = ref.current.offsetHeight;
      setMeta({ dx: pill.x + w / 2 - ORIGIN_X, dy: pill.y + h / 2 - ORIGIN_Y, w, h });
    }
  }, [pill.x, pill.y]);

  const collapsed = meta
    ? { x: -meta.dx, y: -meta.dy, opacity: 0, scale: 0.3 }
    : { opacity: 0 };
  const expanded = { x: 0, y: 0, opacity: 1, scale: 1 };
  const pulled = meta
    ? { x: -meta.dx * 0.2, y: -meta.dy * 0.2, opacity: 1, scale: 0.97 }
    : { opacity: 1 };

  return (
    <div
      className="absolute"
      style={{
        left: pill.x,
        top: pill.y,
        width: meta?.w,
        height: meta?.h,
      }}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
    >
      <motion.div
        key={meta ? "measured" : "pre"}
        ref={ref}
        initial={collapsed}
        animate={meta ? (inView ? (hovered ? pulled : expanded) : collapsed) : { opacity: 0 }}
        transition={{
          type: "spring",
          stiffness: 80,
          damping: 13,
          mass: 1,
        }}
      >
        <div className="bg-[#030303] flex gap-[15px] items-center justify-center px-[22px] py-[15px] rounded-[40px]">
          {pill.icon}
          <span className="font-['Inter:Regular',sans-serif] text-white text-[25px] tracking-[-1px] leading-[99.915%]">
            {pill.label}
          </span>
        </div>
      </motion.div>
    </div>
  );
}

export function Team() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.3, margin: "0px 0px -100px 0px" });

  return (
    <div
      ref={ref}
      className="relative mx-auto"
      style={{ width: CONTAINER_W, height: CONTAINER_H }}
    >
      <h2 className="absolute left-1/2 top-[101px] -translate-x-1/2 w-[458px] text-center font-['Manrope:ExtraBold',sans-serif] font-extrabold text-black text-[48px] leading-[1.18]">
        В команде есть специалисты всех направлений
      </h2>
      {PILLS.map((pill) => (
        <PillItem key={pill.label} pill={pill} inView={inView} />
      ))}
    </div>
  );
}
