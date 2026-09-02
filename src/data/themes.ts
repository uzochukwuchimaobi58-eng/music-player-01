import { AppTheme } from '../types';

export interface ThemeDefinition {
  id: AppTheme;
  name: string;
  subtitle: string;
  isDark: boolean;
  accentColor: string; // hex
  bgCanvas: string; // CSS background (color or gradient)
  headerBg: string;
  headerBorder: string;
  miniPlayerBg: string;
  miniPlayerBorder: string;
  sidebarBg: string;
  sidebarHeaderBg: string;
  textPrimary: string;
  textSecondary: string;
  cardBorder: string;
  isProOnly?: boolean;
  themeType?: 'amoled' | 'gradient' | 'standard';
  // 6 Main Grid Cards + Playlist Cards
  cards: {
    library: { bg: string; text: string; iconColor: string };
    folder: { bg: string; text: string; iconColor: string };
    favorite: { bg: string; text: string; iconColor: string };
    recentPlay: { bg: string; text: string; iconColor: string };
    recentAdd: { bg: string; text: string; iconColor: string };
    mostPlay: { bg: string; text: string; iconColor: string };
    playlist: { bg: string; bannerBg: string; text: string; iconColor: string };
    addPlaylist: { bg: string; iconColor: string; border?: string };
  };
  shuffleFab: {
    bg: string;
    text: string;
    shadow: string;
  };
}

