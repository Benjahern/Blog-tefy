import { useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react'

export const inputClass =
  'w-full rounded-[10px] border border-line bg-night/60 px-3.5 py-2.5 text-[15px] text-ink transition-colors duration-150 hover:border-[#36586a] focus:border-mist focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-1 aria-[invalid=true]:border-danger'

type FieldShell = { label: string; hint?: ReactNode; error?: string; required?: boolean; optional?: boolean; className?: string }

function Shell({ id, label, hint, error, required, optional, className = '', children }: FieldShell & { id: string; children: ReactNode }) {
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 flex items-baseline gap-2 text-sm font-medium text-ink">
        {label}
        {required && <span className="text-xs font-normal text-warm">obligatorio</span>}
        {optional && <span className="text-xs font-normal text-ink-3">opcional</span>}
      </label>
      {children}
      {hint && !error && <p id={`${id}-hint`} className="mt-1.5 text-[13px] text-ink-3">{hint}</p>}
      {error && <p id={`${id}-error`} className="mt-1.5 text-[13px] text-danger">{error}</p>}
    </div>
  )
}

const described = (id: string, hint?: ReactNode, error?: string) => (error ? `${id}-error` : hint ? `${id}-hint` : undefined)

export function TextField({ label, hint, error, required, optional, className, ...rest }: FieldShell & InputHTMLAttributes<HTMLInputElement>) {
  const id = useId()
  return (
    <Shell id={id} {...{ label, hint, error, required, optional, className }}>
      <input id={id} aria-invalid={!!error} aria-required={required} aria-describedby={described(id, hint, error)} className={inputClass} {...rest} />
    </Shell>
  )
}

export function TextArea({ label, hint, error, required, optional, className, ...rest }: FieldShell & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const id = useId()
  return (
    <Shell id={id} {...{ label, hint, error, required, optional, className }}>
      <textarea id={id} aria-invalid={!!error} aria-describedby={described(id, hint, error)} className={`${inputClass} min-h-28 resize-y leading-relaxed`} {...rest} />
    </Shell>
  )
}

export function SelectField({ label, hint, error, required, optional, className, children, ...rest }: FieldShell & SelectHTMLAttributes<HTMLSelectElement>) {
  const id = useId()
  return (
    <Shell id={id} {...{ label, hint, error, required, optional, className }}>
      <select id={id} aria-invalid={!!error} aria-describedby={described(id, hint, error)} className={`${inputClass} appearance-none bg-[url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='none' stroke='%2391B8C9' stroke-width='1.6'%3E%3Cpath d='m4 6 4 4 4-4'/%3E%3C/svg%3E")] bg-[position:right_12px_center] bg-no-repeat pr-10`} {...rest}>
        {children}
      </select>
    </Shell>
  )
}
