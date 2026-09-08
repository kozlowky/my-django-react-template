export interface Profile {
  id: string
  username: string
  displayName: string
  avatarUrl: string
  bio?: string
  link?: string
  postsCount: number
  followersCount: number
  followingCount: number
  isFollowedByMe: boolean
}