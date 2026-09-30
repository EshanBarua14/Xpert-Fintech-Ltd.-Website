import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

const control =
  "w-full rounded-control border bg-ink-950/60 px-3 text-sm text-text-primary placeholder:text-text-secondary/70 " +
  "transition-colors duration-(--duration-fast) focus:border-brand-sky focus:outline-none aria-[invalid=true]:border-market-down";

type FieldProps = {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: (describedBy: string | undefined) => ReactNode;
};

/** Label, control, hint and error wired together for screen readers. */
function Field({ id, label, hint, error, required, children }: FieldProps) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
        {required && (
          <span className="text-brand-sky" aria-hidden="true">
            {" "}
            *
          </span>
        )}
      </label>
      {children(describedBy)}
      {hint && (
        <p id={hintId} className="text-xs text-text-secondary">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-xs text-market-down" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

type Shared = { id: string; label: string; hint?: string; error?: string };

export function TextInput({ id, label, hint, error, required, className, ...props }: Shared & ComponentProps<"input">) {
  return (
    <Field id={id} label={label} hint={hint} error={error} required={required}>
      {(describedBy) => (
        <input
          id={id}
          name={props.name ?? id}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn(control, "h-11 border-white/15", className)}
          {...props}
        />
      )}
    </Field>
  );
}

export function TextArea({ id, label, hint, error, required, className, ...props }: Shared & ComponentProps<"textarea">) {
  return (
    <Field id={id} label={label} hint={hint} error={error} required={required}>
      {(describedBy) => (
        <textarea
          id={id}
          name={props.name ?? id}
          required={required}
          rows={props.rows ?? 5}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn(control, "border-white/15 py-2.5", className)}
          {...props}
        />
      )}
    </Field>
  );
}

export function Select({
  id,
  label,
  hint,
  error,
  required,
  options,
  placeholder,
  className,
  defaultValue,
  ...props
}: Shared & ComponentProps<"select"> & { options: { value: string; label: string }[]; placeholder?: string }) {
  // Controlled selects pass `value`; uncontrolled ones start on the placeholder.
  const initial = props.value === undefined ? { defaultValue: defaultValue ?? "" } : {};
  return (
    <Field id={id} label={label} hint={hint} error={error} required={required}>
      {(describedBy) => (
        <select
          id={id}
          name={props.name ?? id}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn(control, "h-11 border-white/15", className)}
          {...initial}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      )}
    </Field>
  );
}
