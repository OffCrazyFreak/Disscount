export type PostId = "disscount-launch" | "whats-next";

export type PostParagraphKey = "p1" | "p2";

export type Post = {
  id: PostId;
  imageUrl: string;
  date: string;
  paragraphs: readonly PostParagraphKey[];
};

// Template posts so the layout can be filled with real announcements later. Text lives in the updates messages.
export const templatePosts: Post[] = [
  {
    id: "disscount-launch",
    imageUrl: "/placeholder-image.svg",
    date: "2026-06-21",
    paragraphs: ["p1", "p2"],
  },
  {
    id: "whats-next",
    imageUrl: "/placeholder-image.svg",
    date: "2026-06-21",
    paragraphs: ["p1", "p2"],
  },
];

export function getPostById(id: string): Post | undefined {
  return templatePosts.find((post) => post.id === id);
}
