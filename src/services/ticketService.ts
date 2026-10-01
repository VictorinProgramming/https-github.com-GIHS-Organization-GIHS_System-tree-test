import { apiBackendService } from './apiBackendService';
import { SupportTicket, Priority } from '../types';

export interface TicketValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateTicketData(ticket: Partial<SupportTicket>): TicketValidationResult {
  const errors: string[] = [];
  const title = ticket.subject || ticket.title;
  const requester = ticket.client || ticket.requester;

  if (!title || title.trim().length < 4) {
    errors.push('O título ou assunto do chamado deve conter pelo menos 4 caracteres.');
  }

  if (!ticket.sector || (typeof ticket.sector === 'string' && ticket.sector.trim().length === 0)) {
    errors.push('Selecione o setor de destino responsável pelo chamado.');
  }

  if (!ticket.priority) {
    errors.push('Defina a prioridade do chamado (Baixa, Média, Alta, Urgente ou Crítica).');
  }

  if (!requester || requester.trim().length < 2) {
    errors.push('Identificação do solicitante / cliente é obrigatória.');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

class TicketService {
  // Listen to tickets in real-time backed by PostgreSQL
  public subscribeTickets(callback: (tickets: SupportTicket[]) => void): () => void {
    let isSubscribed = true;

    const fetchTickets = async () => {
      try {
        const res = await apiBackendService.getTickets();
        if (isSubscribed && res?.success && Array.isArray(res.data)) {
          callback(res.data);
        }
      } catch (err) {
        console.warn('PostgreSQL tickets polling warning:', err);
      }
    };

    // Immediate fetch
    fetchTickets();

    // Poll every 4 seconds to simulate real-time updates without Firestore
    const interval = setInterval(fetchTickets, 4000);

    return () => {
      isSubscribed = false;
      clearInterval(interval);
    };
  }

  // Get all tickets from PostgreSQL
  public async getTickets(status?: string): Promise<SupportTicket[]> {
    try {
      const res = await apiBackendService.getTickets(status);
      return res?.success && Array.isArray(res.data) ? res.data : [];
    } catch (err) {
      console.warn('Error fetching tickets from PostgreSQL:', err);
      return [];
    }
  }

  // Create ticket in PostgreSQL
  public async createTicket(
    data: Omit<SupportTicket, 'id' | 'openTime'> & { openTime?: string }
  ): Promise<SupportTicket> {
    const validation = validateTicketData(data);
    if (!validation.valid) {
      throw new Error(`Validação do chamado falhou: ${validation.errors.join(' | ')}`);
    }

    const year = new Date().getFullYear();
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const ticketId = `CHM-${year}-${randomSuffix}`;
    const formattedDate = new Date().toLocaleDateString('pt-BR');
    const formattedTime = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    let slaHours = 4;
    if (data.priority === 'Crítica') slaHours = 1;
    else if (data.priority === 'Alta') slaHours = 2;
    else if (data.priority === 'Baixa') slaHours = 8;

    const title = (data.subject || data.title || '').trim();
    const client = (data.client || data.requester || '').trim();

    const payload: Partial<SupportTicket> = {
      id: ticketId,
      title,
      subject: title,
      client,
      requester: client,
      description: data.description || '',
      category: data.category || data.serviceType || 'Suporte Técnico',
      serviceType: data.serviceType || data.category || 'Suporte Técnico',
      sector: data.sector,
      serviceClassification: data.serviceClassification || data.service_classification || 'Suporte',
      service_classification: data.service_classification || data.serviceClassification || 'Suporte',
      priority: data.priority,
      status: data.status || 'Aberto',
      requesterEmail: data.requesterEmail || data.contactEmail || 'colaborador@bycomp.com.br',
      contactEmail: data.contactEmail || data.requesterEmail || 'colaborador@bycomp.com.br',
      assignedTo: data.assignedTo || undefined,
      assignedAvatar: data.assignedAvatar || undefined,
      participantCollaborator: data.participantCollaborator || undefined,
      participantCollaboratorId: data.participantCollaboratorId || undefined,
      participantCollaboratorAvatar: data.participantCollaboratorAvatar || undefined,
      participantRole: data.participantRole || undefined,
      openTime: data.openTime || `${formattedDate} às ${formattedTime}`,
      slaLimitHours: slaHours
    };

    const res = await apiBackendService.createTicket(payload);
    if (!res?.success) {
      throw new Error('Falha ao salvar chamado no banco de dados.');
    }

    const createdTicket: SupportTicket = {
      ...payload,
      ...(res.data || {}),
      serviceType: data.serviceType || data.category || 'Atendimento Especializado',
      category: data.category || data.serviceType || 'Atendimento Especializado'
    } as SupportTicket;

    // Dispatch global event for bottom-right pop-up notification
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('ticket:created', { detail: createdTicket }));
    }

    return createdTicket;
  }

  // Update Ticket in PostgreSQL
  public async updateTicket(ticketId: string, updates: Partial<SupportTicket>): Promise<void> {
    try {
      await apiBackendService.updateTicket(ticketId, updates);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('ticket:updated', { detail: { id: ticketId, updates } }));
      }
    } catch (err) {
      console.warn('Error updating ticket in PostgreSQL:', err);
    }
  }

  // Transfer Ticket in PostgreSQL
  public async transferTicket(
    ticketId: string,
    targetSector: string,
    reason: string,
    transferredBy: string,
    newAssignee?: string
  ): Promise<void> {
    try {
      await apiBackendService.updateTicket(ticketId, {
        sector: targetSector as any,
        status: 'Aberto',
        assignedTo: newAssignee || undefined
      });
    } catch (error) {
      console.warn('Error transferring ticket in PostgreSQL:', error);
    }
  }

  // Finalize Ticket in PostgreSQL
  public async finalizeTicket(
    ticketId: string,
    resolution: string,
    resolvedBy: string,
    timeSpent?: string,
    participantCollaborator?: string,
    participantCollaboratorAvatar?: string
  ): Promise<void> {
    try {
      await apiBackendService.updateTicket(ticketId, {
        status: 'Resolvido',
        resolutionSummary: resolution,
        resolvedBy,
        resolutionTimeSpent: timeSpent || '30m',
        resolvedAt: new Date().toISOString(),
        participantCollaborator: participantCollaborator || undefined,
        participantCollaboratorAvatar: participantCollaboratorAvatar || undefined
      });
    } catch (error) {
      console.warn('Error finalizing ticket in PostgreSQL:', error);
    }
  }

  // Delete ticket in PostgreSQL
  public async deleteTicket(ticketId: string): Promise<void> {
    try {
      await apiBackendService.deleteTicket(ticketId);
    } catch (error) {
      console.warn('Error deleting ticket in PostgreSQL:', error);
    }
  }

  // Clear all tickets in PostgreSQL
  public async clearAllTickets(): Promise<void> {
    try {
      await apiBackendService.clearTickets();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('ticket:cleared'));
      }
    } catch (error) {
      console.warn('Error clearing tickets in PostgreSQL:', error);
    }
  }
}

export const ticketService = new TicketService();
