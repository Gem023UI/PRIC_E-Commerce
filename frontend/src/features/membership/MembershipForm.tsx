"use client";

import Link from "next/link";
import { Poppins } from "next/font/google";
import {
  useEffect,
  useState,
  type ChangeEvent,
  type FormEvent,
  type ReactNode,
} from "react";

import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { MetallicGoldText } from "@/components/brand/MetallicGoldText";
import { Reveal } from "@/components/motion/Reveal";
import { anton } from "@/lib/fonts";
import { cn } from "@/lib/utils";

const poppins = Poppins({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  display: "swap",
});

/* ------------------------------------------------------------------ */
/* Config                                                              */
/* ------------------------------------------------------------------ */

const GOLD_GRADIENT =
  "linear-gradient(135deg, #fde7a0 0%, #efc673 14%, #b9822a 30%, #8a5a18 42%, #c8933a 56%, #f4d587 66%, #d9a346 78%, #a8731f 90%, #e8b45c 100%)";

const MEMBER_TYPES = ["ARB", "ARB HH", "NON-ARB"] as const;
const CIVIL_STATUSES = ["Single", "Married", "Widow", "Separated"] as const;
const SEXES = ["Male", "Female"] as const;

const EDUCATION = [
  { key: "college", label: "College" },
  { key: "vocational", label: "Vocational" },
  { key: "secondary", label: "Secondary" },
  { key: "elementary", label: "Elementary" },
] as const;

const IDS = [
  { key: "tin", label: "TIN" },
  { key: "pagibig", label: "Pag-IBIG #" },
  { key: "sss", label: "SSS #" },
  { key: "philhealth", label: "PhilHealth #" },
  { key: "seniorId", label: "Senior ID #" },
  { key: "nationalId", label: "National ID" },
] as const;

const BENEFICIARY_COUNT = 3;

const PH_PHONE = /^(09|\+639)\d{9}$/;
const YEAR = /^(19|20)\d{2}$/;

type Beneficiary = { name: string; relationship: string; birthDate: string };

type Values = {
  memberType: string;
  lastName: string;
  firstName: string;
  middleName: string;
  address: string;
  birthDate: string;
  birthPlace: string;
  civilStatus: string;
  sex: string;
  religion: string;
  weight: string;
  height: string;
  nationality: string;
  phone: string;
  workplace: string;
  motherName: string;
  motherOccupation: string;
  fatherName: string;
  fatherOccupation: string;
  spouseName: string;
  spouseOccupation: string;
  beneficiaries: Beneficiary[];
  education: Record<string, { school: string; year: string }>;
  ids: Record<string, string>;
  otherId: string;
  availabilityDate: string;
  signature: string;
  agree: boolean;
};

type TextKey = {
  [K in keyof Values]: Values[K] extends string ? K : never;
}[keyof Values];

const INITIAL: Values = {
  memberType: "",
  lastName: "",
  firstName: "",
  middleName: "",
  address: "",
  birthDate: "",
  birthPlace: "",
  civilStatus: "",
  sex: "",
  religion: "",
  weight: "",
  height: "",
  nationality: "Filipino",
  phone: "",
  workplace: "",
  motherName: "",
  motherOccupation: "",
  fatherName: "",
  fatherOccupation: "",
  spouseName: "",
  spouseOccupation: "",
  beneficiaries: Array.from({ length: BENEFICIARY_COUNT }, () => ({
    name: "",
    relationship: "",
    birthDate: "",
  })),
  education: Object.fromEntries(
    EDUCATION.map((e) => [e.key, { school: "", year: "" }]),
  ),
  ids: Object.fromEntries(IDS.map((i) => [i.key, ""])),
  otherId: "",
  availabilityDate: "",
  signature: "",
  agree: false,
};

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

// Strip characters that could be used to inject markup. Real sanitization
// must also happen server-side once the form is wired to the backend.
const clean = (s: string) => s.replace(/[<>]/g, "");

const toISODate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;

