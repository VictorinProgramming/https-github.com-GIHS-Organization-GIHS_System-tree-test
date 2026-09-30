import React from 'react';
import { useAccessibility, FontSizeOption } from '../../contexts/AccessibilityContext';
import {
  Eye,
  Ear,
  Accessibility,
  Volume2,
  VolumeX,
  Type,
  Sun,
  Shield,
  X,
  Check,
  HelpCircle,
  Play,
  RotateCcw,
  Sparkles,
  MousePointer,
  Zap,
  Hand
} from 'lucide-react';

export const AccessibilityModal: React.FC = () => {
  const {
    isModalOpen,
    setIsModalOpen,
    highContrast,
    toggleHighContrast,
    fontSize,
    setFontSize,
    screenReaderActive,
    toggleScreenReader,
    speechRate,
    setSpeechRate,
    vLibrasEnabled,
    toggleVLibras,
    largeTargets,
    toggleLargeTargets,
    reducedMotion,
    toggleReducedMotion,
    visualAlerts,
    toggleVisualAlerts,
    isSpeaking,
    speak,
    stopSpeaking
  } = useAccessibility();

  if (!isModalOpen) return null;

  const handleTestScreenReader = () => {
    speak(
      'Bem-vindo ao GIHS System. O leitor de tela está ativo e configurado em Português do Brasil. Você pode navegar em todos os módulos corporativos com autonomia.',
      true
    );
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="a11y-modal-title"
      className="fixed inset-0 z-[10000] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
    >
      <div
        className={`w-full max-w-2xl rounded-3xl p-6 md:p-8 shadow-2xl relative border ${
          highContrast
            ? 'bg-black border-yellow-400 text-white'
            : 'bg-[#01122D] border-[#0A2854] text-white'
        }`}
      >
        {/* CABEÇALHO */}
        <div className="flex items-start justify-between pb-5 border-b border-[#0A2854]">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#0067FC] to-[#00A6FC] text-white flex items-center justify-center shadow-lg">
              <Accessibility className="w-6 h-6" />
            </div>
            <div>
              <h2 id="a11y-modal-title" className="text-xl font-black text-white">
                Central de Acessibilidade Universal GIHS
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Recursos para pessoas cegas, surdas, cadeirantes e com mobilidade reduzida (Atalho: <kbd className="px-1.5 py-0.5 rounded bg-[#041838] border border-[#0A2854] font-mono text-[10px]">Alt + A</kbd>)
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsModalOpen(false)}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-[#041838] cursor-pointer"
            aria-label="Fechar painel de acessibilidade"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* CONTEÚDO PRINCIPAL COM AS 3 ÁREAS DE INCLUSÃO */}
        <div className="py-6 space-y-6 max-h-[70vh] overflow-y-auto pr-1">
          {/* SEÇÃO 1: PESSOAS CEGAS E BAIXA VISÃO */}
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-[#00A6FC]" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">
                1. Visão & Leitura de Tela (Pessoas Cegas / Baixa Visão)
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Leitor de Tela TTS */}
              <div className="p-4 rounded-2xl bg-[#000B1D] border border-[#0A2854] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Volume2 className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold text-white">Leitor de Tela em Voz Alta</span>
                  </div>
                  <button
                    type="button"
                    onClick={toggleScreenReader}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                      screenReaderActive ? 'bg-emerald-500' : 'bg-slate-700'
                    }`}
                    role="switch"
                    aria-checked={screenReaderActive}
                    aria-label="Ativar leitor de tela"
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        screenReaderActive ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Lê em voz alta em Português todos os chamados, formulários, rotas e tabelas com áudio natural.
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleTestScreenReader}
                    className="px-3 py-1.5 rounded-xl bg-[#041838] hover:bg-[#0067FC] text-white text-[11px] font-semibold flex items-center gap-1.5 cursor-pointer border border-[#0A2854]"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>Testar Voz em Português</span>
                  </button>
                  {isSpeaking && (
                    <button
                      type="button"
                      onClick={stopSpeaking}
                      className="px-2.5 py-1.5 rounded-xl bg-rose-950 text-rose-300 text-[11px] font-semibold flex items-center gap-1 cursor-pointer border border-rose-800"
                    >
                      <VolumeX className="w-3 h-3" />
                      <span>Parar</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Modo Alto Contraste WCAG AAA */}
              <div className="p-4 rounded-2xl bg-[#000B1D] border border-[#0A2854] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sun className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-bold text-white">Alto Contraste (WCAG AAA)</span>
                  </div>
                  <button
                    type="button"
                    onClick={toggleHighContrast}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                      highContrast ? 'bg-amber-400' : 'bg-slate-700'
                    }`}
                    role="switch"
                    aria-checked={highContrast}
                    aria-label="Ativar modo alto contraste"
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        highContrast ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Fundo preto puro, fontes amarelas e brancas de máximo contraste e bordas nítidas para baixa visão.
                </p>
                <span className="text-[10px] text-slate-500 font-mono block">
                  Atalho rápido: <kbd className="px-1 py-0.5 rounded bg-[#041838] text-slate-300">Alt + H</kbd>
                </span>
              </div>
            </div>

            {/* Ajuste de Escala de Fonte */}
            <div className="p-4 rounded-2xl bg-[#000B1D] border border-[#0A2854] flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Type className="w-4 h-4 text-[#0067FC]" />
                <div>
                  <span className="text-xs font-bold text-white block">Tamanho da Fonte / Escala de Texto</span>
                  <span className="text-[11px] text-slate-400">Ampliação sem quebrar tabelas ou formulários</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 p-1 bg-[#01122D] rounded-xl border border-[#0A2854]">
                {(['normal', 'large', 'xlarge'] as FontSizeOption[]).map(opt => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setFontSize(opt)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      fontSize === opt
                        ? 'bg-[#0067FC] text-white shadow'
                        : 'text-slate-300 hover:text-white hover:bg-[#041838]'
                    }`}
                  >
                    {opt === 'normal' ? 'Padrão (100%)' : opt === 'large' ? 'Grande (115%)' : 'Extra (130%)'}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* SEÇÃO 2: PESSOAS SURDAS E DEFICIÊNCIA AUDITIVA */}
          <section className="space-y-4 pt-4 border-t border-[#0A2854]">
            <div className="flex items-center gap-2">
              <Ear className="w-5 h-5 text-emerald-400" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">
                2. Audição & Libras (Pessoas Surdas / Deficiência Auditiva)
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* VLibras */}
              <div className="p-4 rounded-2xl bg-[#000B1D] border border-[#0A2854] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Hand className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold text-white">VLibras (Intérprete 3D de Sinais)</span>
                  </div>
                  <button
                    type="button"
                    onClick={toggleVLibras}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                      vLibrasEnabled ? 'bg-emerald-500' : 'bg-slate-700'
                    }`}
                    role="switch"
                    aria-checked={vLibrasEnabled}
                    aria-label="Ativar VLibras"
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        vLibrasEnabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Tradutor oficial de Língua Brasileira de Sinais (Libras). Exibe o avatar virtual para traduzir qualquer texto selecionado na plataforma.
                </p>
                {vLibrasEnabled && (
                  <span className="text-[10px] text-emerald-400 font-bold block">
                    ✓ Widget VLibras ativo na lateral da tela.
                  </span>
                )}
              </div>

              {/* Alertas Visuais com Transcrição */}
              <div className="p-4 rounded-2xl bg-[#000B1D] border border-[#0A2854] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-bold text-white">Alertas e Notificações Visuais</span>
                  </div>
                  <button
                    type="button"
                    onClick={toggleVisualAlerts}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                      visualAlerts ? 'bg-amber-400' : 'bg-slate-700'
                    }`}
                    role="switch"
                    aria-checked={visualAlerts}
                    aria-label="Ativar alertas visuais"
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        visualAlerts ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Substitui avisos e bipes sonoros por flashes visuais e caixas de texto com transcrição completa para que nenhum evento passe despercebido.
                </p>
              </div>
            </div>
          </section>

          {/* SEÇÃO 3: CADEIRANTES E MOBILIDADE REDUZIDA */}
          <section className="space-y-4 pt-4 border-t border-[#0A2854]">
            <div className="flex items-center gap-2">
              <Accessibility className="w-5 h-5 text-purple-400" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">
                3. Mobilidade & Controle Motor (Cadeirantes / Dificuldade Motora)
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Botões e Alvos Grandes */}
              <div className="p-4 rounded-2xl bg-[#000B1D] border border-[#0A2854] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MousePointer className="w-4 h-4 text-purple-400" />
                    <span className="text-xs font-bold text-white">Alvos de Toque Grandes (≥48px)</span>
                  </div>
                  <button
                    type="button"
                    onClick={toggleLargeTargets}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                      largeTargets ? 'bg-purple-500' : 'bg-slate-700'
                    }`}
                    role="switch"
                    aria-checked={largeTargets}
                    aria-label="Ativar botões grandes"
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        largeTargets ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Aumenta botões, abas e campos para facilitar o clique por pessoas com tremores, controle por ponteiro de cabeça ou tela adaptada.
                </p>
              </div>

              {/* Redução de Movimento */}
              <div className="p-4 rounded-2xl bg-[#000B1D] border border-[#0A2854] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-bold text-white">Redução de Movimento</span>
                  </div>
                  <button
                    type="button"
                    onClick={toggleReducedMotion}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                      reducedMotion ? 'bg-cyan-500' : 'bg-slate-700'
                    }`}
                    role="switch"
                    aria-checked={reducedMotion}
                    aria-label="Ativar redução de movimento"
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        reducedMotion ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Desativa transições, animações rápidas e pulsos de tela para evitar vertigens ou sobrecarga sensorial.
                </p>
              </div>
            </div>

            {/* TABELA DE ATALHOS DE TECLADO PARA OPERAR 100% SEM MOUSE */}
            <div className="p-4 rounded-2xl bg-[#000B1D] border border-[#0A2854] space-y-2">
              <span className="text-xs font-bold text-white block">Atalhos de Teclado (Navegação sem Mouse):</span>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px] text-slate-300 font-mono">
                <div className="p-2 bg-[#01122D] rounded-xl border border-[#0A2854]">
                  <kbd className="text-[#00A6FC] font-bold">Alt + A</kbd>: Painel A11y
                </div>
                <div className="p-2 bg-[#01122D] rounded-xl border border-[#0A2854]">
                  <kbd className="text-[#00A6FC] font-bold">Alt + H</kbd>: Alto Contraste
                </div>
                <div className="p-2 bg-[#01122D] rounded-xl border border-[#0A2854]">
                  <kbd className="text-[#00A6FC] font-bold">Alt + S</kbd>: Parar Áudio
                </div>
                <div className="p-2 bg-[#01122D] rounded-xl border border-[#0A2854]">
                  <kbd className="text-[#00A6FC] font-bold">Ctrl + K</kbd>: Busca Rápida
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* RODAPÉ DO MODAL */}
        <div className="pt-4 border-t border-[#0A2854] flex items-center justify-between">
          <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5 text-emerald-400" />
            Em conformidade com WCAG 2.2 AAA e a Lei Brasileira de Inclusão (LBI nº 13.146)
          </span>

          <button
            type="button"
            onClick={() => setIsModalOpen(false)}
            className="px-5 py-2 rounded-xl bg-[#0067FC] hover:bg-[#0052cc] text-white text-xs font-bold transition-all cursor-pointer shadow-lg shadow-[#0067FC]/30"
          >
            Concluir & Salvar Preferências
          </button>
        </div>
      </div>
    </div>
  );
};
