import type { Page, Request, Route } from "@playwright/test";

export const GATEWAY = "https://tsp.e2e.test/gateway";
export const ADMIN_TOKEN_URL = "https://tsp.e2e.test/admin/token";

export const TEST_USER = { sub: "user-1", name: "Ada Lovelace", email: "ada@example.com" };
export const USER_TOKEN = "user-access-token";
export const ADMIN_TOKEN = "admin-access-token";

/** A tiny but real PDF, base64 encoded, standing in for the gateway's signed output. */
export const SIGNED_PDF_BASE64 = Buffer.from(
  "%PDF-1.4\n1 0 obj<</Type/Catalog>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF\n",
).toString("base64");

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Authorization, Content-Type, Accept",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

/**
 * Replaces public/aas.min.js with a fake SDK. `init()` behaves like the real
 * `login-required` wrapper: without a callback in the URL it "redirects to the
 * identity provider", which immediately sends the browser back with a code.
 */
export async function fakeAasSdk(page: Page) {
  const script = `
    window.AAS = function () {
      const isCallback = () => /[?&#]code=/.test(location.href) && /[?&#]state=/.test(location.href);
      return {
        init: function () {
          if (isCallback()) return Promise.resolve(true);
          location.assign(location.pathname + "?state=e2e-state&code=e2e-code");
          return new Promise(function () {});
        },
        getToken: function () { return ${JSON.stringify(USER_TOKEN)}; },
        getTokenParsed: function () { return ${JSON.stringify(JSON.stringify(TEST_USER))}; },
        updateToken: function () { return Promise.resolve(false); },
        logout: function () { window.__aasLoggedOut = true; },
      };
    };`;
  await page.route("**/aas.min.js", (route) =>
    route.fulfill({ contentType: "application/javascript", body: script }),
  );
}

type Handler = (request: Request) => { status?: number; body: unknown };

export interface GatewayOptions {
  adminSign?: Handler;
  userSign?: Handler;
  verify?: Handler;
}

/** Fakes the TSP gateway and records every request the app makes to it. */
export async function fakeGateway(page: Page, options: GatewayOptions = {}) {
  const requests: Request[] = [];

  const respond = (handler: Handler) => async (route: Route) => {
    const request = route.request();
    if (request.method() === "OPTIONS") {
      return route.fulfill({ status: 204, headers: CORS_HEADERS });
    }
    requests.push(request);
    const { status = 200, body } = handler(request);
    return route.fulfill({ status, headers: CORS_HEADERS, json: body });
  };

  await page.route(
    ADMIN_TOKEN_URL,
    respond(() => ({ body: { data: { token: `Bearer ${ADMIN_TOKEN}` } } })),
  );
  await page.route(
    `${GATEWAY}/v2/signFile`,
    respond(options.adminSign ?? (() => ({ body: { data: { signedData: [SIGNED_PDF_BASE64] } } }))),
  );
  await page.route(
    `${GATEWAY}/signFile`,
    respond(options.userSign ?? (() => ({ body: { data: { signedData: SIGNED_PDF_BASE64 } } }))),
  );
  await page.route(
    `${GATEWAY}/verifyFile`,
    respond(options.verify ?? (() => ({ body: { code: 0, message: "Success" } }))),
  );

  return {
    requests,
    to: (path: string) => requests.filter((r) => r.url() === `${GATEWAY}${path}`),
  };
}
