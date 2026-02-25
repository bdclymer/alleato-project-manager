"use client";

import { FieldDef } from "@/lib/types";

interface FormFieldProps {
  field: FieldDef;
  value: any;
  onChange: (key: string, value: any) => void;
}

export function FormField({ field, value, onChange }: FormFieldProps) {
  const baseClasses =
    "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange/40 focus:border-brand-orange";

  const val = value ?? field.defaultValue ?? "";

  if (field.type === "textarea") {
    return (
      <div className={field.span === 2 ? "col-span-2" : ""}>
        <label className="block text-xs font-medium text-gray-500 mb-1">
          {field.label}
          {field.required && <span className="text-red-400 ml-0.5">*</span>}
        </label>
        <textarea
          value={val}
          onChange={(e) => onChange(field.key, e.target.value)}
          placeholder={field.placeholder}
          rows={3}
          className={baseClasses + " resize-none"}
          required={field.required}
        />
      </div>
    );
  }

  if (field.type === "select") {
    return (
      <div className={field.span === 2 ? "col-span-2" : ""}>
        <label className="block text-xs font-medium text-gray-500 mb-1">
          {field.label}
          {field.required && <span className="text-red-400 ml-0.5">*</span>}
        </label>
        <select
          value={val}
          onChange={(e) => onChange(field.key, e.target.value)}
          className={baseClasses}
          required={field.required}
        >
          <option value="">Select...</option>
          {field.options?.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    );
  }

  if (field.type === "checkbox") {
    return (
      <div className={`flex items-center gap-2 ${field.span === 2 ? "col-span-2" : ""}`}>
        <input
          type="checkbox"
          checked={!!val}
          onChange={(e) => onChange(field.key, e.target.checked)}
          className="w-4 h-4 text-brand-orange border-gray-300 rounded focus:ring-brand-orange"
        />
        <label className="text-sm text-gray-600">{field.label}</label>
      </div>
    );
  }

  return (
    <div className={field.span === 2 ? "col-span-2" : ""}>
      <label className="block text-xs font-medium text-gray-500 mb-1">
        {field.label}
        {field.required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      <input
        type={field.type === "currency" ? "number" : field.type === "email" ? "email" : field.type === "number" ? "number" : field.type === "date" ? "date" : "text"}
        value={field.type === "date" && val ? val.substring(0, 10) : val}
        onChange={(e) => {
          const v = e.target.value;
          onChange(field.key, field.type === "number" || field.type === "currency" ? (v ? Number(v) : null) : v);
        }}
        placeholder={field.placeholder}
        step={field.type === "currency" ? "0.01" : field.type === "number" ? "any" : undefined}
        className={baseClasses}
        required={field.required}
      />
    </div>
  );
}
