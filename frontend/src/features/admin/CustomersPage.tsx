"use client";

import * as React from "react";

import type { CustomerStats } from "@/lib/admin-customers";
import { COMPARE_LABELS, RANGE_LABELS, formatRangeSpan, type RangeKey } from "@/lib/admin-stats";
import { GOLD_GRADIENT } from "@/lib/theme";
import { cn } from "@/lib/utils";

import { AddAccountModal, type CreatedAccount } from "./AddAccountModal";
import { TileSkeleton } from "./BusinessTiles";
import { CustomerDrawer } from "./CustomerDrawer";
import { CustomerList } from "./CustomerList";
import { CustomerStatsView } from "./CustomerStatsView";
import { RangeToolbar } from "./RangeToolbar";
import { ErrorBanner } from "./ui";
import { useAdminStat, useRangeState } from "./use-admin-stat";

type Notice = { type: "success" | "error"; message: string } | null;

const SKELETON = [
  "", "", "", "",
  "md:col-span-2 min-h-[20rem]", "md:col-span-2 min-h-[20rem]",
  "", "", "", "",
];

export function CustomersPage({ initialRange }: { initialRange: RangeKey }) {
  const [range, setRange] = useRangeState(initialRange);
  const { data, error, loading, updatedAt, refresh } = useAdminStat<CustomerStats>(
    "/api/admin/customers/stats",
    range,
  );

  const [listVersion, setListVersion] = React.useState(0);
  const [selected, setSelected] = React.useState<string | null>(null);
  const [adding, setAdding] = React.useState(false);
  const [notice, setNotice] = React.useState<Notice>(null);

  const closeDrawer = React.useCallback(() => setSelected(null), []);
  const closeAdd = React.useCallback(() => setAdding(false), []);

  const changed = React.useCallback(() => {
    setListVersion((v) => v + 1);
    refresh();
  }, [refresh]);

  function onCreated(a: CreatedAccount) {
    setAdding(false);
    changed();
    setNotice(
      a.inviteEmailSent
        ? {
            type: "success",
            message:
              a.role === "rider"
                ? `Rider account created. An invitation was emailed to ${a.email}. Riders are managed from Orders once that page is ready.`
                : `Customer account created. An invitation was emailed to ${a.email}.`,
          }
        : {
            type: "error",
            message: `The account for ${a.email} was created, but the invitation email couldn't be sent. Open the customer and use "Resend invitation".`,
          },
    );
  }

  const stale = loading && data?.range.key !== range;
  const compare = COMPARE_LABELS[range];

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white md:text-3xl">Customers</h1>
            <p className="mt-1.5 text-sm text-white/60">
              {data && data.range.key === range
                ? `${RANGE_LABELS[range]} · ${formatRangeSpan(data.range)} (Philippine time)`
                : RANGE_LABELS[range]}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="rounded-full px-5 py-2.5 text-sm font-bold text-black shadow-lg transition-transform hover:scale-[1.03]"
            style={{ backgroundImage: GOLD_GRADIENT }}
          >
            Add account
          </button>
        </div>
        <RangeToolbar
          range={range}
          onChange={setRange}
          loading={loading}
          updatedAt={updatedAt}
          onRefresh={refresh}
        />
      </header>

      {notice && (
        <div
          role={notice.type === "error" ? "alert" : "status"}
          className={cn(
            "flex items-start justify-between gap-4 rounded-2xl border px-4 py-3 text-sm",
            notice.type === "error"
              ? "border-red-400/30 bg-red-500/10 text-red-200"
              : "border-emerald-400/30 bg-emerald-500/10 text-emerald-200",
          )}
        >
          <span>{notice.message}</span>
          <button
            type="button"
            onClick={() => setNotice(null)}
            aria-label="Dismiss"
            className="shrink-0 rounded-full px-2 text-lg leading-none opacity-70 hover:opacity-100"
          >
            ×
          </button>
        </div>
      )}

      {error && <ErrorBanner message={error} onRetry={refresh} />}

      <div
        aria-busy={stale}
        className={cn(
          "grid gap-4 transition-opacity duration-200 md:grid-cols-2 lg:grid-cols-4",
          stale && "opacity-60",
        )}
      >
        {data ? (
          <CustomerStatsView data={data} compare={compare} onOpen={setSelected} />
        ) : (
          SKELETON.map((cls, i) => <TileSkeleton key={i} className={cls} />)
        )}
      </div>

      <CustomerList reloadKey={listVersion} onOpen={setSelected} />

      {selected && <CustomerDrawer email={selected} onClose={closeDrawer} onChanged={changed} />}
      {adding && <AddAccountModal onClose={closeAdd} onCreated={onCreated} />}
    </div>
  );
}

export default CustomersPage;