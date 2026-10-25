import type { Metadata } from "next";
import { Anton, Poppins } from "next/font/google";

import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { MetallicGoldText } from "@/components/brand/MetallicGoldText";
import { Reveal } from "@/components/motion/Reveal";
import InquiryForm, {
  type InquiryField,
} from "@/components/ui/InquiryForm";
import { cn } from "@/lib/utils";

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

// Temporary placeholder. Replace with authentic photos per service
// (rental inventory, financial-service operations, production activities).
const PLACEHOLDER_IMAGE =
  "https://res.cloudinary.com/dxnb2ozgw/image/upload/v1791293234/612322887_4315845935405170_8954860117997094961_n_gmtw60.jpg";

const GOLD_GRADIENT =
  "linear-gradient(135deg, #fde7a0 0%, #efc673 14%, #b9822a 30%, #8a5a18 42%, #c8933a 56%, #f4d587 66%, #d9a346 78%, #a8731f 90%, #e8b45c 100%)";

const headingStyle = {
  fontSize: "clamp(1.75rem, 4vw, 3.25rem)",
  lineHeight: 1.15,
} as const;

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

/* ---------- Content ---------- */

type Group = { title?: string; items: string[] };

type Service = {
  id: string;
  number: string;
  name: string;
  short: string;
  cta: string;
  Icon: (p: IconProps) => React.JSX.Element;
  subtitle: string;
  intro: string[];
  groups: Group[];
  howItWorks: string;
  notice?: { label: string; text: string };
  imageAlt: string;
  form: {
    title: string;
    submitLabel: string;
    notice: string;
    fields: InquiryField[];
  };
};

const contactFields: InquiryField[] = [
  { name: "fullName", label: "Full name", required: true },
  {
    name: "mobile",
    label: "Mobile number",
    type: "tel",
    required: true,
    placeholder: "09XX XXX XXXX",
  },
  { name: "email", label: "Email", type: "email", required: true, full: true },
];

