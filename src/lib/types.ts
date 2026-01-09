export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  isAdmin: boolean;
  seenNotifications?: { [notificationId: string]: boolean };
  suspendedUntil?: number; // Timestamp until which the user is suspended
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
  likes?: number;
  likedBy?: { [key: string]: boolean };
  createdAt: number; // Timestamp
}

export interface Comment {
  id:string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  timestamp: number;
  type: 'text' | 'emoji' | 'image';
  content: string; // Will hold text, emoji character, or image URL
  parentId?: string; // ID of the comment being replied to
  replies?: Comment[]; // For client-side nesting
}

export interface Notification {
    id: string;
    contentId: string;
    title: string;
    description: string;
    imageUrl: string;
    createdAt: number;
    type: 'movie' | 'series';
}
