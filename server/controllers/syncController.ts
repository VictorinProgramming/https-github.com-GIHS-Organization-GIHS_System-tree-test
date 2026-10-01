import { Request, Response } from 'express';
import { query, checkDatabaseConnection } from '../db.js';

interface SyncPayload {
  users?: any[];
  sectors?: any[];
  pontoRecords?: any[];
  tickets?: any[];
  equipment?: any[];
}

export const syncController = {
  /**
   * Migrate and sync bulk data from Firestore/Frontend into PostgreSQL
   */
  async syncToPostgres(req: Request, res: Response) {
    const dbStatus = await checkDatabaseConnection();
    if (!dbStatus.connected) {
      return res.status(503).json({
        success: false,
        message: 'Banco PostgreSQL não acessível no momento.',
        error: dbStatus.error,
      });
    }

    const { users = [], sectors = [], pontoRecords = [], tickets = [], equipment = [] }: SyncPayload = req.body;

    const stats = {
      sectorsSynced: 0,
      usersSynced: 0,
      pontoSynced: 0,
      ticketsSynced: 0,
      equipmentSynced: 0,
      errors: [] as string[],
    };

    try {
      await query('BEGIN;');

      // 1. Sync Sectors
      for (const sector of sectors) {
        if (!sector.id || !sector.name) continue;
        try {
          await query(`
            INSERT INTO sectors (id, name, area, leader_name, collaborators_count, description, sla_target)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            ON CONFLICT (id) DO UPDATE SET
              name = EXCLUDED.name,
              area = EXCLUDED.area,
              leader_name = EXCLUDED.leader_name,
              collaborators_count = EXCLUDED.collaborators_count,
              description = EXCLUDED.description,
              sla_target = EXCLUDED.sla_target,
              updated_at = CURRENT_TIMESTAMP;
          `, [
            sector.id,
            sector.name,
            sector.area || 'ADMINISTRATIVO',
            sector.leaderName || null,
            sector.collaboratorsCount || 0,
            sector.description || null,
            sector.slaTarget || '99.5%'
          ]);
          stats.sectorsSynced++;
        } catch (e: any) {
          stats.errors.push(`Sector ${sector.name}: ${e.message}`);
        }
      }

      // 2. Sync Users
      for (const user of users) {
        if (!user.id || !user.email) continue;
        try {
          const facial = user.facialData || {};
          await query(`
            INSERT INTO users (
              id, name, email, role, user_role, hierarchy_level,
              sector_name, area, avatar_url, phone, admission_date,
              status, current_task, contract_type, salary_bracket, work_schedule,
              emergency_contact, is_active, is_blocked,
              facial_active, facial_photo_url, facial_biometric_hash,
              facial_landmarks_count, facial_confidence_score, facial_registered_at
            ) VALUES (
              $1, $2, $3, $4, $5, $6,
              $7, $8, $9, $10, $11,
              $12, $13, $14, $15, $16,
              $17, $18, $19,
              $20, $21, $22,
              $23, $24, $25
            )
            ON CONFLICT (id) DO UPDATE SET
              name = EXCLUDED.name,
              email = EXCLUDED.email,
              role = EXCLUDED.role,
              user_role = EXCLUDED.user_role,
              sector_name = EXCLUDED.sector_name,
              avatar_url = EXCLUDED.avatar_url,
              phone = EXCLUDED.phone,
              status = EXCLUDED.status,
              current_task = EXCLUDED.current_task,
              facial_active = EXCLUDED.facial_active,
              facial_photo_url = EXCLUDED.facial_photo_url,
              facial_biometric_hash = EXCLUDED.facial_biometric_hash,
              facial_confidence_score = EXCLUDED.facial_confidence_score,
              updated_at = CURRENT_TIMESTAMP;
          `, [
            user.id,
            user.name || 'Usuário Sem Nome',
            user.email,
            user.role || 'Colaborador',
            user.userRole || 'COLABORADOR',
            user.hierarchyLevel || 4,
            user.sector || user.sector_name || null,
            user.area || null,
            user.avatar || user.avatar_url || null,
            user.phone || null,
            user.admissionDate || user.admission_date || new Date().toISOString().split('T')[0],
            user.status || 'Em atividade',
            user.currentTask || user.current_task || null,
            user.contractType || user.contract_type || 'CLT',
            user.salaryBracket || user.salary_bracket || null,
            user.workSchedule || user.work_schedule || '08:00 - 18:00 (Segunda a Sexta)',
            user.emergencyContact || user.emergency_contact || null,
            user.isActive !== undefined ? user.isActive : true,
            user.isBlocked !== undefined ? user.isBlocked : false,
            facial.active || user.facial_active || false,
            facial.photoUrl || user.facial_photo_url || null,
            facial.biometricHash || user.facial_biometric_hash || null,
            facial.landmarksCount || user.facial_landmarks_count || 68,
            facial.confidenceScore || user.facial_confidence_score || 99.4,
            facial.registeredAt || user.facial_registered_at || null
          ]);
          stats.usersSynced++;
        } catch (e: any) {
          stats.errors.push(`User ${user.email}: ${e.message}`);
        }
      }

      // 3. Sync Ponto Records
      for (const ponto of pontoRecords) {
        if (!ponto.id || !ponto.collaboratorId && !ponto.user_id) continue;
        const userId = ponto.collaboratorId || ponto.user_id;
        const loc = ponto.location || {};
        try {
          await query(`
            INSERT INTO ponto_records (
              id, nsr, user_id, collaborator_name, collaborator_sector,
              type, punch_date, punch_time, unix_timestamp,
              photo_url, biometric_match_confidence, sha256_hash,
              device_type, device_details, ip_address,
              latitude, longitude, accuracy_meters, approximate_address, city, state
            ) VALUES (
              $1, $2, $3, $4, $5,
              $6, $7, $8, $9,
              $10, $11, $12,
              $13, $14, $15,
              $16, $17, $18, $19, $20, $21
            )
            ON CONFLICT (id) DO NOTHING;
          `, [
            ponto.id,
            ponto.nsr || `NSR-${Date.now()}`,
            userId,
            ponto.collaboratorName || ponto.collaborator_name || 'Colaborador',
            ponto.collaboratorSector || ponto.collaborator_sector || 'Geral',
            ponto.type || 'ENTRADA',
            ponto.date || ponto.punch_date || new Date().toISOString().split('T')[0],
            ponto.time || ponto.punch_time || new Date().toTimeString().split(' ')[0],
            ponto.timestamp || ponto.unix_timestamp || Date.now(),
            ponto.photoUrl || ponto.photo_url || null,
            ponto.biometricMatchConfidence || ponto.biometric_match_confidence || 99.4,
            ponto.sha256Hash || ponto.sha256_hash || 'SHA256_OFFLINE_VERIFIED',
            ponto.deviceType || ponto.device_type || 'Desktop/Browser',
            ponto.deviceDetails || ponto.device_details || null,
            ponto.ipAddress || ponto.ip_address || loc.ipAddress || '127.0.0.1',
            loc.latitude || ponto.latitude || null,
            loc.longitude || ponto.longitude || null,
            loc.accuracyMeters || ponto.accuracy_meters || null,
            loc.approximateAddress || ponto.approximate_address || null,
            loc.city || ponto.city || 'São Paulo',
            loc.state || ponto.state || 'SP'
          ]);
          stats.pontoSynced++;
        } catch (e: any) {
          stats.errors.push(`Ponto ${ponto.id}: ${e.message}`);
        }
      }

      // 4. Sync Tickets
      for (const ticket of tickets) {
        if (!ticket.id || !ticket.client) continue;
        try {
          await query(`
            INSERT INTO tickets (
              id, protocol, client, subject, description, sector, service_classification,
              priority, status, assigned_to, assigned_avatar,
              requester_email, contact_email, open_time, sla_hours
            ) VALUES (
              $1, $2, $3, $4, $5, $6, $7,
              $8, $9, $10, $11,
              $12, $13, $14, $15
            )
            ON CONFLICT (id) DO UPDATE SET
              status = EXCLUDED.status,
              priority = EXCLUDED.priority,
              sector = EXCLUDED.sector,
              service_classification = EXCLUDED.service_classification,
              assigned_to = EXCLUDED.assigned_to,
              updated_at = CURRENT_TIMESTAMP;
          `, [
            ticket.id,
            ticket.protocol || `GIHS-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
            ticket.client,
            ticket.subject || ticket.title || 'Chamado Geral',
            ticket.description || null,
            ticket.sector || 'N1',
            ticket.serviceClassification || (ticket as any).service_classification || 'Suporte',
            ticket.priority || 'Média',
            ticket.status || 'Aberto',
            ticket.assignedTo || ticket.assigned_to || null,
            ticket.assignedAvatar || ticket.assigned_avatar || null,
            ticket.requesterEmail || ticket.requester_email || null,
            ticket.contactEmail || ticket.contact_email || null,
            ticket.openTime || ticket.open_time || new Date().toLocaleTimeString('pt-BR'),
            ticket.slaLimitHours || ticket.sla_hours || 4
          ]);
          stats.ticketsSynced++;
        } catch (e: any) {
          stats.errors.push(`Ticket ${ticket.id}: ${e.message}`);
        }
      }

      // 5. Sync Equipment
      for (const eq of equipment) {
        if (!eq.id || !eq.tag && !eq.patrimony_tag) continue;
        const tag = eq.tag || eq.patrimony_tag;
        try {
          await query(`
            INSERT INTO equipment (
              id, patrimony_tag, name, category,
              assigned_user_name, sector, status, acquisition_date
            ) VALUES (
              $1, $2, $3, $4,
              $5, $6, $7, $8
            )
            ON CONFLICT (patrimony_tag) DO UPDATE SET
              status = EXCLUDED.status,
              assigned_user_name = EXCLUDED.assigned_user_name,
              updated_at = CURRENT_TIMESTAMP;
          `, [
            eq.id,
            tag,
            eq.model || eq.name || 'Equipamento',
            eq.category || eq.type || 'Informática',
            eq.assignee || eq.assigned_user_name || null,
            eq.sector || 'TI',
            eq.status === 'Em uso' ? 'Operacional' : (eq.status || 'Operacional'),
            eq.deliveryDate || eq.acquisition_date || new Date().toISOString().split('T')[0]
          ]);
          stats.equipmentSynced++;
        } catch (e: any) {
          stats.errors.push(`Equipment ${tag}: ${e.message}`);
        }
      }

      await query('COMMIT;');

      res.json({
        success: true,
        message: 'Sincronização Firebase ➔ PostgreSQL executada com sucesso!',
        stats,
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      await query('ROLLBACK;').catch(() => {});
      res.status(500).json({
        success: false,
        message: 'Falha durante a transação de sincronização.',
        error: err.message,
        partialStats: stats,
      });
    }
  },

  /**
   * Export all PostgreSQL data back to JSON for bidirectional sync
   */
  async exportFromPostgres(req: Request, res: Response) {
    const dbStatus = await checkDatabaseConnection();
    if (!dbStatus.connected) {
      return res.status(503).json({
        success: false,
        message: 'Banco PostgreSQL não acessível.',
        error: dbStatus.error,
      });
    }

    try {
      const [users, sectors, ponto, tickets, equipment] = await Promise.all([
        query('SELECT * FROM users ORDER BY name ASC;'),
        query('SELECT * FROM sectors ORDER BY name ASC;'),
        query('SELECT * FROM ponto_records ORDER BY unix_timestamp DESC LIMIT 500;'),
        query('SELECT * FROM tickets ORDER BY created_at DESC LIMIT 500;'),
        query('SELECT * FROM equipment ORDER BY patrimony_tag ASC;'),
      ]);

      res.json({
        success: true,
        data: {
          users: users.rows,
          sectors: sectors.rows,
          pontoRecords: ponto.rows,
          tickets: tickets.rows,
          equipment: equipment.rows,
        },
        counts: {
          users: users.rows.length,
          sectors: sectors.rows.length,
          pontoRecords: ponto.rows.length,
          tickets: tickets.rows.length,
          equipment: equipment.rows.length,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
};
