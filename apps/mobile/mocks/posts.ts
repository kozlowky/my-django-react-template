import type { Post } from "../lib/api";

const u = (id: string, name: string, avatar: string) => ({
  id,
  email: `${name.toLowerCase()}@example.com`,
  displayName: name,
  avatarUrl: avatar,
});

const img = (id: string, url: string, order = 0) => ({
  id,
  fileUrl: url,
  mediaType: "image" as const,
  width: 1080,
  height: 1350,
  order,
});

export const mockPosts: Post[] = [
  {
    id: "m1",
    caption: "Утро начинается с хорошего кофе ☕",
    location: "Москва, Патрики",
    createdAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    author: u("u1", "Аня Ковалева", "https://i.pravatar.cc/150?img=47"),
    mediaItems: [
      img(
        "mi1",
        "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1080&h=1350&fit=crop",
      ),
    ],
    likesCount: 214,
    commentsCount: 18,
    isLiked: false,
    isSaved: false,
  },
  {
    id: "m2",
    caption:
      "Новая коллекция уже здесь 🤍 Ткань невесомая, носить одно удовольствие",
    location: "Санкт-Петербург",
    createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    author: u("u2", "TOTEME_RU", "https://i.pravatar.cc/150?img=12"),
    mediaItems: [
      img(
        "mi2a",
        "https://images.unsplash.com/photo-1581044777550-4cfa60707c03?w=1080&h=1350&fit=crop",
        0,
      ),
      img(
        "mi2b",
        "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1080&h=1350&fit=crop",
        1,
      ),
      img(
        "mi2c",
        "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=1080&h=1350&fit=crop",
        2,
      ),
    ],
    likesCount: 1043,
    commentsCount: 72,
    isLiked: true,
    isSaved: true,
  },
  {
    id: "m3",
    caption: "",
    location: "Тбилиси",
    createdAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    author: u("u3", "Марк Лисицын", "https://i.pravatar.cc/150?img=33"),
    mediaItems: [
      img(
        "mi3",
        "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=1080&h=1350&fit=crop",
      ),
    ],
    likesCount: 88,
    commentsCount: 5,
    isLiked: false,
    isSaved: false,
  },
  {
    id: "m4",
    caption: "Два дня в горах — перезарядка на месяц вперёд 🏔️",
    location: "Красная Поляна",
    createdAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    author: u("u4", "Соня Ермолова", "https://i.pravatar.cc/150?img=25"),
    mediaItems: [
      img(
        "mi4a",
        "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1080&h=1350&fit=crop",
        0,
      ),
      img(
        "mi4b",
        "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1080&h=1350&fit=crop",
        1,
      ),
    ],
    likesCount: 467,
    commentsCount: 31,
    isLiked: false,
    isSaved: true,
  },
  {
    id: "m5",
    caption: "Любимый угол в любимом городе",
    location: "",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    author: u("u5", "Pavel.jpg", "https://i.pravatar.cc/150?img=68"),
    mediaItems: [
      img(
        "mi5",
        "https://images.unsplash.com/photo-1493246507139-91e8fad9978e?w=1080&h=1350&fit=crop",
      ),
    ],
    likesCount: 312,
    commentsCount: 9,
    isLiked: true,
    isSaved: false,
  },
  {
    id: "m6",
    caption: "Весенний дроп — 6 силуэтов, только нейтралы",
    location: "ШоуРум, Москва",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
    author: u("u6", "ARKET_MSK", "https://i.pravatar.cc/150?img=5"),
    mediaItems: [
      img(
        "mi6a",
        "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1080&h=1350&fit=crop",
        0,
      ),
      img(
        "mi6b",
        "https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?w=1080&h=1350&fit=crop",
        1,
      ),
      img(
        "mi6c",
        "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1080&h=1350&fit=crop",
        2,
      ),
      img(
        "mi6d",
        "https://images.unsplash.com/photo-1566206091558-7f218b696731?w=1080&h=1350&fit=crop",
        3,
      ),
    ],
    likesCount: 2891,
    commentsCount: 144,
    isLiked: false,
    isSaved: false,
  },
  {
    id: "m7",
    caption: "📍",
    location: "Бали, Убуд",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 14).toISOString(),
    author: u("u7", "Катя_travels", "https://i.pravatar.cc/150?img=44"),
    mediaItems: [
      img(
        "mi7",
        "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=1080&h=1350&fit=crop",
      ),
    ],
    likesCount: 738,
    commentsCount: 52,
    isLiked: false,
    isSaved: false,
  },
  {
    id: "m8",
    caption: "Это просто ваза. Просто очень хорошая ваза.",
    location: "",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString(),
    author: u("u8", "Nikita.arh", "https://i.pravatar.cc/150?img=61"),
    mediaItems: [
      img(
        "mi8",
        "https://images.unsplash.com/photo-1612196808214-b8e1d6145a8c?w=1080&h=1350&fit=crop",
      ),
    ],
    likesCount: 154,
    commentsCount: 7,
    isLiked: false,
    isSaved: true,
  },
];
