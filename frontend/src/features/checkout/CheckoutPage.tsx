"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { ShoppingCart01Icon } from "@hugeicons/core-free-icons";

import { MetallicGoldText } from "@/components/brand/MetallicGoldText";
import { Reveal } from "@/components/motion/Reveal";
import EmailOtpModal from "@/components/ui/EmailOtpModal";
import { PRODUCT_LIST } from "@/data/products";
import { useSession } from "@/hooks/use-session";
import { clearCart, useCart, type CartItem } from "@/lib/cart";
import { poppins } from "@/lib/fonts";
import {
  EMPTY_VALUES,
  SHIPPING_FEE,
  api,
  fetchVerifiedEmail,
  getStoredEmail,
  inPhilippines,
  loadPrefill,
  peso,
  requestOtp,
  sanitizeValues,
  saveProfile,
  setStoredEmail,
  toEmail,
  validateField,
  verifyOtp,
  type AddressHint,
  type CheckoutField,
  type CheckoutValues,
  type Order,
  type PaymentMethod,
  type Pin,
} from "@/lib/orders";
import { GOLD_GRADIENT } from "@/lib/theme";
import { cn } from "@/lib/utils";

import OrderSuccess from "./OrderSuccess";
import PaymentPicker from "./PaymentPicker";

const AddressMap = dynamic(() => import("./AddressMap"), {
  ssr: false,
  loading: () => <div className="mt-3 h-72 animate-pulse rounded-xl bg-white/5" />,
});

const GLASS = "rounded-2xl border border-white/15 bg-black/40 backdrop-blur-xl";

type Errors = Partial<Record<CheckoutField, string>>;
type Status = "idle" | "submitting" | "error";

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className={cn(poppins.className, "relative min-h-screen text-white")}>
      <div
        className="fixed inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url(/productbg.png)" }}
      >
        <div className="absolute inset-0 bg-black/70" />
      </div>
      <div className="relative mx-auto max-w-6xl px-5 pb-20 pt-28">{children}</div>
    </main>
  );
}

function Section({
  title,
  delay = 0,
  children,
}: {
  title: string;
  delay?: number;
  children: React.ReactNode;
}) {
  return (
    <Reveal delay={delay} className={cn(GLASS, "p-6")}>
      <h2 className="text-lg font-semibold text-[#f4d587]">{title}</h2>
      <div className="mt-5">{children}</div>
    </Reveal>
  );
}

