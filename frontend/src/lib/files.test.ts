import { describe, expect, it } from "vitest";
import { base64ToPdfBlob } from "./files";

describe("base64ToPdfBlob", () => {
  it("decodes bytes into an application/pdf blob", async () => {
    const blob = base64ToPdfBlob(btoa("%PDF-1.7"));
    expect(blob.type).toBe("application/pdf");
    expect(await blob.text()).toBe("%PDF-1.7");
  });
});
