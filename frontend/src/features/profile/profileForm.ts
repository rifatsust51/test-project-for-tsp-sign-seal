import type { ComponentType, SVGProps } from "react";
import {
  BanknoteIcon,
  CalendarIcon,
  HeartHandIcon,
  IdCardIcon,
  MailIcon,
  PhoneIcon,
  UserIcon,
} from "../../components/icons";

/** Employee profile entered on the form; drives the preview, the PDF and signing. */
export interface ProfileData {
  fullName: string;
  email: string;
  phoneNumber: string;
  dob: string;
  nid: string;
  currentSalary: string;
  emergencyContactName: string;
  emergencyContactNumber: string;
}

export const PRIVACY_NOTE =
  "Your data is used only to generate this document and is not stored anywhere.";

export type FieldName = keyof ProfileData;
export type FormErrors = Partial<Record<FieldName, string>>;

export const EMPTY_FORM: ProfileData = {
  fullName: "",
  email: "",
  phoneNumber: "",
  dob: "",
  nid: "",
  currentSalary: "",
  emergencyContactName: "",
  emergencyContactNumber: "",
};

// ── Field + section configuration ──────────────────────────────────────────

export interface FieldConfig {
  name: FieldName;
  label: string;
  type?: "text" | "email" | "tel" | "date";
  placeholder?: string;
  hint?: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  autoComplete?: string;
  inputMode?: "text" | "email" | "tel" | "numeric" | "decimal";
  suffix?: string;
  fullWidth?: boolean;
}

export interface SectionConfig {
  id: string;
  index: string;
  title: string;
  description: string;
  fields: FieldConfig[];
}

export const SECTIONS: SectionConfig[] = [
  {
    id: "personal",
    index: "01",
    title: "Personal information",
    description: "Enter these exactly as they appear on your national ID.",
    fields: [
      {
        name: "fullName",
        label: "Full name",
        placeholder: "e.g. Jonathan A. Rahman",
        icon: UserIcon,
        autoComplete: "name",
        fullWidth: true,
      },
      {
        name: "email",
        label: "Email address",
        type: "email",
        placeholder: "you@company.com",
        icon: MailIcon,
        autoComplete: "email",
        inputMode: "email",
      },
      {
        name: "phoneNumber",
        label: "Phone number",
        type: "tel",
        placeholder: "+880 1X XX XXX XXX",
        icon: PhoneIcon,
        autoComplete: "tel",
        inputMode: "tel",
      },
      {
        name: "dob",
        label: "Date of birth",
        type: "date",
        icon: CalendarIcon,
        autoComplete: "bday",
      },
      {
        name: "nid",
        label: "National ID (NID)",
        placeholder: "e.g. 19901234567890",
        icon: IdCardIcon,
        inputMode: "numeric",
        autoComplete: "off",
      },
    ],
  },
  {
    id: "employment",
    index: "02",
    title: "Employment details",
    description: "Your gross monthly salary, as it should appear on the document.",
    fields: [
      {
        name: "currentSalary",
        label: "Current salary",
        placeholder: "e.g. 75,000",
        icon: BanknoteIcon,
        inputMode: "decimal",
        autoComplete: "off",
        suffix: "BDT",
        fullWidth: true,
      },
    ],
  },
  {
    id: "emergency",
    index: "03",
    title: "Emergency contact",
    description: "Someone we can reach on your behalf if needed.",
    fields: [
      {
        name: "emergencyContactName",
        label: "Contact full name",
        placeholder: "e.g. Fatima Rahman",
        icon: HeartHandIcon,
        autoComplete: "off",
      },
      {
        name: "emergencyContactNumber",
        label: "Contact phone number",
        type: "tel",
        placeholder: "+880 1X XX XXX XXX",
        icon: PhoneIcon,
        autoComplete: "off",
        inputMode: "tel",
      },
    ],
  },
];

export const ALL_FIELDS = SECTIONS.flatMap((section) => section.fields);

export const sectionIdOfField = (name: string): string | undefined =>
  SECTIONS.find((section) => section.fields.some((f) => f.name === name))?.id;

// ── Validation ─────────────────────────────────────────────────────────────

/** Local calendar date as YYYY-MM-DD (the format <input type="date"> uses). */
export const todayIso = () => new Date().toLocaleDateString("en-CA");

export function validateField(name: FieldName, value: string): string | undefined {
  const trimmed = value.trim();
  switch (name) {
    case "fullName":
      return trimmed ? undefined : "Full name is required";
    case "email":
      return /\S+@\S+\.\S+/.test(trimmed) ? undefined : "Valid email is required";
    case "phoneNumber":
      return trimmed ? undefined : "Phone number is required";
    case "dob":
      if (!value) return "Date of birth is required";
      return value > todayIso() ? "Date of birth can't be in the future" : undefined;
    case "nid":
      return trimmed ? undefined : "NID is required";
    case "currentSalary":
      return trimmed ? undefined : "Current salary is required";
    case "emergencyContactName":
      return trimmed ? undefined : "Emergency contact name is required";
    case "emergencyContactNumber":
      return trimmed ? undefined : "Emergency contact number is required";
  }
}

export function validateAll(form: ProfileData): FormErrors {
  const errors: FormErrors = {};
  for (const { name } of ALL_FIELDS) {
    const message = validateField(name, form[name]);
    if (message) errors[name] = message;
  }
  return errors;
}

export const isFieldComplete = (form: ProfileData, name: FieldName) =>
  validateField(name, form[name]) === undefined;

export interface SectionProgress {
  done: number;
  total: number;
  /** Fields with a visible validation error. */
  errorCount: number;
  /** Fields not yet valid, in form order. */
  remaining: FieldConfig[];
}

export function getSectionProgress(
  section: SectionConfig,
  form: ProfileData,
  errors: FormErrors,
): SectionProgress {
  const remaining = section.fields.filter(({ name }) => !isFieldComplete(form, name));
  return {
    done: section.fields.length - remaining.length,
    total: section.fields.length,
    errorCount: section.fields.filter(({ name }) => errors[name]).length,
    remaining,
  };
}
