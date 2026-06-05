import { useState } from "react";
import { motion } from "motion/react";
import imgPhoneProduct from "figma:asset/phone-product.png";
import { SectionTitle } from "../components/SectionTitle";
import { ArrowIcon } from "../components/ArrowIcon";
import { hoverScale, Wave } from "../lib/motion";

export interface ShowcaseItem {
  title: string;
  description: string;
  image?: string;
}

const CARD_W = 500;
const GAP = 46;
const VISIBLE = 2;

function Card({ title, description, image = imgPhoneProduct }: ShowcaseItem) {
  return (
    <div className="flex flex-col gap-[27px] items-end shrink-0" style={{ width: CARD_W }}>
      <div className="size-[500px] rounded-[15px] overflow-hidden bg-[#1a1d24] relative">
        <img alt="" src={image} className="absolute inset-0 size-full object-cover" />
      </div>
      <div className="flex flex-col gap-[20px] w-full">
        <p className="font-['Manrope:ExtraBold',sans-serif] font-extrabold text-white text-[25px] leading-[99.9%]">
          {title}
        </p>
        <p className="font-['Inter:Regular',sans-serif] text-[#b6bad3] text-[18px] tracking-[-0.72px] leading-[140%]">
          {description}
        </p>
      </div>
    </div>
  );
}

function NavArrow({
  direction,
  tone,
  disabled,
  onClick,
}: {
  direction: "left" | "right";
  tone: "muted" | "solid";
  disabled: boolean;
  onClick: () => void;
}) {
  const bg = tone === "muted" ? "bg-[rgba(242,244,248,0.54)]" : "bg-white";
  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={direction === "left" ? "Назад" : "Вперёд"}
      className={`${bg} size-[50px] rounded-full flex items-center justify-center transition-opacity ${
        disabled ? "opacity-40 cursor-default" : "cursor-pointer"
      }`}
      {...(disabled ? {} : hoverScale)}
    >
      <div className={direction === "left" ? "rotate-180" : ""}>
        <ArrowIcon size={20} fill="#030303" />
      </div>
    </motion.button>
  );
}

export function Showcase({
  title,
  items,
  arrowTone = "muted",
}: {
  title: string;
  items: ShowcaseItem[];
  arrowTone?: "muted" | "solid";
}) {
  const [page, setPage] = useState(0);
  const maxPage = Math.max(0, items.length - VISIBLE);
  const canPrev = page > 0;
  const canNext = page < maxPage;

  return (
    <div className="flex flex-col gap-[40px] items-start w-[1152px]">
      <Wave className="w-full">
        <div className="flex items-center justify-between w-full">
          <SectionTitle className="text-white">{title}</SectionTitle>
          <div className="flex gap-[10px] items-center">
            <NavArrow
              direction="left"
              tone={arrowTone}
              disabled={!canPrev}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
            />
            <NavArrow
              direction="right"
              tone={arrowTone}
              disabled={!canNext}
              onClick={() => setPage((p) => Math.min(maxPage, p + 1))}
            />
          </div>
        </div>
      </Wave>
      <div className="relative overflow-hidden -mr-[360px]">
        <motion.div
          className="flex"
          style={{ gap: GAP }}
          animate={{ x: -page * (CARD_W + GAP) }}
          transition={{ type: "spring", stiffness: 180, damping: 26 }}
        >
          {items.map((item, i) => (
            <Wave key={i} delay={0.08 + i * 0.08}>
              <Card {...item} />
            </Wave>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
