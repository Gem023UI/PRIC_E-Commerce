/* Shared types, API helpers, validation and guest-session helpers for orders. */

export type OrderStatus =
  | "to_confirm"
  | "to_ship"
  | "on_delivery"
  | "completed"
  | "cancelled";
export type PaymentMethod = "cod" | "gcash" | "paymaya" | "bank";
export type PaymentStatus = "unpaid" | "pending_verification" | "paid";

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  unpaid: "Unpaid",
  pending_verification: "Verifying payment",
  paid: "Paid",
};

export const SHIPPING_FEE = 50;

export const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  cod: "Cash on Delivery",
  gcash: "GCash",
  paymaya: "PayMaya",
  bank: "Bank Transfer",
};

export const STATUS_LABELS: Record<OrderStatus, string> = {
  to_confirm: "To Confirm",
  to_ship: "To Ship",
  on_delivery: "On Delivery",
  completed: "Completed",
  cancelled: "Cancelled",
};

export type Pin = { lat: number; lng: number };

export type OrderAddress = {
  street: string;
  barangay: string;
  city: string;
  province: string;
  postalCode: string;
  landmark: string;
  lat: number;
  lng: number;
};

export type OrderItem = {
  productId: number;
  name: string;
  price: number;
  image?: string;
  quantity: number;
};

export type Order = {
  id: string;
  trackingCode: string;
  trackingUrl: string;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  fullName: string;
  email: string;
  phone: string;
  address: OrderAddress;
  items: OrderItem[];
  itemCount: number;
  subtotal: number;
  shippingFee: number;
  total: number;
  notes: string;
  createdAt: string;
};

