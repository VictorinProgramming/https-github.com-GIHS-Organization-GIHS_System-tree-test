import React, { useState, useMemo, useEffect } from 'react';
import {
  FileSpreadsheet,
  Search,
  Filter,
  Download,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Calendar,
  User,
  Plus,
  Database,
  X,
  Clock,
  Shield,
  LifeBuoy,
  FileCheck2,
  Sparkles,
  Trash2,
  CalendarRange
} from 'lucide-react';
import { SECTORS, CURRENT_USER } from '../../data/mockData';
import { ActivityRecord, Priority, Sector, Collaborator } from '../../types';
import { exportActivitiesToExcel, exportCollaboratorActivitiesToExcel } from '../../utils/excelExport';
import { activitySyncService } from '../../services/activitySyncService';
import { ticketService } from '../../services/ticketService';
import { apiBackendService } from '../../services/apiBackendService';
import { isLeadershipOrHigherRole } from '../../data/authCredentials';

interface SmartSpreadsheetViewProps {
  currentUser?: Collaborator;
}

// Normaliza o nome para comparações seguras sem sensibilidade a maiúsculas/espaços
const cleanNameForCompare = (name: string): string => {
  return (name || '')
    .toLowerCase()
    .replace(/\(.*?\)/g, '')
    .replace(/\[.*?\]/g, '')
    .replace(/[^a-z0-9áéíóúãõâêîôûàèìòùç\s]/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
};

// Conversor de data para formato YYYY-MM-DD comparável
const parseDateToComparable = (dateStr: string): string | null => {
  if (!dateStr) return null;
  const trimmed = dateStr.trim();
  if (trimmed.includes('/')) {
    const parts = trimmed.split('/');
    if (parts.length === 3) {
      const day = parts[0].padStart(2, '0');
      const month = parts[1].padStart(2, '0');
      const year = parts[2];
      return `${year}-${month}-${day}`;
    }
  }
  if (trimmed.includes('-')) {
    const parts = trimmed.split('T')[0].split('-');
    if (parts.length === 3) {
      return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
    }
  }
  return null;
};

export const SmartSpreadsheetView: React.FC<SmartSpreadsheetViewProps> = ({
  currentUser = CURRENT_USER
}) => {
  const [data, setData] = useState<ActivityRecord[]>([]);
  const [systemUsers, setSystemUsers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Verifica se o usuário logado possui privilégios de gestão / liderança
  const isLeaderOrAdmin = useMemo(() => {
    return isLeadershipOrHigherRole(currentUser);
  }, [currentUser]);

  // Filtros
  const [search, setSearch] = useState('');
  const [filterSector, setFilterSector] = useState<string>('TODOS');
  const [filterCollaborator, setFilterCollaborator] = useState<string>(() => {
    return isLeadershipOrHigherRole(currentUser) ? 'TODOS' : (currentUser?.name || 'TODOS');
  });
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('TODOS');
  const [filterPriority, setFilterPriority] = useState<string>('TODOS');

  // Ordenação & Paginação
  const [sortField, setSortField] = useState<keyof ActivityRecord>('date');
  const [sortAsc, setSortAsc] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [exporting, setExporting] = useState(false);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  // Modal para forçar seleção de colaborador se tentar exportar "TODOS"
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [selectedColabForExport, setSelectedColabForExport] = useState<string>(
    currentUser?.name || ''
  );

  // Modal de apontamento de nova atividade
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCollaborator, setNewCollaborator] = useState(currentUser.name);
  const [newSector, setNewSector] = useState<Sector>((currentUser.sector as Sector) || 'N1');
  const [newPriority, setNewPriority] = useState<Priority>('Média');
  const [newTimeSpent, setNewTimeSpent] = useState('00h 45m');
  const [newObservation, setNewObservation] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);

  const itemsPerPage = 8;

  // 1. Carrega atividades unificadas e chamados resolvidos
  const loadUnifiedActivities = async () => {
    const localActivities = activitySyncService.getActivities();

    try {
      const closedTickets = await ticketService.getTickets('Resolvido');
      const mappedClosedTickets: ActivityRecord[] = [];
      (closedTickets || []).forEach(t => {
        const rawDate = t.resolvedAt || t.createdAt || new Date().toISOString();
        const parsedDate = rawDate.includes('T') ? rawDate.split('T')[0] : rawDate;
        const formattedDate = parsedDate.includes('-')
          ? parsedDate.split('-').reverse().join('/')
          : parsedDate;

        // 1. Fechamento pelo técnico responsável
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
          observation: `Solução: ${t.resolutionSummary || 'Chamado finalizado pelo especialista'}. Cliente: ${t.client || 'Cliente Corporativo'}.`,
          attachment: `laudo-${t.id}.pdf`
        });

        // 2. Se houve técnico colaborador que auxiliou no fechamento, gera também a atividade para ele
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
      setData(combined);
    } catch (err) {
      console.warn('Sincronização de chamados resolvidos:', err);
      setData(localActivities);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUnifiedActivities();
    const unsub = activitySyncService.subscribe(() => {
      loadUnifiedActivities();
    });
    return () => unsub();
  }, [currentUser]);

  // 2. Carrega lista de colaboradores do sistema
  useEffect(() => {
    apiBackendService.getUsers().then(res => {
      if (res?.success && Array.isArray(res.data) && res.data.length > 0) {
        const names = res.data.map(u => (u && typeof u.name === 'string' ? u.name.trim() : '')).filter(Boolean);
        setSystemUsers(Array.from(new Set(names)));
      }
    }).catch(err => {
      console.warn('Erro ao carregar colaboradores do sistema:', err);
    });
  }, []);

  // Lista consolidada de colaboradores
  const collaboratorsList = useMemo(() => {
    const list = new Set<string>();
    systemUsers.forEach(u => list.add(u));
    data.forEach(a => {
      if (a.collaborator?.trim()) list.add(a.collaborator.trim());
    });
    if (currentUser?.name) list.add(currentUser.name.trim());
    return Array.from(list).sort();
  }, [systemUsers, data, currentUser]);

  // Atalhos rápidos para preenchimento de data
  const handleSetToday = () => {
    const today = new Date().toISOString().slice(0, 10);
    setStartDate(today);
    setEndDate(today);
    setCurrentPage(1);
  };

  const handleSetThisMonth = () => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
    const today = now.toISOString().slice(0, 10);
    setStartDate(firstDay);
    setEndDate(today);
    setCurrentPage(1);
  };

  const handleClearDates = () => {
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
  };

  // Excluir atividade
  const handleDeleteActivity = (id: string) => {
    activitySyncService.deleteActivity(id);
    setData(prev => prev.filter(a => a.id !== id));
    setFeedback('✓ Atividade removida da Base de Atividades.');
    setTimeout(() => setFeedback(null), 3000);
  };

  // Apontar nova atividade
  const handleCreateActivity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const now = new Date();
    const newAct: ActivityRecord = {
      id: `act-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      date: now.toLocaleDateString('pt-BR'),
      time: now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      collaborator: isLeaderOrAdmin ? (newCollaborator || currentUser.name) : currentUser.name,
      sector: newSector,
      activity: newTitle.trim(),
      priority: newPriority,
      status: 'Concluído',
      timeSpent: newTimeSpent.trim() || '00h 45m',
      observation: newObservation.trim() || 'Apontamento técnico registrado na Base de Atividades',
      attachment: ''
    };

    activitySyncService.addActivity(newAct);
    setData(prev => [newAct, ...prev]);
    setIsModalOpen(false);
    setNewTitle('');
    setNewObservation('');
    setFeedback('✓ Atividade registrada com sucesso!');
    setTimeout(() => setFeedback(null), 4000);
  };

  // Dados filtrados e ordenados
  const filteredData = useMemo(() => {
    return data
      .filter((item) => {
        // 1. Regra Individual: Colaborador operacional visualiza apenas o seu
        if (!isLeaderOrAdmin) {
          const uClean = cleanNameForCompare(currentUser.name);
          const iClean = cleanNameForCompare(item.collaborator);
          if (uClean !== iClean && !iClean.includes(uClean) && !uClean.includes(iClean)) {
            return false;
          }
        }

        // 2. Filtro de Colaborador (para Líderes/Gestores)
        if (filterCollaborator !== 'TODOS') {
          const matchColab =
            cleanNameForCompare(item.collaborator) === cleanNameForCompare(filterCollaborator) ||
            item.collaborator.toLowerCase().includes(filterCollaborator.toLowerCase());
          if (!matchColab) return false;
        }

        // 3. Filtro por Setor
        if (filterSector !== 'TODOS' && item.sector !== filterSector) {
          return false;
        }

        // 4. Filtro por Status
        if (filterStatus !== 'TODOS' && item.status !== filterStatus) {
          return false;
        }

        // 5. Filtro por Prioridade
        if (filterPriority !== 'TODOS' && item.priority !== filterPriority) {
          return false;
        }

        // 6. Filtro por Intervalo de Data (startDate & endDate)
        const itemDateComp = parseDateToComparable(item.date);
        if (itemDateComp) {
          if (startDate && itemDateComp < startDate) return false;
          if (endDate && itemDateComp > endDate) return false;
        }

        // 7. Busca textual livre
        if (search.trim()) {
          const q = search.toLowerCase();
          const matchSearch =
            item.activity.toLowerCase().includes(q) ||
            item.collaborator.toLowerCase().includes(q) ||
            (item.observation && item.observation.toLowerCase().includes(q)) ||
            item.sector.toLowerCase().includes(q) ||
            item.id.toLowerCase().includes(q);
          if (!matchSearch) return false;
        }

        return true;
      })
      .sort((a, b) => {
        const fieldA = (a[sortField] || '').toString();
        const fieldB = (b[sortField] || '').toString();
        if (sortField === 'date') {
          const dateA = parseDateToComparable(a.date) || '';
          const dateB = parseDateToComparable(b.date) || '';
          return sortAsc ? dateA.localeCompare(dateB) : dateB.localeCompare(dateA);
        }
        return sortAsc ? fieldA.localeCompare(fieldB) : fieldB.localeCompare(fieldA);
      });
  }, [
    data,
    currentUser,
    isLeaderOrAdmin,
    filterCollaborator,
    filterSector,
    filterStatus,
    filterPriority,
    startDate,
    endDate,
    search,
    sortField,
    sortAsc
  ]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage) || 1;
  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSort = (field: keyof ActivityRecord) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  /**
   * Executa a exportação de Excel com a mesma regra do Atividades & Excel:
   * A planilha em Excel deverá puxar somente a data e o colaborador selecionado.
   */
  const executeExcelExport = (colabName: string) => {
    setExporting(true);
    try {
      const colabRecords = data.filter((item) => {
        const matchColab =
          cleanNameForCompare(item.collaborator) === cleanNameForCompare(colabName) ||
          item.collaborator.toLowerCase().includes(colabName.toLowerCase());
        if (!matchColab) return false;

        const actDate = parseDateToComparable(item.date);
        if (actDate) {
          if (startDate && actDate < startDate) return false;
          if (endDate && actDate > endDate) return false;
        }

        if (filterSector !== 'TODOS' && item.sector !== filterSector) {
          return false;
        }

        return true;
      });

      if (colabRecords.length === 0) {
        setExportNotice(`Nenhum registro encontrado para "${colabName}" no período selecionado.`);
        setExporting(false);
        setTimeout(() => setExportNotice(null), 4000);
        return;
      }

      exportCollaboratorActivitiesToExcel(
        colabRecords,
        colabName,
        startDate || undefined,
        endDate || undefined
      );

      const periodDesc = startDate || endDate
        ? ` (${startDate || 'Início'} a ${endDate || 'Hoje'})`
        : '';
      setExportNotice(`Exportado com sucesso para ${colabName}: ${colabRecords.length} atividade(s)${periodDesc}.`);
      setExporting(false);
      setIsExportModalOpen(false);
      setTimeout(() => setExportNotice(null), 5000);
    } catch (err) {
      console.error('Erro ao gerar Excel:', err);
      setExporting(false);
    }
  };

  const handleExportClick = () => {
    // Se o filtro estiver em "TODOS", abre modal para selecionar o colaborador conforme a regra do Help Desk
    if (filterCollaborator === 'TODOS') {
      setSelectedColabForExport(collaboratorsList[0] || currentUser.name);
      setIsExportModalOpen(true);
      return;
    }
    executeExcelExport(filterCollaborator);
  };

  const resetFilters = () => {
    setSearch('');
    setFilterSector('TODOS');
    setFilterCollaborator(isLeaderOrAdmin ? 'TODOS' : currentUser.name);
    setStartDate('');
    setEndDate('');
    setFilterStatus('TODOS');
    setFilterPriority('TODOS');
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner Header (Div Branca) */}
      <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 relative z-10 text-[#37558d]">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-[#37558d] shadow-2xs">
                <FileSpreadsheet className="w-6 h-6 text-[#37558d]" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl font-bold text-[#37558d] tracking-tight">
                    {isLeaderOrAdmin ? 'Base de Atividades & Chamados (Gestão Geral)' : 'Minha Base de Atividades & Chamados'}
                  </h1>
                  <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Base Consolidada</span>
                  </span>
                  {!isLeaderOrAdmin && (
                    <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-blue-50 text-[#37558d] border border-blue-200 font-bold">
                      Individual • {currentUser.name}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  Planilha integrada de esforço, horas e chamados solucionados. O download do Excel é gerado exclusivamente para o colaborador selecionado.
                </p>
              </div>
            </div>

            {/* Badges de contexto */}
            <div className="flex flex-wrap items-center gap-2.5 text-xs text-slate-600 mt-3.5">
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 text-[#37558d] px-3 py-1.5 rounded-xl font-medium">
                <User className="w-3.5 h-3.5 text-[#37558d]" />
                <span className="text-xs text-slate-600">
                  Operador: <strong className="text-[#37558d]">{currentUser?.name}</strong>
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-blue-100 text-[#37558d] border border-blue-200 font-mono">
                  {currentUser?.userRole || 'COLABORADOR'}
                </span>
              </div>

              <span className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 text-[#37558d] px-2.5 py-1.5 rounded-xl font-mono text-[11px]">
                <FileCheck2 className="w-3.5 h-3.5 text-[#37558d]" />
                <span>{filteredData.length} registros filtrados</span>
              </span>

              <span className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 text-[#37558d] px-2.5 py-1.5 rounded-xl font-mono text-[11px]">
                <User className="w-3.5 h-3.5 text-[#37558d]" />
                <span>{collaboratorsList.length} colaboradores na base</span>
              </span>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={resetFilters}
              id="btn-limpar-filtros"
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-50 text-[#37558d] hover:bg-slate-100 border border-slate-200 font-bold text-xs transition-all cursor-pointer"
              title="Restaurar todos os filtros para os valores padrão"
            >
              <span>Limpar Filtros</span>
            </button>

            <button
              onClick={handleExportClick}
              id="btn-exportar-excel"
              disabled={exporting}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all cursor-pointer disabled:opacity-50"
              title="Download do Excel puxando os dados de data e colaborador selecionado"
            >
              {exporting ? (
                <span className="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></span>
              ) : (
                <Download className="w-4 h-4" />
              )}
              <span>Exportar Excel (.xlsx)</span>
            </button>

            <button
              onClick={() => setIsModalOpen(true)}
              id="btn-apontar-atividade"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#37558d] hover:bg-[#2c4471] text-white font-bold text-xs shadow-md shadow-[#37558d]/20 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Apontar Atividade</span>
            </button>
          </div>
        </div>
      </div>

      {/* Feedback Toast */}
      {feedback && (
        <div className="p-3.5 rounded-2xl bg-white border border-blue-200 text-[#37558d] text-xs flex items-center gap-2 animate-in fade-in shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-[#37558d] shrink-0" />
          <span className="font-semibold">{feedback}</span>
        </div>
      )}

      {/* Toast de Exportação Concluída */}
      {exportNotice && (
        <div
          id="export-toast-banner"
          className="p-3.5 rounded-2xl bg-white border-2 border-emerald-300 text-emerald-900 flex items-center justify-between animate-in fade-in duration-200 shadow-md"
        >
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="text-xs font-semibold">
              {exportNotice}
            </span>
          </div>
          <span className="text-[11px] font-mono text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 font-bold">
            Excel Baixado
          </span>
        </div>
      )}

      {/* Barra de Filtros Avançados (Div Branca) */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-3.5">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-[#37558d]" />
            <h2 className="text-xs font-bold text-[#37558d] tracking-wide uppercase">
              Filtros de Auditoria & Seleção de Colaborador
            </h2>
          </div>
          {(filterCollaborator !== 'TODOS' || startDate || endDate) && (
            <span className="text-[11px] text-[#37558d] bg-blue-50 px-2.5 py-0.5 rounded-full font-bold border border-blue-200">
              Exportação personalizada ativa
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Busca livre */}
          <div>
            <label className="block text-[11px] font-bold text-[#37558d] mb-1">
              Buscar Termo
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Chamado, tarefa..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-8 pr-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-[#37558d] placeholder-slate-400 focus:outline-none focus:border-[#37558d] focus:bg-white"
              />
            </div>
          </div>

          {/* Filtro: Colaborador */}
          <div>
            <label className="block text-[11px] font-bold text-[#37558d] mb-1">
              Colaborador
            </label>
            {isLeaderOrAdmin ? (
              <select
                value={filterCollaborator}
                onChange={(e) => {
                  setFilterCollaborator(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-[#37558d] focus:outline-none focus:border-[#37558d] focus:bg-white font-semibold cursor-pointer"
              >
                <option value="TODOS">Colaborador: Todos</option>
                {collaboratorsList.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            ) : (
              <div className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-[#37558d] font-bold flex items-center justify-between">
                <span className="truncate">{currentUser.name}</span>
                <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded font-mono">
                  Pessoal
                </span>
              </div>
            )}
          </div>

          {/* Data de Início */}
          <div>
            <label className="block text-[11px] font-bold text-[#37558d] mb-1 flex items-center gap-1">
              <Calendar className="w-3 h-3 text-[#37558d]" />
              Data de Início
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-[#37558d] focus:outline-none focus:border-[#37558d] focus:bg-white font-medium cursor-pointer"
            />
          </div>

          {/* Data Final */}
          <div>
            <label className="block text-[11px] font-bold text-[#37558d] mb-1 flex items-center gap-1">
              <Calendar className="w-3 h-3 text-[#37558d]" />
              Data Final
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-[#37558d] focus:outline-none focus:border-[#37558d] focus:bg-white font-medium cursor-pointer"
            />
          </div>

          {/* Filtro: Setor */}
          <div>
            <label className="block text-[11px] font-bold text-[#37558d] mb-1">
              Setor
            </label>
            <select
              value={filterSector}
              onChange={(e) => {
                setFilterSector(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-[#37558d] focus:outline-none focus:border-[#37558d] focus:bg-white font-semibold cursor-pointer"
            >
              <option value="TODOS">Setor: Todos</option>
              {SECTORS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro: Prioridade */}
          <div>
            <label className="block text-[11px] font-bold text-[#37558d] mb-1">
              Prioridade
            </label>
            <select
              value={filterPriority}
              onChange={(e) => {
                setFilterPriority(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-[#37558d] focus:outline-none focus:border-[#37558d] focus:bg-white font-semibold cursor-pointer"
            >
              <option value="TODOS">Prioridade: Todas</option>
              <option value="Crítica">Crítica</option>
              <option value="Alta">Alta</option>
              <option value="Média">Média</option>
              <option value="Baixa">Baixa</option>
            </select>
          </div>
        </div>

        {/* Atalhos Rápidos de Data */}
        <div className="flex flex-wrap items-center justify-between pt-2 border-t border-slate-100 gap-2">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <CalendarRange className="w-3.5 h-3.5 text-[#37558d]" />
            <span className="font-semibold text-slate-600">Atalhos de período:</span>
            <button
              type="button"
              onClick={handleSetToday}
              className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold transition-colors cursor-pointer"
            >
              Hoje
            </button>
            <button
              type="button"
              onClick={handleSetThisMonth}
              className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold transition-colors cursor-pointer"
            >
              Este Mês
            </button>
            {(startDate || endDate) && (
              <button
                type="button"
                onClick={handleClearDates}
                className="px-2 py-0.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-[11px] font-bold transition-colors cursor-pointer"
              >
                Limpar Período
              </button>
            )}
          </div>

          {(filterCollaborator !== 'TODOS' || startDate || endDate) && (
            <div className="text-xs text-[#37558d] flex items-center gap-2">
              <span className="font-bold">Exportação direcionada:</span>
              <span>
                Colaborador: <strong className="underline">{filterCollaborator}</strong>
              </span>
              <span>•</span>
              <span>
                Período: <strong>{startDate || 'Início'}</strong> até <strong>{endDate || 'Hoje'}</strong>
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Tabela de Atividades (Div Branca) */}
      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[#37558d] font-bold uppercase tracking-wider text-[11px] select-none">
                <th
                  onClick={() => handleSort('date')}
                  className="py-3 px-3.5 cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  <span className="flex items-center gap-1">
                    Data / Hora <ArrowUpDown className="w-3 h-3 text-[#37558d]" />
                  </span>
                </th>
                <th
                  onClick={() => handleSort('collaborator')}
                  className="py-3 px-3.5 cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  <span className="flex items-center gap-1">
                    Colaborador <ArrowUpDown className="w-3 h-3 text-[#37558d]" />
                  </span>
                </th>
                <th
                  onClick={() => handleSort('sector')}
                  className="py-3 px-3.5 cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  <span className="flex items-center gap-1">
                    Setor <ArrowUpDown className="w-3 h-3 text-[#37558d]" />
                  </span>
                </th>
                <th
                  onClick={() => handleSort('activity')}
                  className="py-3 px-3.5 cursor-pointer hover:bg-slate-100 transition-colors min-w-[240px]"
                >
                  <span className="flex items-center gap-1">
                    Atividade / Chamado Fechado <ArrowUpDown className="w-3 h-3 text-[#37558d]" />
                  </span>
                </th>
                <th
                  onClick={() => handleSort('priority')}
                  className="py-3 px-3.5 cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  <span className="flex items-center gap-1">
                    Prioridade <ArrowUpDown className="w-3 h-3 text-[#37558d]" />
                  </span>
                </th>
                <th
                  onClick={() => handleSort('status')}
                  className="py-3 px-3.5 cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  <span className="flex items-center gap-1">
                    Status <ArrowUpDown className="w-3 h-3 text-[#37558d]" />
                  </span>
                </th>
                <th
                  onClick={() => handleSort('timeSpent')}
                  className="py-3 px-3.5 cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  <span className="flex items-center gap-1">
                    Tempo <ArrowUpDown className="w-3 h-3 text-[#37558d]" />
                  </span>
                </th>
                <th className="py-3 px-3.5 min-w-[200px]">Observações Técnicas</th>
                <th className="py-3 px-3.5 text-right">Ação</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <div className="w-6 h-6 border-2 border-[#37558d] border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-xs font-semibold text-[#37558d]">
                        Carregando base unificada de atividades...
                      </span>
                    </div>
                  </td>
                </tr>
              ) : paginatedData.length > 0 ? (
                paginatedData.map((row) => {
                  const isTicket =
                    row.activity.startsWith('[Chamado') ||
                    (row.observation && row.observation.includes('Solução:'));

                  return (
                    <tr
                      key={row.id}
                      className="hover:bg-blue-50/30 transition-colors group"
                    >
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <div className="font-semibold text-slate-800">{row.date}</div>
                        <div className="text-[11px] text-slate-500 font-mono">{row.time}</div>
                      </td>

                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-blue-50 border border-blue-200 text-[#37558d] flex items-center justify-center font-bold text-[10px]">
                            {row.collaborator?.charAt(0) || 'U'}
                          </div>
                          <span className="font-semibold text-slate-800">
                            {row.collaborator}
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                          {row.sector}
                        </span>
                      </td>

                      <td className="py-3 px-3.5">
                        <div className="flex items-start gap-1.5">
                          {isTicket && (
                            <span className="shrink-0 px-1.5 py-0.5 text-[9px] font-mono font-bold rounded bg-amber-50 text-amber-700 border border-amber-200 uppercase">
                              Chamado
                            </span>
                          )}
                          <span className="font-medium text-slate-800 leading-snug">
                            {row.activity}
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase border ${
                            row.priority === 'Crítica' || row.priority === 'Alta'
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : row.priority === 'Média'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-slate-50 text-slate-600 border-slate-200'
                          }`}
                        >
                          {row.priority}
                        </span>
                      </td>

                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                            row.status === 'Concluído'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-blue-50 text-[#37558d] border border-blue-200'
                          }`}
                        >
                          {row.status}
                        </span>
                      </td>

                      <td className="py-3 px-3.5 text-slate-600 font-mono font-semibold whitespace-nowrap text-[11px]">
                        {row.timeSpent}
                      </td>

                      <td className="py-3 px-3.5 text-slate-600 text-xs">
                        <span className="truncate block max-w-xs" title={row.observation}>
                          {row.observation}
                        </span>
                      </td>

                      <td className="py-3 px-3.5 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleDeleteActivity(row.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer inline-flex items-center justify-center"
                          title="Excluir atividade da base"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <div className="max-w-sm mx-auto space-y-2">
                      <FileSpreadsheet className="w-8 h-8 text-slate-300 mx-auto" />
                      <p className="text-sm font-semibold text-[#37558d]">
                        Nenhum registro encontrado
                      </p>
                      <p className="text-xs text-slate-400">
                        Não encontramos atividades ou chamados para os filtros selecionados.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Barra de Paginação */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/70 flex flex-col sm:flex-row items-center justify-between text-xs text-[#37558d] gap-2">
          <span>
            Mostrando <strong>{paginatedData.length}</strong> de <strong>{filteredData.length}</strong> registros encontrados
          </span>

          <div className="flex items-center gap-2 font-mono">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg bg-white border border-slate-200 text-[#37558d] hover:bg-[#37558d] hover:text-white disabled:opacity-40 disabled:pointer-events-none transition-colors shadow-2xs cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 text-xs font-semibold">
              Página {currentPage} de {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg bg-white border border-slate-200 text-[#37558d] hover:bg-[#37558d] hover:text-white disabled:opacity-40 disabled:pointer-events-none transition-colors shadow-2xs cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* MODAL: SELEÇÃO DE COLABORADOR PARA EXPORTAÇÃO EXCEL (Regra do Help Desk) */}
      {isExportModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4 text-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600">
                  <Download className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Exportar Planilha em Excel (.xlsx)
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Selecione o colaborador para emissão
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsExportModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-2xl text-xs text-emerald-900 leading-relaxed">
              <strong>Regra de Exportação:</strong> O arquivo Excel deve ser gerado especificamente para um único colaborador, consolidando suas horas e atividades no período.
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Selecione o Colaborador *
                </label>
                <select
                  value={selectedColabForExport}
                  onChange={(e) => setSelectedColabForExport(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-600 focus:bg-white cursor-pointer"
                >
                  {collaboratorsList.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="text-xs text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <span>Período considerado: </span>
                <strong className="text-slate-800">
                  {startDate || 'Início'} até {endDate || 'Hoje'}
                </strong>
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
                onClick={() => executeExcelExport(selectedColabForExport)}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Download className="w-4 h-4" />
                <span>Gerar Excel (.xlsx)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: APONTAR ATIVIDADE (Div Branca) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg p-6 shadow-2xl space-y-4 text-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-50 border border-blue-200 text-[#37558d]">
                  <FileSpreadsheet className="w-5 h-5 text-[#37558d]" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Apontar Atividade na Base
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Registro de esforço técnico e horas trabalhadas
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateActivity} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Descrição da Atividade Executada *
                </label>
                <input
                  type="text"
                  placeholder="Ex: Configuração de portas no switch core e validação de VLAN"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#37558d] focus:bg-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Colaborador Responsável
                  </label>
                  {isLeaderOrAdmin ? (
                    <select
                      value={newCollaborator}
                      onChange={(e) => setNewCollaborator(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-[#37558d] focus:bg-white font-semibold cursor-pointer"
                      required
                    >
                      {collaboratorsList.map((name) => (
                        <option key={name} value={name}>
                          {name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-[#37558d] font-bold">
                      {currentUser.name}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Setor
                  </label>
                  <select
                    value={newSector}
                    onChange={(e) => setNewSector(e.target.value as Sector)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-[#37558d] focus:bg-white font-semibold cursor-pointer"
                  >
                    {SECTORS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Prioridade
                  </label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as Priority)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-[#37558d] focus:bg-white font-semibold cursor-pointer"
                  >
                    <option value="Baixa">Baixa</option>
                    <option value="Média">Média</option>
                    <option value="Alta">Alta</option>
                    <option value="Crítica">Crítica</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tempo Gasto
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: 01h 30m"
                    value={newTimeSpent}
                    onChange={(e) => setNewTimeSpent(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-[#37558d] focus:bg-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Observações Técnicas / Solução
                </label>
                <textarea
                  rows={3}
                  placeholder="Detalhamento técnico da entrega ou notas para o laudo..."
                  value={newObservation}
                  onChange={(e) => setNewObservation(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-[#37558d] focus:bg-white resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-100 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#37558d] hover:bg-[#2c4471] text-white text-xs font-bold shadow-md shadow-[#37558d]/20 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Salvar Atividade</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
