import crypto from 'crypto';
import { query } from './db.ts';

// =========================================================================
// 1. CRIPTOGRAFIA ROBUSTA DE SENHAS (PBKDF2 COM SALT DE 128 BITS & SHA-512)
// =========================================================================

const PBKDF2_ITERATIONS = 100000;
const KEY_LENGTH = 64; // 512 bits
const DIGEST = 'sha512';

/**
 * Valida os requisitos mandatórios corporativos de Cyber-Security para senhas:
 * 1. Mínimo 8 dígitos / caracteres
 * 2. Mínimo 1 caractere especial (!@#$%&*_-...)
 * 3. Mínimo 1 número (0-9)
 * 4. A senha deverá ser forte (complexidade e ausência de sequências óbvias)
 */
export function validatePasswordRules(password: string): {
  isValid: boolean;
  errors: string[];
  strength: 'FRACA' | 'MEDIA' | 'FORTE' | 'MUITO_FORTE';
} {
  const errors: string[] = [];
  if (!password || typeof password !== 'string') {
    return {
      isValid: false,
      errors: ['A senha informada é inválida ou vazia.'],
      strength: 'FRACA'
    };
  }

  // 1. Mínimo 8 dígitos/caracteres
  if (password.length < 8) {
    errors.push('A senha deve conter no mínimo 8 dígitos ou caracteres.');
  }

  // 2. Mínimo 1 caractere especial
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(password);
  if (!hasSpecial) {
    errors.push('A senha deve conter pelo menos 1 caractere especial (ex: !@#$%&*_-).');
  }

  // 3. Mínimo 1 número
  const hasNumber = /\d/.test(password);
  if (!hasNumber) {
    errors.push('A senha deve conter pelo menos 1 número (0 a 9).');
  }

  // 4. Verificação de força e senhas comuns
  const commonWeak = ['12345678', '123456789', 'password', 'senha123', 'admin123', 'bycomp123', 'gihs2026'];
  if (commonWeak.some(w => password.toLowerCase().includes(w))) {
    errors.push('A senha é muito fraca por conter sequências óbvias previsíveis.');
  }

  let strength: 'FRACA' | 'MEDIA' | 'FORTE' | 'MUITO_FORTE' = 'FRACA';
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);

  if (errors.length === 0) {
    if (password.length >= 10 && hasUpper && hasLower) {
      strength = 'MUITO_FORTE';
    } else if (password.length >= 8 && (hasUpper || hasLower)) {
      strength = 'FORTE';
    } else {
      strength = 'MEDIA';
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    strength
  };
}

/**
 * Gera um hash criptográfico seguro com salt aleatório exclusivo por usuário.
 * Formato padrão corporativo: pbkdf2$100000$<salt_hex>$<hash_hex>
 */
export function hashPassword(password: string): string {
  if (!password || typeof password !== 'string') {
    throw new Error('Senha inválida para geração de hash criptográfico');
  }
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, KEY_LENGTH, DIGEST);
  return `pbkdf2$${PBKDF2_ITERATIONS}$${salt}$${derivedKey.toString('hex')}`;
}

/**
 * Valida a senha informada contra o hash armazenado no banco de dados.
 * Utiliza crypto.timingSafeEqual para imunizar contra ataques de temporização (Timing Attacks).
 * Detecta se a senha antiga estava em texto puro e sinaliza necessidade de upgrade transparente.
 */
