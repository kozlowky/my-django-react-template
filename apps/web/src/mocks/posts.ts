import type { Post } from '@selte/design-types'

export const posts: Post[] = [
  {
    id: '1',
    author: { id: 'u1', username: 'АЛЕКСЕЙ', avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop' },
    location: 'Москва · Тбилиси',
    images: [{ id: '1-1', url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600&h=600&fit=crop' }],
    caption: 'Утренний свет в старой студии. Тишина и холст.',
    likeCount: 124,
    commentCount: 32,
    likedByMe: false,
    savedByMe: false,
  },
  {
    id: '2',
    author: { id: 'u2', username: 'АННА', avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop' },
    location: 'Санкт-Петербург',
    images: [{ id: '2-1', url: 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=600&h=600&fit=crop' }],
    caption: 'Тихое утро. Кофе и мысли.',
    likeCount: 89,
    commentCount: 12,
    likedByMe: false,
    savedByMe: false,
  },
]