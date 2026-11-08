import { describe, expect, it } from "vitest";
import { isLoginCallback, parseUserProfile } from "./aasClient";

describe("isLoginCallback", () => {
  it.each([
    ["https://app/preview?state=abc&code=xyz", true],
    ["https://app/preview#state=abc&session_state=s&code=xyz", true],
    ["https://app/preview", false],
    ["https://app/preview?code=xyz", false],
  ])("%s → %s", (url, expected) => {
    expect(isLoginCallback(url)).toBe(expected);
  });
});

describe("parseUserProfile", () => {
  it("reads id, name and email from the token claims", () => {
    const claims = JSON.stringify({ sub: "u1", name: "Ada Lovelace", email: "ada@example.com" });
    expect(parseUserProfile(claims)).toEqual({ id: "u1", name: "Ada Lovelace", email: "ada@example.com" });
  });

  it("falls back to preferred_username and a placeholder email", () => {
    const claims = JSON.stringify({ sub: "u1", preferred_username: "ada" });
    expect(parseUserProfile(claims)).toEqual({ id: "u1", name: "ada", email: "No Email" });
  });

  it.each(["not json", "null", "[]", JSON.stringify({ name: "No subject" })])(
    "rejects %s",
    (input) => {
      expect(parseUserProfile(input)).toBeNull();
    },
  );
});
