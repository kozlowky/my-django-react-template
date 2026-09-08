import type { ActivityEvent } from '@selte/design-types'

const thumb1 = 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop'
const thumb2 = 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=100&h=100&fit=crop'

export const activity: ActivityEvent[] = [
  { id: '1', kind: 'like', actor: { id: 'u2', username: 'Анна', avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop' }, targetThumbUrl: thumb1, message: 'понравилась ваша фотография', timeAgo: '2 часа назад' },
  { id: '2', kind: 'follow', actor: { id: 'u3', username: 'Михаил', avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop' }, message: 'подписался на вас', timeAgo: '5 часов назад' },
  { id: '3', kind: 'comment', actor: { id: 'u4', username: 'Елена', avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop' }, targetThumbUrl: thumb1, message: 'прокомментировала: «Прекрасный свет!»', timeAgo: '8 часов назад' },
  { id: '4', kind: 'tag', actor: { id: 'u5', username: 'Сергей', avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop' }, targetThumbUrl: thumb2, message: 'и ещё 3 человека отметили вас на фото', timeAgo: '1 день назад' },
  { id: '5', kind: 'save', actor: { id: 'u6', username: 'Мария', avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop' }, message: 'сохранила вашу публикацию', timeAgo: '2 дня назад' },
  { id: '6', kind: 'follow', actor: { id: 'u1', username: 'Алексей', avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop' }, message: 'начал следить за вами', timeAgo: '3 дня назад', isFollowBack: true },
]