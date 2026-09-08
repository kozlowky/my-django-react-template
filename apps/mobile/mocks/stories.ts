export type Story = {
  id: string;
  username: string;
  avatarUrl: string;
  imageUrl: string;
  viewed: boolean;
};

const img =
  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=800&fit=crop";

export const stories: Story[] = [
  {
    id: "1",
    username: "АННА",
    avatarUrl:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop",
    imageUrl: img,
    viewed: false,
  },
  {
    id: "2",
    username: "МИХАИЛ",
    avatarUrl:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop",
    imageUrl: img,
    viewed: false,
  },
  {
    id: "3",
    username: "ЕЛЕНА",
    avatarUrl:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop",
    imageUrl: img,
    viewed: false,
  },
  {
    id: "4",
    username: "СЕРГЕЙ",
    avatarUrl:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop",
    imageUrl: img,
    viewed: false,
  },
  {
    id: "5",
    username: "МАРИЯ",
    avatarUrl:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop",
    imageUrl: img,
    viewed: false,
  },
];
