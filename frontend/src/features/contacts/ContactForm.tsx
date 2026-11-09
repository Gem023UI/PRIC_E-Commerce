"use client";

import * as React from "react";

import { GOLD_GRADIENT } from "@/lib/theme";

type Status = "idle" | "sending" | "sent" | "error";

const FIELD =
  "w-full rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-base text-white placeholder:text-white/40 outline-none transition-colors focus:border-[#d9a346]";

export default function ContactForm() {
  const [status, setStatus] = React.useState<Status>("idle");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form));
    setStatus("sending");
    try {
      // TODO: send `data` to the real endpoint, e.g.
      // await axios.post("/api/inquiries", data);
      void data;
      await new Promise((r) => setTimeout(r, 600));
      form.reset();
      setStatus("sent");
    } catch {
      setStatus("error");
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div>
        <label htmlFor="cf-name" className="mb-2 block text-sm font-medium">
          Full name
        </label>
        <input
          id="cf-name"
          name="name"
          type="text"
          required
          autoComplete="name"
          placeholder="Juan Dela Cruz"
          className={FIELD}
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="cf-email" className="mb-2 block text-sm font-medium">
            Email
          </label>
          <input
            id="cf-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
            className={FIELD}
          />
        </div>
        <div>
          <label htmlFor="cf-phone" className="mb-2 block text-sm font-medium">
            Phone <span className="text-white/50">(optional)</span>
          </label>
          <input
            id="cf-phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            placeholder="+63 900 000 0000"
            className={FIELD}
          />
        </div>
      </div>

      <div>
        <label htmlFor="cf-message" className="mb-2 block text-sm font-medium">
          Message
        </label>
        <textarea
          id="cf-message"
          name="message"
          required
          rows={5}
          placeholder="Tell us what you would like to inquire about."
          className={`${FIELD} resize-y`}
        />
      </div>

      <button
        type="submit"
        disabled={status === "sending"}
        className="inline-flex items-center rounded-full px-8 py-3 font-semibold text-black shadow-lg transition-transform hover:scale-[1.03] disabled:opacity-60"
        style={{ backgroundImage: GOLD_GRADIENT }}
      >
        {status === "sending" ? "Sending..." : "Send Message"}
      </button>

      <p role="status" aria-live="polite" className="min-h-6 text-sm">
        {status === "sent" && (
          <span className="text-[#f4d587]">
            Thank you! Your message has been sent.
          </span>
        )}
        {status === "error" && (
          <span className="text-red-400">
            Something went wrong. Please try again.
          </span>
        )}
      </p>
    </form>
  );
}