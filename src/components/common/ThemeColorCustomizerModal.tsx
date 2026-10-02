import React, { useState, useEffect } from 'react';
import {
  Palette,
  Sun,
  Moon,
  Check,
  RotateCcw,
  X,
  Sparkles,
  Layers,
  CheckCircle2,
  Brush,
  LayoutGrid,
  MenuSquare,
  PanelTop,
  CopyCheck
} from 'lucide-react';
import {
  useTheme,
  THEME_PRESETS,
  QUICK_COLOR_SWATCHES,
  SIDEBAR_COLOR_SWATCHES,
  NAVBAR_COLOR_SWATCHES,
  BACKGROUND_COLOR_SWATCHES,
  CARD_COLOR_SWATCHES,
  isColorLight
} from '../../contexts/ThemeContext';

export const ThemeColorCustomizerModal: React.FC = () => {
  const {
    themeMode,
    setThemeMode,
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
    activePresetId,
    applyPreset,
    isColorModalOpen,
    setIsColorModalOpen,
    resetTheme
  } = useTheme();

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'bg' | 'sidebar' | 'navbar' | 'card' | 'primary'>('all');

  // Input states for free hex editing
  const [hexPrimary, setHexPrimary] = useState(primaryColor);
  const [hexBg, setHexBg] = useState(backgroundColor);
  const [hexSidebar, setHexSidebar] = useState(sidebarColor);
  const [hexNavbar, setHexNavbar] = useState(navbarColor);
  const [hexCard, setHexCard] = useState(cardColor);

  useEffect(() => {
    setHexPrimary(primaryColor);
  }, [primaryColor]);

  useEffect(() => {
    setHexBg(backgroundColor);
  }, [backgroundColor]);

  useEffect(() => {
    setHexSidebar(sidebarColor);
  }, [sidebarColor]);

  useEffect(() => {
    setHexNavbar(navbarColor);
  }, [navbarColor]);

  useEffect(() => {
    setHexCard(cardColor);
  }, [cardColor]);

  if (!isColorModalOpen) return null;

  const showFeedback = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3200);
  };

  const handleHexPrimaryChange = (val: string) => {
    setHexPrimary(val);
    const cleaned = val.trim();
    if (/^#[0-9A-Fa-f]{6}$/.test(cleaned) || /^[0-9A-Fa-f]{6}$/.test(cleaned)) {
      const formatted = cleaned.startsWith('#') ? cleaned : `#${cleaned}`;
      setPrimaryColor(formatted);
      showFeedback(`✓ Cor primária ${formatted.toUpperCase()} aplicada!`);
    }
  };

  const handleHexBgChange = (val: string) => {
    setHexBg(val);
    const cleaned = val.trim();
    if (/^#[0-9A-Fa-f]{6}$/.test(cleaned) || /^[0-9A-Fa-f]{6}$/.test(cleaned)) {
      const formatted = cleaned.startsWith('#') ? cleaned : `#${cleaned}`;
      setBackgroundColor(formatted);
      showFeedback(`✓ Cor do fundo ${formatted.toUpperCase()} aplicada!`);
    }
  };

  const handleHexSidebarChange = (val: string) => {
    setHexSidebar(val);
    const cleaned = val.trim();
    if (/^#[0-9A-Fa-f]{6}$/.test(cleaned) || /^[0-9A-Fa-f]{6}$/.test(cleaned)) {
      const formatted = cleaned.startsWith('#') ? cleaned : `#${cleaned}`;
      setSidebarColor(formatted);
      showFeedback(`✓ Cor da sidebar ${formatted.toUpperCase()} aplicada!`);
    }
  };

  const handleHexNavbarChange = (val: string) => {
    setHexNavbar(val);
    const cleaned = val.trim();
    if (/^#[0-9A-Fa-f]{6}$/.test(cleaned) || /^[0-9A-Fa-f]{6}$/.test(cleaned)) {
      const formatted = cleaned.startsWith('#') ? cleaned : `#${cleaned}`;
      setNavbarColor(formatted);
      showFeedback(`✓ Cor da top bar ${formatted.toUpperCase()} aplicada!`);
    }
  };

  const handleHexCardChange = (val: string) => {
    setHexCard(val);
    const cleaned = val.trim();
    if (/^#[0-9A-Fa-f]{6}$/.test(cleaned) || /^[0-9A-Fa-f]{6}$/.test(cleaned)) {
      const formatted = cleaned.startsWith('#') ? cleaned : `#${cleaned}`;
      setCardColor(formatted);
      showFeedback(`✓ Cor das sub-telas ${formatted.toUpperCase()} aplicada!`);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200">
      <div 
        id="modal-customizacao-cores"
        className="bg-[#041838] border border-[#0A2854] text-slate-100 rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh]"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#0A2854] bg-[#021026] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg transition-transform"
              style={{ backgroundColor: primaryColor }}
            >
              <Palette className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                Personalização de Cores & Layout
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-cyan-300 border border-white/15">
                  Por Usuário
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Selecione as cores da <strong>Top Bar</strong>, <strong>Sidebar</strong>, <strong>Fundo</strong> e <strong>Sub-telas</strong>
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsColorModalOpen(false)}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Fechar personalização"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Filter Pills */}
        <div className="px-5 pt-3 pb-2 bg-[#03142e] border-b border-[#0A2854] flex items-center gap-1.5 overflow-x-auto text-xs font-bold custom-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'all'
                ? 'bg-[#0067FC] text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            Visão Geral Completa
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('bg')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'bg'
                ? 'bg-[#0067FC] text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>1. Cor do Fundo</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('sidebar')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'sidebar'
                ? 'bg-[#0067FC] text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <MenuSquare className="w-3.5 h-3.5" />
            <span>2. Cor da Sidebar</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('navbar')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'navbar'
                ? 'bg-[#0067FC] text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <PanelTop className="w-3.5 h-3.5" />
            <span>3. Cor da Top Bar</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('card')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'card'
                ? 'bg-[#0067FC] text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>4. Sub-telas & Cartões</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('primary')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'primary'
                ? 'bg-[#0067FC] text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Brush className="w-3.5 h-3.5" />
            <span>5. Cor Primária</span>
          </button>
        </div>

        {/* Feedback Alert */}
        {toastMessage && (
          <div className="mx-5 mt-3 p-3 rounded-xl bg-emerald-950/90 border border-emerald-500/80 text-emerald-200 text-xs flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {/* =========================================================
              SEÇÃO 1: COR DO FUNDO DA TELA (BACKGROUND)
              ========================================================= */}
          {(activeTab === 'all' || activeTab === 'bg') && (
            <div className="space-y-3.5 p-4 rounded-2xl bg-[#021026] border border-[#0A2854]">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Layers className="w-4 h-4 text-cyan-400" />
                  <span>1. Cor do Fundo da Tela (Área Principal)</span>
                </label>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full border border-white/40 shadow-xs" style={{ backgroundColor }} />
                  <span className="text-[11px] font-mono text-cyan-300 font-bold">{backgroundColor}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-bold bg-white/10 text-slate-300">
                    {isBgLight ? 'Modo Claro' : 'Modo Escuro'}
                  </span>
                </div>
              </div>

              {/* Dois modos rápidos essenciais: Fundo Azul vs Fundo Branco */}
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setBackgroundColor('#01122D');
                    showFeedback('✓ Fundo Azul Municipal (#01122D) aplicado!');
                  }}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                    backgroundColor.toLowerCase() === '#01122d'
                      ? 'border-cyan-400 ring-2 ring-cyan-400/40 bg-[#01122D] shadow-md'
                      : 'border-[#0A2854] bg-[#01122D]/60 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-[#0B254E] flex items-center justify-center text-cyan-400 shrink-0">
                      <Moon className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white block">Fundo Azul Municipal</span>
                      <span className="text-[10px] text-slate-400 font-mono">#01122D</span>
                    </div>
                  </div>
                  {backgroundColor.toLowerCase() === '#01122d' && (
                    <Check className="w-4 h-4 text-cyan-400 stroke-[3]" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setBackgroundColor('#FFFFFF');
                    showFeedback('✓ Fundo Branco (#FFFFFF) aplicado!');
                  }}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                    backgroundColor.toLowerCase() === '#ffffff'
                      ? 'border-amber-400 ring-2 ring-amber-400/40 bg-slate-900 shadow-md'
                      : 'border-[#0A2854] bg-[#01122D]/60 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-amber-400/20 text-amber-300 flex items-center justify-center shrink-0">
                      <Sun className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white block">Fundo Branco Clean</span>
                      <span className="text-[10px] text-slate-400 font-mono">#FFFFFF</span>
                    </div>
                  </div>
                  {backgroundColor.toLowerCase() === '#ffffff' && (
                    <Check className="w-4 h-4 text-amber-400 stroke-[3]" />
                  )}
                </button>
              </div>

              {/* Tons Recomendados de Fundo */}
              <div className="space-y-1.5 pt-2">
                <span className="text-[11px] text-slate-400 font-semibold block">Tons Recomendados de Fundo:</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {BACKGROUND_COLOR_SWATCHES.map((swatch) => {
                    const isSelected = backgroundColor.toLowerCase() === swatch.color.toLowerCase();
                    return (
                      <button
                        key={swatch.color}
                        type="button"
                        onClick={() => {
                          setBackgroundColor(swatch.color);
                          showFeedback(`✓ Fundo "${swatch.name}" (${swatch.color}) aplicado.`);
                        }}
                        className={`p-2 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2 ${
                          isSelected
                            ? 'border-white ring-2 ring-white/40 bg-white/10 shadow-md'
                            : 'border-[#0A2854] bg-[#03142e] hover:border-slate-700'
                        }`}
                      >
                        <span 
                          className="w-5 h-5 rounded-lg border border-white/20 shrink-0"
                          style={{ backgroundColor: swatch.color }}
                        />
                        <div className="min-w-0 flex-1">
                          <span className="text-[11px] font-bold text-white block truncate">{swatch.name}</span>
                          <span className="text-[9px] text-slate-400 font-mono truncate">{swatch.desc}</span>
                        </div>
                        {isSelected && <Check className="w-3.5 h-3.5 text-white shrink-0 stroke-[3]" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Seletor Livre de Fundo */}
              <div className="pt-2 border-t border-[#0A2854] flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <input
                    type="color"
                    value={backgroundColor.startsWith('#') && backgroundColor.length === 7 ? backgroundColor : '#01122D'}
                    onChange={(e) => {
                      const val = e.target.value;
                      setBackgroundColor(val);
                      setHexBg(val);
                      showFeedback(`✓ Fundo ${val.toUpperCase()} selecionado.`);
                    }}
                    className="w-9 h-9 rounded-xl cursor-pointer bg-transparent border-0 p-0 shadow-sm"
                    title="Abrir roda de cores para o Fundo"
                  />
                  <div>
                    <span className="text-xs font-bold text-white block">Roda Livre de Cores do Fundo</span>
                    <span className="text-[10px] text-slate-400">Escolha qualquer tom hexadecimal</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-mono text-slate-400">HEX:</span>
                  <input
                    type="text"
                    value={hexBg}
                    onChange={(e) => handleHexBgChange(e.target.value)}
                    maxLength={7}
                    placeholder="#01122D"
                    className="w-24 px-2.5 py-1.5 bg-[#01122D] border border-[#0A2854] rounded-xl text-xs font-mono font-bold text-white text-center focus:outline-none focus:border-cyan-400 uppercase"
                  />
                </div>
              </div>
            </div>
          )}

          {/* =========================================================
              SEÇÃO 2: COR DA SIDEBAR (MENU LATERAL)
              ========================================================= */}
          {(activeTab === 'all' || activeTab === 'sidebar') && (
            <div className="space-y-3.5 p-4 rounded-2xl bg-[#021026] border border-[#0A2854]">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <MenuSquare className="w-4 h-4 text-cyan-400" />
                  <span>2. Cor da Sidebar (Menu Lateral)</span>
                </label>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full border border-white/40 shadow-xs" style={{ backgroundColor: sidebarColor }} />
                  <span className="text-[11px] font-mono text-cyan-300 font-bold">{sidebarColor}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-bold bg-white/10 text-slate-300">
                    {isSidebarLight ? 'Sidebar Clara' : 'Sidebar Escura'}
                  </span>
                </div>
              </div>

              {/* Tons Recomendados de Sidebar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {SIDEBAR_COLOR_SWATCHES.map((swatch) => {
                  const isSelected = sidebarColor.toLowerCase() === swatch.color.toLowerCase();
                  return (
                    <button
                      key={swatch.color}
                      type="button"
                      onClick={() => {
                        setSidebarColor(swatch.color);
                        showFeedback(`✓ Sidebar "${swatch.name}" (${swatch.color}) aplicada.`);
                      }}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                        isSelected
                          ? 'border-white ring-2 ring-white/40 bg-white/10 shadow-md'
                          : 'border-[#0A2854] bg-[#03142e] hover:border-slate-700'
                      }`}
                    >
                      <span 
                        className="w-5 h-5 rounded-lg border border-white/20 shrink-0 shadow-xs"
                        style={{ backgroundColor: swatch.color }}
                      />
                      <div className="min-w-0 flex-1">
                        <span className="text-[11px] font-bold text-white block truncate">{swatch.name}</span>
                        <span className="text-[9px] text-slate-400 font-mono truncate">{swatch.desc}</span>
                      </div>
                      {isSelected && <Check className="w-3.5 h-3.5 text-white shrink-0 stroke-[3]" />}
                    </button>
                  );
                })}
              </div>

              {/* Seletor Livre de Sidebar */}
              <div className="pt-2 border-t border-[#0A2854] flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <input
                    type="color"
                    value={sidebarColor.startsWith('#') && sidebarColor.length === 7 ? sidebarColor : '#01122D'}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSidebarColor(val);
                      setHexSidebar(val);
                      showFeedback(`✓ Sidebar ${val.toUpperCase()} selecionada.`);
                    }}
                    className="w-9 h-9 rounded-xl cursor-pointer bg-transparent border-0 p-0 shadow-sm"
                    title="Abrir roda de cores para a Sidebar"
                  />
                  <div>
                    <span className="text-xs font-bold text-white block">Roda Livre de Cores da Sidebar</span>
                    <span className="text-[10px] text-slate-400">Escolha qualquer tom hexadecimal</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-mono text-slate-400">HEX:</span>
                  <input
                    type="text"
                    value={hexSidebar}
                    onChange={(e) => handleHexSidebarChange(e.target.value)}
                    maxLength={7}
                    placeholder="#01122D"
                    className="w-24 px-2.5 py-1.5 bg-[#01122D] border border-[#0A2854] rounded-xl text-xs font-mono font-bold text-white text-center focus:outline-none focus:border-cyan-400 uppercase"
                  />
                </div>
              </div>
            </div>
          )}

          {/* =========================================================
              SEÇÃO 3: COR DA TOP BAR (NAVBAR / CABEÇALHO SUPERIOR)
              ========================================================= */}
          {(activeTab === 'all' || activeTab === 'navbar') && (
            <div className="space-y-3.5 p-4 rounded-2xl bg-[#021026] border border-[#0A2854]">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <PanelTop className="w-4 h-4 text-cyan-400" />
                  <span>3. Cor da Top Bar (Barra Superior / Navbar)</span>
                </label>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full border border-white/40 shadow-xs" style={{ backgroundColor: navbarColor }} />
                  <span className="text-[11px] font-mono text-cyan-300 font-bold">{navbarColor}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-bold bg-white/10 text-slate-300">
                    {isNavbarLight ? 'Top Bar Clara' : 'Top Bar Escura'}
                  </span>
                </div>
              </div>

              {/* Tons Recomendados de Top Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {NAVBAR_COLOR_SWATCHES.map((swatch) => {
                  const isSelected = navbarColor.toLowerCase() === swatch.color.toLowerCase();
                  return (
                    <button
                      key={swatch.color}
                      type="button"
                      onClick={() => {
                        setNavbarColor(swatch.color);
                        showFeedback(`✓ Top Bar "${swatch.name}" (${swatch.color}) aplicada.`);
                      }}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                        isSelected
                          ? 'border-white ring-2 ring-white/40 bg-white/10 shadow-md'
                          : 'border-[#0A2854] bg-[#03142e] hover:border-slate-700'
                      }`}
                    >
                      <span 
                        className="w-5 h-5 rounded-lg border border-white/20 shrink-0 shadow-xs"
                        style={{ backgroundColor: swatch.color }}
                      />
                      <div className="min-w-0 flex-1">
                        <span className="text-[11px] font-bold text-white block truncate">{swatch.name}</span>
                        <span className="text-[9px] text-slate-400 font-mono truncate">{swatch.desc}</span>
                      </div>
                      {isSelected && <Check className="w-3.5 h-3.5 text-white shrink-0 stroke-[3]" />}
                    </button>
                  );
                })}
              </div>

              {/* Seletor Livre de Top Bar */}
              <div className="pt-2 border-t border-[#0A2854] flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <input
                    type="color"
                    value={navbarColor.startsWith('#') && navbarColor.length === 7 ? navbarColor : '#01122D'}
                    onChange={(e) => {
                      const val = e.target.value;
                      setNavbarColor(val);
                      setHexNavbar(val);
                      showFeedback(`✓ Top Bar ${val.toUpperCase()} selecionada.`);
                    }}
                    className="w-9 h-9 rounded-xl cursor-pointer bg-transparent border-0 p-0 shadow-sm"
                    title="Abrir roda de cores para a Top Bar"
                  />
                  <div>
                    <span className="text-xs font-bold text-white block">Roda Livre de Cores da Top Bar</span>
                    <span className="text-[10px] text-slate-400">Escolha qualquer tom hexadecimal para o cabeçalho</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-mono text-slate-400">HEX:</span>
                  <input
                    type="text"
                    value={hexNavbar}
                    onChange={(e) => handleHexNavbarChange(e.target.value)}
                    maxLength={7}
                    placeholder="#01122D"
                    className="w-24 px-2.5 py-1.5 bg-[#01122D] border border-[#0A2854] rounded-xl text-xs font-mono font-bold text-white text-center focus:outline-none focus:border-cyan-400 uppercase"
                  />
                </div>
              </div>
            </div>
          )}

          {/* =========================================================
              SEÇÃO 4: COR DAS SUB-TELAS & CARTÕES (CARDS & CONTAINERS)
              ========================================================= */}
          {(activeTab === 'all' || activeTab === 'card') && (
            <div className="space-y-3.5 p-4 rounded-2xl bg-[#021026] border border-[#0A2854]">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <LayoutGrid className="w-4 h-4 text-cyan-400" />
                  <span>4. Cor das Sub-telas (Cartões, Painéis & Containers)</span>
                </label>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full border border-white/40 shadow-xs" style={{ backgroundColor: cardColor }} />
                  <span className="text-[11px] font-mono text-cyan-300 font-bold">{cardColor}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-bold bg-white/10 text-slate-300">
                    {isCardLight ? 'Sub-telas Claras' : 'Sub-telas Escuras'}
                  </span>
                </div>
              </div>

              {/* Tons Recomendados de Sub-telas */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {CARD_COLOR_SWATCHES.map((swatch) => {
                  const isSelected = cardColor.toLowerCase() === swatch.color.toLowerCase();
                  return (
                    <button
                      key={swatch.color}
                      type="button"
                      onClick={() => {
                        setCardColor(swatch.color);
                        showFeedback(`✓ Sub-telas "${swatch.name}" (${swatch.color}) aplicadas.`);
                      }}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                        isSelected
                          ? 'border-white ring-2 ring-white/40 bg-white/10 shadow-md'
                          : 'border-[#0A2854] bg-[#03142e] hover:border-slate-700'
                      }`}
                    >
                      <span 
                        className="w-5 h-5 rounded-lg border border-white/20 shrink-0 shadow-xs"
                        style={{ backgroundColor: swatch.color }}
                      />
                      <div className="min-w-0 flex-1">
                        <span className="text-[11px] font-bold text-white block truncate">{swatch.name}</span>
                        <span className="text-[9px] text-slate-400 font-mono truncate">{swatch.desc}</span>
                      </div>
                      {isSelected && <Check className="w-3.5 h-3.5 text-white shrink-0 stroke-[3]" />}
                    </button>
                  );
                })}
              </div>

              {/* Seletor Livre de Sub-telas */}
              <div className="pt-2 border-t border-[#0A2854] flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <input
                    type="color"
                    value={cardColor.startsWith('#') && cardColor.length === 7 ? cardColor : '#041838'}
                    onChange={(e) => {
                      const val = e.target.value;
                      setCardColor(val);
                      setHexCard(val);
                      showFeedback(`✓ Sub-telas ${val.toUpperCase()} selecionadas.`);
                    }}
                    className="w-9 h-9 rounded-xl cursor-pointer bg-transparent border-0 p-0 shadow-sm"
                    title="Abrir roda de cores para as Sub-telas"
                  />
                  <div>
                    <span className="text-xs font-bold text-white block">Roda Livre de Cores das Sub-telas</span>
                    <span className="text-[10px] text-slate-400">Escolha o tom de fundo para cartões e painéis</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-mono text-slate-400">HEX:</span>
                  <input
                    type="text"
                    value={hexCard}
                    onChange={(e) => handleHexCardChange(e.target.value)}
                    maxLength={7}
                    placeholder="#041838"
                    className="w-24 px-2.5 py-1.5 bg-[#01122D] border border-[#0A2854] rounded-xl text-xs font-mono font-bold text-white text-center focus:outline-none focus:border-cyan-400 uppercase"
                  />
                </div>
              </div>
            </div>
          )}

          {/* =========================================================
              SEÇÃO 5: COR PRIMÁRIA DO SISTEMA (BOTÕES, BADGES E DESTAQUES)
              ========================================================= */}
          {(activeTab === 'all' || activeTab === 'primary') && (
            <div className="space-y-3.5 p-4 rounded-2xl bg-[#021026] border border-[#0A2854]">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Brush className="w-4 h-4 text-cyan-400" />
                  <span>5. Cor Primária & Destaque dos Botões</span>
                </label>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full border border-white/40 shadow-xs" style={{ backgroundColor: primaryColor }} />
                  <span className="text-[11px] font-mono font-bold" style={{ color: primaryColor }}>{primaryColor}</span>
                </div>
              </div>

              {/* Quick Swatches de Botões */}
              <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                {QUICK_COLOR_SWATCHES.map((swatch) => {
                  const isCurrent = primaryColor.toLowerCase() === swatch.color.toLowerCase();
                  return (
                    <button
                      key={swatch.color}
                      type="button"
                      onClick={() => {
                        setPrimaryColor(swatch.color);
                        showFeedback(`✓ Cor primária ${swatch.name} (${swatch.color}) aplicada!`);
                      }}
                      title={`${swatch.name} (${swatch.color})`}
                      className={`h-9 rounded-xl border flex items-center justify-center transition-all cursor-pointer relative group ${
                        isCurrent
                          ? 'border-white ring-2 ring-white scale-110 shadow-lg'
                          : 'border-white/20 hover:scale-105 hover:border-white/60'
                      }`}
                      style={{ backgroundColor: swatch.color }}
                    >
                      {isCurrent && <Check className="w-4 h-4 text-white stroke-[3] drop-shadow-sm" />}
                    </button>
                  );
                })}
              </div>

              {/* Paletas Oficiais Recomendadas */}
              <div className="space-y-1.5 pt-2">
                <span className="text-[11px] text-slate-400 font-semibold block">Paletas Temáticas Oficiais:</span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {THEME_PRESETS.map((preset) => {
                    const isSelected = activePresetId === preset.id || primaryColor.toLowerCase() === preset.primary.toLowerCase();
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => {
                          applyPreset(preset.id);
                          showFeedback(`✓ Paleta "${preset.name}" aplicada em todo o sistema.`);
                        }}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                          isSelected
                            ? 'border-white ring-2 ring-white/40 bg-white/10 shadow-md'
                            : 'border-[#0A2854] bg-[#03142e] hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span 
                              className="w-4 h-4 rounded-full shadow-xs border border-white/30"
                              style={{ backgroundColor: preset.primary }}
                            />
                            <span 
                              className="w-2.5 h-2.5 rounded-full opacity-80"
                              style={{ backgroundColor: preset.accent }}
                            />
                          </div>
                          {isSelected && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                        </div>
                        <span className="text-[11px] font-bold text-white leading-tight truncate">
                          {preset.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Seletor Livre de Cor Primária */}
              <div className="pt-2 border-t border-[#0A2854] flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <input
                    type="color"
                    value={primaryColor.startsWith('#') && primaryColor.length === 7 ? primaryColor : '#0067FC'}
                    onChange={(e) => {
                      const val = e.target.value;
                      setPrimaryColor(val);
                      setHexPrimary(val);
                      showFeedback(`✓ Cor primária ${val.toUpperCase()} selecionada.`);
                    }}
                    className="w-9 h-9 rounded-xl cursor-pointer bg-transparent border-0 p-0 shadow-sm"
                    title="Abrir roda de cores para Cor Primária"
                  />
                  <div>
                    <span className="text-xs font-bold text-white block">Roda Livre de Cor Primária</span>
                    <span className="text-[10px] text-slate-400">Personalize o tom dos botões e destaques</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-mono text-slate-400">HEX:</span>
                  <input
                    type="text"
                    value={hexPrimary}
                    onChange={(e) => handleHexPrimaryChange(e.target.value)}
                    maxLength={7}
                    placeholder="#0067FC"
                    className="w-24 px-2.5 py-1.5 bg-[#01122D] border border-[#0A2854] rounded-xl text-xs font-mono font-bold text-white text-center focus:outline-none focus:border-cyan-400 uppercase"
                  />
                </div>
              </div>
            </div>
          )}

          {/* =========================================================
              SEÇÃO 6: PRÉ-VISUALIZAÇÃO COMPLETA DO LAYOUT EM TEMPO REAL
              ========================================================= */}
          <div className="p-4 rounded-2xl bg-[#021026] border border-[#0A2854] space-y-2.5">
            <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block flex items-center gap-1.5">
              <LayoutGrid className="w-3.5 h-3.5 text-cyan-400" />
              <span>Pré-visualização do Layout Completo:</span>
            </span>

            {/* Mock Layout Preview com Top Bar, Sidebar, Fundo e Sub-telas */}
            <div 
              className="rounded-2xl border border-white/10 p-2 flex flex-col gap-2 overflow-hidden shadow-inner"
              style={{ backgroundColor }}
            >
              {/* Mini Top Bar */}
              <div 
                className="w-full h-8 px-3 rounded-lg flex items-center justify-between border"
                style={{ 
                  backgroundColor: navbarColor,
                  borderColor: isNavbarLight ? '#E2E8F0' : 'rgba(255,255,255,0.1)'
                }}
              >
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: primaryColor }} />
                  <span className={`text-[10px] font-black ${isNavbarLight ? 'text-slate-800' : 'text-white'}`}>
                    GIHS System
                  </span>
                  <span className={`text-[8px] font-mono ${isNavbarLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    Top Bar: {navbarColor}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span 
                    className="px-2 py-0.5 rounded text-[8px] font-bold text-white"
                    style={{ backgroundColor: primaryColor }}
                  >
                    100% Sincronizado
                  </span>
                </div>
              </div>

              {/* Main Body Preview (Sidebar + Work Area) */}
              <div className="flex gap-2">
                {/* Mini Sidebar Preview */}
                <div 
                  className="w-32 rounded-xl p-2 flex flex-col justify-between shrink-0 border"
                  style={{ 
                    backgroundColor: sidebarColor,
                    borderColor: isSidebarLight ? '#E2E8F0' : 'rgba(255,255,255,0.1)' 
                  }}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-1 mb-1">
                      <span className={`text-[9px] font-bold ${isSidebarLight ? 'text-slate-800' : 'text-white'}`}>
                        Menu Lateral
                      </span>
                    </div>
                    <div 
                      className="px-1.5 py-1 rounded-md text-[8px] font-bold text-white flex items-center justify-between"
                      style={{ backgroundColor: primaryColor }}
                    >
                      <span>Chamados</span>
                      <Check className="w-2 h-2" />
                    </div>
                    <div className={`px-1.5 py-0.5 rounded text-[8px] ${isSidebarLight ? 'text-slate-600' : 'text-slate-400'}`}>
                      <span>Clientes</span>
                    </div>
                    <div className={`px-1.5 py-0.5 rounded text-[8px] ${isSidebarLight ? 'text-slate-600' : 'text-slate-400'}`}>
                      <span>Relatórios</span>
                    </div>
                  </div>

                  <span className={`text-[7px] font-mono mt-2 ${isSidebarLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    Sidebar: {sidebarColor}
                  </span>
                </div>

                {/* Mini Work Area (Fundo + Sub-telas / Cartões) */}
                <div className="flex-1 space-y-2 p-1">
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-black ${isBgLight ? 'text-slate-900' : 'text-white'}`}>
                      Área Central (Fundo: {backgroundColor})
                    </span>
                  </div>

                  {/* Sub-tela / Card Sample */}
                  <div 
                    className="p-3 rounded-xl border shadow-xs"
                    style={{ 
                      backgroundColor: cardColor,
                      borderColor: isCardLight ? '#E2E8F0' : 'rgba(255,255,255,0.1)'
                    }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-[10px] font-bold ${isCardLight ? 'text-slate-800' : 'text-white'}`}>
                        Sub-tela / Cartão ({cardColor})
                      </span>
                      <span 
                        className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold"
                        style={{ backgroundColor: `${primaryColor}25`, color: primaryColor, border: `1px solid ${primaryColor}60` }}
                      >
                        Status Ativo
                      </span>
                    </div>

                    <p className={`text-[9px] mb-2 leading-relaxed ${isCardLight ? 'text-slate-600' : 'text-slate-300'}`}>
                      Este cartão reflete a cor selecionada para sub-telas e painéis em tempo real.
                    </p>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className="px-2.5 py-1 rounded-lg text-white text-[10px] font-bold shadow-xs cursor-default"
                        style={{ backgroundColor: primaryColor }}
                      >
                        Botão Primário
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#0A2854] bg-[#021026] flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              resetTheme();
              showFeedback('✓ Cores e layout restaurados para o padrão oficial PMJ Joinville.');
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restaurar Padrão PMJ</span>
          </button>

          <button
            type="button"
            onClick={() => setIsColorModalOpen(false)}
            className="px-6 py-2.5 rounded-xl text-white text-xs font-bold shadow-lg transition-transform hover:scale-102 cursor-pointer"
            style={{ backgroundColor: primaryColor }}
          >
            Concluir & Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
