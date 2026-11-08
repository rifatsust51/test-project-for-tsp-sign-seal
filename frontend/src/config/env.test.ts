import { describe, expect, it } from "vitest";
import { ConfigError, parseConfig } from "./env";

const valid = {
  VITE_TSP_GATEWAY_URL: "https://tsp.example/gateway/",
  VITE_TSP_ADMIN_TOKEN_URL: "https://tsp.example/token",
  VITE_TSP_ADMIN_USER_ID: " user-1 ",
  VITE_TSP_ADMIN_DIGITAL_IDENTITY_ID: "identity-1",
};

describe("parseConfig", () => {
  it("parses, trims and strips trailing slashes", () => {
    expect(parseConfig(valid)).toEqual({
      tspGatewayUrl: "https://tsp.example/gateway",
      tspAdminTokenUrl: "https://tsp.example/token",
      tspAdminUserId: "user-1",
      tspAdminDigitalIdentityId: "identity-1",
      aasConfigPath: "aas.json",
    });
  });

  it("names every missing variable", () => {
    expect(() => parseConfig({ VITE_TSP_GATEWAY_URL: "https://tsp.example" })).toThrow(
      /VITE_TSP_ADMIN_TOKEN_URL, VITE_TSP_ADMIN_USER_ID, VITE_TSP_ADMIN_DIGITAL_IDENTITY_ID/,
    );
  });

  it("rejects a relative or malformed URL", () => {
    expect(() => parseConfig({ ...valid, VITE_TSP_GATEWAY_URL: "/gateway" })).toThrow(ConfigError);
  });
});
