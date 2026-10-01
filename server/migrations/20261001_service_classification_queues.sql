-- =========================================================================================
-- GIHS SYSTEM — MIGRATION: CLASSIFICAÇÃO DE FILAS DE TI & SERVIÇOS TÉCNICOS
-- =========================================================================================
SET search_path TO gihs_core, public;

ALTER TABLE gihs_core.users 
ADD COLUMN IF NOT EXISTS service_classification VARCHAR(120) DEFAULT 'Suporte';

ALTER TABLE gihs_core.tickets 
ADD COLUMN IF NOT EXISTS service_classification VARCHAR(120) DEFAULT 'Suporte';

COMMENT ON COLUMN gihs_core.users.service_classification IS 'Classificação de serviço de TI para direcionamento de filas (Ex: Suporte, Infraestrutura, Redes, Administração, Governança)';
COMMENT ON COLUMN gihs_core.tickets.service_classification IS 'Fila específica de atendimento técnico do chamado (Ex: Suporte, Infraestrutura, Redes, Administração, Governança)';
