import { useEffect, useState } from "react";
import { PillButton } from "../components/PillButton";
import { ArrowIcon } from "../components/ArrowIcon";
import { getActiveSectionId, NAV_ITEMS } from "../lib/nav";

const NAV_EMPHASIS =
  "font-normal [text-shadow:0.2px_0_currentColor,-0.2px_0_currentColor]";

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [activeId, setActiveId] = useState(NAV_ITEMS[0].id);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 20);
      setActiveId(getActiveSectionId());
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 h-[70px] flex items-center transition-colors duration-300 ${
        scrolled ? "bg-[#030303]/85 backdrop-blur-md" : "bg-transparent"
      }`}
    >
      <div className="w-[1152px] mx-auto flex items-center justify-between">
        <div className="flex gap-[50px] items-center">
          <a href="#hero" className="flex gap-[7px] items-center">
            <div className="bg-white rounded-[8.75px] size-[28px]" />
            <span className="font-['Inter:Semi_Bold',sans-serif] font-semibold text-white text-[16px] tracking-[-0.15px]">
              Kvazar
            </span>
          </a>
          <nav className="flex gap-[21px] items-center">
            {NAV_ITEMS.map((item) => {
              const isActive = item.id === activeId;
              return (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className="group/nav relative inline-block py-[6px] font-['Inter',sans-serif] text-[16px] tracking-[-0.64px]"
                >
                  <span aria-hidden="true" className={`invisible ${NAV_EMPHASIS}`}>
                    {item.label}
                  </span>
                  <span
                    className={`absolute inset-0 flex items-center text-[#b9b9b9] font-normal transition-opacity duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${
                      isActive ? "opacity-0" : "opacity-100 group-hover/nav:opacity-0"
                    }`}
                  >
                    {item.label}
                  </span>
                  <span
                    className={`absolute inset-0 flex items-center text-white ${NAV_EMPHASIS} transition-opacity duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${
                      isActive ? "opacity-100" : "opacity-0 group-hover/nav:opacity-100"
                    }`}
                  >
                    {item.label}
                  </span>
                </a>
              );
            })}
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
