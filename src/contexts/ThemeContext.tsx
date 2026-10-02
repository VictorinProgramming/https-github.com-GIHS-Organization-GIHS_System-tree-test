import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

export type ThemeMode = 'dark' | 'light';

export interface ThemeColorPreset {
  id: string;
  name: string;
  primary: string;
  accent: string;
  bgDark: string;
  bgLight: string;
  sidebarDark?: string;
  sidebarLight?: string;
  navbarDark?: string;
  navbarLight?: string;
  cardDark?: string;
  cardLight?: string;
}

export const THEME_PRESETS: ThemeColorPreset[] = [
  {
    id: 'pmj_blue',
    name: 'Azul Oficial (PMJ / Joinville)',
    primary: '#0067FC',
    accent: '#00A6FC',
    bgDark: '#01122D',
    bgLight: '#FFFFFF',
    sidebarDark: '#01122D',
    sidebarLight: '#FFFFFF',
    navbarDark: '#01122D',
    navbarLight: '#FFFFFF',
    cardDark: '#041838',
    cardLight: '#FFFFFF'
  },
  {
    id: 'cyber_cyan',
    name: 'Ciano Tecnológico & SOC',
    primary: '#06B6D4',
    accent: '#22D3EE',
    bgDark: '#01122D',
    bgLight: '#FFFFFF',
    sidebarDark: '#01122D',
    sidebarLight: '#FFFFFF',
    navbarDark: '#01122D',
    navbarLight: '#FFFFFF',
    cardDark: '#041838',
    cardLight: '#FFFFFF'
  },
  {
    id: 'emerald_green',
    name: 'Esmeralda Sustentável & Saúde',
    primary: '#10B981',
    accent: '#34D399',
    bgDark: '#01122D',
    bgLight: '#FFFFFF',
    sidebarDark: '#01122D',
    sidebarLight: '#FFFFFF',
    navbarDark: '#01122D',
    navbarLight: '#FFFFFF',
    cardDark: '#041838',
    cardLight: '#FFFFFF'
  },
  {
    id: 'purple_gov',
    name: 'Púrpura Governança & Gestão',
    primary: '#8B5CF6',
    accent: '#A78BFA',
    bgDark: '#01122D',
    bgLight: '#FFFFFF',
    sidebarDark: '#01122D',
    sidebarLight: '#FFFFFF',
    navbarDark: '#01122D',
    navbarLight: '#FFFFFF',
    cardDark: '#041838',
    cardLight: '#FFFFFF'
  },
  {
    id: 'ruby_red',
    name: 'Rubi & Defesa Civil',
    primary: '#E11D48',
    accent: '#FB7185',
    bgDark: '#01122D',
    bgLight: '#FFFFFF',
    sidebarDark: '#01122D',
    sidebarLight: '#FFFFFF',
    navbarDark: '#01122D',
    navbarLight: '#FFFFFF',
    cardDark: '#041838',
    cardLight: '#FFFFFF'
  },
  {
    id: 'amber_gold',
    name: 'Âmbar Fazenda & Tributos',
    primary: '#F59E0B',
    accent: '#FCD34D',
    bgDark: '#01122D',
    bgLight: '#FFFFFF',
    sidebarDark: '#01122D',
    sidebarLight: '#FFFFFF',
    navbarDark: '#01122D',
    navbarLight: '#FFFFFF',
    cardDark: '#041838',
    cardLight: '#FFFFFF'
  },
  {
    id: 'indigo_tech',
    name: 'Índigo Datacenter & DBA',
    primary: '#4F46E5',
    accent: '#818CF8',
    bgDark: '#01122D',
    bgLight: '#FFFFFF',
    sidebarDark: '#01122D',
    sidebarLight: '#FFFFFF',
    navbarDark: '#01122D',
    navbarLight: '#FFFFFF',
    cardDark: '#041838',
    cardLight: '#FFFFFF'
  },
  {
    id: 'teal_modern',
    name: 'Teal Moderno & Inovação',
    primary: '#0D9488',
    accent: '#2DD4BF',
    bgDark: '#01122D',
    bgLight: '#FFFFFF',
    sidebarDark: '#01122D',
    sidebarLight: '#FFFFFF',
    navbarDark: '#01122D',
    navbarLight: '#FFFFFF',
    cardDark: '#041838',
    cardLight: '#FFFFFF'
  },
  {
    id: 'rose_vibrant',
    name: 'Rosa & Ação Social',
    primary: '#F43F5E',
    accent: '#FDA4AF',
    bgDark: '#01122D',
    bgLight: '#FFFFFF',
    sidebarDark: '#01122D',
    sidebarLight: '#FFFFFF',
    navbarDark: '#01122D',
    navbarLight: '#FFFFFF',
    cardDark: '#041838',
    cardLight: '#FFFFFF'
  }
];

