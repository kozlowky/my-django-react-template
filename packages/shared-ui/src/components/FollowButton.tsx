import { useState } from 'react'
import clsx from 'clsx'

interface FollowButtonProps {
  initialFollowing?: boolean
  onChange?: (following: boolean) => void
}

export function FollowButton({ initialFollowing = false, onChange }: FollowButtonProps) {
  const [following, setFollowing] = useState(initialFollowing)

  function toggle() {
    const next = !following
    setFollowing(next)
    onChange?.(next)
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className={clsx(
        'flex-shrink-0 rounded-full px-5 py-2 text-[13px] font-semibold transition-colors',
        following ? 'border border-border bg-transparent text-charcoal' : 'bg-terracotta text-white hover:bg-terracotta-dark',
      )}
    >
      {following ? 'Вы подписаны' : 'Подписаться'}
    </button>
  )
}