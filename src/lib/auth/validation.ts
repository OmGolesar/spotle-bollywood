/**
 * Client-side validation utilities for authentication forms.
 * These run before submission to provide immediate feedback.
 */

export type ValidationResult = {
  valid: boolean;
  error?: string;
};

/**
 * Validate email format.
 */
export function validateEmail(email: string): ValidationResult {
  const trimmed = email.trim();

  if (!trimmed) {
    return { valid: false, error: "Email is required" };
  }

  // Basic email regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmed)) {
    return { valid: false, error: "Enter a valid email address" };
  }

  return { valid: true };
}

/**
 * Validate password strength.
 * Requirements: at least 8 characters.
 */
export function validatePassword(password: string): ValidationResult {
  if (!password) {
    return { valid: false, error: "Password is required" };
  }

  if (password.length < 8) {
    return { valid: false, error: "Password must be at least 8 characters" };
  }

  return { valid: true };
}

/**
 * Validate display name.
 */
export function validateDisplayName(name: string): ValidationResult {
  const trimmed = name.trim();

  if (!trimmed) {
    return { valid: false, error: "Name is required" };
  }

  if (trimmed.length < 2) {
    return { valid: false, error: "Name must be at least 2 characters" };
  }

  if (trimmed.length > 50) {
    return { valid: false, error: "Name must be less than 50 characters" };
  }

  return { valid: true };
}

/**
 * Validate password confirmation matches.
 */
export function validatePasswordMatch(password: string, confirm: string): ValidationResult {
  if (password !== confirm) {
    return { valid: false, error: "Passwords don't match" };
  }

  return { valid: true };
}
