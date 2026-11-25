"use client";

import * as React from "react";

import { adminApi } from "@/lib/admin-api";
import type { AdminProduct } from "@/lib/admin-products";
import { GOLD_GRADIENT } from "@/lib/theme";
import { cn } from "@/lib/utils";

import { CloseIcon } from "./icons";

const INPUT =
  "w-full min-h-11 rounded-xl border bg-white/5 px-4 py-2.5 text-sm text-white outline-none transition-colors placeholder:text-white/40 focus-visible:border-[#efc673] focus-visible:ring-2 focus-visible:ring-[#efc673]/60";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const IMAGE_RE = /^(https:\/\/[^\s"'<>]+|\/[A-Za-z0-9\-._~%/]+)$/;

type Field = "name" | "description" | "image" | "price" | "stock" | "lowStockThreshold";
type Errors = Partial<Record<Field, string>>;

const clean = (s: string) => s.replace(/[<>]/g, "").replace(/\s+/g, " ").trim();

type UploadSig = { cloudName: string; apiKey: string; timestamp: number; folder: string; signature: string };

export function ProductFormModal({
  product,
  onClose,
  onSaved,
}: {
  /** Present when editing; absent when adding. */
  product?: AdminProduct;
  onClose: () => void;
  onSaved: (message: string) => void;
}) {
  const uid = React.useId();
  const nameRef = React.useRef<HTMLInputElement>(null);
  const fileRef = React.useRef<HTMLInputElement>(null);
  const editing = !!product;

  const [values, setValues] = React.useState({
    name: product?.name ?? "",
    description: product?.description ?? "",
    image: product?.image ?? "",
    price: product ? String(product.price) : "",
    stock: "0",
    lowStockThreshold: String(product?.lowStockThreshold ?? 10),
    published: product?.published ?? true,
  });
  const [errors, setErrors] = React.useState<Errors>({});
  const [formError, setFormError] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);

  React.useEffect(() => {
    nameRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const set = (k: keyof typeof values) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setValues((v) => ({ ...v, [k]: e.target.value }));
    setErrors((p) => ({ ...p, [k]: undefined }));
  };

  async function upload(file: File) {
    setErrors((p) => ({ ...p, image: undefined }));
    if (!IMAGE_TYPES.includes(file.type)) {
      setErrors((p) => ({ ...p, image: "Choose a JPG, PNG, WebP or GIF image." }));
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setErrors((p) => ({ ...p, image: "That image is over 5 MB. Choose a smaller one." }));
      return;
    }

    setUploading(true);
    try {
      const sig = await adminApi<UploadSig>("/api/admin/uploads/sign", { method: "POST" });
      if (!sig.ok || !sig.data.cloudName) {
        setErrors((p) => ({ ...p, image: sig.data.message ?? "Uploads aren't available right now. Paste an image link instead." }));
        return;
      }
      const { cloudName, apiKey, timestamp, folder, signature } = sig.data as UploadSig;

      const body = new FormData();
      body.append("file", file);
      body.append("api_key", apiKey);
      body.append("timestamp", String(timestamp));
      body.append("folder", folder);
      body.append("signature", signature);

      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: "POST", body });
      const data = (await res.json().catch(() => ({}))) as { secure_url?: string; error?: { message?: string } };
      if (!res.ok || !data.secure_url) {
        setErrors((p) => ({ ...p, image: data.error?.message ?? "The upload failed. Please try again." }));
        return;
      }
      setValues((v) => ({ ...v, image: data.secure_url! }));
    } catch {
      setErrors((p) => ({ ...p, image: "The upload failed. Check your connection and try again." }));
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy || uploading) return;

    const name = clean(values.name);
    const description = clean(values.description);
    const image = values.image.trim();
    const price = Number(values.price.replace(/,/g, ""));
    const stock = Number(values.stock);
    const threshold = Number(values.lowStockThreshold);

    const found: Errors = {};
    if (name.length < 2) found.name = "Name is required.";
    else if (name.length > 120) found.name = "Name is too long.";
    if (description.length > 600) found.description = "Keep the description under 600 characters.";
    if (image && !IMAGE_RE.test(image)) found.image = "Use an https:// image link or a /path from the site.";
    if (!values.price.trim() || !Number.isFinite(price) || price < 0 || price > 1_000_000) {
      found.price = "Enter a price between 0 and 1,000,000.";
    }
    if (!editing && (!Number.isInteger(stock) || stock < 0 || stock > 1_000_000)) {
      found.stock = "Use a whole number, 0 or more.";
    }
    if (!Number.isInteger(threshold) || threshold < 0 || threshold > 100_000) {
      found.lowStockThreshold = "Use a whole number, 0 or more.";
    }
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setBusy(true);
    setFormError("");

    const payload = {
      name,
      description,
      price,
      lowStockThreshold: threshold,
      published: values.published,
      ...(image ? { image } : {}),
    };
    const r = editing
      ? await adminApi(`/api/admin/products/${product.id}`, { method: "PATCH", body: payload })
      : await adminApi("/api/admin/products", { method: "POST", body: { ...payload, stock } });
    setBusy(false);

    if (r.ok) {
      onSaved(editing ? `${name} was updated.` : `${name} was added.`);
      return;
    }
    if (r.data.errors) {
      const mapped: Errors = {};
      for (const [k, msg] of Object.entries(r.data.errors)) {
        if (k in values) mapped[k as Field] = msg;
      }
      setErrors(mapped);
      if (Object.keys(mapped).length > 0) return;
    }
    setFormError(r.data.message ?? "We couldn't save the product. Please try again.");
  }

  const label = (id: string, text: string, optional = false) => (
    <label htmlFor={`${uid}-${id}`} className="mb-1.5 block text-sm font-medium text-white">
      {text}
      {optional && <span className="text-white/50"> (optional)</span>}
    </label>
  );
  const err = (k: Field) =>
    errors[k] ? (
      <p id={`${uid}-${k}-err`} role="alert" className="mt-1.5 text-sm text-red-300">
        {errors[k]}
      </p>
    ) : null;
  const attrs = (k: Field) => ({
    id: `${uid}-${k}`,
    "aria-invalid": errors[k] ? (true as const) : undefined,
    "aria-describedby": errors[k] ? `${uid}-${k}-err` : undefined,
    className: cn(INPUT, errors[k] ? "border-red-400" : "border-white/15"),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 md:items-center">
      <div className="fixed inset-0 bg-black/75" onClick={onClose} aria-hidden />
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${uid}-title`}
        onSubmit={submit}
        noValidate
        className="relative my-6 w-full max-w-xl rounded-2xl border border-[#c8933a]/40 bg-[#0a0a0a] p-6 shadow-2xl md:p-8"
      >
        <div className="flex items-start justify-between gap-4">
          <h2 id={`${uid}-title`} className="text-xl font-semibold text-[#f4d587]">
            {editing ? "Edit product" : "Add product"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex size-9 shrink-0 items-center justify-center rounded-full border border-white/15 text-white/80 transition-colors hover:border-white/30 hover:text-white"
          >
            <CloseIcon className="size-4" />
          </button>
        </div>

        <div className="mt-6 space-y-4">
          <div>
            {label("name", "Name")}
            <input ref={nameRef} {...attrs("name")} value={values.name} onChange={set("name")} maxLength={120} autoComplete="off" />
            {err("name")}
          </div>

          <div>
            {label("description", "Description", true)}
            <textarea {...attrs("description")} value={values.description} onChange={set("description")} rows={3} maxLength={600} />
            {err("description")}
          </div>

          {/* Image */}
          <div>
            <p className="mb-1.5 text-sm font-medium text-white">
              Image <span className="text-white/50">(optional)</span>
            </p>
            <div className="flex items-center gap-4">
              <div className="flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/15 bg-white/5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={values.image || "/products.png"} alt="Product preview" className="size-full object-contain" />
              </div>
              <div className="min-w-0 flex-1 space-y-2">
                <input
                  ref={fileRef}
                  type="file"
                  accept={IMAGE_TYPES.join(",")}
                  className="sr-only"
                  tabIndex={-1}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void upload(file);
                  }}
                />
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="rounded-full border border-[#c8933a] px-4 py-2 text-sm font-semibold text-[#f4d587] transition-colors hover:bg-[#c8933a]/15 disabled:opacity-60"
                >
                  {uploading ? "Uploading…" : "Upload image"}
                </button>
                <input
                  {...attrs("image")}
                  value={values.image}
                  onChange={set("image")}
                  placeholder="…or paste an image link"
                  autoComplete="off"
                />
              </div>
            </div>
            {err("image")}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              {label("price", "Price (PHP)")}
              <input {...attrs("price")} value={values.price} onChange={set("price")} inputMode="decimal" placeholder="0.00" autoComplete="off" />
              {err("price")}
            </div>
            <div>
              {label("lowStockThreshold", "Low-stock level")}
              <input {...attrs("lowStockThreshold")} value={values.lowStockThreshold} onChange={set("lowStockThreshold")} inputMode="numeric" autoComplete="off" />
              {err("lowStockThreshold")}
            </div>
          </div>

          {editing ? (
            <p className="rounded-xl bg-white/5 px-4 py-3 text-sm text-white/65">
              Current stock is <span className="font-semibold text-white">{product.stock}</span>. Use the{" "}
              <span className="font-semibold text-white">Stock</span> button to change it, so every change is recorded.
            </p>
          ) : (
            <div>
              {label("stock", "Starting stock")}
              <input {...attrs("stock")} value={values.stock} onChange={set("stock")} inputMode="numeric" autoComplete="off" />
              {err("stock")}
            </div>
          )}

          <label className="flex cursor-pointer items-start gap-3 text-sm text-white/90">
            <input
              type="checkbox"
              checked={values.published}
              onChange={(e) => setValues((v) => ({ ...v, published: e.target.checked }))}
              className="mt-0.5 size-5 shrink-0 accent-[#efc673]"
            />
            <span>
              Visible on the website
              <span className="block text-xs text-white/50">Hidden products can&apos;t be seen or ordered.</span>
            </span>
          </label>
        </div>

        <div aria-live="polite" className="mt-4 min-h-5">
          {formError && (
            <p role="alert" className="text-sm text-red-300">
              {formError}
            </p>
          )}
        </div>

        <div className="mt-2 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="min-h-11 rounded-xl border border-white/25 px-6 text-sm font-medium text-white transition-colors hover:border-[#efc673]"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={busy || uploading}
            aria-busy={busy}
            className="min-h-11 rounded-xl px-6 text-sm font-bold text-black transition-transform hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-70"
            style={{ backgroundImage: GOLD_GRADIENT }}
          >
            {busy ? "Saving…" : editing ? "Save changes" : "Add product"}
          </button>
        </div>
      </form>
    </div>
  );
}