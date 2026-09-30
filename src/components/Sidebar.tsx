import React from 'react';
import {
  LayoutDashboard,
  Users,
  FileSpreadsheet,
  Calendar,
  Kanban,
  Clock,
  BarChart3,
  ShieldCheck,
  Network,
  Settings,
  LogOut,
  Building2,
  LifeBuoy,
  HardDrive,
  Lock,
  PhoneCall,
  Navigation,
  X
} from 'lucide-react';
import { ViewScreen, Collaborator } from '../types';
import { CURRENT_USER } from '../data/mockData';
import { checkScreenAccess } from '../data/authCredentials';
import { GIHSLogo } from './GIHSLogo';

interface SidebarProps {
  currentScreen: ViewScreen;
  onSelectScreen: (screen: ViewScreen) => void;
  onLogout?: () => void;
  onOpenQuickJump?: () => void;
  onOpenNavModal?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  onOpenGuideModal?: () => void;
  onOpenSimulatorModal?: () => void;
  currentUser?: Collaborator;
  isOpenOnMobile?: boolean;
  onCloseMobile?: () => void;
}

interface NavItem {
  id: ViewScreen;
  label: string;
  icon: React.ElementType;
  badge?: string | number;
  highlight?: boolean;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentScreen,
  onSelectScreen,
  onLogout,
  onOpenQuickJump,
  onOpenNavModal,
  currentUser = CURRENT_USER,
  isOpenOnMobile = false,
  onCloseMobile
}) => {
  const handleSelect = (screen: ViewScreen) => {
    onSelectScreen(screen);
    onCloseMobile?.();
  };

  const navSections: NavSection[] = [
    {
      title: 'VISÃO GERAL',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'organograma', label: 'Organograma', icon: Network, badge: 'Admin' },
        { id: 'colaboradores', label: 'Colaboradores', icon: Users, badge: 'Admin' }
      ]
    },
    {
      title: 'OPERAÇÃO & TAREFAS',
      items: [
        { id: 'chamados', label: 'Help Desk & Chamados', icon: LifeBuoy },
        { id: 'sobreaviso', label: 'Sobreaviso', icon: PhoneCall, badge: 'Plantão' },
        { id: 'meu_kanban', label: 'Meu Kanban', icon: Kanban },
        { id: 'kanban_equipe', label: 'Kanban da Equipe', icon: Kanban, badge: 'Líder' },
        { id: 'visao_semanal', label: 'Planejamento Semanal', icon: Calendar },
        { id: 'planilhas', label: 'Base de Atividades', icon: FileSpreadsheet }
      ]
    },
    {
      title: 'PESSOAS & PONTO',
      items: [
        { id: 'registro_ponto', label: 'Registro de Ponto', icon: Clock, highlight: true },
        { id: 'espelho_ponto', label: 'Espelho de Ponto', icon: FileSpreadsheet },
        { id: 'gestao_ponto', label: 'Gestão de Ponto', icon: Users, badge: 'Admin' },
        { id: 'agenda', label: 'Agenda & Reuniões', icon: Calendar }
      ]
    },
    {
      title: 'COMERCIAL & ATIVOS',
      items: [
        { id: 'clientes', label: 'Gestão de Clientes', icon: Building2, badge: 'Admin' },
        { id: 'equipamentos', label: 'Gestão de Ativos', icon: HardDrive, badge: 'Admin' }
      ]
    },
    {
      title: 'GOVERNANÇA',
      items: [
        { id: 'mobilidade', label: 'Mobilidade Corporativa', icon: Navigation, badge: 'GPS' },
        { id: 'relatorios', label: 'Central de Relatórios', icon: BarChart3, badge: 'Admin' },
        { id: 'auditoria', label: 'Auditoria do Sistema', icon: ShieldCheck, badge: 'Admin' },
        { id: 'configuracoes', label: 'Configurações', icon: Settings }
      ]
    }
  ];

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpenOnMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-[#000B1D]/80 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300 animate-in fade-in"
          aria-hidden="true"
        />
      )}

      <aside
        id="app-sidebar-panel"
        className={`
          fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] bg-[#01122D] border-r border-[#0A2854] flex flex-col h-screen shrink-0 select-none transition-transform duration-300 ease-in-out shadow-2xl
          ${isOpenOnMobile ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:static lg:w-68 lg:z-auto lg:shadow-none
        `}
      >
        {/* Brand Header com Logomarca Oficial GIHS */}
        <div className="p-4 border-b border-[#0A2854] flex items-center justify-between bg-[#000B1D]/60">
          <div
            onClick={() => handleSelect('dashboard')}
            className="flex items-center gap-2 cursor-pointer group w-full"
            id="sidebar-brand-logo"
            title="GIHS System — Enterprise Intelligence"
          >
            <div className="w-full flex items-center justify-center py-2 px-1">
              <GIHSLogo variant="system" mode="transparent" height={44} showTagline={true} />
            </div>
          </div>

          {/* Close button on mobile phones & tablets */}
          <button
            onClick={onCloseMobile}
            className="lg:hidden p-2 rounded-xl bg-[#041838] hover:bg-[#0067FC] text-slate-300 hover:text-white transition-colors cursor-pointer border border-[#0A2854]"
            title="Fechar menu lateral"
            aria-label="Fechar menu lateral"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav Menu Items */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-5 text-sm bg-[#01122D]" id="sidebar-nav-container">
          {navSections.map((section, sIdx) => (
            <div key={sIdx} className="space-y-1">
              <p className="px-3 text-[10px] font-extrabold uppercase tracking-wider text-[#00A6FC]/80">
                {section.title}
              </p>
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentScreen === item.id;
                  const { allowed } = checkScreenAccess(item.id, currentUser.userRole, currentUser);

                  return (
                    <button
                      key={item.id}
                      id={`nav-item-${item.id}`}
                      onClick={() => handleSelect(item.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs transition-all cursor-pointer group ${
                        isActive
                          ? 'bg-gradient-to-r from-[#0067FC] to-[#00A6FC] text-white font-bold shadow-md shadow-[#0067FC]/25'
                          : allowed
                            ? 'text-slate-300 font-medium hover:bg-[#041838] hover:text-[#00A6FC]'
                            : 'text-slate-500 font-medium hover:bg-[#041838]/60 hover:text-slate-300'
                      }`}
                    >
                      <span className="flex items-center gap-2.5 truncate">
                        <Icon
                          className={`w-4 h-4 shrink-0 transition-colors ${
                            isActive
                              ? 'text-white'
                              : 'text-[#007BFC] group-hover:text-[#00A6FC]'
                          }`}
                        />
                        <span className="truncate">{item.label}</span>
                      </span>

                      <div className="flex items-center gap-1 shrink-0 ml-1.5">
                        {!allowed && (
                          <span title="Acesso restrito para o perfil atual">
                            <Lock className="w-3 h-3 text-amber-400 group-hover:text-white" />
                          </span>
                        )}

                        {item.badge !== undefined && (
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded-md font-semibold transition-colors ${
                              item.highlight
                                ? 'bg-[#0067FC]/20 text-[#00A6FC] border border-[#0067FC]/40'
                                : isActive
                                  ? 'bg-white/20 text-white border border-white/30'
                                  : 'bg-[#041838] text-slate-300 border border-[#0A2854] group-hover:border-[#007BFC]/50 group-hover:text-white'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Logged User Bar */}
        <div
          className="p-3 border-t border-[#0A2854] bg-[#000B1D]/80 flex items-center justify-between gap-2"
          id="sidebar-user-footer"
        >
          <div
            onClick={() => handleSelect('colaboradores')}
            title="Ver perfil e permissões de acesso"
            className="flex items-center gap-2.5 overflow-hidden cursor-pointer group flex-1 p-1 rounded-xl hover:bg-[#041838] transition-all"
          >
            <div className="relative shrink-0">
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-8 h-8 rounded-full object-cover ring-2 ring-[#0067FC]/60 group-hover:ring-[#00A6FC] transition-all"
              />
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-[#01122D]"></span>
            </div>
            <div className="overflow-hidden min-w-0">
              <p className="text-xs font-bold text-white truncate group-hover:text-[#00A6FC] transition-colors">
                {currentUser.name}
              </p>
              <div className="flex items-center gap-1.5 truncate">
                <span
                  className={`text-[9px] font-bold px-1.5 py-0.2 rounded font-mono ${
                    currentUser.userRole === 'SUPER_ADMIN'
                      ? 'bg-purple-950/80 text-purple-300 border border-purple-800'
                      : currentUser.userRole === 'ADMINISTRATIVO'
                        ? 'bg-sky-950/80 text-sky-300 border border-sky-800'
                        : currentUser.userRole === 'GESTOR'
                          ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
                          : 'bg-slate-800 text-slate-300 border border-slate-700'
                  }`}
                >
                  {currentUser.userRole === 'SUPER_ADMIN' ? 'SUPER ADMIN' : currentUser.userRole || 'COLABORADOR'}
                </span>
                <span className="text-[10px] text-slate-400 font-bold truncate font-mono">
                  {currentUser.sector}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              onLogout?.();
              onCloseMobile?.();
            }}
            id="btn-sidebar-logout"
            title="Encerrar sessão"
            className="p-2 text-slate-400 hover:text-white hover:bg-rose-900/40 rounded-xl border border-transparent hover:border-rose-700/50 transition-colors shrink-0 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>
    </>
  );
};
