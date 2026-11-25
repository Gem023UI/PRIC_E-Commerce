import Link from "next/link";

import { MetallicGoldText } from "@/components/brand/MetallicGoldText";
import { Reveal } from "@/components/motion/Reveal";
import { formatLongDate } from "@/lib/dates";
import { anton } from "@/lib/fonts";
import type { SeminarInfo } from "@/lib/seminars";
import { GOLD_GRADIENT } from "@/lib/theme";

export default function NextSeminar({ info }: { info: SeminarInfo | null }) {
  const next = info?.next ?? null;
  const others = info ? info.upcoming.filter((s) => s.date !== next?.date).slice(0, 3) : [];

  return (
    <section id="seminar" className="scroll-mt-24 bg-transparent">
      <div className="mx-auto max-w-4xl px-6 pb-8 pt-4">
        <Reveal>
          <div
            className="rounded-2xl p-[2px] shadow-xl"
            style={{ backgroundImage: GOLD_GRADIENT }}
          >
            <div className="rounded-[14px] bg-[#0a0a0a] px-6 py-10 text-center md:px-12">
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#efc673]">
                Next PMES Seminar
              </p>

              {next ? (
                <>
                  <MetallicGoldText
                    as="h2"
                    className={anton.className}
                    style={{ fontSize: "clamp(1.75rem, 4.5vw, 3rem)", lineHeight: 1.15, marginTop: 16 }}
                  >
                    {formatLongDate(next.date)}
                  </MetallicGoldText>
                  {info?.today === next.date && (
                    <p className="mt-2 inline-block rounded-full bg-[#efc673]/20 px-3 py-1 text-sm font-semibold text-[#f4d587]">
                      Happening today
                    </p>
                  )}
                  <p className="mt-5 text-lg text-white/90">
                    {[next.startTime, next.venue].filter(Boolean).join(" · ")}
                  </p>
                  {next.note && <p className="mx-auto mt-3 max-w-xl text-base text-white/70">{next.note}</p>}
                </>
              ) : (
                <>
                  <h2 className="mt-4 text-2xl font-semibold text-white md:text-3xl">
                    The next date will be announced soon
                  </h2>
                  <p className="mx-auto mt-3 max-w-xl text-base text-white/70">
                    PMES seminars are held on Saturdays. You can already send your application and the
                    cooperative will confirm your schedule.
                  </p>
                </>
              )}

              {others.length > 0 && (
                <p className="mt-6 text-sm text-white/60">
                  Other upcoming Saturdays: {others.map((s) => formatLongDate(s.date).replace(/^Saturday, /, "")).join(" · ")}
                </p>
              )}

              <Link
                href="/membership/apply"
                className="mt-8 inline-flex rounded-full px-8 py-3 text-base font-bold uppercase tracking-wide text-[#1a1004] shadow-[0_0_30px_rgba(239,198,115,0.35)] transition-transform motion-safe:hover:scale-105"
                style={{ backgroundImage: GOLD_GRADIENT }}
              >
                Apply now
              </Link>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}