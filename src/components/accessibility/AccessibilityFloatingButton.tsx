import React from 'react';
import { useAccessibility } from '../../contexts/AccessibilityContext';
import { Accessibility, Volume2, VolumeX, Sun } from 'lucide-react';

interface AccessibilityFloatingButtonProps {
  currentScreenTitle?: string;
  currentScreenSummary?: string;
}

export const AccessibilityFloatingButton: React.FC<AccessibilityFloatingButtonProps> = ({
  currentScreenTitle = 'Módulo Corporativo',
  currentScreenSummary = 'Navegue pelos recursos da plataforma.'
}) => {
  const {
    setIsModalOpen,
    highContrast,
    toggleHighContrast,
    screenReaderActive,
    isSpeaking,
    readScreenContent,
    stopSpeaking
  } = useAccessibility();

  const handleReadCurrentScreen = () => {
    if (isSpeaking) {
      stopSpeaking();
    } else {
      readScreenContent(currentScreenTitle, currentScreenSummary);
    }
  };

  return (
    <div
      role="region"
      aria-label="Controles rápidos de acessibilidade"
      className="fixed bottom-5 left-5 z-[9998] flex items-center gap-2 p-1.5 rounded-2xl bg-[#01122D]/95 backdrop-blur-md border border-[#0A2854] shadow-2xl"
    >
      {/* BOTÃO PRINCIPAL DA CENTRAL DE ACESSIBILIDADE */}
      <button
        type="button"
        onClick={() => setIsModalOpen(true)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-[#0067FC] to-[#00A6FC] hover:from-[#0052cc] hover:to-[#008de0] text-white text-xs font-bold transition-all shadow-lg shadow-[#0067FC]/20 cursor-pointer"
        title="Abrir Central de Acessibilidade (Alt + A)"
        aria-label="Abrir Painel de Acessibilidade"
      >
        <Accessibility className="w-4 h-4" />
        <span className="hidden sm:inline">Acessibilidade</span>
      </button>

      {/* LEITURA DE TELA RÁPIDA (Pessoas Cegas) */}
      <button
        type="button"
        onClick={handleReadCurrentScreen}
        className={`p-2 rounded-xl border text-xs transition-all cursor-pointer flex items-center gap-1.5 ${
          isSpeaking
            ? 'bg-emerald-500 text-white border-emerald-400 animate-pulse'
            : 'bg-[#000B1D] text-slate-300 hover:text-white border-[#0A2854] hover:bg-[#041838]'
        }`}
        title={isSpeaking ? 'Parar leitura em voz alta (Alt + S)' : 'Ouvir resumo da tela atual em voz alta (Alt + L)'}
        aria-label={isSpeaking ? 'Parar leitura de voz' : 'Ler tela atual em voz alta'}
      >
        {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        <span className="text-[11px] font-semibold hidden md:inline">
          {isSpeaking ? 'Parar Voz' : 'Ouvir Tela'}
        </span>
      </button>

      {/* ALTO CONTRASTE RÁPIDO */}
      <button
        type="button"
        onClick={toggleHighContrast}
        className={`p-2 rounded-xl border text-xs transition-all cursor-pointer flex items-center gap-1.5 ${
          highContrast
            ? 'bg-amber-400 text-black border-amber-300 font-bold'
            : 'bg-[#000B1D] text-slate-300 hover:text-white border-[#0A2854] hover:bg-[#041838]'
        }`}
        title="Alternar Modo Alto Contraste (Alt + H)"
        aria-label="Alternar modo de alto contraste"
      >
        <Sun className="w-4 h-4" />
        <span className="text-[11px] font-semibold hidden md:inline">
          {highContrast ? 'Contraste Ativo' : 'Contraste'}
        </span>
      </button>
    </div>
  );
};