function validate(v: Values): Record<string, string> {
  const e: Record<string, string> = {};
  const req = (k: string, val: string, msg = "This field is required") => {
    if (!val.trim()) e[k] = msg;
  };
  const today = toISODate(new Date());

  req("memberType", v.memberType, "Select a member type");
  req("lastName", v.lastName);
  req("firstName", v.firstName);
  req("address", v.address);
  req("birthDate", v.birthDate);
  if (v.birthDate && v.birthDate > today) e.birthDate = "Date cannot be in the future";
  req("birthPlace", v.birthPlace);
  req("civilStatus", v.civilStatus, "Select a civil status");
  req("sex", v.sex, "Select one");
  req("religion", v.religion);
  req("nationality", v.nationality);
  req("phone", v.phone);
  if (v.phone && !PH_PHONE.test(v.phone.replace(/[\s-]/g, "")))
    e.phone = "Use a valid PH mobile number (e.g. 09171234567)";

  req("motherName", v.motherName);
  req("fatherName", v.fatherName);
  if (v.civilStatus === "Married") req("spouseName", v.spouseName);

  const b0 = v.beneficiaries[0];
  req("ben0.name", b0.name);
  req("ben0.relationship", b0.relationship);
  req("ben0.birthDate", b0.birthDate);
  v.beneficiaries.forEach((b, i) => {
    if (b.birthDate && b.birthDate > today) e[`ben${i}.birthDate`] = "Invalid date";
    const filled = b.name || b.relationship || b.birthDate;
    if (i > 0 && filled) {
      req(`ben${i}.name`, b.name);
      req(`ben${i}.relationship`, b.relationship);
      req(`ben${i}.birthDate`, b.birthDate);
    }
  });

  EDUCATION.forEach(({ key }) => {
    const { school, year } = v.education[key];
    if (year && !YEAR.test(year)) e[`edu.${key}.year`] = "Use a 4-digit year";
    if (school && !year) e[`edu.${key}.year`] = "Year is required";
  });

  req("availabilityDate", v.availabilityDate, "Choose a date");
  if (v.availabilityDate && v.availabilityDate <= today)
    e.availabilityDate = "Choose a date after today";

  req("signature", v.signature, "Type your full name");
  if (!v.agree) e.agree = "Please confirm before submitting";
  return e;
}

/* ------------------------------------------------------------------ */
/* UI pieces                                                           */
/* ------------------------------------------------------------------ */

const inputCls =
  "w-full rounded-lg border border-white/20 bg-black/40 px-4 py-3 text-base text-white placeholder:text-white/40 outline-none transition-colors focus:border-[#efc673] focus:ring-2 focus:ring-[#efc673]/30 aria-[invalid=true]:border-red-400 [color-scheme:dark]";

function Field({
  label,
  htmlFor,
  required,
  error,
  className,
  children,
}: {
  label: string;
  htmlFor: string;
  required?: boolean;
  error?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="mb-2 block text-sm font-medium text-white/85">
        {label}
        {required && <span className="ml-1 text-[#efc673]">*</span>}
      </label>
      {children}
      {error && (
        <p id={`${htmlFor}-error`} role="alert" className="mt-1.5 text-sm text-red-300">
          {error}
        </p>
      )}
    </div>
  );
}

function Section({
  title,
  hint,
  delay = 0,
  children,
}: {
  title: string;
  hint?: string;
  delay?: number;
  children: ReactNode;
}) {
  return (
    <Reveal delay={delay}>
      <section className="rounded-2xl border border-white/15 bg-white/5 p-6 backdrop-blur-sm md:p-8">
        <MetallicGoldText
          as="h2"
          className={anton.className}
          style={{ fontSize: "clamp(1.4rem, 2.6vw, 2rem)", lineHeight: 1.15 }}
        >
          {title}
        </MetallicGoldText>
        {hint && <p className="mt-2 text-sm text-white/70">{hint}</p>}
        <div className="mt-6">{children}</div>
      </section>
    </Reveal>
  );
}