export const peso = (n: number) =>
  `PHP ${n.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const paymentNote = (m: PaymentMethod) =>
  m === "cod"
    ? "Please prepare the exact amount upon delivery."
    : `${PAYMENT_LABELS[m]} was selected. PRIC will contact you with payment instructions.`;

/* ---------- Sanitization + validation (the server repeats all of this) ---------- */

const NAME_RE = /^[\p{L}\p{M}][\p{L}\p{M} .'’-]{1,79}$/u;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PH_MOBILE = /^09\d{9}$/;

/* eslint-disable no-control-regex */
const stripControl = (s: string) =>
  s.normalize("NFKC").replace(/[\u0000-\u0008\u000B-\u001F\u007F]/g, "");
/* eslint-enable no-control-regex */

export const oneLine = (s: string) =>
  stripControl(s).replace(/[<>]/g, "").replace(/\s+/g, " ").trim();

const multiLine = (s: string) =>
  stripControl(s)
    .replace(/[<>]/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/ ?\n ?/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

export const toEmail = (s: string) => oneLine(s).toLowerCase();
export const toPhone = (s: string) =>
  oneLine(s)
    .replace(/[\s().-]/g, "")
    .replace(/^\+?63(?=9\d{9}$)/, "0");

export type CheckoutValues = {
  fullName: string;
  email: string;
  phone: string;
  street: string;
  barangay: string;
  city: string;
  province: string;
  postalCode: string;
  landmark: string;
  notes: string;
};
export type CheckoutField = keyof CheckoutValues | "pin" | "payment";

export const EMPTY_VALUES: CheckoutValues = {
  fullName: "",
  email: "",
  phone: "",
  street: "",
  barangay: "",
  city: "",
  province: "",
  postalCode: "",
  landmark: "",
  notes: "",
};

export function sanitizeValues(v: CheckoutValues): CheckoutValues {
  return {
    fullName: oneLine(v.fullName),
    email: toEmail(v.email),
    phone: toPhone(v.phone),
    street: oneLine(v.street),
    barangay: oneLine(v.barangay),
    city: oneLine(v.city),
    province: oneLine(v.province),
    postalCode: oneLine(v.postalCode).replace(/\s/g, ""),
    landmark: oneLine(v.landmark),
    notes: multiLine(v.notes),
  };
}

const range = (label: string, value: string, min: number, max: number) => {
  if (!value) return `${label} is required.`;
  if (value.length < min) return `${label} is too short.`;
  if (value.length > max) return `${label} is too long.`;
  return undefined;
};

export function validateField(
  name: keyof CheckoutValues,
  v: CheckoutValues,
): string | undefined {
  const value = v[name];
  switch (name) {
    case "fullName":
      if (!value) return "Full name is required.";
      if (!NAME_RE.test(value)) return "Enter your full name using letters only.";
      return undefined;
    case "email":
      if (!value) return "Email is required.";
      if (value.length > 254 || !EMAIL_RE.test(value)) return "Enter a valid email address.";
      return undefined;
    case "phone":
      if (!value) return "Phone number is required.";
      if (!PH_MOBILE.test(value)) return "Enter a valid Philippine mobile number.";
      return undefined;
    case "street":
      return range("Street address", value, 5, 150);
    case "barangay":
      return range("Barangay", value, 2, 80);
    case "city":
      return range("City or municipality", value, 2, 80);
    case "province":
      return range("Province or region", value, 2, 80);
    case "postalCode":
      return value && !/^\d{4}$/.test(value) ? "Enter a 4-digit postal code." : undefined;
    case "landmark":
      return value.length > 150 ? "Landmark is too long." : undefined;
    case "notes":
      return value.length > 300 ? "Keep notes under 300 characters." : undefined;
  }
}

export const inPhilippines = (p: Pin) =>
  p.lat >= 4 && p.lat <= 22 && p.lng >= 116 && p.lng <= 128;

/* ---------- API ---------- */

type ApiMeta = { message?: string; errors?: Record<string, string>; code?: string };
export type ApiResult<T> = { ok: boolean; status: number; data: Partial<T> & ApiMeta };

export async function api<T extends object = object>(
  path: string,
  init: { method?: "GET" | "POST"; body?: unknown } = {},
): Promise<ApiResult<T>> {
  try {
    const hasBody = init.body !== undefined;
    const res = await fetch(path, {
      method: init.method ?? "GET",
      headers: hasBody ? { "Content-Type": "application/json" } : undefined,
      body: hasBody ? JSON.stringify(init.body) : undefined,
      cache: "no-store",
    });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, data };
  } catch {
    return {
      ok: false,
      status: 0,
      data: {
        message: "Network error. Please check your connection and try again.",
      } as unknown as Partial<T> & ApiMeta,
    };
  }
}

/* ---------- Guest session (the cookie is the proof; localStorage is a convenience) ---------- */

const EMAIL_KEY = "pric-guest-email";

export function getStoredEmail(): string | null {
  try {
    return window.localStorage.getItem(EMAIL_KEY);
  } catch {
    return null;
  }
}

export function setStoredEmail(email: string) {
  try {
    window.localStorage.setItem(EMAIL_KEY, email);
  } catch {
    /* storage unavailable */
  }
}

export function clearStoredEmail() {
  try {
    window.localStorage.removeItem(EMAIL_KEY);
  } catch {
    /* storage unavailable */
  }
}

export type VerifiedSession = { email: string; source: "account" | "guest" };

/** The email this browser has proven: a login session (account) or a guest OTP cookie. */
export async function fetchVerifiedSession(): Promise<VerifiedSession | null> {
  const r = await api<{ email: string | null; source: "account" | "guest" | null }>(
    "/api/orders/session",
  );
  return r.ok && r.data.email && r.data.source
    ? { email: r.data.email, source: r.data.source }
    : null;
}

/** The email this browser has already verified, or null. */
export async function fetchVerifiedEmail(): Promise<string | null> {
  return (await fetchVerifiedSession())?.email ?? null;
}

/** Resolves to an error message, or null when the code was sent. */
export async function requestOtp(email: string): Promise<string | null> {
  const r = await api("/api/orders/otp", { method: "POST", body: { email } });
  if (r.ok) return null;
  return r.data.errors?.email ?? r.data.message ?? "We couldn't send the code. Please try again.";
}

/** Resolves to an error message, or null when the code was accepted. */
export async function verifyOtp(email: string, code: string): Promise<string | null> {
  const r = await api("/api/orders/otp/verify", { method: "POST", body: { email, code } });
  if (!r.ok) {
    return r.data.errors?.code ?? r.data.message ?? "Verification failed. Please try again.";
  }
  setStoredEmail(email);
  return null;
}

export async function clearGuestSession() {
  await api("/api/orders/session/clear", { method: "POST" });
  clearStoredEmail();
}

/* ---------- Prefill ---------- */

const PROFILE_KEY = "pric-guest-profile";
const USER_KEY = "pric-user";

const readJson = (key: string): Record<string, unknown> | null => {
  try {
    const raw = window.localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
};

const str = (v: unknown) => (typeof v === "string" ? v : "");

export type Prefill = { fields: Partial<CheckoutValues>; pin: Pin | null };

/** Logged-in user details (if any) win for name/email/phone; the saved guest profile fills the rest. */
export function loadPrefill(): Prefill {
  const profile = readJson(PROFILE_KEY) ?? {};
  const user = readJson(USER_KEY) ?? {};

  const userName =
    str(user.name) || [str(user.firstName), str(user.lastName)].filter(Boolean).join(" ");
  const userPhone = toPhone(str(user.mobile) || str(user.phone));

  const fields: Partial<CheckoutValues> = {
    fullName: userName || str(profile.fullName),
    email: str(user.email) || str(profile.email),
    phone: PH_MOBILE.test(userPhone) ? userPhone : str(profile.phone),
    street: str(profile.street),
    barangay: str(profile.barangay),
    city: str(profile.city),
    province: str(profile.province),
    postalCode: str(profile.postalCode),
    landmark: str(profile.landmark),
  };

  const lat = Number(profile.lat);
  const lng = Number(profile.lng);
  const pin = Number.isFinite(lat) && Number.isFinite(lng) && inPhilippines({ lat, lng })
    ? { lat, lng }
    : null;

  return { fields, pin };
}

export function saveProfile(values: CheckoutValues, pin: Pin | null) {
  try {
    const { notes: _notes, ...rest } = values;
    void _notes;
    window.localStorage.setItem(PROFILE_KEY, JSON.stringify({ ...rest, ...pin }));
  } catch {
    /* storage unavailable */
  }
}

export type AddressHint = {
  street: string;
  barangay: string;
  city: string;
  province: string;
  postalCode: string;
};