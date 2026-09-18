import type {
  InputHTMLAttributes,
  LabelHTMLAttributes,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

/**
 * Admin-only form field styling — smaller padding/radius and a mono-uppercase
 * label, matching the redesign. Distinct from `components/ui/Field` (used by
 * the public site) so that component's styling is untouched.
 */
const fieldClass =
  "w-full rounded-[9px] border border-ink/14 bg-surface px-[11px] py-2.5 text-[13px] text-ink outline-none placeholder:text-ink/40 focus:border-accent";

export function AdminInput({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`${fieldClass} ${className}`} {...props} />;
}

export function AdminTextarea({ className = "", ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={`${fieldClass} resize-y ${className}`} {...props} />;
}

export function AdminSelect({ className = "", ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={`${fieldClass} ${className}`} {...props} />;
}

export function AdminLabel({ className = "", ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={`font-mono text-[9.5px] uppercase tracking-[0.14em] text-ink/55 ${className}`}
      {...props}
    />
  );
}
