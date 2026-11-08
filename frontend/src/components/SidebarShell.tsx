import type { ReactNode } from "react";
import { ShieldCheckIcon } from "./icons";

interface SidebarShellProps {
  label: string;
  /** Compact bar shown below the lg breakpoint (sticks to the top of the page). */
  compact: ReactNode;
  /** Full panel shown from lg up; scrolls on short screens instead of clipping. */
  children: ReactNode;
}

/** Navy sidebar frame shared by the form and preview pages. */
export default function SidebarShell({ label, compact, children }: SidebarShellProps) {
  return (
    <aside
      aria-label={label}
      className="sticky top-0 z-20 overflow-hidden bg-gradient-to-b from-navy-900 to-navy-950 text-slate-300 shadow-lg shadow-navy-950/25 print:hidden lg:h-screen lg:shadow-none"
    >
      <div className="grain pointer-events-none absolute inset-0 opacity-[0.06] mix-blend-overlay" aria-hidden="true" />
      <div
        className="pointer-events-none absolute -top-40 -right-32 size-[28rem] rounded-full bg-sky-500/15 blur-3xl"
        aria-hidden="true"
      />

      <div className="relative px-4 py-3 sm:px-8 lg:hidden">{compact}</div>

      <div className="relative hidden h-full flex-col overflow-y-auto px-8 py-9 [scrollbar-color:rgb(255_255_255/0.15)_transparent] [scrollbar-width:thin] lg:flex xl:px-10">
        <BrandMark />
        {children}
      </div>
    </aside>
  );
}

export function BrandMark() {
  return (
    <div className="flex items-center gap-3">
      <span className="flex size-9 items-center justify-center rounded-lg bg-sky-400 text-navy-950">
        <ShieldCheckIcon className="size-5" strokeWidth={2} />
      </span>
      <div className="leading-tight">
        <p className="text-sm font-semibold tracking-wide text-white">RVL · TSP</p>
        <p className="text-xs text-slate-400">Sign & seal service</p>
      </div>
    </div>
  );
}

/** Small brand tile used at the start of the compact (mobile) bar. */
export function BrandTile() {
  return (
    <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-sky-400 text-navy-950">
      <ShieldCheckIcon className="size-[18px]" strokeWidth={2} />
    </span>
  );
}
