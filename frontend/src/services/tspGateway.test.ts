import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  TspApiError,
  isVerificationSuccessful,
  parseAdminToken,
  parseSignedData,
} from "./tspGateway";

describe("parseSignedData", () => {
  it.each([
    [{ signedData: "abc" }],
    [{ data: { signedData: "abc" } }],
    [{ data: { signedData: ["abc", "ignored"] } }],
    [{ signedData: ["abc"] }],
  ])("extracts from %j", (body) => {
    expect(parseSignedData(body)).toBe("abc");
  });

  it("surfaces the service message when signed data is missing", () => {
    expect(() => parseSignedData({ code: 7, message: "Identity locked" })).toThrow("Identity locked");
    expect(() => parseSignedData(null)).toThrow(TspApiError);
  });
});

describe("isVerificationSuccessful", () => {
  it("accepts only code 0 with Success", () => {
    expect(isVerificationSuccessful({ code: 0, message: "Success" })).toBe(true);
    expect(isVerificationSuccessful({ code: 1, message: "Success" })).toBe(false);
    expect(isVerificationSuccessful({ code: 0, message: "Invalid" })).toBe(false);
    expect(isVerificationSuccessful("Success")).toBe(false);
  });
});

describe("parseAdminToken", () => {
  it("strips the Bearer prefix", () => {
    expect(parseAdminToken({ data: { token: "Bearer  tok-1 " } })).toBe("tok-1");
    expect(parseAdminToken({ data: { token: "tok-2" } })).toBe("tok-2");
  });

  it("rejects responses without a token", () => {
    expect(() => parseAdminToken({ data: {} })).toThrow(TspApiError);
    expect(() => parseAdminToken({ data: { token: "Bearer " } })).toThrow(TspApiError);
  });
});

// ── HTTP behaviour (fresh module per test: the admin token is cached module state) ──

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

async function loadGateway() {
  vi.resetModules();
  return import("./tspGateway");
}

describe("gateway requests", () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });
  afterEach(() => vi.unstubAllGlobals());

  it("signs as the user with their bearer token", async () => {
    const { signAsUser } = await loadGateway();
    fetchMock.mockResolvedValueOnce(json(200, { data: { signedData: "signed" } }));

    const result = await signAsUser(
      { pdfBase64: "pdf", fileName: "a.pdf" },
      { id: "u1", accessToken: "user-token" },
    );

    expect(result).toBe("signed");
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://tsp.test/gateway/signFile");
    expect(new Headers(init?.headers).get("Authorization")).toBe("Bearer user-token");
    expect(JSON.parse(String(init?.body))).toMatchObject({
      data: "pdf",
      fileNames: ["a.pdf"],
      userId: "u1",
      signatureType: "PADES",
    });
  });

  it("caches the admin token across requests", async () => {
    const { signAsAdmin } = await loadGateway();
    fetchMock
      .mockResolvedValueOnce(json(200, { data: { token: "Bearer t1" } }))
      .mockResolvedValueOnce(json(200, { signedData: "s1" }))
      .mockResolvedValueOnce(json(200, { signedData: "s2" }));

    await signAsAdmin({ pdfBase64: "pdf", fileName: "a.pdf" });
    await signAsAdmin({ pdfBase64: "pdf", fileName: "a.pdf" });

    const urls = fetchMock.mock.calls.map(([url]) => url);
    expect(urls).toEqual([
      "https://tsp.test/admin/token",
      "https://tsp.test/gateway/v2/signFile",
      "https://tsp.test/gateway/v2/signFile",
    ]);
  });

  it("refreshes the admin token once after a 401", async () => {
    const { verifySignature } = await loadGateway();
    fetchMock
      .mockResolvedValueOnce(json(200, { data: { token: "stale" } }))
      .mockResolvedValueOnce(json(401, { message: "Token expired" }))
      .mockResolvedValueOnce(json(200, { data: { token: "fresh" } }))
      .mockResolvedValueOnce(json(200, { code: 0, message: "Success" }));

    await expect(verifySignature({ pdfBase64: "signed", fileName: "a.pdf" })).resolves.toBe(true);
    const lastInit = fetchMock.mock.calls[3][1];
    expect(new Headers(lastInit?.headers).get("Authorization")).toBe("Bearer fresh");
  });

  it("reports HTTP failures with the service message and status", async () => {
    const { signAsUser } = await loadGateway();
    fetchMock.mockResolvedValueOnce(json(500, { message: "HSM unavailable" }));

    const error = await signAsUser(
      { pdfBase64: "pdf", fileName: "a.pdf" },
      { id: "u1", accessToken: "t" },
    ).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(Error);
    expect((error as Error).message).toBe("Signing failed: HSM unavailable");
    expect((error as { status?: number }).status).toBe(500);
  });

  it("reports network failures clearly", async () => {
    const { signAsAdmin } = await loadGateway();
    fetchMock.mockRejectedValueOnce(new TypeError("Failed to fetch"));

    await expect(signAsAdmin({ pdfBase64: "pdf", fileName: "a.pdf" })).rejects.toThrow(
      "Fetching admin token failed: the signing service is unreachable",
    );
  });
});
