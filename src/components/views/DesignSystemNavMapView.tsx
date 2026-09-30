import React, { useState } from 'react';
import {
  Layout,
  Compass,
  Layers,
  Palette,
  Monitor,
  Tablet,
  Smartphone,
  CheckCircle2,
  Lock,
  ArrowRight,
  Sparkles,
  ExternalLink,
  Search,
  ShieldCheck,
  Eye,
  Sliders,
  Type,
  Maximize2,
  GitBranch,
  Workflow,
  MousePointerClick,
  Info,
  Zap,
  Clock,
  Briefcase,
  Users,
  Database,
  FileSpreadsheet,
  Calendar,
  MessageSquare,
  Shield,
  BarChart3,
  Flame,
  CheckSquare
} from 'lucide-react';
import { ViewScreen, UserRole, Collaborator } from '../../types';
import { SCREEN_SECURITY_POLICIES } from '../../data/authCredentials';
import { PrivateAccessLock } from './collaborators/PrivateAccessLock';

interface DesignSystemNavMapViewProps {
  onNavigate: (screen: ViewScreen) => void;
  currentUser?: Collaborator;
  onSwitchUser?: (user: Collaborator) => void;
}

export const DesignSystemNavMapView: React.FC<DesignSystemNavMapViewProps> = ({
  onNavigate,
  currentUser,
  onSwitchUser
}) => {
  // Check access: Only GESTOR, ADMINISTRATIVO and SUPER_ADMIN are authorized
  const activeUserRole = currentUser?.userRole || 'COLABORADOR';
  const isAllowed =
    activeUserRole === 'SUPER_ADMIN' ||
    activeUserRole === 'ADMINISTRATIVO' ||
    activeUserRole === 'GESTOR';

  if (!isAllowed) {
    return (
      <PrivateAccessLock
        phaseNumber={2}
        currentUser={currentUser}
        onSwitchUser={onSwitchUser}
        onNavigate={onNavigate}
      />
    );
  }

  const [activeTab, setActiveTab] = useState<'navmap' | 'wireframes' | 'designsystem' | 'matrix'>('navmap');
  const [wireframeViewport, setWireframeViewport] = useState<'desktop' | 'notebook' | 'tablet'>('desktop');
  const [selectedWorkflowStep, setSelectedWorkflowStep] = useState<number>(0);
  const [searchFilter, setSearchFilter] = useState('');

  // Sitemaps grouped by domain
  const sitemapDomains = [
    {
      domain: '1. NÚCLEO & IDENTIDADE',
      color: 'border-cyan-500/30 bg-cyan-950/20 text-cyan-400',
      screens: [
        { id: 'login' as ViewScreen, title: 'Autenticação & Login', icon: Lock, roles: ['SUPER_ADMIN', 'ADMINISTRATIVO', 'GESTOR', 'COLABORADOR'], layout: 'Single Screen Centered Modal' },
        { id: 'dashboard' as ViewScreen, title: 'Dashboard Geral (Executivo & Operacional)', icon: Layout, roles: ['SUPER_ADMIN', 'ADMINISTRATIVO', 'GESTOR', 'COLABORADOR'], layout: '12-Col Responsive Bento Grid' },
        { id: 'visao_geral' as ViewScreen, title: 'Central de Gestão (Hub Geral)', icon: Compass, roles: ['SUPER_ADMIN', 'ADMINISTRATIVO', 'GESTOR'], layout: 'Hero + Multi-Card Matrix' },
        { id: 'organograma' as ViewScreen, title: 'Organograma Institucional (Fase 3 • Privada)', icon: GitBranch, roles: ['SUPER_ADMIN', 'ADMINISTRATIVO', 'GESTOR'], layout: 'Hierarchical Tree Chart' },
        { id: 'colaboradores' as ViewScreen, title: 'Quadro Geral de Colaboradores (Fase 4 • Privada)', icon: Users, roles: ['SUPER_ADMIN', 'ADMINISTRATIVO', 'GESTOR'], layout: 'Data Table + Side Profile Drawer' }
      ]
    },
    {
      domain: '2. OPERAÇÃO, PROCESSOS & TAREFAS',
      color: 'border-blue-500/30 bg-blue-950/20 text-blue-400',
      screens: [
        { id: 'chamados' as ViewScreen, title: 'Help Desk & Chamados (N1/N2/N3)', icon: Briefcase, roles: ['SUPER_ADMIN', 'ADMINISTRATIVO', 'GESTOR', 'COLABORADOR'], layout: 'Ticket Queue + Detail Split Pane' },
        { id: 'meu_kanban' as ViewScreen, title: 'Meu Kanban Individual', icon: CheckSquare, roles: ['SUPER_ADMIN', 'ADMINISTRATIVO', 'GESTOR', 'COLABORADOR'], layout: '4-Column Drag & Drop Board' },
        { id: 'kanban_equipe' as ViewScreen, title: 'Kanban da Equipe / Setorial', icon: Workflow, roles: ['SUPER_ADMIN', 'ADMINISTRATIVO', 'GESTOR'], layout: 'Sector Tabbed Kanban Board' },
        { id: 'visao_semanal' as ViewScreen, title: 'Planejamento Semanal (Weekly)', icon: Calendar, roles: ['SUPER_ADMIN', 'ADMINISTRATIVO', 'GESTOR'], layout: '5-Day Workload Schedule Grid' },
        { id: 'planilhas' as ViewScreen, title: 'Base Geral de Atividades (Smart Sheet)', icon: FileSpreadsheet, roles: ['SUPER_ADMIN', 'ADMINISTRATIVO', 'GESTOR', 'COLABORADOR'], layout: 'DataGrid with Inline Filters' }
      ]
    },
    {
      domain: '3. PESSOAS & PONTO ELETRÔNICO',
      color: 'border-emerald-500/30 bg-emerald-950/20 text-emerald-400',
      screens: [
        { id: 'registro_ponto' as ViewScreen, title: 'Registro de Ponto Eletrônico', icon: Clock, roles: ['SUPER_ADMIN', 'ADMINISTRATIVO', 'GESTOR', 'COLABORADOR'], layout: 'Biometric Clock Card + Daily Log' },
        { id: 'espelho_ponto' as ViewScreen, title: 'Espelho de Ponto & Banco de Horas', icon: FileSpreadsheet, roles: ['SUPER_ADMIN', 'ADMINISTRATIVO', 'GESTOR', 'COLABORADOR'], layout: 'Monthly Timesheet Grid' },
        { id: 'gestao_ponto' as ViewScreen, title: 'Gestão de Ponto (RH & Admin)', icon: ShieldCheck, roles: ['SUPER_ADMIN', 'ADMINISTRATIVO'], layout: 'Audit Table + Adjustment Modal' },
        { id: 'agenda' as ViewScreen, title: 'Agenda & Reuniões Corporativas', icon: Calendar, roles: ['SUPER_ADMIN', 'ADMINISTRATIVO', 'GESTOR', 'COLABORADOR'], layout: 'Calendar Month/Day + Event Sidebar' }
      ]
    },
    {
      domain: '4. COMERCIAL & ATIVOS DE TI',
      color: 'border-purple-500/30 bg-purple-950/20 text-purple-400',
      screens: [
        { id: 'clientes' as ViewScreen, title: 'Gestão de Clientes & Contratos B2B', icon: Users, roles: ['SUPER_ADMIN', 'ADMINISTRATIVO', 'GESTOR'], layout: 'Client Directory + Contract Cards' },
        { id: 'equipamentos' as ViewScreen, title: 'Inventário de Equipamentos de TI', icon: Database, roles: ['SUPER_ADMIN', 'ADMINISTRATIVO', 'GESTOR'], layout: 'Asset Table with QR/Tag Badges' }
      ]
    },
    {
      domain: '5. GOVERNANÇA, AUDITORIA & SEGURANÇA',
      color: 'border-amber-500/30 bg-amber-950/20 text-amber-400',
      screens: [
        { id: 'relatorios' as ViewScreen, title: 'Central de Relatórios & BI', icon: BarChart3, roles: ['SUPER_ADMIN', 'ADMINISTRATIVO', 'GESTOR'], layout: 'Report Builder + Export Tools' },
        { id: 'auditoria' as ViewScreen, title: 'Trilha de Auditoria & Compliance', icon: ShieldCheck, roles: ['SUPER_ADMIN'], layout: 'Immutable Security Log Stream' },
        { id: 'configuracoes' as ViewScreen, title: 'Configurações de TI & Infraestrutura', icon: Sliders, roles: ['SUPER_ADMIN'], layout: 'Settings Tabs & System Flags' }
      ]
    }
  ];

  // Intersector pipeline steps
  const workflowSteps = [
    {
      step: 1,
      name: 'Cliente & Canal de Entrada',
      actor: 'Cliente Externo / Portal de Atendimento',
      action: 'Abertura de demanda via Portal de Suporte GIHS System ou chamado técnico.',
      sector: 'Comercial / Atendimento',
      output: 'Ticket gerado com timestamp e classificação de prioridade.',
      sla: 'SLA Resposta: 15 min'
    },
    {
      step: 2,
      name: 'Triagem Suporte N1',
      actor: 'Carlos Silva (Analista N1)',
      action: 'Diagnóstico preliminar, atendimento de primeiro contato, solução imediata ou escalonamento.',
      sector: 'Suporte N1',
      output: 'Resolução direta (68%) ou encaminhamento documentado para N2.',
      sla: 'SLA N1: 2 horas'
    },
    {
      step: 3,
      name: 'Aprofundamento Suporte N2',
      actor: 'Victor Estevão (Especialista N2)',
      action: 'Análise avançada de sistemas operacionais, VPNs, conectividade e configurações locais.',
      sector: 'Suporte N2',
      output: 'Solução técnica ou abertura de chamado para N3 / Dev / DBA.',
      sla: 'SLA N2: 4 horas'
    },
    {
      step: 4,
      name: 'Infraestrutura Crítica N3',
      actor: 'Carlos Eduardo (Especialista N3)',
      action: 'Diagnóstico em switches core, telecomunicações, clusters de virtualização e failover.',
      sector: 'Suporte N3',
      output: 'Restauração de infraestrutura e relatório de post-mortem.',
      sla: 'SLA N3: 8 horas'
    },
    {
      step: 5,
      name: 'Engenharia de Software (Dev)',
      actor: 'Mariana Santos (Front) & Rafael Oliveira (Back)',
      action: 'Correção de bug, refatoração de endpoint, hotfix e pipeline de deploy contínuo.',
      sector: 'Desenvolvimento',
      output: 'Pull request aprovado e deploy em ambiente de homologação.',
      sla: 'SLA Dev: 24 horas'
    },
    {
      step: 6,
      name: 'Banco de Dados (DBA)',
      actor: 'Lucas Almeida (DBA Lead)',
      action: 'Análise de locks, reindexação, tuning de consultas e integridade dos backups.',
      sector: 'Dados / DBA',
      output: 'Otimização executada e telemetria de performance estabilizada.',
      sla: 'SLA DBA: 6 horas'
    },
    {
      step: 7,
      name: 'Validação Cyber Security',
      actor: 'Fernanda Costa (Cyber Security)',
      action: 'Varredura de vulnerabilidades, checagem de conformidade LGPD e liberação de regras.',
      sector: 'Segurança',
      output: 'Assinatura digital de conformidade e auditoria de log registrada.',
      sla: 'SLA Sec: 4 horas'
    },
    {
      step: 8,
      name: 'Encerramento & Feedback',
      actor: 'Helena Santos (Adm/RH) & Notificação Automática',
      action: 'Notificação ao cliente pelo portal corporativo, registro no banco de horas e atualização do SLA geral.',
      sector: 'Governança',
      output: 'Demanda 100% monitorada, arquivada no histórico e pontuada nos KPIs.',
      sla: 'Ciclo Fechado: 100%'
    }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12" id="design-system-navmap-view">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950/50 p-6 rounded-3xl border border-slate-800 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 relative z-10">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950 border border-emerald-600 text-emerald-300 text-xs font-mono font-bold tracking-wide">
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                FASE 2 • TELA PRIVADA (GESTÃO, ADM & RH)
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-[10px] font-mono">
                SIGILO DE PRODUTO & ARQUITETURA
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Design System, Wireframes & Mapa de Navegação
            </h1>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Ambiente de arquitetura restrito a Gestão, Administração e RH: estrutura ergonômica corporativa, fluxo das 22 telas navegáveis e especificações visuais para o GIHS System.
            </p>

            {currentUser && (
              <div className="flex items-center gap-2 bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-800 w-fit text-xs text-slate-300 mt-3">
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-5 h-5 rounded-full object-cover ring-1 ring-emerald-500"
                />
                <span>
                  Operador Autorizado: <strong className="text-white">{currentUser.name}</strong>
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                  {currentUser.userRole}
                </span>
              </div>
            )}
          </div>

          {/* Quick Tab Switcher */}
          <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-slate-950/80 rounded-2xl border border-slate-800 self-start lg:self-center">
            <button
              onClick={() => setActiveTab('navmap')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'navmap'
                  ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Workflow className="w-3.5 h-3.5" />
              <span>Mapa de Navegação</span>
            </button>

            <button
              onClick={() => setActiveTab('wireframes')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'wireframes'
                  ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Wireframes & Layout</span>
            </button>

            <button
              onClick={() => setActiveTab('designsystem')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'designsystem'
                  ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Palette className="w-3.5 h-3.5" />
              <span>Design System</span>
            </button>

            <button
              onClick={() => setActiveTab('matrix')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'matrix'
                  ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Matriz 22 Telas</span>
            </button>
          </div>
        </div>
      </div>

      {/* TAB 1: MAPA DE NAVEGAÇÃO & FLUXO INTERSETORIAL */}
      {activeTab === 'navmap' && (
        <div className="space-y-8 animate-in fade-in duration-200">
          {/* Section: Intersector Workflow Interactive Simulator */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
              <div>
                <div className="flex items-center gap-2">
                  <Workflow className="w-5 h-5 text-cyan-400" />
                  <h2 className="text-base font-bold text-white uppercase tracking-wider">
                    Fluxo Operacional Intersetorial Integrado
                  </h2>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Como uma demanda percorre os setores do GIHS System sem perda de contexto ou retrabalho.
                </p>
              </div>

              <span className="text-[11px] font-mono text-cyan-300 bg-cyan-950/80 border border-cyan-800 px-3 py-1 rounded-full self-start">
                8 Etapas Conectadas
              </span>
            </div>

            {/* Stepper Horizontal Tracker */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 mb-6">
              {workflowSteps.map((ws, idx) => (
                <button
                  key={ws.step}
                  onClick={() => setSelectedWorkflowStep(idx)}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    selectedWorkflowStep === idx
                      ? 'bg-cyan-950 border-cyan-500 shadow-md shadow-cyan-900/40 text-cyan-200'
                      : 'bg-slate-950/50 border-slate-800 hover:border-slate-700 text-slate-400'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                      0{ws.step}
                    </span>
                    {selectedWorkflowStep === idx && (
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping"></span>
                    )}
                  </div>
                  <p className="text-[11px] font-bold text-slate-200 truncate">{ws.name}</p>
                  <p className="text-[9px] text-slate-500 truncate mt-0.5">{ws.sector}</p>
                </button>
              ))}
            </div>

            {/* Active Workflow Step Detail Card */}
            {(() => {
              const cur = workflowSteps[selectedWorkflowStep];
              return (
                <div className="p-5 rounded-2xl bg-slate-950 border border-cyan-500/30 shadow-inner flex flex-col md:flex-row items-start justify-between gap-6">
                  <div className="space-y-3 flex-1">
                    <div className="flex items-center gap-3">
                      <span className="px-2.5 py-1 rounded-lg bg-cyan-500/20 text-cyan-300 font-mono text-xs font-bold border border-cyan-500/30">
                        Etapa 0{cur.step} de 08
                      </span>
                      <h3 className="text-lg font-black text-white">{cur.name}</h3>
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                        {cur.sector}
                      </span>
                    </div>

                    <p className="text-sm text-slate-300 leading-relaxed">
                      {cur.action}
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
                      <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                        <span className="text-slate-500 block text-[10px] uppercase tracking-wider font-semibold">Responsável:</span>
                        <span className="font-bold text-slate-200 mt-0.5 block">{cur.actor}</span>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                        <span className="text-slate-500 block text-[10px] uppercase tracking-wider font-semibold">Saída / Entregável:</span>
                        <span className="font-bold text-slate-200 mt-0.5 block">{cur.output}</span>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                        <span className="text-slate-500 block text-[10px] uppercase tracking-wider font-semibold">Meta de SLA:</span>
                        <span className="font-bold text-emerald-400 mt-0.5 block font-mono">{cur.sla}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 shrink-0 self-stretch sm:self-center justify-center">
                    <button
                      onClick={() => setSelectedWorkflowStep((prev) => (prev + 1) % workflowSteps.length)}
                      className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-cyan-700/30"
                    >
                      <span>Avançar Etapa</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onNavigate('chamados')}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Abrir Central Help Desk</span>
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Section: Interactive Sitemap Tree of all 22 screens */}
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-black text-white flex items-center gap-2">
                  <Compass className="w-5 h-5 text-cyan-400" />
                  <span>Mapa de Rotas & Telas (22 Telas Estruturadas)</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Clique em qualquer tela para navegar diretamente e testar em tempo real.
                </p>
              </div>

              {/* Search filter for screens */}
              <div className="relative w-full sm:w-72">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  placeholder="Filtrar telas e módulos..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {sitemapDomains.map((dom, dIdx) => {
                const filteredScreens = dom.screens.filter(
                  (s) =>
                    s.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
                    s.id.toLowerCase().includes(searchFilter.toLowerCase()) ||
                    s.layout.toLowerCase().includes(searchFilter.toLowerCase())
                );

                if (filteredScreens.length === 0) return null;

                return (
                  <div
                    key={dIdx}
                    className={`p-5 rounded-2xl border ${dom.color} backdrop-blur-sm flex flex-col justify-between shadow-lg`}
                  >
                    <div>
                      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800/80">
                        <span className="font-mono text-xs font-bold tracking-wider">{dom.domain}</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
                          {filteredScreens.length} telas
                        </span>
                      </div>

                      <div className="space-y-2.5">
                        {filteredScreens.map((sc) => {
                          const Icon = sc.icon;
                          return (
                            <div
                              key={sc.id}
                              onClick={() => onNavigate(sc.id)}
                              className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-cyan-500/50 hover:bg-slate-900 transition-all cursor-pointer group flex items-start justify-between gap-2 shadow-sm"
                            >
                              <div className="flex items-start gap-2.5 min-w-0">
                                <div className="p-1.5 rounded-lg bg-slate-800/80 text-cyan-400 group-hover:text-cyan-300 group-hover:bg-cyan-950 transition-colors shrink-0 mt-0.5">
                                  <Icon className="w-4 h-4" />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-xs font-bold text-slate-200 group-hover:text-white transition-colors truncate">
                                    {sc.title}
                                  </p>
                                  <p className="text-[10px] text-slate-500 truncate mt-0.5">
                                    {sc.layout}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-1 shrink-0">
                                <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition-all" />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: WIREFRAMES & LAYOUT SPECS */}
      {activeTab === 'wireframes' && (
        <div className="space-y-8 animate-in fade-in duration-200">
          {/* Viewport switcher */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900 border border-slate-800">
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                <span>Arquitetura de Layout & Wireframes Responsivos</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Padrão estrutural Desktop-first com adaptação para notebooks e tablets.
              </p>
            </div>

            <div className="flex items-center gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800 self-start sm:self-center">
              <button
                onClick={() => setWireframeViewport('desktop')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  wireframeViewport === 'desktop'
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Monitor className="w-3.5 h-3.5" />
                <span>Desktop (1440px+)</span>
              </button>

              <button
                onClick={() => setWireframeViewport('notebook')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  wireframeViewport === 'notebook'
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Monitor className="w-3.5 h-3.5" />
                <span>Notebook (1280px)</span>
              </button>

              <button
                onClick={() => setWireframeViewport('tablet')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  wireframeViewport === 'tablet'
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Tablet className="w-3.5 h-3.5" />
                <span>Tablet (768px - 1024px)</span>
              </button>
            </div>
          </div>

          {/* Wireframe Schematic Canvas */}
          <div className="p-6 rounded-3xl bg-slate-950 border border-slate-800 shadow-2xl space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse"></span>
                <span className="font-mono text-xs font-bold text-white uppercase tracking-widest">
                  Blueprint Esquemático: Layout Master Corporativo ({wireframeViewport.toUpperCase()})
                </span>
              </div>
              <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/80 px-2.5 py-0.5 rounded border border-cyan-800">
                12-Col Responsive Grid
              </span>
            </div>

            {/* Wireframe Mock Frame */}
            <div
              className={`mx-auto bg-slate-900/90 rounded-2xl border-2 border-dashed border-cyan-500/40 p-4 transition-all duration-300 shadow-xl ${
                wireframeViewport === 'desktop'
                  ? 'max-w-5xl'
                  : wireframeViewport === 'notebook'
                  ? 'max-w-3xl'
                  : 'max-w-xl'
              }`}
            >
              {/* Header Wireframe Strip */}
              <div className="h-12 rounded-xl bg-slate-800/80 border border-slate-700/80 mb-3 px-4 flex items-center justify-between text-[11px] font-mono text-slate-300">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-cyan-600 flex items-center justify-center text-white font-bold text-[10px]">
                    B
                  </div>
                  <span className="text-white font-bold">[TopBar Global: Busca Rápida Cmd+K • Breadcrumb • Alertas • Persona Switcher]</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full bg-emerald-500/40 border border-emerald-400"></span>
                  <span className="text-[10px] text-slate-400">Ponto Ativo</span>
                </div>
              </div>

              {/* Main Workspace Wireframe Columns */}
              <div className="flex gap-3">
                {/* Sidebar Wireframe */}
                <div
                  className={`rounded-xl bg-slate-850 border border-slate-700/70 p-3 flex flex-col justify-between text-[10px] font-mono text-slate-400 shrink-0 ${
                    wireframeViewport === 'tablet' ? 'w-14 items-center' : 'w-52'
                  }`}
                >
                  <div className="space-y-2 w-full">
                    <div className="h-4 bg-slate-700/60 rounded w-3/4"></div>
                    <div className="h-7 bg-cyan-950 border border-cyan-800 rounded flex items-center px-2 text-cyan-300">
                      {wireframeViewport === 'tablet' ? 'Nav' : '⚡ 22 Telas'}
                    </div>
                    <div className="space-y-1.5 pt-2">
                      <div className="h-5 bg-slate-800 rounded"></div>
                      <div className="h-5 bg-slate-800 rounded"></div>
                      <div className="h-5 bg-slate-800 rounded"></div>
                      <div className="h-5 bg-slate-800 rounded"></div>
                      <div className="h-5 bg-slate-800 rounded"></div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-800 text-center w-full">
                    <div className="h-5 bg-purple-950/60 border border-purple-800 rounded text-purple-300 flex items-center justify-center text-[9px]">
                      RBAC
                    </div>
                  </div>
                </div>

                {/* Content Canvas Wireframe */}
                <div className="flex-1 space-y-3">
                  {/* Hero / Greeting Bar */}
                  <div className="h-14 rounded-xl bg-slate-800/60 border border-slate-700/50 p-3 flex items-center justify-between">
                    <div>
                      <div className="h-3.5 bg-slate-300/80 rounded w-36 mb-1"></div>
                      <div className="h-2.5 bg-slate-500/60 rounded w-48"></div>
                    </div>
                    <div className="flex gap-2">
                      <div className="h-6 w-20 bg-slate-700 rounded"></div>
                      <div className="h-6 w-24 bg-cyan-600 rounded"></div>
                    </div>
                  </div>

                  {/* 6 KPI Cards Wireframe Row */}
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <div key={i} className="h-16 rounded-lg bg-slate-850 border border-slate-800 p-2 flex flex-col justify-between">
                        <div className="flex justify-between">
                          <div className="h-2 w-10 bg-slate-600 rounded"></div>
                          <div className="w-3.5 h-3.5 bg-cyan-500/20 rounded"></div>
                        </div>
                        <div className="h-4 w-8 bg-slate-200 rounded"></div>
                        <div className="h-1.5 w-12 bg-slate-600 rounded"></div>
                      </div>
                    ))}
                  </div>

                  {/* Main Work Split Pane (7 cols vs 5 cols) */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                    <div className="sm:col-span-7 h-44 rounded-xl bg-slate-850 border border-slate-800 p-3 flex flex-col justify-between">
                      <div className="h-3 w-40 bg-slate-400 rounded"></div>
                      <div className="space-y-2 my-auto">
                        <div className="h-3 bg-slate-800 rounded w-full flex overflow-hidden">
                          <div className="h-full bg-cyan-500 w-3/4"></div>
                        </div>
                        <div className="h-3 bg-slate-800 rounded w-full flex overflow-hidden">
                          <div className="h-full bg-blue-500 w-4/5"></div>
                        </div>
                        <div className="h-3 bg-slate-800 rounded w-full flex overflow-hidden">
                          <div className="h-full bg-emerald-500 w-2/3"></div>
                        </div>
                      </div>
                      <div className="h-2.5 w-32 bg-slate-600 rounded"></div>
                    </div>

                    <div className="sm:col-span-5 h-44 rounded-xl bg-slate-850 border border-slate-800 p-3 flex flex-col justify-between">
                      <div className="h-3 w-32 bg-slate-400 rounded"></div>
                      <div className="space-y-1.5 my-auto">
                        <div className="h-4 bg-slate-900 rounded"></div>
                        <div className="h-4 bg-slate-900 rounded"></div>
                        <div className="h-4 bg-slate-900 rounded"></div>
                      </div>
                      <div className="h-2.5 w-24 bg-slate-600 rounded"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Ergonomics & Padding Math Explanatory Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-800 text-xs">
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1.5">
                <span className="font-mono text-cyan-400 font-bold block text-[11px]">MATEMÁTICA DE ESPAÇAMENTO</span>
                <h4 className="font-bold text-white">Hierarquia & Padding Math</h4>
                <p className="text-slate-400 leading-relaxed text-[11px]">
                  O padding dos containers externos (p-6 / 24px) sempre excede o espaçamento interno (gap-3 / 12px).
                  Nenhum card fica encavalado ou com texto sem respiração.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1.5">
                <span className="font-mono text-emerald-400 font-bold block text-[11px]">FLUXO VISUAL F/Z-PATTERN</span>
                <h4 className="font-bold text-white">Ergonomia de Varredura</h4>
                <p className="text-slate-400 leading-relaxed text-[11px]">
                  Varredura ocular natural: Identidade corporativa no topo esquerdo, indicadores de ponto à direita,
                  métricas prioritárias na primeira dobra e tabelas densas na área de rolagem vertical.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1.5">
                <span className="font-mono text-purple-400 font-bold block text-[11px]">TOQUES & ACESSIBILIDADE</span>
                <h4 className="font-bold text-white">Touch Targets & WCAG</h4>
                <p className="text-slate-400 leading-relaxed text-[11px]">
                  Botões e controles interativos possuem área de clique mínima de 44px em dispositivos móveis,
                  e contraste de cor em conformidade estrita com a diretriz WCAG AA (4.5:1+).
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: DESIGN SYSTEM TOKENS & COMPONENTS */}
      {activeTab === 'designsystem' && (
        <div className="space-y-8 animate-in fade-in duration-200">
          {/* Color Palette Tokens */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5">
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Palette className="w-4 h-4 text-cyan-400" />
                <span>Paleta de Cores & Tokens Semânticos ("Enterprise Technology")</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Base neutra escura de alta fidelidade óptica combinada com acentos funcionais de alta legibilidade.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 shadow-sm">
                <div className="h-12 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center font-mono text-[10px] text-slate-400">
                  #020617
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Slate 950</h4>
                  <p className="text-[10px] text-slate-500 font-mono">Canvas Principal</p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 shadow-sm">
                <div className="h-12 rounded-xl bg-slate-900 border border-slate-700/80 flex items-center justify-center font-mono text-[10px] text-slate-400">
                  #0f172a
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Slate 900</h4>
                  <p className="text-[10px] text-slate-500 font-mono">Superfície de Cards</p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 shadow-sm">
                <div className="h-12 rounded-xl bg-cyan-600 flex items-center justify-center font-mono text-[10px] text-white font-bold shadow-md shadow-cyan-600/30">
                  #0891b2
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Cyan 600</h4>
                  <p className="text-[10px] text-cyan-400 font-mono">Acento Primário TI</p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 shadow-sm">
                <div className="h-12 rounded-xl bg-emerald-600 flex items-center justify-center font-mono text-[10px] text-white font-bold shadow-md shadow-emerald-600/30">
                  #059669
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Emerald 600</h4>
                  <p className="text-[10px] text-emerald-400 font-mono">Sucesso / Ponto OK</p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 shadow-sm">
                <div className="h-12 rounded-xl bg-amber-600 flex items-center justify-center font-mono text-[10px] text-white font-bold shadow-md shadow-amber-600/30">
                  #d97706
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Amber 600</h4>
                  <p className="text-[10px] text-amber-400 font-mono">Atraso / Atenção</p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 shadow-sm">
                <div className="h-12 rounded-xl bg-purple-600 flex items-center justify-center font-mono text-[10px] text-white font-bold shadow-md shadow-purple-600/30">
                  #9333ea
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Purple 600</h4>
                  <p className="text-[10px] text-purple-400 font-mono">Super Admin / RBAC</p>
                </div>
              </div>
            </div>
          </div>

          {/* Typography Scale */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5">
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Type className="w-4 h-4 text-cyan-400" />
                <span>Escala Tipográfica Matemática</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Fonte Display: <strong>Plus Jakarta Sans</strong> • Fonte de Código/Métricas: <strong>JetBrains Mono</strong>
              </p>
            </div>

            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-baseline justify-between gap-4">
                <div>
                  <span className="text-[10px] font-mono text-cyan-400 block mb-1">Display Hero (32px / 40px - Black 900)</span>
                  <h1 className="text-2xl sm:text-3xl font-black text-white">Gestão Integrada GIHS System 100% Monitorada</h1>
                </div>
                <span className="font-mono text-xs text-slate-500 shrink-0">Scale: 2.0x</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-baseline justify-between gap-4">
                <div>
                  <span className="text-[10px] font-mono text-cyan-400 block mb-1">Heading 2 (20px / 28px - Bold 700)</span>
                  <h2 className="text-xl font-bold text-white">Produtividade por Setor e Métricas de SLA</h2>
                </div>
                <span className="font-mono text-xs text-slate-500 shrink-0">Scale: 1.4x</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-baseline justify-between gap-4">
                <div>
                  <span className="text-[10px] font-mono text-cyan-400 block mb-1">Body Text (14px / 20px - Medium 500)</span>
                  <p className="text-sm text-slate-300">
                    Todas as horas trabalhadas e apontamentos técnicos são consolidados automaticamente no banco de dados.
                  </p>
                </div>
                <span className="font-mono text-xs text-slate-500 shrink-0">Scale: 1.0x</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-baseline justify-between gap-4">
                <div>
                  <span className="text-[10px] font-mono text-cyan-400 block mb-1">Code & Timestamps (11px / 16px - Monospace Bold)</span>
                  <p className="font-mono text-xs text-cyan-300 font-bold">
                    08:00 - 12:00 [ENTRADA] • HASH: e4b7-991f • SLA_TARGET: 99.8%
                  </p>
                </div>
                <span className="font-mono text-xs text-slate-500 shrink-0">Mono 0.85x</span>
              </div>
            </div>
          </div>

          {/* Interactive Component Library Playground */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Sliders className="w-4 h-4 text-cyan-400" />
                <span>Galeria de Componentes Funcionais da Plataforma</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Padrões reutilizáveis em todas as 22 telas com estados ativos, foco e hover.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Buttons Playground */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
                  1. Botões & Ações
                </span>
                <div className="flex flex-wrap items-center gap-2.5 pt-1">
                  <button className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold shadow-lg shadow-cyan-600/30 transition-all cursor-pointer">
                    Primário Gradiente
                  </button>
                  <button className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors cursor-pointer">
                    Secundário Outline
                  </button>
                  <button className="px-3 py-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white text-xs font-medium transition-colors cursor-pointer">
                    Ghost / Neutro
                  </button>
                  <button className="px-3 py-2 rounded-xl bg-rose-950/60 border border-rose-800/80 text-rose-300 hover:bg-rose-900/60 text-xs font-semibold transition-colors cursor-pointer">
                    Destrutivo
                  </button>
                </div>
              </div>

              {/* Status Badges & Pills */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
                  2. Badges de Status & SLA
                </span>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold">
                    ● Normal / Em Dia
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-bold">
                    ▲ Atraso Leve
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[11px] font-bold">
                    ✕ Crítico
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[11px] font-bold">
                    ★ Super Admin
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[11px] font-bold">
                    ⚡ GIHS Agents
                  </span>
                </div>
              </div>

              {/* KPI Metric Card Anatomy */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
                  3. Anatomia de Card de Métrica (KPI)
                </span>
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-sm flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-slate-400">Assiduidade da TI</span>
                    <div className="text-2xl font-black text-white mt-0.5">97.4%</div>
                    <span className="text-[11px] text-emerald-400 font-mono mt-1 inline-block">
                      +2.1% em relação à semana anterior
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                </div>
              </div>

              {/* Form Input Anatomy */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
                  4. Campo de Entrada com Validação
                </span>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                    <span>Título da Atividade Técnica</span>
                    <span className="text-cyan-400 text-[10px] font-mono">Obrigatório</span>
                  </label>
                  <input
                    type="text"
                    defaultValue="Otimização de índices PostgreSQL no banco principal"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 transition-colors"
                  />
                  <p className="text-[10px] text-slate-500">Exemplo de estado com foco e valor atribuído.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: MATRIZ DE TELAS & CONFORMIDADE RBAC */}
      {activeTab === 'matrix' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900 border border-slate-800">
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Matriz Completa das 22 Telas do Protótipo</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Mapeamento de papéis permitidos, arquitetura de visualização e botão de salto imediato.
              </p>
            </div>

            <span className="text-xs font-mono text-cyan-300 bg-cyan-950 border border-cyan-800 px-3 py-1 rounded-full self-start">
              100% Cobertura de Telas
            </span>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-[11px] font-mono text-slate-400 uppercase tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="p-4">Tela / Identificador</th>
                    <th className="p-4">Título no Sistema</th>
                    <th className="p-4">Categoria</th>
                    <th className="p-4">Papéis Autorizados (RBAC)</th>
                    <th className="p-4 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {Object.values(SCREEN_SECURITY_POLICIES).map((pol) => {
                    const isAll = pol.allowedRoles.length === 4;
                    const isSuperOnly = pol.allowedRoles.length === 1 && pol.allowedRoles[0] === 'SUPER_ADMIN';

                    return (
                      <tr key={pol.screen} className="hover:bg-slate-850/60 transition-colors">
                        <td className="p-4 font-mono font-bold text-cyan-400">
                          {pol.screen}
                        </td>
                        <td className="p-4 font-semibold text-white">
                          {pol.screenTitle}
                        </td>
                        <td className="p-4">
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px]">
                            {pol.category}
                          </span>
                        </td>
                        <td className="p-4">
                          {isAll ? (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] font-semibold">
                              Todos os Papéis
                            </span>
                          ) : isSuperOnly ? (
                            <span className="px-2 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-800 text-[10px] font-semibold">
                              Apenas Super Admin
                            </span>
                          ) : (
                            <div className="flex flex-wrap gap-1">
                              {pol.allowedRoles.map((r) => (
                                <span
                                  key={r}
                                  className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 text-[9px] font-mono"
                                >
                                  {r === 'SUPER_ADMIN' ? 'SUPER' : r}
                                </span>
                              ))}
                            </div>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => onNavigate(pol.screen)}
                            className="px-3 py-1 rounded-lg bg-cyan-600/20 hover:bg-cyan-600 text-cyan-300 hover:text-white border border-cyan-500/30 text-[11px] font-bold transition-all cursor-pointer inline-flex items-center gap-1"
                          >
                            <span>Abrir</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