export const QUICK_COLOR_SWATCHES = [
  { name: 'Azul PMJ', color: '#0067FC' },
  { name: 'Ciano SOC', color: '#06B6D4' },
  { name: 'Verde Saúde', color: '#10B981' },
  { name: 'Roxo Gestão', color: '#8B5CF6' },
  { name: 'Vermelho Alerta', color: '#E11D48' },
  { name: 'Âmbar Fazenda', color: '#F59E0B' },
  { name: 'Índigo DBA', color: '#4F46E5' },
  { name: 'Teal Moderno', color: '#0D9488' },
  { name: 'Rosa Viva', color: '#F43F5E' },
  { name: 'Slate Neutro', color: '#475569' }
];

export const SIDEBAR_COLOR_SWATCHES = [
  { name: 'Azul Municipal', color: '#01122D', desc: 'Oficial PMJ' },
  { name: 'Preto Noturno', color: '#000B1D', desc: 'Preto Ônix' },
  { name: 'Branco Puro', color: '#FFFFFF', desc: 'Clean Claro' },
  { name: 'Slate Grafite', color: '#0F172A', desc: 'Moderno' },
  { name: 'Azul Petróleo', color: '#041838', desc: 'Profundo' },
  { name: 'Índigo Tech', color: '#1E1B4B', desc: 'Datacenter' },
  { name: 'Verde Escuro', color: '#064E3B', desc: 'Sustentável' },
  { name: 'Roxo Imperial', color: '#2E1065', desc: 'Executivo' }
];

export const NAVBAR_COLOR_SWATCHES = [
  { name: 'Azul Municipal', color: '#01122D', desc: 'Oficial GIHS' },
  { name: 'Branco Puro', color: '#FFFFFF', desc: 'Clean Claro' },
  { name: 'Preto Noturno', color: '#000B1D', desc: 'Ônix Foco' },
  { name: 'Slate Grafite', color: '#0F172A', desc: 'Moderno' },
  { name: 'Azul Petróleo', color: '#041838', desc: 'Profundo' },
  { name: 'Cinza Platina', color: '#F1F5F9', desc: 'Neutro' },
  { name: 'Índigo Noturno', color: '#1E1B4B', desc: 'Tech' },
  { name: 'Roxo Executivo', color: '#2E1065', desc: 'Governança' }
];

export const BACKGROUND_COLOR_SWATCHES = [
  { name: 'Azul Municipal', color: '#01122D', desc: 'Oficial GIHS' },
  { name: 'Branco Puro', color: '#FFFFFF', desc: 'Clean Total' },
  { name: 'Cinza Suave', color: '#F8FAFC', desc: 'Neutro Claro' },
  { name: 'Azul Noturno', color: '#000B1D', desc: 'Modo Foco' },
  { name: 'Slate Profundo', color: '#0B1120', desc: 'Datacenter' },
  { name: 'Cinza Grafite', color: '#0F172A', desc: 'Elegante' },
  { name: 'Marfim Suave', color: '#FDFBF7', desc: 'Quente' }
];

export const CARD_COLOR_SWATCHES = [
  { name: 'Azul Cartão PMJ', color: '#041838', desc: 'Padrão GIHS' },
  { name: 'Branco Puro', color: '#FFFFFF', desc: 'Clean com Sombra' },
  { name: 'Cinza Suave', color: '#F8FAFC', desc: 'Neutro Elegante' },
  { name: 'Slate Noturno', color: '#0F172A', desc: 'Moderno Dark' },
  { name: 'Preto Ônix', color: '#000B1D', desc: 'Contraste Máximo' },
  { name: 'Azul Municipal', color: '#01122D', desc: 'Fundo Integrado' },
  { name: 'Azul Marinho', color: '#092347', desc: 'Suave' },
  { name: 'Cinza Gelo', color: '#F1F5F9', desc: 'Claro Corporativo' }
];

// Determine if a hex color is light or dark (ITU-R BT.709 perceived luminance)
export const isColorLight = (hex: string): boolean => {
  if (!hex) return false;
  try {
    const clean = hex.replace('#', '').trim();
    let r = 0, g = 0, b = 0;
    if (clean.length === 3) {
      r = parseInt(clean[0] + clean[0], 16);
      g = parseInt(clean[1] + clean[1], 16);
      b = parseInt(clean[2] + clean[2], 16);
    } else if (clean.length === 6) {
      r = parseInt(clean.substring(0, 2), 16);
      g = parseInt(clean.substring(2, 4), 16);
      b = parseInt(clean.substring(4, 6), 16);
    } else {
      return false;
    }
    const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
    return luminance > 0.6;
  } catch {
    return false;
  }
};

