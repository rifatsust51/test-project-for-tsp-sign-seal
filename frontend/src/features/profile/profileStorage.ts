import { isRecord } from "../../lib/guards";
import { EMPTY_FORM, type ProfileData } from "./profileForm";

/**
 * The submitted profile survives the login redirect (a full page reload) via
 * sessionStorage, which is scoped to this tab and cleared when it closes.
 */
const STORAGE_KEY = "tsp_form_data";

/** Validates stored JSON; any malformed or tampered value is treated as absent. */
export function parseStoredProfile(raw: string | null): ProfileData | null {
  if (!raw) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!isRecord(parsed)) return null;

  const profile = { ...EMPTY_FORM };
  for (const key of Object.keys(EMPTY_FORM) as (keyof ProfileData)[]) {
    const value = parsed[key];
    if (typeof value !== "string") return null;
    profile[key] = value;
  }
  return profile;
}

export function loadProfile(): ProfileData | null {
  try {
    return parseStoredProfile(sessionStorage.getItem(STORAGE_KEY));
  } catch {
    return null; // Storage can be unavailable (privacy mode, disabled cookies).
  }
}

export function saveProfile(profile: ProfileData): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  } catch {
    // Non-fatal: the in-memory copy still drives this visit.
  }
}
