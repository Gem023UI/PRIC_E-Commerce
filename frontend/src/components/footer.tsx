import type { ReactNode } from "react";
import { Anton, Poppins } from "next/font/google";

import { MetallicGoldText } from "@/components/metallic-gold-text";
import { Reveal } from "@/components/Reveal";
import { cn } from "@/lib/utils";

const anton = Anton({ weight: "400", subsets: ["latin"], display: "swap" });
const poppins = Poppins({
  weight: ["400", "500", "600"],
  subsets: ["latin"],
  display: "swap",
});

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

const QUICK_LINKS = [
  { label: "Home", href: "#home" },
  { label: "About Us", href: "#about" },
  { label: "Services", href: "#services" },
  { label: "Products", href: "#products" },
  { label: "Events", href: "#events" },
  { label: "Contact", href: "#contact" },
];

// Placeholders. Replace with real details.
const CONTACTS = [
  {
    label: "Phone",
    text: "+63 912 345 6789",
    href: "tel:+639123456789",
    icon: (
      <Svg>
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
      </Svg>
    ),
  },
  {
    label: "Email",
    text: "pric.mpc@example.com",
    href: "mailto:pric.mpc@example.com",
    icon: (
      <Svg>
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
        <polyline points="22,6 12,13 2,6" />
      </Svg>
    ),
  },
  {
    label: "Address",
    text: "Pinagdanlayan, Dolores, Quezon",
    href: undefined,
    icon: (
      <Svg>
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
        <circle cx="12" cy="10" r="3" />
      </Svg>
    ),
  },
];

// Placeholder links. Replace "#" with the real URLs.
const SOCIALS = [
  {
    label: "Facebook",
    href: "#",
    icon: (
      <Svg>
        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
      </Svg>
    ),
  },
  {
    label: "YouTube",
    href: "#",
    icon: (
      <Svg>
        <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" />
        <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" />
      </Svg>
    ),
  },
  {
    label: "Instagram",
    href: "#",
    icon: (
      <Svg>
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
      </Svg>
    ),
  },
  {
    label: "Twitter",
    href: "#",
    icon: (
      <Svg>
        <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z" />
      </Svg>
    ),
  },
  {
    label: "Telegram",
    href: "#",
    icon: (
      <Svg>
        <line x1="22" y1="2" x2="11" y2="13" />
        <polygon points="22 2 15 22 11 13 2 9 22 2" />
      </Svg>
    ),
  },
];

const columnHeading = {
  fontSize: "1.75rem",
  lineHeight: 1.2,
  letterSpacing: "0.02em",
} as const;

export function Footer() {
  return (
    <footer
      id="contact"
      className={cn(
        poppins.className,
        "border-t border-[#b9822a]/30 bg-black text-white",
      )}
    >
      <div className="mx-auto max-w-6xl px-6 pb-8 pt-20">
        <div className="grid gap-12 md:grid-cols-[1.4fr_1fr_1.2fr] md:gap-16">
          {/* Brand */}
          <Reveal>
            <MetallicGoldText
              as="p"
              className={cn(anton.className, "select-none")}
              style={{
                fontSize: "clamp(3rem, 6vw, 4.5rem)",
                lineHeight: 1.1,
                letterSpacing: "0.01em",
              }}
            >
              PRIC
            </MetallicGoldText>
            <p className="mt-4 max-w-xs text-base leading-relaxed text-white/80">
              Supporting local farmers and turning agricultural products into
              sustainable livelihood opportunities.
            </p>
            <ul className="mt-8 flex flex-wrap gap-4">
              {SOCIALS.map((s) => (
                <li key={s.label}>
                  <a
                    href={s.href}
                    aria-label={s.label}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-[#d9a346] hover:text-black"
                  >
                    {s.icon}
                  </a>
                </li>
              ))}
            </ul>
          </Reveal>

          {/* Quick links */}
          <Reveal delay={150}>
            <MetallicGoldText
              as="h3"
              className={anton.className}
              style={columnHeading}
            >
              Quick Links
            </MetallicGoldText>
            <ul className="mt-6 space-y-3">
              {QUICK_LINKS.map((l) => (
                <li key={l.label}>
                  <a
                    href={l.href}
                    className="text-white/80 transition-colors hover:text-[#f4d587]"
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </Reveal>

          {/* Contact */}
          <Reveal delay={300}>
            <MetallicGoldText
              as="h3"
              className={anton.className}
              style={columnHeading}
            >
              Contact Us
            </MetallicGoldText>
            <ul className="mt-6 space-y-4">
              {CONTACTS.map((c) => (
                <li key={c.label} className="flex items-start gap-3">
                  <span className="mt-0.5 text-[#d9a346]">{c.icon}</span>
                  {c.href ? (
                    <a
                      href={c.href}
                      className="break-all text-white/80 transition-colors hover:text-[#f4d587]"
                    >
                      {c.text}
                    </a>
                  ) : (
                    <span className="text-white/80">{c.text}</span>
                  )}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>

        <div className="mt-14 border-t border-white/10 pt-6 text-sm text-white/60">
          © 2026 PRIC-MPC. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

export default Footer;