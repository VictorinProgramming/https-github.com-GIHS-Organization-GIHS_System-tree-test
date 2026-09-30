import React, { useState, useMemo, useEffect } from 'react';
import {
  FileSpreadsheet,
  Download,
  Filter,
  Search,
  User,
  Building2,
  Calendar,
  Clock,
  CheckCircle2,
  ExternalLink,
  Layers,
  ArrowRight,
  UserCheck,
  AlertTriangle,
  X,
  Sparkles,
  Info,
  CalendarRange
} from 'lucide-react';
import { ActivityRecord, Sector, ViewScreen, Collaborator } from '../../../types';
import { activitySyncService } from '../../../services/activitySyncService';
import { taskService } from '../../../services/taskService';
import { ticketService } from '../../../services/ticketService';
import { apiBackendService } from '../../../services/apiBackendService';
import { dbService, UserDbModel } from '../../../services/dbService';
import { exportActivitiesToExcel, exportCollaboratorActivitiesToExcel } from '../../../utils/excelExport';
import { SECTORS, CURRENT_USER } from '../../../data/mockData';

interface LinkedActivitiesTabProps {
  currentUser?: Collaborator;
  onNavigate?: (screen: ViewScreen) => void;
}

// Normalize name by removing extra spaces, lowercase, and removing parenthesized annotations
const cleanNameForCompare = (name: string): string => {
  return (name || '')
    .toLowerCase()
    .replace(/\(.*?\)/g, '')
    .replace(/\[.*?\]/g, '')
    .replace(/[^a-z0-9áéíóúãõâêîôûàèìòùç\s]/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
};

// Helper to parse dates formatted as 'DD/MM/YYYY' or 'YYYY-MM-DD'
const parseDateToComparable = (dateStr: string): string | null => {
  if (!dateStr) return null;
  const trimmed = dateStr.trim();
  // If DD/MM/YYYY
  if (trimmed.includes('/')) {
    const parts = trimmed.split('/');
    if (parts.length === 3) {
      const day = parts[0].padStart(2, '0');
      const month = parts[1].padStart(2, '0');
      const year = parts[2];
      return `${year}-${month}-${day}`;
    }
  }
  // If YYYY-MM-DD
  if (trimmed.includes('-')) {
    const parts = trimmed.split('T')[0].split('-');
    if (parts.length === 3) {
      return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
    }
  }
  return null;
};

export const LinkedActivitiesTab: React.FC<LinkedActivitiesTabProps> = ({
  currentUser = CURRENT_USER,
  onNavigate
}) => {
  const [activities, setActivities] = useState<ActivityRecord[]>([]);
  const [systemUsers, setSystemUsers] = useState<string[]>([]);
  const [search, setSearch] = useState('');

  // FILTRO DE FUNCIONÁRIO / COLABORADOR (Default: usuário logado ou "TODOS")
  const [collaboratorFilter, setCollaboratorFilter] = useState<string>(
    currentUser?.name || 'TODOS'
  );

  // FILTRO DE DATA (Data Inicial e Data Final)
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const [sectorFilter, setSectorFilter] = useState('TODOS');
  const [statusFilter, setStatusFilter] = useState('TODOS');

  // Modal para forçar seleção de colaborador caso tente exportar em "TODOS"
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [selectedColabForExport, setSelectedColabForExport] = useState<string>(
    currentUser?.name || ''
  );
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // 1. Carregar atividades sincronizadas do Help Desk e do banco
  useEffect(() => {
    const loadActivitiesAndClosedTickets = async () => {
      const localActivities = activitySyncService.getActivities();

      // Também buscar chamados resolvidos do PostgreSQL para garantir que todo chamado fechado apareça aqui
      try {
        const closedTickets = await ticketService.getTickets('Resolvido');
        const mappedClosedTickets: ActivityRecord[] = [];
        closedTickets.forEach(t => {
          const rawDate = t.resolvedAt || t.createdAt || new Date().toISOString();
          const parsedDate = rawDate.includes('T') ? rawDate.split('T')[0] : rawDate;
          const formattedDate = parsedDate.includes('-')
            ? parsedDate.split('-').reverse().join('/')
            : parsedDate;

          mappedClosedTickets.push({
            id: `act-tk-${t.id}`,
            date: formattedDate,
            time: t.resolvedAt ? t.resolvedAt.slice(11, 16) : '10:00',
            collaborator: t.resolvedBy || t.assignedTo || currentUser.name,
            sector: t.sector,
            activity: `[Chamado ${t.id}] ${t.subject || t.title || 'Chamado'} — ${t.serviceType || 'Atendimento Concluído'}`,
            priority: t.priority || 'Média',
            status: 'Concluído',
            timeSpent: t.resolutionTimeSpent || '00h 45m',
            observation: `Solução: ${t.resolutionSummary || 'Chamado fechado pelo especialista'}. Cliente: ${t.client || 'Cliente Corporativo'}.`,
            attachment: `laudo-${t.id}.pdf`
          });

          // Se houve técnico colaborador que auxiliou no fechamento, gera também a atividade para ele (computada como fechamento de chamado)
          if (t.participantCollaborator && t.participantCollaborator.trim()) {
            mappedClosedTickets.push({
              id: `act-tk-${t.id}-colab`,
              date: formattedDate,
              time: t.resolvedAt ? t.resolvedAt.slice(11, 16) : '10:00',
              collaborator: t.participantCollaborator.trim(),
              sector: t.sector,
              activity: `[Chamado ${t.id} - Colaboração] ${t.subject || t.title || 'Chamado'} — ${t.serviceType || 'Atendimento Concluído'}`,
              priority: t.priority || 'Média',
              status: 'Concluído',
              timeSpent: t.resolutionTimeSpent || '00h 45m',
              observation: `Colaboração técnica no fechamento com ${t.resolvedBy || t.assignedTo || 'Especialista'}. Solução: ${t.resolutionSummary || 'Chamado finalizado com apoio técnico'}. Cliente: ${t.client || 'Cliente Corporativo'}. Fechamento computado para ambos os técnicos na Base de Atividades e Excel.`,
              attachment: `laudo-${t.id}.pdf`
            });
          }
        });

        // Combinar sem duplicar registros por id ou chamado/colaborador
        const existingIds = new Set(localActivities.map(a => a.id));
        const combined = [...localActivities];
        for (const m of mappedClosedTickets) {
          const alreadyInLocal = localActivities.some(
            a => a.id === m.id || 
            (a.id.includes(m.id.replace('act-tk-', '')) && cleanNameForCompare(a.collaborator) === cleanNameForCompare(m.collaborator))
          );
          if (!alreadyInLocal && !existingIds.has(m.id)) {
            combined.push(m);
            existingIds.add(m.id);
          }
        }
        setActivities(combined);
      } catch (err) {
        console.warn('Erro ao sincronizar chamados fechados do PostgreSQL:', err);
        setActivities(localActivities);
      }
    };

    loadActivitiesAndClosedTickets();

    const unsubSync = activitySyncService.subscribe(() => {
      loadActivitiesAndClosedTickets();
    });

    return () => unsubSync();
  }, [currentUser]);

  // 2. Carregar lista de colaboradores do PostgreSQL
  useEffect(() => {
    apiBackendService.getUsers().then(res => {
      if (res?.success && Array.isArray(res.data) && res.data.length > 0) {
        const names = res.data.map(u => u.name?.trim()).filter(Boolean);
        setSystemUsers(Array.from(new Set(names)));
      }
    }).catch(err => {
      console.warn('Erro ao carregar usuários para filtro no PostgreSQL:', err);
    });
  }, []);

  // Lista consolidada de colaboradores
  const collaborators = useMemo(() => {
    const list = new Set<string>();
    systemUsers.forEach(u => list.add(u));
    activities.forEach(a => {
      if (a.collaborator?.trim()) list.add(a.collaborator.trim());
    });
    if (currentUser?.name) list.add(currentUser.name);
    return Array.from(list).sort();
  }, [systemUsers, activities, currentUser]);

  // Atalhos rápidos para preenchimento de data
  const handleSetToday = () => {
    const today = new Date().toISOString().slice(0, 10);
    setStartDate(today);
    setEndDate(today);
  };

  const handleSetLast7Days = () => {
    const end = new Date().toISOString().slice(0, 10);
    const start = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
    setStartDate(start);
    setEndDate(end);
  };

  const handleSetThisMonth = () => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
    const today = now.toISOString().slice(0, 10);
    setStartDate(firstDay);
    setEndDate(today);
  };

  const handleClearDates = () => {
    setStartDate('');
    setEndDate('');
  };

  // Filtragem de atividades com data e colaborador
  const filteredActivities = useMemo(() => {
    return activities.filter(a => {
      // 1. Filtro por Colaborador
      if (collaboratorFilter !== 'TODOS') {
        const aNorm = cleanNameForCompare(a.collaborator);
        const filterNorm = cleanNameForCompare(collaboratorFilter);
        if (aNorm !== filterNorm && !a.collaborator.toLowerCase().includes(collaboratorFilter.toLowerCase())) {
          return false;
        }
      }

      // 2. Filtro por Data (Intervalo Inicial e Final)
      const activityComparableDate = parseDateToComparable(a.date);
      if (activityComparableDate) {
        if (startDate && activityComparableDate < startDate) {
          return false;
        }
        if (endDate && activityComparableDate > endDate) {
          return false;
        }
      }

      // 3. Filtro por Setor
      if (sectorFilter !== 'TODOS' && a.sector !== sectorFilter) {
        return false;
      }

      // 4. Filtro por Status
      if (statusFilter !== 'TODOS' && a.status !== statusFilter) {
        return false;
      }

      // 5. Busca textual livre
      if (search.trim()) {
        const q = search.toLowerCase();
        const match =
          a.activity.toLowerCase().includes(q) ||
          a.collaborator.toLowerCase().includes(q) ||
          a.observation.toLowerCase().includes(q) ||
          a.id.toLowerCase().includes(q);
        if (!match) return false;
      }

      return true;
    });
  }, [activities, collaboratorFilter, startDate, endDate, sectorFilter, statusFilter, search]);

  // Ação principal de exportação para Excel (Exclusivo para o colaborador selecionado)
  const handleExportExcelClick = () => {
    // Regra explícita: "Pois ao gerar a planilha em Excel, deverá ser realizado somente com o colaborador selecionado"
    if (collaboratorFilter === 'TODOS') {
      // Abre o modal para o usuário selecionar especificamente o colaborador
      setSelectedColabForExport(collaborators[0] || currentUser.name);
      setIsExportModalOpen(true);
      return;
    }

    // Exporta estritamente com o colaborador selecionado
    executeColabExport(collaboratorFilter);
  };

  const executeColabExport = (colabName: string) => {
    // Filtrar apenas atividades desse colaborador no período especificado
    const colabRecords = activities.filter(a => {
      const matchColab =
        cleanNameForCompare(a.collaborator) === cleanNameForCompare(colabName) ||
        a.collaborator.toLowerCase().includes(colabName.toLowerCase());
      if (!matchColab) return false;

      const actDate = parseDateToComparable(a.date);
      if (actDate) {
        if (startDate && actDate < startDate) return false;
        if (endDate && actDate > endDate) return false;
      }
      return true;
    });

    if (colabRecords.length === 0) {
      alert(`Nenhuma atividade encontrada para o colaborador "${colabName}" no período selecionado.`);
      return;
    }

    exportCollaboratorActivitiesToExcel(
      colabRecords,
      colabName,
      startDate || undefined,
      endDate || undefined
    );

    setFeedbackMsg(`✓ Planilha em Excel (.xlsx) gerada com sucesso para o colaborador: ${colabName}! (${colabRecords.length} atividades)`);
    setTimeout(() => setFeedbackMsg(null), 5000);
    setIsExportModalOpen(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300" id="linked-activities-main">
      {/* Banner Superior Corporativo (Div Branca) */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white border border-slate-200 p-6 rounded-3xl shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shadow-2xs">
            <FileSpreadsheet className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-slate-800 tracking-tight">
                Atividades & Excel (Chamados Fechados)
              </h2>
              <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Base Consolidada</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Chamados finalizados saem da fila e são arquivados aqui. A planilha em Excel é gerada exclusivamente para o colaborador selecionado.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {onNavigate && (
            <button
              onClick={() => onNavigate('planilhas')}
              className="px-4 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>Base Geral de Planilhas</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Botão de Exportação Direta em Excel */}
          <button
            onClick={handleExportExcelClick}
            id="btn-exportar-excel-colaborador"
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 flex items-center gap-2 transition-all cursor-pointer"
            title="Exportar planilha Excel do colaborador selecionado"
          >
            <Download className="w-4 h-4 text-white" />
            <span>Gerar Planilha do Colaborador (.xlsx)</span>
          </button>
        </div>
      </div>

      {/* Toast Feedback */}
      {feedbackMsg && (
        <div className="p-4 rounded-2xl bg-white border-2 border-emerald-300 text-emerald-900 text-xs font-bold flex items-center gap-2.5 shadow-md animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* PAINEL DE FILTROS: Funcionário e Intervalo de Datas (Div Branca) */}
      <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2 text-slate-800 font-black text-sm">
            <Filter className="w-4 h-4 text-[#37558d]" />
            <span>Filtros Obrigatórios para Geração da Planilha Excel</span>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#37558d] bg-blue-50 px-3 py-1 rounded-xl border border-blue-200">
            <span>{filteredActivities.length} Registros Encontrados</span>
          </div>
        </div>

        {/* Linha 1 de Filtros: Colaborador e Datas */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {/* 1. SELEÇÃO DE FUNCIONÁRIO / COLABORADOR */}
          <div className="space-y-1.5 md:col-span-2 lg:col-span-2">
            <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-[#37558d]" />
              <span>Funcionário Selecionado para a Planilha *</span>
            </label>
            <div className="relative">
              <select
                id="select-filtro-funcionario"
                value={collaboratorFilter}
                onChange={(e) => setCollaboratorFilter(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border-2 border-blue-200 hover:border-[#37558d] rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-[#37558d] focus:bg-white transition-all cursor-pointer"
              >
                <option value="TODOS">⚠️ TODOS OS FUNCIONÁRIOS (Visualização Geral)</option>
                {collaborators.map((c) => (
                  <option key={c} value={c}>
                    👤 {c} {c === currentUser.name ? '(Você)' : ''}
                  </option>
                ))}
              </select>
            </div>
            <p className="text-[11px] text-slate-500">
              {collaboratorFilter === 'TODOS' ? (
                <span className="text-amber-700 font-semibold">
                  * Selecione um funcionário específico para gerar a planilha individual em Excel.
                </span>
              ) : (
                <span className="text-emerald-700 font-bold">
                  ✓ A planilha Excel será gerada exclusivamente para: {collaboratorFilter}
                </span>
              )}
            </p>
          </div>

          {/* 2. DATA INICIAL (DE) */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#37558d]" />
              <span>Data Inicial (De)</span>
            </label>
            <input
              type="date"
              id="input-data-inicial"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-[#37558d] focus:bg-white transition-all"
            />
          </div>

          {/* 3. DATA FINAL (ATÉ) */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#37558d]" />
              <span>Data Final (Até)</span>
            </label>
            <input
              type="date"
              id="input-data-final"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-[#37558d] focus:bg-white transition-all"
            />
          </div>
        </div>

        {/* Linha 2 de Filtros: Atalhos de Data, Setor e Busca Textual */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
          {/* Atalhos de Datas */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-slate-500 font-bold text-[11px] mr-1">Período rápido:</span>
            <button
              type="button"
              onClick={handleSetToday}
              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold transition-colors cursor-pointer"
            >
              Hoje
            </button>
            <button
              type="button"
              onClick={handleSetLast7Days}
              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold transition-colors cursor-pointer"
            >
              Últimos 7 dias
            </button>
            <button
              type="button"
              onClick={handleSetThisMonth}
              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold transition-colors cursor-pointer"
            >
              Este Mês
            </button>
            {(startDate || endDate) && (
              <button
                type="button"
                onClick={handleClearDates}
                className="px-2.5 py-1 rounded-lg text-rose-600 hover:bg-rose-50 text-[11px] font-bold transition-colors cursor-pointer"
              >
                Limpar Datas
              </button>
            )}
          </div>

          {/* Filtros secundários: Setor e Busca */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={sectorFilter}
              onChange={(e) => setSectorFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#37558d]"
            >
              <option value="TODOS">Setor: Todos</option>
              {SECTORS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>

            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar chamado ou solução..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#37558d] w-48"
              />
            </div>
          </div>
        </div>
      </div>

      {/* CARDS DE RESUMO DO COLABORADOR SELECIONADO (Divs Brancas) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Colaborador em Foco
            </span>
            <User className="w-4 h-4 text-[#37558d]" />
          </div>
          <p className="text-lg font-black text-slate-800 mt-2 truncate">
            {collaboratorFilter === 'TODOS' ? 'Visão Geral (Todos)' : collaboratorFilter}
          </p>
          <span className="text-[11px] font-semibold text-slate-500 mt-0.5 block">
            Alvo da geração da planilha Excel
          </span>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Chamados Fechados / Atividades
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-[#37558d] mt-2">
            {filteredActivities.length}
          </p>
          <span className="text-[11px] font-semibold text-slate-500 mt-0.5 block">
            Registros válidos no período
          </span>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Intervalo Selecionado
            </span>
            <CalendarRange className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-sm font-black text-slate-800 mt-2 truncate">
            {startDate && endDate
              ? `${startDate.split('-').reverse().join('/')} até ${endDate.split('-').reverse().join('/')}`
              : startDate
                ? `A partir de ${startDate.split('-').reverse().join('/')}`
                : 'Todo o histórico disponível'}
          </p>
          <span className="text-[11px] font-semibold text-slate-500 mt-0.5 block">
            Filtro cronológico aplicado
          </span>
        </div>
      </div>

      {/* TABELA DE ATIVIDADES E CHAMADOS FECHADOS (Div Branca) */}
      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-black text-slate-900">
            Registros de Atividades e Chamados Finalizados
          </h3>
          <span className="text-xs text-slate-500 font-medium">
            Exibindo {filteredActivities.length} itens correspondentes aos filtros
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 font-mono text-[11px] uppercase border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4 font-bold">Data / Hora</th>
                <th className="py-3.5 px-4 font-bold">Funcionário</th>
                <th className="py-3.5 px-4 font-bold">Setor</th>
                <th className="py-3.5 px-4 font-bold">Atividade / Chamado Fechado</th>
                <th className="py-3.5 px-4 font-bold">Tempo</th>
                <th className="py-3.5 px-4 font-bold">Status</th>
                <th className="py-3.5 px-4 font-bold">Solução Técnica / Observação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {filteredActivities.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <FileSpreadsheet className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-bold text-xs text-slate-500">
                      Nenhuma atividade encontrada com os filtros selecionados.
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Altere o colaborador, limpe as datas ou conclua novos chamados no Help Desk.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredActivities.map((act) => {
                  const isTicketActivity = act.activity.includes('[Chamado ') || act.id.startsWith('act-tk-');
                  return (
                    <tr
                      key={act.id}
                      className={`hover:bg-blue-50/40 transition-colors ${
                        isTicketActivity ? 'bg-blue-50/15' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4 font-mono text-[11px] whitespace-nowrap text-slate-600">
                        <div className="font-bold">{act.date}</div>
                        <div className="text-[10px] text-slate-400">{act.time}</div>
                      </td>

                      <td className="py-3.5 px-4 font-bold text-slate-900 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-blue-50 text-[#37558d] border border-blue-200 text-[10px] flex items-center justify-center font-bold">
                            {act.collaborator.slice(0, 1)}
                          </div>
                          <span>{act.collaborator}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-lg bg-slate-100 border border-slate-200 font-mono text-[11px] text-[#37558d] font-semibold">
                          {act.sector}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 max-w-xs font-semibold text-slate-800">
                        <div className="line-clamp-2">{act.activity}</div>
                        {isTicketActivity && (
                          <div className="flex flex-wrap items-center gap-1.5 mt-1">
                            <span className="text-[9px] font-mono bg-emerald-50 text-emerald-800 border border-emerald-200 px-1.5 py-0.5 rounded font-bold">
                              ✓ Chamado Fechado
                            </span>
                            {(act.activity.includes('Colaboração') || act.activity.includes('Coparticipação') || act.id.endsWith('-colab')) && (
                              <span className="text-[9px] font-mono bg-blue-50 text-[#37558d] border border-blue-200 px-1.5 py-0.5 rounded font-bold flex items-center gap-1">
                                🤝 Auxiliou no Fechamento
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 font-mono text-[11px] text-[#37558d] font-bold whitespace-nowrap">
                        {act.timeSpent}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {act.status}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 max-w-sm text-slate-600 text-[11px] leading-relaxed">
                        <div className="line-clamp-2">{act.observation}</div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: SELEÇÃO DE COLABORADOR PARA EXPORTAR EXCEL */}
      {isExportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4 text-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-black text-slate-900">
                  Gerar Planilha em Excel (.xlsx)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsExportModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 space-y-1">
              <span className="font-bold flex items-center gap-1">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Regra de Exportação:</span>
              </span>
              <p className="leading-relaxed">
                A geração da planilha em Excel é realizada exclusivamente para um <strong>único colaborador selecionado</strong> por vez, contendo todas as atividades e chamados fechados do período.
              </p>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">
                Selecione o Funcionário / Colaborador *
              </label>
              <select
                value={selectedColabForExport}
                onChange={(e) => setSelectedColabForExport(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-[#37558d] focus:bg-white"
              >
                {collaborators.map((c) => (
                  <option key={c} value={c}>
                    {c} {c === currentUser.name ? '(Você)' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-500 font-bold block">Data Início:</span>
                <span className="text-slate-800 font-semibold">{startDate || 'Desde o início'}</span>
              </div>
              <div>
                <span className="text-slate-500 font-bold block">Data Fim:</span>
                <span className="text-slate-800 font-semibold">{endDate || 'Até a data atual'}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsExportModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-100 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  setCollaboratorFilter(selectedColabForExport);
                  executeColabExport(selectedColabForExport);
                }}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <Download className="w-4 h-4" />
                <span>Exportar Planilha (.xlsx)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
