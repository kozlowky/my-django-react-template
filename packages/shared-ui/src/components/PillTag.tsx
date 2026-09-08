import type { ReactNode } from 'react'
import clsx from 'clsx'

interface PillTagProps {
  active?: boolean
  onClick?: () => void
  children: ReactNode
  className?: string
}

export function PillTag({ active = false, onClick, children, className }: PillTagProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        'whitespace-nowrap rounded-full border px-[18px] py-2 text-[13px] font-medium transition-colors',
        active ? 'border-terracotta bg-terracotta text-white' : 'border-border bg-cream text-charcoal',
        className,
      )}
    >
      {children}
    </button>
  )
}