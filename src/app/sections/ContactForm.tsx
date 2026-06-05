import { useState } from "react";
import { SectionTitle } from "../components/SectionTitle";
import { PillButton } from "../components/PillButton";
import { ArrowIcon } from "../components/ArrowIcon";
import { Wave } from "../lib/motion";

const FIELD =
  "bg-[#e6ebf5] rounded-[15px] px-[20px] py-[20px] w-full h-[53px] font-['Inter:Regular',sans-serif] text-[18px] text-[#030303] placeholder:text-[#9ca1ba] tracking-[-0.72px] leading-[99.9%] outline-none focus:ring-2 focus:ring-[#4774BC]/40 transition";

export function ContactForm() {
  const [sent, setSent] = useState(false);
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setSent(true);
      }}
      className="flex flex-col gap-[30px] items-center w-[958px]"
    >
      <Wave className="w-full">
        <div className="bg-white rounded-[30px] w-full py-[80px] px-[144px] flex flex-col gap-[30px] items-center">
          <div className="flex flex-col gap-[30px] items-center text-[#030303] text-center">
            <SectionTitle>Начнем проект вместе?</SectionTitle>
            <p className="font-['Inter:Regular',sans-serif] text-[18px] tracking-[-0.72px] leading-[99.9%]">
              Запишитесь на консультацию и получите честную оценку сроков и стоимости
            </p>
          </div>
          <div className="flex gap-[25px] items-stretch w-[670px]">
            <div className="flex flex-col gap-[25px] w-[323px]">
              <input className={FIELD} placeholder="Имя*" required />
              <input className={FIELD} placeholder="Номер*" type="tel" required />
              <input className={FIELD} placeholder="Почта*" type="email" required />
            </div>
            <textarea
              placeholder="Расскажите о вашем проекте"
              className={`${FIELD} w-[322px] h-[209px] min-h-[209px] resize-none leading-[140%]`}
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
