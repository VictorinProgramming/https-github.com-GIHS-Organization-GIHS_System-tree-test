import { SupportTicket, ActivityRecord, KnowledgeArticle, Collaborator, Sector, Priority } from '../types';
import { KNOWLEDGE_BASE_DATA } from '../data/knowledgeBase';

const STORAGE_KEYS = {
  TICKETS: 'bycomp_tickets_v1',
  ACTIVITIES: 'bycomp_activities_v1',
  KNOWLEDGE_BASE: 'bycomp_knowledge_base_v1'
};

type Listener = () => void;

class ActivitySyncService {
  private tickets: SupportTicket[] = [];
  private activities: ActivityRecord[] = [];
  private knowledgeBase: KnowledgeArticle[] = [];
  private listeners: Set<Listener> = new Set();

  constructor() {
    this.initData();
  }

  private initData() {
    // 1. Tickets: Clean queue - all tickets handled directly in Firebase Firestore / state
    try {
      localStorage.removeItem(STORAGE_KEYS.TICKETS);
      this.tickets = [];
    } catch {
      this.tickets = [];
    }

    // 2. Activities (Base de Atividades / Smart Spreadsheet - strictly clean, synchronized with Firebase)
    try {
      localStorage.removeItem(STORAGE_KEYS.ACTIVITIES);
      this.activities = [];
    } catch {
      this.activities = [];
    }

    // 3. Knowledge Base
    try {
      const storedKB = localStorage.getItem(STORAGE_KEYS.KNOWLEDGE_BASE);
      if (storedKB) {
        this.knowledgeBase = JSON.parse(storedKB);
      } else {
        this.knowledgeBase = [...KNOWLEDGE_BASE_DATA];
        this.saveKB();
      }
    } catch {
      this.knowledgeBase = [...KNOWLEDGE_BASE_DATA];
    }
  }

  private saveTickets() {
    try {
      localStorage.setItem(STORAGE_KEYS.TICKETS, JSON.stringify(this.tickets));
    } catch (e) {
      console.warn('Could not save tickets to localStorage', e);
    }
  }

