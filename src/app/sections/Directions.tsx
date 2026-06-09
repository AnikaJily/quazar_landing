import { motion } from "motion/react";
import { type ReactNode } from "react";
import imgIconWeb from "figma:asset/icon-web.svg";
import imgIconCorp from "figma:asset/icon-corp.svg";
import imgDirectionMobile from "figma:asset/direction_mobile.svg";
import { SectionTitle } from "../components/SectionTitle";
import { Wave, hoverLift } from "../lib/motion";

interface Direction {
  title: string;
  tags: string[];
  icon: ReactNode;
}

const DIRECTIONS: Direction[] = [
  {
    title: "Веб-приложения\nи платформы",
    tags: ["Личные кабинеты", "SaaS-сервисы", "Маркетплейсы", "B2B-порталы"],
    icon: <img alt="" src={imgIconWeb} className="size-[45px] object-contain" />,
  },
  {
    title: "Корпоративные системы",
    tags: ["ERP и учёт", "CRM-системы", "Интеграции с 1С"],
    icon: <img alt="" src={imgIconCorp} className="size-[45px] object-contain" />,
  },
  {
    title: "Мобильные приложения",
    tags: ["iOS", "Android"],
    icon: <img alt="" src={imgDirectionMobile} className="size-[45px] object-contain" />,
  },
];

function Tag({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center justify-center rounded-[40px] whitespace-nowrap select-none bg-[#e6ebf5] text-[#030303] px-[15px] py-[12px] text-[16px] tracking-[-0.64px] font-['Inter:Regular',sans-serif] font-normal leading-[99.915%] cursor-default">
      <span className="[text-box-edge:cap_alphabetic] [text-box-trim:trim-both]">{children}</span>
    </span>
  );
}

function DirectionCard({ title, tags, icon }: Direction) {
  return (
    <motion.div
      className="bg-white relative rounded-[20px] w-[356px] h-[331px] flex flex-col items-center overflow-hidden"
      {...hoverLift}
    >
      <div className="h-[80px] w-full flex items-center px-[16px] shrink-0">{icon}</div>
      <div className="flex-1 w-full flex flex-col items-end justify-between pb-[15px] px-[15px]">
        <div className="font-['Manrope:ExtraBold',sans-serif] font-extrabold text-[#030303] text-[25px] leading-[99.9%] w-full whitespace-pre-line">
          {title}
        </div>
        <div className="flex flex-wrap gap-[10px] w-full">
          {tags.map((tag) => (
            <Tag key={tag}>{tag}</Tag>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

export function Directions() {
  return (
    <div className="flex flex-col gap-[50px] items-start w-[1152px] relative z-10">
      <Wave>
        <SectionTitle className="text-[#030303]">Направления</SectionTitle>
      </Wave>
      <div className="flex items-start justify-between w-full">
        {DIRECTIONS.map((d, i) => (
          <Wave key={d.title} delay={0.08 + i * 0.08}>
            <DirectionCard {...d} />
          </Wave>
        ))}
      </div>
    </div>
  );
}
