import pg from 'pg';
import { maskDatabaseUrl } from './security.ts';

const { Pool } = pg;

/**
 * Resolução segura da URL de conexão do PostgreSQL.
 * Assegura que nenhuma senha fique gravada em texto puro no código-fonte.
 * A senha é resolvida dinamicamente através das variáveis de ambiente protegidas:
 * DATABASE_URL, POSTGRES_URL, PGPASSWORD ou DB_PASSWORD.
 */
function resolveDatabaseUrl(): string {
  const envUrl = (process.env.DATABASE_URL || process.env.POSTGRES_URL || '').trim();
  
  // 1. Se foi informada a URI completa do PostgreSQL
  if (envUrl.startsWith('postgresql://') || envUrl.startsWith('postgres://')) {
    return envUrl;
  }
  
  // 2. Se a variável de ambiente contiver a senha do banco de dados (ex: injetada via Cloud Run / secrets)
  const dbPassword = envUrl || process.env.PGPASSWORD || process.env.DB_PASSWORD || process.env.POSTGRES_PASSWORD || '';
  const dbUser = process.env.PGUSER || process.env.DB_USER || 'postgres';
  const dbHost = process.env.PGHOST || process.env.DB_HOST || 'db.pkigjnoclcsmsmztewap.supabase.co';
  const dbPort = process.env.PGPORT || process.env.DB_PORT || '5432';
  const dbName = process.env.PGDATABASE || process.env.DB_NAME || 'postgres';

  if (dbPassword) {
    return `postgresql://${encodeURIComponent(dbUser)}:${encodeURIComponent(dbPassword)}@${dbHost}:${dbPort}/${dbName}`;
  }

  // 3. Fallback seguro de desenvolvimento local (sem senhas de produção expostas no código)
  return `postgresql://${encodeURIComponent(dbUser)}@${dbHost}:${dbPort}/${dbName}`;
}

const databaseUrl = resolveDatabaseUrl();

// Registra inicialização com proteção estrita de credenciais
if (process.env.NODE_ENV !== 'production') {
  console.log(`[Cyber-Security] Inicializando pool PostgreSQL: ${maskDatabaseUrl(databaseUrl)}`);
}

export const pool = new Pool({
  connectionString: databaseUrl,
  ssl: { rejectUnauthorized: false },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  family: 4, // Força IPv4 para compatibilidade com gateways e nuvem
} as any);

// Configure search_path to automatically resolve gihs_core schema
pool.on('connect', (client) => {
  client.query('SET search_path TO gihs_core, public;').catch((err) => {
    console.error('[Cyber-Security] Error setting search_path on client connection:', err?.message);
  });
});

pool.on('error', (err) => {
  console.error('[Cyber-Security] Unexpected error on idle PostgreSQL client pool:', err?.message);
});

export async function query<T = any>(text: string, params?: any[]): Promise<pg.QueryResult<T>> {
  const start = Date.now();
  try {
    const res = await pool.query<T>(text, params);
    const duration = Date.now() - start;
    if (process.env.NODE_ENV !== 'production' && duration > 500) {
      console.warn(`[Cyber-Security] Slow parameterized query executed in ${duration}ms: ${text.slice(0, 80)}...`);
    }
    return res;
  } catch (error: any) {
    // Sanitiza qualquer menção a senhas ou URLs em erros
    const sanitizedMsg = maskDatabaseUrl(error?.message || '');
    console.error('[Cyber-Security] Database query execution error:', sanitizedMsg, 'Query:', text.slice(0, 100));
    throw new Error(sanitizedMsg);
  }
}

/**
 * Health-check probe for PostgreSQL connectivity with masked security reporting
 */
export async function checkDatabaseConnection(): Promise<{ connected: boolean; latencyMs: number; version?: string; endpointMasked?: string; error?: string }> {
  const start = Date.now();

  try {
    const res = await pool.query('SELECT version() as version, NOW() as current_time;');
    const latencyMs = Date.now() - start;
    return {
      connected: true,
      latencyMs,
      endpointMasked: maskDatabaseUrl(databaseUrl),
      version: res.rows[0]?.version || 'PostgreSQL (Active)',
    };
  } catch (err: any) {
    const safeError = maskDatabaseUrl(err?.message || 'Falha ao conectar ao servidor PostgreSQL (inacessível ou credencial pendente).');
    return {
      connected: false,
      latencyMs: Date.now() - start,
      endpointMasked: maskDatabaseUrl(databaseUrl),
      error: safeError,
    };
  }
}

export default pool;
