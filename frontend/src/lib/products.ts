"use client";

import * as React from "react";

import type { ProductItem } from "@/data/products";

/** The live product catalog (published products only), freshly loaded on each page. */
export function useProducts() {
  const [state, setState] = React.useState<{
    products: ProductItem[];
    loading: boolean;
    error: boolean;
  }>({ products: [], loading: true, error: false });

  React.useEffect(() => {
    const ctrl = new AbortController();
    (async () => {
      try {
        const res = await fetch("/api/products", { cache: "no-store", signal: ctrl.signal });
        if (!res.ok) throw new Error(String(res.status));
        const data = (await res.json()) as { products: ProductItem[] };
        setState({ products: data.products, loading: false, error: false });
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        setState({ products: [], loading: false, error: true });
      }
    })();
    return () => ctrl.abort();
  }, []);

  return state;
}