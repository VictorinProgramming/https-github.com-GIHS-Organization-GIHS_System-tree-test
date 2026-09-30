import { query } from '../db.js';

export interface TaskRecord {
  id: string;
  title: string;
  description?: string;
  sector: string;
  assignee_id?: string;
  assignee_name: string;
  assignee_avatar?: string;
  priority: 'BAIXA' | 'MEDIA' | 'ALTA' | 'CRITICA';
  status: 'BACKLOG' | 'A_FAZER' | 'EM_ANDAMENTO' | 'EM_REVISAO' | 'CONCLUIDO';
  deadline?: string;
  tag?: string;
  subtasks?: any[];
  is_delayed?: boolean;
  comments_count?: number;
  review_status?: 'NONE' | 'PENDING_VALIDATION' | 'APPROVED' | 'REJECTED';
  reviewed_by?: string;
  reviewed_at?: string;
  leader_notes?: string;
  created_at: string;
  updated_at: string;
}

function normalizePriority(p?: string): 'BAIXA' | 'MEDIA' | 'ALTA' | 'CRITICA' {
  const norm = (p || '').toUpperCase().trim();
  if (norm.includes('CRIT') || norm === 'CRÍTICA') return 'CRITICA';
  if (norm.includes('ALT')) return 'ALTA';
  if (norm.includes('BAIX')) return 'BAIXA';
  return 'MEDIA';
}

function normalizeStatus(s?: string): 'BACKLOG' | 'A_FAZER' | 'EM_ANDAMENTO' | 'EM_REVISAO' | 'CONCLUIDO' {
  const norm = (s || '').toUpperCase().trim();
  if (norm.includes('BACKLOG')) return 'BACKLOG';
  if (norm.includes('REVIS') || norm === 'EM_REVISAO') return 'EM_REVISAO';
  if (norm.includes('ANDAMENTO') || norm === 'EM_ANDAMENTO') return 'EM_ANDAMENTO';
  if (norm.includes('CONCLU') || norm === 'CONCLUIDO') return 'CONCLUIDO';
  return 'A_FAZER';
}

export const tasksRepository = {
  async findAll(): Promise<TaskRecord[]> {
    const res = await query(`
      SELECT 
        id,
        title,
        description,
        sector,
        assignee_id,
        assignee_name,
        assignee_avatar,
        priority,
        status,
        deadline,
        tag,
        subtasks,
        is_delayed,
        comments_count,
        review_status,
        reviewed_by,
        reviewed_at,
        leader_notes,
        created_at,
        updated_at
      FROM tasks
      ORDER BY created_at DESC;
    `);
    return res.rows;
  },

  async findById(id: string): Promise<TaskRecord | null> {
    const res = await query('SELECT * FROM tasks WHERE id = $1;', [id]);
    return res.rows[0] || null;
  },

  async create(task: any): Promise<TaskRecord> {
    const id = task.id || `task-${Date.now()}`;
    const priority = normalizePriority(task.priority);
    const status = normalizeStatus(task.status);
    const reviewStatus = task.review_status || (status === 'EM_REVISAO' ? 'PENDING_VALIDATION' : 'NONE');

    const res = await query(
      `INSERT INTO tasks (
        id, title, description, sector, assignee_id, assignee_name, assignee_avatar, 
        priority, status, deadline, tag, subtasks, is_delayed, comments_count,
        review_status, reviewed_by, reviewed_at, leader_notes, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, NOW(), NOW())
      RETURNING *;`,
      [
        id,
        task.title,
        task.description || '',
        task.sector || 'Geral',
        task.assignee_id || task.assigneeId || null,
        task.assignee_name || task.assigneeName || 'Não atribuído',
        task.assignee_avatar || task.assigneeAvatar || null,
        priority,
        status,
        task.deadline || null,
        task.tag || null,
        JSON.stringify(task.subtasks || []),
        task.is_delayed ?? task.isDelayed ?? false,
        task.comments_count ?? task.commentsCount ?? 0,
        reviewStatus,
        task.reviewed_by || task.reviewedBy || null,
        task.reviewed_at || task.reviewedAt || null,
        task.leader_notes || task.leaderNotes || null
      ]
    );
    return res.rows[0];
  },

  async update(id: string, updates: any): Promise<TaskRecord | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    const allowedCols = [
      'title', 'description', 'sector', 'assignee_id', 'assignee_name', 'assignee_avatar',
      'priority', 'status', 'deadline', 'tag', 'subtasks', 'is_delayed', 'comments_count',
      'review_status', 'reviewed_by', 'reviewed_at', 'leader_notes'
    ];

    // Normalized map
    const mappedUpdates: Record<string, any> = {};
    for (const [k, v] of Object.entries(updates)) {
      if (k === 'assigneeName') mappedUpdates['assignee_name'] = v;
      else if (k === 'assigneeId') mappedUpdates['assignee_id'] = v;
      else if (k === 'assigneeAvatar') mappedUpdates['assignee_avatar'] = v;
      else if (k === 'isDelayed') mappedUpdates['is_delayed'] = v;
      else if (k === 'commentsCount') mappedUpdates['comments_count'] = v;
      else if (k === 'reviewStatus') mappedUpdates['review_status'] = v;
      else if (k === 'reviewedBy') mappedUpdates['reviewed_by'] = v;
      else if (k === 'reviewedAt') mappedUpdates['reviewed_at'] = v;
      else if (k === 'leaderNotes') mappedUpdates['leader_notes'] = v;
      else if (k === 'priority') mappedUpdates['priority'] = normalizePriority(v as string);
      else if (k === 'status') {
        const normStatus = normalizeStatus(v as string);
        mappedUpdates['status'] = normStatus;
        if (normStatus === 'EM_REVISAO' && !updates.review_status && !updates.reviewStatus) {
          mappedUpdates['review_status'] = 'PENDING_VALIDATION';
        }
      }
      else mappedUpdates[k] = v;
    }

    for (const [key, val] of Object.entries(mappedUpdates)) {
      if (allowedCols.includes(key)) {
        fields.push(`${key} = $${idx}`);
        values.push(key === 'subtasks' ? JSON.stringify(val) : val);
        idx++;
      }
    }

    if (fields.length === 0) return this.findById(id);

    fields.push(`updated_at = NOW()`);
    values.push(id);

    const res = await query(
      `UPDATE tasks SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *;`,
      values
    );
    return res.rows[0] || null;
  },

  async delete(id: string): Promise<boolean> {
    const res = await query('DELETE FROM tasks WHERE id = $1;', [id]);
    return (res.rowCount || 0) > 0;
  }
};
