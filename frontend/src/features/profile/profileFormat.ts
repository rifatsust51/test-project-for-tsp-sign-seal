import type { ProfileData } from "./profileForm";

const EMPTY_VALUE = "—";

/** "75,000" → "BDT 75,000"; non-numeric input is shown as typed. */
export function formatSalary(value: string): string {
  const digits = value.replace(/,/g, "").trim();
  if (digits === "" || Number.isNaN(Number(digits))) return value;
  return `BDT ${Number(digits).toLocaleString()}`;
}

/** "1990-05-14" → "14 May 1990". */
export function formatDateOfBirth(isoDate: string): string {
  if (!isoDate) return EMPTY_VALUE;
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return isoDate;
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });
}

/** Up to two upper-case initials, or "?" when there is no name. */
export function initialsOf(name: string): string {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("") || "?"
  );
}

/** File name used for the generated and signed PDF. */
export function profileFileName(profile: Pick<ProfileData, "fullName">): string {
  const safeName = profile.fullName.trim().replace(/[^\p{L}\p{N}._-]+/gu, "_") || "Unnamed";
  return `Profile_${safeName}.pdf`;
}
