"use client";

import * as React from "react";
import Link from "next/link";
import { createPortal } from "react-dom";

import PageShell from "@/components/layout/pageshell";
import { MetallicGoldText } from "@/components/brand/MetallicGoldText";
import { Reveal } from "@/components/motion/Reveal";
import { BRAND_LOGO, PRODUCT_LIST, type ProductItem } from "@/data/products";
import { anton } from "@/lib/fonts";
import { GOLD_GRADIENT } from "@/lib/theme";

import { ProductDetail } from "@/features/products/ProductDetails";

const titleStyle = {
  fontSize: "clamp(2.75rem, 8vw, 6rem)",
  lineHeight: 1.1,
} as const;

const headingStyle = {
  fontSize: "clamp(1.75rem, 4vw, 3.25rem)",
  lineHeight: 1.15,
} as const;

type Selected = { product: ProductItem; rect: DOMRect };

export default function ProductsPage() {
  const [selected, setSelected] = React.useState<Selected | null>(null);
  const thumbRefs = React.useRef<Record<number, HTMLDivElement | null>>({});

  const getThumbRect = React.useCallback(
    (id: number) => thumbRefs.current[id]?.getBoundingClientRect() ?? null,
    [],
  );
  const handleClosed = React.useCallback(() => setSelected(null), []);

  const open = (product: ProductItem) => {
    const rect = getThumbRect(product.id);
    if (rect) setSelected({ product, rect });
  };

  return (
    <PageShell>
      {/* Hero */}
      <section className="mx-auto grid max-w-6xl items-center gap-10 px-6 pb-20 md:grid-cols-2 md:gap-6">
        <div className="text-center md:text-left">
          <MetallicGoldText
            as="h1"
            className={anton.className}
            style={titleStyle}
          >
            PRODUCTS
          </MetallicGoldText>
          <Reveal delay={150}>
            <p className="mt-6 max-w-md text-base leading-snug md:text-lg">
              Check out the products manufactured and produced locally. The
              endeavours of the community are what brought this quality,
              affordable products forth the market and to our homes.
            </p>
          </Reveal>
        </div>
        <Reveal delay={250} y={32}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/products.png"
            alt="Hillside Ginger Brew products"
            className="mx-auto h-auto w-full max-w-xl object-contain"
          />
        </Reveal>
      </section>

      {/* Hillside product detail */}
      <section className="border-t border-[#b9822a]/30">
        <div className="mx-auto flex max-w-4xl flex-col items-center px-6 py-20 text-center">
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
              href="/contacts"
              className="mt-10 inline-flex items-center rounded-full px-8 py-3 font-semibold text-black shadow-lg transition-transform hover:scale-[1.03]"
              style={{ backgroundImage: GOLD_GRADIENT }}
            >
              Inquire About Our Products
            </Link>
          </Reveal>
        </div>
      </section>

      {/* Product grid */}
      <section className="mx-auto max-w-5xl px-6 pb-28 pt-10">
        <div className="grid grid-cols-2 gap-x-6 gap-y-12 md:grid-cols-3 md:gap-x-12">
          {PRODUCT_LIST.map((p, i) => (
            <Reveal key={p.id} delay={(i % 3) * 120}>
              <button
                type="button"
                onClick={() => open(p)}
                aria-label={`View ${p.name}`}
                className="relative block w-full cursor-pointer text-center transition-transform duration-300 ease-out hover:z-10 hover:scale-[1.2] focus-visible:z-10 focus-visible:scale-[1.2] focus-visible:outline-none"
              >
                <div
                  ref={(el) => {
                    thumbRefs.current[p.id] = el;
                  }}
                  className="aspect-square w-full"
                  style={{
                    visibility:
                      selected?.product.id === p.id ? "hidden" : "visible",
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.image}
                    alt={p.name}
                    className="h-full w-full object-contain"
                  />
                </div>
                <p className="mt-3 text-sm font-medium leading-snug md:text-base">
                  {p.name}
                </p>
              </button>
            </Reveal>
          ))}
        </div>
      </section>

      {selected &&
        createPortal(
          <ProductDetail
            key={selected.product.id}
            product={selected.product}
            fromRect={selected.rect}
            getReturnRect={getThumbRect}
            onClosed={handleClosed}
          />,
          document.body,
        )}
    </PageShell>
  );
}