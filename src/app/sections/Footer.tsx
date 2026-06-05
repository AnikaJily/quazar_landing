import { motion } from "motion/react";
import imgVkIcon from "figma:asset/vk-icon.svg";
import imgTelegramIcon from "figma:asset/telegram-icon.svg";
import { PillButton } from "../components/PillButton";
import { ArrowIcon } from "../components/ArrowIcon";
import { hoverScale } from "../lib/motion";

const LINKS = ["Главная", "Направления", "Продукты", "Кейсы", "Услуги"];

export function Footer() {
  return (
    <footer className="bg-[#030303] w-full pt-[100px] pb-[100px] relative">
      <div className="w-[1152px] mx-auto">
        <div className="flex justify-between items-start">
          <nav className="flex flex-col gap-[15px] font-['Inter:Regular',sans-serif] text-white text-[16px] tracking-[-0.64px]">
            {LINKS.map((item) => (
              <motion.a
                key={item}
                href="#"
                whileHover={{ color: "#b6bad3" }}
                transition={{ duration: 0.2 }}
              >
                {item}
              </motion.a>
            ))}
          </nav>
          <div className="flex flex-col items-end gap-[20px]">
            <a
              href="mailto:kvazar@gmail.com"
              className="font-['Inter:Regular',sans-serif] text-[#b6bad3] text-[25px] tracking-[-1px]"
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

        <p className="mt-[100px] font-['Inter:Regular',sans-serif] text-[#9ca1ba] text-[16px] tracking-[-0.64px]">
          © 2026 Kvazar &nbsp;&nbsp;&nbsp;—&nbsp;&nbsp;&nbsp;&nbsp;Политика обработки персональных данных
        </p>
      </div>
    </footer>
  );
}
