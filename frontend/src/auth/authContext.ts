import { createContext, useContext } from "react";
import type { UserProfile } from "./aasClient";

export interface AuthContextValue {
  /** The signed-in user, or null while browsing as a guest. */
  user: UserProfile | null;
  /** Redirects to the identity provider; comes back to the current URL. */
  login: () => Promise<void>;
  /** Clears the local session and ends the SSO session. */
  logout: () => void;
  /** A fresh-enough access token for the signed-in user. Throws when signed out. */
  getAccessToken: () => Promise<string>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside <AuthProvider>");
  return value;
}
