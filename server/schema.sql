-- =========================================================================================
-- GIHS SYSTEM — PACOTE DDL & ARQUITETURA COMPLETA DE BANCO DE DADOS (POSTGRESQL 14+ / 16+)
-- =========================================================================================
-- Desenvolvido para: GIHS System & GIHS Agents Enterprise Intelligence
-- Governança Corporativa, RH, Ponto Eletrônico (Portaria 671 MTE), Biometria Facial,
-- Gestão de Tarefas (Kanban), Help Desk (N1/N2/N3), Ativos de TI, Clientes & SLA, Agenda,
-- Base de Conhecimento, Telemetria de IA e Governança de DBA.
-- =========================================================================================

-- =========================================================================================
-- 1. SETUP DE SEGURANÇA, ROLES, ENCODING & EXTENSÕES CRIPTOGRÁFICAS
-- =========================================================================================

-- Extensões oficiais para UUIDs v4, hash criptográfico e buscas otimizadas
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "btree_gist";

-- Criação do Schema Dedicado (Namespace Isolado)
CREATE SCHEMA IF NOT EXISTS gihs_core;
SET search_path TO gihs_core, public;

-- Definição de Tipos Enumerados (Enums Estritos)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_user_role') THEN
        CREATE TYPE enum_user_role AS ENUM ('SUPER_ADMIN', 'ADMINISTRATIVO', 'GESTOR', 'COLABORADOR');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_contract_type') THEN
        CREATE TYPE enum_contract_type AS ENUM ('CLT', 'PJ', 'ESTAGIO', 'TEMPORARIO');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_ponto_type') THEN
        CREATE TYPE enum_ponto_type AS ENUM ('ENTRADA', 'INICIO_INTERVALO', 'RETORNO', 'SAIDA');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_ticket_priority') THEN
        CREATE TYPE enum_ticket_priority AS ENUM ('BAIXA', 'MEDIA', 'ALTA', 'URGENTE', 'CRITICA');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_ticket_status') THEN
        CREATE TYPE enum_ticket_status AS ENUM ('ABERTO', 'EM_ATENDIMENTO', 'AGUARDANDO_CLIENTE', 'RESOLVIDO', 'CANCELADO');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_task_status') THEN
        CREATE TYPE enum_task_status AS ENUM ('BACKLOG', 'A_FAZER', 'EM_ANDAMENTO', 'EM_REVISAO', 'CONCLUIDO');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_equipment_status') THEN
        CREATE TYPE enum_equipment_status AS ENUM ('OPERACIONAL', 'EM_MANUTENCAO', 'EM_ESTOQUE', 'BAIXADO', 'EXTRAVIADO');
    END IF;
END $$;

