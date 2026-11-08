import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../../auth/authContext";
import { errorMessage } from "../../lib/errors";
import { base64ToPdfBlob, triggerDownload } from "../../lib/files";
import { signAsAdmin, signAsUser, verifySignature } from "../../services/tspGateway";
import type { ProfileData } from "../profile/profileForm";
import { profileFileName } from "../profile/profileFormat";
import { generateProfilePdfBase64 } from "../profile/profilePdf";
import {
  INITIAL_SIGNING_STATE,
  USER_SIGNING_STEPS,
  deriveSigningView,
  type SigningState,
} from "./signingStatus";

/**
 * Orchestrates signing the profile PDF, either with the signed-in user's own
 * identity (sign → verify) or with the organisation's admin identity, and
 * exposes the signed file for download.
 */
export function useDocumentSigning(profile: ProfileData) {
  const { user, login, getAccessToken } = useAuth();
  const [state, setState] = useState<SigningState>(INITIAL_SIGNING_STATE);
  const [signedPdfUrl, setSignedPdfUrl] = useState<string | null>(null);

  const fileName = profileFileName(profile);
  const isAuthenticated = user !== null;
  const view = useMemo(() => deriveSigningView(state, isAuthenticated), [state, isAuthenticated]);

  // Release the previous signed PDF whenever it is replaced, and on unmount.
  useEffect(() => {
    if (!signedPdfUrl) return;
    return () => URL.revokeObjectURL(signedPdfUrl);
  }, [signedPdfUrl]);

  const patch = useCallback((next: Partial<SigningState>) => {
    setState((prev) => ({ ...prev, ...next }));
  }, []);

  const publishSignedPdf = useCallback((signedBase64: string) => {
    setSignedPdfUrl(URL.createObjectURL(base64ToPdfBlob(signedBase64)));
  }, []);

  /** Signs as the current user, or starts the login redirect for a guest. */
  const signAsCurrentUser = useCallback(async () => {
    if (state.activeJob) return;

    if (!user) {
      try {
        await login();
      } catch (error) {
        console.error("Login redirect failed:", error);
        patch({ failure: { mode: "user", kind: "error", message: errorMessage(error) } });
      }
      return;
    }

    patch({
      activeJob: "user",
      userStep: USER_SIGNING_STEPS.generating,
      userVerified: false,
      failure: null,
    });
    setSignedPdfUrl(null);

    try {
      const pdfBase64 = await generateProfilePdfBase64(profile);

      patch({ userStep: USER_SIGNING_STEPS.signing });
      const accessToken = await getAccessToken();
      const signedBase64 = await signAsUser({ pdfBase64, fileName }, { id: user.id, accessToken });

      patch({ userStep: USER_SIGNING_STEPS.verifying });
      const isValid = await verifySignature({ pdfBase64: signedBase64, fileName });
      if (!isValid) {
        patch({
          failure: { mode: "user", kind: "verification", message: "Signature verification failed" },
        });
        return;
      }

      publishSignedPdf(signedBase64);
      patch({ userVerified: true });
    } catch (error) {
      console.error("User signing failed:", error);
      patch({ failure: { mode: "user", kind: "error", message: errorMessage(error) } });
    } finally {
      patch({ activeJob: null });
    }
  }, [state.activeJob, user, login, patch, profile, getAccessToken, fileName, publishSignedPdf]);

  /** Signs with the organisation's admin identity; no login required. */
  const signAsOrganisation = useCallback(async () => {
    if (state.activeJob) return;
    patch({ activeJob: "admin", failure: null });

    try {
      const pdfBase64 = await generateProfilePdfBase64(profile);
      const signedBase64 = await signAsAdmin({ pdfBase64, fileName });
      publishSignedPdf(signedBase64);
      patch({ adminSigned: true });
    } catch (error) {
      console.error("Admin signing failed:", error);
      patch({ failure: { mode: "admin", kind: "error", message: errorMessage(error) } });
    } finally {
      patch({ activeJob: null });
    }
  }, [state.activeJob, patch, profile, fileName, publishSignedPdf]);

  const downloadSignedPdf = useCallback(() => {
    if (signedPdfUrl) triggerDownload(signedPdfUrl, `Signed_${fileName}`);
  }, [signedPdfUrl, fileName]);

  return {
    state,
    view,
    canDownload: signedPdfUrl !== null,
    signAsCurrentUser,
    signAsOrganisation,
    downloadSignedPdf,
  };
}