// Helper to convert hex to RGB string for CSS vars
export const hexToRgbString = (hex: string): string => {
  try {
    const clean = hex.replace('#', '').trim();
    if (clean.length === 3) {
      const r = parseInt(clean[0] + clean[0], 16);
      const g = parseInt(clean[1] + clean[1], 16);
      const b = parseInt(clean[2] + clean[2], 16);
      return `${r}, ${g}, ${b}`;
    }
    if (clean.length === 6) {
      const r = parseInt(clean.substring(0, 2), 16);
      const g = parseInt(clean.substring(2, 4), 16);
      const b = parseInt(clean.substring(4, 6), 16);
      return `${r}, ${g}, ${b}`;
    }
  } catch {
    // fallback
  }
  return '0, 103, 252';
};

// Helper to calculate slightly lighter accent if not provided
export const deriveAccentColor = (primary: string): string => {
  const match = THEME_PRESETS.find(p => p.primary.toLowerCase() === primary.toLowerCase());
  if (match) return match.accent;
  try {
    const clean = primary.replace('#', '').trim();
    if (clean.length === 6) {
      const r = Math.min(255, parseInt(clean.substring(0, 2), 16) + 40);
      const g = Math.min(255, parseInt(clean.substring(2, 4), 16) + 40);
      const b = Math.min(255, parseInt(clean.substring(4, 6), 16) + 40);
      return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }
  } catch {
    // fallback
  }
  return '#00A6FC';
};

interface ThemeContextType {
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  toggleThemeMode: () => void;
  isDark: boolean;
  isLight: boolean;

  // Background Color Selection (Área Principal)
  backgroundColor: string;
  setBackgroundColor: (color: string) => void;
  isBgLight: boolean;

  // Sidebar Color Selection (Menu Lateral)
  sidebarColor: string;
  setSidebarColor: (color: string) => void;
  isSidebarLight: boolean;

  // Top Bar Color Selection (Navbar / Barra Superior)
  navbarColor: string;
  setNavbarColor: (color: string) => void;
  isNavbarLight: boolean;

  // Sub-screens / Cards Color Selection (Sub-telas / Cartões / Painéis)
  cardColor: string;
  setCardColor: (color: string) => void;
  isCardLight: boolean;

  // Primary & Accent Colors (Botões, Badges, Destaques)
  primaryColor: string;
  setPrimaryColor: (color: string) => void;
  accentColor: string;
  setAccentColor: (color: string) => void;

