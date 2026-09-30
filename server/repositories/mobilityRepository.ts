import { query } from '../db.js';

export interface CorporateDeviceRow {
  id: string;
  patrimony_tag: string;
  barcode?: string;
  name: string;
  category: string;
  model: string;
  serial_number?: string;
  assigned_user_id?: string;
  assigned_user_name?: string;
  sector?: string;
  status: string;
  acquisition_date?: string;
  delivery_date?: string;
  warranty_until?: string;
  value_brl?: number;
  specifications: {
    type?: string;
    imei?: string;
    phone_number?: string;
    carrier?: string;
    is_on_call_device?: boolean;
    mobility_status?: 'Disponível' | 'Em uso' | 'Em plantão' | 'Manutenção' | 'Bloqueado' | 'Inativo';
    last_battery_level?: number;
    gps_accuracy?: string;
    tracking_status?: 'ONLINE' | 'STANDBY' | 'OFFLINE';
    last_telemetry_at?: string;
    current_trip_id?: string;
    [key: string]: any;
  };
  created_at: string;
  updated_at: string;
}

export interface DeviceAssignmentRow {
  id: string;
  equipment_id: string;
  user_id: string;
  user_name: string;
  sector_id?: string;
  sector_name?: string;
  assigned_at: string;
  returned_at?: string;
  assigned_by?: string;
  assigned_by_name?: string;
  status: 'ATIVO' | 'DEVOLVIDO';
  purpose: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  // Joins
  patrimony_tag?: string;
  device_name?: string;
  device_model?: string;
  phone_number?: string;
}

