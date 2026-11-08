import { describe, expect, it } from "vitest";
import { formatDateOfBirth, formatSalary, initialsOf, profileFileName } from "./profileFormat";

describe("formatSalary", () => {
  it("formats numeric input as BDT", () => {
    expect(formatSalary("75000")).toBe(`BDT ${(75000).toLocaleString()}`);
    expect(formatSalary("75,000")).toBe(`BDT ${(75000).toLocaleString()}`);
  });

  it("leaves non-numeric and empty input as typed", () => {
    expect(formatSalary("negotiable")).toBe("negotiable");
    expect(formatSalary("")).toBe("");
  });
});

describe("formatDateOfBirth", () => {
  it("formats ISO dates in long British form", () => {
    expect(formatDateOfBirth("1990-05-14")).toBe("14 May 1990");
  });

  it("handles empty and invalid input", () => {
    expect(formatDateOfBirth("")).toBe("—");
    expect(formatDateOfBirth("not-a-date")).toBe("not-a-date");
  });
});

describe("initialsOf", () => {
  it.each([
    ["Ada Lovelace", "AL"],
    ["  ada  byron lovelace ", "AB"],
    ["", "?"],
  ])("%s → %s", (name, expected) => {
    expect(initialsOf(name)).toBe(expected);
  });
});

describe("profileFileName", () => {
  it("builds a filesystem-safe name", () => {
    expect(profileFileName({ fullName: "Jonathan A. Rahman" })).toBe("Profile_Jonathan_A._Rahman.pdf");
    expect(profileFileName({ fullName: "a/b\\c" })).toBe("Profile_a_b_c.pdf");
    expect(profileFileName({ fullName: "  " })).toBe("Profile_Unnamed.pdf");
  });
});
