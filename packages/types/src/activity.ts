export type ActivityKind = 'like' | 'follow' | 'comment' | 'tag' | 'save'

export interface ActivityEvent {
  id: string
  kind: ActivityKind
  actor: { id: string; username: string; avatarUrl: string }
  targetThumbUrl?: string
  message: string
  timeAgo: string
  isFollowBack?: boolean
}