export const THEMES: Record<AppTheme, ThemeDefinition> = {
  'dark-amoled': {
    id: 'dark-amoled',
    name: 'Classic Music Player',
    subtitle: 'Matching Original Screenshot with Vibrant Tiles',
    isDark: true,
    accentColor: '#f9be39',
    bgCanvas: '#19191b',
    headerBg: '#171719',
    headerBorder: '#27272a',
    miniPlayerBg: '#161618',
    miniPlayerBorder: '#27272a',
    sidebarBg: '#18181a',
    sidebarHeaderBg: '#161618',
    textPrimary: '#ffffff',
    textSecondary: '#a1a1aa',
    cardBorder: 'transparent',
    isProOnly: true,
    themeType: 'amoled',
    cards: {
      library: { bg: '#3f80c6', text: '#ffffff', iconColor: '#ffffff' },
      folder: { bg: '#d18752', text: '#ffffff', iconColor: '#ffffff' },
      favorite: { bg: '#c6727c', text: '#ffffff', iconColor: '#ffffff' },
      recentPlay: { bg: '#5995b8', text: '#ffffff', iconColor: '#5995b8' },
      recentAdd: { bg: '#18ad75', text: '#ffffff', iconColor: '#18ad75' },
      mostPlay: { bg: '#986ebd', text: '#ffffff', iconColor: '#ffffff' },
      playlist: { bg: '#608da9', bannerBg: '#4e738a', text: '#ffffff', iconColor: '#ffffff' },
      addPlaylist: { bg: '#557e98', iconColor: '#ffffff' },
    },
    shuffleFab: {
      bg: '#f9be39',
      text: '#ffffff',
      shadow: '0 8px 24px rgba(249, 190, 57, 0.45)',
    },
  },

  'dark-slate': {
    id: 'dark-slate',
    name: 'Modern Slate & Neon Cyan',
    subtitle: 'Sleek dark graphite with cool electric accents',
    isDark: true,
    accentColor: '#06b6d4',
    bgCanvas: 'linear-gradient(180deg, #0f172a 0%, #090d16 100%)',
    headerBg: '#0f172a',
    headerBorder: '#1e293b',
    miniPlayerBg: '#0b1120',
    miniPlayerBorder: '#1e293b',
    sidebarBg: '#0f172a',
    sidebarHeaderBg: '#0b1120',
    textPrimary: '#f8fafc',
    textSecondary: '#94a3b8',
    cardBorder: 'rgba(56, 189, 248, 0.15)',
    isProOnly: false,
    themeType: 'standard',
    cards: {
      library: { bg: '#0284c7', text: '#ffffff', iconColor: '#ffffff' },
      folder: { bg: '#0f766e', text: '#ffffff', iconColor: '#ffffff' },
      favorite: { bg: '#0369a1', text: '#ffffff', iconColor: '#ffffff' },
      recentPlay: { bg: '#0891b2', text: '#ffffff', iconColor: '#0891b2' },
      recentAdd: { bg: '#059669', text: '#ffffff', iconColor: '#059669' },
      mostPlay: { bg: '#4f46e5', text: '#ffffff', iconColor: '#ffffff' },
      playlist: { bg: '#1e293b', bannerBg: '#0f172a', text: '#38bdf8', iconColor: '#38bdf8' },
      addPlaylist: { bg: '#1e293b', iconColor: '#38bdf8', border: '1px solid #38bdf840' },
    },
    shuffleFab: {
      bg: '#06b6d4',
      text: '#000000',
      shadow: '0 8px 24px rgba(6, 182, 212, 0.45)',
    },
  },

  cyberpunk: {
    id: 'cyberpunk',
    name: 'Cyberpunk Neon & Violet',
    subtitle: 'Deep dark synthwave canvas with ultra-vivid glow',
    isDark: true,
    accentColor: '#f43f5e',
    bgCanvas: 'linear-gradient(180deg, #1a0826 0%, #0d0314 100%)',
    headerBg: '#1f092e',
    headerBorder: '#3b0764',
    miniPlayerBg: '#160522',
    miniPlayerBorder: '#3b0764',
    sidebarBg: '#1f092e',
    sidebarHeaderBg: '#160522',
    textPrimary: '#ffffff',
    textSecondary: '#d8b4fe',
    cardBorder: 'rgba(244, 63, 94, 0.2)',
    isProOnly: true,
    themeType: 'gradient',
    cards: {
      library: { bg: '#ec4899', text: '#ffffff', iconColor: '#ffffff' },
      folder: { bg: '#d946ef', text: '#ffffff', iconColor: '#ffffff' },
      favorite: { bg: '#f43f5e', text: '#ffffff', iconColor: '#ffffff' },
      recentPlay: { bg: '#06b6d4', text: '#ffffff', iconColor: '#06b6d4' },
      recentAdd: { bg: '#10b981', text: '#ffffff', iconColor: '#10b981' },
      mostPlay: { bg: '#8b5cf6', text: '#ffffff', iconColor: '#ffffff' },
      playlist: { bg: '#4c1d95', bannerBg: '#2e1065', text: '#f472b6', iconColor: '#f472b6' },
      addPlaylist: { bg: '#3b0764', iconColor: '#f43f5e', border: '1px solid #f43f5e50' },
    },
    shuffleFab: {
      bg: '#f43f5e',
      text: '#ffffff',
      shadow: '0 8px 24px rgba(244, 63, 94, 0.5)',
    },
  },

  'midnight-blue': {
    id: 'midnight-blue',
    name: 'Midnight Sapphire Ocean',
    subtitle: 'Deep oceanic blue tones with cobalt & sky cards',
    isDark: true,
    accentColor: '#38bdf8',
    bgCanvas: 'linear-gradient(180deg, #071529 0%, #030b15 100%)',
    headerBg: '#0a1d38',
    headerBorder: '#1e3a8a',
    miniPlayerBg: '#061324',
    miniPlayerBorder: '#1e3a8a',
    sidebarBg: '#0a1d38',
    sidebarHeaderBg: '#061324',
    textPrimary: '#ffffff',
    textSecondary: '#bae6fd',
    cardBorder: 'rgba(56, 189, 248, 0.2)',
    isProOnly: true,
    themeType: 'gradient',
    cards: {
      library: { bg: '#2563eb', text: '#ffffff', iconColor: '#ffffff' },
      folder: { bg: '#0284c7', text: '#ffffff', iconColor: '#ffffff' },
      favorite: { bg: '#3b82f6', text: '#ffffff', iconColor: '#ffffff' },
      recentPlay: { bg: '#0ea5e9', text: '#ffffff', iconColor: '#0ea5e9' },
      recentAdd: { bg: '#06b6d4', text: '#ffffff', iconColor: '#06b6d4' },
      mostPlay: { bg: '#6366f1', text: '#ffffff', iconColor: '#ffffff' },
      playlist: { bg: '#1e3a8a', bannerBg: '#172554', text: '#7dd3fc', iconColor: '#7dd3fc' },
      addPlaylist: { bg: '#172554', iconColor: '#38bdf8', border: '1px solid #38bdf840' },
    },
    shuffleFab: {
      bg: '#38bdf8',
      text: '#000000',
      shadow: '0 8px 24px rgba(56, 189, 248, 0.45)',
    },
  },

  'sunset-warm': {
    id: 'sunset-warm',
    name: 'Warm Sunset & Amber',
    subtitle: 'Rich dark espresso with terracotta and golden peach',
    isDark: true,
    accentColor: '#f97316',
    bgCanvas: 'linear-gradient(180deg, #24140e 0%, #140905 100%)',
    headerBg: '#2c1810',
    headerBorder: '#431407',
    miniPlayerBg: '#1c0e08',
    miniPlayerBorder: '#431407',
    sidebarBg: '#2c1810',
    sidebarHeaderBg: '#1c0e08',
    textPrimary: '#ffffff',
    textSecondary: '#fed7aa',
    cardBorder: 'rgba(249, 115, 22, 0.2)',
    isProOnly: true,
    themeType: 'gradient',
    cards: {
      library: { bg: '#ea580c', text: '#ffffff', iconColor: '#ffffff' },
      folder: { bg: '#d97706', text: '#ffffff', iconColor: '#ffffff' },
      favorite: { bg: '#e11d48', text: '#ffffff', iconColor: '#ffffff' },
      recentPlay: { bg: '#c2410c', text: '#ffffff', iconColor: '#c2410c' },
      recentAdd: { bg: '#ca8a04', text: '#ffffff', iconColor: '#ca8a04' },
      mostPlay: { bg: '#b45309', text: '#ffffff', iconColor: '#ffffff' },
      playlist: { bg: '#7c2d12', bannerBg: '#451a03', text: '#fdba74', iconColor: '#fdba74' },
      addPlaylist: { bg: '#451a03', iconColor: '#fb923c', border: '1px solid #fb923c40' },
    },
    shuffleFab: {
      bg: '#f97316',
      text: '#ffffff',
      shadow: '0 8px 24px rgba(249, 115, 22, 0.45)',
    },
  },

  'emerald-forest': {
    id: 'emerald-forest',
    name: 'Deep Emerald & Mint Forest',
    subtitle: 'Lush dark botanical canvas with jade and mint tiles',
    isDark: true,
    accentColor: '#10b981',
    bgCanvas: 'linear-gradient(180deg, #062217 0%, #03140e 100%)',
    headerBg: '#092d1f',
    headerBorder: '#064e3b',
    miniPlayerBg: '#051f15',
    miniPlayerBorder: '#064e3b',
    sidebarBg: '#092d1f',
    sidebarHeaderBg: '#051f15',
    textPrimary: '#ffffff',
    textSecondary: '#a7f3d0',
    cardBorder: 'rgba(16, 185, 129, 0.2)',
    isProOnly: true,
    themeType: 'gradient',
    cards: {
      library: { bg: '#059669', text: '#ffffff', iconColor: '#ffffff' },
      folder: { bg: '#15803d', text: '#ffffff', iconColor: '#ffffff' },
      favorite: { bg: '#047857', text: '#ffffff', iconColor: '#ffffff' },
      recentPlay: { bg: '#0d9488', text: '#ffffff', iconColor: '#0d9488' },
      recentAdd: { bg: '#16a34a', text: '#ffffff', iconColor: '#16a34a' },
      mostPlay: { bg: '#0f766e', text: '#ffffff', iconColor: '#ffffff' },
      playlist: { bg: '#064e3b', bannerBg: '#022c22', text: '#6ee7b7', iconColor: '#6ee7b7' },
      addPlaylist: { bg: '#064e3b', iconColor: '#34d399', border: '1px solid #34d39940' },
    },
    shuffleFab: {
      bg: '#10b981',
      text: '#ffffff',
      shadow: '0 8px 24px rgba(16, 185, 129, 0.45)',
    },
  },

  'crimson-ruby': {
    id: 'crimson-ruby',
    name: 'Velvet Crimson & Ruby',
    subtitle: 'Dramatic royal burgundy canvas with scarlet highlights',
    isDark: true,
    accentColor: '#f43f5e',
    bgCanvas: 'linear-gradient(180deg, #240914 0%, #130309 100%)',
    headerBg: '#2d0c19',
    headerBorder: '#4c0519',
    miniPlayerBg: '#1f0611',
    miniPlayerBorder: '#4c0519',
    sidebarBg: '#2d0c19',
    sidebarHeaderBg: '#1f0611',
    textPrimary: '#ffffff',
    textSecondary: '#fecdd3',
    cardBorder: 'rgba(244, 63, 94, 0.2)',
    isProOnly: true,
    themeType: 'gradient',
    cards: {
      library: { bg: '#be123c', text: '#ffffff', iconColor: '#ffffff' },
      folder: { bg: '#9f1239', text: '#ffffff', iconColor: '#ffffff' },
      favorite: { bg: '#e11d48', text: '#ffffff', iconColor: '#ffffff' },
      recentPlay: { bg: '#881337', text: '#ffffff', iconColor: '#881337' },
      recentAdd: { bg: '#db2777', text: '#ffffff', iconColor: '#db2777' },
      mostPlay: { bg: '#9d174d', text: '#ffffff', iconColor: '#ffffff' },
      playlist: { bg: '#4c0519', bannerBg: '#330210', text: '#fda4af', iconColor: '#fda4af' },
      addPlaylist: { bg: '#4c0519', iconColor: '#fb7185', border: '1px solid #fb718540' },
    },
    shuffleFab: {
      bg: '#f43f5e',
      text: '#ffffff',
      shadow: '0 8px 24px rgba(244, 63, 94, 0.45)',
    },
  },

  'golden-luxury': {
    id: 'golden-luxury',
    name: 'Golden Royalty & Onyx',
    subtitle: 'Opulent dark brass & champagne gold master theme',
    isDark: true,
    accentColor: '#fbbf24',
    bgCanvas: 'linear-gradient(180deg, #1c180e 0%, #0d0c07 100%)',
    headerBg: '#252012',
    headerBorder: '#451a03',
    miniPlayerBg: '#18150a',
    miniPlayerBorder: '#451a03',
    sidebarBg: '#252012',
    sidebarHeaderBg: '#18150a',
    textPrimary: '#ffffff',
    textSecondary: '#fef08a',
    cardBorder: 'rgba(251, 191, 36, 0.2)',
    isProOnly: true,
    themeType: 'gradient',
    cards: {
      library: { bg: '#ca8a04', text: '#ffffff', iconColor: '#ffffff' },
      folder: { bg: '#b45309', text: '#ffffff', iconColor: '#ffffff' },
      favorite: { bg: '#d97706', text: '#ffffff', iconColor: '#ffffff' },
      recentPlay: { bg: '#a16207', text: '#ffffff', iconColor: '#a16207' },
      recentAdd: { bg: '#854d0e', text: '#ffffff', iconColor: '#854d0e' },
      mostPlay: { bg: '#713f12', text: '#ffffff', iconColor: '#ffffff' },
      playlist: { bg: '#422006', bannerBg: '#271302', text: '#fde047', iconColor: '#fde047' },
      addPlaylist: { bg: '#422006', iconColor: '#facc15', border: '1px solid #facc1540' },
    },
    shuffleFab: {
      bg: '#fbbf24',
      text: '#000000',
      shadow: '0 8px 24px rgba(251, 191, 36, 0.5)',
    },
  },

  'light-minimal': {
    id: 'light-minimal',
    name: 'Clean Studio Light',
    subtitle: 'Crisp bright canvas with playful vibrant pastel tiles',
    isDark: false,
    accentColor: '#2563eb',
    bgCanvas: '#f4f5f8',
    headerBg: '#ffffff',
    headerBorder: '#e2e8f0',
    miniPlayerBg: '#ffffff',
    miniPlayerBorder: '#e2e8f0',
    sidebarBg: '#ffffff',
    sidebarHeaderBg: '#f8fafc',
    textPrimary: '#0f172a',
    textSecondary: '#64748b',
    cardBorder: 'rgba(0, 0, 0, 0.06)',
    isProOnly: false,
    themeType: 'standard',
    cards: {
      library: { bg: '#3b82f6', text: '#ffffff', iconColor: '#ffffff' },
      folder: { bg: '#f97316', text: '#ffffff', iconColor: '#ffffff' },
      favorite: { bg: '#f43f5e', text: '#ffffff', iconColor: '#ffffff' },
      recentPlay: { bg: '#06b6d4', text: '#ffffff', iconColor: '#06b6d4' },
      recentAdd: { bg: '#10b981', text: '#ffffff', iconColor: '#10b981' },
      mostPlay: { bg: '#8b5cf6', text: '#ffffff', iconColor: '#ffffff' },
      playlist: { bg: '#cbd5e1', bannerBg: '#94a3b8', text: '#0f172a', iconColor: '#0f172a' },
      addPlaylist: { bg: '#e2e8f0', iconColor: '#2563eb', border: '1px dashed #2563eb80' },
    },
    shuffleFab: {
      bg: '#2563eb',
      text: '#ffffff',
      shadow: '0 8px 24px rgba(37, 99, 235, 0.4)',
    },
  },
};

export const getThemeConfig = (themeId?: string | AppTheme): ThemeDefinition => {
  if (themeId && themeId in THEMES) {
    return THEMES[themeId as AppTheme];
  }
  return THEMES['dark-amoled'];
};
