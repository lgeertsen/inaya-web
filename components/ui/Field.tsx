import {
  InputHTMLAttributes,
  LabelHTMLAttributes,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

const fieldClass =
  "w-full rounded-xl border border-ink/15 bg-white px-4 py-3.5 text-ink placeholder:text-ink/40 focus:outline-none focus:border-accent";

const fieldClassDark =
  "w-full rounded-xl border border-white/18 bg-white/7 px-4 py-3.5 text-white placeholder:text-white/50 focus:outline-none focus:border-accent-light";

export function Input({
  dark,
  className = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { dark?: boolean }) {
  return <input className={`${dark ? fieldClassDark : fieldClass} ${className}`} {...props} />;
}

export function Textarea({
  dark,
  className = "",
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { dark?: boolean }) {
  return (
    <textarea className={`${dark ? fieldClassDark : fieldClass} resize-y ${className}`} {...props} />
  );
}

export function Select({
  dark,
  className = "",
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { dark?: boolean }) {
  return <select className={`${dark ? fieldClassDark : fieldClass} ${className}`} {...props} />;
}

export function Label({ className = "", ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={`text-[11.5px] uppercase tracking-[0.12em] text-ink/50 font-bold ${className}`}
      {...props}
    />
  );
}
