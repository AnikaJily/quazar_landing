import { motion } from "motion/react";
import imgTigrisLogo from "figma:asset/tigris-logo.png";
import { SectionTitle } from "../components/SectionTitle";
import { hoverLift, Wave } from "../lib/motion";

export function Clients() {
  return (
    <div className="flex flex-col gap-[55px] items-start w-[1152px]">
      <Wave>
        <SectionTitle className="text-white">Наши клиенты</SectionTitle>
      </Wave>
      <Wave delay={0.08}>
        <motion.a href="#" className="flex gap-[30px] items-center" {...hoverLift}>
          <div className="bg-white rounded-[16.97px] p-[8.485px] w-[140px]">
            <div className="aspect-[124/102] w-full overflow-hidden relative">
              <img
                alt="Тигрис"
                src={imgTigrisLogo}
                className="absolute left-[0.78%] top-[0.95%] w-[98.44%] max-w-none"
              />
            </div>
          </div>
          <p className="font-['Playfair_Display:Regular',serif] text-white text-[45px] leading-[99.9%]">
            ТИГРИС
          </p>
        </motion.a>
      </Wave>
    </div>
  );
}
