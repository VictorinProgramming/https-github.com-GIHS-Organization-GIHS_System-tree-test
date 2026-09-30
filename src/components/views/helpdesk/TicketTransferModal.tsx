import React, { useState, useMemo, useEffect } from 'react';
import {
  ArrowRightLeft,
  X,
  Building2,
  User,
  FileText,
  Check,
  ChevronRight
} from 'lucide-react';
import { SupportTicket, Sector, Collaborator } from '../../../types';
import { dbService } from '../../../services/dbService';
import { activitySyncService } from '../../../services/activitySyncService';

interface TicketTransferModalProps {
  ticket: SupportTicket;
  currentUser: Collaborator;
  onClose: () => void;
  onSuccess: (ticket: SupportTicket, msg: string) => void;
}

const SECTOR_OPTIONS: { id: Sector; name: string }[] = [
  { id: 'N1', name: 'Suporte N1 (Atendimento Geral & Acessos)' },
  { id: 'N2', name: 'Suporte N2 (Hardware, Redes & Diagnóstico)' },
  { id: 'N3', name: 'Suporte N3 (Infraestrutura & Alta Complexidade)' },
  { id: 'Patrimônio', name: 'Patrimônio & Gestão de Ativos / Etiquetas' },
  { id: 'DBA', name: 'DBA & Banco de Dados' },
  { id: 'Cyber Security', name: 'Cyber Security & Segurança da Informação' },
  { id: 'Back-End', name: 'Engenharia Back-End' },
  { id: 'Front-End', name: 'Engenharia Front-End' },
  { id: 'Administrativo', name: 'Administrativo & Operações' }
];

