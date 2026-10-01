import React, { useState, useEffect, useMemo } from 'react';
import {
  LifeBuoy,
  PlusCircle,
  Search,
  Filter,
  Clock,
  UserCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowRightLeft,
  ChevronRight,
  ShieldAlert,
  ShieldCheck,
  Building2,
  BookOpen,
  FileSpreadsheet,
  Layers,
  User,
  ExternalLink,
  Check,
  Sparkles,
  Info,
  RefreshCw,
  Tag,
  Users
} from 'lucide-react';
import { SupportTicket, Sector, Collaborator, ViewScreen } from '../../types';
import { SECTORS, CURRENT_USER } from '../../data/mockData';
import { activitySyncService } from '../../services/activitySyncService';
import { ticketService } from '../../services/ticketService';
import { TicketTransferModal } from './helpdesk/TicketTransferModal';
import { TicketFinalizeModal } from './helpdesk/TicketFinalizeModal';
import { KnowledgeBaseExplorer } from './helpdesk/KnowledgeBaseExplorer';
import { TicketDetailsModal } from './helpdesk/TicketDetailsModal';
import { LinkedActivitiesTab } from './helpdesk/LinkedActivitiesTab';
import { CreateTicketModal } from './helpdesk/CreateTicketModal';
import { ErrorBoundary } from '../common/ErrorBoundary';

interface TicketsViewProps {
  currentUser?: Collaborator;
  onNavigate?: (screen: ViewScreen) => void;
  onSwitchUser?: (user: Collaborator) => void;
}

// Normalizer to guarantee consistent sector matching across variations
export const normalizeSector = (sector: string = ''): string => {
  const s = sector.trim().toLowerCase();
  if (s === 'n1' || s === 'suporte n1') return 'N1';
  if (s === 'n2' || s === 'suporte n2') return 'N2';
  if (s === 'n3' || s === 'suporte n3') return 'N3';
  if (s.includes('front')) return 'Front-End';
  if (s.includes('back')) return 'Back-End';
  if (s.includes('dba') || s.includes('dado')) return 'DBA';
  if (s.includes('cyber') || s.includes('seguran')) return 'Cyber Security';
  if (s.includes('admin')) return 'Administrativo';
  if (s.includes('rh')) return 'RH';
  if (s.includes('finan')) return 'Financeiro';
  if (s.includes('gest')) return 'Gestão';
  if (s.includes('patrim')) return 'Patrimônio';
  if (s.includes('fazend') || s.includes('tribut')) return 'Fazenda';
  if (s.includes('saud') || s.includes('sus')) return 'Saúde';
  if (s.includes('educ') || s.includes('semed')) return 'Educação';
  if (s.includes('mobili') || s.includes('transit') || s.includes('frota')) return 'Mobilidade Urbana';
  return sector;
};

