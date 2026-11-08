import type { UserProfile } from "../../auth/aasClient";
import {
  ArrowLeftIcon,
  CheckIcon,
  LockIcon,
  LogOutIcon,
  UserShieldIcon,
} from "../../components/icons";
import SidebarShell, { BrandTile } from "../../components/SidebarShell";
import { PRIVACY_NOTE } from "../profile/profileForm";
import { initialsOf } from "../profile/profileFormat";
import type { SigningView, StepState } from "./signingStatus";

interface PreviewSidebarProps {
  profileName: string;
  user: UserProfile | null;
  view: SigningView;
  onBack: () => void;
  onLogout: () => void;
}

interface ProgressStep {
  title: string;
  detail: string;
  state: StepState;
}

const SECTION_LABEL = "text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400";

function SidebarStep({ index, step, isLast }: { index: number; step: ProgressStep; isLast: boolean }) {
  const { title, detail, state } = step;
  return (
    <li className="relative flex gap-3 pb-6 last:pb-0">
      {!isLast && (
        <span
          aria-hidden="true"
          className={`absolute top-9 bottom-1 left-4 w-px ${state === "done" ? "bg-sky-400/50" : "bg-white/10"}`}
        />
      )}
      <span
        className={`relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
          state === "done"
            ? "bg-sky-400 text-navy-950"
            : state === "active"
              ? "bg-navy-950 text-sky-300 ring-2 ring-sky-400"
              : "bg-navy-950 text-slate-400 ring-1 ring-white/20"
        }`}
      >
        {state === "done" ? <CheckIcon className="size-4" strokeWidth={2.75} /> : index}
      </span>
      <div className="min-w-0 pt-1">
        <p className={`text-sm font-medium ${state === "pending" ? "text-slate-300" : "text-white"}`}>
          {title}
          <span className="sr-only">
            {state === "done" ? " (done)" : state === "active" ? " (in progress)" : ""}
          </span>
        </p>
        <p className={`mt-0.5 truncate text-xs ${state === "done" ? "text-sky-300" : "text-slate-400"}`}>
          {detail}
        </p>
      </div>
    </li>
  );
}

function StatusPill({ isSigned, isAuthenticated }: { isSigned: boolean; isAuthenticated: boolean }) {
  if (isSigned) {
    return (
      <span className="rounded-full bg-sky-400/15 px-2.5 py-1 text-[11px] font-semibold text-sky-300 ring-1 ring-sky-400/30">
        Signed
      </span>
    );
  }
  if (isAuthenticated) {
    return (
      <span className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-semibold text-white ring-1 ring-white/15">
        Signed in
      </span>
    );
  }
  return (
    <span className="rounded-full bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-slate-300 ring-1 ring-white/10">
      Guest
    </span>
  );
}

/** Navy sidebar for the preview page: account, signing progress, and navigation. */
export default function PreviewSidebar({ profileName, user, view, onBack, onLogout }: PreviewSidebarProps) {
  const steps: ProgressStep[] = [
    { title: "Details entered", detail: profileName || "Profile complete", state: "done" },
    {
      title: "Identity confirmed",
      detail: user ? user.email : "Log in when you sign",
      state: view.identityStepState,
    },
    { title: "Signed & verified", detail: view.signStepDetail, state: view.signStepState },
  ];

  return (
    <SidebarShell
      label="Signing progress"
      compact={
        <div className="flex items-center gap-3">
          <BrandTile />
          <div className="min-w-0 flex-1 leading-tight">
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-400">
              Step {view.isSigned ? 3 : 2} of 3
            </p>
            <p className="truncate text-sm font-semibold text-white">
              {view.isSigned ? "Signed & sealed" : "Review & sign"}
            </p>
          </div>
          <StatusPill isSigned={view.isSigned} isAuthenticated={user !== null} />
          {user && (
            <button
              type="button"
              onClick={onLogout}
              aria-label="Log out"
              className="flex size-8 items-center justify-center rounded-lg text-slate-300 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-sky-300"
            >
              <LogOutIcon className="size-[18px]" />
            </button>
          )}
        </div>
      }
    >
      <h2 className="font-display mt-10 text-[2rem] leading-[1.1] font-semibold text-white motion-safe:animate-rise">
        Review, then{" "}
        <span className="text-sky-300 italic">
          sign <span className="font-sans not-italic">&amp;</span> seal.
        </span>
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-slate-400 motion-safe:animate-rise [animation-delay:60ms]">
        Check the document carefully. Signing applies a qualified digital signature you can
        download and share.
      </p>

      <section aria-labelledby="account-title" className="mt-8">
        <p id="account-title" className={`mb-3 ${SECTION_LABEL}`}>
          Signing as
        </p>
        {user ? (
          <div className="flex items-center gap-3 rounded-xl bg-navy-800/70 p-3 ring-1 ring-sky-300/15">
            <span
              aria-hidden="true"
              className="flex size-10 shrink-0 items-center justify-center rounded-full bg-sky-400 text-sm font-semibold text-navy-950"
            >
              {initialsOf(user.name)}
            </span>
            <div className="min-w-0 flex-1 leading-tight">
              <p className="truncate text-sm font-semibold text-white">{user.name}</p>
              <p className="truncate text-xs text-slate-400" title={user.email}>
                {user.email}
              </p>
            </div>
            <button
              type="button"
              onClick={onLogout}
              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-sky-300"
            >
              <LogOutIcon className="size-4" />
              Log out
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3 rounded-xl border border-dashed border-white/15 p-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white/5 text-slate-300 ring-1 ring-white/15">
              <UserShieldIcon className="size-5" />
            </span>
            <div className="leading-tight">
              <p className="text-sm font-semibold text-white">Not logged in</p>
              <p className="text-xs text-slate-400">You'll log in securely when you sign.</p>
            </div>
          </div>
        )}
      </section>

      <section aria-labelledby="progress-title" className="mt-8">
        <p id="progress-title" className={`mb-4 ${SECTION_LABEL}`}>
          Progress
        </p>
        <ol className="px-1">
          {steps.map((step, i) => (
            <SidebarStep key={step.title} index={i + 1} step={step} isLast={i === steps.length - 1} />
          ))}
        </ol>
      </section>

      <div className="mt-auto pt-8">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 rounded-lg px-1 py-1 text-sm font-medium text-slate-300 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-sky-300"
        >
          <ArrowLeftIcon className="size-4" />
          Back to form
        </button>
        <p className="mt-4 flex items-start gap-2.5 text-xs leading-relaxed text-slate-400">
          <LockIcon className="mt-px size-4 shrink-0 text-sky-300/80" />
          {PRIVACY_NOTE}
        </p>
      </div>
    </SidebarShell>
  );
}