function RadioGroup({
  name,
  options,
  value,
  onChange,
  error,
}: {
  name: string;
  options: readonly string[];
  value: string;
  onChange: (v: string) => void;
  error?: string;
}) {
  return (
    <div>
      <div role="radiogroup" className="flex flex-wrap gap-3">
        {options.map((o) => (
          <label
            key={o}
            className="cursor-pointer rounded-full border border-white/20 bg-black/40 px-5 py-2.5 text-sm font-medium transition-colors has-[:checked]:border-[#efc673] has-[:checked]:bg-[#efc673]/20 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[#efc673]/60"
          >
            <input
              type="radio"
              name={name}
              value={o}
              checked={value === o}
              onChange={() => onChange(o)}
              className="sr-only"
            />
            {o}
          </label>
        ))}
      </div>
      {error && (
        <p role="alert" className="mt-1.5 text-sm text-red-300">
          {error}
        </p>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */

export default function MembershipForm() {
  const [v, setV] = useState<Values>(INITIAL);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  // Computed after mount so server and client markup match.
  const [minDate, setMinDate] = useState("");
  const [maxDate, setMaxDate] = useState("");
  const [today, setToday] = useState("");

  useEffect(() => {
    const t = new Date();
    const tomorrow = new Date(t);
    tomorrow.setDate(t.getDate() + 1);
    setMinDate(toISODate(tomorrow));
    setMaxDate(toISODate(t));
    setToday(toISODate(t));
  }, []);

  const clearError = (k: string) =>
    setErrors((p) => {
      if (!p[k]) return p;
      const { [k]: _omit, ...rest } = p;
      return rest;
    });

  const setText = (k: TextKey, val: string) => {
    setV((p) => ({ ...p, [k]: clean(val) }));
    clearError(k);
  };

  const text = (k: TextKey) => ({
    id: k,
    name: k,
    value: v[k],
    "aria-invalid": !!errors[k],
    "aria-describedby": errors[k] ? `${k}-error` : undefined,
    onChange: (e: ChangeEvent<HTMLInputElement>) => setText(k, e.target.value),
  });

  const setBeneficiary = (i: number, f: keyof Beneficiary, val: string) => {
    setV((p) => ({
      ...p,
      beneficiaries: p.beneficiaries.map((b, idx) =>
        idx === i ? { ...b, [f]: clean(val) } : b,
      ),
    }));
    clearError(`ben${i}.${f === "birthDate" ? "birthDate" : f}`);
  };

  const setEducation = (key: string, f: "school" | "year", val: string) => {
    setV((p) => ({
      ...p,
      education: { ...p.education, [key]: { ...p.education[key], [f]: clean(val) } },
    }));
    clearError(`edu.${key}.year`);
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const found = validate(v);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      const first = Object.keys(found)[0];
      const id = first.startsWith("ben")
        ? `ben-${first.slice(3).replace(".", "-")}`
        : first.startsWith("edu.")
          ? `edu-${first.split(".")[1]}-year`
          : first;
      document.getElementById(id)?.focus();
      return;
    }

    setSubmitting(true);
    // TODO: replace with a POST to the Express backend (via the Next proxy).
    await new Promise((r) => setTimeout(r, 700));
    setSubmitting(false);
    setDone(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const married = v.civilStatus === "Married";

  return (
    <>
      <Header />
      <main className={cn(poppins.className, "bg-transparent text-white")}>
        <div className="mx-auto max-w-4xl px-6 pb-28 pt-36 md:pt-44">
          <div className="text-center">
            <Reveal>
              <MetallicGoldText
                as="h1"
                className={anton.className}
                style={{ fontSize: "clamp(2rem, 6vw, 4.5rem)", lineHeight: 1.1 }}
              >
                MEMBERSHIP APPLICATION
              </MetallicGoldText>
            </Reveal>
            <Reveal delay={150}>
              <p className="mx-auto mt-4 max-w-2xl text-base md:text-lg">
                Personal Information Sheet. Fields marked with{" "}
                <span className="text-[#efc673]">*</span> are required.
              </p>
            </Reveal>
          </div>

          {done ? (
            <div
              role="status"
              className="mt-14 rounded-2xl border border-[#efc673]/40 bg-white/5 p-8 text-center backdrop-blur-sm md:p-12"
            >
              <MetallicGoldText
                as="h2"
                className={anton.className}
                style={{ fontSize: "clamp(1.75rem, 4vw, 3rem)", lineHeight: 1.15 }}
              >
                Application Submitted
              </MetallicGoldText>
              <p className="mx-auto mt-4 max-w-xl text-lg">
                Thank you, {v.firstName}. We received your application and your
                availability for the PMES seminar on{" "}
                <strong>{v.availabilityDate}</strong>. The cooperative will
                contact you to confirm your schedule.
              </p>
              <Link
                href="/"
                className="mt-8 inline-flex rounded-full px-8 py-3 text-base font-bold uppercase tracking-wide text-[#1a1004] transition-transform motion-safe:hover:scale-105"
                style={{ backgroundImage: GOLD_GRADIENT }}
              >
                Back to Home
              </Link>
            </div>
          ) : (
            <form onSubmit={onSubmit} noValidate className="mt-14 space-y-8">
              {/* MEMBER TYPE */}
              <Section title="Member Type">
                <RadioGroup
                  name="memberType"
                  options={MEMBER_TYPES}
                  value={v.memberType}
                  onChange={(val) => {
                    setV((p) => ({ ...p, memberType: val }));
                    clearError("memberType");
                  }}
                  error={errors.memberType}
                />
              </Section>

              {/* PERSONAL */}
              <Section title="Personal Information">
                <div className="grid gap-5 md:grid-cols-3">
                  <Field label="Last name (Apelyido)" htmlFor="lastName" required error={errors.lastName}>
                    <input className={inputCls} autoComplete="family-name" {...text("lastName")} />
                  </Field>
                  <Field label="First name (Pangalan)" htmlFor="firstName" required error={errors.firstName}>
                    <input className={inputCls} autoComplete="given-name" {...text("firstName")} />
                  </Field>
                  <Field label="Middle name (Panggitnang Pangalan)" htmlFor="middleName">
                    <input className={inputCls} autoComplete="additional-name" {...text("middleName")} />
                  </Field>

                  <Field label="Address (Tirahan)" htmlFor="address" required error={errors.address} className="md:col-span-3">
                    <input className={inputCls} autoComplete="street-address" {...text("address")} />
                  </Field>

                  <Field label="Birthdate (Kapanganakan)" htmlFor="birthDate" required error={errors.birthDate}>
                    <input type="date" max={maxDate} className={inputCls} {...text("birthDate")} />
                  </Field>
                  <Field label="Place of birth (Lugar Kung Saan Ipinanganak)" htmlFor="birthPlace" required error={errors.birthPlace} className="md:col-span-2">
                    <input className={inputCls} {...text("birthPlace")} />
                  </Field>

                  <div className="md:col-span-3">
                    <p className="mb-2 text-sm font-medium text-white/85">
                      Civil status<span className="ml-1 text-[#efc673]">*</span>
                    </p>
                    <RadioGroup
                      name="civilStatus"
                      options={CIVIL_STATUSES}
                      value={v.civilStatus}
                      onChange={(val) => {
                        setV((p) => ({ ...p, civilStatus: val }));
                        clearError("civilStatus");
                      }}
                      error={errors.civilStatus}
                    />
                  </div>

                  <div className="md:col-span-3">
                    <p className="mb-2 text-sm font-medium text-white/85">
                      Sex (Kasarian)<span className="ml-1 text-[#efc673]">*</span>
                    </p>
                    <RadioGroup
                      name="sex"
                      options={SEXES}
                      value={v.sex}
                      onChange={(val) => {
                        setV((p) => ({ ...p, sex: val }));
                        clearError("sex");
                      }}
                      error={errors.sex}
                    />
                  </div>

                  <Field label="Religion (Relihiyon)" htmlFor="religion" required error={errors.religion}>
                    <input className={inputCls} {...text("religion")} />
                  </Field>
                  <Field label="Weight in kg (Timbang)" htmlFor="weight">
                    <input inputMode="decimal" placeholder="kg" className={inputCls} {...text("weight")} />
                  </Field>
                  <Field label="Height in cm (Taas)" htmlFor="height">
                    <input inputMode="decimal" placeholder="cm" className={inputCls} {...text("height")} />
                  </Field>

                  <Field label="Nationality (Nasyonalidad)" htmlFor="nationality" required error={errors.nationality}>
                    <input className={inputCls} {...text("nationality")} />
                  </Field>
                  <Field label="Phone / cellphone (Numero ng Telepono)" htmlFor="phone" required error={errors.phone}>
                    <input type="tel" inputMode="tel" autoComplete="tel" placeholder="09171234567" className={inputCls} {...text("phone")} />
                  </Field>
                  <Field label="Workplace (Saan Nagtatrabaho)" htmlFor="workplace">
                    <input className={inputCls} {...text("workplace")} />
                  </Field>
                </div>
              </Section>

              {/* FAMILY */}
              <Section title="Family" delay={100}>
                <div className="grid gap-5 md:grid-cols-2">
                  <Field label="Mother's maiden name (Pangalan ng Ina, nung dalaga)" htmlFor="motherName" required error={errors.motherName}>
                    <input className={inputCls} {...text("motherName")} />
                  </Field>
                  <Field label="Mother's occupation (Trabaho)" htmlFor="motherOccupation">
                    <input className={inputCls} {...text("motherOccupation")} />
                  </Field>
                  <Field label="Father's name (Pangalan ng Ama)" htmlFor="fatherName" required error={errors.fatherName}>
                    <input className={inputCls} {...text("fatherName")} />
                  </Field>
                  <Field label="Father's occupation (Trabaho)" htmlFor="fatherOccupation">
                    <input className={inputCls} {...text("fatherOccupation")} />
                  </Field>
                  <Field label="Spouse's name (Pangalan ng Asawa)" htmlFor="spouseName" required={married} error={errors.spouseName}>
                    <input className={inputCls} {...text("spouseName")} />
                  </Field>
                  <Field label="Spouse's occupation (Trabaho)" htmlFor="spouseOccupation">
                    <input className={inputCls} {...text("spouseOccupation")} />
                  </Field>
                </div>
              </Section>

              {/* BENEFICIARIES */}
              <Section
                title="Beneficiaries"
                hint="Benepisyaryo: at least one is required, up to three."
                delay={100}
              >
                <div className="space-y-6">
                  {v.beneficiaries.map((b, i) => (
                    <div key={i} className="grid gap-4 md:grid-cols-[1.4fr_1fr_1fr]">
                      <Field label={`${i + 1}. Name`} htmlFor={`ben-${i}-name`} required={i === 0} error={errors[`ben${i}.name`]}>
                        <input
                          id={`ben-${i}-name`}
                          value={b.name}
                          aria-invalid={!!errors[`ben${i}.name`]}
                          onChange={(e) => setBeneficiary(i, "name", e.target.value)}
                          className={inputCls}
                        />
                      </Field>
                      <Field label="Relationship (Kaugnayan)" htmlFor={`ben-${i}-relationship`} required={i === 0} error={errors[`ben${i}.relationship`]}>
                        <input
                          id={`ben-${i}-relationship`}
                          value={b.relationship}
                          aria-invalid={!!errors[`ben${i}.relationship`]}
                          onChange={(e) => setBeneficiary(i, "relationship", e.target.value)}
                          className={inputCls}
                        />
                      </Field>
                      <Field label="Birthdate (Kapanganakan)" htmlFor={`ben-${i}-birthDate`} required={i === 0} error={errors[`ben${i}.birthDate`]}>
                        <input
                          id={`ben-${i}-birthDate`}
                          type="date"
                          max={maxDate}
                          value={b.birthDate}
                          aria-invalid={!!errors[`ben${i}.birthDate`]}
                          onChange={(e) => setBeneficiary(i, "birthDate", e.target.value)}
                          className={inputCls}
                        />
                      </Field>
                    </div>
                  ))}
                </div>
              </Section>

              {/* EDUCATION */}
              <Section
                title="Education"
                hint="Pinag-aralan at Paaralan. Optional; leave blank what does not apply."
                delay={100}
              >
                <div className="space-y-5">
                  {EDUCATION.map(({ key, label }) => (
                    <div key={key} className="grid gap-4 md:grid-cols-[2fr_1fr]">
                      <Field label={`${label}: school`} htmlFor={`edu-${key}-school`}>
                        <input
                          id={`edu-${key}-school`}
                          value={v.education[key].school}
                          onChange={(e) => setEducation(key, "school", e.target.value)}
                          className={inputCls}
                        />
                      </Field>
                      <Field label="Year graduated (Taon ng Pagtatapos)" htmlFor={`edu-${key}-year`} error={errors[`edu.${key}.year`]}>
                        <input
                          id={`edu-${key}-year`}
                          inputMode="numeric"
                          maxLength={4}
                          placeholder="YYYY"
                          value={v.education[key].year}
                          aria-invalid={!!errors[`edu.${key}.year`]}
                          onChange={(e) =>
                            setEducation(key, "year", e.target.value.replace(/\D/g, ""))
                          }
                          className={inputCls}
                        />
                      </Field>
                    </div>
                  ))}
                </div>
              </Section>

              {/* IDENTIFICATION */}
              <Section
                title="Identification"
                hint="Pagkakakilanlan. Optional; provide the numbers you have."
                delay={100}
              >
                <div className="grid gap-5 md:grid-cols-2">
                  {IDS.map(({ key, label }) => (
                    <Field key={key} label={label} htmlFor={`id-${key}`}>
                      <input
                        id={`id-${key}`}
                        value={v.ids[key]}
                        onChange={(e) =>
                          setV((p) => ({
                            ...p,
                            ids: { ...p.ids, [key]: clean(e.target.value) },
                          }))
                        }
                        className={inputCls}
                      />
                    </Field>
                  ))}
                  <Field label="Others (Voter's / PWD / etc.)" htmlFor="otherId" className="md:col-span-2">
                    <input className={inputCls} {...text("otherId")} />
                  </Field>
                </div>
              </Section>

              {/* AVAILABILITY */}
              <Section
                title="PMES Seminar Availability"
                hint="Choose the date you are available to attend the Pre-Membership Education Seminar."
                delay={100}
              >
                <Field label="Date of availability" htmlFor="availabilityDate" required error={errors.availabilityDate} className="max-w-sm">
                  <input type="date" min={minDate} className={inputCls} {...text("availabilityDate")} />
                </Field>
              </Section>

              {/* SIGNATURE */}
              <Section title="Name and Signature" hint="Pangalan at pirma / petsa" delay={100}>
                <div className="grid gap-5 md:grid-cols-[2fr_1fr]">
                  <Field label="Type your full name as your signature" htmlFor="signature" required error={errors.signature}>
                    <input autoComplete="name" className={inputCls} {...text("signature")} />
                  </Field>
                  <Field label="Date" htmlFor="signDate">
                    <input id="signDate" readOnly value={today} className={cn(inputCls, "opacity-70")} />
                  </Field>
                </div>

                <div className="mt-6">
                  <label className="flex cursor-pointer items-start gap-3 text-sm md:text-base">
                    <input
                      id="agree"
                      type="checkbox"
                      checked={v.agree}
                      aria-invalid={!!errors.agree}
                      onChange={(e) => {
                        setV((p) => ({ ...p, agree: e.target.checked }));
                        clearError("agree");
                      }}
                      className="mt-1 h-5 w-5 shrink-0 accent-[#efc673]"
                    />
                    I confirm that the information above is true and correct.
                  </label>
                  {errors.agree && (
                    <p role="alert" className="mt-1.5 text-sm text-red-300">
                      {errors.agree}
                    </p>
                  )}
                </div>
              </Section>

              {/* SUBMIT */}
              <div className="flex flex-col items-center gap-4 pt-4">
                {Object.keys(errors).length > 0 && (
                  <p role="alert" className="text-sm text-red-300">
                    Please fix the highlighted fields and try again.
                  </p>
                )}
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center rounded-full px-12 py-4 text-base font-bold uppercase tracking-wide text-[#1a1004] shadow-[0_0_30px_rgba(239,198,115,0.35)] transition-transform duration-200 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#efc673] disabled:opacity-60 motion-safe:hover:scale-105 md:text-lg"
                  style={{ backgroundImage: GOLD_GRADIENT }}
                >
                  {submitting ? "Submitting..." : "Submit Application"}
                </button>
                <Link href="/membership" className="text-sm text-white/70 underline underline-offset-4 hover:text-white">
                  Back to onboarding process
                </Link>
              </div>
            </form>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
}