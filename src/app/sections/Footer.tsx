import imgLogo from "figma:asset/kvazar-logo.svg";
import { PillButton } from "../components/PillButton";
import { ArrowIcon } from "../components/ArrowIcon";
import { Starfield, FOOTER_STARFIELD_CONFIG } from "../starfield";
import { NAV_ITEMS } from "../lib/nav";

const EMAIL = "project@kvazar.io";

export function Footer() {
  return (
    <footer className="relative w-full overflow-hidden bg-[#030303] py-[100px]">
      <Starfield config={FOOTER_STARFIELD_CONFIG} className="z-0" />

      <div className="relative z-10 mx-auto flex w-[1152px] flex-col gap-[80px]">
        <div className="flex items-start justify-between">
          {/* Левая часть: лого + CTA, ниже контакты */}
          <div className="flex flex-col gap-[80px]">
            <div className="flex items-center gap-[40px]">
              <a href="#hero" aria-label="Квазар — на главную" className="inline-flex">
                <img src={imgLogo} alt="Квазар" className="h-[72px] w-auto" />
              </a>
              <PillButton
                as="a"
                href="#services"
                tone="light"
                size="md"
                trailing={<ArrowIcon />}
                className="px-[22px] py-[15px]"
              >
                Обсудить проект
              </PillButton>
            </div>

            <div className="flex flex-col gap-[20px]">
              <p className="font-['Inter',sans-serif] text-[25px] tracking-[-1px] text-white">
                Контакты
              </p>
              <a
                href={`mailto:${EMAIL}`}
                className="w-max font-['Inter',sans-serif] text-[25px] tracking-[-1px] text-[#b9b9b9] transition-colors duration-200 hover:text-white"
              >
                {EMAIL}
              </a>
            </div>
          </div>

          {/* Навигация справа */}
          <nav className="flex flex-col items-end gap-[25px] py-[16px]">
            {NAV_ITEMS.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className="font-['Inter',sans-serif] text-[16px] tracking-[-0.64px] text-white transition-colors duration-200 hover:text-[#b9b9b9]"
              >
                {item.label}
              </a>
            ))}
          </nav>
        </div>

        {/* Копирайт */}
        <div className="flex flex-col gap-[15px] font-['Inter',sans-serif] text-[16px] tracking-[-0.64px] text-white">
          <p>© 2026 Kvazar</p>
          <a href="#" className="w-max transition-colors duration-200 hover:text-[#b9b9b9]">
            Политика обработки персональных данных
          </a>
        </div>
      </div>
    </footer>
  );
}
