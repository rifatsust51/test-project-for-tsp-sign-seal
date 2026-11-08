import type { ChangeEvent, FocusEvent } from "react";
import { AlertIcon, CheckIcon } from "../../components/icons";
import { todayIso, type FieldConfig } from "./profileForm";

interface FormFieldProps {
  config: FieldConfig;
  value: string;
  error?: string;
  /** Show the green tick (field is filled in and valid). */
  showValid: boolean;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onBlur: (event: FocusEvent<HTMLInputElement>) => void;
}

/** Labelled text input with leading icon, optional suffix, and inline validation. */
export default function FormField({
  config,
  value,
  error,
  showValid,
  onChange,
  onBlur,
}: FormFieldProps) {
  const { name, label, type = "text", placeholder, hint, suffix, icon: Icon } = config;
  const errorId = `${name}-error`;
  const hintId = `${name}-hint`;
  const describedBy = [error && errorId, hint && hintId].filter(Boolean).join(" ");

  const stateClasses = error
    ? "border-red-400 bg-red-50/40 focus-within:border-red-500 focus-within:ring-red-500/15"
    : "border-stone-300 bg-white hover:border-stone-400 focus-within:border-amber-500 focus-within:ring-amber-500/20";

  return (
    <div className={config.fullWidth ? "sm:col-span-2" : undefined}>
      <label htmlFor={name} className="mb-1.5 block text-sm font-medium text-stone-700">
        {label}
      </label>

      <div
        className={`group relative flex h-12 items-center rounded-xl border shadow-[0_1px_0_rgb(0_0_0/0.03)] ring-4 ring-transparent transition-[border-color,box-shadow,background-color] duration-150 ${stateClasses}`}
      >
        <Icon
          className={`ml-3.5 size-[18px] shrink-0 transition-colors ${
            error ? "text-red-500" : "text-stone-400 group-focus-within:text-amber-600"
          }`}
        />
        <input
          id={name}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          autoComplete={config.autoComplete}
          inputMode={config.inputMode}
          max={type === "date" ? todayIso() : undefined}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy || undefined}
          className="h-full min-w-0 flex-1 bg-transparent px-3 text-[15px] text-stone-900 tabular-nums placeholder:text-stone-400 focus:outline-none"
        />
        {suffix && (
          <span className="mr-2 rounded-md bg-stone-100 px-2 py-1 text-xs font-semibold tracking-wider text-stone-500">
            {suffix}
          </span>
        )}
        <span className="mr-3.5 flex size-5 shrink-0 items-center justify-center">
          {error ? (
            <AlertIcon className="size-[18px] text-red-500" />
          ) : showValid ? (
            <span className="flex size-5 items-center justify-center rounded-full bg-emerald-500 text-white">
              <CheckIcon className="size-3.5" strokeWidth={2.5} />
            </span>
          ) : null}
        </span>
      </div>

      {error ? (
        <p id={errorId} className="mt-1.5 text-[13px] text-red-600">
          {error}
        </p>
      ) : (
        hint && (
          <p id={hintId} className="mt-1.5 text-[13px] text-stone-500">
            {hint}
          </p>
        )
      )}
    </div>
  );
}
