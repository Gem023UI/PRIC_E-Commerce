"use client";

import * as React from "react";

export type CartItem = {
  id: number;
  name: string;
  price: number;
  image: string;
  quantity: number;
};

const KEY = "pric-cart";
const EMPTY: CartItem[] = [];

let items: CartItem[] = EMPTY;
let loaded = false;
const listeners = new Set<() => void>();

function read(): CartItem[] {
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : EMPTY;
    return Array.isArray(parsed) ? parsed : EMPTY;
  } catch {
    return EMPTY;
  }
}

function emit() {
  listeners.forEach((l) => l());
}

function commit(next: CartItem[]) {
  items = next;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* storage unavailable: keep in-memory cart */
  }
  emit();
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      items = read();
      emit();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", onStorage);
  };
}

function getSnapshot() {
  if (!loaded) {
    loaded = true;
    items = read();
  }
  return items;
}

const getServerSnapshot = () => EMPTY;

export function useCart() {
  return React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function useCartCount() {
  const cart = useCart();
  return cart.reduce((sum, i) => sum + i.quantity, 0);
}

export function addToCart(
  product: Omit<CartItem, "quantity">,
  quantity = 1,
) {
  const cart = getSnapshot();
  const existing = cart.find((i) => i.id === product.id);
  commit(
    existing
      ? cart.map((i) =>
          i.id === product.id ? { ...i, quantity: i.quantity + quantity } : i,
        )
      : [
          ...cart,
          {
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.image,
            quantity,
          },
        ],
  );
}

export function setQuantity(id: number, quantity: number) {
  const cart = getSnapshot();
  commit(
    quantity <= 0
      ? cart.filter((i) => i.id !== id)
      : cart.map((i) => (i.id === id ? { ...i, quantity } : i)),
  );
}

export function removeFromCart(id: number) {
  commit(getSnapshot().filter((i) => i.id !== id));
}

export function clearCart() {
  commit(EMPTY);
}