"use client";

import * as React from "react";

import { adminApi } from "@/lib/admin-api";

import { inputClass } from "./form-bits";

const MAX_BYTES = 5 * 1024 * 1024;
const TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

type Sig = { cloudName: string; apiKey: string; timestamp: number; folder: string; signature: string };

/** An image link with a preview, plus an upload straight to Cloudinary. */
export function ImageUploadField({
  id,
  value,
  onChange,
  error,
  folder,
  onRemove,
}: {
  id: string;
  value: string;
  onChange: (url: string) => void;
  error?: string;
  folder: "events" | "announcements" | "products";
  onRemove?: () => void;
}) {
  const fileRef = React.useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = React.useState(false);
  const [localError, setLocalError] = React.useState("");

  async function upload(file: File) {
    setLocalError("");
    if (!TYPES.includes(file.type)) return setLocalError("Choose a JPG, PNG, WebP or GIF image.");
    if (file.size > MAX_BYTES) return setLocalError("That image is over 5 MB. Choose a smaller one.");

    setUploading(true);
    try {
      const sig = await adminApi<Sig>(`/api/admin/uploads/sign?folder=${folder}`, { method: "POST" });
      if (!sig.ok || !sig.data.cloudName) {
        setLocalError(sig.data.message ?? "Uploads aren't available right now. Paste an image link instead.");
        return;
      }
      const { cloudName, apiKey, timestamp, folder: signedFolder, signature } = sig.data as Sig;

      const body = new FormData();
      body.append("file", file);
      body.append("api_key", apiKey);
      body.append("timestamp", String(timestamp));
      body.append("folder", signedFolder);
      body.append("signature", signature);

      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: "POST", body });
      const data = (await res.json().catch(() => ({}))) as { secure_url?: string; error?: { message?: string } };
      if (!res.ok || !data.secure_url) {
        setLocalError(data.error?.message ?? "The upload failed. Please try again.");
        return;
      }
      onChange(data.secure_url);
    } catch {
      setLocalError("The upload failed. Check your connection and try again.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  const shown = error || localError;

  return (
    <div>
      <div className="flex items-start gap-4">
        <div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/15 bg-white/5">
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="Preview" className="size-full object-cover" />
          ) : (
            <span className="text-xs text-white/40">No image</span>
          )}
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <input
            ref={fileRef}
            type="file"
            accept={TYPES.join(",")}
            className="sr-only"
            tabIndex={-1}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void upload(f);
            }}
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="rounded-full border border-[#c8933a] px-4 py-1.5 text-sm font-semibold text-[#f4d587] transition-colors hover:bg-[#c8933a]/15 disabled:opacity-60"
            >
              {uploading ? "Uploading…" : "Upload image"}
            </button>
            {onRemove && (
              <button
                type="button"
                onClick={onRemove}
                className="rounded-full border border-white/20 px-4 py-1.5 text-sm text-white/75 hover:border-white/40"
              >
                Remove
              </button>
            )}
          </div>
          <input
            id={id}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="…or paste an image link"
            autoComplete="off"
            aria-invalid={shown ? true : undefined}
            className={inputClass(shown)}
          />
        </div>
      </div>
      {shown && (
        <p role="alert" className="mt-1.5 text-sm text-red-300">
          {shown}
        </p>
      )}
    </div>
  );
}