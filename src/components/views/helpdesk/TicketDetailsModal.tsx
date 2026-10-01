import React from 'react';
import {
  X,
  Clock,
  UserCheck,
  Building2,
  Tag,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  History,
  BookOpen,
  ArrowRightLeft,
  Users,
  Handshake,
  Sparkles
} from 'lucide-react';
import { SupportTicket } from '../../../types';

interface TicketDetailsModalProps {
  ticket: SupportTicket;
  onClose: () => void;
  onTakeTicket?: (ticket: SupportTicket) => void;
  onOpenTransfer?: (ticket: SupportTicket) => void;
  onOpenFinalize?: (ticket: SupportTicket) => void;
}

export const TicketDetailsModal: React.FC<TicketDetailsModalProps> = ({
  ticket,
  onClose,
  onTakeTicket,
  onOpenTransfer,
  onOpenFinalize
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-200 bg-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-[#37558d] shadow-xs">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-mono font-bold text-[#37558d] bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-lg">
                  {ticket.id}
                </span>
                <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                  ticket.status === 'Resolvido'
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    : ticket.status === 'Em atendimento'
                      ? 'bg-blue-100 text-blue-800 border border-blue-200'
                      : 'bg-slate-100 text-slate-700 border border-slate-200'
                }`}>
                  {ticket.status}
                </span>
              </div>
              <p className="text-xs text-[#37558d] font-medium mt-0.5">
                Detalhes completos e histórico de auditoria do chamado
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

        {/* Modal Scrollable Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1 bg-white">
          {/* Title & Requester context */}
          <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200 space-y-2">
            <h2 className="text-base font-bold text-[#37558d] leading-snug">
              {ticket.subject || ticket.title}
            </h2>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 font-mono">
              <span className="flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-[#37558d]" />
                <span className="text-slate-700 font-semibold">{ticket.client || ticket.requester}</span>
              </span>
              <span>•</span>
              <span>Setor: <strong className="text-[#37558d]">{ticket.sector}</strong></span>
              {(ticket.serviceClassification || (ticket as any).service_classification) && (
                <>
                  <span>•</span>
                  <span>Fila Técnica: <strong className="text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">{ticket.serviceClassification || (ticket as any).service_classification}</strong></span>
                </>
              )}
              <span>•</span>
              <span>Prioridade: <strong className={
                ticket.priority === 'Crítica' ? 'text-rose-600' :
                ticket.priority === 'Alta' ? 'text-amber-600' : 'text-slate-700'
              }>{ticket.priority}</strong></span>
            </div>

            {ticket.description && (
              <div className="pt-2 border-t border-slate-200 text-xs text-slate-600 leading-relaxed font-sans">
                {ticket.description}
              </div>
            )}
          </div>

          {/* Key Ticket Metrics Box */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-2xl bg-blue-50/50 border border-blue-200/80 text-xs font-mono">
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Responsável:</span>
              <span className="text-[#37558d] font-bold text-xs">
                {ticket.assignedTo || 'Fila Geral do Setor'}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Tempo Aberto / SLA:</span>
              <span className="text-slate-700 font-semibold">{ticket.openTime || ticket.sla || '4 horas'}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Categoria:</span>
              <span className="text-slate-700 font-semibold">{ticket.serviceType || ticket.category || 'Help Desk'}</span>
            </div>
          </div>

          {/* Resolution details if resolved */}
          {ticket.status === 'Resolvido' && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-2 text-xs">
              <div className="flex items-center justify-between text-emerald-800 font-bold">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Chamado Finalizado com Sucesso</span>
                </span>
                <span className="font-mono text-[11px] text-emerald-700">{ticket.resolvedAt || ticket.closedAt}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Tipo de Serviço Executado:</span>
                <span className="text-slate-800 font-bold">{ticket.serviceType || 'Atendimento Help Desk Geral'}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Laudo Técnico & Resumo da Solução:</span>
                <p className="text-slate-800 mt-1 leading-relaxed bg-white p-3 rounded-xl border border-emerald-200 shadow-2xs font-sans">
                  {ticket.resolutionSummary || ticket.resolution || 'Resolução técnica executada com sucesso.'}
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 pt-1 font-mono">
                <span>
                  Resolvido por: <strong className="text-emerald-700">{ticket.resolvedBy || 'Especialista GIHS'}</strong> ({ticket.resolvedSector || ticket.sector})
                </span>
                <span>
                  Tempo gasto: <strong className="text-slate-700">{ticket.resolutionTimeSpent || '00h 45m'}</strong>
                </span>
              </div>

              {ticket.participantCollaborator && (
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-emerald-200 text-xs text-emerald-950 font-sans">
                  <span className="px-2 py-0.5 rounded-md bg-blue-100 border border-blue-300 font-bold text-[#37558d] flex items-center gap-1.5 text-[11px]">
                    <Users className="w-3.5 h-3.5 text-[#37558d]" />
                    Técnico Colaborador (Auxiliou no Fechamento):
                  </span>
                  <span className="font-bold text-slate-900">{ticket.participantCollaborator}</span>
                  <span className="text-[10px] text-blue-700 font-mono italic">(Fechamento computado na Base de Atividades e Excel)</span>
                </div>
              )}
            </div>
          )}

          {/* History / Audit Trail Timeline */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#37558d]">
              <History className="w-3.5 h-3.5 text-[#37558d]" />
              <span>Trilha de Auditoria & Histórico de Movimentações</span>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {(ticket.history && ticket.history.length > 0) ? (
                ticket.history.map((h, i) => (
                  <div key={i} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-[#37558d]">{h.action}</span>
                      <span className="text-slate-400 font-mono">{h.timestamp}</span>
                    </div>
                    <p className="text-slate-700 text-[11px] leading-relaxed font-sans">{h.details}</p>
                    <div className="text-[10px] text-slate-500 font-mono">
                      Operador: {h.user} {h.userSector ? `(${h.userSector})` : ''}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-3 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-slate-200">
                  Nenhum histórico adicional registrado.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="text-[11px] text-slate-500 hidden sm:block">
            Status atual: <strong className="text-slate-800">{ticket.status}</strong>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
            >
              Fechar
            </button>

            {ticket.status !== 'Resolvido' && onTakeTicket && (
              <button
                onClick={() => {
                  onTakeTicket(ticket);
                  onClose();
                }}
                className="px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-[#37558d] text-xs font-bold transition-colors cursor-pointer"
              >
                Assumir
              </button>
            )}

            {ticket.status !== 'Resolvido' && onOpenTransfer && (
              <button
                onClick={() => {
                  onClose();
                  onOpenTransfer(ticket);
                }}
                className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
              >
                Transferir
              </button>
            )}

            {ticket.status !== 'Resolvido' && onOpenFinalize && (
              <button
                onClick={() => {
                  onClose();
                  onOpenFinalize(ticket);
                }}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-md shadow-emerald-600/20 cursor-pointer"
              >
                Finalizar Chamado
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
