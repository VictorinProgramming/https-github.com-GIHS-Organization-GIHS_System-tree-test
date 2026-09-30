-- =========================================================================================
-- GIHS SYSTEM — MIGRATION: EVOLUÇÃO DE GEOLOCALIZAÇÃO, QUILOMETRAGEM DE VEÍCULO E ABASTECIMENTO
-- =========================================================================================

SET search_path TO gihs_core, public;

-- 1. Adicionar campos específicos de controle veicular em vehicle_trips
ALTER TABLE gihs_core.vehicle_trips
ADD COLUMN IF NOT EXISTS start_km NUMERIC(10, 2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS end_km NUMERIC(10, 2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS last_fuel_date DATE,
ADD COLUMN IF NOT EXISTS origin_address VARCHAR(255) DEFAULT 'Base Matriz GIHS (Ponto A)';

-- 2. Tabela de veículos da frota corporativa para seleção rápida e auditoria
CREATE TABLE IF NOT EXISTS gihs_core.corporate_vehicles (
    id VARCHAR(64) PRIMARY KEY,
    model VARCHAR(120) NOT NULL,
    plate VARCHAR(32) NOT NULL UNIQUE,
    current_km NUMERIC(10, 2) DEFAULT 0.00 NOT NULL,
    last_fuel_date DATE,
    fuel_type VARCHAR(64) DEFAULT 'Flex',
    status VARCHAR(32) DEFAULT 'DISPONIVEL',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Inserir veículos corporativos iniciais se não existirem
INSERT INTO gihs_core.corporate_vehicles (id, model, plate, current_km, last_fuel_date, status)
VALUES
('veh-01', 'Fiat Strada Freedom 1.3 CS (Frota 01)', 'BRA2E19', 45238.40, '2026-09-28', 'DISPONIVEL'),
('veh-02', 'Renault Duster Zen 1.6 CVT (Frota 02)', 'GIH4D88', 31150.00, '2026-09-29', 'DISPONIVEL'),
('veh-03', 'Chevrolet Onix Plus 1.0 Turbo (Frota 03)', 'KMS9A12', 18920.50, '2026-09-25', 'DISPONIVEL')
ON CONFLICT (id) DO UPDATE SET
    model = EXCLUDED.model,
    plate = EXCLUDED.plate;

-- Atualizar a viagem seed com KM inicial e final e data de abastecimento
UPDATE gihs_core.vehicle_trips
SET 
    start_km = 45200.00,
    end_km = 45238.40,
    last_fuel_date = '2026-09-28',
    origin_address = 'Base Matriz GIHS - São Paulo (Ponto A)'
WHERE id = 'trip-rec-001';
