import type { ReactNode } from "react";

import PageShell from "@/components/layout/pageshell";
import { MetallicGoldText } from "@/components/brand/MetallicGoldText";
import { Reveal } from "@/components/motion/Reveal";
import { CONTACT } from "@/data/contacts";
import { anton } from "@/lib/fonts";
import { GOLD_GRADIENT } from "@/lib/theme";

import ContactForm from "./ContactForm";

const titleStyle = {
  fontSize: "clamp(2.25rem, 6vw, 4.5rem)",
  lineHeight: 1.1,
} as const;

const headingStyle = {
  fontSize: "clamp(1.75rem, 4vw, 3.25rem)",
  lineHeight: 1.15,
} as const;

const Svg = ({ children }: { children: ReactNode }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-5 w-5"
    aria-hidden="true"
  >
    {children}
  </svg>
);

const INFO: {
  label: string;
  text: string;
  href?: string;
  icon: ReactNode;
}[] = [
  {
    label: "Phone",
    text: CONTACT.phone.text,
    href: CONTACT.phone.href,
    icon: (
      <Svg>
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
      </Svg>
    ),
  },
  {
    label: "Email",
    text: CONTACT.email.text,
    href: CONTACT.email.href,
    icon: (
      <Svg>
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
        <polyline points="22,6 12,13 2,6" />
      </Svg>
    ),
  },
  {
    label: "Address",
    text: CONTACT.address,
    icon: (
      <Svg>
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
        <circle cx="12" cy="10" r="3" />
      </Svg>
    ),
  },
  {
    label: "Office hours",
    text: CONTACT.hours,
    icon: (
      <Svg>
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </Svg>
    ),
  },
];

export default function ContactPage() {
  const mapSrc = `https://www.google.com/maps?q=${encodeURIComponent(
    CONTACT.mapQuery,
  )}&output=embed`;

  return (
    <PageShell>
      <section className="mx-auto max-w-6xl px-6 pb-16 text-center">
        <MetallicGoldText
          as="h1"
          className={anton.className}
          style={titleStyle}
        >
          Contact Us
        </MetallicGoldText>
        <Reveal delay={150}>
          <p className="mx-auto mt-6 max-w-3xl text-lg leading-snug md:text-xl">
            Reach out to the Pinagdinlayan Rural Improvement Club Multipurpose
            Cooperative (PRIC-MPC) to inquire about our products, services and
            membership.
          </p>
        </Reveal>
      </section>

      {/* Info + form */}
      <section className="mx-auto grid max-w-6xl gap-12 px-6 pb-24 md:grid-cols-[1fr_1.2fr] md:gap-16">
        <Reveal>
          <h2 className="text-2xl font-semibold">Get in touch</h2>
          <ul className="mt-8 space-y-6">
            {INFO.map((item) => (
              <li key={item.label} className="flex items-start gap-4">
                <span className="mt-0.5 text-[#d9a346]">{item.icon}</span>
                <div>
                  <p className="text-sm text-white/60">{item.label}</p>
                  {item.href ? (
                    <a
                      href={item.href}
                      className="break-all text-lg text-white/90 transition-colors hover:text-[#f4d587]"
                    >
                      {item.text}
                    </a>
                  ) : (
                    <p className="text-lg text-white/90">{item.text}</p>
                  )}
                </div>
              </li>
            ))}
          </ul>

          <p className="mt-10 text-sm text-white/60">Follow us</p>
          <ul className="mt-3 flex flex-wrap gap-3">
            {CONTACT.socials.map((s) => (
              <li key={s.label}>
                <a
                  href={s.href}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex rounded-full bg-white/10 px-4 py-2 text-sm transition-colors hover:bg-[#d9a346] hover:text-black"
                >
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal delay={150}>
          <div className="rounded-2xl border border-white/15 bg-white/[0.03] p-6 md:p-8">
            <h2 className="mb-6 text-2xl font-semibold">Send us a message</h2>
            <ContactForm />
          </div>
        </Reveal>
      </section>

      {/* Map */}
      <section className="border-t border-[#b9822a]/30">
        <div className="mx-auto max-w-6xl px-6 py-24 text-center">
          <MetallicGoldText
            as="h2"
            className={anton.className}
            style={headingStyle}
          >
            Find Us
          </MetallicGoldText>
          <p className="mt-4 text-base text-white/80 md:text-lg">
            {CONTACT.address}
          </p>
          <Reveal delay={150} className="mt-10">
            <div
              className="rounded-2xl p-[2px] shadow-xl"
              style={{ backgroundImage: GOLD_GRADIENT }}
            >
              <iframe
                title="PRIC-MPC location map"
                src={mapSrc}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
                className="block h-[360px] w-full rounded-[14px] md:h-[440px]"
              />
            </div>
          </Reveal>
        </div>
      </section>
    </PageShell>
  );
}