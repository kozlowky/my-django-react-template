import type { Profile } from '@selte/design-types'

export const currentProfile: Profile = {
  id: 'me',
  username: 'dmitry.volkov',
  displayName: 'Дмитрий Волков',
  avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop',
  bio: 'Фотограф и визуальный рассказчик.\nМосква / Тбилиси',
  link: 'https://www.amemory.com',
  postsCount: 248,
  followersCount: 1700,
  followingCount: 457,
  isFollowedByMe: false,
}