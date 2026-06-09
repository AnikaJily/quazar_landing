import { useRef, useState } from "react";
import { useInView } from "motion/react";
import { SectionTitle } from "../components/SectionTitle";
import { PillButton } from "../components/PillButton";
import { ArrowIcon } from "../components/ArrowIcon";
import { Wave } from "../lib/motion";
import { cn } from "../lib/cn";

const FIELD =
  "bg-[#e6ebf5] rounded-[15px] px-[20px] py-[20px] w-full font-['Inter:Regular',sans-serif] text-[18px] text-[#030303] placeholder:text-[#9ca1ba] tracking-[-0.72px] leading-[99.9%] outline-none focus:ring-2 focus:ring-[#4774BC]/40 transition";

export function ContactForm() {
  const [sent, setSent] = useState(false);
  const ref = useRef<HTMLFormElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.35 });

  return (
    <form
      ref={ref}
      onSubmit={(e) => {
        e.preventDefault();
        setSent(true);
      }}
      className="flex flex-col gap-[40px] items-center w-[958px]"
    >
      <Wave className="w-full">
        <div className="bg-white rounded-[30px] w-[945px] mx-auto pt-[68px] pb-[80px] flex flex-col gap-[40px] items-center">
          <div className="flex flex-col gap-[25px] items-center text-[#030303] text-center">
            <SectionTitle className={cn("gradient-shimmer-text", inView && "is-active")}>
              Начнем проект вместе?
            </SectionTitle>
            <p className="font-['Inter:Regular',sans-serif] text-[18px] tracking-[-0.72px] leading-[99.9%]">
              Перезвоним в течении 15 минут и дадим честную оценку сроков и стоимости
            </p>
          </div>
          <div className="grid grid-cols-2 gap-[25px] w-[670px]">
            <div className="flex flex-col gap-[25px]">
              <input className={`${FIELD} h-[53px]`} placeholder="Имя*" required />
              <input className={`${FIELD} h-[53px]`} placeholder="Номер*" type="tel" required />
              <input className={`${FIELD} h-[53px]`} placeholder="Почта*" type="email" required />
            </div>
            <textarea
              placeholder="Расскажите о вашем проекте"
              className={`${FIELD} h-full min-h-[209px] resize-none leading-[140%]`}
            />
          </div>
        </div>
      </Wave>
      <Wave delay={0.08}>
        <PillButton type="submit" tone="dark" trailing={<ArrowIcon fill="#ffffff" />}>
          {sent ? "Спасибо!" : "Отправить"}
        </PillButton>
      </Wave>
    </form>
  );
}
