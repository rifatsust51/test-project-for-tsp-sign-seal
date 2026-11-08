import { useState, type ChangeEvent, type FocusEvent, type FormEvent } from "react";
import FlowStepper from "../../components/FlowStepper";
import { AlertIcon, ArrowRightIcon, LockIcon } from "../../components/icons";
import FormField from "./FormField";
import FormSidebar from "./FormSidebar";
import {
  ALL_FIELDS,
  EMPTY_FORM,
  PRIVACY_NOTE,
  SECTIONS,
  isFieldComplete,
  validateAll,
  validateField,
  type FieldName,
  type FormErrors,
  type ProfileData,
} from "./profileForm";
import { useActiveSection } from "./useActiveSection";

interface ProfileFormPageProps {
  onSubmit: (profile: ProfileData) => void;
  /** Previously submitted values, so returning from the preview keeps input. */
  initialData?: ProfileData | null;
}

const prefersReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Focus a field and bring it to the middle of the viewport (clear of the sticky mobile bar). */
function focusField(name: FieldName) {
  const input = document.getElementById(name);
  if (!input) return;
  input.focus({ preventScroll: true });
  input.scrollIntoView({ block: "center", behavior: prefersReducedMotion() ? "auto" : "smooth" });
}

export default function ProfileFormPage({ onSubmit, initialData }: ProfileFormPageProps) {
  const [form, setForm] = useState<ProfileData>(() => ({ ...EMPTY_FORM, ...initialData }));
  const [errors, setErrors] = useState<FormErrors>({});
  const { activeSectionId, onFormFocus } = useActiveSection();

  const completedCount = ALL_FIELDS.filter(({ name }) => isFieldComplete(form, name)).length;
  const errorCount = Object.values(errors).filter(Boolean).length;

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const name = event.target.name as FieldName;
    const { value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    // Once a field has been flagged, re-check it live so the error clears the moment it's fixed.
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: validateField(name, value) }));
    }
  };

  const handleBlur = (event: FocusEvent<HTMLInputElement>) => {
    const name = event.target.name as FieldName;
    // Only flag fields the user actually typed in; empty fields are reported on submit.
    if (!event.target.value) return;
    setErrors((prev) => ({ ...prev, [name]: validateField(name, event.target.value) }));
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const nextErrors = validateAll(form);
    setErrors(nextErrors);

    const firstInvalid = ALL_FIELDS.find(({ name }) => nextErrors[name]);
    if (firstInvalid) {
      focusField(firstInvalid.name);
      return;
    }
    onSubmit(form);
  };

  return (
    <div className="min-h-screen bg-stone-100 font-sans text-stone-900 antialiased lg:grid lg:grid-cols-[minmax(340px,400px)_1fr]">
      <FormSidebar
        form={form}
        errors={errors}
        activeSectionId={activeSectionId}
        onJumpToField={focusField}
      />

      <main className="px-4 py-8 sm:px-8 lg:px-14 lg:py-12">
        <div className="mx-auto max-w-2xl">
          <FlowStepper current={0} />

          <header className="mt-8 motion-safe:animate-rise">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-700">
              Document generator
            </p>
            <h1 className="font-display mt-2 text-3xl font-semibold text-stone-950 sm:text-4xl">
              Employee profile
            </h1>
            <p className="mt-2 text-[15px] text-stone-600">
              All fields are required. You'll be able to review everything before signing.
            </p>
          </header>

          {errorCount > 0 && (
            <div
              role="status"
              className="mt-6 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              <AlertIcon className="size-5 shrink-0" />
              {errorCount === 1
                ? "1 field needs your attention."
                : `${errorCount} fields need your attention.`}
            </div>
          )}

          <form onSubmit={handleSubmit} onFocus={onFormFocus} noValidate className="mt-8 space-y-6">
            {SECTIONS.map((section, sectionIndex) => (
              <section
                key={section.id}
                id={section.id}
                aria-labelledby={`${section.id}-title`}
                style={{ animationDelay: `${120 + sectionIndex * 80}ms` }}
                className="scroll-mt-24 rounded-2xl border border-stone-200/80 bg-white p-5 shadow-[0_1px_2px_rgb(0_0_0/0.04),0_8px_24px_-12px_rgb(28_25_23/0.12)] motion-safe:animate-rise sm:p-7"
              >
                <div className="mb-6 flex items-start gap-4">
                  <span className="font-display text-2xl leading-none font-semibold text-amber-600 tabular-nums">
                    {section.index}
                  </span>
                  <div className="border-l border-stone-200 pl-4">
                    <h2 id={`${section.id}-title`} className="text-base font-semibold text-stone-900">
                      {section.title}
                    </h2>
                    <p className="mt-0.5 text-sm text-stone-500">{section.description}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-x-5 gap-y-5 sm:grid-cols-2">
                  {section.fields.map((field) => (
                    <FormField
                      key={field.name}
                      config={field}
                      value={form[field.name]}
                      error={errors[field.name]}
                      showValid={form[field.name] !== "" && isFieldComplete(form, field.name)}
                      onChange={handleChange}
                      onBlur={handleBlur}
                    />
                  ))}
                </div>
              </section>
            ))}

            <div className="flex flex-col-reverse items-stretch gap-4 pt-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="flex items-center justify-center gap-2 text-xs text-stone-500 lg:hidden">
                <LockIcon className="size-4 shrink-0" />
                {PRIVACY_NOTE}
              </p>
              <p className="hidden text-sm text-stone-500 tabular-nums lg:block">
                {completedCount} of {ALL_FIELDS.length} fields complete
              </p>
              <button
                type="submit"
                className="group inline-flex h-12 items-center justify-center gap-2.5 rounded-xl bg-stone-950 px-7 text-sm font-semibold text-white shadow-[0_8px_20px_-8px_rgb(28_25_23/0.6)] transition-[background-color,transform,box-shadow] duration-150 hover:bg-stone-800 hover:shadow-[0_12px_24px_-10px_rgb(28_25_23/0.7)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500 active:scale-[0.98]"
              >
                Generate PDF preview
                <ArrowRightIcon className="size-4 text-amber-300 transition-transform duration-150 group-hover:translate-x-0.5" />
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