const SERVICES: Service[] = [
  {
    id: "rentals",
    number: "01",
    name: "Rentals for Catering Events",
    short:
      "Rental support for family celebrations, community gatherings, and organizational events.",
    cta: "Inquire About Rentals",
    Icon: RentalIcon,
    subtitle: "Making Every Occasion More Convenient",
    intro: [
      "PRIC MPC offers rental services intended to support catering events and related occasions. Whether for family celebrations, community gatherings, organizational activities, or business functions, our rental service helps customers access the resources they need for their events.",
    ],
    groups: [
      {
        items: [
          "Rental arrangements for catering-related events.",
          "Options for private celebrations, community gatherings, and organizational functions.",
          "Advance booking and reservation inquiries.",
          "Coordination of rental schedules and availability.",
        ],
      },
    ],
    howItWorks:
      "Customers may inquire about available rental items, rates, reservation requirements, and rental periods. Once the requested arrangements are confirmed, the customer can proceed with the cooperative's booking process.",
    notice: {
      label: "Please note",
      text: "Available items, rental rates, security deposits, delivery arrangements, and reservation terms are subject to confirmation with PRIC MPC.",
    },
    imageAlt: "Catering event rental items from PRIC MPC",
    form: {
      title: "Rental inquiry",
      submitLabel: "Send Rental Inquiry",
      notice:
        "Sending this form does not reserve any items. PRIC MPC will confirm availability and terms with you.",
      fields: [
        ...contactFields,
        { name: "eventDate", label: "Event date", type: "date", required: true },
        {
          name: "eventType",
          label: "Event type",
          type: "select",
          required: true,
          options: [
            "Family celebration",
            "Community gathering",
            "Organizational activity",
            "Business function",
            "Other",
          ],
        },
        {
          name: "guests",
          label: "Expected guests",
          type: "number",
          required: true,
        },
        {
          name: "rentalNeeds",
          label: "Rental needs",
          type: "textarea",
          required: true,
          placeholder: "List the items or setup you need.",
        },
      ],
    },
  },
  {
    id: "financing",
    number: "02",
    name: "Loans and Micro-financing",
    short:
      "Loan and micro-financing inquiries for eligible members and livelihood activities.",
    cta: "Explore Financing",
    Icon: FinanceIcon,
    subtitle: "Accessible Financial Opportunities for Members",
    intro: [
      "PRIC MPC provides loan and micro-financing services intended to support eligible members with their financial needs and economic activities, subject to the cooperative's approved lending programs and policies.",
      "Micro-financing can help qualified borrowers explore funding opportunities for small-scale livelihood activities, business initiatives, and other permitted purposes. Through its financial services, the cooperative aims to support responsible borrowing and economic participation.",
    ],
    groups: [
      {
        items: [
          "Loan inquiries and application assistance.",
          "Micro-financing opportunities for eligible borrowers.",
          "Financing inquiries related to livelihood and small business activities, where permitted.",
          "Information about repayment arrangements and applicable charges.",
          "Guidance on the cooperative's assessment and approval process.",
        ],
      },
    ],
    howItWorks:
      "Interested applicants may inquire about the available loan programs, eligibility criteria, documentary requirements, and applicable financial terms. Applications are evaluated according to the cooperative's established procedures.",
    notice: {
      label: "Important information",
      text: "Loan availability, maximum borrowing amounts, interest rates, payment schedules, collateral requirements, and approval conditions depend on the specific financing program offered by PRIC MPC.",
    },
    imageAlt: "PRIC MPC financing services",
    form: {
      title: "Financing inquiry",
      submitLabel: "Send Financing Inquiry",
      notice:
        "This is an inquiry only, not a loan application. It does not guarantee approval. Do not include ID or bank account numbers.",
      fields: [
        ...contactFields,
        {
          name: "topic",
          label: "What would you like to know?",
          type: "select",
          required: true,
          options: [
            "Available loan programs",
            "Eligibility criteria",
            "Documentary requirements",
            "Repayment and charges",
            "Application process",
          ],
        },
        {
          name: "purpose",
          label: "Intended purpose",
          type: "select",
          options: [
            "Livelihood activity",
            "Small business",
            "Other permitted purpose",
          ],
        },
        {
          name: "message",
          label: "Message",
          type: "textarea",
          placeholder: "Share any questions you have.",
        },
      ],
    },
  },
  {
    id: "savings-loans",
    number: "03",
    name: "Savings and Loans",
    short:
      "Savings facilities and loan programs that help members build financial stability.",
    cta: "Learn About Savings & Loans",
    Icon: SavingsIcon,
    subtitle: "Building Financial Stability Through Cooperation",
    intro: [
      "PRIC MPC's savings and loan services support the cooperative's financial-service activities and its goal of promoting responsible financial participation among eligible members.",
      "Savings services can help members develop consistent saving habits, while loan services may provide access to financing under the cooperative's approved terms. Together, these services can contribute to financial planning and the management of personal or livelihood-related needs.",
    ],
    groups: [
      {
        title: "Savings",
        items: [
          "Inquiries about available savings facilities and account arrangements.",
          "Information about applicable savings terms and conditions.",
          "Guidance on deposits and withdrawals.",
          "Information about member account records and financial transactions.",
        ],
      },
      {
        title: "Loans",
        items: [
          "Loan application and eligibility inquiries.",
          "Guidance on repayments and other applicable transactions.",
        ],
      },
    ],
    howItWorks:
      "Members may inquire about the savings facilities and loan programs currently available. The cooperative's authorized personnel can explain the requirements, applicable terms, transaction procedures, and relevant account arrangements.",
    notice: {
      label: "Important information",
      text: "Specific savings products, account-opening requirements, minimum balances, interest rates, withdrawal rules, loan eligibility, and repayment terms must be confirmed with PRIC MPC.",
    },
    imageAlt: "PRIC MPC savings and loan services",
    form: {
      title: "Savings and loans inquiry",
      submitLabel: "Send Inquiry",
      notice:
        "This is an inquiry only, not an account opening or loan application. Do not include ID or bank account numbers.",
      fields: [
        ...contactFields,
        {
          name: "topic",
          label: "I'm interested in",
          type: "select",
          required: true,
          options: ["Savings", "Loans", "Both savings and loans"],
        },
        {
          name: "message",
          label: "Message",
          type: "textarea",
          placeholder: "Share any questions you have.",
        },
      ],
    },
  },
  {
    id: "production",
    number: "04",
    name: "Manufacturing and Production",
    short:
      "Manufacturing and production activities, with supply and partnership inquiries.",
    cta: "Explore Production Services",
    Icon: ProductionIcon,
    subtitle: "Transforming Resources Into Valuable Products",
    intro: [
      "PRIC MPC engages in manufacturing and production activities that support its multipurpose operations and enterprise development. Through the production of goods, the cooperative creates opportunities to develop marketable products, support business activities, and contribute to local economic participation.",
    ],
    groups: [
      {
        items: [
          "Manufacturing and production operations.",
          "Product processing and preparation, where applicable.",
          "Production planning and operational activities.",
          "Product development and quality-related processes.",
          "Potential supply and production partnerships, subject to current capacity.",
        ],
      },
    ],
    howItWorks:
      "Businesses and other interested parties may inquire about the cooperative's production capabilities, existing product lines, supply arrangements, and potential commercial partnerships. Any proposed arrangement is subject to the cooperative's actual production capacity and operating requirements.",
    imageAlt: "PRIC MPC production activities",
    form: {
      title: "Production inquiry",
      submitLabel: "Send Production Inquiry",
      notice:
        "Any arrangement is subject to PRIC MPC's current production capacity and operating requirements.",
      fields: [
        { name: "fullName", label: "Contact person", required: true },
        { name: "organization", label: "Business or organization" },
        {
          name: "mobile",
          label: "Mobile number",
          type: "tel",
          required: true,
          placeholder: "09XX XXX XXXX",
        },
        { name: "email", label: "Email", type: "email", required: true },
        {
          name: "product",
          label: "Product or production requirement",
          required: true,
          full: true,
        },
        {
          name: "quantity",
          label: "Estimated quantity",
          required: true,
          placeholder: "e.g. 500 bottles per month",
        },
        {
          name: "intendedUse",
          label: "Intended use",
          type: "select",
          required: true,
          options: [
            "Resale",
            "Food service or catering",
            "Event or gift",
            "Partnership or supply",
            "Other",
          ],
        },
        {
          name: "message",
          label: "Additional details",
          type: "textarea",
        },
      ],
    },
  },
];

