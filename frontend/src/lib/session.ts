import { cookies } from "next/headers";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:4000";
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY ?? "";

export type SessionUser = {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  image: string | null;
};

/** Reads the current user from the Express API, forwarding the browser's cookies. */
export async function getSession(): Promise<SessionUser | null> {
  const cookie = (await cookies()).toString();
  if (!cookie) return null;

  try {
    const res = await fetch(`${BACKEND_URL}/api/auth/me`, {
      headers: { cookie, "x-internal-key": INTERNAL_API_KEY },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { user: SessionUser };
    return data.user;
  } catch {
    return null;
  }
}