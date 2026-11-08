import { describe, expect, it } from "vitest";
import { EMPTY_FORM, todayIso, validateAll, validateField, type ProfileData } from "./profileForm";

const complete: ProfileData = {
  fullName: "Ada Lovelace",
  email: "ada@example.com",
  phoneNumber: "+8801700000000",
  dob: "1990-05-14",
  nid: "19901234567890",
  currentSalary: "75,000",
  emergencyContactName: "Fatima Rahman",
  emergencyContactNumber: "+8801800000000",
};

describe("validateField", () => {
  it("requires non-blank text", () => {
    expect(validateField("fullName", "   ")).toBe("Full name is required");
    expect(validateField("fullName", "Ada")).toBeUndefined();
  });

  it("checks email shape", () => {
    expect(validateField("email", "ada@")).toBe("Valid email is required");
    expect(validateField("email", "ada@example.com")).toBeUndefined();
  });

  it("rejects a future date of birth", () => {
    expect(validateField("dob", "")).toBe("Date of birth is required");
    expect(validateField("dob", "9999-01-01")).toBe("Date of birth can't be in the future");
    expect(validateField("dob", todayIso())).toBeUndefined();
  });
});

describe("validateAll", () => {
  it("passes a complete profile", () => {
    expect(validateAll(complete)).toEqual({});
  });

  it("flags every empty field", () => {
    expect(Object.keys(validateAll(EMPTY_FORM))).toHaveLength(Object.keys(EMPTY_FORM).length);
  });
});