/* ---------- Page ---------- */

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#efc673]";

export default function ServicesPage() {
  return (
    <>
      <Header />
      <main className={cn(poppins.className, "bg-black text-white")}>
        {/* INTRO + DIRECTORY */}
        <section id="top" className="bg-black">
          <div className="mx-auto max-w-6xl px-6 pb-20 pt-32 md:pt-40">
            <Reveal>
              <MetallicGoldText
                as="h1"
                className={anton.className}
                style={{
                  fontSize: "clamp(2.5rem, 7vw, 5rem)",
                  lineHeight: 1.1,
                }}
              >
                OUR SERVICES
              </MetallicGoldText>
            </Reveal>
            <Reveal delay={150}>
              <p className="mt-6 max-w-2xl text-lg leading-snug md:text-xl">
                Empowering communities through cooperative services. Choose a
                service to see how it works and send an inquiry.
              </p>
            </Reveal>

            <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {SERVICES.map((s, i) => (
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
                        <s.Icon className="h-10 w-10 text-[#efc673]" />
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
              ))}
            </ul>
          </div>
        </section>

        {/* DETAIL SECTIONS */}
        {SERVICES.map((s) => (
          <section
            key={s.id}
            id={s.id}
            className="scroll-mt-24 border-t border-white/10 bg-black"
          >
            <div className="mx-auto max-w-6xl px-6 py-24">
              <Reveal>
                <p className="text-sm font-semibold tracking-widest text-[#efc673]">
                  {s.number}
                </p>
              </Reveal>
              <Reveal delay={100}>
                <MetallicGoldText
                  as="h2"
                  className={anton.className}
                  style={headingStyle}
                >
                  {s.name.toUpperCase()}
                </MetallicGoldText>
              </Reveal>
              <Reveal delay={200}>
                <h3 className="mt-4 text-xl font-medium md:text-2xl">
                  {s.subtitle}
                </h3>
              </Reveal>

              <div className="mt-12 grid gap-12 lg:grid-cols-5 lg:gap-14">
                {/* Information */}
                <div className="lg:col-span-3">
                  <Reveal>
                    <div
                      className="rounded-2xl p-[3px] shadow-xl"
                      style={{ backgroundImage: GOLD_GRADIENT }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={PLACEHOLDER_IMAGE}
                        alt={s.imageAlt}
                        className="aspect-[16/9] w-full rounded-[13px] bg-black object-cover"
                      />
                    </div>
                  </Reveal>

                  <div className="mt-8 space-y-4">
                    {s.intro.map((p, i) => (
                      <Reveal key={i} delay={i * 100}>
                        <p className="text-base leading-relaxed text-white/85 md:text-lg">
                          {p}
                        </p>
                      </Reveal>
                    ))}
                  </div>

                  <Reveal className="mt-10">
                    <h4 className="text-lg font-semibold text-[#f4d587]">
                      Service highlights
                    </h4>
                  </Reveal>
                  <div
                    className={cn(
                      "mt-4 grid gap-6",
                      s.groups.length > 1 && "md:grid-cols-2",
                    )}
                  >
                    {s.groups.map((g, gi) => (
                      <Reveal key={gi} delay={gi * 100}>
                        <div
                          className={cn(
                            s.groups.length > 1 &&
                              "h-full rounded-2xl border border-white/15 bg-white/5 p-5",
                          )}
                        >
                          {g.title ? (
                            <p className="mb-3 font-semibold text-white">
                              {g.title}
                            </p>
                          ) : null}
                          <ul className="space-y-3">
                            {g.items.map((item) => (
                              <li
                                key={item}
                                className="flex gap-3 text-base leading-relaxed text-white/80"
                              >
                                <span
                                  aria-hidden="true"
                                  className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#efc673]"
                                />
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </Reveal>
                    ))}
                  </div>

                  <Reveal className="mt-10">
                    <h4 className="text-lg font-semibold text-[#f4d587]">
                      How it works
                    </h4>
                    <p className="mt-3 text-base leading-relaxed text-white/80">
                      {s.howItWorks}
                    </p>
                  </Reveal>

                  {s.notice ? (
                    <Reveal className="mt-8">
                      <div className="rounded-2xl border border-[#c8933a]/40 bg-[#c8933a]/10 p-5">
                        <p className="font-semibold text-[#f4d587]">
                          {s.notice.label}
                        </p>
                        <p className="mt-2 text-sm leading-relaxed text-white/80 md:text-base">
                          {s.notice.text}
                        </p>
                      </div>
                    </Reveal>
                  ) : null}
                </div>

                {/* Inquiry form */}
                <div className="lg:col-span-2">
                  <Reveal delay={150} className="lg:sticky lg:top-28">
                    <InquiryForm
                      service={s.name}
                      title={s.form.title}
                      fields={s.form.fields}
                      submitLabel={s.form.submitLabel}
                      notice={s.form.notice}
                    />
                  </Reveal>
                </div>
              </div>
            </div>
          </section>
        ))}

        {/* CLOSING */}
        <section className="border-t border-white/10 bg-black">
          <div className="mx-auto max-w-4xl px-6 py-24 text-center">
            <Reveal>
              <MetallicGoldText
                as="h2"
                className={anton.className}
                style={headingStyle}
              >
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