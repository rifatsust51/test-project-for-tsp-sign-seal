import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  clearLoginCallbackFromUrl,
  createAasClient,
  isLoginCallback,
  parseUserProfile,
  type AasClient,
  type UserProfile,
} from "./aasClient";
import { AuthContext, type AuthContextValue } from "./authContext";

/**
 * Guest-first authentication.
 *
 * The SDK is only initialised when the page is a login callback; otherwise the
 * user stays a guest until they choose to sign (see `login`). This avoids the
 * SDK's forced `login-required` redirect on a fresh visit.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const clientRef = useRef<AasClient | null>(null);
  const didInitRef = useRef(false);
  const [user, setUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    // StrictMode runs effects twice in development; a Keycloak instance must init once.
    if (didInitRef.current) return;
    didInitRef.current = true;

    if (!window.AAS || !isLoginCallback(window.location.href)) return;

    const completeLogin = async () => {
      try {
        const client = createAasClient();
        clientRef.current = client;
        const authenticated = await client.init();
        if (!authenticated) return;

        const profile = parseUserProfile(client.getTokenParsed());
        if (!profile) throw new Error("Access token is missing the subject claim");
        setUser(profile);
        clearLoginCallbackFromUrl();
      } catch (error) {
        console.error("Completing login failed:", error);
      }
    };

    void completeLogin();
  }, []);

  const login = useCallback(async () => {
    // A fresh instance: the callback instance (if any) has already been initialised.
    await createAasClient().init();
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    try {
      (clientRef.current ?? createAasClient()).logout();
    } catch (error) {
      console.error("Logout failed:", error);
    }
    clientRef.current = null;
  }, []);

  const getAccessToken = useCallback(async () => {
    const client = clientRef.current;
    if (!client) throw new Error("You are not signed in");
    try {
      await client.updateToken();
    } catch {
      // Refresh is best effort; the gateway rejects the request if the token is truly expired.
    }
    const token = client.getToken();
    if (!token) throw new Error("Your session has expired. Please log in again.");
    return token;
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, login, logout, getAccessToken }),
    [user, login, logout, getAccessToken],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
