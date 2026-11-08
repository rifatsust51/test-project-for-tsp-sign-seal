/** Narrows an untrusted value (parsed JSON, storage, API body) to a plain object. */
export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/** Returns the value when it is a non-empty string, otherwise undefined. */
export const nonEmptyString = (value: unknown): string | undefined =>
  typeof value === "string" && value.trim() !== "" ? value : undefined;
