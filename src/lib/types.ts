// PixAnony Type Definitions

export interface Profile {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  banner_url: string | null;
  bio: string | null;
  website: string | null;
  location: string | null;
  is_verified: boolean;
  is_pro: boolean;
  created_at: string;
  // Computed
  followers_count?: number;
  following_count?: number;
  paints_count?: number;
  likes_count?: number;
}

export interface Artwork {
  id: string;
  user_id: string;
  receiver_id: string | null;
  title: string | null;
  caption: string | null;
  grid_size: GridSize;
  pixel_data: string; // JSON stringified pixel array
  layers: string; // JSON stringified layers
  preview_url: string | null;
  visibility: 'anonymous' | 'public' | 'private';
  is_anonymous: boolean;
  likes_count: number;
  reposts_count: number;
  comments_count: number;
  views_count: number;
  created_at: string;
  // Joined
  profile?: Profile;
  liked_by_user?: boolean;
  reposted_by_user?: boolean;
  bookmarked_by_user?: boolean;
}

export interface PixelLayer {
  id: string;
  name: string;
  visible: boolean;
  opacity: number;
  locked: boolean;
  pixels: string[]; // Array of hex colors or 'transparent'
}

export type GridSize = 8 | 16 | 32 | 64 | 128;

export interface Like {
  id: string;
  user_id: string;
  artwork_id: string;
  created_at: string;
}

export interface Repost {
  id: string;
  user_id: string;
  artwork_id: string;
  created_at: string;
}

export interface Follow {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
}

export interface Comment {
  id: string;
  user_id: string;
  artwork_id: string;
  content: string;
  created_at: string;
  profile?: Profile;
}

export interface Notification {
  id: string;
  user_id: string;
  actor_id: string | null;
  artwork_id: string | null;
  type: NotificationType;
  read: boolean;
  created_at: string;
  // Joined
  actor?: Profile;
  artwork?: Artwork;
}

export type NotificationType = 'like' | 'repost' | 'follow' | 'mention' | 'comment' | 'received_pixel';

export interface Bookmark {
  id: string;
  user_id: string;
  artwork_id: string;
  created_at: string;
}

export interface Challenge {
  id: string;
  title: string;
  theme: string;
  description: string;
  ends_at: string;
  participants_count: number;
}

// Paint Editor Types
export type PaintTool =
  | 'pencil'
  | 'eraser'
  | 'fill'
  | 'line'
  | 'rectangle'
  | 'circle'
  | 'picker'
  | 'move'
  | 'text'
  | 'mirror';

export interface PaintState {
  tool: PaintTool;
  color: string;
  gridSize: GridSize;
  zoom: number;
  panX: number;
  panY: number;
  showGrid: boolean;
  showPreview: boolean;
  layers: PixelLayer[];
  activeLayerId: string;
  history: PixelLayer[][];
  historyIndex: number;
  recentColors: string[];
  activePalette: string;
  symmetryMode: 'off' | 'horizontal' | 'vertical' | 'both';
}

export interface ColorPalette {
  name: string;
  colors: string[];
}

export interface GridSizeOption {
  size: GridSize;
  label: string;
  difficulty: string;
  pixels: number;
}

export interface ShareOptions {
  format: 'png' | 'webp' | 'svg';
  includeFrame: boolean;
  includeUsername: boolean;
  includeLogo: boolean;
}
