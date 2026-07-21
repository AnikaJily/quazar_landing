import imgTextures from "figma:asset/textures.jpg";
import { Hero } from "./sections/Hero";
import { Directions } from "./sections/Directions";
import { Team } from "./sections/Team";
import { Showcase, type ShowcaseItem } from "./sections/Showcase";
import { Clients } from "./sections/Clients";
import { Cycle } from "./sections/Cycle";
import { ContactForm } from "./sections/ContactForm";
import { Footer } from "./sections/Footer";
import { StarfieldConfigProvider, StarfieldTuner } from "./starfield";

const PRODUCTS: ShowcaseItem[] = [
  { title: "Kvazar Торги", description: "Разработали систему поиска тендеров, торгов и госзакупок" },
  { title: "Kvazar Торги", description: "Разработали систему поиска тендеров, торгов и госзакупок" },
  { title: "Kvazar Торги", description: "Разработали систему поиска тендеров, торгов и госзакупок" },
];

const CASES: ShowcaseItem[] = [
  { title: "Kvazar Торги", description: "Разработали систему поиска тендеров, торгов и госзакупок" },
  { title: "Kvazar Торги", description: "Разработали систему поиска тендеров, торгов и госзакупок" },
  { title: "Kvazar Торги", description: "Разработали систему поиска тендеров, торгов и госзакупок" },
];

function LightPanel() {
  return (
    <div
      className="relative mt-[111px] bg-[#f5f7ff] rounded-[40px] overflow-hidden w-full px-[180px] pt-[100px] pb-[180px] flex flex-col gap-[180px] items-start"
    >
      <div
        className="absolute inset-0 mix-blend-color-dodge pointer-events-none"
        style={{
          backgroundImage: `url(${imgTextures})`,
          backgroundSize: "401px 389px",
          backgroundPosition: "top left",
          backgroundRepeat: "repeat",
        }}
      />
      <div
        className="absolute left-[121px] top-[297px] w-[1281px] h-[154px] bg-[#a3b2d4] blur-[192.5px] pointer-events-none"
      />
      <div className="relative z-10 w-full flex flex-col gap-[180px] items-start">
        <div id="directions" className="section-anchor w-full">
          <Directions />
        </div>
        <div className="w-full">
          <Team />
        </div>
      </div>
    </div>
  );
}

function DarkShowcaseStack() {
  return (
    <div className="flex flex-col gap-[100px] items-start w-full px-[180px] pt-[100px] pb-[100px]">
      <div id="products" className="section-anchor w-full">
        <Showcase title="Наши продукты" items={PRODUCTS} />
      </div>
      <div id="cases" className="section-anchor w-full">
        <Showcase title="Кейсы" items={CASES} />
      </div>
      <Clients />
    </div>
  );
}

function CycleAndForm() {
  return (
    <div className="relative w-full rounded-[40px] overflow-hidden bg-[#f5f7ff] py-[100px] flex flex-col gap-[100px] items-center">
      <div
        className="absolute bg-[#c2d0f3] blur-[192.5px] h-[264px] w-[1067px] left-1/2 -translate-x-1/2 pointer-events-none"
        style={{ top: 298 }}
      />
      <div
        className="absolute bg-[#c2d0f3] blur-[192.5px] h-[539px] w-[945px] left-1/2 -translate-x-1/2 pointer-events-none"
        style={{ top: 815 }}
      />
      <div className="relative z-10 flex flex-col gap-[100px] items-center w-full">
        <div id="services" className="section-anchor w-full flex justify-center">
          <Cycle />
        </div>
        <ContactForm />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <StarfieldConfigProvider>
      <div className="bg-[#030303] relative w-full min-h-screen overflow-x-hidden">
        <div className="relative flex flex-col items-stretch w-[1512px] mx-auto">
          <div id="hero" className="section-anchor">
            <Hero />
          </div>
          <LightPanel />
          <DarkShowcaseStack />
          <CycleAndForm />
          <Footer />
        </div>
      </div>
      {import.meta.env.DEV && <StarfieldTuner />}
    </StarfieldConfigProvider>
  );
}
