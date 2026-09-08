import type { ButtonHTMLAttributes } from 'react'
import clsx from 'clsx'

export function Button({ className, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={clsx(
        'w-full rounded-full bg-terracotta px-8 py-4 text-[15px] font-semibold text-white transition-all',
        'hover:bg-terracotta-dark',
        'disabled:opacity-40 disabled:cursor-not-allowed',
        'active:scale-[0.98]',
        className,
      )}
      {...props}
    />
  )
}
