import { motion } from "motion/react";
import { cva, type VariantProps } from "class-variance-authority";
import { type ReactNode } from "react";
import { cn } from "../lib/cn";
import { hoverScale } from "../lib/motion";

const pill = cva(
  "inline-flex items-center justify-center rounded-[40px] whitespace-nowrap select-none cursor-pointer font-['Inter:Regular',sans-serif] font-normal leading-[99.915%]",
  {
    variants: {
      tone: {
        light: "bg-white text-[#030303]",
        dark: "bg-[#030303] text-white",
        glass: "bg-white/15 backdrop-blur-sm text-white",
        glassMuted: "bg-white/15 backdrop-blur-sm text-[#d8dae2]",
        tag: "bg-[#e6ebf5] text-[#030303]",
      },
      size: {
        sm: "px-[15px] py-[12px] text-[14px] tracking-[-0.56px] gap-[10px]",
        md: "px-[22px] py-[15px] text-[16px] tracking-[-0.64px] gap-[10px]",
        team: "px-[22px] py-[15px] text-[25px] tracking-[-1px] gap-[15px]",
        tag: "px-[15px] py-[12px] text-[16px] tracking-[-0.64px]",
      },
    },
    defaultVariants: { tone: "light", size: "md" },
  },
);

type Variants = VariantProps<typeof pill>;

export interface PillButtonProps extends Variants {
  children: ReactNode;
  trailing?: ReactNode;
  leading?: ReactNode;
  as?: "button" | "a";
  href?: string;
  className?: string;
  type?: "button" | "submit";
  onClick?: () => void;
}

export function PillButton({
  children,
  trailing,
  leading,
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
      {leading}
      <span className="[text-box-edge:cap_alphabetic] [text-box-trim:trim-both]">
        {children}
      </span>
      {trailing}
    </Tag>
  );
}
