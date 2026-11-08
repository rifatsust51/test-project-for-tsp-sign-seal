import { AlertIcon, ArrowRightIcon, CheckIcon, LockIcon } from "../../components/icons";
import SidebarShell, { BrandTile } from "../../components/SidebarShell";
import {
  ALL_FIELDS,
  PRIVACY_NOTE,
  SECTIONS,
  getSectionProgress,
  isFieldComplete,
  type FieldName,
  type ProfileData,
  type FormErrors,
  type SectionProgress,
} from "./profileForm";

interface FormSidebarProps {
  form: ProfileData;
  errors: FormErrors;
  activeSectionId: string;
  onJumpToField: (name: FieldName) => void;
}

function sectionStatusText({
  done,
  total,
  errorCount,
}: SectionProgress): string {
  if (errorCount > 0)
    return `${errorCount} ${errorCount === 1 ? "needs" : "need"} attention`;
  if (done === total) return "Complete";
  if (done === 0) return "Not started";
  return `${done} of ${total} done`;
}

function StepMarker({
  index,
  progress,
  isActive,
}: {
  index: string;
  progress: SectionProgress;
  isActive: boolean;
}) {
  const base =
    "relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors";
  if (progress.errorCount > 0) {
    return (
      <span
        className={`${base} bg-navy-950 text-rose-300 ring-1 ring-rose-400/70`}
      >
        <AlertIcon className="size-4" strokeWidth={2} />
      </span>
    );
  }
  if (progress.done === progress.total) {
    return (
      <span className={`${base} bg-sky-400 text-navy-950`}>
        <CheckIcon className="size-4" strokeWidth={2.75} />
      </span>
    );
  }
  return (
    <span
      className={`${base} bg-navy-950 ${
        isActive
          ? "text-sky-300 ring-2 ring-sky-400"
          : "text-slate-400 ring-1 ring-white/20"
      }`}
    >
      {index}
    </span>
  );
}

export default function FormSidebar({
  form,
  errors,
  activeSectionId,
  onJumpToField,
}: FormSidebarProps) {
  const total = ALL_FIELDS.length;
  const completed = ALL_FIELDS.filter(({ name }) =>
    isFieldComplete(form, name),
  ).length;
  const activeIndex = Math.max(
    0,
    SECTIONS.findIndex((s) => s.id === activeSectionId),
  );
  const activeSection = SECTIONS[activeIndex];

  return (
    <SidebarShell
      label="Form progress"
      compact={
        <>
          <div className="flex items-center gap-3">
            <BrandTile />
            <div className="min-w-0 flex-1 leading-tight">
              <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-400">
                Section {activeIndex + 1} of {SECTIONS.length}
              </p>
              <p className="truncate text-sm font-semibold text-white">
                {activeSection.title}
              </p>
            </div>
            <p className="text-right text-xs leading-tight text-slate-400">
              <span className="block text-sm font-semibold text-sky-300 tabular-nums">
                {completed}/{total}
              </span>
              fields
            </p>
          </div>
          <div
            role="progressbar"
            aria-label="Fields complete"
            aria-valuemin={0}
            aria-valuemax={total}
            aria-valuenow={completed}
            className="mt-3 h-1 overflow-hidden rounded-full bg-white/10"
          >
            <div
              className="h-full rounded-full bg-sky-400 transition-[width] duration-500 motion-reduce:transition-none"
              style={{ width: `${(completed / total) * 100}%` }}
            />
          </div>
        </>
      }
    >
      <h2 className="font-display mt-10 text-[2rem] leading-[1.1] font-semibold text-white motion-safe:animate-rise">
        Your profile,{" "}
        <span className="text-sky-300 italic">
          signed <span className="font-sans not-italic">&amp;</span> sealed.
        </span>
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-slate-400 motion-safe:animate-rise [animation-delay:60ms]">
        Fill in three short sections. You'll review the PDF before anything is
        signed.
      </p>

      {/* Section timeline */}
      <nav aria-label="Form sections" className="mt-10">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
          Sections
        </p>
        <ol className="relative">
          {SECTIONS.map((section, i) => {
            const progress = getSectionProgress(section, form, errors);
            const isActive = section.id === activeSectionId;
            const isDone = progress.done === progress.total;
            const isLast = i === SECTIONS.length - 1;
            const jumpTarget = (progress.remaining[0] ?? section.fields[0])
              .name;

            return (
              <li key={section.id} className="relative pb-2">
                {!isLast && (
                  <span
                    aria-hidden="true"
                    className={`absolute top-10 bottom-0 left-[1.75rem] w-px ${
                      isDone ? "bg-sky-400/50" : "bg-white/10"
                    }`}
                  />
                )}

                <div
                  className={`rounded-xl transition-colors ${
                    isActive ? "bg-navy-800/70 ring-1 ring-sky-300/15" : ""
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => onJumpToField(jumpTarget)}
                    aria-current={isActive ? "step" : undefined}
                    className="group flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors hover:bg-white/[0.04] focus-visible:outline-2 focus-visible:outline-sky-300"
                  >
                    <StepMarker
                      index={section.index}
                      progress={progress}
                      isActive={isActive}
                    />
                    <span className="min-w-0 flex-1">
                      <span
                        className={`block text-sm font-medium ${
                          isActive || isDone ? "text-white" : "text-slate-300"
                        }`}
                      >
                        {section.title}
                      </span>
                      <span
                        className={`block text-xs ${
                          progress.errorCount > 0
                            ? "text-rose-300"
                            : isDone
                              ? "text-sky-300"
                              : "text-slate-400"
                        }`}
                      >
                        {sectionStatusText(progress)}
                      </span>
                    </span>
                    <ArrowRightIcon className="size-4 text-slate-400 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100" />
                  </button>

                  {/* Remaining fields for the section in focus — one click to fill each */}
                  {isActive && progress.remaining.length > 0 && (
                    <div className="pr-3 pb-3 pl-14">
                      <p className="mb-2 text-[11px] text-slate-400">
                        Still needed:
                      </p>
                      <ul className="flex flex-wrap gap-1.5">
                        {progress.remaining.map((field) => (
                          <li key={field.name}>
                            <button
                              type="button"
                              onClick={() => onJumpToField(field.name)}
                              className={`rounded-full border px-2.5 py-1 text-xs transition-colors focus-visible:outline-2 focus-visible:outline-sky-300 ${
                                errors[field.name]
                                  ? "border-rose-400/50 bg-rose-500/10 text-rose-200 hover:bg-rose-500/20"
                                  : "border-white/15 text-slate-200 hover:border-sky-300/60 hover:text-white"
                              }`}
                            >
                              {field.label}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </nav>

      <p className="mt-auto flex items-start gap-2.5 pt-8 text-xs leading-relaxed text-slate-400">
        <LockIcon className="mt-px size-4 shrink-0 text-sky-300/80" />
        {PRIVACY_NOTE}
      </p>
    </SidebarShell>
  );
}