export function CheckoutPage() {
  const uid = React.useId();
  const formRef = React.useRef<HTMLFormElement>(null);
  const params = useSearchParams();
  const cart = useCart();
  const { user } = useSession();

  const [mounted, setMounted] = React.useState(false);
  const [values, setValues] = React.useState<CheckoutValues>(EMPTY_VALUES);
  const [errors, setErrors] = React.useState<Errors>({});
  const [pin, setPin] = React.useState<Pin | null>(null);
  const [payment, setPayment] = React.useState<PaymentMethod | null>(null);
  const [status, setStatus] = React.useState<Status>("idle");
  const [serverError, setServerError] = React.useState("");
  const [placed, setPlaced] = React.useState<Order | null>(null);

  const [verifiedEmail, setVerifiedEmail] = React.useState<string | null>(null);
  const [sendingOtp, setSendingOtp] = React.useState(false);
  const [otpEmail, setOtpEmail] = React.useState<string | null>(null);
  const otpOpen = otpEmail !== null;

  /* ----- items: "buy now" link, otherwise the cart ----- */
  const buyId = Number(params.get("buy"));
  const buyQty = Math.min(Math.max(Math.trunc(Number(params.get("qty")) || 1), 1), 50);
  const buyNow = React.useMemo<CartItem | null>(() => {
    const p = PRODUCT_LIST.find((x) => x.id === buyId);
    return p ? { id: p.id, name: p.name, price: p.price, image: p.image, quantity: buyQty } : null;
  }, [buyId, buyQty]);
  const items = React.useMemo(() => (buyNow ? [buyNow] : cart), [buyNow, cart]);

  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const total = subtotal + SHIPPING_FEE;

  const isVerified = verifiedEmail !== null && verifiedEmail === toEmail(values.email);

  /* ----- prefill from localStorage + already-verified email (only fills empty fields) ----- */
  React.useEffect(() => {
    setMounted(true);
    let alive = true;
    const { fields, pin: savedPin } = loadPrefill();

    void fetchVerifiedEmail().then((verified) => {
      if (!alive) return;
      setVerifiedEmail(verified);
      setValues((prev) => {
        const next = { ...prev };
        (Object.keys(fields) as (keyof CheckoutValues)[]).forEach((k) => {
          next[k] = prev[k] || fields[k] || "";
        });
        next.email = next.email || verified || getStoredEmail() || "";
        return next;
      });
      if (savedPin) setPin((p) => p ?? savedPin);
    });

    return () => {
      alive = false;
    };
  }, []);

  // Logged-in session details are a fallback for name/email.
  React.useEffect(() => {
    if (!user) return;
    setValues((prev) => ({
      ...prev,
      fullName: prev.fullName || user.name,
      email: prev.email || user.email,
    }));
  }, [user]);

  const applyHint = React.useCallback((h: AddressHint) => {
    setValues((prev) => ({
      ...prev,
      street: prev.street || h.street,
      barangay: prev.barangay || h.barangay,
      city: prev.city || h.city,
      province: prev.province || h.province,
      postalCode: prev.postalCode || h.postalCode,
    }));
  }, []);

  const onPin = React.useCallback((p: Pin) => {
    setPin(p);
    setErrors((prev) => ({ ...prev, pin: undefined }));
  }, []);

  /* ----- email verification ----- */
  async function handleVerifyClick() {
    if (isVerified || sendingOtp) return;
    const email = toEmail(values.email);
    const err = validateField("email", { ...values, email });
    if (err) {
      setErrors((prev) => ({ ...prev, email: err }));
      return;
    }
    setSendingOtp(true);
    const failure = await requestOtp(email);
    setSendingOtp(false);
    if (failure) {
      setErrors((prev) => ({ ...prev, email: failure }));
      return;
    }
    setOtpEmail(email);
  }

  async function handleVerifyCode(code: string): Promise<string | null> {
    if (!otpEmail) return "Something went wrong. Please try again.";
    const failure = await verifyOtp(otpEmail, code);
    if (failure) return failure;
    setVerifiedEmail(otpEmail);
    setErrors((prev) => ({ ...prev, email: undefined }));
    setOtpEmail(null);
    return null;
  }

  /* ----- submit ----- */
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === "submitting" || items.length === 0) return;

    const clean = sanitizeValues(values);
    setValues(clean);

    const found: Errors = {};
    (Object.keys(clean) as (keyof CheckoutValues)[]).forEach((k) => {
      const msg = validateField(k, clean);
      if (msg) found[k] = msg;
    });
    if (!found.email && verifiedEmail !== clean.email) {
      found.email = "Verify your email before placing your order.";
    }
    if (!pin) found.pin = "Pin your delivery location on the map.";
    else if (!inPhilippines(pin)) found.pin = "The pin must be within the Philippines.";
    if (!payment) found.payment = "Choose a payment method.";

    setErrors(found);
    if (Object.keys(found).length > 0 || !pin || !payment) {
      setStatus("idle");
      requestAnimationFrame(() => {
        const el = formRef.current?.querySelector<HTMLElement>(
          '[aria-invalid="true"],[data-invalid="true"]',
        );
        el?.scrollIntoView({ behavior: "smooth", block: "center" });
        el?.focus?.({ preventScroll: true });
      });
      return;
    }

    setStatus("submitting");
    setServerError("");

    const r = await api<{ order: Order }>("/api/orders", {
      method: "POST",
      body: {
        email: clean.email,
        fullName: clean.fullName,
        phone: clean.phone,
        address: {
          street: clean.street,
          barangay: clean.barangay,
          city: clean.city,
          province: clean.province,
          postalCode: clean.postalCode || undefined,
          landmark: clean.landmark || undefined,
          lat: pin.lat,
          lng: pin.lng,
        },
        items: items.map((i) => ({ productId: i.id, quantity: i.quantity })),
        paymentMethod: payment,
        notes: clean.notes || undefined,
      },
    });

    if (r.ok && r.data.order) {
      saveProfile(clean, pin);
      setStoredEmail(clean.email);
      if (!buyNow) clearCart();
      setPlaced(r.data.order);
      setStatus("idle");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    if (r.status === 401) {
      setVerifiedEmail(null);
      setErrors({ email: r.data.message ?? "Please verify your email again." });
      setStatus("idle");
      return;
    }

    if (r.status === 400 && r.data.errors) {
      const mapped: Errors = {};
      let other = "";
      for (const [k, msg] of Object.entries(r.data.errors)) {
        if (k in clean) mapped[k as keyof CheckoutValues] = msg;
        else if (k === "paymentMethod") mapped.payment = msg;
        else other = msg;
      }
      setErrors(mapped);
      setServerError(other);
      setStatus(other ? "error" : "idle");
      return;
    }

    setServerError(r.data.message ?? "We couldn't place your order. Please try again.");
    setStatus("error");
  }

  /* ----- field helpers ----- */
  const inputClass = (err?: string) =>
    cn(
      "w-full min-h-11 rounded-xl border bg-white/5 px-4 py-2.5 text-sm text-white outline-none transition-colors placeholder:text-white/40 focus-visible:border-[#efc673] focus-visible:ring-2 focus-visible:ring-[#efc673]/60",
      err ? "border-red-400" : "border-white/20",
    );

  const fieldProps = (name: keyof CheckoutValues) => ({
    id: `${uid}-${name}`,
    name,
    value: values[name],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const v = e.target.value;
      setValues((prev) => ({ ...prev, [name]: v }));
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    },
    "aria-invalid": errors[name] ? (true as const) : undefined,
    "aria-describedby": errors[name] ? `${uid}-${name}-err` : undefined,
    className: inputClass(errors[name]),
  });

  const label = (name: keyof CheckoutValues, text: string, optional = false) => (
    <label htmlFor={`${uid}-${name}`} className="mb-1.5 block text-sm font-medium text-white">
      {text}
      {optional ? (
        <span className="text-white/50"> (optional)</span>
      ) : (
        <span aria-hidden="true" className="text-[#efc673]">
          {" "}
          *
        </span>
      )}
    </label>
  );

  const err = (name: keyof CheckoutValues) =>
    errors[name] ? (
      <p id={`${uid}-${name}-err`} className="mt-1.5 text-sm text-red-300">
        {errors[name]}
      </p>
    ) : null;

  /* ----- render ----- */
  if (placed) {
    return (
      <Shell>
        <OrderSuccess order={placed} />
      </Shell>
    );
  }

  if (!mounted) {
    return (
      <Shell>
        <div className="h-96" aria-hidden />
      </Shell>
    );
  }

  if (items.length === 0) {
    return (
      <Shell>
        <MetallicGoldText as="h1" fold={false} className="text-3xl font-bold uppercase md:text-5xl">
          Checkout
        </MetallicGoldText>
        <div className={cn(GLASS, "mt-12 flex flex-col items-center gap-5 px-6 py-16 text-center")}>
          <HugeiconsIcon icon={ShoppingCart01Icon} size={48} className="text-[#d9a346]" />
          <p className="text-lg">There&apos;s nothing to check out.</p>
          <Link
            href="/products/#product-grid"
            className="rounded-lg px-7 py-2.5 text-sm font-bold uppercase text-black transition-transform hover:scale-[1.03]"
            style={{ backgroundImage: GOLD_GRADIENT }}
          >
            Browse Products
          </Link>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <Reveal>
        <MetallicGoldText as="h1" fold={false} className="text-3xl font-bold uppercase md:text-5xl">
          Checkout
        </MetallicGoldText>
        <p className="mt-3 text-white/70">No account needed. We&apos;ll email your order details and tracking QR.</p>
      </Reveal>

      <form
        ref={formRef}
        onSubmit={handleSubmit}
        noValidate
        inert={otpOpen}
        aria-hidden={otpOpen}
        className="mt-10 grid items-start gap-8 lg:grid-cols-[1fr_22rem]"
      >
        <div className="flex flex-col gap-6">
          <Section title="1. Contact details">
            <div className="space-y-4">
              <div>
                {label("fullName", "Full name")}
                <input {...fieldProps("fullName")} type="text" autoComplete="name" maxLength={80} />
                {err("fullName")}
              </div>

              <div>
                {label("email", "Email")}
                <div className="flex gap-3">
                  <input
                    {...fieldProps("email")}
                    type="email"
                    autoComplete="email"
                    maxLength={254}
                    className={cn(inputClass(errors.email), "min-w-0 flex-1")}
                  />
                  <button
                    type="button"
                    onClick={handleVerifyClick}
                    disabled={isVerified || sendingOtp}
                    className={cn(
                      "inline-flex min-h-11 min-w-[7.5rem] shrink-0 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#efc673] disabled:cursor-not-allowed",
                      isVerified
                        ? "border-emerald-400/60 text-emerald-300"
                        : "border-[#c8933a] text-[#f4d587] hover:bg-[#c8933a]/15 disabled:opacity-70",
                    )}
                  >
                    {isVerified ? (
                      <>
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2.2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="h-4 w-4"
                          aria-hidden="true"
                        >
                          <path d="M5 12.5l4.5 4.5L19 7.5" />
                        </svg>
                        Verified
                      </>
                    ) : sendingOtp ? (
                      "Sending..."
                    ) : (
                      "Verify"
                    )}
                  </button>
                </div>
                <span role="status" className="sr-only">
                  {isVerified ? "Email verified" : ""}
                </span>
                {err("email")}
              </div>

              <div>
                {label("phone", "Phone number")}
                <input
                  {...fieldProps("phone")}
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="09XX XXX XXXX"
                  maxLength={20}
                />
                {err("phone")}
              </div>
            </div>
          </Section>

          <Section title="2. Delivery address" delay={80}>
            <div className="space-y-4">
              <div>
                {label("street", "House no. and street")}
                <input {...fieldProps("street")} type="text" autoComplete="address-line1" maxLength={150} />
                {err("street")}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  {label("barangay", "Barangay")}
                  <input {...fieldProps("barangay")} type="text" autoComplete="address-line2" maxLength={80} />
                  {err("barangay")}
                </div>
                <div>
                  {label("city", "City / municipality")}
                  <input {...fieldProps("city")} type="text" autoComplete="address-level2" maxLength={80} />
                  {err("city")}
                </div>
                <div>
                  {label("province", "Province / region")}
                  <input {...fieldProps("province")} type="text" autoComplete="address-level1" maxLength={80} />
                  {err("province")}
                </div>
                <div>
                  {label("postalCode", "Postal code", true)}
                  <input
                    {...fieldProps("postalCode")}
                    type="text"
                    inputMode="numeric"
                    autoComplete="postal-code"
                    maxLength={4}
                  />
                  {err("postalCode")}
                </div>
              </div>

              <div>
                {label("landmark", "Landmark or delivery instructions", true)}
                <input
                  {...fieldProps("landmark")}
                  type="text"
                  placeholder="e.g. Blue gate, beside the sari-sari store"
                  maxLength={150}
                />
                {err("landmark")}
              </div>

              <div>
                <p className="mb-1.5 text-sm font-medium text-white">
                  Pin your location
                  <span aria-hidden="true" className="text-[#efc673]">
                    {" "}
                    *
                  </span>
                </p>
                <AddressMap value={pin} onChange={onPin} onHint={applyHint} error={errors.pin} />
              </div>
            </div>
          </Section>

          <Section title="3. Payment method" delay={160}>
            <PaymentPicker
              value={payment}
              onChange={(m) => {
                setPayment(m);
                setErrors((prev) => ({ ...prev, payment: undefined }));
              }}
              error={errors.payment}
            />
            <p className="mt-3 text-xs text-white/60">
              Online payment instructions will be sent after you place your order.
            </p>
          </Section>

          <Section title="4. Notes" delay={240}>
            {label("notes", "Order notes", true)}
            <textarea {...fieldProps("notes")} rows={3} maxLength={300} />
            {err("notes")}
          </Section>
        </div>

        <Reveal delay={120} className={cn(GLASS, "p-6 lg:sticky lg:top-28")}>
          <h2 className="text-lg font-semibold">Order Summary</h2>
          <ul className="mt-4 flex max-h-72 flex-col gap-3 overflow-y-auto pr-1">
            {items.map((i) => (
              <li key={i.id} className="flex items-center gap-3 text-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={i.image} alt="" className="size-12 shrink-0 object-contain" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{i.name}</p>
                  <p className="text-xs text-white/60">Qty {i.quantity}</p>
                </div>
                <p className="font-semibold">{peso(i.price * i.quantity)}</p>
              </li>
            ))}
          </ul>

          <dl className="mt-5 space-y-2 border-t border-white/10 pt-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-white/70">Subtotal</dt>
              <dd>{peso(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-white/70">Shipping</dt>
              <dd>{peso(SHIPPING_FEE)}</dd>
            </div>
            <div className="flex justify-between text-lg font-bold text-[#f4d587]">
              <dt>Total</dt>
              <dd>{peso(total)}</dd>
            </div>
          </dl>

          <div aria-live="polite" className="mt-4 min-h-5">
            {status === "error" && (
              <p role="alert" className="text-sm text-red-300">
                {serverError}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={status === "submitting"}
            aria-busy={status === "submitting"}
            className="mt-2 w-full rounded-lg px-7 py-3 text-sm font-bold uppercase text-black transition-transform hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-70"
            style={{ backgroundImage: GOLD_GRADIENT }}
          >
            {status === "submitting" ? "Placing order..." : "Place order"}
          </button>
          <Link
            href={buyNow ? "/products" : "/cart"}
            className="mt-3 block text-center text-sm text-white/70 hover:text-[#f4d587]"
          >
            {buyNow ? "Back to products" : "Back to cart"}
          </Link>
        </Reveal>
      </form>

      {otpEmail ? (
        <>
          <div className="fixed inset-0 z-[105] bg-black/80 backdrop-blur-sm" />
          <EmailOtpModal
            email={otpEmail}
            onClose={() => setOtpEmail(null)}
            onVerify={handleVerifyCode}
            onResend={() => requestOtp(otpEmail)}
          />
        </>
      ) : null}
    </Shell>
  );
}

export default CheckoutPage;