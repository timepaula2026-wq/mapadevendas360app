export interface ContentItem {
  id: string;
  type: "youtube" | "pdf" | "file";
  title: string;
  url?: string;
  youtubeId?: string;
  duration?: string;
  fileSize?: string;
  completed?: boolean;
}

export interface Training {
  id: string;
  title: string;
  description: string;
  category: string;
  thumbnail?: string;
  contents: ContentItem[];
  progress: number;
  createdAt: string;
}