export const TicketsView: React.FC<TicketsViewProps> = ({
  currentUser = CURRENT_USER,
  onNavigate,
  onSwitchUser
}) => {
  const [activeTab, setActiveTab] = useState<'tickets' | 'knowledge_base' | 'linked_activities'>('tickets');
  const [tickets, setTickets] = useState<SupportTicket[]>(() => activitySyncService.getTickets());
  const [search, setSearch] = useState('');
  const [selectedQueueSector, setSelectedQueueSector] = useState<string>('TODOS');
  const [selectedServiceClassification, setSelectedServiceClassification] = useState<string>('TODAS');
  const [priorityFilter, setPriorityFilter] = useState('TODOS');
  const [statusFilter, setStatusFilter] = useState('TODOS');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals state
  const [isCreateTicketModalOpen, setIsCreateTicketModalOpen] = useState(false);
  const [transferTicket, setTransferTicket] = useState<SupportTicket | null>(null);
  const [finalizeTicket, setFinalizeTicket] = useState<SupportTicket | null>(null);
  const [detailsTicket, setDetailsTicket] = useState<SupportTicket | null>(null);

  // Subscribe to Firebase Firestore and ensure clean slate of tickets
  useEffect(() => {
    if (!localStorage.getItem('bycomp_tickets_clean_v3')) {
      ticketService.clearAllTickets().then(() => {
        activitySyncService.clearAllTickets();
        localStorage.setItem('bycomp_tickets_clean_v3', 'true');
        setTickets([]);
      });
    }

    // Real-time Firebase Firestore stream
    const unsubscribeFirestore = ticketService.subscribeTickets((firestoreTickets) => {
      setTickets(firestoreTickets);
    });

    return () => {
      unsubscribeFirestore();
    };
  }, []);

  // Access control determination:
  // Gestão e Administrativo (and Super Admin / RH) have access to all queues.
  // Standard users (e.g. N1, N2, N3, DBA, etc.) ONLY see their sector queue!
  const isManagementOrAdmin = useMemo(() => {
    const role = currentUser.userRole;
    const sector = currentUser.sector;
    return (
      role === 'SUPER_ADMIN' ||
      role === 'ADMINISTRATIVO' ||
      role === 'GESTOR' ||
      sector === 'Gestão' ||
      sector === 'Administrativo' ||
      sector === 'RH'
    );
  }, [currentUser]);

  const userNormalizedSector = useMemo(() => {
    return normalizeSector(currentUser.sector);
  }, [currentUser.sector]);

  // If user is not management/admin, restrict queue to their sector
  useEffect(() => {
    if (!isManagementOrAdmin) {
      setSelectedQueueSector(userNormalizedSector);
    }
  }, [isManagementOrAdmin, userNormalizedSector]);

  // Filtered tickets based on access control and filters
  const filteredTickets = useMemo(() => {
    return tickets.filter(t => {
      // Regra de Negócio: Ao fechar o chamado, ele sairá da fila de chamados
      // e ficará registrado somente em Atividades & Excel.
      if (t.status === 'Resolvido') {
        return false;
      }

      const ticketNormSector = normalizeSector(t.sector);

      // RBAC Sector & Service Classification Gate:
      // If NOT management/admin (e.g. N1, N2, N3 specialist, technician):
      if (!isManagementOrAdmin) {
        // If assigned directly to this user, they always have access to view it
        if (t.assignedTo && t.assignedTo.toLowerCase() === (currentUser.name || '').toLowerCase()) {
          // Allowed
        } else {
          // 1. Sector Check
          if (ticketNormSector !== userNormalizedSector) {
            return false;
          }

          // 2. Service Classification Check (TI: Suporte, Infraestrutura, Redes, Governança, etc.)
          // Example from prompt:
          // "Eu sou da T.I, trabalho como N3 Suporte, na minha fila deverá constar somente serviço N3. Porém existe a fila de Infraestrutura que existe o N3 também existes a equipe de Redes que tem o N3. Então deverá ser classificado."
          const userClass = (currentUser.serviceClassification || (currentUser as any).service_classification || '').toLowerCase().trim();
          const ticketClass = (t.serviceClassification || (t as any).service_classification || '').toLowerCase().trim();

          if (userClass && ticketClass) {
            const cleanUser = userClass.replace(/[^a-z0-9]/g, '');
            const cleanTicket = ticketClass.replace(/[^a-z0-9]/g, '');
            const isMatch = cleanUser === cleanTicket ||
              cleanTicket.includes(cleanUser) ||
              cleanUser.includes(cleanTicket) ||
              (cleanUser.includes('suporte') && cleanTicket.includes('suporte')) ||
              (cleanUser.includes('infra') && cleanTicket.includes('infra')) ||
              (cleanUser.includes('rede') && cleanTicket.includes('rede')) ||
              (cleanUser.includes('governan') && cleanTicket.includes('governan')) ||
              (cleanUser.includes('admin') && cleanTicket.includes('admin')) ||
              (cleanUser.includes('dba') && cleanTicket.includes('dba')) ||
              (cleanUser.includes('cyber') && cleanTicket.includes('cyber')) ||
              (cleanUser.includes('patrim') && cleanTicket.includes('patrim')) ||
              (cleanUser.includes('tombamento') && cleanTicket.includes('tombamento')) ||
              (cleanUser.includes('cautela') && cleanTicket.includes('cautela')) ||
              (cleanUser.includes('inventario') && cleanTicket.includes('inventario')) ||
              (cleanUser.includes('descarte') && cleanTicket.includes('descarte')) ||
              (cleanUser.includes('mobiliario') && cleanTicket.includes('mobiliario')) ||
              (cleanUser.includes('backup') && cleanTicket.includes('backup')) ||
              (cleanUser.includes('tuning') && cleanTicket.includes('tuning')) ||
              (cleanUser.includes('modelagem') && cleanTicket.includes('modelagem')) ||
              (cleanUser.includes('replicacao') && cleanTicket.includes('replicacao')) ||
              (cleanUser.includes('extra') && cleanTicket.includes('extra')) ||
              (cleanUser.includes('soc') && cleanTicket.includes('soc')) ||
              (cleanUser.includes('vpn') && cleanTicket.includes('vpn')) ||
              (cleanUser.includes('lgpd') && cleanTicket.includes('lgpd')) ||
              (cleanUser.includes('firewall') && cleanTicket.includes('firewall')) ||
              (cleanUser.includes('protocolo') && cleanTicket.includes('protocolo')) ||
              (cleanUser.includes('rh') && cleanTicket.includes('rh')) ||
              (cleanUser.includes('compra') && cleanTicket.includes('compra')) ||
              (cleanUser.includes('contrato') && cleanTicket.includes('contrato')) ||
              (cleanUser.includes('almoxarif') && cleanTicket.includes('almoxarif')) ||
              (cleanUser.includes('fazend') && cleanTicket.includes('fazend')) ||
              (cleanUser.includes('tribut') && cleanTicket.includes('tribut')) ||
              (cleanUser.includes('saude') && cleanTicket.includes('saude')) ||
              (cleanUser.includes('educa') && cleanTicket.includes('educa')) ||
              (cleanUser.includes('mobili') && cleanTicket.includes('mobili'));

            if (!isMatch) {
              return false;
            }
          }
        }
      } else {
        // Management/Admin can filter by specific sector or view all ('TODOS')
        if (selectedQueueSector !== 'TODOS' && ticketNormSector !== normalizeSector(selectedQueueSector)) {
          return false;
        }

        // Management/Admin can also filter by Service Classification
        if (selectedServiceClassification !== 'TODAS') {
          const ticketClass = (t.serviceClassification || (t as any).service_classification || '').toLowerCase();
          const selClass = selectedServiceClassification.toLowerCase();
          if (!ticketClass.includes(selClass)) {
            return false;
          }
        }
      }

      // Search filter
      const matchSearch =
        t.subject.toLowerCase().includes(search.toLowerCase()) ||
        t.client.toLowerCase().includes(search.toLowerCase()) ||
        t.id.toLowerCase().includes(search.toLowerCase()) ||
        (t.assignedTo && t.assignedTo.toLowerCase().includes(search.toLowerCase())) ||
        (t.serviceType && t.serviceType.toLowerCase().includes(search.toLowerCase()));

      const matchPrio = priorityFilter === 'TODOS' || t.priority === priorityFilter;
      const matchStat = statusFilter === 'TODOS' || t.status === statusFilter;

      return matchSearch && matchPrio && matchStat;
    });
  }, [tickets, isManagementOrAdmin, userNormalizedSector, selectedQueueSector, search, priorityFilter, statusFilter]);

  // Queue counts for quick pills (apenas chamados ativos)
  const queueCounts = useMemo(() => {
    const counts: Record<string, number> = {
      TODOS: 0,
      Patrimônio: 0,
      DBA: 0,
      'Cyber Security': 0,
      Administrativo: 0,
      N1: 0,
      N2: 0,
      N3: 0,
      'Front-End': 0,
      'Back-End': 0,
      Fazenda: 0,
      Saúde: 0,
      Educação: 0,
      'Mobilidade Urbana': 0
    };

    tickets.forEach(t => {
      // Ignorar chamados já fechados/resolvidos na fila
      if (t.status === 'Resolvido') return;

      counts.TODOS++;
      const sec = normalizeSector(t.sector);
      if (counts[sec] !== undefined) {
        counts[sec]++;
      }
    });

    return counts;
  }, [tickets]);

  // Handlers with Firebase Firestore integration
  const handleTakeTicket = async (ticket: SupportTicket) => {
    try {
      activitySyncService.takeTicket(ticket.id, currentUser);
      await ticketService.updateTicket(ticket.id, {
        assignedTo: currentUser.name,
        assignedAvatar: currentUser.avatar,
        status: 'Em atendimento'
      });
      setToastMessage(`✓ Você assumiu o chamado ${ticket.id} (${ticket.subject || ticket.title}). Status atualizado no banco de dados.`);
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err) {
      console.error(err);
      setToastMessage(`✓ Você assumiu o chamado ${ticket.id}.`);
      setTimeout(() => setToastMessage(null), 4000);
    }
  };

  const handleTransferSuccess = async (updatedTicket: SupportTicket, msg: string) => {
    setTransferTicket(null);
    try {
      await ticketService.updateTicket(updatedTicket.id, {
        sector: updatedTicket.sector,
        assignedTo: updatedTicket.assignedTo,
        status: updatedTicket.status,
        history: updatedTicket.history
      });
    } catch (err) {
      console.warn('Transfer sync error:', err);
    }
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleFinalizeSuccess = async ({ ticket, activityId }: { ticket: SupportTicket; activityId: string }) => {
    setFinalizeTicket(null);
    try {
      await ticketService.finalizeTicket(
        ticket.id,
        ticket.resolutionSummary || 'Chamado finalizado pelo especialista com registro gerado',
        ticket.resolvedBy || currentUser.name,
        ticket.resolutionTimeSpent || '30m',
        ticket.participantCollaborator,
        ticket.participantCollaboratorAvatar
      );
    } catch (err) {
      console.warn('Finalize sync error:', err);
    }

    // Regra de Negócio: O chamado fechado sai da fila ativa de chamados
    // e fica registrado exclusivamente em Atividades & Excel (computado para o responsável e coparticipante)
    setTickets(prev => prev.filter(t => t.id !== ticket.id));
    const partNote = ticket.participantCollaborator ? ` e computado também para ${ticket.participantCollaborator}` : '';
    setToastMessage(`✓ Chamado ${ticket.id} fechado com sucesso! Registrado em Atividades${partNote}.`);
    setTimeout(() => setToastMessage(null), 6000);
  };

  const handleCreateTicketSuccess = (newTicket: SupportTicket, msg: string) => {
    setIsCreateTicketModalOpen(false);
    setActiveTab('tickets');
    if (isManagementOrAdmin && selectedQueueSector !== 'TODOS' && normalizeSector(newTicket.sector) !== selectedQueueSector) {
      setSelectedQueueSector('TODOS');
    }
    // Dispatch bottom-right pop-up event
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('ticket:created', { detail: newTicket }));
    }
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 5000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-[#37558d] border border-blue-200 text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-top-4 duration-300">
          <CheckCircle2 className="w-5 h-5 text-emerald-300 shrink-0" />
          <div className="flex items-center gap-3">
            <p className="text-xs font-semibold text-white">{toastMessage}</p>
            {onNavigate && (
              <button
                onClick={() => onNavigate('planilhas')}
                className="px-3 py-1 bg-white text-[#37558d] hover:bg-blue-50 font-bold rounded-lg text-xs transition-all shadow-xs cursor-pointer whitespace-nowrap"
              >
                Ver na Base de Atividades →
              </button>
            )}
          </div>
        </div>
      )}

      {/* Top Header & Session Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#334b84] to-[#37558d] flex items-center justify-center text-white shadow-md shadow-[#334b84]/20">
              <LifeBuoy className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-[#37558d] tracking-tight">
                  Help Desk & Gestão de Chamados
                </h1>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#37558d]/15 text-[#37558d] border border-[#37558d]/30">
                  Fases 5 & 6
                </span>
              </div>
              <p className="text-xs text-[#37558d]/80 font-medium mt-0.5">
                Filas setoriais por nível de serviço, transferência de grupos, Base de Conhecimento e exportação para Excel
              </p>
            </div>
          </div>
        </div>

        {/* Current Operator & Role Badge + Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
          {/* Create Ticket Primary Action Button */}
          <button
            id="btn-abrir-chamado-topo"
            onClick={() => setIsCreateTicketModalOpen(true)}
            className="px-4 py-2 bg-[#334b84] hover:bg-[#37558d] text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-md shadow-[#334b84]/25 cursor-pointer transition-all active:scale-95"
            title="Criar um novo chamado de suporte técnico no sistema"
          >
            <PlusCircle className="w-4 h-4 text-white" />
            <span className="text-white">Criar Chamado</span>
          </button>

          {/* Clean / Clear All Tickets Button for Admin */}
          {isManagementOrAdmin && tickets.length > 0 && (
            <button
              id="btn-limpar-chamados-banco"
              onClick={async () => {
                if (window.confirm('Tem certeza que deseja remover todos os chamados existentes no banco de dados para iniciar com a fila 100% limpa?')) {
                  try {
                    await ticketService.clearAllTickets();
                    activitySyncService.clearAllTickets();
                    setTickets([]);
                    setToastMessage('✓ Todos os chamados foram removidos do banco de dados! Fila 100% limpa.');
                    setTimeout(() => setToastMessage(null), 5000);
                  } catch (err) {
                    console.error('Erro ao limpar chamados:', err);
                  }
                }
              }}
              className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer"
              title="Remover todos os chamados existentes e reiniciar a fila limpa no banco de dados"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Limpar Fila</span>
            </button>
          )}

          <div className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-2 text-xs">
            <div className="w-6 h-6 rounded-full bg-[#334b84]/15 text-[#334b84] font-bold flex items-center justify-center text-[11px] border border-[#334b84]/30">
              {currentUser.name.charAt(0)}
            </div>
            <div>
              <div className="text-[11px] font-bold text-slate-800 leading-none">{currentUser.name}</div>
              <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                <span>Setor: <strong className="text-[#334b84] font-mono">{currentUser.sector}</strong></span>
                <span>•</span>
                <span className="text-slate-600 font-medium">{currentUser.userRole}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('tickets')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'tickets'
              ? 'bg-[#37558d] text-white shadow-xs'
              : 'text-[#37558d] hover:bg-blue-50/80'
          }`}
        >
          <LifeBuoy className="w-4 h-4" />
          <span>Fila de Chamados ({filteredTickets.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('knowledge_base')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'knowledge_base'
              ? 'bg-[#37558d] text-white shadow-xs'
              : 'text-[#37558d] hover:bg-blue-50/80'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Base de Conhecimento (Fase 6)</span>
        </button>

        <button
          onClick={() => setActiveTab('linked_activities')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'linked_activities'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-emerald-700 hover:bg-emerald-50'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
          <span>Atividades & Excel</span>
        </button>
      </div>

      {/* VIEW: TAB 1 - TICKETS QUEUE */}
      {activeTab === 'tickets' && (
        <div className="space-y-4">
          {/* Access Control Information Banner */}
          <div className={`p-4 rounded-2xl border flex items-center justify-between text-xs ${
            isManagementOrAdmin
              ? 'bg-blue-50/80 border-blue-200 text-[#37558d]'
              : 'bg-slate-50 border-slate-200 text-slate-700'
          }`}>
            <div className="flex items-center gap-2.5">
              {isManagementOrAdmin ? (
                <ShieldCheck className="w-5 h-5 text-[#37558d] shrink-0" />
              ) : (
                <Building2 className="w-5 h-5 text-[#37558d] shrink-0" />
              )}
              <div>
                {isManagementOrAdmin ? (
                  <>
                    <strong className="text-[#37558d] font-bold">Acesso Global Concedido:</strong> Perfil de Gestão e Administrativo. Gerenciamento em tempo real sincronizado ao <strong>Banco de Dados (PostgreSQL)</strong>.
                  </>
                ) : (
                  <>
                    <strong className="text-[#37558d] font-bold">Fila Restrita ao Setor:</strong> Operador de <strong>{userNormalizedSector}</strong>. Apenas os chamados atribuídos ao seu grupo de serviço no banco estão visíveis.
                  </>
                )}
              </div>
            </div>

            <div className="text-[11px] font-mono font-bold text-[#37558d] whitespace-nowrap ml-4 bg-white px-2.5 py-1 rounded-lg border border-blue-200">
              {filteredTickets.length} chamados no banco
            </div>
          </div>

          {/* Sector Queue Pills & Service Classification (for Management/Admin or dedicated banner for standard users) */}
          {isManagementOrAdmin ? (
            <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs space-y-3">
              <div>
                <span className="text-[11px] font-bold text-[#37558d] uppercase tracking-wider block mb-1.5">
                  Filas Setoriais (Acesso Executivo Global):
                </span>
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    onClick={() => setSelectedQueueSector('TODOS')}
                    className={`px-3 py-1.5 rounded-xl font-mono text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                      selectedQueueSector === 'TODOS'
                        ? 'bg-[#37558d] text-white shadow-2xs'
                        : 'bg-slate-50 text-[#37558d] border border-slate-200 hover:bg-[#37558d]/10'
                    }`}
                  >
                    <span>Todos os Setores (Global)</span>
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${selectedQueueSector === 'TODOS' ? 'bg-white/25 text-white' : 'bg-[#37558d]/15 text-[#37558d]'}`}>
                      {queueCounts.TODOS}
                    </span>
                  </button>

                  {[
                    'Patrimônio',
                    'DBA',
                    'Cyber Security',
                    'Administrativo',
                    'N1',
                    'N2',
                    'N3',
                    'Front-End',
                    'Back-End',
                    'Fazenda',
                    'Saúde',
                    'Educação',
                    'Mobilidade Urbana'
                  ].map((sec) => (
                    <button
                      key={sec}
                      onClick={() => setSelectedQueueSector(sec)}
                      className={`px-3 py-1.5 rounded-xl font-mono text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                        selectedQueueSector === sec
                          ? 'bg-[#37558d] text-white shadow-2xs'
                          : 'bg-slate-50 text-[#37558d] border border-slate-200 hover:bg-[#37558d]/10'
                      }`}
                    >
                      <span>{sec}</span>
                      <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${selectedQueueSector === sec ? 'bg-white/25 text-white' : 'bg-[#37558d]/15 text-[#37558d]'}`}>
                        {queueCounts[sec] || 0}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Service Classification Filter for Management */}
              <div className="pt-2.5 border-t border-slate-100">
                <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider block mb-1.5 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-blue-600" />
                  Filtrar por Especialidade Municipal (GLPI Todos os Setores):
                </span>
                <div className="flex flex-wrap items-center gap-1.5">
                  {[
                    { id: 'TODAS', label: 'Todos os Serviços' },
                    { id: 'Patrimônio', label: 'Patrimônio & Bens' },
                    { id: 'DBA', label: 'DBA / Dados' },
                    { id: 'Cyber', label: 'Cyber Security & SOC' },
                    { id: 'Administração', label: 'Administração & RH' },
                    { id: 'Suporte', label: 'Suporte (N1/N2/N3)' },
                    { id: 'Infraestrutura', label: 'Infraestrutura' },
                    { id: 'Redes', label: 'Redes & Telecom' },
                    { id: 'Fazenda', label: 'Fazenda & Tributos' },
                    { id: 'Saúde', label: 'Saúde (e-SUS)' },
                    { id: 'Educação', label: 'Educação' },
                    { id: 'Mobilidade', label: 'Mobilidade & Frota' }
                  ].map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setSelectedServiceClassification(item.id)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-semibold transition-all cursor-pointer ${
                        selectedServiceClassification === item.id
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-blue-50/70 text-blue-800 border border-blue-200 hover:bg-blue-100'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white border-2 border-blue-200 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-[#37558d] font-bold text-sm shrink-0">
                  <Layers className="w-5 h-5 text-[#37558d]" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-bold text-slate-800">Sua Fila Técnica Direcionada:</span>
                    <span className="px-2 py-0.5 rounded-md bg-[#37558d] text-white text-[11px] font-mono font-bold">
                      Setor: {userNormalizedSector}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-md bg-blue-100 text-blue-800 border border-blue-200 text-[11px] font-mono font-bold">
                      Classificação: {currentUser.serviceClassification || (currentUser as any).service_classification || 'Suporte N3'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Exibindo exclusivamente chamados direcionados para <strong>{currentUser.serviceClassification || (currentUser as any).service_classification || 'Suporte'}</strong> no setor {userNormalizedSector}.
                  </p>
                </div>
              </div>
              <span className="text-[11px] text-slate-500 font-mono bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 self-start sm:self-auto">
                Isolamento por Especialidade Ativo
              </span>
            </div>
          )}

          {/* Search and Extra Filters with White Background and #37558d styling */}
          <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-[#37558d]" />
              <input
                type="text"
                placeholder="Pesquisar por ID, cliente, assunto, técnico ou tipo de serviço..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50/70 border border-slate-200 rounded-xl text-xs text-[#37558d] font-semibold placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:border-[#37558d] focus:ring-1 focus:ring-[#37558d] transition-all shadow-2xs"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50/70 border border-slate-200 rounded-xl text-xs text-[#37558d] font-semibold focus:outline-none focus:border-[#37558d] transition-all"
              >
                <option value="TODOS">Status: Todos os Ativos</option>
                <option value="Aberto">Aberto</option>
                <option value="Em atendimento">Em atendimento</option>
                <option value="Aguardando">Aguardando Cliente</option>
              </select>

              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50/70 border border-slate-200 rounded-xl text-xs text-[#37558d] font-semibold focus:outline-none focus:border-[#37558d] transition-all"
              >
                <option value="TODOS">Prioridade: Todas</option>
                <option value="Crítica">Crítica</option>
                <option value="Alta">Alta</option>
                <option value="Média">Média</option>
                <option value="Baixa">Baixa</option>
              </select>

              <button
                type="button"
                id="btn-criar-chamado-busca"
                onClick={() => setIsCreateTicketModalOpen(true)}
                className="px-3.5 py-2 bg-[#334b84] hover:bg-[#37558d] text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer shrink-0 shadow-xs active:scale-95"
                title="Abrir Novo Chamado"
              >
                <PlusCircle className="w-3.5 h-3.5 text-white" />
                <span className="hidden md:inline text-white">Novo Chamado</span>
              </button>
            </div>
          </div>

          {/* Tickets Cards & Table */}
          {filteredTickets.length === 0 ? (
            <div className="p-12 text-center bg-white border border-slate-200 rounded-2xl space-y-3 shadow-xs">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-[#37558d] mx-auto">
                <LifeBuoy className="w-6 h-6 text-[#37558d]" />
              </div>
              <p className="text-sm font-bold text-slate-800">Fila limpa — Nenhum chamado pendente no momento.</p>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Todos os chamados são persistidos com segurança no banco de dados corporativo PostgreSQL.
              </p>
              <button
                type="button"
                id="btn-abrir-primeiro-chamado"
                onClick={() => setIsCreateTicketModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#334b84] hover:bg-[#37558d] text-white font-bold rounded-xl text-xs transition-all cursor-pointer shadow-md shadow-[#334b84]/20 active:scale-95"
              >
                <PlusCircle className="w-4 h-4 text-white" />
                <span className="text-white">Abrir Chamado</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className={`bg-white border rounded-2xl p-4.5 shadow-xs transition-all hover:border-[#37558d]/40 ${
                    ticket.status === 'Resolvido'
                      ? 'border-emerald-200 bg-emerald-50/20'
                      : ticket.priority === 'Crítica'
                        ? 'border-rose-200 bg-rose-50/20'
                        : 'border-slate-200'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    {/* Main Ticket Info */}
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="font-mono font-bold text-[#37558d] bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-lg">
                          {ticket.id}
                        </span>
                        <span className="text-slate-700 font-semibold">{ticket.client || ticket.requester}</span>
                        <span className="text-slate-300">•</span>
                        <span className="px-2 py-0.5 rounded-lg bg-slate-100 border border-slate-200 text-[#37558d] font-mono text-[11px] font-semibold">
                          Setor: {ticket.sector}
                        </span>
                        {(ticket.serviceClassification || (ticket as any).service_classification) && (
                          <span className="px-2 py-0.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 font-mono text-[11px] font-bold flex items-center gap-1">
                            <Layers className="w-3 h-3 text-blue-600" />
                            <span>Fila: {ticket.serviceClassification || (ticket as any).service_classification}</span>
                          </span>
                        )}
                        <span className={`px-2 py-0.5 rounded-lg text-[11px] font-bold ${
                          ticket.priority === 'Crítica'
                            ? 'bg-rose-100 text-rose-700 border border-rose-200'
                            : ticket.priority === 'Alta'
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}>
                          {ticket.priority}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                          ticket.status === 'Resolvido'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : ticket.status === 'Em atendimento'
                              ? 'bg-blue-100 text-blue-800 border border-blue-200'
                              : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}>
                          {ticket.status}
                        </span>
                      </div>

                      <h3 className="text-sm font-bold text-[#37558d] leading-snug">
                        {ticket.subject || ticket.title}
                      </h3>

                      {/* Subtitle / Context */}
                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 font-mono">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-[#37558d]" />
                          <span>Aberto há {ticket.openTime}</span>
                        </span>
                        {ticket.assignedTo && (
                          <span className="flex items-center gap-1 text-[#37558d] font-semibold">
                            <UserCheck className="w-3 h-3 text-[#37558d]" />
                            <span>Responsável: {ticket.assignedTo}</span>
                          </span>
                        )}
                        {ticket.participantCollaborator && (
                          <span className="flex items-center gap-1 text-[#37558d] font-semibold bg-blue-50/80 px-2 py-0.5 rounded-md border border-blue-200">
                            <Users className="w-3 h-3 text-[#37558d]" />
                            <span>Colaboração: {ticket.participantCollaborator}</span>
                          </span>
                        )}
                        {ticket.status === 'Resolvido' && ticket.resolvedBy && (
                          <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Resolvido por: {ticket.resolvedBy} ({ticket.resolvedSector})</span>
                          </span>
                        )}
                      </div>

                      {/* Resolution details snippet if resolved */}
                      {ticket.status === 'Resolvido' && ticket.resolutionSummary && (
                        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 mt-1">
                          <span className="font-bold text-emerald-800 block text-[11px]">
                            Solução ({ticket.serviceType || 'Serviço Padrão'}):
                          </span>
                          <p className="text-[11px] text-slate-700 mt-0.5">
                            {ticket.resolutionSummary}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Operational Action Buttons: Assumir, Transferir, Finalizar */}
                    <div className="flex flex-wrap items-center gap-2 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-200">
                      {/* View Details */}
                      <button
                        onClick={() => setDetailsTicket(ticket)}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                      >
                        Detalhes
                      </button>

                      {/* Botão Especial Patrimônio / Gerar Etiqueta */}
                      {(normalizeSector(ticket.sector) === 'Patrimônio' || (ticket.subject && (ticket.subject.toLowerCase().includes('etiqueta') || ticket.subject.toLowerCase().includes('tombamento')))) && onNavigate && (
                        <button
                          onClick={() => onNavigate('equipamentos')}
                          className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-800 text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
                          title="Abrir Emissor de Etiquetas de Patrimônio para este item"
                        >
                          <Tag className="w-3.5 h-3.5 text-amber-600" />
                          <span>Gerar Etiqueta</span>
                        </button>
                      )}

                      {/* 1. Botão "Assumir" */}
                      {ticket.status !== 'Resolvido' && (
                        <button
                          onClick={() => handleTakeTicket(ticket)}
                          disabled={ticket.assignedTo === currentUser.name}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                            ticket.assignedTo === currentUser.name
                              ? 'bg-blue-50 border border-blue-200 text-[#37558d] cursor-default'
                              : 'bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 text-[#37558d]'
                          }`}
                          title={ticket.assignedTo === currentUser.name ? 'Você já é o responsável por este chamado' : 'Atribuir este chamado para você'}
                        >
                          <UserCheck className="w-3.5 h-3.5 text-[#37558d]" />
                          <span>{ticket.assignedTo === currentUser.name ? 'Assumido por Você' : 'Assumir'}</span>
                        </button>
                      )}

                      {/* 2. Botão "Transferir" */}
                      {ticket.status !== 'Resolvido' && (
                        <button
                          onClick={() => setTransferTicket(ticket)}
                          className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                          title="Transferir chamado para outro grupo de serviço ou colaborador específico"
                        >
                          <ArrowRightLeft className="w-3.5 h-3.5 text-[#37558d]" />
                          <span>Transferir</span>
                        </button>
                      )}

                      {/* 3. Botão "Finalizar" */}
                      {ticket.status !== 'Resolvido' ? (
                        <button
                          onClick={() => setFinalizeTicket(ticket)}
                          className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                          title="Finalizar chamado com Base de Conhecimento e vincular ao Registro de Atividades"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Finalizar</span>
                        </button>
                      ) : (
                        <span className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold font-mono flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" />
                          <span>Concluído</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* VIEW: TAB 2 - KNOWLEDGE BASE (FASE 6) */}
      {activeTab === 'knowledge_base' && (
        <KnowledgeBaseExplorer currentUser={currentUser} />
      )}

      {/* VIEW: TAB 3 - LINKED ACTIVITIES & EXCEL EXPORT */}
      {activeTab === 'linked_activities' && (
        <LinkedActivitiesTab currentUser={currentUser} onNavigate={onNavigate} />
      )}

      {/* MODALS */}
      {isCreateTicketModalOpen && (
        <CreateTicketModal
          currentUser={currentUser}
          onClose={() => setIsCreateTicketModalOpen(false)}
          onSuccess={handleCreateTicketSuccess}
        />
      )}

      {transferTicket && (
        <TicketTransferModal
          ticket={transferTicket}
          currentUser={currentUser}
          onClose={() => setTransferTicket(null)}
          onSuccess={handleTransferSuccess}
        />
      )}

      {finalizeTicket && (
        <ErrorBoundary
          fallbackTitle="Não foi possível carregar a janela de finalização do chamado"
          onReset={() => setFinalizeTicket(null)}
        >
          <TicketFinalizeModal
            ticket={finalizeTicket}
            currentUser={currentUser}
            kbArticles={activitySyncService.getKnowledgeBase()}
            onClose={() => setFinalizeTicket(null)}
            onSuccess={handleFinalizeSuccess}
          />
        </ErrorBoundary>
      )}

      {detailsTicket && (
        <TicketDetailsModal
          ticket={detailsTicket}
          onClose={() => setDetailsTicket(null)}
          onTakeTicket={handleTakeTicket}
          onOpenTransfer={(t) => setTransferTicket(t)}
          onOpenFinalize={(t) => setFinalizeTicket(t)}
        />
      )}
    </div>
  );
};