  private saveActivities() {
    try {
      localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(this.activities));
    } catch (e) {
      console.warn('Could not save activities to localStorage', e);
    }
  }

  private saveKB() {
    try {
      localStorage.setItem(STORAGE_KEYS.KNOWLEDGE_BASE, JSON.stringify(this.knowledgeBase));
    } catch (e) {
      console.warn('Could not save KB to localStorage', e);
    }
  }

  private notify() {
    this.listeners.forEach(fn => {
      try {
        fn();
      } catch (e) {
        console.error('Error in listener', e);
      }
    });
  }

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  // --- TICKETS API ---
  public getTickets(): SupportTicket[] {
    return [...this.tickets];
  }

  public addTicket(ticket: SupportTicket): void {
    const existingIndex = this.tickets.findIndex(t => t.id === ticket.id);
    if (existingIndex >= 0) {
      this.tickets[existingIndex] = ticket;
    } else {
      this.tickets.unshift(ticket);
    }
    this.saveTickets();
    this.notify();
  }

  public clearAllTickets(): void {
    this.tickets = [];
    try {
      localStorage.removeItem(STORAGE_KEYS.TICKETS);
    } catch {
      // ignore
    }
    this.notify();
  }

  public createTicket(params: {
    client: string;
    subject: string;
    sector: Sector;
    priority: Priority;
    description?: string;
    serviceType?: string;
    assignToMe?: boolean;
    currentUser: Collaborator;
  }): SupportTicket {
    const now = new Date();
    const dateStr = now.toLocaleDateString('pt-BR');
    const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    // Generate new ID: extract numbers from existing ticket IDs
    let maxNum = 1088;
    this.tickets.forEach(t => {
      const numMatch = t.id.match(/\d+/);
      if (numMatch) {
        const parsed = parseInt(numMatch[0], 10);
        if (parsed > maxNum) maxNum = parsed;
      }
    });
    const newId = `#${maxNum + 1}`;

    const slaMap: Record<string, string> = {
      'Crítica': '15 min',
      'Urgente': '30 min',
      'Alta': '45 min',
      'Média': '2h 00m',
      'Baixa': '4h 00m'
    };

    const newTicket: SupportTicket = {
      id: newId,
      client: params.client.trim() || 'Interno / GIHS System',
      subject: params.subject.trim(),
      sector: params.sector,
      priority: params.priority,
      status: params.assignToMe ? 'Em atendimento' : 'Aberto',
      assignedTo: params.assignToMe ? params.currentUser.name : undefined,
      assignedAvatar: params.assignToMe ? params.currentUser.avatar : undefined,
      openTime: slaMap[params.priority] || '1h 00m',
      serviceType: params.serviceType || 'Suporte Geral',
      description: params.description,
      history: [
        {
          timestamp: `${dateStr} ${timeStr}`,
          action: 'Chamado aberto no sistema',
          user: params.currentUser.name,
          userSector: params.currentUser.sector,
          details: `Aberto por ${params.currentUser.name} (${params.currentUser.sector}) para a fila do setor [${params.sector}]. Prioridade: ${params.priority}.${params.assignToMe ? ' Atribuído diretamente ao solicitante.' : ' Aguardando triagem técnica do setor.'}`
        }
      ]
    };

    this.tickets.unshift(newTicket);
    this.saveTickets();
    this.notify();
    return newTicket;
  }

  public takeTicket(ticketId: string, currentUser: Collaborator): SupportTicket {
    const ticket = this.tickets.find(t => t.id === ticketId);
    if (!ticket) throw new Error(`Chamado ${ticketId} não encontrado.`);

    const nowStr = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const dateStr = new Date().toLocaleDateString('pt-BR');

    ticket.status = 'Em atendimento';
    ticket.assignedTo = currentUser.name;
    ticket.assignedAvatar = currentUser.avatar;

    const newHistoryItem = {
      timestamp: `${dateStr} ${nowStr}`,
      action: 'Chamado assumido',
      user: currentUser.name,
      userSector: currentUser.sector,
      details: `Atribuído diretamente a ${currentUser.name} (${currentUser.sector}). Status alterado para Em atendimento.`
    };

    ticket.history = [newHistoryItem, ...(ticket.history || [])];

    this.saveTickets();
    this.notify();
    return ticket;
  }

  public transferTicket(params: {
    ticketId: string;
    targetSector: Sector;
    targetServiceClassification?: string;
    targetCollaboratorName?: string;
    observation?: string;
    currentUser: Collaborator;
  }): SupportTicket {
    const ticket = this.tickets.find(t => t.id === params.ticketId);
    if (!ticket) throw new Error(`Chamado ${params.ticketId} não encontrado.`);

    const nowStr = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const dateStr = new Date().toLocaleDateString('pt-BR');
    const oldSector = ticket.sector;
    const oldAssignee = ticket.assignedTo || 'Fila Geral';

    ticket.sector = params.targetSector;
    if (params.targetServiceClassification) {
      ticket.serviceClassification = params.targetServiceClassification;
      (ticket as any).service_classification = params.targetServiceClassification;
    }
    ticket.assignedTo = params.targetCollaboratorName ? params.targetCollaboratorName : undefined;
    ticket.assignedAvatar = undefined;
    if (ticket.status === 'Resolvido') {
      ticket.status = 'Em atendimento';
    }

    const destinationLabel = params.targetCollaboratorName
      ? `${params.targetCollaboratorName} (Grupo: ${params.targetSector})`
      : `Fila Geral do Grupo ${params.targetSector}${params.targetServiceClassification ? ` • ${params.targetServiceClassification}` : ''}`;

    const newHistoryItem = {
      timestamp: `${dateStr} ${nowStr}`,
      action: 'Transferência de chamado',
      user: params.currentUser.name,
      userSector: params.currentUser.sector,
      details: `Transferido de [${oldSector} / ${oldAssignee}] para [${destinationLabel}]. Motivo: ${params.observation || 'Encaminhamento técnico entre setores'}.`
    };

    ticket.history = [newHistoryItem, ...(ticket.history || [])];

    this.saveTickets();
    this.notify();
    return ticket;
  }

  /**
   * Finalize Ticket using Knowledge Base (Fases 5 e 6):
   * Automatically creates:
   * 1. Ticket status = 'Resolvido' with serviceType, resolutionSummary, resolvedBy, resolvedSector, resolvedAt.
   * 2. Activity in Smart Spreadsheet (Base de Atividades) with collaborator and sector.
   * 3. Form Submission in FormsView ("Registro de atividade") with all details.
   * 4. Updates Knowledge Base usage count or adds new article if requested.
   */
  public finalizeTicket(params: {
    ticketId: string;
    ticket?: SupportTicket;
    currentUser: Collaborator;
    serviceType: string;
    resolutionSummary: string;
    timeSpent: string;
    kbArticleId?: string;
    observation?: string;
    saveToKb?: boolean;
    newKbTitle?: string;
    participantCollaborator?: string;
    participantCollaboratorId?: string;
    participantCollaboratorAvatar?: string;
  }): {
    ticket: SupportTicket;
    activity: ActivityRecord;
    participantActivity?: ActivityRecord;
  } {
    let ticket = this.tickets.find(t => t.id === params.ticketId);
    if (!ticket) {
      if (params.ticket) {
        ticket = { ...params.ticket };
        this.tickets.push(ticket);
      } else {
        const fallbackTicket: SupportTicket = {
          id: params.ticketId,
          title: `Chamado #${params.ticketId}`,
          subject: `Chamado #${params.ticketId}`,
          description: params.resolutionSummary,
          client: 'Cliente',
          sector: params.currentUser.sector,
          priority: 'Média',
          status: 'Resolvido',
          openTime: '08:00',
          assignedTo: params.currentUser.name,
          createdAt: new Date().toLocaleDateString('pt-BR'),
          history: []
        };
        ticket = fallbackTicket;
        this.tickets.push(ticket);
      }
    }

    const now = new Date();
    const dateStr = now.toLocaleDateString('pt-BR');
    const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    // 1. Update Ticket
    ticket.status = 'Resolvido';
    ticket.resolvedAt = `${dateStr} ${timeStr}`;
    ticket.resolvedBy = params.currentUser.name;
    ticket.resolvedSector = params.currentUser.sector;
    ticket.serviceType = params.serviceType;
    ticket.resolutionSummary = params.resolutionSummary;
    ticket.resolutionTimeSpent = params.timeSpent || '00h 45m';
    ticket.knowledgeBaseId = params.kbArticleId;

    if (params.participantCollaborator) {
      ticket.participantCollaborator = params.participantCollaborator.trim();
      ticket.participantCollaboratorId = params.participantCollaboratorId;
      ticket.participantCollaboratorAvatar = params.participantCollaboratorAvatar;
      ticket.participantRole = 'Técnico Colaborador no Fechamento';
    }

    const participantNote = params.participantCollaborator
      ? ` Colaboração técnica de ${params.participantCollaborator.trim()} (fechamento contabilizado na Base de Atividades e Excel para ambos).`
      : '';

    const historyItem = {
      timestamp: `${dateStr} ${timeStr}`,
      action: 'Chamado finalizado',
      user: params.currentUser.name,
      userSector: params.currentUser.sector,
      details: `Encerrado com o tipo de serviço "${params.serviceType}". Resumo da solução: ${params.resolutionSummary}. Tempo gasto: ${params.timeSpent || '00h 45m'}.${participantNote} Vinculado ao Registro de Atividades.`
    };
    ticket.history = [historyItem, ...(ticket.history || [])];

    // 2. Increment KB article usage or create new
    if (params.kbArticleId) {
      const kbArticle = this.knowledgeBase.find(k => k.id === params.kbArticleId);
      if (kbArticle) {
        kbArticle.usefulCount = (kbArticle.usefulCount || 0) + 1;
        kbArticle.lastUpdated = dateStr;
      }
    } else if (params.saveToKb && params.newKbTitle) {
      const clientName = ticket.client || 'Cliente';
      const ticketSubject = ticket.subject || ticket.title || 'Chamado Técnico';
      const newArticle: KnowledgeArticle = {
        id: `KB-AUTO-${Date.now().toString().slice(-4)}`,
        code: `RESOLV-${params.currentUser.sector.toUpperCase().slice(0, 3)}-${String(this.knowledgeBase.length + 1).padStart(2, '0')}`,
        title: params.newKbTitle,
        sector: params.currentUser.sector,
        serviceType: params.serviceType,
        category: 'Aplicações & APIs',
        summarySolution: params.resolutionSummary,
        detailedProcedure: [
          `Identificado chamado técnico para cliente ${clientName}: ${ticketSubject}.`,
          `Execução do procedimento técnico: ${params.resolutionSummary}.`,
          `Validação funcional com tempo de resolução de ${params.timeSpent || '00h 45m'}.`
        ],
        estimatedResolutionMinutes: 45,
        tags: [params.serviceType.toLowerCase(), clientName.toLowerCase(), 'resolvido'],
        usefulCount: 1,
        lastUpdated: dateStr,
        author: params.currentUser.name
      };
      this.knowledgeBase.unshift(newArticle);
      ticket.knowledgeBaseId = newArticle.id;
    }

    // 3. Create Activity for Smart Spreadsheet (Base de Atividades)
    const cleanTicketNum = ticket.id.replace(/[^0-9]/g, '') || String(Date.now()).slice(-4);
    const newActivity: ActivityRecord = {
      id: `act-tk-${cleanTicketNum}`,
      date: dateStr,
      time: timeStr,
      collaborator: params.currentUser.name,
      sector: params.currentUser.sector,
      activity: `[Chamado ${ticket.id}] ${ticket.subject || ticket.title || 'Chamado'} — ${params.serviceType}`,
      priority: ticket.priority || 'Média',
      status: 'Concluído',
      timeSpent: params.timeSpent || '00h 45m',
      observation: `Solução: ${params.resolutionSummary}. Cliente: ${ticket.client || 'Cliente'}. Finalizado via Help Desk.`,
      attachment: `laudo-resolucao-${cleanTicketNum}.pdf`
    };

    // Insert at beginning of activities
    this.activities = [newActivity, ...this.activities];

    // Se houve técnico colaborador que auxiliou no fechamento, gera a atividade para ele (computada como fechamento de chamado)
    let participantActivity: ActivityRecord | undefined;
    if (params.participantCollaborator && params.participantCollaborator.trim()) {
      participantActivity = {
        id: `act-tk-${cleanTicketNum}-colab`,
        date: dateStr,
        time: timeStr,
        collaborator: params.participantCollaborator.trim(),
        sector: ticket.sector || params.currentUser.sector,
        activity: `[Chamado ${ticket.id} - Colaboração] ${ticket.subject || ticket.title || 'Chamado'} — ${params.serviceType}`,
        priority: ticket.priority || 'Média',
        status: 'Concluído',
        timeSpent: params.timeSpent || '00h 45m',
        observation: `Colaboração técnica no fechamento com ${params.currentUser.name}. Solução: ${params.resolutionSummary}. Cliente: ${ticket.client || 'Cliente'}. Fechamento computado para ambos os técnicos na Base de Atividades e Excel.`,
        attachment: `laudo-resolucao-${cleanTicketNum}.pdf`
      };
      this.activities = [participantActivity, ...this.activities];
    }

    // Save everything
    this.saveTickets();
    this.saveActivities();
    this.saveKB();

    this.notify();

    return {
      ticket,
      activity: newActivity,
      participantActivity
    };
  }

  // --- ACTIVITIES API ---
  public getActivities(): ActivityRecord[] {
    return [...this.activities];
  }

  public addActivity(activity: ActivityRecord) {
    this.activities = [activity, ...this.activities];
    this.saveActivities();
    this.notify();
  }

  public deleteActivity(activityId: string): void {
    this.activities = this.activities.filter(a => a.id !== activityId);
    this.saveActivities();
    this.notify();
  }

  public purgeNonSystemActivities(validNames: string[]) {
    if (!validNames || validNames.length === 0) return;
    const cleanValid = validNames.map(n => n.trim().toLowerCase());
    this.activities = this.activities.filter(act => {
      const actName = (act.collaborator || '').trim().toLowerCase();
      return cleanValid.includes(actName);
    });
    this.saveActivities();
    this.notify();
  }

  // --- KNOWLEDGE BASE API ---
  public getKnowledgeBase(): KnowledgeArticle[] {
    return [...this.knowledgeBase];
  }

  public addKnowledgeArticle(article: KnowledgeArticle) {
    this.knowledgeBase = [article, ...this.knowledgeBase];
    this.saveKB();
    this.notify();
  }

  // Reset to initial data if needed
  public resetToDefault() {
    localStorage.removeItem(STORAGE_KEYS.TICKETS);
    localStorage.removeItem(STORAGE_KEYS.ACTIVITIES);
    localStorage.removeItem(STORAGE_KEYS.KNOWLEDGE_BASE);
    this.initData();
    this.notify();
  }
}

export const activitySyncService = new ActivitySyncService();