export function verifyPassword(
  passwordAttempt: string,
  storedHashOrPlain?: string | null
): { valid: boolean; needsUpgrade: boolean } {
  if (!passwordAttempt || !storedHashOrPlain) {
    return { valid: false, needsUpgrade: false };
  }

  // 1. Formato PBKDF2 moderno
  if (storedHashOrPlain.startsWith('pbkdf2$')) {
    const parts = storedHashOrPlain.split('$');
    if (parts.length === 4) {
      const iterations = parseInt(parts[1], 10) || PBKDF2_ITERATIONS;
      const salt = parts[2];
      const expectedHash = parts[3];

      try {
        const derivedKey = crypto.pbkdf2Sync(passwordAttempt, salt, iterations, KEY_LENGTH, DIGEST);
        const derivedHex = derivedKey.toString('hex');

        const bufA = Buffer.from(derivedHex, 'hex');
        const bufB = Buffer.from(expectedHash, 'hex');

        if (bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB)) {
          return { valid: true, needsUpgrade: false };
        }
      } catch {
        return { valid: false, needsUpgrade: false };
      }
    }
    return { valid: false, needsUpgrade: false };
  }

  // 2. Formato SHA-256 HMAC legado
  if (storedHashOrPlain.startsWith('sha256$')) {
    const parts = storedHashOrPlain.split('$');
    if (parts.length === 3) {
      const salt = parts[1];
      const expectedHash = parts[2];
      const derived = crypto.createHmac('sha256', salt).update(passwordAttempt).digest('hex');

      const bufA = Buffer.from(derived, 'hex');
      const bufB = Buffer.from(expectedHash, 'hex');

      if (bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB)) {
        return { valid: true, needsUpgrade: true }; // Recomenda upgrade para PBKDF2
      }
    }
    return { valid: false, needsUpgrade: false };
  }

  // 3. Fallback seguro para senha legada em texto simples (Timing-safe comparison)
  try {
    const bufAttempt = Buffer.from(passwordAttempt, 'utf8');
    const bufStored = Buffer.from(storedHashOrPlain, 'utf8');
    if (bufAttempt.length === bufStored.length && crypto.timingSafeEqual(bufAttempt, bufStored)) {
      // Senha coincide, mas precisa imediatamente ser convertida para hash seguro
      return { valid: true, needsUpgrade: true };
    }
  } catch {
    return { valid: false, needsUpgrade: false };
  }

  return { valid: false, needsUpgrade: false };
}

// =========================================================================
// 2. MASCARAMENTO & SIGILO DE CREDENCIAIS DE BANCO DE DADOS (DBA CYBER-SEC)
// =========================================================================

/**
 * Remove e mascara credenciais de URLs de conexão PostgreSQL para nunca expor
 * a senha em logs, interfaces, erros de rede ou respostas HTTP.
 */
export function maskDatabaseUrl(rawUrl?: string): string {
  if (!rawUrl) return '[CONEXÃO NÃO CONFIGURADA]';
  try {
    // Regex segura para mascarar senha em postgresql://user:password@host:port/db
    return rawUrl.replace(
      /^(postgres(?:ql)?:\/\/)([^:@]+):([^@]+)@/i,
      '$1$2:••••••••@'
    );
  } catch {
    return 'postgresql://[USUÁRIO]:••••••••@[HOST]/[BANCO]';
  }
}

// =========================================================================
// 3. SANITIZAÇÃO DE DADOS DE USUÁRIOS (DATA PRIVACY & LGPD COMPLIANCE)
// =========================================================================

/**
 * Remove campos confidenciais (hash de senha, senha temporária) antes de
 * enviar qualquer objeto de usuário para o frontend ou clientes da API.
 */
export function sanitizeUser<T extends Record<string, any>>(user: T | null | undefined): Omit<T, 'password' | 'password_hash' | 'temporary_password' | 'temporaryPassword'> | null {
  if (!user || typeof user !== 'object') return null;

  const sanitized = { ...user };
  delete sanitized.password;
  delete sanitized.password_hash;
  delete sanitized.temporary_password;
  delete sanitized.temporaryPassword;

  return sanitized;
}

export function sanitizeUserList<T extends Record<string, any>>(users: T[]): Array<Omit<T, 'password' | 'password_hash' | 'temporary_password' | 'temporaryPassword'>> {
  if (!Array.isArray(users)) return [];
  return users.map(u => sanitizeUser(u)).filter(Boolean) as any[];
}

