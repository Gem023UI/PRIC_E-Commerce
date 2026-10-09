import { createHash } from "node:crypto";

import jwt from "jsonwebtoken";

import { env } from "../src/config/env";
import { User } from "../src/database/models/user.model";
import { randomToken, safeEqual } from "../src/utils/crypto";
import { HttpError } from "../src/utils/httpError";

export type Provider = "google" | "facebook";

export const isProvider = (v: unknown): v is Provider =>
  v === "google" || v === "facebook";

export interface OAuthProfile {
  provider: Provider;
  providerAccountId: string;
  email: string | null;
  emailVerified: boolean;
  firstName: string;
  lastName: string;
  image?: string;
}

const redirectUri = (p: Provider) =>
  `${env.FRONTEND_URL}/api/auth/${p}/callback`;

export function isConfigured(p: Provider) {
  return p === "google"
    ? !!(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET)
    : !!(env.FACEBOOK_APP_ID && env.FACEBOOK_APP_SECRET);
}

/** Builds the provider URL plus a signed, short-lived transaction token (state + PKCE verifier). */
export function buildAuthorization(p: Provider) {
  const state = randomToken(24);
  const verifier = p === "google" ? randomToken(48) : undefined;

  let url: URL;
  if (p === "google") {
    url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    url.search = new URLSearchParams({
      client_id: env.GOOGLE_CLIENT_ID!,
      redirect_uri: redirectUri(p),
      response_type: "code",
      scope: "openid email profile",
      state,
      code_challenge: createHash("sha256")
        .update(verifier!)
        .digest("base64url"),
      code_challenge_method: "S256",
      prompt: "select_account",
    }).toString();
  } else {
    url = new URL(
      `https://www.facebook.com/${env.FACEBOOK_GRAPH_VERSION}/dialog/oauth`,
    );
    url.search = new URLSearchParams({
      client_id: env.FACEBOOK_APP_ID!,
      redirect_uri: redirectUri(p),
      response_type: "code",
      scope: "email,public_profile",
      state,
    }).toString();
  }

  const txToken = jwt.sign({ p, state, verifier }, env.JWT_SECRET, {
    algorithm: "HS256",
    expiresIn: 600,
    audience: "pric-oauth",
  });

  return { url: url.toString(), txToken };
}

/** Validates the state echoed by the provider against the cookie; returns the PKCE verifier. */
export function readTransaction(
  token: string | undefined,
  p: Provider,
  state: string,
): string | undefined {
  try {
    if (!token) throw new Error("missing transaction");
    const payload = jwt.verify(token, env.JWT_SECRET, {
      algorithms: ["HS256"],
      audience: "pric-oauth",
    }) as jwt.JwtPayload;
    if (
      payload.p !== p ||
      typeof payload.state !== "string" ||
      !safeEqual(payload.state, state)
    ) {
      throw new Error("state mismatch");
    }
    return typeof payload.verifier === "string" ? payload.verifier : undefined;
  } catch {
    throw new HttpError(400, "Invalid OAuth state", "oauth_state");
  }
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { ...init, signal: AbortSignal.timeout(10_000) });
  if (!res.ok) {
    throw new HttpError(502, "OAuth provider request failed", "oauth_provider");
  }
  return (await res.json()) as T;
}

export async function fetchProfile(
  p: Provider,
  code: string,
  verifier?: string,
): Promise<OAuthProfile> {
  if (p === "google") {
    const token = await fetchJson<{ access_token: string }>(
      "https://oauth2.googleapis.com/token",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code,
          client_id: env.GOOGLE_CLIENT_ID!,
          client_secret: env.GOOGLE_CLIENT_SECRET!,
          redirect_uri: redirectUri(p),
          grant_type: "authorization_code",
          code_verifier: verifier ?? "",
        }),
      },
    );

    const info = await fetchJson<{
      sub: string;
      email?: string;
      email_verified?: boolean;
      given_name?: string;
      family_name?: string;
      name?: string;
      picture?: string;
    }>("https://openidconnect.googleapis.com/v1/userinfo", {
      headers: { Authorization: `Bearer ${token.access_token}` },
    });

    return {
      provider: "google",
      providerAccountId: info.sub,
      email: info.email?.toLowerCase() ?? null,
      emailVerified: info.email_verified === true,
      firstName: info.given_name ?? info.name ?? "Member",
      lastName: info.family_name ?? "",
      image: info.picture,
    };
  }

  const tokenUrl = new URL(
    `https://graph.facebook.com/${env.FACEBOOK_GRAPH_VERSION}/oauth/access_token`,
  );
  tokenUrl.search = new URLSearchParams({
    client_id: env.FACEBOOK_APP_ID!,
    client_secret: env.FACEBOOK_APP_SECRET!,
    redirect_uri: redirectUri(p),
    code,
  }).toString();
  const token = await fetchJson<{ access_token: string }>(tokenUrl.toString());

  const meUrl = new URL("https://graph.facebook.com/me");
  meUrl.search = new URLSearchParams({
    fields: "id,first_name,last_name,email,picture.type(large)",
    access_token: token.access_token,
  }).toString();
  const me = await fetchJson<{
    id: string;
    first_name?: string;
    last_name?: string;
    email?: string;
    picture?: { data?: { url?: string } };
  }>(meUrl.toString());

  return {
    provider: "facebook",
    providerAccountId: me.id,
    email: me.email?.toLowerCase() ?? null,
    emailVerified: false, // Facebook doesn't guarantee a verified email
    firstName: me.first_name ?? "Member",
    lastName: me.last_name ?? "",
    image: me.picture?.data?.url,
  };
}

/** Finds, links or creates the local user for an OAuth identity. */
export async function resolveUser(profile: OAuthProfile) {
  const { provider, providerAccountId } = profile;

  const linked = await User.findOne({
    accounts: { $elemMatch: { provider, providerAccountId } },
  });
  if (linked) return linked;

  if (!profile.email) {
    throw new HttpError(400, "No email from provider", "oauth_no_email");
  }

  const existing = await User.findOne({ email: profile.email }).select(
    "+passwordHash",
  );

  if (existing) {
    // Only link when the provider vouches for the email.
    if (!profile.emailVerified) {
      throw new HttpError(409, "Email already in use", "oauth_email_in_use");
    }
    existing.accounts.push({ provider, providerAccountId });
    if (!existing.emailVerified) {
      // Account was never verified: drop any password set by whoever
      // registered first, so it can't be used to hijack this identity.
      existing.emailVerified = new Date();
      existing.set("passwordHash", undefined);
    }
    if (!existing.image && profile.image) existing.image = profile.image;
    await existing.save();
    return existing;
  }

  return User.create({
    firstName: profile.firstName,
    lastName: profile.lastName,
    email: profile.email,
    emailVerified: profile.emailVerified ? new Date() : null,
    image: profile.image,
    accounts: [{ provider, providerAccountId }],
  });
}