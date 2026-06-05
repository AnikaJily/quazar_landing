import { motion } from "motion/react";
import { PillButton } from "../components/PillButton";
import { ArrowIcon } from "../components/ArrowIcon";

const NAV = ["Главная", "Услуги", "Направления", "Контакты"];

export function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/10 backdrop-blur-md">
      <div className="w-[1152px] mx-auto flex items-center justify-between py-[30px]">
        <div className="flex gap-[50px] items-center">
          <a href="#" className="flex gap-[7px] items-center">
            <div className="bg-white rounded-[8.75px] size-[28px]" />
            <span className="font-['Inter:Semi_Bold',sans-serif] font-semibold text-white text-[16px] tracking-[-0.15px]">
              Kvazar
            </span>
          </a>
          <nav className="flex gap-[21px] items-center font-['Inter:Regular',sans-serif] text-[#d8dae2] text-[16px] tracking-[-0.64px]">
            {NAV.map((item) => (
              <motion.a
                key={item}
                href="#"
                whileHover={{ color: "#ffffff" }}
                transition={{ duration: 0.2 }}
              >
                {item}
              </motion.a>
            ))}
          </nav>
        </div>
        <div className="flex gap-[7px] items-center">
          <PillButton tone="glassMuted" size="sm">
            Узнать больше
          </PillButton>
          <PillButton tone="light" size="sm" trailing={<ArrowIcon />}>
            Обсудить проект
          </PillButton>
        </div>
      </div>
    </header>
  );
}