export interface CorporateVehicleRow {
  id: string;
  model: string;
  plate: string;
  current_km: number;
  last_fuel_date?: string;
  fuel_type: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface VehicleTripRow {
  id: string;
  user_id: string;
  user_name: string;
  device_id?: string;
  device_name?: string;
  shift_id?: string;
  vehicle_model: string;
  vehicle_plate: string;
  start_km: number;
  end_km: number;
  last_fuel_date?: string;
  origin_address: string;
  ticket_id?: string;
  ticket_protocol?: string;
  task_id?: string;
  task_title?: string;
  purpose: string;
  destination: string;
  status: 'EM_ANDAMENTO' | 'FINALIZADO' | 'CANCELADO';
  start_at: string;
  end_at?: string;
  duration_seconds: number;
  start_latitude?: number;
  start_longitude?: number;
  end_latitude?: number;
  end_longitude?: number;
  destination_latitude?: number;
  destination_longitude?: number;
  total_distance_km: number;
  avg_speed_kmh: number;
  max_speed_kmh: number;
  points_count: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  route_points?: RoutePointRow[];
}

export interface RoutePointRow {
  id: string;
  trip_id: string;
  latitude: number;
  longitude: number;
  recorded_at: string;
  accuracy_meters: number;
  speed_kmh: number;
  heading?: number;
  altitude?: number;
  battery_level?: number;
  is_valid: boolean;
  label?: string;
  created_at: string;
}

function haversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export const mobilityRepository = {
  // =========================================================================
  // 1. GESTÃO DOS CELULARES CORPORATIVOS (EQUIPMENT)
  // =========================================================================
  async getDevices(): Promise<CorporateDeviceRow[]> {
    const res = await query<CorporateDeviceRow>(`
      SELECT * FROM equipment
      WHERE (
        specifications->>'type' = 'Smartphone Corporativo'
        OR name ILIKE '%Smartphone%'
        OR name ILIKE '%Celular%'
        OR patrimony_tag ILIKE '%CEL%'
      )
      ORDER BY patrimony_tag ASC;
    `);
    return res.rows;
  },

  async getDeviceById(id: string): Promise<CorporateDeviceRow | null> {
    const res = await query<CorporateDeviceRow>(`
      SELECT * FROM equipment WHERE id = $1 LIMIT 1;
    `, [id]);
    return res.rows[0] || null;
  },

  async createDevice(device: Partial<CorporateDeviceRow>): Promise<CorporateDeviceRow> {
    const id = device.id || `eq-cel-${Date.now()}`;
    const tag = device.patrimony_tag || `GIHS-CEL-${Math.floor(100 + Math.random() * 900)}`;

    const specs = {
      type: 'Smartphone Corporativo',
      imei: device.specifications?.imei || '',
      phone_number: device.specifications?.phone_number || '',
      carrier: device.specifications?.carrier || 'Vivo Empresas',
      is_on_call_device: device.specifications?.is_on_call_device ?? true,
      mobility_status: device.specifications?.mobility_status || 'Disponível',
      last_battery_level: device.specifications?.last_battery_level ?? 100,
      tracking_status: device.specifications?.tracking_status || 'STANDBY',
      ...(device.specifications || {})
    };

    const res = await query<CorporateDeviceRow>(`
      INSERT INTO equipment (
        id, patrimony_tag, barcode, name, category, model, serial_number,
        assigned_user_id, assigned_user_name, sector, status,
        acquisition_date, delivery_date, warranty_until, value_brl,
        specifications
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7,
        $8, $9, $10, $11,
        $12, $13, $14, $15,
        $16
      )
      RETURNING *;
    `, [
      id,
      tag,
      device.barcode || `7891${Math.floor(1000000 + Math.random() * 9000000)}`,
      device.name || 'Smartphone Corporativo',
      'Informática',
      device.model || 'Samsung Galaxy Rugged Enterprise',
      device.serial_number || `SN-${Date.now()}`,
      device.assigned_user_id || null,
      device.assigned_user_name || null,
      device.sector || 'N1',
      device.status || 'OPERACIONAL',
      device.acquisition_date || new Date().toISOString().split('T')[0],
      device.delivery_date || null,
      device.warranty_until || null,
      device.value_brl || 2500.00,
      JSON.stringify(specs)
    ]);

    return res.rows[0];
  },

  async updateDevice(id: string, updates: Partial<CorporateDeviceRow>): Promise<CorporateDeviceRow | null> {
    const existing = await this.getDeviceById(id);
    if (!existing) return null;

    const mergedSpecs = {
      ...existing.specifications,
      ...(updates.specifications || {})
    };

    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (updates.name !== undefined) { fields.push(`name = $${idx++}`); values.push(updates.name); }
    if (updates.model !== undefined) { fields.push(`model = $${idx++}`); values.push(updates.model); }
    if (updates.serial_number !== undefined) { fields.push(`serial_number = $${idx++}`); values.push(updates.serial_number); }
    if (updates.assigned_user_id !== undefined) { fields.push(`assigned_user_id = $${idx++}`); values.push(updates.assigned_user_id); }
    if (updates.assigned_user_name !== undefined) { fields.push(`assigned_user_name = $${idx++}`); values.push(updates.assigned_user_name); }
    if (updates.sector !== undefined) { fields.push(`sector = $${idx++}`); values.push(updates.sector); }
    if (updates.status !== undefined) { fields.push(`status = $${idx++}`); values.push(updates.status); }

    fields.push(`specifications = $${idx++}`);
    values.push(JSON.stringify(mergedSpecs));

    values.push(id);
    const sql = `
      UPDATE equipment
      SET ${fields.join(', ')}
      WHERE id = $${idx}
      RETURNING *;
    `;

    const res = await query<CorporateDeviceRow>(sql, values);
    return res.rows[0] || null;
  },

  // =========================================================================
  // 2. CUSTÓDIA E RESPONSABILIDADE (DEVICE_ASSIGNMENTS)
  // =========================================================================
  async getAssignments(filters?: { user_id?: string; equipment_id?: string; status?: string }): Promise<DeviceAssignmentRow[]> {
    const conditions: string[] = ['1=1'];
    const params: any[] = [];
    let idx = 1;

    if (filters?.user_id && filters.user_id !== 'ALL') {
      conditions.push(`da.user_id = $${idx++}`);
      params.push(filters.user_id);
    }

    if (filters?.equipment_id && filters.equipment_id !== 'ALL') {
      conditions.push(`da.equipment_id = $${idx++}`);
      params.push(filters.equipment_id);
    }

    if (filters?.status && filters.status !== 'ALL') {
      conditions.push(`da.status = $${idx++}`);
      params.push(filters.status);
    }

    const sql = `
      SELECT 
        da.*,
        eq.patrimony_tag,
        eq.name as device_name,
        eq.model as device_model,
        eq.specifications->>'phone_number' as phone_number
      FROM device_assignments da
      JOIN equipment eq ON eq.id = da.equipment_id
      WHERE ${conditions.join(' AND ')}
      ORDER BY da.assigned_at DESC;
    `;

    const res = await query<DeviceAssignmentRow>(sql, params);
    return res.rows;
  },

  async createAssignment(assignment: Partial<DeviceAssignmentRow>): Promise<DeviceAssignmentRow> {
    const id = assignment.id || `assign-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const res = await query<DeviceAssignmentRow>(`
      INSERT INTO device_assignments (
        id, equipment_id, user_id, user_name, sector_id, sector_name,
        assigned_at, assigned_by, assigned_by_name, status, purpose, notes
      ) VALUES (
        $1, $2, $3, $4, $5, $6,
        $7, $8, $9, $10, $11, $12
      )
      RETURNING *;
    `, [
      id,
      assignment.equipment_id,
      assignment.user_id,
      assignment.user_name,
      assignment.sector_id || null,
      assignment.sector_name || null,
      assignment.assigned_at || new Date().toISOString(),
      assignment.assigned_by || null,
      assignment.assigned_by_name || null,
      'ATIVO',
      assignment.purpose || 'Plantão e Atendimento de Sobreaviso',
      assignment.notes || null
    ]);

    // Atualiza o aparelho para refletir a atribuição e status de uso
    await query(`
      UPDATE equipment
      SET 
        assigned_user_id = $1,
        assigned_user_name = $2,
        sector = $3,
        specifications = jsonb_set(
          jsonb_set(specifications, '{mobility_status}', '"Em plantão"'),
          '{last_assigned_at}', to_jsonb(CURRENT_TIMESTAMP)
        )
      WHERE id = $4;
    `, [
      assignment.user_id,
      assignment.user_name,
      assignment.sector_name,
      assignment.equipment_id
    ]);

    return res.rows[0];
  },

  async returnAssignment(assignmentId: string, notes?: string): Promise<DeviceAssignmentRow | null> {
    const res = await query<DeviceAssignmentRow>(`
      UPDATE device_assignments
      SET 
        status = 'DEVOLVIDO',
        returned_at = CURRENT_TIMESTAMP,
        notes = CASE WHEN $1::text IS NOT NULL THEN COALESCE(notes, '') || ' | Devolução: ' || $1::text ELSE notes END
      WHERE id = $2
      RETURNING *;
    `, [notes || null, assignmentId]);

    const assignment = res.rows[0];
    if (assignment) {
      // Libera o aparelho
      await query(`
        UPDATE equipment
        SET 
          assigned_user_id = NULL,
          assigned_user_name = NULL,
          specifications = jsonb_set(
            specifications,
            '{mobility_status}',
            '"Disponível"'
          )
        WHERE id = $1;
      `, [assignment.equipment_id]);
    }

    return assignment || null;
  },

  // =========================================================================
  // 3. VEÍCULOS CORPORATIVOS & FROTA (CORPORATE_VEHICLES)
  // =========================================================================
  async getVehicles(): Promise<CorporateVehicleRow[]> {
    const res = await query<CorporateVehicleRow>(`
      SELECT * FROM corporate_vehicles
      ORDER BY model ASC;
    `);
    return res.rows;
  },

  async createVehicle(veh: Partial<CorporateVehicleRow>): Promise<CorporateVehicleRow> {
    const id = veh.id || `veh-${Date.now()}`;
    const res = await query<CorporateVehicleRow>(`
      INSERT INTO corporate_vehicles (id, model, plate, current_km, last_fuel_date, fuel_type, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (plate) DO UPDATE SET
        model = EXCLUDED.model,
        current_km = EXCLUDED.current_km,
        last_fuel_date = EXCLUDED.last_fuel_date
      RETURNING *;
    `, [
      id,
      veh.model || 'Veículo Corporativo',
      (veh.plate || 'GIH0A00').toUpperCase().trim(),
      veh.current_km ?? 0.00,
      veh.last_fuel_date || new Date().toISOString().split('T')[0],
      veh.fuel_type || 'Flex',
      veh.status || 'DISPONIVEL'
    ]);
    return res.rows[0];
  },

  // =========================================================================
  // 4. DESLOCAMENTOS E VIAGENS CORPORATIVAS (VEHICLE_TRIPS)
  // =========================================================================
  async getTrips(filters?: {
    user_id?: string;
    device_id?: string;
    status?: string;
    vehicle_plate?: string;
    ticket_id?: string;
    from_date?: string;
    to_date?: string;
  }): Promise<VehicleTripRow[]> {
    const conditions: string[] = ['1=1'];
    const params: any[] = [];
    let idx = 1;

    if (filters?.user_id && filters.user_id !== 'ALL') {
      conditions.push(`user_id = $${idx++}`);
      params.push(filters.user_id);
    }

    if (filters?.device_id && filters.device_id !== 'ALL') {
      conditions.push(`device_id = $${idx++}`);
      params.push(filters.device_id);
    }

    if (filters?.status && filters.status !== 'ALL') {
      conditions.push(`status = $${idx++}`);
      params.push(filters.status);
    }

    if (filters?.vehicle_plate) {
      conditions.push(`vehicle_plate ILIKE $${idx++}`);
      params.push(`%${filters.vehicle_plate}%`);
    }

    if (filters?.ticket_id) {
      conditions.push(`ticket_id = $${idx++}`);
      params.push(filters.ticket_id);
    }

    if (filters?.from_date) {
      conditions.push(`start_at >= $${idx++}`);
      params.push(filters.from_date);
    }

    if (filters?.to_date) {
      conditions.push(`start_at <= $${idx++}`);
      params.push(filters.to_date);
    }

    const sql = `
      SELECT * FROM vehicle_trips
      WHERE ${conditions.join(' AND ')}
      ORDER BY start_at DESC;
    `;

    const res = await query<VehicleTripRow>(sql, params);
    return res.rows;
  },

  async getTripById(id: string): Promise<VehicleTripRow | null> {
    const tripRes = await query<VehicleTripRow>(`
      SELECT * FROM vehicle_trips WHERE id = $1 LIMIT 1;
    `, [id]);

    const trip = tripRes.rows[0];
    if (!trip) return null;

    const pointsRes = await query<RoutePointRow>(`
      SELECT * FROM vehicle_route_points
      WHERE trip_id = $1
      ORDER BY recorded_at ASC;
    `, [id]);

    trip.route_points = pointsRes.rows;
    return trip;
  },

  async startTrip(tripData: Partial<VehicleTripRow>): Promise<VehicleTripRow> {
    const id = tripData.id || `trip-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const startKm = Number(tripData.start_km) || 0.00;
    const originAddress = tripData.origin_address || 'Base Matriz GIHS - São Paulo (Ponto A)';
    const destination = tripData.destination || 'Ponto B - Destino / Entrega';

    const res = await query<VehicleTripRow>(`
      INSERT INTO vehicle_trips (
        id, user_id, user_name, device_id, device_name, shift_id,
        vehicle_model, vehicle_plate, start_km, end_km, last_fuel_date, origin_address,
        ticket_id, ticket_protocol, task_id, task_title, purpose, destination,
        status, start_at, start_latitude, start_longitude,
        destination_latitude, destination_longitude, end_latitude, end_longitude,
        total_distance_km, avg_speed_kmh, max_speed_kmh, points_count, notes
      ) VALUES (
        $1, $2, $3, $4, $5, $6,
        $7, $8, $9, $10, $11, $12,
        $13, $14, $15, $16, $17, $18,
        'EM_ANDAMENTO', $19, $20, $21,
        $22, $23, $22, $23,
        0.00, 0.00, 0.00, 1, $24
      )
      RETURNING *;
    `, [
      id,
      tripData.user_id,
      tripData.user_name,
      tripData.device_id || null,
      tripData.device_name || null,
      tripData.shift_id || null,
      tripData.vehicle_model || 'Veículo Corporativo GIHS',
      tripData.vehicle_plate || 'BRA2E19',
      startKm,
      startKm, // end_km inicia igual a start_km até encerramento
      tripData.last_fuel_date || null,
      originAddress,
      tripData.ticket_id || null,
      tripData.ticket_protocol || null,
      tripData.task_id || null,
      tripData.task_title || null,
      tripData.purpose || 'Atendimento de Chamado / Deslocamento de Plantão',
      destination,
      tripData.start_at || new Date().toISOString(),
      tripData.start_latitude ?? null,
      tripData.start_longitude ?? null,
      tripData.destination_latitude ?? null,
      tripData.destination_longitude ?? null,
      tripData.notes || null
    ]);

    const createdTrip = res.rows[0];

    // Registra o ponto de origem inicial (Ponto A)
    if (createdTrip.start_latitude && createdTrip.start_longitude) {
      await query(`
        INSERT INTO vehicle_route_points (
          id, trip_id, latitude, longitude, recorded_at, accuracy_meters,
          speed_kmh, heading, altitude, battery_level, is_valid, label
        ) VALUES (
          $1, $2, $3, $4, $5, $6,
          $7, $8, $9, $10, true, $11
        );
      `, [
        `pt-${Date.now()}-001`,
        createdTrip.id,
        createdTrip.start_latitude,
        createdTrip.start_longitude,
        createdTrip.start_at,
        4.0,
        0.0,
        0,
        760,
        95,
        `Partida (Ponto A): ${originAddress}`
      ]);
    }

    // Se houver aparelho, atualiza estado do aparelho
    if (tripData.device_id) {
      await query(`
        UPDATE equipment
        SET specifications = jsonb_set(
          jsonb_set(specifications, '{current_trip_id}', to_jsonb($1::text)),
          '{mobility_status}', '"Em uso"'
        )
        WHERE id = $2;
      `, [createdTrip.id, tripData.device_id]);
    }

    return createdTrip;
  },

  async addRoutePoint(tripId: string, point: {
    latitude: number;
    longitude: number;
    recorded_at?: string;
    accuracy_meters?: number;
    speed_kmh?: number;
    heading?: number;
    altitude?: number;
    battery_level?: number;
    label?: string;
  }): Promise<RoutePointRow> {
    const pointId = `pt-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const recordedAt = point.recorded_at || new Date().toISOString();

    // Filtro de qualidade de GPS: descarta anomalias (saltos irreais > 220 km/h ou precisão > 100m)
    const isValid = (point.accuracy_meters ?? 5) <= 100 && (point.speed_kmh ?? 0) <= 220;

    await query(`
      INSERT INTO vehicle_route_points (
        id, trip_id, latitude, longitude, recorded_at, accuracy_meters,
        speed_kmh, heading, altitude, battery_level, is_valid, label
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
      );
    `, [
      pointId,
      tripId,
      point.latitude,
      point.longitude,
      recordedAt,
      point.accuracy_meters ?? 5.0,
      point.speed_kmh ?? 0.0,
      point.heading ?? 0,
      point.altitude ?? 760,
      point.battery_level ?? 85,
      isValid,
      point.label || 'Ponto de Rota'
    ]);

    // Recalcula métricas sequenciais da viagem com os pontos válidos
    const pointsRes = await query<RoutePointRow>(`
      SELECT latitude, longitude, speed_kmh
      FROM vehicle_route_points
      WHERE trip_id = $1 AND is_valid = true
      ORDER BY recorded_at ASC;
    `, [tripId]);

    const pts = pointsRes.rows;
    let totalKm = 0;
    let maxSpeed = 0;
    let speedSum = 0;

    for (let i = 0; i < pts.length; i++) {
      const spd = Number(pts[i].speed_kmh) || 0;
      if (spd > maxSpeed) maxSpeed = spd;
      speedSum += spd;

      if (i > 0) {
        const seg = haversineDistanceKm(
          Number(pts[i - 1].latitude),
          Number(pts[i - 1].longitude),
          Number(pts[i].latitude),
          Number(pts[i].longitude)
        );
        // Filtro adicional: descarta segmentos com saltos maiores que 30 km por ponto intermediário
        if (seg < 30) {
          totalKm += seg;
        }
      }
    }

    const avgSpeed = pts.length > 0 ? (speedSum / pts.length) : 0;

    // Atualiza viagem incluindo novo cálculo de KM e end_km
    await query(`
      UPDATE vehicle_trips
      SET 
        total_distance_km = $1,
        end_km = start_km + $1,
        avg_speed_kmh = $2,
        max_speed_kmh = $3,
        points_count = $4,
        end_latitude = $5,
        end_longitude = $6
      WHERE id = $7;
    `, [
      parseFloat(totalKm.toFixed(2)),
      parseFloat(avgSpeed.toFixed(2)),
      parseFloat(maxSpeed.toFixed(2)),
      pts.length,
      point.latitude,
      point.longitude,
      tripId
    ]);

    return {
      id: pointId,
      trip_id: tripId,
      latitude: point.latitude,
      longitude: point.longitude,
      recorded_at: recordedAt,
      accuracy_meters: point.accuracy_meters ?? 5.0,
      speed_kmh: point.speed_kmh ?? 0.0,
      heading: point.heading,
      altitude: point.altitude,
      battery_level: point.battery_level,
      is_valid: isValid,
      label: point.label,
      created_at: new Date().toISOString()
    };
  },

  async finishTrip(tripId: string, options?: {
    end_km?: number;
    end_latitude?: number;
    end_longitude?: number;
    notes?: string;
  }): Promise<VehicleTripRow | null> {
    const trip = await this.getTripById(tripId);
    if (!trip) return null;

    const now = new Date();
    const startTime = new Date(trip.start_at);
    const durationSeconds = Math.max(0, Math.floor((now.getTime() - startTime.getTime()) / 1000));

    // Se fornecidas coordenadas de encerramento, registra o ponto final (Ponto B)
    if (options?.end_latitude !== undefined && options?.end_longitude !== undefined) {
      await this.addRoutePoint(tripId, {
        latitude: options.end_latitude,
        longitude: options.end_longitude,
        speed_kmh: 0,
        label: `Chegada (Ponto B): ${trip.destination}`
      });
    }

    // Calcula KM final
    const finalCalculatedKm = options?.end_km !== undefined && options.end_km > Number(trip.start_km)
      ? Number(options.end_km)
      : Number(trip.start_km) + Number(trip.total_distance_km);

    const res = await query<VehicleTripRow>(`
      UPDATE vehicle_trips
      SET 
        status = 'FINALIZADO',
        end_at = CURRENT_TIMESTAMP,
        duration_seconds = $1,
        end_km = $2,
        notes = CASE WHEN $3::text IS NOT NULL THEN COALESCE(notes, '') || ' | ' || $3::text ELSE notes END
      WHERE id = $4
      RETURNING *;
    `, [durationSeconds, finalCalculatedKm, options?.notes || null, tripId]);

    const updatedTrip = res.rows[0];

    // Atualiza a quilometragem atual do veículo na frota corporativa
    if (trip.vehicle_plate) {
      await query(`
        UPDATE corporate_vehicles
        SET current_km = $1, updated_at = CURRENT_TIMESTAMP
        WHERE plate = $2;
      `, [finalCalculatedKm, trip.vehicle_plate]);
    }

    // Libera o celular corporativo
    if (trip.device_id) {
      await query(`
        UPDATE equipment
        SET specifications = jsonb_set(
          jsonb_set(specifications, '{current_trip_id}', 'null'),
          '{mobility_status}', '"Em plantão"'
        )
        WHERE id = $1;
      `, [trip.device_id]);
    }

    return updatedTrip || null;
  },

  // =========================================================================
  // 4. INDICADORES CALCULADOS PELO POSTGRESQL (DASHBOARD MOBILIDADE)
  // =========================================================================
  async getMetrics(): Promise<{
    activeTripsCount: number;
    onCallDevicesCount: number;
    activeVehiclesCount: number;
    kmToday: number;
    kmThisMonth: number;
    totalTripsCompleted: number;
    recentTrips: VehicleTripRow[];
  }> {
    const activeTripsRes = await query(`
      SELECT COUNT(*)::int as count FROM vehicle_trips WHERE status = 'EM_ANDAMENTO';
    `);

    const onCallDevicesRes = await query(`
      SELECT COUNT(*)::int as count FROM equipment
      WHERE specifications->>'mobility_status' IN ('Em plantão', 'Em uso');
    `);

    const activeVehiclesRes = await query(`
      SELECT COUNT(DISTINCT vehicle_plate)::int as count
      FROM vehicle_trips WHERE status = 'EM_ANDAMENTO';
    `);

    const kmTodayRes = await query(`
      SELECT COALESCE(SUM(total_distance_km), 0)::numeric as km
      FROM vehicle_trips
      WHERE start_at >= CURRENT_DATE;
    `);

    const kmThisMonthRes = await query(`
      SELECT COALESCE(SUM(total_distance_km), 0)::numeric as km
      FROM vehicle_trips
      WHERE start_at >= DATE_TRUNC('month', CURRENT_DATE);
    `);

    const completedTripsRes = await query(`
      SELECT COUNT(*)::int as count FROM vehicle_trips WHERE status = 'FINALIZADO';
    `);

    const recentTripsRes = await query<VehicleTripRow>(`
      SELECT * FROM vehicle_trips
      ORDER BY start_at DESC
      LIMIT 5;
    `);

    return {
      activeTripsCount: activeTripsRes.rows[0]?.count || 0,
      onCallDevicesCount: onCallDevicesRes.rows[0]?.count || 0,
      activeVehiclesCount: activeVehiclesRes.rows[0]?.count || 0,
      kmToday: parseFloat(Number(kmTodayRes.rows[0]?.km || 0).toFixed(1)),
      kmThisMonth: parseFloat(Number(kmThisMonthRes.rows[0]?.km || 0).toFixed(1)),
      totalTripsCompleted: completedTripsRes.rows[0]?.count || 0,
      recentTrips: recentTripsRes.rows
    };
  },

  async clearAllMobilityData(): Promise<{ success: boolean; message: string }> {
    await query(`DELETE FROM vehicle_route_points;`);
    await query(`DELETE FROM vehicle_trips;`);
    await query(`DELETE FROM device_assignments;`);
    await query(`DELETE FROM corporate_vehicles;`);
    await query(`
      DELETE FROM equipment
      WHERE specifications->>'type' = 'Smartphone Corporativo'
         OR patrimony_tag ILIKE '%CEL%'
         OR name ILIKE '%Smartphone Corporativo%';
    `);

    return {
      success: true,
      message: 'Todos os dados de mobilidade, trajetos, aparelhos e veículos foram limpos com sucesso. Banco pronto para adição do zero.'
    };
  }
};
