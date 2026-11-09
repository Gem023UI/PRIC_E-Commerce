"use client";

import * as React from "react";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Add01Icon,
  Delete02Icon,
  MinusSignIcon,
  ShoppingCart01Icon,
} from "@hugeicons/core-free-icons";

import { MetallicGoldText } from "@/components/brand/MetallicGoldText";
import { poppins } from "@/lib/fonts";
import { GOLD_GRADIENT } from "@/lib/theme";
import { cn } from "@/lib/utils";
import { removeFromCart, setQuantity, useCart } from "@/lib/cart";

const peso = (n: number) => `PHP ${n.toFixed(2)}`;

export function CartPage() {
  const items = useCart();
  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);

  return (
    <main
      className={cn(poppins.className, "relative min-h-screen text-white")}
    >
      <div
        className="fixed inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url(/productbg.png)" }}
      >
        <div className="absolute inset-0 bg-black/70" />
      </div>

      <div className="relative mx-auto max-w-5xl px-5 pb-20 pt-28">
        <MetallicGoldText
          as="h1"
          fold={false}
          className="text-3xl font-bold uppercase md:text-5xl"
        >
          Your Cart
        </MetallicGoldText>

        {items.length === 0 ? (
          <div className="mt-12 flex flex-col items-center gap-5 rounded-2xl border border-white/15 bg-black/40 px-6 py-16 text-center backdrop-blur-xl">
            <HugeiconsIcon
              icon={ShoppingCart01Icon}
              size={48}
              className="text-[#d9a346]"
            />
            <p className="text-lg">Your cart is empty.</p>
            <Link
              href="/products/#product-grid"
              className="rounded-lg px-7 py-2.5 text-sm font-bold uppercase text-black transition-transform hover:scale-[1.03]"
              style={{ backgroundImage: GOLD_GRADIENT }}
            >
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="mt-10 grid gap-8 md:grid-cols-[1fr_20rem]">
            <ul className="flex flex-col gap-4">
              {items.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center gap-4 rounded-2xl border border-white/15 bg-black/40 p-4 backdrop-blur-xl"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.image}
                    alt={item.name}
                    className="size-20 shrink-0 object-contain md:size-24"
                  />

                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{item.name}</p>
                    <p className="mt-1 text-sm text-white/70">
                      {peso(item.price)}
                    </p>

                    <div className="mt-3 inline-flex items-center rounded-full border border-[#d9a346]/50">
                      <button
                        type="button"
                        aria-label={`Decrease quantity of ${item.name}`}
                        onClick={() => setQuantity(item.id, item.quantity - 1)}
                        className="flex size-8 items-center justify-center rounded-full text-[#f4d587] hover:bg-white/10"
                      >
                        <HugeiconsIcon icon={MinusSignIcon} size={14} />
                      </button>
                      <span className="w-8 text-center text-sm">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        aria-label={`Increase quantity of ${item.name}`}
                        onClick={() => setQuantity(item.id, item.quantity + 1)}
                        className="flex size-8 items-center justify-center rounded-full text-[#f4d587] hover:bg-white/10"
                      >
                        <HugeiconsIcon icon={Add01Icon} size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-3">
                    <p className="font-bold">
                      {peso(item.price * item.quantity)}
                    </p>
                    <button
                      type="button"
                      aria-label={`Remove ${item.name}`}
                      onClick={() => removeFromCart(item.id)}
                      className="text-white/60 transition-colors hover:text-red-400"
                    >
                      <HugeiconsIcon icon={Delete02Icon} size={18} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>

            <aside className="h-fit rounded-2xl border border-white/15 bg-black/40 p-6 backdrop-blur-xl">
              <h2 className="text-lg font-semibold">Order Summary</h2>
              <div className="mt-5 flex items-center justify-between text-sm">
                <span className="text-white/70">Subtotal</span>
                <span className="text-lg font-bold">{peso(subtotal)}</span>
              </div>
              <button
                type="button"
                className="mt-6 w-full rounded-lg px-7 py-2.5 text-sm font-bold uppercase text-black transition-transform hover:scale-[1.02]"
                style={{ backgroundImage: GOLD_GRADIENT }}
              >
                Checkout
              </button>
              <Link
                href="/products"
                className="mt-3 block text-center text-sm text-white/70 hover:text-[#f4d587]"
              >
                Continue shopping
              </Link>
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}

export default CartPage;