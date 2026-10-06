-- =========================================================================================
-- GIHS SYSTEM — MIGRATION: MÓDULO DE INVENTÁRIO AUTOMATIZADO DE COMPUTADORES (AGENTE C# .NET 8)
-- =========================================================================================
SET search_path TO gihs_core, public;

-- 1. TABELA PRINCIPAL DE AGENTES DE INVENTÁRIO (DISPOSITIVOS WINDOWS)
CREATE TABLE IF NOT EXISTS gihs_core.inventory_agents (
    id VARCHAR(64) PRIMARY KEY, -- agent_id (ex: agt_uuid)
    asset_id VARCHAR(64) REFERENCES gihs_core.equipment(id) ON DELETE SET NULL,
    hostname VARCHAR(180) NOT NULL,
    machine_uuid VARCHAR(120) NOT NULL UNIQUE,
    serial_number VARCHAR(120),
    manufacturer VARCHAR(180),
    model VARCHAR(180),
    domain_workgroup VARCHAR(180),
    "current_user" VARCHAR(180),
    agent_version VARCHAR(32) NOT NULL DEFAULT '1.0.0',
    agent_status VARCHAR(32) NOT NULL DEFAULT 'ONLINE', -- 'ONLINE', 'OFFLINE', 'ALERT', 'CONFLICT'
    security_status VARCHAR(32) NOT NULL DEFAULT 'PROTEGIDO', -- 'PROTEGIDO', 'ALERTA', 'VULNERAVEL'
    ip_address VARCHAR(64),
    mac_addresses JSONB DEFAULT '[]'::jsonb,
    os_info JSONB DEFAULT '{}'::jsonb,
    memory_info JSONB DEFAULT '{}'::jsonb,
    storage_info JSONB DEFAULT '{}'::jsonb,
    security_info JSONB DEFAULT '{}'::jsonb,
    software_count INTEGER DEFAULT 0,
    request_full_inventory BOOLEAN DEFAULT FALSE,
    last_heartbeat TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_inventory TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    first_seen TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 2. TABELA DE APLICATIVOS INSTALADOS POR AGENTE
CREATE TABLE IF NOT EXISTS gihs_core.agent_software (
    id BIGSERIAL PRIMARY KEY,
    agent_id VARCHAR(64) NOT NULL REFERENCES gihs_core.inventory_agents(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    version VARCHAR(120),
    publisher VARCHAR(255),
    install_date VARCHAR(64),
    installed_user VARCHAR(180),
    install_location TEXT,
    uninstall_string TEXT,
    architecture VARCHAR(32),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 3. HISTÓRICO DE COLETAS E EVENTOS DE HARDWARE/SOFTWARE DO AGENTE
CREATE TABLE IF NOT EXISTS gihs_core.agent_inventory_history (
    id BIGSERIAL PRIMARY KEY,
    agent_id VARCHAR(64) NOT NULL REFERENCES gihs_core.inventory_agents(id) ON DELETE CASCADE,
    event_type VARCHAR(64) NOT NULL,
    summary TEXT NOT NULL,
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 4. CONFLITOS DE IDENTIDADE (DEDUPLICAÇÃO & PREVENÇÃO DE SOBREPOSIÇÃO)
CREATE TABLE IF NOT EXISTS gihs_core.agent_identity_conflicts (
    id BIGSERIAL PRIMARY KEY,
    agent_id VARCHAR(64) NOT NULL,
    existing_asset_id VARCHAR(64) REFERENCES gihs_core.equipment(id) ON DELETE SET NULL,
    hostname VARCHAR(180),
    machine_uuid VARCHAR(120),
    serial_number VARCHAR(120),
    conflict_type VARCHAR(64) NOT NULL,
    payload_data JSONB DEFAULT '{}'::jsonb,
    status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
    resolved_by VARCHAR(120),
    resolution_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    resolved_at TIMESTAMP WITH TIME ZONE
);

-- 5. ATUALIZAÇÃO DA TABELA EQUIPMENT COM VÍNCULO AO AGENTE
ALTER TABLE gihs_core.equipment
ADD COLUMN IF NOT EXISTS agent_id VARCHAR(64),
ADD COLUMN IF NOT EXISTS machine_uuid VARCHAR(120),
ADD COLUMN IF NOT EXISTS last_agent_sync TIMESTAMP WITH TIME ZONE;

-- Índices de alta performance
CREATE INDEX IF NOT EXISTS idx_inventory_agents_hostname ON gihs_core.inventory_agents(hostname);
CREATE INDEX IF NOT EXISTS idx_inventory_agents_serial ON gihs_core.inventory_agents(serial_number);
CREATE INDEX IF NOT EXISTS idx_inventory_agents_status ON gihs_core.inventory_agents(agent_status);
CREATE INDEX IF NOT EXISTS idx_inventory_agents_last_heartbeat ON gihs_core.inventory_agents(last_heartbeat);
CREATE INDEX IF NOT EXISTS idx_agent_software_agent_id ON gihs_core.agent_software(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_software_name ON gihs_core.agent_software(name);
CREATE INDEX IF NOT EXISTS idx_agent_history_agent_id ON gihs_core.agent_inventory_history(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_conflicts_status ON gihs_core.agent_identity_conflicts(status);
CREATE INDEX IF NOT EXISTS idx_equipment_agent_id ON gihs_core.equipment(agent_id);
CREATE INDEX IF NOT EXISTS idx_equipment_machine_uuid ON gihs_core.equipment(machine_uuid);
