import { motion } from "motion/react";
import imgVkIcon from "figma:asset/vk-icon.svg";
import imgTelegramIcon from "figma:asset/telegram-icon.svg";
import { PillButton } from "../components/PillButton";
import { ArrowIcon } from "../components/ArrowIcon";
import { Starfield, FOOTER_STARFIELD_CONFIG } from "../starfield";
import { hoverScale } from "../lib/motion";
import { NAV_ITEMS } from "../lib/nav";

export function Footer() {
  return (
    <footer className="bg-[#030303] w-full pt-[100px] pb-[100px] relative">
      <Starfield config={FOOTER_STARFIELD_CONFIG} className="z-0" />
      <div className="relative z-10 w-[1152px] mx-auto">
        <div className="flex justify-between items-start">
          <nav className="flex flex-col gap-[15px] font-['Inter:Regular',sans-serif] text-white text-[16px] tracking-[-0.64px]">
            {NAV_ITEMS.map((item) => (
              <motion.a
                key={item.id}
                href={`#${item.id}`}
                whileHover={{ color: "#b9b9b9" }}
                transition={{ duration: 0.2 }}
              >
                {item.label}
              </motion.a>
            ))}
          </nav>
          <div className="flex flex-col items-end gap-[20px]">
            <a
              href="mailto:kvazar@gmail.com"
              className="font-['Inter:Regular',sans-serif] text-[#b9b9b9] text-[25px] tracking-[-1px]"
            >
              kvazar@gmail.com
            </a>
            <div className="flex gap-[10px] items-center">
              <motion.a href="#" className="block size-[60px]" {...hoverScale}>
                <img alt="VK" src={imgVkIcon} className="size-full" />
              </motion.a>
              <motion.a href="#" className="block size-[60px]" {...hoverScale}>
                <img alt="Telegram" src={imgTelegramIcon} className="size-full" />
              </motion.a>
            </div>
          </div>
        </div>

        <div className="mt-[30px]">
          <PillButton tone="light" size="sm" trailing={<ArrowIcon />}>
            Обсудить проект
          </PillButton>
        </div>

        <p className="mt-[100px] font-['Inter:Regular',sans-serif] text-[#b9b9b9] text-[16px] tracking-[-0.64px]">
          © 2026 Kvazar &nbsp;&nbsp;&nbsp;—&nbsp;&nbsp;&nbsp;&nbsp;Политика обработки персональных данных
        </p>
      </div>
    </footer>
  );
}
