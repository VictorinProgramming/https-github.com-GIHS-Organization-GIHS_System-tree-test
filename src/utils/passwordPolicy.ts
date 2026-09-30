/**
 * GIHS Cyber-Security - Password Policy & Strength Evaluation
 *
 * Regras mandatórias corporativas:
 * 1. Mínimo 8 dígitos / caracteres
 * 2. Mínimo 1 caractere especial (!@#$%^&*()_+-=[]{}|;':",.<>?/`~)
 * 3. Mínimo 1 número (0-9)
 * 4. A senha deverá ser forte (complexidade, entropia, sem padrões óbvios)
 * 5. Ao subir para o PostgreSQL, a senha é criptografada com PBKDF2-SHA512 + Salt
 */

export interface PasswordRuleResult {
  id: string;
  label: string;
  satisfied: boolean;
  required: boolean;
}

export interface PasswordEvaluation {
  score: number; // 0 a 100
  strength: 'MUITO_FRACA' | 'FRACA' | 'MEDIA' | 'FORTE' | 'MUITO_FORTE';
  strengthLabel: string;
  strengthColor: string; // Tailwind color class
  strengthBg: string;
  isCompliant: boolean;
  rules: {
    minLength: PasswordRuleResult;
    hasSpecial: PasswordRuleResult;
    hasNumber: PasswordRuleResult;
    hasMixedCase: PasswordRuleResult;
  };
  errors: string[];
}

export const SPECIAL_CHAR_REGEX = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/;
export const NUMBER_REGEX = /\d/;
export const UPPERCASE_REGEX = /[A-Z]/;
export const LOWERCASE_REGEX = /[a-z]/;

const COMMON_WEAK_PASSWORDS = [
  '12345678',
  '123456789',
  'password',
  'senha123',
  'senha1234',
  'admin123',
  'mudar123',
  'teste123',
  'bycomp123',
  'gihs2026'
];

/**
 * Avalia a senha em tempo real com base nos requisitos de Cyber-Security
 */
export function evaluatePassword(password: string): PasswordEvaluation {
  const p = password || '';
  const length = p.length;

  // Regras
  const minLengthSatisfied = length >= 8;
  const hasSpecialSatisfied = SPECIAL_CHAR_REGEX.test(p);
  const hasNumberSatisfied = NUMBER_REGEX.test(p);
  const hasUppercase = UPPERCASE_REGEX.test(p);
  const hasLowercase = LOWERCASE_REGEX.test(p);
  const hasMixedCaseSatisfied = hasUppercase && hasLowercase;

  const rules: PasswordEvaluation['rules'] = {
    minLength: {
      id: 'minLength',
      label: 'Mínimo de 8 caracteres',
      satisfied: minLengthSatisfied,
      required: true
    },
    hasSpecial: {
      id: 'hasSpecial',
      label: 'Mínimo 1 caractere especial (!@#$%&*)',
      satisfied: hasSpecialSatisfied,
      required: true
    },
    hasNumber: {
      id: 'hasNumber',
      label: 'Mínimo 1 número (0 a 9)',
      satisfied: hasNumberSatisfied,
      required: true
    },
    hasMixedCase: {
      id: 'hasMixedCase',
      label: 'Letras maiúsculas e minúsculas (A-z)',
      satisfied: hasMixedCaseSatisfied,
      required: false
    }
  };

  // Cálculo de pontuação (0 a 100)
  let score = 0;
  if (length >= 8) score += 30;
  if (length >= 10) score += 10;
  if (length >= 12) score += 10;
  if (hasNumberSatisfied) score += 20;
  if (hasSpecialSatisfied) score += 20;
  if (hasUppercase) score += 5;
  if (hasLowercase) score += 5;

  // Penalidade se estiver na lista de senhas fracas comuns
  const isCommon = COMMON_WEAK_PASSWORDS.some(w => p.toLowerCase().includes(w));
  if (isCommon) {
    score = Math.min(score, 35);
  }

  // Determinação de Força
  let strength: PasswordEvaluation['strength'] = 'MUITO_FRACA';
  let strengthLabel = 'Muito Fraca';
  let strengthColor = 'text-rose-600';
  let strengthBg = 'bg-rose-500';

  if (score >= 85) {
    strength = 'MUITO_FORTE';
    strengthLabel = 'Muito Forte';
    strengthColor = 'text-emerald-700';
    strengthBg = 'bg-emerald-600';
  } else if (score >= 70) {
    strength = 'FORTE';
    strengthLabel = 'Forte';
    strengthColor = 'text-emerald-600';
    strengthBg = 'bg-emerald-500';
  } else if (score >= 45) {
    strength = 'MEDIA';
    strengthLabel = 'Média';
    strengthColor = 'text-amber-600';
    strengthBg = 'bg-amber-500';
  } else if (score >= 25) {
    strength = 'FRACA';
    strengthLabel = 'Fraca';
    strengthColor = 'text-orange-600';
    strengthBg = 'bg-orange-500';
  } else {
    strength = 'MUITO_FRACA';
    strengthLabel = 'Muito Fraca';
    strengthColor = 'text-rose-600';
    strengthBg = 'bg-rose-500';
  }

  // Lista de erros caso não atenda aos requisitos mandatórios
  const errors: string[] = [];
  if (!minLengthSatisfied) errors.push('Mínimo 8 dígitos/caracteres');
  if (!hasSpecialSatisfied) errors.push('Mínimo 1 caractere especial (ex: !@#$%&*_-)');
  if (!hasNumberSatisfied) errors.push('Mínimo 1 número (0-9)');
  if (isCommon) errors.push('A senha contém sequência comum fácil de adivinhar');

  // Compliant = atende todas as 3 regras mandatórias e tem força pelo menos Média/Forte (score >= 70 ou todas as mandatórias)
  const isCompliant = minLengthSatisfied && hasSpecialSatisfied && hasNumberSatisfied && !isCommon && score >= 60;

  return {
    score,
    strength,
    strengthLabel,
    strengthColor,
    strengthBg,
    isCompliant,
    rules,
    errors
  };
}
