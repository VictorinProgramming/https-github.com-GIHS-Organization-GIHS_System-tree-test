import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type FontSizeOption = 'normal' | 'large' | 'xlarge';

interface VisualAlertItem {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'urgent';
  timestamp: string;
}

interface AccessibilityContextType {
  highContrast: boolean;
  toggleHighContrast: () => void;
  fontSize: FontSizeOption;
  setFontSize: (size: FontSizeOption) => void;
  screenReaderActive: boolean;
  toggleScreenReader: () => void;
  speechRate: number;
  setSpeechRate: (rate: number) => void;
  vLibrasEnabled: boolean;
  toggleVLibras: () => void;
  largeTargets: boolean;
  toggleLargeTargets: () => void;
  reducedMotion: boolean;
  toggleReducedMotion: () => void;
  visualAlerts: boolean;
  toggleVisualAlerts: () => void;
  isSpeaking: boolean;
  speak: (text: string, interrupt?: boolean) => void;
  stopSpeaking: () => void;
  readScreenContent: (screenTitle: string, summary: string) => void;
  isModalOpen: boolean;
  setIsModalOpen: (open: boolean) => void;
  activeVisualAlerts: VisualAlertItem[];
  triggerVisualAlert: (title: string, message: string, type?: 'info' | 'warning' | 'urgent') => void;
  dismissVisualAlert: (id: string) => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export const AccessibilityProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // 1. Estados com persistência em localStorage
  const [highContrast, setHighContrast] = useState<boolean>(() => {
    return localStorage.getItem('gihs_a11y_high_contrast') === 'true';
  });

  const [fontSize, setFontSizeState] = useState<FontSizeOption>(() => {
    return (localStorage.getItem('gihs_a11y_font_size') as FontSizeOption) || 'normal';
  });

  const [screenReaderActive, setScreenReaderActive] = useState<boolean>(() => {
    return localStorage.getItem('gihs_a11y_screen_reader') === 'true';
  });

  const [speechRate, setSpeechRateState] = useState<number>(() => {
    const saved = localStorage.getItem('gihs_a11y_speech_rate');
    return saved ? parseFloat(saved) : 1.0;
  });

  const [vLibrasEnabled, setVLibrasEnabled] = useState<boolean>(() => {
    return localStorage.getItem('gihs_a11y_vlibras') === 'true';
  });

  const [largeTargets, setLargeTargets] = useState<boolean>(() => {
    return localStorage.getItem('gihs_a11y_large_targets') === 'true';
  });

  const [reducedMotion, setReducedMotion] = useState<boolean>(() => {
    return localStorage.getItem('gihs_a11y_reduced_motion') === 'true';
  });

  const [visualAlerts, setVisualAlerts] = useState<boolean>(() => {
    return localStorage.getItem('gihs_a11y_visual_alerts') !== 'false';
  });

  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [activeVisualAlerts, setActiveVisualAlerts] = useState<VisualAlertItem[]>([]);

  // 2. Aplicação de classes no DOM
  useEffect(() => {
    localStorage.setItem('gihs_a11y_high_contrast', String(highContrast));
    if (highContrast) {
      document.body.classList.add('a11y-high-contrast');
    } else {
      document.body.classList.remove('a11y-high-contrast');
    }
  }, [highContrast]);

  useEffect(() => {
    localStorage.setItem('gihs_a11y_font_size', fontSize);
    const html = document.documentElement;
    html.classList.remove('a11y-font-large', 'a11y-font-xlarge');
    if (fontSize === 'large') {
      html.classList.add('a11y-font-large');
    } else if (fontSize === 'xlarge') {
      html.classList.add('a11y-font-xlarge');
    }
  }, [fontSize]);

  useEffect(() => {
    localStorage.setItem('gihs_a11y_large_targets', String(largeTargets));
    if (largeTargets) {
      document.body.classList.add('a11y-large-targets');
    } else {
      document.body.classList.remove('a11y-large-targets');
    }
  }, [largeTargets]);

  useEffect(() => {
    localStorage.setItem('gihs_a11y_reduced_motion', String(reducedMotion));
    if (reducedMotion) {
      document.body.classList.add('a11y-reduced-motion');
    } else {
      document.body.classList.remove('a11y-reduced-motion');
    }
  }, [reducedMotion]);

  useEffect(() => {
    localStorage.setItem('gihs_a11y_screen_reader', String(screenReaderActive));
  }, [screenReaderActive]);

  useEffect(() => {
    localStorage.setItem('gihs_a11y_speech_rate', String(speechRate));
  }, [speechRate]);

  useEffect(() => {
    localStorage.setItem('gihs_a11y_vlibras', String(vLibrasEnabled));
  }, [vLibrasEnabled]);

  useEffect(() => {
    localStorage.setItem('gihs_a11y_visual_alerts', String(visualAlerts));
  }, [visualAlerts]);