export const TicketTransferModal: React.FC<TicketTransferModalProps> = ({
  ticket,
  currentUser,
  onClose,
  onSuccess
}) => {
  const [targetSector, setTargetSector] = useState<Sector>(() => {
    const nextSec = SECTOR_OPTIONS.find(s => s.id !== ticket.sector);
    return nextSec ? nextSec.id : 'N2';
  });

  const [transferMode, setTransferMode] = useState<'group_queue' | 'specific_collaborator'>('group_queue');
  const [selectedCollaboratorName, setSelectedCollaboratorName] = useState<string>('');
  const [observation, setObservation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dbUsers, setDbUsers] = useState<Collaborator[]>([]);

  useEffect(() => {
    const unsub = dbService.subscribeUsers((users) => {
      setDbUsers(users);
    });
    return () => unsub();
  }, []);

  // List of collaborators filtered by destination sector
  const sectorCollaborators = useMemo(() => {
    const normalize = (sec: string) => {
      const s = (sec || '').toLowerCase();
      if (s.includes('n1')) return 'n1';
      if (s.includes('n2')) return 'n2';
      if (s.includes('n3')) return 'n3';
      if (s.includes('front')) return 'front-end';
      if (s.includes('back')) return 'back-end';
      if (s.includes('dba') || s.includes('dado')) return 'dba';
      if (s.includes('cyber') || s.includes('seguran')) return 'cyber security';
      if (s.includes('admin')) return 'administrativo';
      if (s.includes('rh')) return 'rh';
      if (s.includes('finan')) return 'financeiro';
      if (s.includes('gest')) return 'gestão';
      if (s.includes('patrim')) return 'patrimônio';
      return s;
    };

    const targetNorm = normalize(targetSector);
    const list = dbUsers.filter(c => normalize(c.sector) === targetNorm);

    return list.length > 0 ? list : dbUsers;
  }, [targetSector, dbUsers]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const updated = activitySyncService.transferTicket({
        ticketId: ticket.id,
        targetSector,
        targetCollaboratorName: transferMode === 'specific_collaborator' && selectedCollaboratorName ? selectedCollaboratorName : undefined,
        observation: observation.trim() || 'Encaminhamento técnico operacional entre setores',
        currentUser
      });

      const destText = transferMode === 'specific_collaborator' && selectedCollaboratorName
        ? `${selectedCollaboratorName} (${targetSector})`
        : `Fila Geral do Grupo ${targetSector}`;

      onSuccess(updated, `✓ Chamado ${ticket.id} transferido com sucesso para ${destText}.`);
    } catch (err) {
      console.error(err);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-200 bg-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-[#37558d] shadow-xs">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-900">
                  Transferir Chamado
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-50 text-[#37558d] border border-blue-200">
                  {ticket.id}
                </span>
              </div>
              <p className="text-xs text-[#37558d] font-medium mt-0.5">
                Encaminhamento para fila de outro setor ou colaborador específico
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1 bg-white">
          {/* Current Ticket Details Box */}
          <div className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200 space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-600 font-medium">
                Cliente: <strong className="text-slate-900">{ticket.client}</strong>
              </span>
              <span className="px-2 py-0.5 rounded-lg bg-blue-50 border border-blue-200 text-[#37558d] font-mono font-semibold">
                Setor Atual: {ticket.sector}
              </span>
            </div>
            <p className="font-bold text-[#37558d] text-sm line-clamp-1">
              {ticket.subject || ticket.title}
            </p>
            {ticket.assignedTo && (
              <p className="text-[11px] text-slate-500 font-mono">
                Responsável atual: <strong className="text-[#37558d]">{ticket.assignedTo}</strong>
              </p>
            )}
          </div>

          {/* Target Sector Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-[#37558d]" />
              <span>Grupo de Serviço de Destino (Setor) *</span>
            </label>
            <select
              value={targetSector}
              onChange={(e) => {
                setTargetSector(e.target.value as Sector);
                setSelectedCollaboratorName('');
              }}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-[#37558d] focus:ring-1 focus:ring-[#37558d] transition-all font-sans"
            >
              {SECTOR_OPTIONS.map(sec => (
                <option key={sec.id} value={sec.id} disabled={sec.id === ticket.sector}>
                  {sec.name} {sec.id === ticket.sector ? '(Setor Atual)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Transfer Mode */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Tipo de Encaminhamento
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setTransferMode('group_queue')}
                className={`p-3 rounded-2xl border text-left text-xs transition-all flex items-center gap-2 cursor-pointer ${
                  transferMode === 'group_queue'
                    ? 'bg-blue-50/70 border-[#37558d] text-[#37558d] shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Building2 className="w-4 h-4 text-[#37558d] shrink-0" />
                <div>
                  <div className="font-bold">Fila Geral do Setor</div>
                  <div className="text-[10px] text-slate-500">Qualquer técnico disponível</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setTransferMode('specific_collaborator')}
                className={`p-3 rounded-2xl border text-left text-xs transition-all flex items-center gap-2 cursor-pointer ${
                  transferMode === 'specific_collaborator'
                    ? 'bg-blue-50/70 border-[#37558d] text-[#37558d] shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <User className="w-4 h-4 text-[#37558d] shrink-0" />
                <div>
                  <div className="font-bold">Colaborador Específico</div>
                  <div className="text-[10px] text-slate-500">Direcionar para uma pessoa</div>
                </div>
              </button>
            </div>
          </div>

          {/* Specific Collaborator Dropdown */}
          {transferMode === 'specific_collaborator' && (
            <div className="p-3.5 bg-blue-50/50 border border-blue-200 rounded-2xl space-y-1.5 animate-in fade-in duration-150">
              <label className="block text-xs font-semibold text-[#37558d]">
                Selecione o Colaborador do Grupo {targetSector} *
              </label>
              <select
                value={selectedCollaboratorName}
                onChange={(e) => setSelectedCollaboratorName(e.target.value)}
                required={transferMode === 'specific_collaborator'}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-[#37558d]"
              >
                <option value="">Selecione um colaborador do setor...</option>
                {sectorCollaborators.map(c => (
                  <option key={c.id} value={c.name}>
                    {c.name} — {c.role}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Observation */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-[#37558d]" />
              <span>Nota Técnica / Motivo da Transferência</span>
            </label>
            <textarea
              value={observation}
              onChange={(e) => setObservation(e.target.value)}
              placeholder="Ex: Escalonamento para análise avançada de infraestrutura de rede, necessita de privilégios de firewall..."
              rows={3}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#37558d] focus:ring-1 focus:ring-[#37558d] transition-all resize-none"
            />
          </div>
        </form>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="text-[11px] text-slate-500 hidden sm:block">
            Origem: <strong className="text-slate-800">{ticket.sector}</strong> → Destino: <strong className="text-slate-800">{targetSector}</strong>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={isSubmitting || (transferMode === 'specific_collaborator' && !selectedCollaboratorName)}
              onClick={handleSubmit}
              className="px-5 py-2.5 bg-[#334b84] hover:bg-[#37558d] disabled:opacity-50 text-white font-bold rounded-xl text-xs shadow-md shadow-[#334b84]/20 flex items-center gap-2 transition-all cursor-pointer"
            >
              <Check className="w-4 h-4 text-white" />
              <span className="text-white">
                {isSubmitting ? 'Transferindo...' : 'Confirmar Transferência'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
