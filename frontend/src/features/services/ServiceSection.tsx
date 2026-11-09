"use client";

import * as React from "react";

import { MetallicGoldText } from "@/components/brand/MetallicGoldText";
import InquiryModal from "@/components/ui/InquiryModal";
import type { Service } from "@/data/services";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { anton } from "@/lib/fonts";
import { cn } from "@/lib/utils";

const GALLERY_INTERVAL_MS = 4000;

function Gallery({ images, alt }: { images: string[]; alt: string }) {
  const reduced = useReducedMotion();
  const [i, setI] = React.useState(0);

  React.useEffect(() => {
    if (reduced || images.length < 2) return;
    const t = setInterval(() => setI((v) => (v + 1) % images.length), GALLERY_INTERVAL_MS);
    return () => clearInterval(t);
  }, [reduced, images.length]);

  return (
    <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-transparent lg:aspect-auto lg:min-h-0 lg:max-h-[30rem] lg:flex-1">
      {images.map((src, idx) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={src + idx}
          src={src}
          alt={idx === i ? alt : ""}
          aria-hidden={idx !== i}
          className={cn(
            "absolute inset-0 h-full w-full object-cover transition-opacity duration-700",
            idx === i ? "opacity-100" : "opacity-0",
          )}
        />
      ))}
      {images.length > 1 ? (
        <div className="absolute inset-x-0 bottom-3 flex justify-center gap-2" aria-hidden="true">
          {images.map((_, idx) => (
            <span
              key={idx}
              className={cn(
                "h-1.5 rounded-full bg-white transition-all",
                idx === i ? "w-5 opacity-100" : "w-1.5 opacity-50",
              )}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export default function ServiceSection({ service: s }: { service: Service }) {
  const [open, setOpen] = React.useState(false);

  return (
    <section id={s.id} className="relative border-t border-white/10 pt-16">
      {/* Sticky header: stays pinned while this service's content scrolls. */}
      <header className="px-6 py-8 text-center lg:top-16 lg:z-20 lg:flex lg:h-[8.5rem] lg:flex-col lg:justify-center lg:bg-transparent lg:py-0">
        <MetallicGoldText
          as="h2"
          className={anton.className}
          style={{ fontSize: "clamp(1.75rem, 3.6vw, 3rem)", lineHeight: 1.15 }}
        >
          {s.name.toUpperCase()}
        </MetallicGoldText>
        <h3 className="mt-2 text-lg font-medium md:text-xl">{s.subtitle}</h3>
      </header>

      <div className="mx-auto grid max-w-6xl gap-10 px-6 pb-20 lg:grid-cols-[5fr_6fr] lg:items-start lg:gap-14">
        {/* Left: pinned gallery + inquire button */}
        <div className="flex flex-col gap-4 lg:sticky lg:top-[12.5rem] lg:h-[calc(100svh-14.5rem)]">
          <Gallery images={s.images} alt={s.imageAlt} />
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-haspopup="dialog"
            className="inline-flex min-h-12 w-full shrink-0 items-center justify-center rounded-xl text-base font-bold uppercase tracking-wide text-white shadow-lg transition-transform [text-shadow:0_1px_2px_rgba(0,0,0,0.5)] hover:scale-[1.02] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#efc673]"
            style={{
              backgroundImage:
                "linear-gradient(180deg, #d9a346 0%, #8a5a18 50%, #c8933a 100%)",
            }}
          >
            Inquire
          </button>
        </div>

        {/* Right: service content. Scrolls with the page. */}
        <div className="space-y-8 lg:min-h-[calc(100svh-12.5rem)] lg:pt-2">
          <div className="space-y-4">
            {s.intro.map((p, i) => (
              <p key={i} className="text-base leading-relaxed text-white/90 md:text-lg">
                {p}
              </p>
            ))}
          </div>

          <div>
            <h4 className="text-base font-semibold uppercase tracking-wide text-[#d9a346]">
              Service highlights
            </h4>
            <div className="mt-4 space-y-5">
              {s.groups.map((g, gi) => (
                <div key={gi}>
                  {g.title ? <p className="mb-2 font-semibold text-white">{g.title}</p> : null}
                  <ul className="space-y-2.5">
                    {g.items.map((item) => (
                      <li key={item} className="flex gap-3 text-base leading-relaxed text-white/85">
                        <span
                          aria-hidden="true"
                          className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#efc673]"
                        />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-base font-semibold uppercase tracking-wide text-[#d9a346]">
              How it works
            </h4>
            <p className="mt-3 text-base leading-relaxed text-white/85">{s.howItWorks}</p>
          </div>

          {s.notice ? (
            <div className="rounded-2xl border border-[#c8933a]/40 bg-[#c8933a]/10 p-5">
              <p className="font-semibold text-[#f4d587]">{s.notice.label}</p>
              <p className="mt-2 text-sm leading-relaxed text-white/80 md:text-base">
                {s.notice.text}
              </p>
            </div>
          ) : null}
        </div>
      </div>

      {open ? <InquiryModal service={s} onClose={() => setOpen(false)} /> : null}
    </section>
  );
}