  // 3. Injeção dinâmica do VLibras (Widget Oficial Brasileiro para Pessoas Surdas)
  useEffect(() => {
    if (!vLibrasEnabled) {
      // Remove do DOM se desativado
      const existingWidget = document.querySelector('[vw]');
      if (existingWidget) existingWidget.remove();
      const existingScript = document.getElementById('vlibras-script');
      if (existingScript) existingScript.remove();
      return;
    }

    if (document.getElementById('vlibras-script')) return;

    // Cria contêiner HTML do VLibras
    const vlibrasDiv = document.createElement('div');
    vlibrasDiv.setAttribute('vw', '');
    vlibrasDiv.className = 'enabled';
    vlibrasDiv.innerHTML = `
      <div vw-access-button class="active"></div>
      <div vw-plugin-wrapper>
        <div class="vw-plugin-top-wrapper"></div>
      </div>
    `;
    document.body.appendChild(vlibrasDiv);

    // Injeta script
    const script = document.createElement('script');
    script.id = 'vlibras-script';
    script.src = 'https://vlibras.gov.br/app/vlibras-plugin.js';
    script.async = true;
    script.onload = () => {
      try {
        // @ts-ignore
        if (window.VLibras) {
          // @ts-ignore
          new window.VLibras.Widget('https://vlibras.gov.br/app');
        }
      } catch (err) {
        console.warn('[VLibras] Falha ao instanciar widget:', err);
      }
    };
    document.body.appendChild(script);
  }, [vLibrasEnabled]);

  // 4. Mecanismo de Fala / Leitor de Tela Web Speech API (Pessoas Cegas)
  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  const speak = (text: string, interrupt = true) => {
    if (!('speechSynthesis' in window) || !text) return;

    if (interrupt) {
      window.speechSynthesis.cancel();
    }

    const cleanText = text.replace(/[*_#`[\]()]/g, ' ').replace(/\s+/g, ' ').trim();
    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'pt-BR';
    utterance.rate = speechRate;
    utterance.pitch = 1.0;

    // Seleciona voz brasileira se disponível
    const voices = window.speechSynthesis.getVoices();
    const ptVoice = voices.find(v => v.lang.startsWith('pt') || v.lang.includes('BR'));
    if (ptVoice) {
      utterance.voice = ptVoice;
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const readScreenContent = (screenTitle: string, summary: string) => {
    const textToRead = `Tela atual: ${screenTitle}. ${summary}`;
    speak(textToRead, true);
  };

  // 5. Alertas Visuais para Pessoas Surdas
  const triggerVisualAlert = (title: string, message: string, type: 'info' | 'warning' | 'urgent' = 'info') => {
    const id = `alert-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const newAlert: VisualAlertItem = {
      id,
      title,
      message,
      type,
      timestamp: new Date().toLocaleTimeString('pt-BR')
    };

    setActiveVisualAlerts(prev => [newAlert, ...prev].slice(0, 3));

    // Se leitor de tela estiver ativo, também fala o alerta
    if (screenReaderActive) {
      speak(`Atenção: ${title}. ${message}`, false);
    }

    // Auto-dismiss após 6 segundos
    setTimeout(() => {
      dismissVisualAlert(id);
    }, 6000);
  };

  const dismissVisualAlert = (id: string) => {
    setActiveVisualAlerts(prev => prev.filter(a => a.id !== id));
  };

  // 6. Atalhos de Teclado Globais de Acessibilidade
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Alt + A: Abre o Painel de Acessibilidade
      if (e.altKey && (e.key === 'a' || e.key === 'A')) {
        e.preventDefault();
        setIsModalOpen(prev => !prev);
      }
      // Alt + H: Alterna Alto Contraste
      else if (e.altKey && (e.key === 'h' || e.key === 'H')) {
        e.preventDefault();
        setHighContrast(prev => !prev);
      }
      // Alt + S: Para a leitura de voz
      else if (e.altKey && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        stopSpeaking();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const toggleHighContrast = () => setHighContrast(prev => !prev);
  const setFontSize = (size: FontSizeOption) => setFontSizeState(size);
  const toggleScreenReader = () => {
    setScreenReaderActive(prev => {
      const next = !prev;
      if (next) {
        speak('Leitor de tela do GIHS System ativado.');
      } else {
        stopSpeaking();
      }
      return next;
    });
  };
  const setSpeechRate = (rate: number) => setSpeechRateState(rate);
  const toggleVLibras = () => setVLibrasEnabled(prev => !prev);
  const toggleLargeTargets = () => setLargeTargets(prev => !prev);
  const toggleReducedMotion = () => setReducedMotion(prev => !prev);
  const toggleVisualAlerts = () => setVisualAlerts(prev => !prev);

  return (
    <AccessibilityContext.Provider
      value={{
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
        stopSpeaking,
        readScreenContent,
        isModalOpen,
        setIsModalOpen,
        activeVisualAlerts,
        triggerVisualAlert,
        dismissVisualAlert
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
};

export const useAccessibility = (): AccessibilityContextType => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
};
