import { query } from '../server/db.ts';
import fs from 'fs';
import path from 'path';

async function dumpTableData(tableName: string) {
  const res = await query(`SELECT * FROM "gihs_core"."${tableName}" ORDER BY 1 ASC;`);
  if (!res.rows || res.rows.length === 0) return '';
  
  const cols = Object.keys(res.rows[0]);
  const colList = cols.map(c => `"${c}"`).join(', ');
  
  const values = res.rows.map(row => {
    const vals = cols.map(c => {
      const val = row[c];
      if (val === null || val === undefined) return 'NULL';
      if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
      if (typeof val === 'number') return String(val);
      if (typeof val === 'object') {
        if (val instanceof Date) return `'${val.toISOString()}'`;
        return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
      }
      return `'${String(val).replace(/'/g, "''")}'`;
    });
    return `(${vals.join(', ')})`;
  });

  return `\n-- =========================================================================\n` +
    `-- DADOS DA TABELA: gihs_core.${tableName} (${res.rows.length} registros sincronizados)\n` +
    `-- =========================================================================\n` +
    `INSERT INTO gihs_core."${tableName}" (${colList})\nVALUES\n  ` +
    values.join(',\n  ') +
    '\nON CONFLICT DO NOTHING;\n';
}

async function run() {
  const tables = [
    'sectors',
    'users',
    'system_settings',
    'equipment',
    'corporate_vehicles',
    'tasks',
    'knowledge_articles',
    'clients',
    'calendar_events',
    'on_call_shifts',
    'device_assignments',
    'vehicle_trips',
    'vehicle_route_points',
    'ponto_records',
    'tickets',
    'ticket_history',
    'audit_logs',
    'agent_executions'
  ];

  console.log('Iniciando exportação dos dados do Supabase...');
  let dataSql = '';
  for (const t of tables) {
    try {
      const tableSql = await dumpTableData(t);
      if (tableSql) {
        dataSql += tableSql;
        console.log(`[OK] Tabela gihs_core.${t} exportada.`);
      } else {
        console.log(`[Vazia] Tabela gihs_core.${t} (0 registros).`);
      }
    } catch (e: any) {
      console.warn(`[Aviso] Falha ao exportar tabela ${t}:`, e.message);
    }
  }

  // Header and Schema DDL
  const schemaPath = path.resolve('server', 'schema.sql');
  const baseDdl = fs.readFileSync(schemaPath, 'utf8');

  // Migrations DDL
  const mig1 = fs.readFileSync(path.resolve('server', 'migrations', '20260930_mobility_and_oncall.sql'), 'utf8');
  const mig2 = fs.readFileSync(path.resolve('server', 'migrations', '20260930_mobility_geoloc_and_vehicle_km.sql'), 'utf8');

  const fullDump = `-- =========================================================================================
-- GIHS SYSTEM — DUMP COMPLETO DO BANCO DE DADOS POSTGRESQL / SUPABASE
-- =========================================================================================
-- PROJETO SUPABASE: GIHS SYSTEM (GIHS Enterprise Intelligence & Systems)
-- SUPABASE PROJECT REF: pkigjnoclcsmsmztewap
-- HOST DO BANCO: db.pkigjnoclcsmsmztewap.supabase.co
-- PORTA PADRÃO: 5432
-- DATABASE: postgres
-- SCHEMA PRINCIPAL: gihs_core (com fallback public)
-- VERSÃO SUPABASE: PostgreSQL 17.6
-- GERADO EM: ${new Date().toISOString()} (UTC)
-- =========================================================================================
-- INSTRUÇÕES DE EXECUÇÃO LOCAL (DOCKER / PSQL / SUPABASE CLI):
--
-- 1. Via Docker (PostgreSQL 16 ou 17):
--    docker run -d --name gihs-postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=postgres -p 5432:5432 postgres:17
--    psql -h localhost -p 5432 -U postgres -d postgres -f gihs_supabase_complete_database.sql
--
-- 2. Via Supabase CLI Local:
--    supabase db reset
--    psql -h localhost -p 54322 -U postgres -d postgres -f gihs_supabase_complete_database.sql
--
-- 3. Via psql local:
--    psql "postgresql://postgres:postgres@localhost:5432/postgres" -f gihs_supabase_complete_database.sql
-- =========================================================================================

-- Início da transação atômica
BEGIN;

-- =========================================================================================
-- PARTE 1: ESTRUTURA DDL, SCHEMAS, ENUMS, EXTENSÕES E TABELAS BASE
-- =========================================================================================

${baseDdl}

-- =========================================================================================
-- PARTE 2: TABELAS E EVOLUÇÕES DE MOBILIDADE, PLANTÕES E RASTREAMENTO
-- =========================================================================================

${mig1}

${mig2}

-- =========================================================================================
-- PARTE 3: DADOS REAIS & SEEDS EXPORTADOS DO SUPABASE
-- =========================================================================================

${dataSql}

-- =========================================================================================
-- PARTE 4: ATUALIZAÇÃO FINAL DE PERMISSÕES & BUSCA DO SCHEMA
-- =========================================================================================
ALTER SCHEMA gihs_core OWNER TO postgres;
GRANT ALL ON SCHEMA gihs_core TO postgres;
GRANT ALL ON ALL TABLES IN SCHEMA gihs_core TO postgres;
GRANT ALL ON ALL SEQUENCES IN SCHEMA gihs_core TO postgres;
GRANT ALL ON ALL ROUTINES IN SCHEMA gihs_core TO postgres;

SET search_path TO gihs_core, public;

COMMIT;

-- =========================================================================================
-- FIM DO DUMP COMPLETO — BANCO DE DADOS GIHS SYSTEM PRONTO PARA EXECUÇÃO LOCAL
-- =========================================================================================
`;

  // Write to public/ for direct download in browser
  const publicOutPath = path.resolve('public', 'gihs_supabase_complete_database.sql');
  fs.writeFileSync(publicOutPath, fullDump, 'utf8');

  // Write to server/ for server-side persistence
  const serverOutPath = path.resolve('server', 'gihs_supabase_complete_database.sql');
  fs.writeFileSync(serverOutPath, fullDump, 'utf8');

  console.log(`[Sucesso] Dump completo gerado com ${fullDump.length} bytes.`);
  console.log(`Salvo em: ${publicOutPath}`);
  console.log(`Salvo em: ${serverOutPath}`);
}

run().then(() => process.exit(0)).catch(e => { console.error('Erro na exportação:', e); process.exit(1); });
