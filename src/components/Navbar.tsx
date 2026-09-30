import React, { useState, useEffect } from 'react';
import {
  Bell,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  Menu,
  Settings,
  Accessibility
} from 'lucide-react';
import { useAccessibility } from '../contexts/AccessibilityContext';
import { ViewScreen, Collaborator, UserRole } from '../types';
import { MOCK_ALERTS, CURRENT_USER } from '../data/mockData';
import { GIHSIcon } from './GIHSIcon';

interface NavbarProps {
  currentScreen: ViewScreen;
  onSelectScreen: (screen: ViewScreen) => void;
  onOpenQuickJump: () => void;
  onOpenGuide: () => void;
  currentUser?: Collaborator;
  onSwitchUserRole?: (role: UserRole) => void;
  onOpenSimulatorModal?: () => void;
  onToggleMobileMenu?: () => void;
}

const SCREEN_TITLES: Record<ViewScreen, { title: string; subtitle: string; category: string }> = {
  login: { title: 'Acesso Corporativo', subtitle: 'GIHS System', category: 'Segurança' },
  home: { title: 'Início • Hub de Acesso Geral', subtitle: 'Todos os módulos e ferramentas de trabalho', category: 'Início' },
  dashboard: { title: 'Dashboard Executivo', subtitle: 'Panorama em tempo real • 100% Monitorado', category: 'Visão Geral' },
  organograma: { title: 'Organograma Corporativo', subtitle: 'Conexão estrutural de todos os setores', category: 'Visão Geral' },
  colaboradores: { title: 'Dossiê de Colaboradores', subtitle: 'Acesso Restrito: Gestão, Administração e RH', category: 'Gestão & RH' },
  meu_kanban: { title: 'Meu Kanban', subtitle: 'Fluxo individual de trabalho', category: 'Operação' },
  kanban_equipe: { title: 'Kanban da Equipe', subtitle: 'Monitoramento de fluxo setorial e SLA', category: 'Operação' },
  visao_semanal: { title: 'Planejamento Semanal', subtitle: 'Distribuição de atividades por dia', category: 'Operação' },
  sobreaviso: { title: 'Escala de Sobreaviso', subtitle: 'Plantões operacionais e cobertura 24/7', category: 'Operação' },
  planilhas: { title: 'Base Geral de Atividades', subtitle: 'Planilha inteligente com filtros e exportação Excel', category: 'Operação' },
  registro_ponto: { title: 'Registro de Ponto Eletrônico', subtitle: 'Controle biométrico facial com geolocalização', category: 'Pessoas & Ponto' },
  espelho_ponto: { title: 'Espelho de Ponto', subtitle: 'Consolidação mensal e horas trabalhadas', category: 'Pessoas & Ponto' },
  gestao_ponto: { title: 'Gestão de Ponto (Admin)', subtitle: 'Painel da gerência com status em tempo real', category: 'Pessoas & Ponto' },
  agenda: { title: 'Agenda & Reuniões', subtitle: 'Eventos corporativos integrados', category: 'Pessoas & Ponto' },
  clientes: { title: 'Gestão de Clientes', subtitle: 'Contratos, SLAs e empresas atendidas', category: 'Comercial' },
  chamados: { title: 'Help Desk & Chamados', subtitle: 'Fila de tickets N1, N2, N3 e SLAs', category: 'Operação' },
  equipamentos: { title: 'Inventário de Ativos & Patrimônio', subtitle: 'Hardware, periféricos, etiquetas e frotas', category: 'Infraestrutura' },
  mobilidade: { title: 'Mobilidade Corporativa', subtitle: 'Celulares de plantão, custódia e rotas GPS', category: 'Governança' },
  relatorios: { title: 'Central de Relatórios', subtitle: 'Indicadores de produtividade, ponto e SLAs', category: 'Governança' },
  auditoria: { title: 'Auditoria do Sistema', subtitle: 'Trilhas forenses, logs e conformidade LGPD', category: 'Governança' },
  configuracoes: { title: 'Configurações do Sistema', subtitle: 'Parâmetros corporativos e banco de dados', category: 'Governança' }
};