// =========================================================================
// 4. PROTEÇÃO CONTRA FORÇA BRUTA (RATE LIMITING EM MEMÓRIA PARA AUTENTICAÇÃO)
// =========================================================================

interface LoginAttemptTracker {
  attempts: number;
  firstAttemptAt: number;
  blockedUntil?: number;
}

const loginAttempts = new Map<string, LoginAttemptTracker>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 5 * 60 * 1000; // 5 minutos
const BLOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutos de bloqueio após 5 falhas

/**
 * Verifica se um endereço IP ou e-mail está temporariamente bloqueado por força bruta.
 */
export function checkRateLimit(key: string): { allowed: boolean; retryAfterSeconds?: number } {
  const cleanKey = key.trim().toLowerCase();
  const now = Date.now();
  const record = loginAttempts.get(cleanKey);

  if (!record) return { allowed: true };

  // Verifica se o bloqueio ativo ainda expira
  if (record.blockedUntil && record.blockedUntil > now) {
    const remainingSeconds = Math.ceil((record.blockedUntil - now) / 1000);
    return { allowed: false, retryAfterSeconds: remainingSeconds };
  }

  // Se a janela expirou, limpa tentativas antigas
  if (now - record.firstAttemptAt > WINDOW_MS && !record.blockedUntil) {
    loginAttempts.delete(cleanKey);
    return { allowed: true };
  }

  return { allowed: true };
}

/**
 * Registra falha de login para o IP/e-mail para controle de proteção.
 */
export function recordLoginFailure(key: string): { blocked: boolean; remainingAttempts: number; retryAfterSeconds?: number } {
  const cleanKey = key.trim().toLowerCase();
  const now = Date.now();
  let record = loginAttempts.get(cleanKey);

  if (!record || now - record.firstAttemptAt > WINDOW_MS) {
    record = { attempts: 1, firstAttemptAt: now };
    loginAttempts.set(cleanKey, record);
    return { blocked: false, remainingAttempts: MAX_ATTEMPTS - 1 };
  }

  record.attempts += 1;

  if (record.attempts >= MAX_ATTEMPTS) {
    record.blockedUntil = now + BLOCK_DURATION_MS;
    const retryAfterSeconds = Math.ceil(BLOCK_DURATION_MS / 1000);
    return { blocked: true, remainingAttempts: 0, retryAfterSeconds };
  }

  return { blocked: false, remainingAttempts: MAX_ATTEMPTS - record.attempts };
}

/**
 * Limpa registro de tentativas em caso de login bem-sucedido.
 */
export function resetLoginAttempts(key: string): void {
  loginAttempts.delete(key.trim().toLowerCase());
}

// =========================================================================
// 5. TRILHA DE AUDITORIA DE SEGURANÇA (AUDIT TRAIL NO POSTGRESQL)
// =========================================================================

/**
 * Registra eventos de segurança e auditoria na tabela gihs_core.audit_logs
 */
export async function recordSecurityAudit(event: {
  action: string;
  category: 'AUTH' | 'USERS' | 'DBA' | 'SETTINGS' | 'ACCESS_CONTROL' | 'MOBILITY' | 'ON_CALL';
  user_name: string;
  user_id?: string;
  ip_address: string;
  user_agent?: string;
  severity?: 'Info' | 'Warning' | 'Critical';
  details?: Record<string, any>;
}): Promise<void> {
  try {
    await query(`
      INSERT INTO audit_logs (
        user_id, user_name, action, category, severity, ip_address, user_agent, details
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8);
    `, [
      event.user_id || null,
      event.user_name || 'Sistema de Segurança',
      event.action,
      event.category || 'AUTH',
      event.severity || 'Info',
      event.ip_address || '127.0.0.1',
      event.user_agent || 'GIHS-Applet/2.4',
      JSON.stringify(event.details || {})
    ]);
  } catch (err: any) {
    // Audit logging failsafe: never throw to caller, but record in console
    console.warn('Security Audit Log recording warning:', err?.message);
  }
}
