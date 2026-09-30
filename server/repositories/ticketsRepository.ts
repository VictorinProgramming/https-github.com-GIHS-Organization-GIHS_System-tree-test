import { query } from '../db.js';
import { SupportTicket, Priority } from '../../src/types.js';

export interface TicketRow {
  id: string;
  protocol: string;
  client: string;
  subject: string;
  description?: string;
  sector: string;
  priority: string;
  status: string;
  assigned_to?: string;
  assigned_avatar?: string;
  assigned_user_id?: string;
  requester_name?: string;
  requester_email?: string;
  contact_email?: string;
  open_time?: string;
  sla_hours?: number;
  resolved_at?: string;
  resolved_by?: string;
  resolution_summary?: string;
  created_at: string;
  updated_at: string;
}

export function normalizePriority(p?: string): string {
  if (!p) return 'MEDIA';
  const clean = p.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (clean.includes('BAIXA')) return 'BAIXA';
  if (clean.includes('ALTA')) return 'ALTA';
  if (clean.includes('URG')) return 'URGENTE';
  if (clean.includes('CRIT')) return 'CRITICA';
  return 'MEDIA';
}

export function normalizeStatus(s?: string): string {
  if (!s) return 'ABERTO';
  const clean = s.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (clean.includes('RESOLV') || clean.includes('CONCLU')) return 'RESOLVIDO';
  if (clean.includes('ATEND')) return 'EM_ATENDIMENTO';
  if (clean.includes('AGUARD')) return 'AGUARDANDO_CLIENTE';
  if (clean.includes('CANCEL')) return 'CANCELADO';
  return 'ABERTO';
}

export function mapPriorityToFrontend(p: string): Priority {
  if (p === 'CRITICA') return 'Crítica';
  if (p === 'URGENTE') return 'Urgente';
  if (p === 'ALTA') return 'Alta';
  if (p === 'BAIXA') return 'Baixa';
  return 'Média';
}

export function mapStatusToFrontend(s: string): 'Aberto' | 'Em atendimento' | 'Aguardando' | 'Resolvido' {
  if (s === 'RESOLVIDO') return 'Resolvido';
  if (s === 'EM_ATENDIMENTO') return 'Em atendimento';
  if (s === 'AGUARDANDO_CLIENTE') return 'Aguardando';
  return 'Aberto';
}

