import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { Link, type LinkProps } from 'react-router'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'quiet'
type Size = 'sm' | 'md' | 'lg'

export function buttonClass(variant: Variant = 'primary', size: Size = 'md', extra = '') {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-[11px] font-medium whitespace-nowrap transition-[background-color,color,border-color,transform,box-shadow] duration-200 ease-out disabled:opacity-50 disabled:pointer-events-none select-none'
  const sizes: Record<Size, string> = {
    sm: 'h-9 px-3.5 text-sm',
    md: 'h-11 px-5 text-[15px]',
    lg: 'h-13 px-7 text-base',
  }
  const variants: Record<Variant, string> = {
    primary: 'bg-mist text-night hover:bg-[#a9cad8] shadow-[0_8px_24px_-12px_rgba(145,184,201,0.6)] active:translate-y-px',
    secondary: 'border border-line bg-night/40 text-ink hover:bg-surface-hover hover:border-[#3a5c6b] backdrop-blur-sm',
    ghost: 'text-ink-2 hover:text-ink hover:bg-surface-hover',
    quiet: 'text-mist hover:text-ink underline-offset-4 hover:underline px-0 h-auto',
    danger: 'border border-danger/40 text-danger hover:bg-danger/10',
  }
  return `${base} ${sizes[size]} ${variants[variant]} ${extra}`
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button({ variant, size, className = '', type = 'button', ...rest }, ref) {
  return <button ref={ref} type={type} className={buttonClass(variant, size, className)} {...rest} />
})

export function ButtonLink({ variant, size, className = '', ...rest }: LinkProps & { variant?: Variant; size?: Size }) {
  return <Link className={buttonClass(variant, size, className)} {...rest} />
}

export function IconButton({ label, className = '', ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={`inline-flex h-10 w-10 items-center justify-center rounded-[10px] text-ink-2 transition-colors duration-200 hover:bg-surface-hover hover:text-ink disabled:opacity-40 disabled:pointer-events-none ${className}`}
      {...rest}
    />
  )
}
