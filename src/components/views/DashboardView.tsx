import React, { useState, useEffect } from 'react';
import {
  Users,
  Coffee,
  CheckSquare,
  PhoneCall,
  Activity,
  TrendingUp,
  Clock,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Calendar,
  Layers,
  Shield,
  Flame,
  Network,
  Database,
  RefreshCw
} from 'lucide-react';
import { ViewScreen } from '../../types';

interface DashboardViewProps {
  onNavigate: (screen: ViewScreen) => void;
}

interface DashboardMetricsState {
  activeCollaborators: number;
  absentCollaborators: number;
  intervalCollaborators: number;
  totalCollaborators: number;
  activeTasks: number;
  pendingTasks: number;
  delayedTasks: number;
  doneTasks: number;
  activeTickets: number;
  openTickets: number;
  inProgressTickets: number;
  resolvedTickets: number;
  todayTimeClockPunches: number;
  workingPonto: number;
  intervalPonto: number;
  delayPonto: number;
  overtimePonto: number;
  registeredActivities: number;
  slaCompliance: number;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate }) => {
  const [dashboardMode, setDashboardMode] = useState<'operacional' | 'executivo'>('operacional');
  const [isLoading, setIsLoading] = useState(false);
  const [postgresConnected, setPostgresConnected] = useState<boolean | null>(null);

  // All initial states ZEROED ready for PostgreSQL
  const [stats, setStats] = useState<DashboardMetricsState>({
    activeCollaborators: 0,
    absentCollaborators: 0,
    intervalCollaborators: 0,
    totalCollaborators: 0,
    activeTasks: 0,
    pendingTasks: 0,
    delayedTasks: 0,
    doneTasks: 0,
    activeTickets: 0,
    openTickets: 0,
    inProgressTickets: 0,
    resolvedTickets: 0,
    todayTimeClockPunches: 0,
    workingPonto: 0,
    intervalPonto: 0,
    delayPonto: 0,
    overtimePonto: 0,
    registeredActivities: 0,
    slaCompliance: 0,
  });

  const [sectorsProductivity, setSectorsProductivity] = useState<any[]>([]);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/dashboard/metrics');
      if (res.ok) {
        const data = await res.json();
        if (data.stats) {
          setStats(data.stats);
        }
        setPostgresConnected(data.postgresLive ?? false);
        setSectorsProductivity(data.sectorsProductivity || []);
        setRecentActivities(data.recentActivities || []);
        setCalendarEvents(data.calendarEvents || []);
        setAlerts(data.alerts || []);
      }
    } catch {
      // In case server is offline, keep zeroed state
      setPostgresConnected(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const operationalKPIs = [
    {
      id: 'kpi-colabs',
      title: 'Colaboradores Ativos',
      value: String(stats.activeCollaborators),
      label: `${stats.absentCollaborators} ausentes • ${stats.intervalCollaborators} intervalo (${stats.totalCollaborators} total)`,
      icon: Users,
      action: 'colaboradores' as ViewScreen
    },
    {
      id: 'kpi-tarefas',
      title: 'Tarefas Ativas',
      value: String(stats.activeTasks),
      label: `${stats.pendingTasks} pendentes • ${stats.delayedTasks} atrasadas • ${stats.doneTasks} feitas`,
      icon: CheckSquare,
      action: 'meu_kanban' as ViewScreen
    },
    {
      id: 'kpi-demandas',
      title: 'Demandas & Chamados',
      value: String(stats.activeTickets),
      label: `${stats.openTickets} abertas • ${stats.inProgressTickets} andamento • ${stats.resolvedTickets} resolvidas`,
      icon: PhoneCall,
      action: 'chamados' as ViewScreen
    },
    {
      id: 'kpi-ponto',
      title: 'Controle de Ponto',
      value: String(stats.todayTimeClockPunches),
      label: 'Batidas faciais computadas (PostgreSQL)',
      icon: Clock,
      action: 'gestao_ponto' as ViewScreen
    },
    {
      id: 'kpi-atividades',
      title: 'Atividades Registradas',
      value: String(stats.registeredActivities),
      label: 'Apontamentos no PostgreSQL',
      icon: Activity,
      action: 'planilhas' as ViewScreen
    },
    {
      id: 'kpi-produtividade',
      title: 'Produtividade Geral',
      value: stats.slaCompliance > 0 ? `${stats.slaCompliance}%` : '0.0%',
      label: 'SLA consolidado via PostgreSQL',
      icon: TrendingUp,
      action: 'relatorios' as ViewScreen
    }
  ];

  const executivePillars = [
    {
      id: 'exec-empresa',
      pillar: 'EMPRESA',
      title: 'Colaboradores Ativos',
      metric: `${stats.activeCollaborators} / ${stats.totalCollaborators} em Produção`,
      subtext: `${stats.absentCollaborators} Ausentes • ${stats.intervalCollaborators} em Intervalo (PostgreSQL)`,
      icon: Users,
      badge: stats.totalCollaborators > 0 ? 'Conectado' : 'Aguardando Dados',
      badgeColor: stats.totalCollaborators > 0 
        ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
        : 'bg-slate-100 text-slate-600 border-slate-200',
      action: 'colaboradores' as ViewScreen
    },
    {
      id: 'exec-operacao',
      pillar: 'OPERAÇÃO',
      title: 'Chamados & SLA',
      metric: `${stats.activeTickets} Demandas Ativas`,
      subtext: `${stats.openTickets} abertas • ${stats.inProgressTickets} em andamento • ${stats.resolvedTickets} resolvidas`,
      icon: PhoneCall,
      badge: stats.activeTickets > 0 ? 'Fila Ativa' : 'Fila Zerada',
      badgeColor: 'bg-blue-50 text-[#37558d] border-blue-200',
      action: 'chamados' as ViewScreen
    },
    {
      id: 'exec-produtividade',
      pillar: 'PRODUTIVIDADE',
      title: 'Tarefas & Entregas',
      metric: `${stats.doneTasks} Entregas`,
      subtext: `${stats.pendingTasks} Pendências • ${stats.delayedTasks} Atrasadas • Base PostgreSQL`,
      icon: CheckSquare,
      badge: stats.activeTasks > 0 ? 'Pipeline Ativo' : 'Sem Pendências',
      badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      action: 'meu_kanban' as ViewScreen
    },
    {
      id: 'exec-ponto',
      pillar: 'PONTO ELETRÔNICO',
      title: 'Presença & Assiduidade',
      metric: `${stats.todayTimeClockPunches} Batidas Hoje`,
      subtext: `${stats.workingPonto} em expediente • ${stats.intervalPonto} em intervalo • ${stats.delayPonto} atrasos`,
      icon: Clock,
      badge: 'Auditado PostgreSQL',
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      action: 'espelho_ponto' as ViewScreen
    },
    {
      id: 'exec-dev',
      pillar: 'DESENVOLVIMENTO',
      title: 'Projetos em Curso',
      metric: `${stats.activeTasks} Tarefas Técnicas`,
      subtext: 'Demandas técnicas e tickets vinculados ao schema gihs_core do PostgreSQL',
      icon: Layers,
      badge: 'PostgreSQL Core',
      badgeColor: 'bg-blue-50 text-[#37558d] border-blue-200',
      action: 'kanban_equipe' as ViewScreen
    },
    {
      id: 'exec-seguranca',
      pillar: 'SEGURANÇA & DADOS',
      title: 'Banco de Dados & SIEM',
      metric: postgresConnected ? 'PostgreSQL Ativo' : 'PostgreSQL Desconectado',
      subtext: postgresConnected 
        ? 'Pool de conexões pronto • Schema gihs_core estruturado'
        : 'Aguardando configuração de host/DATABASE_URL para carregar dados',
      icon: ShieldCheck,
      badge: postgresConnected ? 'Conectado' : 'Aguardando Conexão',
      badgeColor: postgresConnected 
        ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
        : 'bg-amber-50 text-amber-700 border-amber-200',
      action: 'auditoria' as ViewScreen
    }
  ];

  const timeClockStats = [
    { label: 'Em Expediente', count: stats.workingPonto, icon: Users, color: 'text-emerald-800 bg-emerald-50/90 border-emerald-200' },
    { label: 'Ponto Registrado', count: stats.todayTimeClockPunches, icon: Clock, color: 'text-blue-800 bg-blue-50/90 border-blue-200' },
    { label: 'Atrasos (Tolerância)', count: stats.delayPonto, icon: AlertTriangle, color: 'text-amber-800 bg-amber-50/90 border-amber-200' },
    { label: 'Em Intervalo', count: stats.intervalPonto, icon: Coffee, color: 'text-cyan-800 bg-cyan-50/90 border-cyan-200' },
    { label: 'Hora Extra', count: stats.overtimePonto, icon: Flame, color: 'text-rose-800 bg-rose-50/90 border-rose-200' }
  ];

  const totalTasks = stats.activeTasks + stats.doneTasks;

  return (
    <div className="space-y-6 animate-in fade-in duration-300" id="main-dashboard-container">
      {/* Top Banner do Dashboard em Div Branca */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">
              GIHS System — Gestão Integrada
            </h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <Database className="w-3 h-3 text-emerald-600" />
              <span>Modo PostgreSQL</span>
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Painel unificado conectado ao banco de dados relacional PostgreSQL.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Refresh Button */}
          <button
            type="button"
            onClick={fetchDashboardData}
            disabled={isLoading}
            className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all cursor-pointer shadow-xs disabled:opacity-50"
            title="Atualizar dados do PostgreSQL"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-[#37558d]' : ''}`} />
          </button>

          {/* Mode Switcher: Operacional vs Executivo */}
          <div className="flex items-center p-1 rounded-xl border border-slate-200 bg-slate-50">
            <button
              type="button"
              onClick={() => setDashboardMode('operacional')}
              className={`px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer font-bold ${
                dashboardMode === 'operacional'
                  ? 'bg-white text-[#37558d] shadow-xs border border-slate-200'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Visão Operacional
            </button>
            <button
              type="button"
              onClick={() => setDashboardMode('executivo')}
              className={`px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer font-bold ${
                dashboardMode === 'executivo'
                  ? 'bg-white text-[#37558d] shadow-xs border border-slate-200'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Visão Executiva (Gestão)
            </button>
          </div>

          {/* Navigation Link: Organograma */}
          <button
            type="button"
            onClick={() => onNavigate('organograma')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-50 hover:bg-[#37558d] hover:text-white border border-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer shadow-xs group"
          >
            <Network className="w-3.5 h-3.5 text-[#37558d] group-hover:text-white transition-colors" />
            <span>Organograma</span>
          </button>

          {/* Navigation Link: Colaboradores */}
          <button
            type="button"
            onClick={() => onNavigate('colaboradores')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-50 hover:bg-[#37558d] hover:text-white border border-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer shadow-xs group"
          >
            <Shield className="w-3.5 h-3.5 text-[#37558d] group-hover:text-white transition-colors" />
            <span>Colaboradores</span>
          </button>
        </div>
      </div>

      {/* PostgreSQL Status Indicator Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-3 rounded-2xl bg-white border border-slate-200 text-xs shadow-sm">
        <div className="flex items-center gap-2.5">
          <span className={`w-2.5 h-2.5 rounded-full ${postgresConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></span>
          <span className="font-semibold text-slate-700">
            Conexão com PostgreSQL:
          </span>
          <span className={`font-mono font-bold ${postgresConnected ? 'text-emerald-700' : 'text-amber-700'}`}>
            {postgresConnected ? 'Conectado (Online)' : 'Aguardando Host PostgreSQL / Dados Zerados'}
          </span>
        </div>
        <div className="text-[11px] text-slate-500 font-medium">
          Métricas e auditoria sincronizadas diretamente do banco relacional.
        </div>
      </div>

      {/* KPI Cards em Grid (Visão Operacional) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {operationalKPIs.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <button
              key={kpi.id}
              type="button"
              onClick={() => onNavigate(kpi.action)}
              className="p-4 rounded-3xl border border-slate-200 bg-white hover:border-[#37558d]/50 hover:shadow-md transition-all cursor-pointer group shadow-sm flex flex-col justify-between text-left w-full"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-600 group-hover:text-[#37558d] transition-colors truncate">
                    {kpi.title}
                  </span>
                  <div className="p-1.5 rounded-lg bg-slate-50 text-[#37558d] border border-slate-200 shrink-0 group-hover:bg-[#37558d]/10 transition-colors">
                    <Icon className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-slate-900 tracking-tight">
                  {kpi.value}
                </div>
              </div>
              <p className="text-[11px] text-slate-500 font-medium mt-2 truncate">
                {kpi.label}
              </p>
            </button>
          );
        })}
      </div>

      {/* Visão Executiva */}
      {dashboardMode === 'executivo' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="flex items-center justify-between p-4 rounded-3xl bg-white border border-slate-200 shadow-sm">
            <div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#37558d]" />
                <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider">
                  Pilares da Governança & Gestão Executiva (PostgreSQL)
                </h2>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Indicadores executivos consolidados a partir das tabelas relacionais do sistema.
              </p>
            </div>

            <span className="text-xs font-mono text-[#37558d] bg-blue-50 border border-blue-200 px-3 py-1 rounded-full font-bold">
              Visão Gerencial
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {executivePillars.map((ep) => {
              const Icon = ep.icon;
              return (
                <button
                  key={ep.id}
                  type="button"
                  onClick={() => onNavigate(ep.action)}
                  className="p-5 rounded-3xl bg-white border border-slate-200 hover:border-[#37558d]/50 hover:shadow-md transition-all cursor-pointer shadow-sm flex flex-col justify-between group text-left w-full"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-mono text-[10px] font-black tracking-widest text-[#37558d] uppercase">
                        {ep.pillar}
                      </span>
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${ep.badgeColor}`}>
                        {ep.badge}
                      </span>
                    </div>

                    <div className="flex items-start gap-3 mb-2">
                      <div className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-[#37558d] shrink-0">
                        <Icon className="w-5 h-5 text-[#37558d]" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-800">
                          {ep.title}
                        </h3>
                        <div className="text-lg font-black text-[#37558d] mt-0.5">
                          {ep.metric}
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-slate-500 font-medium leading-relaxed mt-2">
                      {ep.subtext}
                    </p>
                  </div>

                  <div className="pt-3 mt-4 border-t border-slate-100 flex items-center justify-between text-xs text-[#37558d]">
                    <span className="text-[11px] font-bold">Explorar módulo</span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#37558d] group-hover:translate-x-1 transition-transform" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Status do Ponto Eletrônico Hoje */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#37558d]" />
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">
                Status do Ponto Eletrônico Hoje ({stats.totalCollaborators} Colaboradores)
              </h3>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Jornada de trabalho registrada no PostgreSQL com marcação biométrica e auditoria.
            </p>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('gestao_ponto')}
            className="text-xs text-[#37558d] hover:text-[#2c4471] font-bold flex items-center gap-1 self-start sm:self-center cursor-pointer"
          >
            <span>Gerenciar Ponto (Admin)</span>
            <ArrowRight className="w-3 h-3 text-[#37558d]" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {timeClockStats.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className={`p-3.5 rounded-2xl border ${item.color} flex items-center justify-between shadow-2xs`}
              >
                <div>
                  <span className="text-xs font-bold block opacity-90">{item.label}</span>
                  <div className="text-xl font-black mt-0.5">{item.count}</div>
                </div>
                <Icon className="w-5 h-5 opacity-90" />
              </div>
            );
          })}
        </div>
      </div>

      {/* Grid de Produtividade & Status de Tarefas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Produtividade por Setor */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-[#37558d]" />
                  <h3 className="font-black text-sm text-slate-800">PRODUTIVIDADE POR SETOR (SLA)</h3>
                </div>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Métricas calculadas a partir de tickets e tarefas gravados no PostgreSQL
                </p>
              </div>
              <span className="text-[11px] font-mono text-[#37558d] bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full font-bold">
                {sectorsProductivity.length} Setores
              </span>
            </div>

            {sectorsProductivity.length === 0 ? (
              <div className="p-8 text-center rounded-2xl bg-slate-50 border border-slate-200 my-4">
                <TrendingUp className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-700">Nenhum dado de produtividade setorial no momento</p>
                <p className="text-[11px] text-slate-500 mt-1 max-w-sm mx-auto">
                  Os indicadores de SLA e produtividade aparecerão automaticamente quando tarefas forem inseridas no PostgreSQL.
                </p>
              </div>
            ) : (
              <div className="space-y-3.5 my-2">
                {sectorsProductivity.map((sec) => (
                  <div
                    key={sec.sector}
                    className="p-3 rounded-2xl bg-slate-50 border border-slate-100"
                  >
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-bold text-slate-800">{sec.sector}</span>
                      <span className="font-mono font-bold text-[#37558d] text-xs">
                        {sec.score}%
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden flex">
                      <div
                        className="h-full bg-gradient-to-r from-[#37558d] to-[#00A6FC] rounded-full"
                        style={{ width: `${sec.score}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium mt-4">
            <span>SLA Geral: <strong className="text-[#37558d] font-mono font-bold">{stats.slaCompliance > 0 ? `${stats.slaCompliance}%` : '0.0%'}</strong></span>
            <button
              type="button"
              onClick={() => onNavigate('relatorios')}
              className="text-[#37558d] hover:text-[#2c4471] font-bold flex items-center gap-1 cursor-pointer"
            >
              <span>Ver relatório consolidado</span>
              <ArrowRight className="w-3 h-3 text-[#37558d]" />
            </button>
          </div>
        </div>

        {/* Status das Tarefas */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-[#37558d]" />
                <h3 className="font-black text-sm text-slate-800">STATUS DAS TAREFAS ({totalTasks} TOTAL)</h3>
              </div>
              <span className="text-xs font-mono font-bold text-[#37558d] bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                PostgreSQL Pipeline
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mb-4">
              Distribuição por status na tabela gihs_core.tasks
            </p>

            {totalTasks === 0 ? (
              <div className="p-8 text-center rounded-2xl bg-slate-50 border border-slate-200 my-4">
                <CheckSquare className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-700">Nenhuma tarefa cadastrada no PostgreSQL</p>
                <p className="text-[11px] text-slate-500 mt-1 max-w-xs mx-auto">
                  Tarefas criadas nos Kanbans e chamados serão contabilizadas aqui.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                  <span className="font-bold text-slate-700">Pendentes</span>
                  <span className="text-[#37558d] font-bold font-mono">{stats.pendingTasks}</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                  <span className="font-bold text-slate-700">Atrasadas</span>
                  <span className="text-amber-600 font-bold font-mono">{stats.delayedTasks}</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                  <span className="font-bold text-slate-700">Concluídas</span>
                  <span className="text-emerald-600 font-bold font-mono">{stats.doneTasks}</span>
                </div>
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center text-xs">
            <span className="text-slate-500">Total no banco: <strong className="text-[#37558d] font-bold">{totalTasks} tarefas</strong></span>
            <button
              type="button"
              onClick={() => onNavigate('meu_kanban')}
              className="text-[#37558d] hover:text-[#2c4471] font-bold flex items-center gap-1 cursor-pointer"
            >
              <span>Abrir Meu Kanban</span>
              <ArrowRight className="w-3 h-3 text-[#37558d]" />
            </button>
          </div>
        </div>
      </div>

      {/* Atividades Recentes & Agenda */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#37558d]" />
              <h3 className="font-black text-sm text-slate-800">ATIVIDADES DA SEMANA & REGISTROS</h3>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('planilhas')}
              className="text-xs text-[#37558d] hover:text-[#2c4471] font-bold flex items-center gap-1 cursor-pointer"
            >
              <span>Base Completa de Atividades</span>
              <ArrowRight className="w-3 h-3 text-[#37558d]" />
            </button>
          </div>

          {recentActivities.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-slate-50 border border-slate-200">
              <Activity className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-700">Nenhum apontamento recente no PostgreSQL</p>
              <p className="text-[11px] text-slate-500 mt-1 max-w-sm mx-auto">
                Registros de horas e atividades lançados pelos colaboradores aparecerão aqui.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentActivities.map((act, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100 shadow-2xs"
                >
                  <span className="font-mono text-xs font-bold text-[#37558d] px-2 py-0.5 rounded-lg bg-blue-50 border border-blue-200 shrink-0">
                    {act.time}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-800 truncate">{act.text}</p>
                  </div>
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-white text-[#37558d] border border-slate-200 shrink-0">
                    {act.sector}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#37558d]" />
                <h3 className="font-black text-sm text-slate-800">AGENDA DO DIA</h3>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('agenda')}
                className="text-[11px] text-[#37558d] font-bold hover:underline cursor-pointer"
              >
                Ver calendário
              </button>
            </div>

            {calendarEvents.length === 0 ? (
              <div className="p-4 text-center rounded-2xl bg-slate-50 border border-slate-200 mb-4">
                <Calendar className="w-6 h-6 text-slate-400 mx-auto mb-1.5" />
                <p className="text-xs font-bold text-slate-700">Nenhum evento agendado para hoje</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Sincronizado com a tabela calendar_events do PostgreSQL</p>
              </div>
            ) : (
              <div className="space-y-2 mb-4">
                {calendarEvents.map((ev) => (
                  <div
                    key={ev.id}
                    className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-between"
                  >
                    <div>
                      <span className="font-bold text-slate-800 block">{ev.title}</span>
                      <span className="text-[11px] text-slate-500 font-semibold">{ev.location}</span>
                    </div>
                    <span className="font-mono text-[#37558d] font-bold px-2 py-0.5 rounded bg-blue-50 border border-blue-200 text-[10px]">
                      {ev.time}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between mb-3 pt-3 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <h3 className="font-black text-sm text-slate-800">ALERTAS & NOTIFICAÇÕES</h3>
              </div>
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            </div>

            {alerts.length === 0 ? (
              <div className="p-4 text-center rounded-2xl bg-slate-50 border border-slate-200">
                <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-1.5" />
                <p className="text-xs font-bold text-slate-700">Sistema 100% Estável</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Nenhum alerta pendente no PostgreSQL</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
                      alert.type === 'warning'
                        ? 'bg-amber-50 border-amber-200 text-amber-800'
                        : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    }`}
                  >
                    {alert.type === 'warning' ? (
                      <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <p className="font-bold text-xs">{alert.text}</p>
                      <p className="text-[10px] text-slate-500 font-medium mt-0.5">{alert.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => onNavigate('auditoria')}
            className="w-full py-2.5 px-3 rounded-xl bg-slate-50 hover:bg-[#37558d] hover:text-white text-slate-700 text-xs font-bold flex items-center justify-center gap-1.5 transition-all border border-slate-200 hover:border-[#37558d] cursor-pointer shadow-xs group"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-[#37558d] group-hover:text-white transition-colors" />
            <span>Consultar Log de Auditoria & Segurança</span>
          </button>
        </div>
      </div>
    </div>
  );
};
