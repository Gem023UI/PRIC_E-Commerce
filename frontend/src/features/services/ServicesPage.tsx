import type { Metadata } from "next";
import { Anton, Poppins } from "next/font/google";

import { MetallicGoldText } from "@/components/brand/MetallicGoldText";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { Reveal } from "@/components/motion/Reveal";
import { HERO_SLIDES, SERVICES, type ServiceId } from "@/data/services";
import { cn } from "@/lib/utils";

import HeroCarousel from "./HeroCarousel";
import ServiceSection from "./ServiceSection";

export const metadata: Metadata = {
  title: "Our Services | PRIC MPC",
  description:
    "Event rentals, loans and micro-financing, savings and loans, and manufacturing and production from PRIC MPC.",
};

const anton = Anton({ weight: "400", subsets: ["latin"], display: "swap" });
const poppins = Poppins({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  display: "swap",
});

const GOLD_GRADIENT =
  "linear-gradient(135deg, #fde7a0 0%, #efc673 14%, #b9822a 30%, #8a5a18 42%, #c8933a 56%, #f4d587 66%, #d9a346 78%, #a8731f 90%, #e8b45c 100%)";

const headingStyle = {
  fontSize: "clamp(1.75rem, 4vw, 3.25rem)",
  lineHeight: 1.15,
} as const;

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#efc673]";

/* ---------- Icons (inline SVG, no extra dependency) ---------- */

type IconProps = { className?: string };

const iconProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

const RentalIcon = ({ className }: IconProps) => (
  <svg {...iconProps} className={className}>
    <path d="M3 10h18" />
    <path d="M5 10v9h14v-9" />
    <path d="M4 10l2-5h12l2 5" />
    <path d="M10 19v-5h4v5" />
  </svg>
);

const FinanceIcon = ({ className }: IconProps) => (
  <svg {...iconProps} className={className}>
    <circle cx="12" cy="12" r="9" />
    <path d="M14.5 9a2.5 2.5 0 0 0-2.5-1.5c-1.5 0-2.5.8-2.5 2s1 1.7 2.5 2 2.5.8 2.5 2-1 2-2.5 2A2.7 2.7 0 0 1 9.5 15" />
    <path d="M12 6v1.5M12 16.5V18" />
  </svg>
);

const SavingsIcon = ({ className }: IconProps) => (
  <svg {...iconProps} className={className}>
    <path d="M4 10c0-3 3-5 7-5s7 2 7 5c0 1.5-.6 2.6-1.5 3.4V17h-3v-1.5h-5V17h-3v-3.6C4.6 12.6 4 11.5 4 10z" />
    <path d="M18 9.5h2.5" />
    <circle cx="14.5" cy="9.5" r=".6" fill="currentColor" />
  </svg>
);

const ProductionIcon = ({ className }: IconProps) => (
  <svg {...iconProps} className={className}>
    <path d="M3 20h18" />
    <path d="M5 20V9l5 3V9l5 3V5h4v15" />
    <path d="M8 16h1M12 16h1M16 16h1" />
  </svg>
);

const ICONS: Record<ServiceId, (p: IconProps) => React.JSX.Element> = {
  rentals: RentalIcon,
  financing: FinanceIcon,
  "savings-loans": SavingsIcon,
  production: ProductionIcon,
};

export default function ServicesPage() {
  return (
    <>
      {/* Hide the page scrollbar here; scrolling itself is unchanged. */}
      <style>{`html{scrollbar-width:none}html::-webkit-scrollbar{display:none}`}</style>

      <Header />
      <main className={cn(poppins.className, "bg-transparent text-white")}>
        {/* HERO */}
        <section id="top" className="flex min-h-[100svh] items-center">
          <div className="mx-auto grid w-full max-w-6xl items-center gap-12 px-6 pb-16 pt-28 lg:grid-cols-2 lg:gap-16">
            <div>
              <Reveal>
                <MetallicGoldText
                  as="h1"
                  className={anton.className}
                  style={{ fontSize: "clamp(3rem, 9vw, 6.5rem)", lineHeight: 1.05 }}
                >
                  SERVICES
                </MetallicGoldText>
              </Reveal>
              <Reveal delay={150}>
                <p className="mt-6 max-w-md text-lg leading-snug md:text-xl">
                  Provided below are the information as to how the cooperative
                  brings and sustain the community.
                </p>
              </Reveal>
            </div>
            <Reveal delay={250}>
              <HeroCarousel slides={HERO_SLIDES} />
            </Reveal>
          </div>
        </section>

        {/* DIRECTORY */}
        <section id="directory" className="scroll-mt-20 bg-transparent">
          <div className="mx-auto max-w-6xl px-6 pb-24 pt-8">
            <Reveal>
              <p className="max-w-2xl text-lg leading-snug md:text-xl">
                Choose a service to see how it works and send an inquiry.
              </p>
            </Reveal>

            <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {SERVICES.map((s, i) => {
                const Icon = ICONS[s.id];
                return (
                  <li key={s.id} className="flex">
                    <Reveal delay={i * 100} className="flex w-full">
                      <a
                        href={`#${s.id}`}
                        className={cn(
                          "group flex w-full flex-col rounded-2xl p-[1px] shadow-xl transition-transform duration-300 hover:-translate-y-1",
                          focusRing,
                        )}
                        style={{ backgroundImage: GOLD_GRADIENT }}
                      >
                        <span className="flex h-full flex-col rounded-[15px] bg-black p-6">
                          <Icon className="h-10 w-10 text-[#efc673]" />
                          <span className="mt-5 text-xl font-semibold leading-snug">
                            {s.name}
                          </span>
                          <span className="mt-3 flex-1 text-base leading-relaxed text-white/75">
                            {s.short}
                          </span>
                          <span className="mt-6 inline-flex min-h-12 items-center gap-2 font-semibold text-[#f4d587]">
                            {s.cta}
                            <span
                              aria-hidden="true"
                              className="transition-transform group-hover:translate-x-1"
                            >
                              &rarr;
                            </span>
                          </span>
                        </span>
                      </a>
                    </Reveal>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>

        {/* SERVICES */}
        {SERVICES.map((s) => (
          <ServiceSection key={s.id} service={s} />
        ))}

        {/* CLOSING */}
        <section className="border-t border-white/10 bg-transparent">
          <div className="mx-auto max-w-4xl px-6 py-24 text-center">
            <Reveal>
              <MetallicGoldText as="h2" className={anton.className} style={headingStyle}>
                COOPERATION IN ACTION
              </MetallicGoldText>
            </Reveal>
            <Reveal delay={150}>
              <p className="mx-auto mt-6 max-w-2xl text-lg leading-snug md:text-xl">
                Each service represents a different way PRIC MPC supports its
                members, customers, and enterprise activities. Through
                cooperation, responsible management, and continuous
                improvement, we strive to strengthen our operations and
                contribute to sustainable community development.
              </p>
            </Reveal>
            <Reveal delay={300}>
              <p className="mt-6 text-lg font-semibold text-[#f4d587]">
                Discover the opportunities available through PRIC MPC.
              </p>
            </Reveal>
            <Reveal delay={400}>
              <a
                href="#top"
                className={cn(
                  "mt-8 inline-flex min-h-12 items-center rounded-xl border border-white/30 px-6 font-medium transition-colors hover:border-[#efc673]",
                  focusRing,
                )}
              >
                Back to all services
              </a>
            </Reveal>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}