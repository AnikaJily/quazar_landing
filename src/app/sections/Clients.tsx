import { motion } from "motion/react";
import imgTigrisLogo from "figma:asset/tigris-logo.png";
import { SectionTitle } from "../components/SectionTitle";
import { hoverLift, Wave } from "../lib/motion";

export function Clients() {
  return (
    <div className="flex flex-col gap-[40px] items-start w-[1152px]">
      <Wave>
        <SectionTitle className="text-white">Наши клиенты</SectionTitle>
      </Wave>
      <Wave delay={0.08} className="w-full">
        <div className="flex flex-col gap-[20px] items-start">
          <motion.div className="flex gap-[30px] items-center w-max" {...hoverLift}>
            <div className="bg-white rounded-[20px] p-[8.485px] size-[120px] flex items-center justify-center shrink-0">
              <div className="aspect-[124/102] w-full overflow-hidden relative">
                <img
                  alt="Тигрис"
                  src={imgTigrisLogo}
                  className="absolute left-[0.78%] top-[0.95%] w-[98.44%] max-w-none"
                />
              </div>
            </div>
            <p className="font-['Playfair_Display',serif] text-white text-[45px] leading-[99.9%] whitespace-nowrap">
              ТИГРИС
            </p>
          </motion.div>
          <p className="font-['Inter',sans-serif] text-[#b9b9b9] text-[18px] tracking-[-0.72px] leading-[1.5] max-w-[920px]">
            Группа компаний ТИГРИС обратилась к нам за созданием сайтов по всем ключевым
            направлениям бизнеса
          </p>
        </div>
      </Wave>
    </div>
  );
}
