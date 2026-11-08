import type { ReactNode } from "react";
import {
  AlertIcon,
  CheckIcon,
  DownloadIcon,
  PenIcon,
  ShieldCheckIcon,
  SpinnerIcon,
  UserShieldIcon,
} from "../../components/icons";
import type { SigningState, SigningView, StatusTone } from "./signingStatus";

interface SigningPanelProps {
  state: SigningState;
  view: SigningView;
  isAuthenticated: boolean;
  canDownload: boolean;
  onSignAsUser: () => void;
  onSignAsAdmin: () => void;
  onDownload: () => void;
}

const TONE_ICON: Record<StatusTone, { className: string; icon: ReactNode }> = {
  busy: {
    className: "bg-navy-900 text-sky-300",
    icon: <SpinnerIcon className="size-5 motion-safe:animate-spin" strokeWidth={2.25} />,
  },
  signed: {
    className: "bg-emerald-100 text-emerald-700",
    icon: <ShieldCheckIcon className="size-5" strokeWidth={2} />,
  },
  failed: {
    className: "bg-rose-100 text-rose-600",
    icon: <AlertIcon className="size-5" strokeWidth={2} />,
  },
  ready: { className: "bg-navy-900 text-sky-300", icon: <PenIcon className="size-5" /> },
  guest: { className: "bg-stone-100 text-stone-600", icon: <UserShieldIcon className="size-5" /> },
};

const spinner = <SpinnerIcon className="size-4 motion-safe:animate-spin" strokeWidth={2.25} />;
const check = <CheckIcon className="size-4" strokeWidth={2.5} />;

/** Status card with the user-sign, admin-sign and download actions. */
export default function SigningPanel({
  state,
  view,
  isAuthenticated,
  canDownload,
  onSignAsUser,
  onSignAsAdmin,
  onDownload,
}: SigningPanelProps) {
  const isUserBusy = state.activeJob === "user";
  const isAdminBusy = state.activeJob === "admin";
  const statusIcon = TONE_ICON[view.tone];

  return (
    <section
      aria-labelledby="sign-status-title"
      className="rounded-2xl border border-stone-200/80 bg-white p-6 shadow-[0_1px_2px_rgb(0_0_0/0.04),0_12px_32px_-16px_rgb(28_25_23/0.18)] motion-safe:animate-rise [animation-delay:160ms] xl:sticky xl:top-8 print:hidden"
    >
      <div aria-live="polite">
        <div className="flex items-center gap-3">
          <span
            className={`flex size-11 items-center justify-center rounded-full ${statusIcon.className}`}
          >
            {statusIcon.icon}
          </span>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-500">
              {view.eyebrow}
            </p>
            <h2
              id="sign-status-title"
              className="font-display text-xl leading-tight font-semibold text-stone-950"
            >
              {view.title}
            </h2>
          </div>
        </div>
        <p
          className={`mt-3 text-sm leading-relaxed ${view.tone === "failed" ? "text-rose-700" : "text-stone-600"}`}
        >
          {view.detail}
        </p>
        {view.failureReason && (
          <p className="mt-2 rounded-lg bg-rose-50 px-3 py-2 text-xs break-words text-rose-700">
            {view.failureReason}
          </p>
        )}
      </div>

      <div className="mt-6 space-y-3">
        <button
          type="button"
          onClick={onSignAsUser}
          disabled={view.isBusy || state.userVerified}
          className={`flex h-12 w-full items-center justify-center gap-2.5 rounded-xl text-sm font-semibold transition-[background-color,transform,box-shadow] duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500 ${
            state.userVerified
              ? "cursor-default border border-emerald-200 bg-emerald-50 text-emerald-700"
              : isUserBusy
                ? "cursor-wait bg-stone-100 text-stone-500"
                : "bg-navy-900 text-white shadow-[0_8px_20px_-8px_rgb(12_26_61/0.6)] hover:bg-navy-800 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100"
          }`}
        >
          {isUserBusy ? spinner : state.userVerified ? check : <PenIcon className="size-4 text-sky-300" />}
          {isUserBusy
            ? "Processing…"
            : state.userVerified
              ? "Successfully signed"
              : isAuthenticated
                ? "Complete signature"
                : "Log in & sign"}
        </button>

        <div className="flex items-center gap-3 text-[11px] font-medium uppercase tracking-[0.18em] text-stone-400">
          <span className="h-px flex-1 bg-stone-200" />
          or
          <span className="h-px flex-1 bg-stone-200" />
        </div>

        <button
          type="button"
          onClick={onSignAsAdmin}
          disabled={view.isBusy || state.adminSigned}
          className={`flex h-11 w-full items-center justify-center gap-2 rounded-xl border text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500 ${
            state.adminSigned
              ? "cursor-default border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-stone-300 bg-white text-stone-800 hover:border-stone-400 hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-60"
          }`}
        >
          {isAdminBusy ? (
            spinner
          ) : state.adminSigned ? (
            check
          ) : (
            <ShieldCheckIcon className="size-4 text-stone-500" />
          )}
          {isAdminBusy ? "Signing…" : state.adminSigned ? "Document signed by admin" : "Sign as admin"}
        </button>
      </div>

      <div className="mt-6 border-t border-stone-200 pt-5">
        <button
          type="button"
          onClick={onDownload}
          disabled={!canDownload}
          aria-describedby={canDownload ? undefined : "download-hint"}
          className={`flex h-12 w-full items-center justify-center gap-2.5 rounded-xl text-sm font-semibold transition-[background-color,transform] duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 ${
            canDownload
              ? "bg-emerald-600 text-white shadow-[0_8px_20px_-8px_rgb(5_150_105/0.6)] hover:bg-emerald-700 active:scale-[0.98]"
              : "cursor-not-allowed bg-stone-100 text-stone-400"
          }`}
        >
          <DownloadIcon className="size-4" />
          Download signed PDF
        </button>
        {!canDownload && (
          <p id="download-hint" className="mt-2 text-center text-xs text-stone-500">
            Available once the document is signed.
          </p>
        )}
      </div>
    </section>
  );
}
