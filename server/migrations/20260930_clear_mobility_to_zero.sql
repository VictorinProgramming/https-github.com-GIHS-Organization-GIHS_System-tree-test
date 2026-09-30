-- =========================================================================================
-- GIHS SYSTEM — LIMPEZA DOS DADOS DE MOBILIDADE PARA ADIÇÃO DO ZERO
-- =========================================================================================

SET search_path TO gihs_core, public;

-- Limpar pontos de rota
DELETE FROM gihs_core.vehicle_route_points;

-- Limpar viagens / deslocamentos
DELETE FROM gihs_core.vehicle_trips;

-- Limpar custódias de celular
DELETE FROM gihs_core.device_assignments;

-- Limpar veículos corporativos
DELETE FROM gihs_core.corporate_vehicles;

-- Limpar smartphones de teste cadastrados
DELETE FROM gihs_core.equipment
WHERE specifications->>'type' = 'Smartphone Corporativo'
   OR patrimony_tag ILIKE '%CEL%'
   OR name ILIKE '%Smartphone Corporativo%';
