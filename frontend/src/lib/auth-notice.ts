export type AuthNotice = { type: "success" | "error"; message: string } | null;

type Params = Record<string, string | string[] | undefined>;

const first = (v: string | string[] | undefined) =>
  Array.isArray(v) ? v[0] : v;

export function toNotice(sp: Params): AuthNotice {
  const verified = first(sp.verified);
  if (verified === "1") {
    return { type: "success", message: "Email verified! You can now log in." };
  }
  if (verified === "0") {
    return {
      type: "error",
      message:
        first(sp.reason) === "expired"
          ? "That verification link has expired. Log in to get a new one."
          : "That verification link is invalid or was already used.",
    };
  }
  const error = first(sp.error);
  if (error) {
    return {
      type: "error",
      message:
        error === "OAuthAccountNotLinked"
          ? "This email is already registered with another sign-in method."
          : "Something went wrong while signing you in. Please try again.",
    };
  }
  return null;
}