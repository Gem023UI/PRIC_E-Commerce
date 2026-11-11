import Link from "next/link";
import { Poppins } from "next/font/google";

import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { MetallicGoldText } from "@/components/brand/MetallicGoldText";
import { Reveal } from "@/components/motion/Reveal";
import { anton } from "@/lib/fonts";
import { cn } from "@/lib/utils";

const poppins = Poppins({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  display: "swap",
});

/* ------------------------------------------------------------------ */
/* Content: edit these constants                                       */
/* ------------------------------------------------------------------ */

const APPLY_HREF = "/membership/apply";

const INTRO =
  "Joining PRIC-MPC takes three simple steps. Here is what to expect from your first application to becoming a full member of the cooperative.";

const STEPS = [
  {
    title: "Fill Up the Form",
    description:
      "Complete the online Personal Information Sheet with your details, beneficiaries and IDs.",
    points: ["Fill out the form", "Choose your date of availability", "Submit"],
  },
  {
    title: "Attend the PMES Seminar",
    description:
      "Join the Pre-Membership Education Seminar to learn how the cooperative works, and what it means to be a member. Your seminar is scheduled around the date of availability you submitted.",
    points: [],
  },
  {
    title: "Complete Your Membership Payments",
    description:
      "Settle the membership fees and shared capital to finalize your membership. The cooperative office will confirm the amounts and how to pay.",
    points: ["Membership fees", "Other fees", "Shared capital"],
  },
];

const GOLD_GRADIENT =
  "linear-gradient(135deg, #fde7a0 0%, #efc673 14%, #b9822a 30%, #8a5a18 42%, #c8933a 56%, #f4d587 66%, #d9a346 78%, #a8731f 90%, #e8b45c 100%)";

const headingStyle = {
  fontSize: "clamp(1.75rem, 4vw, 3.25rem)",
  lineHeight: 1.15,
} as const;

const stepNumberStyle = {
  fontSize: "clamp(3rem, 6vw, 4.5rem)",
  lineHeight: 1.1,
} as const;

/* ------------------------------------------------------------------ */

export default function MembershipPage() {
  return (
    <>
      <Header />
      <main className={cn(poppins.className, "bg-transparent text-white")}>
        {/* HERO */}
        <section id="membership" className="bg-transparent">
          <div className="mx-auto flex max-w-4xl flex-col items-center px-6 pb-12 pt-36 text-center md:pt-44">
            <Reveal>
              <MetallicGoldText
                as="h1"
                className={cn(anton.className, "select-none")}
                style={{ fontSize: "clamp(2.5rem, 8vw, 6rem)", lineHeight: 1.1 }}
              >
                BECOME A MEMBER
              </MetallicGoldText>
            </Reveal>
            <Reveal delay={150}>
              <p className="mt-6 max-w-2xl text-lg leading-snug text-balance md:text-xl">
                {INTRO}
              </p>
            </Reveal>
          </div>
        </section>

        {/* ONBOARDING PROCESS */}
        <section id="process" className="scroll-mt-24 bg-transparent">
          <div className="mx-auto max-w-6xl px-6 pb-16 pt-8">
            <Reveal>
              <MetallicGoldText
                as="h2"
                className={cn(anton.className, "text-center")}
                style={headingStyle}
              >
                The Onboarding Process
              </MetallicGoldText>
            </Reveal>

            <ol className="mt-14 grid gap-8 md:grid-cols-3">
              {STEPS.map((step, i) => (
                <li key={step.title} className="flex">
                  <Reveal delay={150 + i * 150} className="flex w-full">
                  <div className="flex w-full flex-col rounded-2xl border border-white/15 bg-white/5 p-8 backdrop-blur-sm">
                    <MetallicGoldText
                      as="p"
                      className={anton.className}
                      style={stepNumberStyle}
                    >
                      {String(i + 1).padStart(2, "0")}
                    </MetallicGoldText>
                    <h3 className="mt-4 text-xl font-bold uppercase leading-snug text-balance md:text-2xl">
                      {step.title}
                    </h3>
                    <p className="mt-4 text-base leading-snug text-white/85 md:text-lg">
                      {step.description}
                    </p>
                    {step.points.length > 0 && (
                      <ul className="mt-6 space-y-2 text-base text-white/85">
                        {step.points.map((p) => (
                          <li key={p} className="flex items-start gap-3">
                            <span
                              aria-hidden="true"
                              className="mt-2 h-2 w-2 shrink-0 rounded-full"
                              style={{ backgroundImage: GOLD_GRADIENT }}
                            />
                            {p}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  </Reveal>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* CTA */}
        <section id="apply" className="bg-transparent">
          <div className="mx-auto flex max-w-3xl flex-col items-center px-6 pb-28 pt-8 text-center">
            <Reveal>
              <MetallicGoldText
                as="h2"
                className={anton.className}
                style={headingStyle}
              >
                Ready to Join?
              </MetallicGoldText>
            </Reveal>
            <Reveal delay={150}>
              <p className="mt-4 max-w-xl text-base md:text-lg">
                Have your valid IDs and beneficiary details ready, then start
                your application.
              </p>
            </Reveal>
            <Reveal delay={300} className="mt-10">
              <Link
                href={APPLY_HREF}
                className="inline-flex items-center gap-3 rounded-full px-10 py-4 text-base font-bold uppercase tracking-wide text-[#1a1004] shadow-[0_0_30px_rgba(239,198,115,0.35)] transition-transform duration-200 motion-safe:hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#efc673] md:text-lg"
                style={{ backgroundImage: GOLD_GRADIENT }}
              >
                Fill Out the Form
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </Link>
            </Reveal>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}