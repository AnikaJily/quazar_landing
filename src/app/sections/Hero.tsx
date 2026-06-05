import { KvazarShader } from "../components/KvazarShader";
import { Header } from "./Header";
import { PillButton } from "../components/PillButton";
import { ArrowIcon } from "../components/ArrowIcon";

export function Hero() {
  return (
    <section className="relative w-full h-[796px]">
      <div className="absolute left-1/2 -translate-x-1/2 top-0 h-[820px] w-[1512px] pointer-events-none mix-blend-screen z-10">
        <KvazarShader className="absolute inset-0 size-full" />
      </div>

      <div className="relative h-full w-[1152px] mx-auto flex flex-col pt-[88px]">
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
