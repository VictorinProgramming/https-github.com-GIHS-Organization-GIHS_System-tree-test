import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { query, checkDatabaseConnection } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function runDatabaseMigration(): Promise<{ success: boolean; message: string; appliedStatements?: number; error?: string }> {
  const dbStatus = await checkDatabaseConnection();
  if (!dbStatus.connected) {
    return {
      success: false,
      message: 'PostgreSQL database is currently offline or unreachable.',
      error: dbStatus.error,
    };
  }

  try {
    const schemaPath = path.resolve(__dirname, 'schema.sql');
    if (!fs.existsSync(schemaPath)) {
      return {
        success: false,
        message: `Schema file not found at ${schemaPath}`,
      };
    }

    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    // Execute the complete schema creation script in a single transactional query
    await query('BEGIN;');
    await query(schemaSql);
    await query('COMMIT;');

    console.log('[GIHS Database Migration] Schema DDL successfully applied to PostgreSQL.');
    return {
      success: true,
      message: 'Esquema PostgreSQL (tabelas, índices, triggers) aplicado com sucesso.',
    };
  } catch (error: any) {
    await query('ROLLBACK;').catch(() => {});
    console.error('[GIHS Database Migration] Error applying migration:', error);
    return {
      success: false,
      message: 'Erro durante a execução do script DDL de migração.',
      error: error.message,
    };
  }
}
