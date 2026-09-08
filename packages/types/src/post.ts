export interface MediaItem {
  id: string;
  fileUrl: string;
  mediaType: string;
  width: number | null;
  height: number | null;
  order: number;
}

export interface Post {
  id: string;
  caption: string;
  location: string;
  createdAt: string;
  author: { id: string; email: string; displayName: string };
  mediaItems: MediaItem[];
  likesCount: number;
  commentsCount: number;
  isLiked: boolean;
  isSaved: boolean;
}

export interface Comment {
  id: string;
  text: string;
  createdAt: string;
  author: { id: string; displayName: string };
  replies: Comment[];
}

export interface Story {
  id: string;
  username: string;
  avatarUrl: string;
  imageUrl: string;
  viewed: boolean;
}
