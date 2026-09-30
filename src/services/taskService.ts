import { apiBackendService } from './apiBackendService';
import { Task, TaskStatus, Priority, ActivityRecord } from '../types';

export function mapRowToTask(row: any): Task {
  let subtasks = [];
  try {
    if (typeof row.subtasks === 'string') {
      subtasks = JSON.parse(row.subtasks);
    } else if (Array.isArray(row.subtasks)) {
      subtasks = row.subtasks;
    }
  } catch {
    subtasks = [];
  }

  // Priority mapping
  let priority: Priority = 'Média';
  const pNorm = (row.priority || '').toString().toUpperCase();
  if (pNorm.includes('CRIT') || pNorm === 'CRÍTICA') priority = 'Crítica';
  else if (pNorm.includes('ALT') || pNorm === 'URGENTE') priority = 'Alta';
  else if (pNorm.includes('BAIX')) priority = 'Baixa';

  // Normalize status
  let status: TaskStatus = 'A_FAZER';
  const sNorm = (row.status || '').toString().toUpperCase();
  if (sNorm.includes('BACKLOG')) status = 'BACKLOG';
  else if (sNorm.includes('REVIS') || sNorm === 'EM_REVISAO') status = 'EM_REVISAO';
  else if (sNorm.includes('ANDAMENTO') || sNorm === 'EM_ANDAMENTO') status = 'EM_ANDAMENTO';
  else if (sNorm.includes('CONCLU') || sNorm === 'CONCLUIDO') status = 'CONCLUIDO';

  return {
    id: String(row.id),
    title: row.title || 'Tarefa sem título',
    description: row.description || '',
    sector: row.sector || 'Geral',
    assigneeName: row.assignee_name || row.assigneeName || 'Não atribuído',
    assigneeAvatar: row.assignee_avatar || row.assigneeAvatar,
    priority,
    status,
    deadline: row.deadline || '',
    tag: row.tag || row.sector || 'Geral',
    commentsCount: Number(row.comments_count ?? row.commentsCount ?? 0),
    subtasks,
    isDelayed: Boolean(row.is_delayed ?? row.isDelayed),
    reviewStatus: row.review_status || row.reviewStatus || (status === 'EM_REVISAO' ? 'PENDING_VALIDATION' : 'NONE'),
    reviewedBy: row.reviewed_by || row.reviewedBy,
    reviewedAt: row.reviewed_at || row.reviewedAt,
    leaderNotes: row.leader_notes || row.leaderNotes,
    createdAt: row.created_at || row.createdAt,
    updatedAt: row.updated_at || row.updatedAt,
  };
}

class TaskService {
  private listeners: ((tasks: Task[]) => void)[] = [];

