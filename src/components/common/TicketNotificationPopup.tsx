import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  LifeBuoy,
  X,
  ArrowRight,
  Tag,
  Clock,
  Building2,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  BellRing,
  RotateCw
} from 'lucide-react';
import { SupportTicket, ViewScreen, Collaborator } from '../../types';
import { ticketService } from '../../services/ticketService';

interface TicketNotificationPopupProps {
  onNavigate?: (screen: ViewScreen) => void;
  currentUser?: Collaborator;
  activeTicket?: SupportTicket | null;
  onClose?: () => void;
}

export const TicketNotificationPopup: React.FC<TicketNotificationPopupProps> = ({
  onNavigate,
  currentUser,
  activeTicket,
  onClose
}) => {
  // List of tickets that are open and haven't been assumed yet
  const [unassumedTickets, setUnassumedTickets] = useState<SupportTicket[]>([]);
  const [currentDisplayIndex, setCurrentDisplayIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [isRecurringAlert, setIsRecurringAlert] = useState(false);
  const [isAssuming, setIsAssuming] = useState(false);
  const [successAssumedMsg, setSuccessAssumedMsg] = useState<string | null>(null);

  // Interval in ms for recurring reminder (2 minutes = 120,000 ms)
  const TWO_MINUTES_MS = 2 * 60 * 1000;
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Helper: normalize sector
  const normalizeSector = useCallback((sector?: string): string => {
    const s = (sector || '').toLowerCase().trim();
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
    return sector || 'N1';
  }, []);

  // Helper: check if currentUser is eligible to see/receive alerts for this ticket
  const isUserEligibleForTicket = useCallback((ticket: SupportTicket): boolean => {
    if (!currentUser) return true;
    const role = currentUser.userRole;
    const sec = (currentUser.sector || '').toLowerCase();
    const isGlobal =
      role === 'SUPER_ADMIN' ||
      role === 'ADMINISTRATIVO' ||
      sec.includes('gest') ||
      sec.includes('admin');

    // Global managers/directors see all queues
    if (isGlobal) return true;

    // Standard sector operators only receive alerts for their own sector
    const ticketNormSector = normalizeSector(ticket.sector);
    const userNormSector = normalizeSector(currentUser.sector);
    return ticketNormSector === userNormSector;
  }, [currentUser, normalizeSector]);

  // Helper: check if a ticket is unassumed
  const isTicketUnassumed = useCallback((ticket: SupportTicket): boolean => {
    const isStatusOpen = !ticket.status || ticket.status === 'Aberto';
    const hasNoAssignee = !ticket.assignedTo || ticket.assignedTo.trim() === '';
    return isStatusOpen && hasNoAssignee;
  }, []);

  // Sync with prop if provided directly
  useEffect(() => {
    if (activeTicket && isTicketUnassumed(activeTicket) && isUserEligibleForTicket(activeTicket)) {
      setUnassumedTickets(prev => {
        const exists = prev.some(t => t.id === activeTicket.id);
        if (exists) return prev;
        return [activeTicket, ...prev];
      });
      setCurrentDisplayIndex(0);
      setIsRecurringAlert(false);
      setIsVisible(true);
    }
  }, [activeTicket, isTicketUnassumed, isUserEligibleForTicket]);

  // Handler when a new ticket is created in the system
  useEffect(() => {
    const handleTicketCreated = (e: Event) => {
      const customEvent = e as CustomEvent<SupportTicket>;
      const newTicket = customEvent.detail;
      if (newTicket && isTicketUnassumed(newTicket) && isUserEligibleForTicket(newTicket)) {
        setUnassumedTickets(prev => {
          const filtered = prev.filter(t => t.id !== newTicket.id);
          return [newTicket, ...filtered];
        });
        setCurrentDisplayIndex(0);
        setIsRecurringAlert(false);
        setSuccessAssumedMsg(null);
        setIsVisible(true);
      }
    };

    const handleTicketUpdated = (e: Event) => {
      const customEvent = e as CustomEvent<{ id: string; updates: Partial<SupportTicket> }>;
      const { id, updates } = customEvent.detail || {};
      if (!id) return;

      // If the ticket was assigned or resolved, remove it from unassumed tickets
      const isAssigned = updates?.assignedTo && updates.assignedTo.trim().length > 0;
      const isStatusChanged = updates?.status && updates.status !== 'Aberto';

      if (isAssigned || isStatusChanged) {
        setUnassumedTickets(prev => {
          const updatedList = prev.filter(t => t.id !== id);
          if (updatedList.length === 0) {
            setIsVisible(false);
          }
          return updatedList;
        });
      }
    };

    const handleTicketsCleared = () => {
      setUnassumedTickets([]);
      setIsVisible(false);
    };

    window.addEventListener('ticket:created', handleTicketCreated);
    window.addEventListener('ticket:updated', handleTicketUpdated);
    window.addEventListener('ticket:cleared', handleTicketsCleared);

    return () => {
      window.removeEventListener('ticket:created', handleTicketCreated);
      window.removeEventListener('ticket:updated', handleTicketUpdated);
      window.removeEventListener('ticket:cleared', handleTicketsCleared);
    };
  }, [isTicketUnassumed, isUserEligibleForTicket]);

  // Recurring check every 2 minutes: if tickets remain unassumed, trigger alert
  useEffect(() => {
    const triggerRecurringCheck = async () => {
      try {
        // Fetch fresh open tickets from database
        const openTickets = await ticketService.getTickets('Aberto');
        const pending = openTickets.filter(t => isTicketUnassumed(t) && isUserEligibleForTicket(t));

        if (pending.length > 0) {
          setUnassumedTickets(pending);
          setCurrentDisplayIndex(0);
          setIsRecurringAlert(true); // Flag as recurring reminder
          setSuccessAssumedMsg(null);
          setIsVisible(true); // Pop-up surfaces on screen every 2 minutes!
        } else {
          setUnassumedTickets([]);
          setIsVisible(false);
        }
      } catch (err) {
        console.warn('Error in 2-min recurring ticket alert check:', err);
      }
    };

    // Run the recurring check every 2 minutes (120,000 ms)
    intervalRef.current = setInterval(triggerRecurringCheck, TWO_MINUTES_MS);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [TWO_MINUTES_MS, isTicketUnassumed, isUserEligibleForTicket]);

  // Auto-dismiss visible popup after 12 seconds so it doesn't block the screen indefinitely,
  // BUT the 2-minute recurring interval remains active to alert again!
  useEffect(() => {
    if (!isVisible || successAssumedMsg) return;

    const timer = setTimeout(() => {
      setIsVisible(false);
      if (onClose) onClose();
    }, 12000);

    return () => clearTimeout(timer);
  }, [isVisible, unassumedTickets, onClose, successAssumedMsg]);

  if (!isVisible || unassumedTickets.length === 0) return null;

  const currentTicket = unassumedTickets[currentDisplayIndex] || unassumedTickets[0];
  if (!currentTicket) return null;

  const ticketNumber = currentTicket.id || currentTicket.protocol || 'CHM-NOVO';
  const serviceTheme = currentTicket.serviceType || currentTicket.category || 'Atendimento Técnico Especializado';
  const subject = currentTicket.subject || currentTicket.title || 'Solicitação de Suporte';
  const requester = currentTicket.client || currentTicket.requester || 'Cliente Corporativo';
  const sector = currentTicket.sector || 'N1';
  const priority = currentTicket.priority || 'Média';

  const handleDismiss = () => {
    setIsVisible(false);
    if (onClose) onClose();
  };

  const handleOpenTicket = () => {
    setIsVisible(false);
    if (onClose) onClose();
    if (onNavigate) {
      onNavigate('chamados');
    }
  };

  // Direct action: assume ticket right from the pop-up
  const handleAssumeTicket = async () => {
    if (!currentUser) {
      handleOpenTicket();
      return;
    }

    setIsAssuming(true);
    try {
      await ticketService.updateTicket(currentTicket.id, {
        assignedTo: currentUser.name,
        assignedAvatar: currentUser.avatar,
        status: 'Em atendimento'
      });

      setSuccessAssumedMsg(`✓ Você assumiu o chamado ${ticketNumber}!`);

      // Remove from unassumed list
      setUnassumedTickets(prev => prev.filter(t => t.id !== currentTicket.id));

      setTimeout(() => {
        setIsVisible(false);
        setSuccessAssumedMsg(null);
        if (onClose) onClose();
      }, 3000);
    } catch (err) {
      console.error('Error assuming ticket from popup:', err);
    } finally {
      setIsAssuming(false);
    }
  };

  const handleNextTicket = () => {
    setCurrentDisplayIndex(prev => (prev + 1) % unassumedTickets.length);
  };

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="fixed bottom-6 right-6 z-[9999] max-w-sm sm:max-w-md w-full animate-in slide-in-from-bottom-5 fade-in duration-300 pointer-events-auto"
    >
      <div className={`bg-white rounded-2xl border-2 shadow-2xl shadow-slate-900/25 overflow-hidden text-slate-800 transition-all ${
        isRecurringAlert ? 'border-amber-400 ring-4 ring-amber-400/20' : 'border-[#37558d]/40'
      }`}>
        {/* Header Superior da Notificação */}
        <div className={`px-4 py-3 flex items-center justify-between text-white transition-colors ${
          isRecurringAlert
            ? 'bg-gradient-to-r from-amber-600 via-orange-600 to-rose-600'
            : 'bg-[#37558d]'
        }`}>
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                isRecurringAlert ? 'bg-amber-200' : 'bg-emerald-400'
              }`}></span>
              <span className={`relative inline-flex rounded-full h-3 w-3 ${
                isRecurringAlert ? 'bg-amber-300' : 'bg-emerald-400'
              }`}></span>
            </span>

            {isRecurringAlert ? (
              <BellRing className="w-4 h-4 text-white animate-bounce" />
            ) : (
              <LifeBuoy className="w-4 h-4 text-white" />
            )}

            <div className="flex flex-col">
              <span className="text-xs font-black tracking-wide uppercase text-white leading-none">
                {isRecurringAlert ? 'Chamado Não Assumido!' : 'Novo Chamado Criado'}
              </span>
              {isRecurringAlert && (
                <span className="text-[10px] text-amber-100 font-medium leading-tight mt-0.5">
                  Aviso recorrente (a cada 2 min)
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {unassumedTickets.length > 1 && (
              <button
                type="button"
                onClick={handleNextTicket}
                className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors cursor-pointer"
                title="Ver próximo chamado sem atendimento"
              >
                {currentDisplayIndex + 1}/{unassumedTickets.length} ↻
              </button>
            )}

            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-white/20 text-white">
              {sector}
            </span>

            <button
              type="button"
              onClick={handleDismiss}
              className="p-1 rounded-lg hover:bg-white/20 text-white/80 hover:text-white transition-colors cursor-pointer"
              title="Fechar aviso (lembrará em 2 min se continuar pendente)"
              aria-label="Fechar aviso"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mensagem de confirmação após assumir */}
        {successAssumedMsg ? (
          <div className="p-5 text-center bg-emerald-50 text-emerald-900 animate-in fade-in">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
            <p className="text-sm font-black">{successAssumedMsg}</p>
            <p className="text-xs text-emerald-700 mt-1">
              O alerta de 2 em 2 minutos foi finalizado para este chamado.
            </p>
          </div>
        ) : (
          /* Corpo do Pop-up */
          <div className="p-4 space-y-3">
            {/* Aviso de status não assumido quando recorrente */}
            {isRecurringAlert && (
              <div className="flex items-center gap-2 p-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span className="font-semibold text-[11px]">
                  Este chamado ainda não foi assumido por nenhum operador.
                </span>
              </div>
            )}

            {/* Número do Chamado em Destaque */}
            <div className="flex items-center justify-between bg-slate-50 border border-slate-200 p-2.5 rounded-xl">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Número do Chamado:
                </span>
              </div>
              <span className="font-mono text-sm font-black text-[#37558d] bg-blue-50 px-2.5 py-0.5 rounded-lg border border-blue-200">
                {ticketNumber}
              </span>
            </div>

            {/* Tema do Serviço que deverá ser realizado */}
            <div className="bg-blue-50/70 border border-blue-200/90 rounded-xl p-3">
              <div className="flex items-center gap-1.5 mb-1 text-[#37558d]">
                <Tag className="w-3.5 h-3.5 shrink-0 text-[#37558d]" />
                <span className="text-[11px] font-black uppercase tracking-wider">
                  Tema do Serviço a Realizar:
                </span>
              </div>
              <p className="text-xs font-bold text-slate-900 leading-snug">
                {serviceTheme}
              </p>
            </div>

            {/* Detalhes Adicionais: Assunto e Solicitante */}
            <div className="space-y-1.5 text-xs">
              <div className="flex items-start gap-1.5">
                <span className="font-bold text-slate-600 shrink-0">Assunto:</span>
                <span className="text-slate-800 font-medium truncate">{subject}</span>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                <span className="flex items-center gap-1 truncate">
                  <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                  <strong className="text-slate-700">{requester}</strong>
                </span>
                <span className="flex items-center gap-1 font-semibold text-[#37558d]">
                  <Clock className="w-3 h-3" />
                  Prioridade: {priority}
                </span>
              </div>
            </div>

            {/* Ações Inferiores com botão Assumir Chamado */}
            <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={handleDismiss}
                className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                title="Dispensar por enquanto (relembrará em 2 min se continuar em aberto)"
              >
                Dispensar
              </button>

              <div className="flex items-center gap-2">
                {/* Botão de Assumir Chamado Imediatamente */}
                <button
                  type="button"
                  onClick={handleAssumeTicket}
                  disabled={isAssuming}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer disabled:opacity-50"
                  title="Assumir este chamado imediatamente"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>{isAssuming ? 'Assumindo...' : 'Assumir Agora'}</span>
                </button>

                {onNavigate && (
                  <button
                    type="button"
                    onClick={handleOpenTicket}
                    className="px-3 py-1.5 rounded-xl bg-[#37558d] hover:bg-[#2c4471] text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                    title="Abrir painel de chamados"
                  >
                    <span>Ver Fila</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Barra de Tempo de Exibição com indicador de 2 minutos */}
        <div className="w-full bg-slate-100 h-1 overflow-hidden">
          <div className="bg-[#37558d] h-full animate-[shrink_12s_linear_forwards] origin-left"></div>
        </div>
      </div>
    </div>
  );
};
