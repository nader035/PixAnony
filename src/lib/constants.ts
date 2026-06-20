import type { ColorPalette, GridSizeOption } from './types';

// ===== GRID SIZES =====
export const GRID_SIZES: GridSizeOption[] = [
  { size: 8, label: '8×8', difficulty: 'Easy', pixels: 64 },
  { size: 16, label: '16×16', difficulty: 'Normal', pixels: 256 },
  { size: 32, label: '32×32', difficulty: 'Advanced', pixels: 1024 },
  { size: 64, label: '64×64', difficulty: 'Pro', pixels: 4096 },
  { size: 128, label: '128×128', difficulty: 'Master', pixels: 16384 },
];

// ===== COLOR PALETTES =====
export const DEFAULT_COLORS = [
  '#000000', '#FFFFFF', '#EF4444', '#F97316', '#FACC15', '#22C55E',
  '#14B8A6', '#3B82F6', '#6366F1', '#8B5CF6', '#D946EF', '#EC4899',
];

export const PALETTES: ColorPalette[] = [
  {
    name: 'Neon',
    colors: [
      '#000000', '#FFFFFF', '#FF0055', '#FF6600', '#FFDD00', '#00FF88',
      '#00DDFF', '#0066FF', '#7700FF', '#FF00AA', '#FF0000', '#00FF00',
      '#333333', '#666666', '#999999', '#CCCCCC', '#FF3388', '#FF9933',
      '#FFEE55', '#33FF99', '#33EEFF', '#3388FF', '#9933FF', '#FF33CC',
    ],
  },
  {
    name: 'Retro',
    colors: [
      '#000000', '#FFFFFF', '#BE4A2F', '#D77643', '#EAD4AA', '#E4A672',
      '#B86F50', '#733E39', '#3E2731', '#A22633', '#E43B44', '#F77622',
      '#FEAE34', '#FEE761', '#63C74D', '#3E8948', '#265C42', '#193C3E',
      '#124E89', '#0099DB', '#2CE8F5', '#FFFFFF', '#C0CBDC', '#8B9BB4',
    ],
  },
  {
    name: 'GameBoy',
    colors: ['#0F380F', '#306230', '#8BAC0F', '#9BBC0F'],
  },
  {
    name: 'NES',
    colors: [
      '#000000', '#FCFCFC', '#F8F8F8', '#BCBCBC', '#7C7C7C', '#A4E4FC',
      '#3CBCFC', '#0078F8', '#0000FC', '#B8B8F8', '#6888FC', '#0058F8',
      '#0000BC', '#D8B8F8', '#9878F8', '#6844FC', '#4428BC', '#F8B8F8',
      '#F878F8', '#D800CC', '#940084', '#F8A4C0', '#F85898', '#E40058',
      '#A80020', '#F0D0B0', '#F87858', '#F83800', '#A81000', '#FCE0A8',
      '#FCA044', '#E45C10', '#881400', '#F8D878', '#F8B800', '#AC7C00',
      '#503000', '#D8F878', '#B8F818', '#00B800', '#007800', '#B8F8B8',
      '#58D854', '#00A800', '#006800', '#B8F8D8', '#58F898', '#00A844',
      '#005800', '#00FCFC', '#00E8D8', '#008888', '#004058',
    ],
  },
  {
    name: 'Pastel',
    colors: [
      '#FFFFFF', '#FFB3BA', '#FFDFBA', '#FFFFBA', '#BAFFC9', '#BAE1FF',
      '#E8BAFF', '#FFB3DE', '#FFD4BA', '#F5FFBA', '#BAFFEC', '#BAC8FF',
      '#D4BAFF', '#FFBAD2', '#FFE8BA', '#EFFFBA', '#BAFFD4', '#BABBFF',
      '#C9BAFF', '#FFB3C1', '#FFEEBA', '#E8FFBA', '#BAFFE1', '#BABFFF',
    ],
  },
  {
    name: 'Sunset',
    colors: [
      '#1A0533', '#2D0A4E', '#4A0E6B', '#6B1488', '#8B1A9E', '#A855F7',
      '#C77DFF', '#E0AAFF', '#FF6B9D', '#FF4081', '#FF1744', '#D50000',
      '#FF6D00', '#FF9100', '#FFB74D', '#FFE082', '#FFF59D', '#F0F4C3',
    ],
  },
];

// ===== KEYBOARD SHORTCUTS =====
export const SHORTCUTS: Record<string, { key: string; label: string }> = {
  pencil: { key: 'b', label: 'B' },
  eraser: { key: 'e', label: 'E' },
  fill: { key: 'f', label: 'F' },
  picker: { key: 'i', label: 'I' },
  line: { key: 'l', label: 'L' },
  rectangle: { key: 'r', label: 'R' },
  circle: { key: 'c', label: 'C' },
  move: { key: ' ', label: 'Space' },
  undo: { key: 'z', label: 'Ctrl+Z' },
  redo: { key: 'z', label: 'Ctrl+Shift+Z' },
  grid: { key: 'g', label: 'G' },
  zoomIn: { key: '+', label: '+' },
  zoomOut: { key: '-', label: '-' },
};

// ===== ZOOM LEVELS =====
export const ZOOM_LEVELS = [50, 100, 200, 400, 800, 1600, 3200];

// ===== NAV ITEMS =====
export const NAV_ITEMS = [
  { label: 'Home', href: '/home', icon: 'Home' },
  { label: 'Explore', href: '/explore', icon: 'Compass' },
  { label: 'Notifications', href: '/notifications', icon: 'Bell' },
  { label: 'Bookmarks', href: '/bookmarks', icon: 'Bookmark' },
  { label: 'Challenges', href: '/challenges', icon: 'Trophy' },
  { label: 'Create', href: '/paint', icon: 'Paintbrush' },
  { label: 'Settings', href: '/settings', icon: 'Settings' },
] as const;

// ===== FEED TABS =====
export const FEED_TABS = ['For You', 'Following', 'Trending', 'Recent'] as const;

// ===== EXPLORE FILTERS =====
export const EXPLORE_FILTERS = ['All', 'Trending', 'New', 'Popular', 'Following'] as const;

// ===== NOTIFICATION TABS =====
export const NOTIFICATION_TABS = ['All', 'Likes', 'Reposts', 'Follows', 'Mentions'] as const;

// ===== SETTINGS TABS =====
export const SETTINGS_TABS = [
  'Account', 'Profile', 'Privacy', 'Notifications', 'Appearance', 'Security', 'Linked Accounts', 'Billing',
] as const;

// ===== POPULAR TAGS =====
export const POPULAR_TAGS = [
  '#sunset', '#pixelart', '#space', '#cute', '#retro',
  '#cyberpunk', '#gameboy', '#neon', '#heart', '#robot',
];

// ===== BRAND =====
export const BRAND = {
  name: 'PixAnony',
  tagline: 'Express in Pixels. Anonymously.',
  description: 'Create, share, and receive anonymous pixel art in a focused community for pixel artists.',
  url: 'https://pixanony.com',
} as const;
