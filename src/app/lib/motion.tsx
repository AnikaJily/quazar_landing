import { motion } from "motion/react";
import { type ReactNode } from "react";

export const hoverLift = {
  whileHover: { y: -4, transition: { type: "spring", stiffness: 260, damping: 22 } },
} as const;

export const hoverScale = {
  whileHover: { scale: 1.05, transition: { type: "spring", stiffness: 400, damping: 20 } },
  whileTap: { scale: 0.95 },
} as const;

// AGIMA-style premium easing — fast start, gentle settle (easeOutCirc-ish)
const WAVE_EASE = [0.075, 0.82, 0.165, 1] as const;

export function Wave({
  children,
  delay = 0,
  className,
  amount = 0.15,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  amount?: number;
}) {
  return (
    <motion.div
      className={className}
      initial={{ y: 80, opacity: 0 }}
      whileInView={{ y: 0, opacity: 1 }}
      viewport={{ once: true, amount }}
      transition={{
        y: { duration: 1, ease: WAVE_EASE, delay },
        opacity: { duration: 0.4, ease: "easeOut", delay },
      }}
    >
      {children}
    </motion.div>
  );
}
