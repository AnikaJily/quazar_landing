import { motion } from "motion/react";
import { type ReactNode } from "react";
import imgCycleFullShape from "figma:asset/cycle-full-shape.png";
import imgCycleFullX from "figma:asset/cycle-full-x.png";
import imgCycleStageShape from "figma:asset/cycle-stage-shape.png";
import { SectionTitle } from "../components/SectionTitle";
import { PillButton } from "../components/PillButton";
import { ArrowIcon } from "../components/ArrowIcon";
import { hoverLift, Wave } from "../lib/motion";

interface CycleCardData {
  title: string;
  subtitle: string;
  bullets: string[];
  decoration: ReactNode;
}

const CARDS: CycleCardData[] = [
  {
    title: "Полный цикл",
    subtitle: "Берем проекты с нуля",
    bullets: [
      "На все этапы одна команда, без передачи подрядчикам",
      "Фиксированные сроки и бюджет",
      "Всегда на связи",
      "Все материалы остаются у вас",
    ],
    decoration: (
      <div className="absolute left-[233px] top-[-19px] w-[200.21px] h-[217px] pointer-events-none">
        <img
          alt=""
          src={imgCycleFullShape}
          className="absolute left-[7.8px] top-[0.73px] w-[159.635px] h-[155.175px] object-contain"
        />
        <motion.img
          alt=""
          src={imgCycleFullX}
          className="absolute left-[72.1px] top-[100.21px] size-[105.322px] object-cover"
          initial={{ x: 60, y: 50, rotate: 7.04, opacity: 0 }}
          whileInView={{ x: 0, y: 0, rotate: 7.04, opacity: 1 }}
          viewport={{ once: true, amount: 0.05 }}
          transition={{
            duration: 1.4,
            ease: [0.22, 0.61, 0.36, 1],
            delay: 0.25,
            opacity: { duration: 0.4, ease: "easeOut", delay: 0.25 },
          }}
        />
      </div>
    ),
  },
  {
    title: "Отдельный этап",
    subtitle: "Подключимся на нужном этапе",
    bullets: [
      "Закрываем одну задачу: аналитика, дизайн, разработка, тестирование или поддержка",
      "Работаем с учетом предыдущих этапов и планов на будущее",
      "Фиксированные сроки и бюджет",
      "Всегда на связи",
      "Все материалы остаются у вас",
    ],
    decoration: (
      <div className="absolute left-[233px] top-[-19px] w-[200.21px] h-[217px] pointer-events-none">
        <img
          alt=""
          src={imgCycleStageShape}
          className="absolute left-[7.8px] top-[0.73px] w-[159.635px] h-[155.175px] object-contain"
        />
        <motion.img
          alt=""
          src={imgCycleFullX}
          className="absolute left-[72.1px] top-[100.21px] size-[105.322px] object-cover"
          initial={{ x: 60, y: 50, rotate: 7.04, opacity: 0 }}
          whileInView={{ x: 0, y: 0, rotate: 7.04, opacity: 1 }}
          viewport={{ once: true, amount: 0.05 }}
          transition={{
            duration: 1.4,
            ease: [0.22, 0.61, 0.36, 1],
            delay: 0.65,
            opacity: { duration: 0.4, ease: "easeOut", delay: 0.65 },
          }}
        />
      </div>
    ),
  },
];

function CycleCard({ title, subtitle, bullets, decoration }: CycleCardData) {
  return (
    <motion.div
      className="bg-white rounded-[30px] p-[20px] w-[464px] h-[551px] flex flex-col gap-[50px] overflow-hidden"
      {...hoverLift}
    >
      <div className="bg-[#e6ebf5] rounded-[10px] h-[172px] w-full relative overflow-hidden shrink-0">
        {decoration}
        <div className="absolute bottom-[19.71px] left-[20px] flex flex-col gap-[15px] text-[#030303]">
          <p className="font-['Manrope:ExtraBold',sans-serif] font-extrabold text-[25px] leading-[99.9%]">
            {title}
          </p>
          <p className="font-['Inter:Regular',sans-serif] text-[18px] leading-[99.9%] tracking-[-0.54px]">
            {subtitle}
          </p>
        </div>
      </div>
      <div className="flex flex-col gap-[25px] w-full">
        <p className="font-['Inter:Regular',sans-serif] text-[18px] text-[rgba(3,3,3,0.5)] leading-[99.9%] tracking-[-0.54px]">
          Как мы работаем
        </p>
        <ul className="flex flex-col gap-[15px] w-full">
          {bullets.map((text) => (
            <li key={text} className="flex gap-[10px] items-start">
              <span className="shrink-0 mt-[5px] block size-[8px] rounded-full bg-[#4774BC]" />
              <span className="font-['Inter:Regular',sans-serif] text-[18px] text-black leading-[120%] tracking-[-0.54px]">
                {text}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </motion.div>
  );
}

export function Cycle() {
  return (
    <div className="flex flex-col gap-[40px] items-center w-[963px]">
      <Wave>
        <div className="flex flex-col gap-[25px] items-center text-[#030303] text-center">
          <SectionTitle>Весь цикл или один этап — решаете вы</SectionTitle>
          <p className="font-['Inter:Regular',sans-serif] text-[18px] tracking-[-0.72px] leading-[99.9%]">
            Можем взять проект с нуля или подключиться там, где нужна помощь
          </p>
        </div>
      </Wave>
      <div className="flex gap-[30px] items-start w-full justify-center">
        {CARDS.map((c, i) => (
          <Wave key={c.title} delay={0.08 + i * 0.08}>
            <CycleCard {...c} />
          </Wave>
        ))}
      </div>
      <Wave delay={0.24}>
        <PillButton tone="dark" trailing={<ArrowIcon fill="#ffffff" />}>
          Связаться с нами
        </PillButton>
      </Wave>
    </div>
  );
}