  activePresetId: string;
  applyPreset: (presetId: string) => void;
  isColorModalOpen: boolean;
  setIsColorModalOpen: (open: boolean) => void;
  resetTheme: () => void;
  bgMainClass: string;
  bgCardClass: string;
  textPrimaryClass: string;
  currentUserId: string;
  setCurrentUserId: (id: string) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUserId, setCurrentUserIdState] = useState<string>(() => {
    try {
      return localStorage.getItem('gihs_active_user_id') || 'user-master-victor-hugo';
    } catch {
      return 'user-master-victor-hugo';
    }
  });

  const activeUserIdRef = useRef<string>(currentUserId);

  // Load initial theme mode (global or user specific)
  const [themeMode, setThemeModeState] = useState<ThemeMode>(() => {
    try {
      const savedGlobal = localStorage.getItem('gihs_theme_active_mode');
      if (savedGlobal === 'light' || savedGlobal === 'dark') return savedGlobal;
      const uid = localStorage.getItem('gihs_active_user_id') || 'usr-default';
      const savedUser = localStorage.getItem(`gihs_theme_${uid}_mode`);
      if (savedUser === 'light' || savedUser === 'dark') return savedUser;
      return 'dark';
    } catch {
      return 'dark';
    }
  });

  // Load initial background color (Área Principal)
  const [backgroundColor, setBackgroundColorState] = useState<string>(() => {
    try {
      const savedGlobal = localStorage.getItem('gihs_theme_active_bg');
      if (savedGlobal && savedGlobal.startsWith('#')) return savedGlobal;
      const uid = localStorage.getItem('gihs_active_user_id') || 'usr-default';
      const savedUser = localStorage.getItem(`gihs_theme_${uid}_bg`);
      if (savedUser && savedUser.startsWith('#')) return savedUser;
      const mode = localStorage.getItem('gihs_theme_active_mode');
      return mode === 'light' ? '#FFFFFF' : '#01122D';
    } catch {
      return '#01122D';
    }
  });

  // Load initial sidebar color (Menu Lateral)
  const [sidebarColor, setSidebarColorState] = useState<string>(() => {
    try {
      const savedGlobal = localStorage.getItem('gihs_theme_active_sidebar');
      if (savedGlobal && savedGlobal.startsWith('#')) return savedGlobal;
      const uid = localStorage.getItem('gihs_active_user_id') || 'usr-default';
      const savedUser = localStorage.getItem(`gihs_theme_${uid}_sidebar`);
      if (savedUser && savedUser.startsWith('#')) return savedUser;
      const mode = localStorage.getItem('gihs_theme_active_mode');
      return mode === 'light' ? '#FFFFFF' : '#01122D';
    } catch {
      return '#01122D';
    }
  });

  // Load initial navbar color (Top Bar / Barra Superior)
  const [navbarColor, setNavbarColorState] = useState<string>(() => {
    try {
      const savedGlobal = localStorage.getItem('gihs_theme_active_navbar');
      if (savedGlobal && savedGlobal.startsWith('#')) return savedGlobal;
      const uid = localStorage.getItem('gihs_active_user_id') || 'usr-default';
      const savedUser = localStorage.getItem(`gihs_theme_${uid}_navbar`);
      if (savedUser && savedUser.startsWith('#')) return savedUser;
      const mode = localStorage.getItem('gihs_theme_active_mode');
      return mode === 'light' ? '#FFFFFF' : '#01122D';
    } catch {
      return '#01122D';
    }
  });

  // Load initial card / sub-screen color (Sub-telas / Cartões / Painéis)
  const [cardColor, setCardColorState] = useState<string>(() => {
    try {
      const savedGlobal = localStorage.getItem('gihs_theme_active_card');
      if (savedGlobal && savedGlobal.startsWith('#')) return savedGlobal;
      const uid = localStorage.getItem('gihs_active_user_id') || 'usr-default';
      const savedUser = localStorage.getItem(`gihs_theme_${uid}_card`);
      if (savedUser && savedUser.startsWith('#')) return savedUser;
      const mode = localStorage.getItem('gihs_theme_active_mode');
      return mode === 'light' ? '#FFFFFF' : '#041838';
    } catch {
      return '#041838';
    }
  });

  // Load initial primary color
  const [primaryColor, setPrimaryColorState] = useState<string>(() => {
    try {
      const savedGlobal = localStorage.getItem('gihs_theme_active_primary');
      if (savedGlobal && savedGlobal.startsWith('#')) return savedGlobal;
      const uid = localStorage.getItem('gihs_active_user_id') || 'usr-default';
      const savedUser = localStorage.getItem(`gihs_theme_${uid}_primary`);
      if (savedUser && savedUser.startsWith('#')) return savedUser;
      return '#0067FC';
    } catch {
      return '#0067FC';
    }
  });

  // Load initial accent color
  const [accentColor, setAccentColorState] = useState<string>(() => {
    try {
      const savedGlobal = localStorage.getItem('gihs_theme_active_accent');
      if (savedGlobal && savedGlobal.startsWith('#')) return savedGlobal;
      const uid = localStorage.getItem('gihs_active_user_id') || 'usr-default';
      const savedUser = localStorage.getItem(`gihs_theme_${uid}_accent`);
      if (savedUser && savedUser.startsWith('#')) return savedUser;
      return '#00A6FC';
    } catch {
      return '#00A6FC';
    }
  });

  // Load active preset ID
  const [activePresetId, setActivePresetId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('gihs_theme_active_preset');
      return saved || 'pmj_blue';
    } catch {
      return 'pmj_blue';
    }
  });

  const [isColorModalOpen, setIsColorModalOpen] = useState(false);

  // Synchronously update DOM variables and CSS classes
  const applyDomTheme = useCallback((
    mode: ThemeMode,
    primary: string,
    accent: string,
    bgCol: string,
    sbCol: string,
    nbCol: string,
    cdCol: string
  ) => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    const body = document.body;

    const rgbPrimary = hexToRgbString(primary);
    const rgbAccent = hexToRgbString(accent);

    const isBgL = isColorLight(bgCol);
    const isSbL = isColorLight(sbCol);
    const isNbL = isColorLight(nbCol);
    const isCdL = isColorLight(cdCol);

    // Dynamic brand color properties for real-time live application
    root.style.setProperty('--theme-primary', primary);
    root.style.setProperty('--theme-accent', accent);
    root.style.setProperty('--theme-primary-rgb', rgbPrimary);
    root.style.setProperty('--theme-accent-rgb', rgbAccent);
    root.style.setProperty('--gihs-blue-electric', primary);
    root.style.setProperty('--gihs-blue-mid', primary);
    root.style.setProperty('--gihs-blue-luminous', accent);
    root.style.setProperty('--gihs-blue-accent', primary);

    // Dynamic Layout Element Properties
    root.style.setProperty('--theme-bg-main', bgCol);
    root.style.setProperty('--theme-bg-sidebar', sbCol);
    root.style.setProperty('--theme-bg-navbar', nbCol);
    root.style.setProperty('--theme-bg-card', cdCol);

    if (isBgL) {
      root.classList.add('theme-light');
      root.classList.remove('theme-dark');
      body.classList.add('theme-light');
      body.classList.remove('theme-dark');

      root.style.setProperty('--theme-bg-contrast', '#F8FAFC');
      root.style.setProperty('--theme-text-main', '#0F172A');
      root.style.setProperty('--theme-border', '#E2E8F0');
      
      body.style.backgroundColor = bgCol;
      body.style.color = '#0F172A';
    } else {
      root.classList.add('theme-dark');
      root.classList.remove('theme-light');
      body.classList.add('theme-dark');
      body.classList.remove('theme-light');

      root.style.setProperty('--theme-bg-contrast', '#000B1D');
      root.style.setProperty('--theme-text-main', '#F8FAFC');
      root.style.setProperty('--theme-border', '#0A2854');

      body.style.backgroundColor = bgCol;
      body.style.color = '#F8FAFC';
    }

    // Sidebar DOM classes
    if (isSbL) {
      root.classList.add('sidebar-light');
      root.classList.remove('sidebar-dark');
      body.classList.add('sidebar-light');
      body.classList.remove('sidebar-dark');
    } else {
      root.classList.add('sidebar-dark');
      root.classList.remove('sidebar-light');
      body.classList.add('sidebar-dark');
      body.classList.remove('sidebar-light');
    }

    // Top Bar (Navbar) DOM classes
    if (isNbL) {
      root.classList.add('navbar-light');
      root.classList.remove('navbar-dark');
      body.classList.add('navbar-light');
      body.classList.remove('navbar-dark');
    } else {
      root.classList.add('navbar-dark');
      root.classList.remove('navbar-light');
      body.classList.add('navbar-dark');
      body.classList.remove('navbar-light');
    }

    // Cards / Sub-screens DOM classes
    if (isCdL) {
      root.classList.add('cards-light');
      root.classList.remove('cards-dark');
      body.classList.add('cards-light');
      body.classList.remove('cards-dark');
    } else {
      root.classList.add('cards-dark');
      root.classList.remove('cards-light');
      body.classList.add('cards-dark');
      body.classList.remove('cards-light');
    }
  }, []);

  // Set theme mode (light or dark)
  const setThemeMode = useCallback((mode: ThemeMode) => {
    setThemeModeState(mode);
    const newBg = mode === 'light' ? '#FFFFFF' : '#01122D';
    const newSb = mode === 'light' ? '#FFFFFF' : '#01122D';
    const newNb = mode === 'light' ? '#FFFFFF' : '#01122D';
    const newCd = mode === 'light' ? '#FFFFFF' : '#041838';

    setBackgroundColorState(newBg);
    setSidebarColorState(newSb);
    setNavbarColorState(newNb);
    setCardColorState(newCd);

    try {
      const uid = activeUserIdRef.current || 'usr-default';
      localStorage.setItem('gihs_theme_active_mode', mode);
      localStorage.setItem('gihs_theme_active_bg', newBg);
      localStorage.setItem('gihs_theme_active_sidebar', newSb);
      localStorage.setItem('gihs_theme_active_navbar', newNb);
      localStorage.setItem('gihs_theme_active_card', newCd);

      localStorage.setItem(`gihs_theme_${uid}_mode`, mode);
      localStorage.setItem(`gihs_theme_${uid}_bg`, newBg);
      localStorage.setItem(`gihs_theme_${uid}_sidebar`, newSb);
      localStorage.setItem(`gihs_theme_${uid}_navbar`, newNb);
      localStorage.setItem(`gihs_theme_${uid}_card`, newCd);
    } catch {
      // ignore
    }
    applyDomTheme(mode, primaryColor, accentColor, newBg, newSb, newNb, newCd);
  }, [applyDomTheme, primaryColor, accentColor]);

  // Toggle mode
  const toggleThemeMode = useCallback(() => {
    setThemeModeState(prev => {
      const next = prev === 'dark' ? 'light' : 'dark';
      const newBg = next === 'light' ? '#FFFFFF' : '#01122D';
      const newSb = next === 'light' ? '#FFFFFF' : '#01122D';
      const newNb = next === 'light' ? '#FFFFFF' : '#01122D';
      const newCd = next === 'light' ? '#FFFFFF' : '#041838';

      setBackgroundColorState(newBg);
      setSidebarColorState(newSb);
      setNavbarColorState(newNb);
      setCardColorState(newCd);

      try {
        const uid = activeUserIdRef.current || 'usr-default';
        localStorage.setItem('gihs_theme_active_mode', next);
        localStorage.setItem('gihs_theme_active_bg', newBg);
        localStorage.setItem('gihs_theme_active_sidebar', newSb);
        localStorage.setItem('gihs_theme_active_navbar', newNb);
        localStorage.setItem('gihs_theme_active_card', newCd);

        localStorage.setItem(`gihs_theme_${uid}_mode`, next);
        localStorage.setItem(`gihs_theme_${uid}_bg`, newBg);
        localStorage.setItem(`gihs_theme_${uid}_sidebar`, newSb);
        localStorage.setItem(`gihs_theme_${uid}_navbar`, newNb);
        localStorage.setItem(`gihs_theme_${uid}_card`, newCd);
      } catch {
        // ignore
      }
      applyDomTheme(next, primaryColor, accentColor, newBg, newSb, newNb, newCd);
      return next;
    });
  }, [applyDomTheme, primaryColor, accentColor]);

  // Set background color freely (Área Principal)
  const setBackgroundColor = useCallback((color: string) => {
    if (!color) return;
    const safeColor = color.trim().startsWith('#') ? color.trim() : `#${color.trim()}`;
    setBackgroundColorState(safeColor);
    const isLightBg = isColorLight(safeColor);
    const newMode: ThemeMode = isLightBg ? 'light' : 'dark';
    setThemeModeState(newMode);

    try {
      const uid = activeUserIdRef.current || 'usr-default';
      localStorage.setItem('gihs_theme_active_bg', safeColor);
      localStorage.setItem('gihs_theme_active_mode', newMode);
      localStorage.setItem(`gihs_theme_${uid}_bg`, safeColor);
      localStorage.setItem(`gihs_theme_${uid}_mode`, newMode);
    } catch {
      // ignore
    }

    applyDomTheme(newMode, primaryColor, accentColor, safeColor, sidebarColor, navbarColor, cardColor);
  }, [applyDomTheme, primaryColor, accentColor, sidebarColor, navbarColor, cardColor]);

  // Set sidebar color freely (Menu Lateral)
  const setSidebarColor = useCallback((color: string) => {
    if (!color) return;
    const safeColor = color.trim().startsWith('#') ? color.trim() : `#${color.trim()}`;
    setSidebarColorState(safeColor);

    try {
      const uid = activeUserIdRef.current || 'usr-default';
      localStorage.setItem('gihs_theme_active_sidebar', safeColor);
      localStorage.setItem(`gihs_theme_${uid}_sidebar`, safeColor);
    } catch {
      // ignore
    }

    applyDomTheme(themeMode, primaryColor, accentColor, backgroundColor, safeColor, navbarColor, cardColor);
  }, [applyDomTheme, themeMode, primaryColor, accentColor, backgroundColor, navbarColor, cardColor]);

  // Set navbar color freely (Top Bar / Barra Superior)
  const setNavbarColor = useCallback((color: string) => {
    if (!color) return;
    const safeColor = color.trim().startsWith('#') ? color.trim() : `#${color.trim()}`;
    setNavbarColorState(safeColor);

    try {
      const uid = activeUserIdRef.current || 'usr-default';
      localStorage.setItem('gihs_theme_active_navbar', safeColor);
      localStorage.setItem(`gihs_theme_${uid}_navbar`, safeColor);
    } catch {
      // ignore
    }

    applyDomTheme(themeMode, primaryColor, accentColor, backgroundColor, sidebarColor, safeColor, cardColor);
  }, [applyDomTheme, themeMode, primaryColor, accentColor, backgroundColor, sidebarColor, cardColor]);

  // Set card color freely (Sub-telas / Cartões / Painéis)
  const setCardColor = useCallback((color: string) => {
    if (!color) return;
    const safeColor = color.trim().startsWith('#') ? color.trim() : `#${color.trim()}`;
    setCardColorState(safeColor);

    try {
      const uid = activeUserIdRef.current || 'usr-default';
      localStorage.setItem('gihs_theme_active_card', safeColor);
      localStorage.setItem(`gihs_theme_${uid}_card`, safeColor);
    } catch {
      // ignore
    }

    applyDomTheme(themeMode, primaryColor, accentColor, backgroundColor, sidebarColor, navbarColor, safeColor);
  }, [applyDomTheme, themeMode, primaryColor, accentColor, backgroundColor, sidebarColor, navbarColor]);

  // Set primary brand color
  const setPrimaryColor = useCallback((color: string) => {
    if (!color) return;
    const safeColor = color.trim().startsWith('#') ? color.trim() : `#${color.trim()}`;
    const nextAccent = deriveAccentColor(safeColor);

    setPrimaryColorState(safeColor);
    setAccentColorState(nextAccent);
    setActivePresetId('custom');

    try {
      const uid = activeUserIdRef.current || 'usr-default';
      localStorage.setItem('gihs_theme_active_primary', safeColor);
      localStorage.setItem('gihs_theme_active_accent', nextAccent);
      localStorage.setItem('gihs_theme_active_preset', 'custom');
      localStorage.setItem(`gihs_theme_${uid}_primary`, safeColor);
      localStorage.setItem(`gihs_theme_${uid}_accent`, nextAccent);
      localStorage.setItem(`gihs_theme_${uid}_preset`, 'custom');
    } catch {
      // ignore
    }

    applyDomTheme(themeMode, safeColor, nextAccent, backgroundColor, sidebarColor, navbarColor, cardColor);
  }, [applyDomTheme, themeMode, backgroundColor, sidebarColor, navbarColor, cardColor]);

  // Set accent color
  const setAccentColor = useCallback((color: string) => {
    if (!color) return;
    const safeColor = color.trim().startsWith('#') ? color.trim() : `#${color.trim()}`;
    setAccentColorState(safeColor);

    try {
      const uid = activeUserIdRef.current || 'usr-default';
      localStorage.setItem('gihs_theme_active_accent', safeColor);
      localStorage.setItem(`gihs_theme_${uid}_accent`, safeColor);
    } catch {
      // ignore
    }

    applyDomTheme(themeMode, primaryColor, safeColor, backgroundColor, sidebarColor, navbarColor, cardColor);
  }, [applyDomTheme, themeMode, primaryColor, backgroundColor, sidebarColor, navbarColor, cardColor]);

  // Apply one of the presets
  const applyPreset = useCallback((presetId: string) => {
    const preset = THEME_PRESETS.find(p => p.id === presetId);
    if (preset) {
      setPrimaryColorState(preset.primary);
      setAccentColorState(preset.accent);
      setActivePresetId(preset.id);

      const targetBg = themeMode === 'light' ? preset.bgLight : preset.bgDark;
      const targetSb = themeMode === 'light' ? (preset.sidebarLight || '#FFFFFF') : (preset.sidebarDark || '#01122D');
      const targetNb = themeMode === 'light' ? (preset.navbarLight || '#FFFFFF') : (preset.navbarDark || '#01122D');
      const targetCd = themeMode === 'light' ? (preset.cardLight || '#FFFFFF') : (preset.cardDark || '#041838');

      setBackgroundColorState(targetBg);
      setSidebarColorState(targetSb);
      setNavbarColorState(targetNb);
      setCardColorState(targetCd);

      try {
        const uid = activeUserIdRef.current || 'usr-default';
        localStorage.setItem('gihs_theme_active_primary', preset.primary);
        localStorage.setItem('gihs_theme_active_accent', preset.accent);
        localStorage.setItem('gihs_theme_active_bg', targetBg);
        localStorage.setItem('gihs_theme_active_sidebar', targetSb);
        localStorage.setItem('gihs_theme_active_navbar', targetNb);
        localStorage.setItem('gihs_theme_active_card', targetCd);
        localStorage.setItem('gihs_theme_active_preset', preset.id);

        localStorage.setItem(`gihs_theme_${uid}_primary`, preset.primary);
        localStorage.setItem(`gihs_theme_${uid}_accent`, preset.accent);
        localStorage.setItem(`gihs_theme_${uid}_bg`, targetBg);
        localStorage.setItem(`gihs_theme_${uid}_sidebar`, targetSb);
        localStorage.setItem(`gihs_theme_${uid}_navbar`, targetNb);
        localStorage.setItem(`gihs_theme_${uid}_card`, targetCd);
        localStorage.setItem(`gihs_theme_${uid}_preset`, preset.id);
      } catch {
        // ignore
      }

      applyDomTheme(themeMode, preset.primary, preset.accent, targetBg, targetSb, targetNb, targetCd);
    }
  }, [applyDomTheme, themeMode]);

  // Reset theme to official PMJ Blue
  const resetTheme = useCallback(() => {
    const defaultPreset = THEME_PRESETS[0];
    setThemeModeState('dark');
    setPrimaryColorState(defaultPreset.primary);
    setAccentColorState(defaultPreset.accent);
    setBackgroundColorState(defaultPreset.bgDark);
    setSidebarColorState(defaultPreset.sidebarDark || '#01122D');
    setNavbarColorState(defaultPreset.navbarDark || '#01122D');
    setCardColorState(defaultPreset.cardDark || '#041838');
    setActivePresetId(defaultPreset.id);

    try {
      const uid = activeUserIdRef.current || 'usr-default';
      localStorage.setItem('gihs_theme_active_mode', 'dark');
      localStorage.setItem('gihs_theme_active_primary', defaultPreset.primary);
      localStorage.setItem('gihs_theme_active_accent', defaultPreset.accent);
      localStorage.setItem('gihs_theme_active_bg', defaultPreset.bgDark);
      localStorage.setItem('gihs_theme_active_sidebar', defaultPreset.sidebarDark || '#01122D');
      localStorage.setItem('gihs_theme_active_navbar', defaultPreset.navbarDark || '#01122D');
      localStorage.setItem('gihs_theme_active_card', defaultPreset.cardDark || '#041838');
      localStorage.setItem('gihs_theme_active_preset', defaultPreset.id);

      localStorage.setItem(`gihs_theme_${uid}_mode`, 'dark');
      localStorage.setItem(`gihs_theme_${uid}_primary`, defaultPreset.primary);
      localStorage.setItem(`gihs_theme_${uid}_accent`, defaultPreset.accent);
      localStorage.setItem(`gihs_theme_${uid}_bg`, defaultPreset.bgDark);
      localStorage.setItem(`gihs_theme_${uid}_sidebar`, defaultPreset.sidebarDark || '#01122D');
      localStorage.setItem(`gihs_theme_${uid}_navbar`, defaultPreset.navbarDark || '#01122D');
      localStorage.setItem(`gihs_theme_${uid}_card`, defaultPreset.cardDark || '#041838');
      localStorage.setItem(`gihs_theme_${uid}_preset`, defaultPreset.id);
    } catch {
      // ignore
    }

    applyDomTheme(
      'dark',
      defaultPreset.primary,
      defaultPreset.accent,
      defaultPreset.bgDark,
      defaultPreset.sidebarDark || '#01122D',
      defaultPreset.navbarDark || '#01122D',
      defaultPreset.cardDark || '#041838'
    );
  }, [applyDomTheme]);

  // When current user changes from outside (e.g. login or switch user)
  const setCurrentUserId = useCallback((uid: string) => {
    if (!uid || uid === activeUserIdRef.current) return;
    activeUserIdRef.current = uid;
    setCurrentUserIdState(uid);

    try {
      localStorage.setItem('gihs_active_user_id', uid);
      // Load user customized preferences if stored
      const savedMode = localStorage.getItem(`gihs_theme_${uid}_mode`);
      if (savedMode === 'light' || savedMode === 'dark') {
        setThemeModeState(savedMode);
      }
      const savedBg = localStorage.getItem(`gihs_theme_${uid}_bg`);
      if (savedBg && savedBg.startsWith('#')) {
        setBackgroundColorState(savedBg);
      }
      const savedSidebar = localStorage.getItem(`gihs_theme_${uid}_sidebar`);
      if (savedSidebar && savedSidebar.startsWith('#')) {
        setSidebarColorState(savedSidebar);
      }
      const savedNavbar = localStorage.getItem(`gihs_theme_${uid}_navbar`);
      if (savedNavbar && savedNavbar.startsWith('#')) {
        setNavbarColorState(savedNavbar);
      }
      const savedCard = localStorage.getItem(`gihs_theme_${uid}_card`);
      if (savedCard && savedCard.startsWith('#')) {
        setCardColorState(savedCard);
      }
      const savedPrimary = localStorage.getItem(`gihs_theme_${uid}_primary`);
      if (savedPrimary && savedPrimary.startsWith('#')) {
        setPrimaryColorState(savedPrimary);
      }
      const savedAccent = localStorage.getItem(`gihs_theme_${uid}_accent`);
      if (savedAccent && savedAccent.startsWith('#')) {
        setAccentColorState(savedAccent);
      }
      const savedPreset = localStorage.getItem(`gihs_theme_${uid}_preset`);
      if (savedPreset) {
        setActivePresetId(savedPreset);
      }
    } catch {
      // ignore
    }
  }, []);

  // Initial and reactive DOM application
  useEffect(() => {
    applyDomTheme(themeMode, primaryColor, accentColor, backgroundColor, sidebarColor, navbarColor, cardColor);
  }, [themeMode, primaryColor, accentColor, backgroundColor, sidebarColor, navbarColor, cardColor, applyDomTheme]);

  const isBgLight = isColorLight(backgroundColor);
  const isSidebarLight = isColorLight(sidebarColor);
  const isNavbarLight = isColorLight(navbarColor);
  const isCardLight = isColorLight(cardColor);

  const isDark = !isBgLight;
  const isLight = isBgLight;

  // Dynamic CSS helper classes for layout
  const bgMainClass = isLight ? 'bg-white' : 'bg-[#01122D]';
  const bgCardClass = isCardLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#041838] border-[#0A2854]';
  const textPrimaryClass = isLight ? 'text-slate-900' : 'text-white';

  return (
    <ThemeContext.Provider
      value={{
        themeMode,
        setThemeMode,
        toggleThemeMode,
        isDark,
        isLight,

        backgroundColor,
        setBackgroundColor,
        isBgLight,

        sidebarColor,
        setSidebarColor,
        isSidebarLight,

        navbarColor,
        setNavbarColor,
        isNavbarLight,

        cardColor,
        setCardColor,
        isCardLight,

        primaryColor,
        setPrimaryColor,
        accentColor,
        setAccentColor,
        activePresetId,
        applyPreset,
        isColorModalOpen,
        setIsColorModalOpen,
        resetTheme,
        bgMainClass,
        bgCardClass,
        textPrimaryClass,
        currentUserId,
        setCurrentUserId
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
