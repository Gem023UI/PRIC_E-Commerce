import { formatInt, formatPeso, type Business, type ProductStat } from "@/lib/admin-stats";
import { PAYMENT_LABELS } from "@/lib/orders";
import { GOLD_GRADIENT } from "@/lib/theme";
import { cn } from "@/lib/utils";

import { Tile, Value } from "./BusinessTiles";
import { CARD } from "./ui";

/** Best seller / highest revenue: the product, with the figure that earned it the spot. */
export function ProductSpotlightTile({
  label,
  description,
  product,
  highlight,
  className,
}: {
  label: string;
  description: string;
  product: ProductStat | null;
  highlight: "units" | "revenue";
  className?: string;
}) {
  const image = product?.image;

  return (
    <Tile label={label} description={description} className={className}>
      {product ? (
        <div className="flex items-center gap-4">
          <div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white/5">
            {image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={image} alt="" className="size-full object-contain" />
            )}
          </div>
          <div className="min-w-0">
            <p className="line-clamp-2 text-sm font-semibold leading-snug text-white">
              {product.name}
            </p>
            <Value size="lg" className="mt-1">
              {highlight === "units"
                ? `${formatInt(product.units)} units`
                : formatPeso(product.revenue)}
            </Value>
            <p className="mt-0.5 text-xs text-white/55">
              {highlight === "units"
                ? `${formatPeso(product.revenue)} in sales`
                : `${formatInt(product.units)} units sold`}
            </p>
          </div>
        </div>
      ) : (
        <p className="py-4 text-sm text-white/55">No completed sales in this period yet.</p>
      )}
    </Tile>
  );
}

export function TopProductsTile({
  products,
  className,
}: {
  products: Business["topProducts"];
  className?: string;
}) {
  const max = Math.max(1, ...products.map((p) => p.revenue));

  return (
    <article className={cn(CARD, "p-5 md:p-6", className)}>
      <h3 className="text-lg font-semibold text-white">Top products</h3>
      <p className="mt-1 text-sm text-white/60">By revenue, with their share of gross sales.</p>

      {products.length === 0 ? (
        <p className="mt-6 text-sm text-white/55">No completed sales in this period yet.</p>
      ) : (
        <ol className="mt-5 space-y-4">
          {products.map((p, i) => (
            <li key={p.productId}>
              <div className="flex items-baseline justify-between gap-4 text-sm">
                <span className="flex min-w-0 items-baseline gap-2">
                  <span className="w-4 shrink-0 text-xs tabular-nums text-white/40">{i + 1}</span>
                  <span className="truncate text-white/90">{p.name}</span>
                </span>
                <span className="shrink-0 font-semibold tabular-nums text-white">
                  {formatPeso(p.revenue)}
                </span>
              </div>
              <div className="ml-6 mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${(p.revenue / max) * 100}%`, backgroundImage: GOLD_GRADIENT }}
                />
              </div>
              <p className="ml-6 mt-1 text-xs text-white/50">
                {formatInt(p.units)} {p.units === 1 ? "unit" : "units"} · {p.share}% of gross sales
              </p>
            </li>
          ))}
        </ol>
      )}
    </article>
  );
}

const METHOD_COLORS: Record<string, string> = {
  cod: "#efc673",
  gcash: "#60a5fa",
  paymaya: "#34d399",
  bank: "#a78bfa",
};

export function PaymentMixTile({
  mix,
  className,
}: {
  mix: Business["paymentMix"];
  className?: string;
}) {
  const total = mix.reduce((s, m) => s + m.amount, 0);

  return (
    <article className={cn(CARD, "p-5 md:p-6", className)}>
      <h3 className="text-lg font-semibold text-white">Payment methods</h3>
      <p className="mt-1 text-sm text-white/60">
        How customers paid for completed orders, by gross sales.
      </p>

      {total === 0 ? (
        <p className="mt-6 text-sm text-white/55">No completed sales in this period yet.</p>
      ) : (
        <>
          <div className="mt-5 flex h-3 overflow-hidden rounded-full bg-white/10">
            {mix
              .filter((m) => m.amount > 0)
              .map((m) => (
                <div
                  key={m.method}
                  title={`${PAYMENT_LABELS[m.method]}: ${formatPeso(m.amount)}`}
                  style={{ width: `${(m.amount / total) * 100}%`, background: METHOD_COLORS[m.method] }}
                />
              ))}
          </div>
          <ul className="mt-5 space-y-3">
            {mix.map((m) => (
              <li key={m.method} className="flex items-center justify-between gap-4 text-sm">
                <span className="inline-flex items-center gap-2 text-white/85">
                  <span
                    className="size-2.5 rounded-full"
                    style={{ background: METHOD_COLORS[m.method] }}
                  />
                  {PAYMENT_LABELS[m.method]}
                </span>
                <span className="text-right tabular-nums text-white/60">
                  <span className="font-semibold text-white">{formatPeso(m.amount)}</span>
                  {" · "}
                  {Math.round((m.amount / total) * 100)}% · {formatInt(m.orders)}{" "}
                  {m.orders === 1 ? "order" : "orders"}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </article>
  );
}