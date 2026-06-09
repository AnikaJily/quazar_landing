import { motion } from "motion/react";
import { cva, type VariantProps } from "class-variance-authority";
import { type ReactNode } from "react";
import { cn } from "../lib/cn";
import { hoverScale } from "../lib/motion";

const pill = cva(
  "group inline-flex items-center justify-center rounded-[40px] whitespace-nowrap select-none cursor-pointer font-['Inter:Regular',sans-serif] font-normal leading-[99.915%]",
  {
    variants: {
      tone: {
        light: "bg-white text-[#030303]",
        dark: "bg-[#030303] text-white",
        glass: "bg-white/15 backdrop-blur-sm text-white border border-white/20",
        glassMuted: "bg-white/15 backdrop-blur-sm text-[#b9b9b9] border border-white/20",
      },
      size: {
        sm: "px-[12px] py-[9px] text-[14px] tracking-[-0.56px] gap-[6px]",
        md: "px-[16px] py-[11px] text-[16px] tracking-[-0.64px] gap-[7px]",
      },
    },
    defaultVariants: { tone: "light", size: "md" },
  },
);

type Variants = VariantProps<typeof pill>;

export interface PillButtonProps extends Variants {
  children: ReactNode;
  trailing?: ReactNode;
  as?: "button" | "a";
  href?: string;
  className?: string;
  type?: "button" | "submit";
  onClick?: () => void;
}

export function PillButton({
  children,
  trailing,
  as = "button",
  className,
  ...rest
}: PillButtonProps) {
  const Tag = as === "a" ? motion.a : motion.button;
  return (
    <Tag
      className={cn(pill({ tone: rest.tone, size: rest.size }), className)}
      {...hoverScale}
      type={as === "button" ? rest.type ?? "button" : undefined}
      href={rest.href}
      onClick={rest.onClick}
    >
      {children}
      {trailing && (
        <span className="inline-flex transition-transform duration-300 ease-out group-hover:translate-x-[3px]">
          {trailing}
        </span>
      )}
    </Tag>
  );
}
