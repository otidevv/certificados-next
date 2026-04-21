// Single source of truth for the password policy, used by both client
// and server so validation messages stay in sync.

export const PASSWORD_MIN_LENGTH = 6;

export const PASSWORD_POLICY_TEXT = `Mínimo ${PASSWORD_MIN_LENGTH} caracteres`;

// Returns null when the password is acceptable, otherwise a user-facing message.
export function validatePassword(password) {
  if (typeof password !== 'string') return 'Contraseña inválida';
  if (password.length < PASSWORD_MIN_LENGTH) {
    return `La contraseña debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres`;
  }
  return null;
}