export function mapRowToSupportTicket(row: any): SupportTicket {
  return {
    id: row.id,
    protocol: row.protocol,
    client: row.client,
    subject: row.subject,
    title: row.subject,
    description: row.description || '',
    sector: row.sector,
    priority: mapPriorityToFrontend(row.priority),
    status: mapStatusToFrontend(row.status),
    assignedTo: row.assigned_to || undefined,
    assignedAvatar: row.assigned_avatar || undefined,
    requester: row.requester_name || row.client,
    requesterEmail: row.requester_email || row.contact_email || undefined,
    contactEmail: row.contact_email || undefined,
    openTime: row.open_time || (row.created_at ? new Date(row.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '09:00'),
    sla: `${row.sla_hours || 4}h`,
    slaLimitHours: row.sla_hours || 4,
    resolvedAt: row.resolved_at || undefined,
    resolvedBy: row.resolved_by || undefined,
    resolutionSummary: row.resolution_summary || undefined,
    participantCollaborator: row.participant_collaborator || undefined,
    participantCollaboratorId: row.participant_user_id || undefined,
    participantCollaboratorAvatar: row.participant_avatar || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export const ticketsRepository = {
  async findAll(status?: string): Promise<SupportTicket[]> {
    if (status) {
      const normalized = normalizeStatus(status);
      const res = await query<any>(`
        SELECT * FROM tickets
        WHERE status = $1
        ORDER BY created_at DESC;
      `, [normalized]);
      return res.rows.map(mapRowToSupportTicket);
    }
    const res = await query<any>(`
      SELECT * FROM tickets
      ORDER BY created_at DESC;
    `);
    return res.rows.map(mapRowToSupportTicket);
  },

  async findById(id: string): Promise<SupportTicket | null> {
    const res = await query<any>(`
      SELECT * FROM tickets WHERE id = $1 LIMIT 1;
    `, [id]);
    if (!res.rows[0]) return null;
    return mapRowToSupportTicket(res.rows[0]);
  },

  async create(ticket: any): Promise<SupportTicket> {
    const year = new Date().getFullYear();
    const id = ticket.id || `CHM-${year}-${Math.floor(1000 + Math.random() * 9000)}`;
    const protocol = ticket.protocol || `GIHS-${year}-${Math.floor(1000 + Math.random() * 9000)}`;

    const priority = normalizePriority(ticket.priority);
    const status = normalizeStatus(ticket.status);

    let slaHours = ticket.slaLimitHours || ticket.sla_hours || 4;
    if (priority === 'CRITICA') slaHours = 1;
    else if (priority === 'ALTA') slaHours = 2;
    else if (priority === 'BAIXA') slaHours = 8;

    const res = await query<any>(`
      INSERT INTO tickets (
        id, protocol, client, subject, description, sector,
        priority, status, assigned_to, assigned_avatar,
        requester_name, requester_email, contact_email, open_time, sla_hours,
        participant_collaborator, participant_user_id, participant_avatar
      ) VALUES (
        $1, $2, $3, $4, $5, $6,
        $7::enum_ticket_priority, $8::enum_ticket_status, $9, $10,
        $11, $12, $13, $14, $15,
        $16, $17, $18
      )
      RETURNING *;
    `, [
      id,
      protocol,
      ticket.client || ticket.requester || 'Cliente Corporativo',
      ticket.subject || ticket.title || 'Atendimento Geral',
      ticket.description || '',
      ticket.sector || 'N1',
      priority,
      status,
      ticket.assignedTo || ticket.assigned_to || null,
      ticket.assignedAvatar || ticket.assigned_avatar || null,
      ticket.requester || ticket.requester_name || null,
      ticket.requesterEmail || ticket.requester_email || null,
      ticket.contactEmail || ticket.contact_email || null,
      ticket.openTime || ticket.open_time || new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      slaHours,
      ticket.participantCollaborator || ticket.participant_collaborator || null,
      ticket.participantCollaboratorId || ticket.participant_user_id || null,
      ticket.participantCollaboratorAvatar || ticket.participant_avatar || null
    ]);

    // Also record initial history entry if ticket_history table exists
    try {
      await query(`
        INSERT INTO ticket_history (ticket_id, action, user_name, user_sector, details)
        VALUES ($1, $2, $3, $4, $5);
      `, [id, 'ABERTURA', ticket.requester || 'Solicitante', ticket.sector || 'N1', 'Chamado aberto no sistema corporativo']);
    } catch {}

    return mapRowToSupportTicket(res.rows[0]);
  },

  async update(id: string, updates: any): Promise<SupportTicket | null> {
    const keyMap: Record<string, string> = {
      assignedTo: 'assigned_to',
      assignedAvatar: 'assigned_avatar',
      assignedUserId: 'assigned_user_id',
      requesterName: 'requester_name',
      requesterEmail: 'requester_email',
      contactEmail: 'contact_email',
      openTime: 'open_time',
      slaHours: 'sla_hours',
      resolutionSummary: 'resolution_summary',
      resolvedBy: 'resolved_by',
      resolvedAt: 'resolved_at',
      participantCollaborator: 'participant_collaborator',
      participantCollaboratorId: 'participant_user_id',
      participantCollaboratorAvatar: 'participant_avatar'
    };

    const allowedColumns = new Set([
      'client', 'subject', 'description', 'sector', 'priority', 'status',
      'assigned_to', 'assigned_avatar', 'assigned_user_id', 'requester_name',
      'requester_email', 'contact_email', 'open_time', 'sla_hours',
      'resolved_at', 'resolved_by', 'resolution_summary',
      'participant_collaborator', 'participant_user_id', 'participant_avatar'
    ]);

    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    for (const [key, val] of Object.entries(updates)) {
      if (key === 'id' || key === 'created_at' || key === 'updated_at' || key === 'history') continue;
      const col = keyMap[key] || key;
      if (!allowedColumns.has(col)) continue;

      if (col === 'priority') {
        fields.push(`priority = $${idx}::enum_ticket_priority`);
        values.push(normalizePriority(val as string));
      } else if (col === 'status') {
        fields.push(`status = $${idx}::enum_ticket_status`);
        values.push(normalizeStatus(val as string));
      } else {
        fields.push(`${col} = $${idx}`);
        values.push(val);
      }
      idx++;
    }

    if (fields.length === 0) return this.findById(id);

    values.push(id);
    const sql = `
      UPDATE tickets
      SET ${fields.join(', ')}
      WHERE id = $${idx}
      RETURNING *;
    `;

    const res = await query<any>(sql, values);
    if (!res.rows[0]) return null;

    // Record history
    try {
      const action = updates.status ? `STATUS_${updates.status}` : 'ATUALIZACAO';
      await query(`
        INSERT INTO ticket_history (ticket_id, action, user_name, details)
        VALUES ($1, $2, $3, $4);
      `, [id, action, updates.resolvedBy || updates.assignedTo || 'Operador', JSON.stringify(updates)]);
    } catch {}

    return mapRowToSupportTicket(res.rows[0]);
  },

  async delete(id: string): Promise<boolean> {
    const res = await query(`DELETE FROM tickets WHERE id = $1;`, [id]);
    return (res.rowCount ?? 0) > 0;
  },

  async clearAll(): Promise<boolean> {
    await query(`DELETE FROM ticket_history;`).catch(() => {});
    const res = await query(`DELETE FROM tickets;`);
    return (res.rowCount ?? 0) >= 0;
  }
};
