import Link from "next/link";

import PageShell from "@/components/layout/pageshell";
import { MetallicGoldText } from "@/components/brand/MetallicGoldText";
import { Reveal } from "@/components/motion/Reveal";
import { BRAND_LOGO, PRODUCT_LIST } from "@/data/products";
import { anton } from "@/lib/fonts";
import { GOLD_GRADIENT } from "@/lib/theme";

const titleStyle = {
  fontSize: "clamp(2.25rem, 6vw, 4.5rem)",
  lineHeight: 1.1,
} as const;

const headingStyle = {
  fontSize: "clamp(1.75rem, 4vw, 3.25rem)",
  lineHeight: 1.15,
} as const;

export default function ProductsPage() {
  return (
    <PageShell>
      {/* Intro */}
      <section className="mx-auto max-w-6xl px-6 pb-16 text-center">
        <MetallicGoldText
          as="h1"
          className={anton.className}
          style={titleStyle}
        >
          Our Products
        </MetallicGoldText>
        <Reveal delay={150}>
          <p className="mx-auto mt-6 max-w-3xl text-lg leading-snug md:text-xl">
            Value-added products made from locally sourced agricultural
            ingredients, produced by Hillside Food Products Inc. in support of
            the farmers and members of PRIC-MPC.
          </p>
        </Reveal>
      </section>

      {/* Product grid */}
      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {PRODUCT_LIST.map((p, i) => (
            <Reveal key={p.id} delay={(i % 3) * 120}>
              <article
                className="h-full rounded-2xl p-[2px] shadow-xl"
                style={{ backgroundImage: GOLD_GRADIENT }}
              >
                <div className="flex h-full flex-col overflow-hidden rounded-[14px] bg-neutral-950">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.image}
                    alt={p.name}
                    className="aspect-square w-full object-cover"
                  />
                  <div className="flex flex-1 flex-col gap-2 p-6">
                    <h2 className="text-xl font-semibold">{p.name}</h2>
                    <p className="flex-1 text-sm leading-relaxed text-white/75 md:text-base">
                      {p.description}
                    </p>
                    <Link
                      href="/contact"
                      className="mt-4 inline-flex w-fit items-center rounded-full border border-[#d9a346]/60 px-5 py-2 text-sm font-medium text-[#f4d587] transition-colors hover:bg-[#d9a346] hover:text-black"
                    >
                      Inquire
                    </Link>
                  </div>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Brand */}
      <section className="border-t border-[#b9822a]/30">
        <div className="mx-auto flex max-w-4xl flex-col items-center px-6 py-24 text-center">
          <Reveal>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={BRAND_LOGO}
              alt="Hillside Food Products logo"
              className="mx-auto w-44 object-contain md:w-56"
            />
          </Reveal>
          <div className="mt-8">
            <MetallicGoldText
              as="h2"
              className={anton.className}
              style={headingStyle}
            >
              Hillside Food Products Inc.
            </MetallicGoldText>
          </div>
          <Reveal delay={150}>
            <p className="mt-6 max-w-3xl text-lg leading-snug md:text-xl">
              Specializing in value-added products made from locally sourced
              agricultural ingredients, its products include ginger and
              turmeric-based beverages, flavored ginger brews, and other
              processed food products, helping PRIC-MPC turn local farm produce
              into marketable products and additional livelihood opportunities
              for its cooperative members.
            </p>
          </Reveal>
          <Reveal delay={300}>
            <Link
              href="/contact"
              className="mt-10 inline-flex items-center rounded-full px-8 py-3 font-semibold text-black shadow-lg transition-transform hover:scale-[1.03]"
              style={{ backgroundImage: GOLD_GRADIENT }}
            >
              Inquire About Our Products
            </Link>
          </Reveal>
        </div>
      </section>
    </PageShell>
  );
}