import { describe, expect, it } from "vitest";
import { EMPTY_FORM } from "./profileForm";
import { parseStoredProfile } from "./profileStorage";

describe("parseStoredProfile", () => {
  it("round-trips a saved profile", () => {
    const profile = { ...EMPTY_FORM, fullName: "Ada", email: "ada@example.com" };
    expect(parseStoredProfile(JSON.stringify(profile))).toEqual(profile);
  });

  it("drops unknown keys", () => {
    const stored = JSON.stringify({ ...EMPTY_FORM, injected: "<script>" });
    expect(parseStoredProfile(stored)).toEqual(EMPTY_FORM);
  });

  it.each([null, "", "{oops", "[]", JSON.stringify({ ...EMPTY_FORM, nid: 42 })])(
    "treats %s as absent",
    (raw) => {
      expect(parseStoredProfile(raw)).toBeNull();
    },
  );
});
