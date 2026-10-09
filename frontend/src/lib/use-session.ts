"use client";

import * as React from "react";

export type SessionUser = {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  image: string | null;
};

let cache: Promise<SessionUser | null> | null = null;

async function fetchMe(): Promise<SessionUser | null> {
  try {
    const res = await fetch("/api/auth/me", { cache: "no-store" });
    if (!res.ok) return null;
    return ((await res.json()) as { user: SessionUser }).user;
  } catch {
    return null;
  }
}

/** Call after login / logout so the next useSession() refetches. */
export function clearSessionCache() {
  cache = null;
}

export function useSession() {
  const [state, setState] = React.useState<{
    loading: boolean;
    user: SessionUser | null;
  }>({ loading: true, user: null });

  React.useEffect(() => {
    let alive = true;
    cache ??= fetchMe();
    cache.then((user) => {
      if (alive) setState({ loading: false, user });
    });
    return () => {
      alive = false;
    };
  }, []);

  return state;
}