export const Navbar: React.FC<NavbarProps> = ({
  currentScreen,
  onSelectScreen,
  currentUser = CURRENT_USER,
  onToggleMobileMenu
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [time, setTime] = useState('09:02:18');
  const { setIsModalOpen } = useAccessibility();

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      setTime(`${hours}:${minutes}:${seconds}`);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const currentMeta = SCREEN_TITLES[currentScreen] || {
    title: 'GIHS System',
    subtitle: 'Gestão Integrada',
    category: 'Sistema'
  };

  return (
    <header className="h-16 bg-[#01122D] border-b border-[#0A2854] px-3 sm:px-5 flex items-center justify-between z-20 shrink-0 select-none">
      {/* Breadcrumb and Screen Title */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {/* Mobile Hamburger Button */}
        <button
          onClick={onToggleMobileMenu}
          id="btn-navbar-mobile-menu"
          className="lg:hidden min-w-[42px] min-h-[42px] flex items-center justify-center rounded-xl bg-[#041838] hover:bg-[#0067FC] hover:text-white active:scale-95 text-[#00A6FC] border border-[#0A2854] transition-all cursor-pointer shrink-0 z-30 group"
          title="Abrir menu de navegação lateral"
          aria-label="Abrir menu de navegação lateral"
        >
          <Menu className="w-5 h-5 text-[#00A6FC] group-hover:text-white transition-colors" />
        </button>

        {/* Small Screen Logo */}
        <div
          onClick={() => onSelectScreen('home')}
          className="lg:hidden flex items-center cursor-pointer shrink-0 p-1 rounded-lg"
          title="Ir para Início (Home) GIHS System"
        >
          <GIHSIcon size={30} variant={currentScreen === 'ai_hub' ? 'agents' : 'system'} />
        </div>

        {/* Screen Title */}
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] text-[#00A6FC]/80 font-bold">
            <span className="hidden sm:inline">GIHS System</span>
            <span className="hidden sm:inline">/</span>
            <span className="text-white font-bold truncate">{currentMeta.category}</span>
          </div>
          <div className="flex items-center gap-2">
            <h2 className="text-xs sm:text-sm font-black text-white tracking-tight truncate max-w-[130px] xs:max-w-[180px] sm:max-w-xs md:max-w-none">
              {currentMeta.title}
            </h2>
            <span className="hidden lg:inline text-xs text-slate-400 font-semibold border-l border-[#0A2854] pl-2 truncate">
              {currentMeta.subtitle}
            </span>
          </div>
        </div>
      </div>

      {/* Right Action Widgets */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Live Date & Time Widget */}
        <div
          id="navbar-datetime-widget"
          className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl bg-[#041838] border border-[#0A2854] text-xs font-mono text-slate-300"
          title="Data e hora sincronizada do GIHS System"
        >
          <div className="w-5 h-5 rounded-md bg-[#01122D] flex items-center justify-center text-[#00A6FC] shrink-0">
            <Clock className="w-3.5 h-3.5 text-[#00A6FC]" />
          </div>
          <span className="hidden sm:inline text-slate-300 font-bold tracking-tight">16/09/2026</span>
          <span className="text-[#0A2854] hidden sm:inline">•</span>
          <span className="bg-[#01122D] text-[#00A6FC] font-black px-2 py-0.5 rounded-md border border-[#0A2854] tracking-wider">
            {time}
          </span>
        </div>

        {/* Attendance Status Badge */}
        <button
          onClick={() => onSelectScreen('registro_ponto')}
          id="btn-navbar-timeclock-pill"
          className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-full bg-[#041838] hover:bg-[#0067FC] border border-[#0A2854] hover:border-[#00A6FC] text-slate-200 hover:text-white text-xs font-semibold transition-all active:scale-95 cursor-pointer group"
          title="Ponto registrado hoje às 08:02. Clique para abrir Registro de Ponto"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 group-hover:bg-white"></span>
          </span>
          <span className="font-bold text-slate-200 group-hover:text-white transition-colors">Ponto: 08:02</span>
          <span className="hidden md:inline text-[10px] bg-emerald-950/80 text-emerald-400 group-hover:text-white px-1.5 py-0.2 rounded font-semibold border border-emerald-800 transition-colors">
            Expediente
          </span>
        </button>

        {/* Universal Accessibility Button */}
        <button
          onClick={() => setIsModalOpen(true)}
          id="btn-navbar-accessibility"
          className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-xl border border-[#0A2854] bg-[#041838] hover:bg-[#0067FC] text-slate-200 hover:text-white text-xs font-bold transition-all active:scale-95 cursor-pointer group shrink-0"
          title="Central de Acessibilidade Universal (Alt + A) — Leitor de Tela, Libras e Modos Motores"
          aria-label="Abrir Central de Acessibilidade"
        >
          <Accessibility className="w-4 h-4 text-[#00A6FC] group-hover:text-white transition-colors" />
          <span className="hidden lg:inline">Acessibilidade</span>
        </button>

        {/* Notification Alert */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            id="btn-navbar-notifications"
            className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-xl border border-[#0A2854] bg-[#041838] hover:bg-[#0067FC] hover:text-white transition-all cursor-pointer group"
            title="Alertas e Notificações do GIHS System"
          >
            <Bell className="w-4 h-4 text-[#00A6FC] group-hover:text-white transition-colors shrink-0" />
            <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#0067FC]/20 text-[#00A6FC] border border-[#0067FC]/40 shrink-0 group-hover:bg-white/20 group-hover:text-white group-hover:border-white/40 transition-colors">
              <span className="hidden sm:inline">3 NOTIFICAÇÕES</span>
              <span className="sm:hidden">3</span>
            </span>
          </button>

          {showNotifications && (
            <div
              id="notifications-popover"
              className="absolute right-0 mt-2 w-84 bg-[#041838] border border-[#0A2854] rounded-2xl shadow-2xl z-50 p-3 animate-in fade-in zoom-in-95 duration-150 text-slate-100"
            >
              <div className="flex items-center justify-between pb-2 border-b border-[#0A2854] mb-2">
                <div className="flex items-center gap-1.5">
                  <Bell className="w-3.5 h-3.5 text-[#00A6FC]" />
                  <span className="text-xs font-bold text-white">Alertas do Sistema</span>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#0067FC]/20 text-[#00A6FC] border border-[#0067FC]/40">
                  {MOCK_ALERTS.length} ATIVOS
                </span>
              </div>

              <div className="space-y-2">
                {MOCK_ALERTS.length === 0 ? (
                  <p className="text-center text-xs text-slate-400 py-3">Nenhum alerta pendente</p>
                ) : (
                  MOCK_ALERTS.map((alert) => (
                    <div
                      key={alert.id}
                      className="p-2.5 rounded-xl text-xs flex items-start gap-2 border bg-[#01122D] border-[#0A2854] hover:border-[#007BFC]/50 transition-colors"
                    >
                      {alert.type === 'warning' ? (
                        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <p className="font-medium text-[12px] text-white truncate">{alert.text}</p>
                          <span className="text-[9px] font-bold uppercase tracking-wider px-1 py-0.2 rounded bg-[#0067FC]/20 text-[#00A6FC] border border-[#0067FC]/40 shrink-0">
                            {alert.type === 'warning' ? 'ALERTA' : 'STATUS'}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400">{alert.time}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="mt-3 pt-2 border-t border-[#0A2854] flex justify-between items-center text-[11px]">
                <button
                  onClick={() => {
                    setShowNotifications(false);
                    onSelectScreen('auditoria');
                  }}
                  className="px-2 py-1 rounded-md text-[#00A6FC] hover:bg-[#0067FC] hover:text-white font-semibold cursor-pointer transition-colors"
                >
                  Ver logs de auditoria
                </button>
                <button
                  onClick={() => setShowNotifications(false)}
                  className="px-2 py-1 rounded-md text-slate-400 hover:text-white cursor-pointer transition-colors"
                >
                  Fechar
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Settings & Profile Button */}
        <button
          onClick={() => onSelectScreen('configuracoes')}
          id="btn-navbar-settings"
          className="flex items-center gap-2 pl-2 pr-2.5 py-1.5 rounded-xl bg-[#041838] hover:bg-[#0067FC] hover:text-white border border-[#0A2854] text-slate-200 transition-all active:scale-95 cursor-pointer group"
          title="Abrir Configurações do Sistema e Perfil Master"
        >
          <img
            src={currentUser.avatar}
            alt={currentUser.name}
            className="w-6 h-6 rounded-lg object-cover ring-1 ring-[#0067FC]/50"
          />
          <div className="hidden xl:flex flex-col text-left">
            <span className="text-[11px] font-black leading-tight text-white group-hover:text-white transition-colors truncate max-w-[110px]">
              {currentUser.name}
            </span>
            <span className="text-[9px] text-[#00A6FC] group-hover:text-white/90 font-mono font-semibold truncate">
              Configurações
            </span>
          </div>
          <Settings className="w-3.5 h-3.5 text-[#00A6FC] group-hover:text-white transition-colors" />
        </button>
      </div>
    </header>
  );
};
