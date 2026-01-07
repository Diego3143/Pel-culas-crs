export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  isAdmin: boolean;
}

export interface Episode {
  id: string;
  title: string;
  episodeNumber: number;
  videoUrl: string;
  description?: string;
}

export interface Content {
  id: string;
  type: 'movie' | 'series';
  title: string;
  description?: string;
  imageUrl: string;
  videoUrl?: string; // For movies
  episodes?: Episode[]; // For series
  genres?: string[];
  inEmission?: boolean; // To mark content as currently airing
}

export interface Comment {
  id:string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  timestamp: number;
  type: 'text' | 'emoji' | 'image';
  content: string; // Will hold text, emoji character, or image URL
}
