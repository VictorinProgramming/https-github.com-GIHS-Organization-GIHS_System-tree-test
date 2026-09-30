import React, { useState, useEffect, useMemo } from 'react';
import {
  CalendarClock,
  Clock,
  UserCheck,
  Calendar,
  Plus,
  Filter,
  FileDown,
  AlertTriangle,
  CheckCircle2,
  Phone,
  Smartphone,
  ShieldAlert,
  Search,
  ChevronLeft,
  ChevronRight,
  Printer,
  X,
  Trash2,
  RefreshCw,
  Building2,
  FileText
} from 'lucide-react';
import { OnCallShift, Collaborator, CorporateDevice, SupportTicket } from '../../types';
import { apiBackendService } from '../../services/apiBackendService';
import { GIHSLogo } from '../GIHSLogo';

interface OnCallViewProps {
  currentUser: Collaborator;
}

export const OnCallView: React.FC<OnCallViewProps> = ({ currentUser }) => {
  const [shifts, setShifts] = useState<OnCallShift[]>([]);
  const [activeShifts, setActiveShifts] = useState<OnCallShift[]>([]);
  const [upcomingShifts, setUpcomingShifts] = useState<OnCallShift[]>([]);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [devices, setDevices] = useState<CorporateDevice[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [sectors, setSectors] = useState<any[]>([]);

  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filtros
  const [viewMode, setViewMode] = useState<'SEMANA' | 'MES' | 'DIA' | 'TODOS'>('SEMANA');
  const [selectedSector, setSelectedSector] = useState<string>('ALL');
  const [selectedCollaborator, setSelectedCollaborator] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Modal de Criação de Escala
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalUserId, setModalUserId] = useState<string>('');
  const [modalSectorId, setModalSectorId] = useState<string>('');
  const [modalStartDate, setModalStartDate] = useState<string>('');
  const [modalStartTime, setModalStartTime] = useState<string>('18:00');
  const [modalEndDate, setModalEndDate] = useState<string>('');
  const [modalEndTime, setModalEndTime] = useState<string>('08:00');
  const [modalDeviceId, setModalDeviceId] = useState<string>('');
  const [modalNotes, setModalNotes] = useState<string>('');
  const [conflictWarning, setConflictWarning] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Modal de Exportação / Visualização do PDF
  const [isPdfModalOpen, setIsPdfModalOpen] = useState<boolean>(false);
  const [pdfPeriodLabel, setPdfPeriodLabel] = useState<string>('');

  const isManagerOrAdmin = useMemo(() => {
    return ['SUPER_ADMIN', 'ADMINISTRATIVO', 'GESTOR'].includes(currentUser.userRole || '');
  }, [currentUser]);

  // Carrega dados iniciais do PostgreSQL
  const loadData = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const [shiftsRes, activeRes, upcomingRes, usersRes, devicesRes, ticketsRes, sectorsRes] = await Promise.all([
        apiBackendService.getOnCallShifts(),
        apiBackendService.getCurrentOnCallActive(),
        apiBackendService.getUpcomingOnCall(8),
        apiBackendService.getUsers().catch(() => ({ data: [] })),
        apiBackendService.getMobilityDevices().catch(() => ({ data: [] })),
        apiBackendService.getTickets().catch(() => ({ data: [] })),
        apiBackendService.getSectors().catch(() => ({ data: [] }))
      ]);

      if (shiftsRes.success) setShifts(shiftsRes.data);
      if (activeRes.success) setActiveShifts(activeRes.data);
      if (upcomingRes.success) setUpcomingShifts(upcomingRes.data);
      if (usersRes.data) setCollaborators(usersRes.data);
      if (devicesRes.data) setDevices(devicesRes.data);
      if (ticketsRes.data) setTickets(ticketsRes.data);
      if (sectorsRes.data) setSectors(sectorsRes.data);
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao carregar escalas de sobreaviso do PostgreSQL.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Preenche valores padrão no modal
  useEffect(() => {
    if (isModalOpen) {
      const today = new Date();
      const tomorrow = new Date();
      tomorrow.setDate(today.getDate() + 1);

      setModalStartDate(today.toISOString().split('T')[0]);
      setModalEndDate(tomorrow.toISOString().split('T')[0]);
      setConflictWarning(null);
    }
  }, [isModalOpen]);

  // Validação dinâmica de conflito ao selecionar colaborador ou horários no modal
  useEffect(() => {
    const checkConflictLive = async () => {
      if (!modalUserId || !modalStartDate || !modalEndDate || !modalStartTime || !modalEndTime) {
        setConflictWarning(null);
        return;
      }

      const startIso = `${modalStartDate}T${modalStartTime}:00.000Z`;
      const endIso = `${modalEndDate}T${modalEndTime}:00.000Z`;

      if (new Date(endIso) <= new Date(startIso)) {
        setConflictWarning('A data/hora de término deve ser posterior à data/hora inicial.');
        return;
      }

      try {
        const res = await apiBackendService.checkOnCallConflict(modalUserId, startIso, endIso);
        if (res.hasConflict && res.conflictingShift) {
          const conf = res.conflictingShift;
          const s = new Date(conf.start_at).toLocaleString('pt-BR');
          const e = new Date(conf.end_at).toLocaleString('pt-BR');
          setConflictWarning(`ATENÇÃO: Este colaborador já possui escala conflitante agendada entre ${s} e ${e}.`);
        } else {
          setConflictWarning(null);
        }
      } catch (err) {
        console.warn('Erro ao checar conflito:', err);
      }
    };

    checkConflictLive();
  }, [modalUserId, modalStartDate, modalStartTime, modalEndDate, modalEndTime]);

  // Criação de escala no PostgreSQL
  const handleCreateShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalUserId || !modalStartDate || !modalEndDate) {
      setErrorMsg('Preencha os campos obrigatórios.');
      return;
    }

    const startIso = `${modalStartDate}T${modalStartTime}:00.000Z`;
    const endIso = `${modalEndDate}T${modalEndTime}:00.000Z`;

    if (new Date(endIso) <= new Date(startIso)) {
      setErrorMsg('O horário de encerramento deve ser após o horário inicial.');
      return;
    }

    const selectedUser = collaborators.find(c => c.id === modalUserId);
    const selectedSectorObj = sectors.find(s => s.id === modalSectorId) || { name: selectedUser?.sector || 'Geral' };
    const selectedDeviceObj = devices.find(d => d.id === modalDeviceId);

    setSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await apiBackendService.createOnCallShift({
        user_id: modalUserId,
        user_name: selectedUser?.name || 'Colaborador',
        sector_id: modalSectorId || undefined,
        sector_name: selectedSectorObj.name,
        device_id: modalDeviceId || undefined,
        device_tag: selectedDeviceObj?.patrimony_tag || undefined,
        device_phone: selectedDeviceObj?.specifications?.phone_number || undefined,
        start_at: startIso,
        end_at: endIso,
        status: new Date() >= new Date(startIso) && new Date() <= new Date(endIso) ? 'EM_SOBREAVISO' : 'AGENDADO',
        notes: modalNotes,
        created_by: currentUser.id,
        created_by_name: currentUser.name
      });

      if (res.success) {
        setSuccessMsg('Escala de sobreaviso registrada com sucesso no PostgreSQL!');
        setIsModalOpen(false);
        setModalNotes('');
        await loadData();
        setTimeout(() => setSuccessMsg(null), 4000);
      } else {
        setErrorMsg(res.error || 'Erro ao criar escala.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao salvar escala.');
    } finally {
      setSubmitting(false);
    }
  };

  // Exclusão / Cancelamento de escala
  const handleDeleteShift = async (shiftId: string) => {
    if (!window.confirm('Confirma o cancelamento desta escala de sobreaviso?')) return;
    try {
      const res = await apiBackendService.deleteOnCallShift(shiftId, currentUser.name, currentUser.id);
      if (res.success) {
        setSuccessMsg('Escala cancelada com sucesso.');
        await loadData();
        setTimeout(() => setSuccessMsg(null), 3000);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao cancelar escala.');
    }
  };

  // Filtragem dos turnos da tabela
  const filteredShifts = useMemo(() => {
    return shifts.filter(shift => {
      // Filtro de permissão: colaborador comum só vê sua própria escala e a do seu setor
      if (!isManagerOrAdmin) {
        const isSelf = shift.user_id === currentUser.id;
        const isMySector = shift.sector_name === currentUser.sector;
        if (!isSelf && !isMySector) return false;
      }

      if (selectedSector !== 'ALL' && shift.sector_id !== selectedSector && shift.sector_name !== selectedSector) {
        return false;
      }

      if (selectedCollaborator !== 'ALL' && shift.user_id !== selectedCollaborator) {
        return false;
      }

      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchesName = shift.user_name.toLowerCase().includes(term);
        const matchesSector = shift.sector_name.toLowerCase().includes(term);
        const matchesDevice = (shift.device_tag || '').toLowerCase().includes(term);
        if (!matchesName && !matchesSector && !matchesDevice) return false;
      }

      return true;
    });
  }, [shifts, selectedSector, selectedCollaborator, searchTerm, isManagerOrAdmin, currentUser]);

  // Exportação e Auditoria do PDF
  const handleExportPdf = async () => {
    const period = `Semana ${new Date().toLocaleDateString('pt-BR')} — Gerado por ${currentUser.name}`;
    setPdfPeriodLabel(period);
    setIsPdfModalOpen(true);

    try {
      await apiBackendService.auditPdfGeneration({
        user_id: currentUser.id,
        user_name: currentUser.name,
        filter_period: viewMode,
        sector: selectedSector,
        total_shifts: filteredShifts.length
      });
    } catch (err) {
      console.warn('Erro ao registrar auditoria de PDF:', err);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Cabeçalho Oficial do Módulo */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#01122D] p-6 rounded-3xl border border-[#0A2854] shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#0067FC] to-[#041838] flex items-center justify-center text-white border border-[#0067FC]/40 shadow-lg shadow-[#0067FC]/20">
            <CalendarClock className="w-7 h-7 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#0067FC]/10 text-[#0067FC] border border-[#0067FC]/30">
                Operações & Tarefas
              </span>
              <span className="text-xs text-slate-400 font-mono">
                PostgreSQL • 100% Auditável
              </span>
            </div>
            <h1 className="text-2xl font-bold text-white mt-1">
              Escala de Sobreaviso & Plantão
            </h1>
            <p className="text-sm text-slate-400">
              Planejamento, acompanhamento em tempo real e visualização de escalas de sobreaviso corporativo para todos os setores.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            disabled={loading}
            className="p-2.5 rounded-xl bg-[#041838] hover:bg-[#0067FC]/20 text-slate-300 hover:text-white border border-[#0A2854] transition-all cursor-pointer"
            title="Atualizar dados do PostgreSQL"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#0067FC]' : ''}`} />
          </button>

          <button
            onClick={handleExportPdf}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#041838] hover:bg-[#0067FC]/30 text-white font-medium text-sm border border-[#0A2854] transition-all cursor-pointer shadow-md"
          >
            <FileDown className="w-4 h-4 text-[#0067FC]" />
            <span>Gerar PDF Oficial</span>
          </button>

          {isManagerOrAdmin && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0067FC] hover:bg-[#0052cc] text-white font-semibold text-sm transition-all cursor-pointer shadow-lg shadow-[#0067FC]/30 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Criar Escala</span>
            </button>
          )}
        </div>
      </div>

      {/* Alertas & Mensagens */}
      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-center justify-between text-sm animate-in fade-in">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="p-1 hover:text-white cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 flex items-center justify-between text-sm animate-in fade-in">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="p-1 hover:text-white cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* PAINEL SUPERIOR: SOBREAVISO ATUAL & PRÓXIMOS SOBREAVISOS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Card 1: AGORA DE SOBREAVISO (Destaque Principal) */}
        <div className="lg:col-span-2 bg-[#01122D] border border-[#0A2854] rounded-3xl p-6 relative overflow-hidden shadow-xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#0067FC]/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              <h2 className="text-lg font-bold text-white tracking-wide uppercase">
                Sobreaviso Atual
              </h2>
            </div>
            <span className="text-xs font-mono text-slate-400 bg-[#041838] px-3 py-1 rounded-full border border-[#0A2854]">
              {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} • Tempo Real
            </span>
          </div>

          {activeShifts.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-[#000B1D]/40 border border-[#0A2854]/60">
              <Clock className="w-10 h-10 text-slate-500 mx-auto mb-2" />
              <p className="text-slate-300 font-medium text-sm">Nenhum colaborador em sobreaviso ativo no momento.</p>
              <p className="text-xs text-slate-500 mt-1">Os turnos iniciam automaticamente no horário planejado cadastrado no PostgreSQL.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeShifts.map((shift) => (
                <div
                  key={shift.id}
                  className="bg-[#000B1D]/80 border border-[#0067FC]/40 rounded-2xl p-4 relative group hover:border-[#0067FC] transition-all shadow-lg shadow-[#0067FC]/5"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[11px] font-semibold uppercase px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-800">
                        Ativo Agora
                      </span>
                      <h3 className="text-base font-bold text-white mt-1.5">{shift.user_name}</h3>
                      <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                        <Building2 className="w-3.5 h-3.5 text-[#0067FC]" />
                        Setor: <strong className="text-slate-200">{shift.sector_name}</strong>
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-mono text-slate-300 block">
                        {new Date(shift.start_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} ➔ {new Date(shift.end_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(shift.end_at).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </div>

                  {/* Informações de Contato & Celular Corporativo */}
                  <div className="mt-3 pt-3 border-t border-[#0A2854] flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-1.5 text-slate-300">
                      <Smartphone className="w-3.5 h-3.5 text-[#0067FC]" />
                      <span>{shift.device_tag || 'Celular Corporativo'}</span>
                      {shift.device_phone && (
                        <span className="font-mono text-[#0067FC] bg-[#041838] px-2 py-0.5 rounded border border-[#0A2854]">
                          {shift.device_phone}
                        </span>
                      )}
                    </div>

                    {shift.notes && (
                      <span className="text-[11px] text-slate-400 italic truncate max-w-[200px]" title={shift.notes}>
                        {shift.notes}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Card 2: PRÓXIMOS DE SOBREAVISO */}
        <div className="bg-[#01122D] border border-[#0A2854] rounded-3xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-white uppercase tracking-wide flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#0067FC]" />
                Próximos de Sobreaviso
              </h2>
              <span className="text-xs text-slate-400 font-mono">
                {upcomingShifts.length} Agendados
              </span>
            </div>

            {upcomingShifts.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-8">
                Nenhum sobreaviso futuro agendado para os próximos dias.
              </p>
            ) : (
              <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                {upcomingShifts.slice(0, 4).map((up) => (
                  <div key={up.id} className="p-2.5 rounded-xl bg-[#000B1D]/60 border border-[#0A2854] flex items-center justify-between text-xs">
                    <div>
                      <p className="font-semibold text-slate-200">{up.user_name}</p>
                      <p className="text-[11px] text-slate-400">{up.sector_name}</p>
                    </div>
                    <div className="text-right font-mono text-[11px]">
                      <span className="text-[#0067FC] block">
                        {new Date(up.start_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                      </span>
                      <span className="text-slate-400">
                        {new Date(up.start_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-[#0A2854] text-[11px] text-slate-400 flex items-center justify-between">
            <span>Cobertura contínua 24/7</span>
            <span className="text-emerald-400 font-medium">Equipes Homologadas</span>
          </div>
        </div>
      </div>

      {/* FILTROS E CONTROLES DA TABELA */}
      <div className="bg-[#01122D] border border-[#0A2854] rounded-3xl p-5 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Modos de Visualização */}
          <div className="flex items-center gap-1.5 bg-[#000B1D] p-1.5 rounded-2xl border border-[#0A2854]">
            {(['SEMANA', 'MES', 'DIA', 'TODOS'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  viewMode === mode
                    ? 'bg-[#0067FC] text-white shadow-md shadow-[#0067FC]/30'
                    : 'text-slate-400 hover:text-white hover:bg-[#041838]'
                }`}
              >
                {mode === 'SEMANA' && 'Semana Atual'}
                {mode === 'MES' && 'Visão Mensal'}
                {mode === 'DIA' && 'Hoje'}
                {mode === 'TODOS' && 'Todos os Registros'}
              </button>
            ))}
          </div>

          {/* Busca e Filtros Setoriais */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar colaborador, setor ou celular..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-9 pr-3 py-1.5 rounded-xl bg-[#000B1D] border border-[#0A2854] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#0067FC] w-64"
              />
            </div>

            {/* Filtro de Setor */}
            <select
              value={selectedSector}
              onChange={e => setSelectedSector(e.target.value)}
              className="py-1.5 px-3 rounded-xl bg-[#000B1D] border border-[#0A2854] text-xs text-slate-200 focus:outline-none focus:border-[#0067FC] cursor-pointer"
            >
              <option value="ALL">Todos os Setores</option>
              {sectors.map(sec => (
                <option key={sec.id} value={sec.id}>{sec.name}</option>
              ))}
            </select>

            {/* Filtro de Colaborador */}
            {isManagerOrAdmin && (
              <select
                value={selectedCollaborator}
                onChange={e => setSelectedCollaborator(e.target.value)}
                className="py-1.5 px-3 rounded-xl bg-[#000B1D] border border-[#0A2854] text-xs text-slate-200 focus:outline-none focus:border-[#0067FC] cursor-pointer"
              >
                <option value="ALL">Todos os Colaboradores</option>
                {collaborators.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            )}
          </div>
        </div>
      </div>

      {/* TABELA DE ESCALA DE SOBREAVISO */}
      <div className="bg-[#01122D] border border-[#0A2854] rounded-3xl overflow-hidden shadow-2xl">
        <div className="p-5 border-b border-[#0A2854] flex items-center justify-between bg-[#000B1D]/40">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#0067FC]" />
              Quadro de Escalas Homologadas
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Exibindo {filteredShifts.length} escalas sincronizadas diretamente com o PostgreSQL
            </p>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {filteredShifts.filter(s => s.status === 'EM_SOBREAVISO').length} em plantão ativo
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#0A2854] bg-[#000B1D]/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">Funcionário</th>
                <th className="py-3 px-4">Setor</th>
                <th className="py-3 px-4">Início</th>
                <th className="py-3 px-4">Fim</th>
                <th className="py-3 px-4">Aparelho Corporativo</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Observações</th>
                {isManagerOrAdmin && <th className="py-3 px-4 text-right">Ações</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#0A2854]/60 text-xs text-slate-200">
              {filteredShifts.length === 0 ? (
                <tr>
                  <td colSpan={isManagerOrAdmin ? 8 : 7} className="py-12 text-center text-slate-400">
                    <CalendarClock className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                    <p className="font-semibold text-sm">Nenhuma escala encontrada com os filtros selecionados.</p>
                    <p className="text-xs text-slate-500 mt-1">Crie novas escalas ou limpe os filtros de setor e colaborador.</p>
                  </td>
                </tr>
              ) : (
                filteredShifts.map((shift) => {
                  const isCurrentActive = shift.status === 'EM_SOBREAVISO' || (
                    new Date() >= new Date(shift.start_at) && new Date() <= new Date(shift.end_at)
                  );

                  return (
                    <tr
                      key={shift.id}
                      className={`hover:bg-[#0067FC]/5 transition-colors ${
                        isCurrentActive ? 'bg-[#0067FC]/10' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4 font-semibold text-white">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-[#041838] border border-[#0A2854] flex items-center justify-center font-bold text-[#0067FC] text-xs">
                            {shift.user_name.substring(0, 2).toUpperCase()}
                          </div>
                          <span>{shift.user_name}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-md bg-[#041838] border border-[#0A2854] text-[11px] font-mono text-slate-300">
                          {shift.sector_name}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-mono">
                        <span className="text-slate-200 block">
                          {new Date(shift.start_at).toLocaleDateString('pt-BR')}
                        </span>
                        <span className="text-slate-400 text-[11px]">
                          {new Date(shift.start_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-mono">
                        <span className="text-slate-200 block">
                          {new Date(shift.end_at).toLocaleDateString('pt-BR')}
                        </span>
                        <span className="text-slate-400 text-[11px]">
                          {new Date(shift.end_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        {shift.device_tag ? (
                          <div className="flex items-center gap-1.5">
                            <Smartphone className="w-3.5 h-3.5 text-[#0067FC]" />
                            <span className="font-mono text-slate-300">{shift.device_tag}</span>
                            {shift.device_phone && (
                              <span className="text-[10px] text-slate-400 block">
                                ({shift.device_phone})
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-500 italic text-[11px]">Nenhum celular vinculado</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                          shift.status === 'EM_SOBREAVISO' || isCurrentActive
                            ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800'
                            : shift.status === 'AGENDADO'
                            ? 'bg-blue-950/80 text-blue-400 border-blue-800'
                            : shift.status === 'FINALIZADO'
                            ? 'bg-slate-900 text-slate-400 border-slate-700'
                            : 'bg-rose-950/80 text-rose-400 border-rose-800'
                        }`}>
                          {isCurrentActive ? 'Em Sobreaviso' : shift.status}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 max-w-xs truncate text-slate-400 text-[11px]">
                        {shift.notes || '—'}
                      </td>

                      {isManagerOrAdmin && (
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => handleDeleteShift(shift.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                            title="Cancelar / Excluir escala"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: CRIAR ESCALA COM VALIDAÇÃO DE CONFLITO */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#000B1D]/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#01122D] border border-[#0A2854] rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl relative">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#0A2854]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#0067FC]/20 text-[#0067FC] flex items-center justify-center border border-[#0067FC]/30">
                  <CalendarClock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Cadastrar Escala de Sobreaviso</h3>
                  <p className="text-xs text-slate-400">Validação rigorosa de sobreposição e conflito de horário</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-[#041838] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateShift} className="space-y-4">
              {/* Seleção do Colaborador */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Funcionário *
                </label>
                <select
                  required
                  value={modalUserId}
                  onChange={e => {
                    const uid = e.target.value;
                    setModalUserId(uid);
                    const user = collaborators.find(c => c.id === uid);
                    if (user && user.sector) {
                      const matchedSec = sectors.find(s => s.name === user.sector);
                      if (matchedSec) setModalSectorId(matchedSec.id);
                    }
                  }}
                  className="w-full py-2.5 px-3 rounded-xl bg-[#000B1D] border border-[#0A2854] text-sm text-white focus:outline-none focus:border-[#0067FC]"
                >
                  <option value="">Selecione o colaborador...</option>
                  {collaborators.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} — {c.sector || 'TI'} ({c.role})
                    </option>
                  ))}
                </select>
              </div>

              {/* Setor do Plantão */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Setor do Sobreaviso *
                </label>
                <select
                  required
                  value={modalSectorId}
                  onChange={e => setModalSectorId(e.target.value)}
                  className="w-full py-2.5 px-3 rounded-xl bg-[#000B1D] border border-[#0A2854] text-sm text-white focus:outline-none focus:border-[#0067FC]"
                >
                  <option value="">Selecione o setor...</option>
                  {sectors.map(sec => (
                    <option key={sec.id} value={sec.id}>{sec.name} ({sec.area})</option>
                  ))}
                </select>
              </div>

              {/* Data e Horário Inicial */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Data Inicial *
                  </label>
                  <input
                    type="date"
                    required
                    value={modalStartDate}
                    onChange={e => setModalStartDate(e.target.value)}
                    className="w-full py-2 px-3 rounded-xl bg-[#000B1D] border border-[#0A2854] text-sm text-white focus:outline-none focus:border-[#0067FC]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Horário Inicial *
                  </label>
                  <input
                    type="time"
                    required
                    value={modalStartTime}
                    onChange={e => setModalStartTime(e.target.value)}
                    className="w-full py-2 px-3 rounded-xl bg-[#000B1D] border border-[#0A2854] text-sm text-white focus:outline-none focus:border-[#0067FC]"
                  />
                </div>
              </div>

              {/* Data e Horário Final */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Data Final *
                  </label>
                  <input
                    type="date"
                    required
                    value={modalEndDate}
                    onChange={e => setModalEndDate(e.target.value)}
                    className="w-full py-2 px-3 rounded-xl bg-[#000B1D] border border-[#0A2854] text-sm text-white focus:outline-none focus:border-[#0067FC]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Horário Final *
                  </label>
                  <input
                    type="time"
                    required
                    value={modalEndTime}
                    onChange={e => setModalEndTime(e.target.value)}
                    className="w-full py-2 px-3 rounded-xl bg-[#000B1D] border border-[#0A2854] text-sm text-white focus:outline-none focus:border-[#0067FC]"
                  />
                </div>
              </div>

              {/* Celular Corporativo Vinculado */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Celular Corporativo para o Plantão (Opcional)
                </label>
                <select
                  value={modalDeviceId}
                  onChange={e => setModalDeviceId(e.target.value)}
                  className="w-full py-2.5 px-3 rounded-xl bg-[#000B1D] border border-[#0A2854] text-sm text-white focus:outline-none focus:border-[#0067FC]"
                >
                  <option value="">Sem celular vinculado / Usará aparelho próprio homologado</option>
                  {devices.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.patrimony_tag} — {d.name} ({d.specifications?.phone_number || 'Sem linha'}) [{d.specifications?.mobility_status || 'Disponível'}]
                    </option>
                  ))}
                </select>
              </div>

              {/* Observações da Escala */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Observações / Escopo do Plantão
                </label>
                <textarea
                  rows={2}
                  placeholder="Ex: Plantão extraordinário de final de semana, cobertura de incidentes N1 e suporte a migração de banco."
                  value={modalNotes}
                  onChange={e => setModalNotes(e.target.value)}
                  className="w-full py-2 px-3 rounded-xl bg-[#000B1D] border border-[#0A2854] text-sm text-white focus:outline-none focus:border-[#0067FC]"
                />
              </div>

              {/* Alerta de Conflito em Tempo Real */}
              {conflictWarning && (
                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/40 text-amber-300 flex items-start gap-2.5 text-xs animate-in fade-in">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-amber-200">Aviso Impeditivo de Conflito</strong>
                    <span>{conflictWarning}</span>
                  </div>
                </div>
              )}

              {/* Botões do Modal */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#0A2854]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-[#041838] hover:bg-[#0A2854] text-slate-300 text-sm font-semibold transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting || !!conflictWarning}
                  className={`px-5 py-2.5 rounded-xl text-white text-sm font-semibold transition-all shadow-lg cursor-pointer ${
                    conflictWarning || submitting
                      ? 'bg-slate-700 cursor-not-allowed opacity-60'
                      : 'bg-[#0067FC] hover:bg-[#0052cc] shadow-[#0067FC]/30 active:scale-95'
                  }`}
                >
                  {submitting ? 'Gravando no PostgreSQL...' : 'Salvar Escala no Banco'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: RELATÓRIO OFICIAL DE SOBREAVISO (PDF EM TELA CHEIA / IMPRESSÃO) */}
      {isPdfModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#000B1D]/90 backdrop-blur-md animate-in fade-in overflow-y-auto">
          <div className="bg-[#01122D] border border-[#0A2854] rounded-3xl max-w-4xl w-full p-8 shadow-2xl my-8 relative print:border-none print:shadow-none print:bg-white print:text-black">
            {/* Controles do Topo (não impressos) */}
            <div className="flex items-center justify-between pb-6 mb-6 border-b border-[#0A2854] print:hidden">
              <div className="flex items-center gap-3">
                <FileText className="w-6 h-6 text-[#0067FC]" />
                <h3 className="text-lg font-bold text-white">Visualização Prévia do Documento Oficial</h3>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0067FC] hover:bg-[#0052cc] text-white font-semibold text-sm cursor-pointer shadow-lg shadow-[#0067FC]/30"
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimir / Salvar em PDF</span>
                </button>
                <button
                  onClick={() => setIsPdfModalOpen(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-[#041838] cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* CORPO DO DOCUMENTO OFICIAL GIHS SYSTEM */}
            <div id="pdf-content-area" className="bg-[#000B1D] print:bg-white p-8 rounded-2xl border border-[#0A2854] print:border-none print:p-0">
              {/* Cabeçalho Oficial */}
              <div className="flex items-center justify-between border-b-2 border-[#0067FC] pb-4 mb-6">
                <div>
                  <GIHSLogo variant="system" mode="transparent" height={42} showTagline={true} />
                </div>
                <div className="text-right">
                  <h2 className="text-lg font-black text-white print:text-black uppercase tracking-wider">
                    Relatório de Sobreaviso
                  </h2>
                  <p className="text-xs text-slate-400 print:text-slate-600 font-mono">
                    Período: {pdfPeriodLabel}
                  </p>
                  <p className="text-[11px] text-slate-500 font-mono">
                    Setor Filtrado: {selectedSector === 'ALL' ? 'Todos os Setores Corporativos' : selectedSector}
                  </p>
                </div>
              </div>

              {/* Tabela Formatada para Impressão */}
              <table className="w-full text-left border-collapse text-xs mb-8">
                <thead>
                  <tr className="border-b-2 border-slate-700 print:border-black text-slate-300 print:text-black font-bold uppercase text-[11px]">
                    <th className="py-2.5 px-3">Funcionário</th>
                    <th className="py-2.5 px-3">Setor</th>
                    <th className="py-2.5 px-3">Início</th>
                    <th className="py-2.5 px-3">Fim</th>
                    <th className="py-2.5 px-3">Aparelho</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 print:divide-slate-300 text-slate-200 print:text-black">
                  {filteredShifts.map((shift, idx) => (
                    <tr key={idx} className="hover:bg-slate-900/40 print:hover:bg-transparent">
                      <td className="py-2.5 px-3 font-semibold">{shift.user_name}</td>
                      <td className="py-2.5 px-3">{shift.sector_name}</td>
                      <td className="py-2.5 px-3 font-mono">
                        {new Date(shift.start_at).toLocaleDateString('pt-BR')} {new Date(shift.start_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-2.5 px-3 font-mono">
                        {new Date(shift.end_at).toLocaleDateString('pt-BR')} {new Date(shift.end_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-2.5 px-3 font-mono">
                        {shift.device_tag || 'Próprio'} {shift.device_phone ? `(${shift.device_phone})` : ''}
                      </td>
                      <td className="py-2.5 px-3 font-bold uppercase text-[10px]">
                        {shift.status}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Rodapé Oficial do Documento */}
              <div className="pt-4 border-t border-slate-800 print:border-slate-400 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                <div>
                  <p>Documento gerado pelo GIHS System • Gestão Integrada & Governança Corporativa</p>
                  <p>Fonte de Dados: PostgreSQL 17.6 (gihs_core.on_call_shifts) • Hash de Auditoria Registrado</p>
                </div>
                <div className="text-right">
                  <p>Data/Hora da geração: {new Date().toLocaleString('pt-BR')}</p>
                  <p>Operador: {currentUser.name} ({currentUser.userRole})</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
