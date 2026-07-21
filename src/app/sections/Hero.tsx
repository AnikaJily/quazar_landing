import heroPoster from "figma:asset/hero-poster.jpg";
import { KvazarShader } from "../components/KvazarShader";
import { Starfield } from "../starfield";
import { Header } from "./Header";
import { PillButton } from "../components/PillButton";
import { ArrowIcon } from "../components/ArrowIcon";

export function Hero() {
  return (
    <section className="relative w-full h-[796px]">
      <Starfield className="z-0" heroPx={796} bleedBottom={150} />

      <div
        className="absolute left-1/2 -translate-x-1/2 top-0 h-[820px] w-[1512px] pointer-events-none mix-blend-screen z-10 bg-cover bg-center"
        style={{ backgroundImage: `url(${heroPoster})` }}
      >
        <KvazarShader className="absolute inset-0 size-full" />
      </div>

      {/* Unified film grain over the whole cosmic scene (stars + shader) so the
          stars & Pleiades share the beam's texture and don't read as a separate,
          too-clean layer. Sits above the shader, below the UI text. */}
      <div
        className="absolute inset-x-0 top-0 z-20 pointer-events-none mix-blend-soft-light opacity-[0.6]"
        style={{
          bottom: -150,
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='150' height='150'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23g)'/%3E%3C/svg%3E\")",
          backgroundSize: "150px 150px",
        }}
      />

      <div className="relative z-30 h-full w-[1152px] mx-auto flex flex-col pt-[88px]">
        <Header />

        <div className="mt-[68px] flex flex-col gap-[40px] items-start w-[577px]">
          <h1 className="font-['Manrope:ExtraBold',sans-serif] font-extrabold text-white text-[48px] leading-[99.9%] drop-shadow-[0px_0px_3.5px_rgba(255,255,255,0.15)]">
            Превращаем идеи
            <br />в работающий продукт
          </h1>
          <div className="flex gap-[10px] items-start">
            <PillButton tone="light" trailing={<ArrowIcon />}>
              Обсудить проект
            </PillButton>
            <PillButton tone="glass">Узнать о нас больше</PillButton>
          </div>
        </div>

        <p className="mt-auto mb-[114px] font-['Inter:Regular',sans-serif] text-white text-[18px] tracking-[-0.72px] leading-[140%] w-[375px] self-end">
          Веб-платформы, мобильные приложения и серверные системы — от первого
          MVP до архитектуры под высокую нагрузку. Работаем со стартапами,
          продуктовыми командами и крупным бизнесом.
        </p>
      </div>
    </section>
  );
}
