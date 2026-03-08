import { useState } from "react";

export interface FormData {
  fullName: string;
  email: string;
  phoneNumber: string;
  dob: string;
  nid: string;
  currentSalary: string;
  emergencyContactName: string;
  emergencyContactNumber: string;
}

interface PDFGeneratorProps {
  onSubmit: (data: FormData) => void;
}

const inputClass =
  "w-full bg-stone-50 border border-stone-200 rounded-lg px-4 py-2.5 text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all duration-200";

const labelClass =
  "block text-xs font-semibold uppercase tracking-widest text-stone-500 mb-1.5";

// ── Field declared OUTSIDE PDFGenerator to avoid re-creation on each render ──
interface FieldProps {
  label: string;
  name: keyof FormData;
  type?: string;
  placeholder?: string;
  value: string;
  error?: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

function Field({
  label,
  name,
  type = "text",
  placeholder,
  value,
  error,
  onChange,
}: FieldProps) {
  return (
    <div>
      <label className={labelClass}>{label}</label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`${inputClass} ${error ? "border-red-400 ring-1 ring-red-300" : ""}`}
      />
      {error && (
        <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
          <span>⚠</span> {error}
        </p>
      )}
    </div>
  );
}

export default function PDFGenerator({ onSubmit }: PDFGeneratorProps) {
  const [form, setForm] = useState<FormData>({
    fullName: "",
    email: "",
    phoneNumber: "",
    dob: "",
    nid: "",
    currentSalary: "",
    emergencyContactName: "",
    emergencyContactNumber: "",
  });

  const [errors, setErrors] = useState<Partial<FormData>>({});

  const validate = (): boolean => {
    const newErrors: Partial<FormData> = {};
    if (!form.fullName.trim()) newErrors.fullName = "Full name is required";
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email))
      newErrors.email = "Valid email is required";
    if (!form.phoneNumber.trim())
      newErrors.phoneNumber = "Phone number is required";
    if (!form.dob) newErrors.dob = "Date of birth is required";
    if (!form.nid.trim()) newErrors.nid = "NID is required";
    if (!form.currentSalary.trim())
      newErrors.currentSalary = "Current salary is required";
    if (!form.emergencyContactName.trim())
      newErrors.emergencyContactName = "Emergency contact name is required";
    if (!form.emergencyContactNumber.trim())
      newErrors.emergencyContactNumber = "Emergency contact number is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) onSubmit(form);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-100 via-amber-50 to-stone-100 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-700 text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-4">
            <span>📄</span> Document Generator
          </div>
          <h1
            className="text-4xl font-black text-stone-800 tracking-tight"
            style={{ fontFamily: "'Georgia', serif" }}
          >
            Employee Profile
          </h1>
          <p className="text-stone-500 text-sm mt-2">
            Fill in the details below to generate your official PDF document
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-xl shadow-stone-200/60 border border-stone-100 overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-amber-400 via-amber-300 to-orange-400" />

          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            {/* Personal Info */}
            <div>
              <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-amber-600 mb-4 flex items-center gap-2">
                <span className="w-5 h-px bg-amber-400 inline-block" />
                Personal Information
                <span className="flex-1 h-px bg-stone-100 inline-block" />
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Field
                    label="Full Name"
                    name="fullName"
                    placeholder="e.g. Jonathan A. Rahman"
                    value={form.fullName}
                    error={errors.fullName}
                    onChange={handleChange}
                  />
                </div>
                <Field
                  label="Email Address"
                  name="email"
                  type="email"
                  placeholder="you@company.com"
                  value={form.email}
                  error={errors.email}
                  onChange={handleChange}
                />
                <Field
                  label="Phone Number"
                  name="phoneNumber"
                  placeholder="+880 1X XX XXX XXX"
                  value={form.phoneNumber}
                  error={errors.phoneNumber}
                  onChange={handleChange}
                />
                <Field
                  label="Date of Birth"
                  name="dob"
                  type="date"
                  value={form.dob}
                  error={errors.dob}
                  onChange={handleChange}
                />
                <Field
                  label="National ID (NID)"
                  name="nid"
                  placeholder="e.g. 19901234567890"
                  value={form.nid}
                  error={errors.nid}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="border-t border-dashed border-stone-200" />

            {/* Employment */}
            <div>
              <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-amber-600 mb-4 flex items-center gap-2">
                <span className="w-5 h-px bg-amber-400 inline-block" />
                Employment Details
                <span className="flex-1 h-px bg-stone-100 inline-block" />
              </h2>
              <Field
                label="Current Salary (BDT)"
                name="currentSalary"
                placeholder="e.g. 75,000"
                value={form.currentSalary}
                error={errors.currentSalary}
                onChange={handleChange}
              />
            </div>

            <div className="border-t border-dashed border-stone-200" />

            {/* Emergency Contact */}
            <div>
              <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-amber-600 mb-4 flex items-center gap-2">
                <span className="w-5 h-px bg-amber-400 inline-block" />
                Emergency Contact
                <span className="flex-1 h-px bg-stone-100 inline-block" />
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field
                  label="Contact Full Name"
                  name="emergencyContactName"
                  placeholder="e.g. Fatima Rahman"
                  value={form.emergencyContactName}
                  error={errors.emergencyContactName}
                  onChange={handleChange}
                />
                <Field
                  label="Contact Phone Number"
                  name="emergencyContactNumber"
                  placeholder="+880 1X XX XXX XXX"
                  value={form.emergencyContactNumber}
                  error={errors.emergencyContactNumber}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="w-full mt-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-sm uppercase tracking-widest py-3.5 rounded-xl transition-all duration-200 shadow-md shadow-amber-200 hover:shadow-lg hover:shadow-amber-300 active:scale-[0.99] flex items-center justify-center gap-2"
            >
              <span>Generate PDF Preview</span>
              <span className="text-base">→</span>
            </button>
          </form>
        </div>

        <p className="text-center text-stone-400 text-xs mt-5">
          Your data is used only to generate this document and is not stored
          anywhere.
        </p>
      </div>
    </div>
  );
}
