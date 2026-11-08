import { useState, type ReactNode } from "react";
import type { ProfileData } from "../profile/profileForm";
import { formatDateOfBirth, formatSalary } from "../profile/profileFormat";

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-0.5 border-b border-stone-200/70 py-3 last:border-0 sm:grid-cols-[11rem_1fr] sm:gap-4">
      <dt className="text-[13px] text-stone-500">{label}</dt>
      <dd className="text-[15px] font-medium break-words text-stone-900">{value || "—"}</dd>
    </div>
  );
}

function DocSection({ index, title, children }: { index: string; title: string; children: ReactNode }) {
  return (
    <section className="break-inside-avoid">
      <h3 className="mb-3 flex items-baseline gap-3">
        <span className="font-display text-lg font-semibold text-amber-600 tabular-nums">{index}</span>
        <span className="text-sm font-semibold text-stone-900">{title}</span>
      </h3>
      <dl className="rounded-xl border border-stone-200 bg-stone-50/60 px-5">{children}</dl>
    </section>
  );
}

/** On-screen (and printable) rendering of the employee profile document. */
export default function ProfileDocument({ profile }: { profile: ProfileData }) {
  // Fixed for the lifetime of the preview so the reference doesn't change on re-render.
  const [issuedOn] = useState(() => new Date().toLocaleDateString("en-GB"));
  const [reference] = useState(() => Date.now().toString().slice(-6));

  return (
    <article
      aria-label="Document preview"
      className="overflow-hidden rounded-2xl border border-stone-200/80 bg-white shadow-[0_1px_2px_rgb(0_0_0/0.04),0_12px_32px_-16px_rgb(28_25_23/0.18)] motion-safe:animate-rise [animation-delay:80ms] print:rounded-none print:border-0 print:shadow-none"
    >
      <div className="h-1.5 bg-gradient-to-r from-amber-400 via-amber-300 to-orange-400" />
      <div className="p-6 sm:p-10">
        <div className="mb-8 flex items-start justify-between gap-4 border-b-2 border-stone-900 pb-7">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-amber-700">
              Official Document
            </p>
            <h2 className="font-display mt-1.5 text-3xl font-semibold text-stone-950">
              Employee Profile
            </h2>
            <p className="mt-1.5 text-xs text-stone-500 tabular-nums">Ref: EMP-{reference}</p>
          </div>
          <div className="text-right">
            <span className="ml-auto flex size-14 items-center justify-center rounded-full bg-stone-900 font-display text-2xl font-semibold text-amber-300">
              {profile.fullName.trim().charAt(0).toUpperCase() || "?"}
            </span>
            <p className="mt-2 text-xs text-stone-500 tabular-nums">Issued: {issuedOn}</p>
          </div>
        </div>

        <div className="space-y-7">
          <DocSection index="01" title="Personal information">
            <Row label="Full Name" value={profile.fullName} />
            <Row label="Email Address" value={profile.email} />
            <Row label="Phone Number" value={profile.phoneNumber} />
            <Row label="Date of Birth" value={formatDateOfBirth(profile.dob)} />
            <Row label="National ID (NID)" value={profile.nid} />
          </DocSection>
          <DocSection index="02" title="Employment details">
            <Row label="Current Salary" value={formatSalary(profile.currentSalary)} />
          </DocSection>
          <DocSection index="03" title="Emergency contact">
            <Row label="Contact Name" value={profile.emergencyContactName} />
            <Row label="Contact Number" value={profile.emergencyContactNumber} />
          </DocSection>
        </div>

        <div className="mt-10 flex items-center justify-between border-t border-stone-200 pt-5 text-[11px] text-stone-500">
          <span>Confidential — For Internal Use Only</span>
          <span>Page 1 of 1</span>
        </div>
      </div>
    </article>
  );
}