  // Listen to tasks with real-time updates and polling fallback
  public subscribeTasks(callback: (tasks: Task[]) => void): () => void {
    this.listeners.push(callback);
    // Initial fetch from PostgreSQL
    this.getTasks().then(tasks => callback(tasks)).catch(err => {
      console.warn('Initial tasks load warning:', err);
    });

    const handleUpdate = () => {
      this.getTasks().then(tasks => callback(tasks)).catch(() => {});
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('tasks:changed', handleUpdate);
    }

    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
      if (typeof window !== 'undefined') {
        window.removeEventListener('tasks:changed', handleUpdate);
      }
    };
  }

  private notifyChange() {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('tasks:changed'));
    }
  }

  // Fetch all tasks from PostgreSQL
  public async getTasks(): Promise<Task[]> {
    try {
      const res = await apiBackendService.getTasks();
      if (res?.success && Array.isArray(res.data)) {
        return res.data.map(mapRowToTask);
      }
      return [];
    } catch (error) {
      console.warn('Error fetching tasks from PostgreSQL:', error);
      return [];
    }
  }

  // Create task in PostgreSQL
  public async createTask(taskData: Omit<Task, 'id'>): Promise<Task> {
    const taskId = `task-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;

    const payload = {
      id: taskId,
      title: taskData.title,
      description: taskData.description || '',
      sector: taskData.sector,
      assignee_name: taskData.assigneeName || 'Não atribuído',
      assignee_avatar: taskData.assigneeAvatar || null,
      priority: taskData.priority,
      status: taskData.status || 'A_FAZER',
      deadline: taskData.deadline || null,
      tag: taskData.tag || taskData.sector || null,
      subtasks: taskData.subtasks || [],
      is_delayed: taskData.isDelayed || false,
      comments_count: taskData.commentsCount || 0,
      review_status: taskData.status === 'EM_REVISAO' ? 'PENDING_VALIDATION' : 'NONE'
    };

    const res = await apiBackendService.createTask(payload);
    if (!res?.success) {
      throw new Error('Falha ao salvar tarefa no PostgreSQL.');
    }

    const createdTask = mapRowToTask(res.data);
    this.notifyChange();
    return createdTask;
  }

  // Update task in PostgreSQL
  public async updateTask(taskId: string, updates: Partial<Task>): Promise<Task | null> {
    const payload: any = { ...updates };
    if (updates.assigneeName) payload.assignee_name = updates.assigneeName;
    if (updates.assigneeAvatar) payload.assignee_avatar = updates.assigneeAvatar;
    if (updates.isDelayed !== undefined) payload.is_delayed = updates.isDelayed;
    if (updates.commentsCount !== undefined) payload.comments_count = updates.commentsCount;
    if (updates.reviewStatus) payload.review_status = updates.reviewStatus;
    if (updates.reviewedBy) payload.reviewed_by = updates.reviewedBy;
    if (updates.reviewedAt) payload.reviewed_at = updates.reviewedAt;
    if (updates.leaderNotes) payload.leader_notes = updates.leaderNotes;

    const res = await apiBackendService.updateTask(taskId, payload);
    this.notifyChange();
    return res?.data ? mapRowToTask(res.data) : null;
  }

  // Update task status (handles "Em Revisão" and "Concluído" states)
  public async updateTaskStatus(
    taskId: string,
    targetStatus: TaskStatus,
    additionalData?: { reviewStatus?: string; reviewedBy?: string; leaderNotes?: string }
  ): Promise<void> {
    const updates: any = {
      status: targetStatus
    };

    // If moving to "Em Revisão", mark as pending validation for the sector leader
    if (targetStatus === 'EM_REVISAO') {
      updates.review_status = 'PENDING_VALIDATION';
    } else if (targetStatus === 'CONCLUIDO') {
      updates.review_status = 'APPROVED';
      if (additionalData?.reviewedBy) {
        updates.reviewed_by = additionalData.reviewedBy;
        updates.reviewed_at = new Date().toISOString();
      }
    } else {
      updates.review_status = 'NONE';
    }

    if (additionalData?.leaderNotes) {
      updates.leader_notes = additionalData.leaderNotes;
    }

    await apiBackendService.updateTask(taskId, updates);
    this.notifyChange();
  }

  // Leader validates task: sends it automatically to "Concluído"
  public async validateTaskByLeader(
    taskId: string,
    leaderName: string,
    leaderNotes?: string
  ): Promise<Task | null> {
    const updates = {
      status: 'CONCLUIDO',
      review_status: 'APPROVED',
      reviewed_by: leaderName,
      reviewed_at: new Date().toISOString(),
      leader_notes: leaderNotes || 'Validado e homologado pelo Líder do setor'
    };

    const res = await apiBackendService.updateTask(taskId, updates);
    this.notifyChange();
    return res?.data ? mapRowToTask(res.data) : null;
  }

  // Leader rejects task or requests adjustments: moves back to "EM_ANDAMENTO"
  public async requestTaskAdjustments(
    taskId: string,
    leaderName: string,
    adjustmentReason: string
  ): Promise<Task | null> {
    const updates = {
      status: 'EM_ANDAMENTO',
      review_status: 'REJECTED',
      reviewed_by: leaderName,
      reviewed_at: new Date().toISOString(),
      leader_notes: adjustmentReason || 'Ajustes solicitados pelo Líder do setor'
    };

    const res = await apiBackendService.updateTask(taskId, updates);
    this.notifyChange();
    return res?.data ? mapRowToTask(res.data) : null;
  }

  // Delete task from PostgreSQL
  public async deleteTask(taskId: string): Promise<boolean> {
    try {
      const res = await apiBackendService.deleteTask(taskId);
      this.notifyChange();
      return Boolean(res?.success);
    } catch (error) {
      console.warn('Error deleting task in PostgreSQL:', error);
      return false;
    }
  }

  // Backwards compatibility for activities if needed
  public async createActivity(activity: any): Promise<void> {
    try {
      const stored = localStorage.getItem('bycomp_activities');
      const list = stored ? JSON.parse(stored) : [];
      list.unshift({ id: `act-${Date.now()}`, ...activity });
      localStorage.setItem('bycomp_activities', JSON.stringify(list));
    } catch {}
  }

  public subscribeActivities(callback: (activities: ActivityRecord[]) => void): () => void {
    return () => {};
  }
}

export const taskService = new TaskService();
