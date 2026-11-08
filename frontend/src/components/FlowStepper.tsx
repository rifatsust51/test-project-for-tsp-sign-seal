import { CheckIcon } from "./icons";

const FLOW_STEPS = ["Details", "Preview", "Sign & seal"] as const;

interface FlowStepperProps {
  /** Zero-based index of the step the user is on. */
  current: number;
  /** Marks the current step as finished too (e.g. once the document is signed). */
  currentDone?: boolean;
}

/** The Details → Preview → Sign stepper shared by the form and preview pages. */
export default function FlowStepper({ current, currentDone = false }: FlowStepperProps) {
  return (
    <ol className="flex items-center gap-2 text-xs font-medium sm:gap-3" aria-label="Progress">
      {FLOW_STEPS.map((step, i) => {
        const isCurrent = i === current;
        const isDone = i < current || (isCurrent && currentDone);
        return (
          <li key={step} className="flex items-center gap-2 sm:gap-3">
            <span
              aria-current={isCurrent ? "step" : undefined}
              className={`flex items-center gap-2 ${
                isCurrent ? "text-stone-900" : isDone ? "text-stone-600" : "text-stone-400"
              }`}
            >
              <span
                className={`flex size-6 items-center justify-center rounded-full text-[11px] font-semibold ${
                  isDone
                    ? "bg-amber-500 text-white"
                    : isCurrent
                      ? "bg-stone-900 text-amber-300"
                      : "border border-stone-300 text-stone-400"
                }`}
              >
                {isDone ? <CheckIcon className="size-3.5" strokeWidth={2.75} /> : i + 1}
              </span>
              <span className={isCurrent ? "" : "hidden sm:inline"}>
                {step}
                {isDone && <span className="sr-only"> (completed)</span>}
              </span>
            </span>
            {i < FLOW_STEPS.length - 1 && (
              <span
                className={`h-px w-5 sm:w-8 ${i < current ? "bg-amber-400" : "bg-stone-300"}`}
                aria-hidden="true"
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