-- =========================================================================================
-- 2. FUNÇÃO PL/PGSQL UNIVERSAL: ATUALIZAÇÃO AUTOMÁTICA DE TIMESTAMP
-- =========================================================================================
CREATE OR REPLACE FUNCTION gihs_core.fn_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =========================================================================================
-- 3. TABELA DE SETORES CORPORATIVOS & MACROÁREAS
-- =========================================================================================
CREATE TABLE IF NOT EXISTS gihs_core.sectors (
    id VARCHAR(64) PRIMARY KEY,
    code VARCHAR(32) UNIQUE,
    name VARCHAR(120) NOT NULL,
    area VARCHAR(64) NOT NULL, -- 'SUPORTE', 'DESENVOLVIMENTO', 'SEGURANCA', 'DADOS', 'ADMINISTRATIVO', 'GESTAO'
    leader_name VARCHAR(150),
    collaborators_count INTEGER DEFAULT 0 CHECK (collaborators_count >= 0),
    description TEXT,
    sla_target VARCHAR(32) DEFAULT '99.5%',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

COMMENT ON TABLE gihs_core.sectors IS 'Estrutura departamental e organizacional da GIHS';

-- =========================================================================================
-- 4. TABELA DE USUÁRIOS, COLABORADORES & CREDENCIAIS RBAC
-- =========================================================================================
CREATE TABLE IF NOT EXISTS gihs_core.users (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(180) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255),
    role VARCHAR(120) NOT NULL,
    user_role enum_user_role NOT NULL DEFAULT 'COLABORADOR',
    hierarchy_level INTEGER DEFAULT 4 CHECK (hierarchy_level BETWEEN 1 AND 5),
    sector_id VARCHAR(64) REFERENCES gihs_core.sectors(id) ON DELETE SET NULL,
    sector_name VARCHAR(120),
    area VARCHAR(64),
    avatar_url TEXT,
    phone VARCHAR(32),
    cpf_masked VARCHAR(20),
    admission_date DATE DEFAULT CURRENT_DATE,
    contract_type enum_contract_type DEFAULT 'CLT',
    status VARCHAR(32) DEFAULT 'Em atividade',
    current_task TEXT,
    salary_bracket VARCHAR(64),
    work_schedule VARCHAR(120) DEFAULT '08:00 - 18:00 (Segunda a Sexta)',
    emergency_contact VARCHAR(120),
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    is_blocked BOOLEAN DEFAULT FALSE NOT NULL,
    must_change_password BOOLEAN DEFAULT FALSE,

    -- Biometria Facial para Ponto Eletrônico e Acesso Seguro (Portaria 671 MTE)
    facial_active BOOLEAN DEFAULT FALSE NOT NULL,
    facial_photo_url TEXT,
    facial_biometric_hash VARCHAR(128),
    facial_landmarks_count INTEGER DEFAULT 68 CHECK (facial_landmarks_count >= 0),
    facial_confidence_score NUMERIC(5,2) DEFAULT 99.40 CHECK (facial_confidence_score BETWEEN 0.00 AND 100.00),
    facial_registered_at TIMESTAMP WITH TIME ZONE,
    facial_notes TEXT,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

COMMENT ON TABLE gihs_core.users IS 'Usuários corporativos, papéis RBAC e template biométrico facial';

-- =========================================================================================
-- 5. TABELA DE PONTO ELETRÔNICO (PORTARIA 671/2021 MTE - REP-P)
-- =========================================================================================
CREATE TABLE IF NOT EXISTS gihs_core.ponto_records (
    id VARCHAR(64) PRIMARY KEY,
    nsr VARCHAR(64) NOT NULL UNIQUE, -- Número Sequencial de Registro inviolável
    user_id VARCHAR(64) NOT NULL REFERENCES gihs_core.users(id) ON DELETE CASCADE,
    collaborator_name VARCHAR(180) NOT NULL,
    collaborator_matricula VARCHAR(64),
    collaborator_sector VARCHAR(120),
    type enum_ponto_type NOT NULL,
    punch_date DATE NOT NULL,
    punch_time TIME NOT NULL,
    unix_timestamp BIGINT NOT NULL,

    -- Integridade Criptográfica e Evidência Facial
    photo_url TEXT,
    biometric_match_confidence NUMERIC(5,2) CHECK (biometric_match_confidence BETWEEN 0.00 AND 100.00),
    sha256_hash VARCHAR(128) NOT NULL, -- Hash assinado: NSR|timestamp|matricula|tipo|ip|coords

    -- Telemetria de Dispositivo e Geolocalização
    device_type VARCHAR(32) DEFAULT 'Desktop',
    device_details VARCHAR(255),
    ip_address VARCHAR(45) NOT NULL,
    isp_provider VARCHAR(120),
    latitude NUMERIC(10, 7),
    longitude NUMERIC(10, 7),
    accuracy_meters NUMERIC(8, 2),
    approximate_address TEXT,
    city VARCHAR(100) DEFAULT 'São Paulo',
    state VARCHAR(50) DEFAULT 'SP',
    country VARCHAR(50) DEFAULT 'Brasil',

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

COMMENT ON TABLE gihs_core.ponto_records IS 'Registros fiscais de jornada de trabalho auditáveis conforme Portaria 671 MTE';

-- =========================================================================================
-- 6. TABELA DE CHAMADOS TÉCNICOS & SUPORTE (HELP DESK N1/N2/N3)
-- =========================================================================================
CREATE TABLE IF NOT EXISTS gihs_core.tickets (
    id VARCHAR(64) PRIMARY KEY,
    protocol VARCHAR(64) NOT NULL UNIQUE,
    client VARCHAR(180) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    description TEXT,
    sector VARCHAR(64) NOT NULL, -- 'N1', 'N2', 'N3', 'Cyber Security', 'DBA', 'Infra'
    priority enum_ticket_priority NOT NULL DEFAULT 'MEDIA',
    status enum_ticket_status NOT NULL DEFAULT 'ABERTO',
    assigned_to VARCHAR(180),
    assigned_user_id VARCHAR(64) REFERENCES gihs_core.users(id) ON DELETE SET NULL,
    assigned_avatar TEXT,
    requester_name VARCHAR(180),
    requester_email VARCHAR(255),
    contact_email VARCHAR(255),
    open_time VARCHAR(64),
    sla_hours INTEGER DEFAULT 4 CHECK (sla_hours > 0),
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by VARCHAR(180),
    resolution_summary TEXT,
    participant_collaborator VARCHAR(180),
    participant_user_id VARCHAR(64) REFERENCES gihs_core.users(id) ON DELETE SET NULL,
    participant_avatar TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

COMMENT ON TABLE gihs_core.tickets IS 'Central de chamados corporativos e ordens de serviço de TI';

-- =========================================================================================
-- 7. TABELA DE HISTÓRICO DE AUDITORIA DE CHAMADOS
-- =========================================================================================
CREATE TABLE IF NOT EXISTS gihs_core.ticket_history (
    id VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    ticket_id VARCHAR(64) NOT NULL REFERENCES gihs_core.tickets(id) ON DELETE CASCADE,
    action VARCHAR(120) NOT NULL,
    user_name VARCHAR(180) NOT NULL,
    user_sector VARCHAR(120),
    details TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- =========================================================================================
-- 8. TABELA DE EQUIPAMENTOS, ATIVOS DE TI & PATRIMÔNIO
-- =========================================================================================
CREATE TABLE IF NOT EXISTS gihs_core.equipment (
    id VARCHAR(64) PRIMARY KEY,
    patrimony_tag VARCHAR(64) NOT NULL UNIQUE,
    barcode VARCHAR(64),
    name VARCHAR(180) NOT NULL,
    category VARCHAR(64) NOT NULL, -- 'Notebook', 'Desktop', 'Monitor', 'Servidor', 'Rede', 'Mobiliario'
    model VARCHAR(180),
    serial_number VARCHAR(120),
    assigned_user_id VARCHAR(64) REFERENCES gihs_core.users(id) ON DELETE SET NULL,
    assigned_user_name VARCHAR(180),
    sector VARCHAR(64),
    status enum_equipment_status NOT NULL DEFAULT 'OPERACIONAL',
    acquisition_date DATE,
    delivery_date DATE,
    warranty_until DATE,
    value_brl NUMERIC(12,2) DEFAULT 0.00 CHECK (value_brl >= 0),
    specifications JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

COMMENT ON TABLE gihs_core.equipment IS 'Inventário de hardware corporativo, patrimônio físico e ciclo de vida';

-- =========================================================================================
-- 9. TABELA DE TAREFAS & QUADROS KANBAN (GESTÃO DE PROJETOS)
-- =========================================================================================
CREATE TABLE IF NOT EXISTS gihs_core.tasks (
    id VARCHAR(64) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    sector VARCHAR(64) NOT NULL,
    assignee_id VARCHAR(64) REFERENCES gihs_core.users(id) ON DELETE SET NULL,
    assignee_name VARCHAR(180) NOT NULL,
    assignee_avatar TEXT,
    priority enum_ticket_priority NOT NULL DEFAULT 'MEDIA',
    status enum_task_status NOT NULL DEFAULT 'A_FAZER',
    deadline DATE,
    tag VARCHAR(64),
    subtasks JSONB DEFAULT '[]'::jsonb,
    is_delayed BOOLEAN DEFAULT FALSE,
    comments_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

COMMENT ON TABLE gihs_core.tasks IS 'Tarefas operacionais de equipes e itens de Kanban corporativo';

-- =========================================================================================
-- 10. TABELA DE CLIENTES CORPORATIVOS & CONTRATOS SLA
-- =========================================================================================
CREATE TABLE IF NOT EXISTS gihs_core.clients (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(180) NOT NULL UNIQUE,
    plan VARCHAR(64) DEFAULT 'Enterprise Premium',
    sla VARCHAR(32) DEFAULT '99.9%',
    open_tickets INTEGER DEFAULT 0,
    monthly_value NUMERIC(12,2) DEFAULT 0.00,
    contact_name VARCHAR(120),
    contact_email VARCHAR(255),
    contact_phone VARCHAR(32),
    status VARCHAR(32) DEFAULT 'Ativo',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

COMMENT ON TABLE gihs_core.clients IS 'Contratos de clientes corporativos sob governança da GIHS';

-- =========================================================================================
-- 11. TABELA DE AGENDA EXECUTIVA & REUNIÕES DE GOVERNANÇA
-- =========================================================================================
CREATE TABLE IF NOT EXISTS gihs_core.calendar_events (
    id VARCHAR(64) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    event_date DATE NOT NULL,
    time_slot VARCHAR(64) NOT NULL,
    duration VARCHAR(32) DEFAULT '1h',
    sector VARCHAR(64) NOT NULL,
    type VARCHAR(32) DEFAULT 'Reunião',
    location VARCHAR(180),
    attendees JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

COMMENT ON TABLE gihs_core.calendar_events IS 'Eventos, alinhamentos semanais e comitês de diretoria';

-- =========================================================================================
-- 12. TABELA DE BASE DE CONHECIMENTO TÉCNICA (KNOWLEDGE BASE)
-- =========================================================================================
CREATE TABLE IF NOT EXISTS gihs_core.knowledge_articles (
    id VARCHAR(64) PRIMARY KEY,
    code VARCHAR(32) NOT NULL UNIQUE,
    title VARCHAR(255) NOT NULL,
    sector VARCHAR(64) NOT NULL,
    category VARCHAR(64) NOT NULL,
    service_type VARCHAR(120),
    summary_solution TEXT NOT NULL,
    detailed_procedure JSONB DEFAULT '[]'::jsonb,
    estimated_resolution_minutes INTEGER DEFAULT 15,
    tags JSONB DEFAULT '[]'::jsonb,
    useful_count INTEGER DEFAULT 0,
    author VARCHAR(180),
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

COMMENT ON TABLE gihs_core.knowledge_articles IS 'Procedimentos padrão e resoluções para Help Desk N1 a N3';

-- =========================================================================================
-- 13. TABELA DE LOGS DE AUDITORIA & SEGURANÇA (AUDIT TRAIL IMUTÁVEL)
-- =========================================================================================
CREATE TABLE IF NOT EXISTS gihs_core.audit_logs (
    id VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id VARCHAR(64) REFERENCES gihs_core.users(id) ON DELETE SET NULL,
    user_name VARCHAR(180) NOT NULL,
    action VARCHAR(120) NOT NULL,
    category VARCHAR(64) NOT NULL, -- 'AUTH', 'PONTO', 'USERS', 'TICKETS', 'EQUIPMENT', 'SETTINGS', 'DBA'
    severity VARCHAR(32) DEFAULT 'Info', -- 'Info', 'Warning', 'Critical'
    ip_address VARCHAR(45) NOT NULL,
    user_agent TEXT,
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

COMMENT ON TABLE gihs_core.audit_logs IS 'Trilha de auditoria imutável para compliance LGPD e governança corporativa';

-- =========================================================================================
-- 14. TABELA DE TELEMETRIA E EXECUÇÕES DE IA (GIHS AGENTS)
-- =========================================================================================
CREATE TABLE IF NOT EXISTS gihs_core.agent_executions (
    id VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    agent_name VARCHAR(120) NOT NULL,
    task_category VARCHAR(64) NOT NULL,
    input_prompt TEXT,
    output_result TEXT,
    tokens_used INTEGER DEFAULT 0,
    latency_ms INTEGER DEFAULT 0,
    status VARCHAR(32) DEFAULT 'SUCCESS',
    triggered_by VARCHAR(64) REFERENCES gihs_core.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

COMMENT ON TABLE gihs_core.agent_executions IS 'Registro de chamadas aos agentes de inteligência artificial da plataforma';

-- =========================================================================================
-- 15. TABELA DE CONFIGURAÇÕES DE SISTEMA (SISTEMA & DBA)
-- =========================================================================================
CREATE TABLE IF NOT EXISTS gihs_core.system_settings (
    key VARCHAR(64) PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- =========================================================================================
-- 16. ÍNDICES DE ALTA PERFORMANCE PARA O DBA
-- =========================================================================================
CREATE INDEX IF NOT EXISTS idx_users_email ON gihs_core.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON gihs_core.users(user_role);
CREATE INDEX IF NOT EXISTS idx_users_sector ON gihs_core.users(sector_id);
CREATE INDEX IF NOT EXISTS idx_users_facial ON gihs_core.users(facial_active);

CREATE INDEX IF NOT EXISTS idx_ponto_user_date ON gihs_core.ponto_records(user_id, punch_date);
CREATE INDEX IF NOT EXISTS idx_ponto_timestamp ON gihs_core.ponto_records(unix_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_ponto_nsr ON gihs_core.ponto_records(nsr);

CREATE INDEX IF NOT EXISTS idx_tickets_status ON gihs_core.tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_priority ON gihs_core.tickets(priority);
CREATE INDEX IF NOT EXISTS idx_tickets_sector ON gihs_core.tickets(sector);
CREATE INDEX IF NOT EXISTS idx_tickets_assigned ON gihs_core.tickets(assigned_user_id);

CREATE INDEX IF NOT EXISTS idx_equipment_tag ON gihs_core.equipment(patrimony_tag);
CREATE INDEX IF NOT EXISTS idx_equipment_status ON gihs_core.equipment(status);

CREATE INDEX IF NOT EXISTS idx_tasks_status ON gihs_core.tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON gihs_core.tasks(assignee_id);
CREATE INDEX IF NOT EXISTS idx_tasks_deadline ON gihs_core.tasks(deadline);

CREATE INDEX IF NOT EXISTS idx_audit_created ON gihs_core.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_category ON gihs_core.audit_logs(category);
CREATE INDEX IF NOT EXISTS idx_audit_user ON gihs_core.audit_logs(user_id);

CREATE INDEX IF NOT EXISTS idx_agent_created ON gihs_core.agent_executions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_name ON gihs_core.agent_executions(agent_name);

-- =========================================================================================
-- 17. ATIVAÇÃO DE TRIGGERS AUTOMÁTICOS DE UPDATED_AT
-- =========================================================================================
DROP TRIGGER IF EXISTS trg_set_timestamp_sectors ON gihs_core.sectors;
CREATE TRIGGER trg_set_timestamp_sectors
BEFORE UPDATE ON gihs_core.sectors
FOR EACH ROW EXECUTE FUNCTION gihs_core.fn_set_timestamp();

DROP TRIGGER IF EXISTS trg_set_timestamp_users ON gihs_core.users;
CREATE TRIGGER trg_set_timestamp_users
BEFORE UPDATE ON gihs_core.users
FOR EACH ROW EXECUTE FUNCTION gihs_core.fn_set_timestamp();

DROP TRIGGER IF EXISTS trg_set_timestamp_tickets ON gihs_core.tickets;
CREATE TRIGGER trg_set_timestamp_tickets
BEFORE UPDATE ON gihs_core.tickets
FOR EACH ROW EXECUTE FUNCTION gihs_core.fn_set_timestamp();

DROP TRIGGER IF EXISTS trg_set_timestamp_equipment ON gihs_core.equipment;
CREATE TRIGGER trg_set_timestamp_equipment
BEFORE UPDATE ON gihs_core.equipment
FOR EACH ROW EXECUTE FUNCTION gihs_core.fn_set_timestamp();

DROP TRIGGER IF EXISTS trg_set_timestamp_tasks ON gihs_core.tasks;
CREATE TRIGGER trg_set_timestamp_tasks
BEFORE UPDATE ON gihs_core.tasks
FOR EACH ROW EXECUTE FUNCTION gihs_core.fn_set_timestamp();

DROP TRIGGER IF EXISTS trg_set_timestamp_clients ON gihs_core.clients;
CREATE TRIGGER trg_set_timestamp_clients
BEFORE UPDATE ON gihs_core.clients
FOR EACH ROW EXECUTE FUNCTION gihs_core.fn_set_timestamp();

DROP TRIGGER IF EXISTS trg_set_timestamp_calendar ON gihs_core.calendar_events;
CREATE TRIGGER trg_set_timestamp_calendar
BEFORE UPDATE ON gihs_core.calendar_events
FOR EACH ROW EXECUTE FUNCTION gihs_core.fn_set_timestamp();

-- =========================================================================================
-- 18. SEED INICIAL DE DADOS ESSENCIAIS (BOOTSTRAP DO DBA)
-- =========================================================================================

-- Inserção de Setores Oficiais
INSERT INTO gihs_core.sectors (id, code, name, area, leader_name, collaborators_count, description, sla_target)
VALUES
    ('sec-1', 'SEC-N1', 'N1', 'SUPORTE', 'Líder Suporte N1', 1, 'Triagem, primeiro contato e atendimento ao usuário', '99.0%'),
    ('sec-2', 'SEC-N2', 'N2', 'SUPORTE', 'Líder Suporte N2', 1, 'Resolução técnica avançada de redes, sistemas e SO', '97.5%'),
    ('sec-3', 'SEC-N3', 'N3', 'SUPORTE', 'Líder Suporte N3', 1, 'Infraestrutura crítica, switches core e telecom', '98.5%'),
    ('sec-4', 'SEC-FE', 'Front-End', 'DESENVOLVIMENTO', 'Líder Front-End', 1, 'Aplicações web, interfaces do usuário e mobile', '99.5%'),
    ('sec-5', 'SEC-BE', 'Back-End', 'DESENVOLVIMENTO', 'Líder Back-End', 1, 'Microsserviços, APIs REST/gRPC e banco de dados', '99.0%'),
    ('sec-6', 'SEC-CYBER', 'Cyber Security', 'SEGURANCA', 'Líder Cyber Security', 1, 'SOC, pentest, conformidade LGPD e firewall', '99.9%'),
    ('sec-7', 'SEC-DBA', 'DBA', 'DADOS', 'Líder DBA', 1, 'Bancos de dados relacionais e NoSQL, backups e tuning', '99.8%'),
    ('sec-8', 'SEC-RH', 'RH', 'ADMINISTRATIVO', 'Líder RH', 1, 'Recrutamento, DP, benefícios e clima organizacional', '99.0%'),
    ('sec-9', 'SEC-FIN', 'Financeiro', 'ADMINISTRATIVO', 'Líder Financeiro', 1, 'Contas a pagar/receber e faturamento corporativo', '99.5%'),
    ('sec-10', 'SEC-GES', 'Gestão', 'GESTAO', 'Victor (Master Admin)', 1, 'Diretoria executiva e governança corporativa', '100%'),
    ('sec-11', 'SEC-PAT', 'Patrimônio', 'ADMINISTRATIVO', 'Líder Patrimônio', 1, 'Facilities, controle de equipamentos e contratos', '98.0%')
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    area = EXCLUDED.area,
    description = EXCLUDED.description;

-- =========================================================================================
-- 18. SEED INICIAL DOS 4 USUÁRIOS MASTERS CORPORATIVOS (MAIOR NÍVEL DE PRIVILÉGIO)
-- =========================================================================================

-- Inserção dos 4 Usuários Masters no PostgreSQL
INSERT INTO gihs_core.users (
    id, name, email, password_hash, role, user_role, hierarchy_level,
    sector_id, sector_name, area,
    avatar_url, phone, admission_date, contract_type, status,
    current_task, salary_bracket, work_schedule, emergency_contact,
    facial_active, facial_confidence_score, facial_registered_at
) VALUES 
    -- 1. Victor Hugo
    (
        'user-master-victor-hugo',
        'Victor Hugo',
        'victor.hugo@bycomp.com.br',
        'pbkdf2$100000$4dfde217f5f41cc7fa2fd29a451080ab$78d21a44d9685aeb150ca12784d42b4a02335c51a31761295f97b5c01e7743bbbf7898b6925058a3f8d40c46c862631066ab00dcb8c3552bcc2cfc1b55dbc2e3',
        'Diretor Geral & Super Administrador Master',
        'SUPER_ADMIN',
        1,
        'sec-10',
        'Gestão',
        'GESTAO',
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
        '(11) 98765-4321',
        '2021-01-10',
        'PJ',
        'Em atividade',
        'Governança Corporativa e Gestão Estratégica Global',
        'Diretoria Executiva',
        'Dedicação Exclusiva / Flexível',
        '(11) 98888-0001',
        TRUE,
        99.40,
        CURRENT_TIMESTAMP
    ),
    -- 2. Rebeca
    (
        'user-master-rebeca',
        'Rebeca',
        'rebeca@bycomp.com.br',
        'pbkdf2$100000$7bb47f6a59d5ab011c0054f401bcd3e2$268e424903f3db0e9caa567285a98a79080fcb62e716843a0af269eedaac2ba2aa09c72d50da010f554e7e4f4131d6a0ec9a026ad63653f40a222da62b5e0e2f',
        'Diretora Executiva & Super Administradora Master',
        'SUPER_ADMIN',
        1,
        'sec-10',
        'Gestão',
        'GESTAO',
        'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&auto=format&fit=crop&q=80',
        '(11) 98765-4322',
        '2021-02-15',
        'PJ',
        'Em atividade',
        'Gestão Executiva de Operações e Governança GIHS',
        'Diretoria Executiva',
        'Dedicação Exclusiva / Flexível',
        '(11) 98888-0002',
        TRUE,
        99.40,
        CURRENT_TIMESTAMP
    ),
    -- 3. Victor Martins
    (
        'user-master-victor-martins',
        'Victor Martins',
        'Victor.martins@bycomp.com.br',
        'pbkdf2$100000$7bb47f6a59d5ab011c0054f401bcd3e2$268e424903f3db0e9caa567285a98a79080fcb62e716843a0af269eedaac2ba2aa09c72d50da010f554e7e4f4131d6a0ec9a026ad63653f40a222da62b5e0e2f',
        'Tech Lead Executivo & Super Administrador Master',
        'SUPER_ADMIN',
        1,
        'sec-10',
        'Gestão',
        'GESTAO',
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
        '(11) 98765-4323',
        '2021-03-20',
        'PJ',
        'Em atividade',
        'Supervisão Arquitetural de Engenharia e Segurança',
        'Diretoria Executiva',
        'Dedicação Exclusiva / Flexível',
        '(11) 98888-0003',
        TRUE,
        99.40,
        CURRENT_TIMESTAMP
    ),
    -- 4. Matheus
    (
        'user-master-matheus',
        'Matheus',
        'Matheus@bycomp.com.br',
        'pbkdf2$100000$7bb47f6a59d5ab011c0054f401bcd3e2$268e424903f3db0e9caa567285a98a79080fcb62e716843a0af269eedaac2ba2aa09c72d50da010f554e7e4f4131d6a0ec9a026ad63653f40a222da62b5e0e2f',
        'Head de Inteligência & Super Administrador Master',
        'SUPER_ADMIN',
        1,
        'sec-10',
        'Gestão',
        'GESTAO',
        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80',
        '(11) 98765-4324',
        '2021-04-01',
        'PJ',
        'Em atividade',
        'Governança de IA, Dados e Plataformas Corporativas',
        'Diretoria Executiva',
        'Dedicação Exclusiva / Flexível',
        '(11) 98888-0004',
        TRUE,
        99.40,
        CURRENT_TIMESTAMP
    )
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    password_hash = EXCLUDED.password_hash,
    role = EXCLUDED.role,
    user_role = EXCLUDED.user_role,
    hierarchy_level = EXCLUDED.hierarchy_level,
    sector_name = EXCLUDED.sector_name,
    area = EXCLUDED.area,
    facial_active = EXCLUDED.facial_active,
    updated_at = CURRENT_TIMESTAMP;

-- Inserção das Configurações do Sistema
INSERT INTO gihs_core.system_settings (key, value, description)
VALUES 
    ('database_provider', '{"active": "POSTGRESQL", "label": "PostgreSQL 16+ Oficial", "mode": "STRICT_POSTGRES"}'::jsonb, 'Motor de banco de dados ativo'),
    ('ponto_tolerance_minutes', '{"minutes": 10}'::jsonb, 'Tolerância legal da Portaria 671 MTE'),
    ('facial_biometric_threshold', '{"min_confidence": 95.0}'::jsonb, 'Score mínimo de confiança para validação facial')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- Preservação permanente da tabela de equipamentos e ativos
-- Nenhuma exclusão em cascata deve ser executada automaticamente

-- =========================================================================================
-- 19. VIEWS ANALÍTICAS EXECUTIVAS PARA CONSULTA DO DBA
-- =========================================================================================

-- View 1: Resumo Diário de Ponto Eletrônico e Horas Trabalhadas
CREATE OR REPLACE VIEW gihs_core.vw_daily_ponto_summary AS
SELECT 
    pr.punch_date,
    pr.user_id,
    pr.collaborator_name,
    pr.collaborator_sector,
    COUNT(pr.id) as total_punches,
    MIN(pr.punch_time) as first_punch,
    MAX(pr.punch_time) as last_punch,
    CASE 
        WHEN COUNT(pr.id) >= 4 THEN 'Jornada Completa'
        WHEN COUNT(pr.id) BETWEEN 1 AND 3 THEN 'Em Andamento / Incompleta'
        ELSE 'Sem Registros'
    END as status_jornada
FROM gihs_core.ponto_records pr
GROUP BY pr.punch_date, pr.user_id, pr.collaborator_name, pr.collaborator_sector;

-- View 2: Painel de Indicadores de SLA de Chamados por Setor
CREATE OR REPLACE VIEW gihs_core.vw_sla_tickets_summary AS
SELECT 
    sector,
    COUNT(id) as total_tickets,
    COUNT(CASE WHEN status = 'RESOLVIDO' THEN 1 END) as resolved_tickets,
    COUNT(CASE WHEN status IN ('ABERTO', 'EM_ATENDIMENTO') THEN 1 END) as pending_tickets,
    ROUND(AVG(sla_hours), 1) as avg_sla_hours
FROM gihs_core.tickets
GROUP BY sector;

-- Finalização
GRANT USAGE ON SCHEMA gihs_core TO CURRENT_USER;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA gihs_core TO CURRENT_USER;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA gihs_core TO CURRENT_USER;
