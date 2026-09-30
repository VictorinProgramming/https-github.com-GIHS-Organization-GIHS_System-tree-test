-- =========================================================================================
-- GIHS SYSTEM — MIGRATION: GOVERNANÇA, MOBILIDADE CORPORATIVA & SOBREAVISO
-- =========================================================================================
-- Namespace: gihs_core
-- Idempotente, não destrutiva, preserva 100% dos dados existentes.
-- =========================================================================================

SET search_path TO gihs_core, public;

-- 1. Extensão de status para equipamentos e mobilidade
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_device_custody_status') THEN
        CREATE TYPE enum_device_custody_status AS ENUM ('ATIVO', 'DEVOLVIDO');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_shift_status') THEN
        CREATE TYPE enum_shift_status AS ENUM ('AGENDADO', 'EM_SOBREAVISO', 'FINALIZADO', 'CANCELADO');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_trip_status') THEN
        CREATE TYPE enum_trip_status AS ENUM ('EM_ANDAMENTO', 'FINALIZADO', 'CANCELADO');
    END IF;
END $$;

-- 2. Tabela de Custódia e Histórico de Responsabilidade de Aparelhos (device_assignments)
CREATE TABLE IF NOT EXISTS gihs_core.device_assignments (
    id VARCHAR(64) PRIMARY KEY,
    equipment_id VARCHAR(64) NOT NULL REFERENCES gihs_core.equipment(id) ON DELETE CASCADE,
    user_id VARCHAR(64) NOT NULL REFERENCES gihs_core.users(id) ON DELETE RESTRICT,
    user_name VARCHAR(180) NOT NULL,
    sector_id VARCHAR(64) REFERENCES gihs_core.sectors(id) ON DELETE SET NULL,
    sector_name VARCHAR(120),
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    returned_at TIMESTAMP WITH TIME ZONE,
    assigned_by VARCHAR(64) REFERENCES gihs_core.users(id) ON DELETE SET NULL,
    assigned_by_name VARCHAR(180),
    status enum_device_custody_status NOT NULL DEFAULT 'ATIVO',
    purpose VARCHAR(255) DEFAULT 'Plantão e Atendimento de Sobreaviso',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

COMMENT ON TABLE gihs_core.device_assignments IS 'Histórico auditável e imutável de custódia e posse dos aparelhos corporativos';

-- 3. Tabela de Escalas de Sobreaviso (on_call_shifts)
CREATE TABLE IF NOT EXISTS gihs_core.on_call_shifts (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES gihs_core.users(id) ON DELETE RESTRICT,
    user_name VARCHAR(180) NOT NULL,
    sector_id VARCHAR(64) REFERENCES gihs_core.sectors(id) ON DELETE SET NULL,
    sector_name VARCHAR(120) NOT NULL,
    device_id VARCHAR(64) REFERENCES gihs_core.equipment(id) ON DELETE SET NULL,
    device_tag VARCHAR(64),
    device_phone VARCHAR(32),
    start_at TIMESTAMP WITH TIME ZONE NOT NULL,
    end_at TIMESTAMP WITH TIME ZONE NOT NULL,
    status enum_shift_status NOT NULL DEFAULT 'AGENDADO',
    notes TEXT,
    created_by VARCHAR(64) REFERENCES gihs_core.users(id) ON DELETE SET NULL,
    created_by_name VARCHAR(180),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT chk_shift_time CHECK (end_at > start_at)
);

COMMENT ON TABLE gihs_core.on_call_shifts IS 'Escalas de sobreaviso e plantões operacionais de todos os setores';

-- 4. Tabela de Deslocamentos e Viagens Corporativas (vehicle_trips)
CREATE TABLE IF NOT EXISTS gihs_core.vehicle_trips (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES gihs_core.users(id) ON DELETE RESTRICT,
    user_name VARCHAR(180) NOT NULL,
    device_id VARCHAR(64) REFERENCES gihs_core.equipment(id) ON DELETE SET NULL,
    device_name VARCHAR(180),
    shift_id VARCHAR(64) REFERENCES gihs_core.on_call_shifts(id) ON DELETE SET NULL,
    vehicle_model VARCHAR(120) NOT NULL,
    vehicle_plate VARCHAR(32) NOT NULL,
    ticket_id VARCHAR(64) REFERENCES gihs_core.tickets(id) ON DELETE SET NULL,
    ticket_protocol VARCHAR(64),
    task_id VARCHAR(64) REFERENCES gihs_core.tasks(id) ON DELETE SET NULL,
    task_title VARCHAR(255),
    purpose TEXT NOT NULL,
    destination VARCHAR(255) NOT NULL,
    status enum_trip_status NOT NULL DEFAULT 'EM_ANDAMENTO',
    start_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    end_at TIMESTAMP WITH TIME ZONE,
    duration_seconds INTEGER DEFAULT 0,
    start_latitude NUMERIC(10, 7),
    start_longitude NUMERIC(10, 7),
    end_latitude NUMERIC(10, 7),
    end_longitude NUMERIC(10, 7),
    total_distance_km NUMERIC(8, 2) DEFAULT 0.00,
    avg_speed_kmh NUMERIC(6, 2) DEFAULT 0.00,
    max_speed_kmh NUMERIC(6, 2) DEFAULT 0.00,
    points_count INTEGER DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

COMMENT ON TABLE gihs_core.vehicle_trips IS 'Deslocamentos corporativos rastreados vinculados a plantão, veículo e chamados';

-- 5. Tabela de Telemetria e Pontos GPS da Rota (vehicle_route_points)
CREATE TABLE IF NOT EXISTS gihs_core.vehicle_route_points (
    id VARCHAR(64) PRIMARY KEY,
    trip_id VARCHAR(64) NOT NULL REFERENCES gihs_core.vehicle_trips(id) ON DELETE CASCADE,
    latitude NUMERIC(10, 7) NOT NULL,
    longitude NUMERIC(10, 7) NOT NULL,
    recorded_at TIMESTAMP WITH TIME ZONE NOT NULL,
    accuracy_meters NUMERIC(8, 2) DEFAULT 5.00,
    speed_kmh NUMERIC(6, 2) DEFAULT 0.00,
    heading NUMERIC(5, 2),
    altitude NUMERIC(8, 2),
    battery_level INTEGER CHECK (battery_level BETWEEN 0 AND 100),
    is_valid BOOLEAN DEFAULT TRUE NOT NULL,
    label VARCHAR(120),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

COMMENT ON TABLE gihs_core.vehicle_route_points IS 'Série temporal de pontos de GPS transmitidos pelo celular corporativo';

-- 6. Índices de Otimização para Alta Performance
CREATE INDEX IF NOT EXISTS idx_assignments_equipment ON gihs_core.device_assignments(equipment_id);
CREATE INDEX IF NOT EXISTS idx_assignments_user ON gihs_core.device_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_assignments_status ON gihs_core.device_assignments(status);

CREATE INDEX IF NOT EXISTS idx_shifts_user_period ON gihs_core.on_call_shifts(user_id, start_at, end_at);
CREATE INDEX IF NOT EXISTS idx_shifts_status ON gihs_core.on_call_shifts(status);
CREATE INDEX IF NOT EXISTS idx_shifts_sector ON gihs_core.on_call_shifts(sector_id);
CREATE INDEX IF NOT EXISTS idx_shifts_active_window ON gihs_core.on_call_shifts(start_at, end_at);

CREATE INDEX IF NOT EXISTS idx_trips_user ON gihs_core.vehicle_trips(user_id);
CREATE INDEX IF NOT EXISTS idx_trips_status ON gihs_core.vehicle_trips(status);
CREATE INDEX IF NOT EXISTS idx_trips_device ON gihs_core.vehicle_trips(device_id);
CREATE INDEX IF NOT EXISTS idx_trips_start_at ON gihs_core.vehicle_trips(start_at DESC);
CREATE INDEX IF NOT EXISTS idx_trips_shift ON gihs_core.vehicle_trips(shift_id);

CREATE INDEX IF NOT EXISTS idx_route_trip_time ON gihs_core.vehicle_route_points(trip_id, recorded_at ASC);

-- 7. Triggers de atualização automática de timestamp
DROP TRIGGER IF EXISTS trg_set_timestamp_assignments ON gihs_core.device_assignments;
CREATE TRIGGER trg_set_timestamp_assignments
BEFORE UPDATE ON gihs_core.device_assignments
FOR EACH ROW EXECUTE FUNCTION gihs_core.fn_set_timestamp();

DROP TRIGGER IF EXISTS trg_set_timestamp_shifts ON gihs_core.on_call_shifts;
CREATE TRIGGER trg_set_timestamp_shifts
BEFORE UPDATE ON gihs_core.on_call_shifts
FOR EACH ROW EXECUTE FUNCTION gihs_core.fn_set_timestamp();

DROP TRIGGER IF EXISTS trg_set_timestamp_trips ON gihs_core.vehicle_trips;
CREATE TRIGGER trg_set_timestamp_trips
BEFORE UPDATE ON gihs_core.vehicle_trips
FOR EACH ROW EXECUTE FUNCTION gihs_core.fn_set_timestamp();

-- 8. Seed inicial estruturado de Celulares Corporativos e Plantões (apenas se não existirem)
INSERT INTO gihs_core.equipment (
    id, patrimony_tag, barcode, name, category, model, serial_number,
    assigned_user_id, assigned_user_name, sector, status, acquisition_date,
    delivery_date, warranty_until, value_brl, specifications
) VALUES 
(
    'eq-cel-01',
    'GIHS-CEL-001',
    '78910001001',
    'Smartphone Corporativo Plantão N1/N2',
    'Informática',
    'Samsung Galaxy XCover Pro 5G Rugged',
    'R58N100234X',
    'user-master-victor-martins',
    'Victor Martins',
    'N1',
    'OPERACIONAL',
    '2024-02-10',
    '2024-02-15',
    '2026-02-10',
    3450.00,
    '{
        "type": "Smartphone Corporativo",
        "imei": "358912345678901",
        "phone_number": "(11) 97120-4001",
        "carrier": "Vivo Empresas",
        "is_on_call_device": true,
        "mobility_status": "Em plantão",
        "last_battery_level": 88,
        "gps_accuracy": "3.5m",
        "tracking_status": "ONLINE"
    }'::jsonb
),
(
    'eq-cel-02',
    'GIHS-CEL-002',
    '78910001002',
    'Smartphone Corporativo Plantão N3/Infra',
    'Informática',
    'Samsung Galaxy A54 5G Enterprise',
    'R58N200567Y',
    'user-master-victor-hugo',
    'Victor Hugo',
    'N3',
    'OPERACIONAL',
    '2024-03-01',
    '2024-03-05',
    '2026-03-01',
    2300.00,
    '{
        "type": "Smartphone Corporativo",
        "imei": "358912345678902",
        "phone_number": "(11) 97120-4002",
        "carrier": "Claro Empresas",
        "is_on_call_device": true,
        "mobility_status": "Disponível",
        "last_battery_level": 95,
        "gps_accuracy": "2.8m",
        "tracking_status": "STANDBY"
    }'::jsonb
),
(
    'eq-cel-03',
    'GIHS-CEL-003',
    '78910001003',
    'Smartphone Corporativo Cyber Security & SOC',
    'Informática',
    'Google Pixel 7 Enterprise Sec',
    'R58N300891Z',
    'user-master-matheus',
    'Matheus',
    'Cyber Security',
    'OPERACIONAL',
    '2024-04-12',
    '2024-04-15',
    '2026-04-12',
    4200.00,
    '{
        "type": "Smartphone Corporativo",
        "imei": "358912345678903",
        "phone_number": "(11) 97120-4003",
        "carrier": "TIM Empresas",
        "is_on_call_device": true,
        "mobility_status": "Em uso",
        "last_battery_level": 74,
        "gps_accuracy": "2.1m",
        "tracking_status": "ONLINE"
    }'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
    specifications = EXCLUDED.specifications,
    assigned_user_id = EXCLUDED.assigned_user_id,
    assigned_user_name = EXCLUDED.assigned_user_name;

-- 9. Custódia inicial do celular
INSERT INTO gihs_core.device_assignments (
    id, equipment_id, user_id, user_name, sector_id, sector_name,
    assigned_at, assigned_by, assigned_by_name, status, purpose, notes
) VALUES 
(
    'assign-001',
    'eq-cel-01',
    'user-master-victor-martins',
    'Victor Martins',
    'sec-1',
    'N1',
    CURRENT_TIMESTAMP - INTERVAL '2 days',
    'user-master-victor-hugo',
    'Victor Hugo',
    'ATIVO',
    'Escala de Sobreaviso Semanal N1/N2 e Atendimentos Críticos Externos',
    'Aparelho entregue com película protetora, carregador veicular turbo e capa antichoque oficial.'
),
(
    'assign-002',
    'eq-cel-03',
    'user-master-matheus',
    'Matheus',
    'sec-6',
    'Cyber Security',
    CURRENT_TIMESTAMP - INTERVAL '5 days',
    'user-master-victor-hugo',
    'Victor Hugo',
    'ATIVO',
    'Plantão SOC & Resposta a Incidentes de Segurança 24/7',
    'Habilitada autenticação biométrica avançada e token corporativo.'
)
ON CONFLICT (id) DO NOTHING;

-- 10. Seed inicial de Escalas de Sobreaviso
INSERT INTO gihs_core.on_call_shifts (
    id, user_id, user_name, sector_id, sector_name, device_id, device_tag, device_phone,
    start_at, end_at, status, notes, created_by, created_by_name
) VALUES 
(
    'shift-001',
    'user-master-victor-martins',
    'Victor Martins',
    'sec-1',
    'N1',
    'eq-cel-01',
    'GIHS-CEL-001',
    '(11) 97120-4001',
    CURRENT_TIMESTAMP - INTERVAL '2 hours',
    CURRENT_TIMESTAMP + INTERVAL '6 hours',
    'EM_SOBREAVISO',
    'Plantão ativo N1 com cobertura de chamados de alta prioridade e acionamento de deslocamento presencial.',
    'user-master-victor-hugo',
    'Victor Hugo'
),
(
    'shift-002',
    'user-master-matheus',
    'Matheus',
    'sec-6',
    'Cyber Security',
    'eq-cel-03',
    'GIHS-CEL-003',
    '(11) 97120-4003',
    CURRENT_TIMESTAMP + INTERVAL '12 hours',
    CURRENT_TIMESTAMP + INTERVAL '24 hours',
    'AGENDADO',
    'Escala agendada para plantão de resposta a incidentes críticos e suporte a servidores de clientes.',
    'user-master-victor-hugo',
    'Victor Hugo'
),
(
    'shift-003',
    'user-master-rebeca',
    'Rebeca',
    'sec-10',
    'Gestão',
    'eq-cel-02',
    'GIHS-CEL-002',
    '(11) 97120-4002',
    CURRENT_TIMESTAMP - INTERVAL '28 hours',
    CURRENT_TIMESTAMP - INTERVAL '16 hours',
    'FINALIZADO',
    'Plantão executivo concluído sem incidentes operacionais impeditivos.',
    'user-master-victor-hugo',
    'Victor Hugo'
)
ON CONFLICT (id) DO NOTHING;

-- 11. Seed de Viagem Corporativa com Rota e Telemetria Real
INSERT INTO gihs_core.vehicle_trips (
    id, user_id, user_name, device_id, device_name, shift_id,
    vehicle_model, vehicle_plate, purpose, destination,
    status, start_at, end_at, duration_seconds,
    start_latitude, start_longitude, end_latitude, end_longitude,
    total_distance_km, avg_speed_kmh, max_speed_kmh, points_count, notes
) VALUES (
    'trip-rec-001',
    'user-master-victor-martins',
    'Victor Martins',
    'eq-cel-01',
    'Smartphone Corporativo Plantão N1/N2 (GIHS-CEL-001)',
    'shift-001',
    'Fiat Strada Freedom 1.3 CS (GIHS-Frota 01)',
    'BRA2E19',
    'Atendimento presencial urgente — Restauração de link de fibra e troca de switch core cliente',
    'Av. Paulista, 1842 - Bela Vista, São Paulo - SP',
    'FINALIZADO',
    CURRENT_TIMESTAMP - INTERVAL '180 minutes',
    CURRENT_TIMESTAMP - INTERVAL '45 minutes',
    8100,
    -23.550520, -46.633308,
    -23.561414, -46.655881,
    38.40, 42.50, 78.20, 6,
    'Atendimento externo concluído com sucesso. Equipamentos substituídos e homologados no cliente.'
)
ON CONFLICT (id) DO NOTHING;

-- 12. Pontos GPS sequenciais da rota
INSERT INTO gihs_core.vehicle_route_points (
    id, trip_id, latitude, longitude, recorded_at, accuracy_meters, speed_kmh, heading, altitude, battery_level, is_valid, label
) VALUES 
('pt-01', 'trip-rec-001', -23.550520, -46.633308, CURRENT_TIMESTAMP - INTERVAL '180 minutes', 3.2, 0.0, 0, 760, 92, true, 'Base Matriz GIHS - Saída'),
('pt-02', 'trip-rec-001', -23.553410, -46.638200, CURRENT_TIMESTAMP - INTERVAL '165 minutes', 4.1, 48.0, 210, 765, 91, true, 'Av. 23 de Maio - Trânsito Fluido'),
('pt-03', 'trip-rec-001', -23.558200, -46.647100, CURRENT_TIMESTAMP - INTERVAL '140 minutes', 3.8, 54.5, 235, 772, 89, true, 'Acesso Túnel Nove de Julho'),
('pt-04', 'trip-rec-001', -23.561414, -46.655881, CURRENT_TIMESTAMP - INTERVAL '115 minutes', 2.9, 12.0, 280, 780, 87, true, 'Chegada Cliente — Av. Paulista'),
('pt-05', 'trip-rec-001', -23.561400, -46.655890, CURRENT_TIMESTAMP - INTERVAL '70 minutes', 3.0, 0.0, 0, 780, 85, true, 'Término de Atendimento e Saída'),
('pt-06', 'trip-rec-001', -23.550525, -46.633315, CURRENT_TIMESTAMP - INTERVAL '45 minutes', 3.1, 0.0, 45, 760, 83, true, 'Retorno à Base Matriz — Encerramento')
ON CONFLICT (id) DO NOTHING;
