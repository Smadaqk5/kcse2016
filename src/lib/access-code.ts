import crypto from "crypto";

/**
 * Generates a clean, unique KCSE candidate access code.
 * Format: KCSE-XXXX-XXXX (e.g. KCSE-7942-8316)
 */
export function generateAccessCode(): string {
  // Use crypto for unguessable randomness
  const num1 = crypto.randomInt(1000, 9999);
  const num2 = crypto.randomInt(1000, 9999);
  return `KCSE-${num1}-${num2}`;
}

/**
 * Normalizes an access code entered by the user.
 * Strips whitespace, converts to uppercase, removes extra characters.
 */
export function normalizeAccessCode(input: string): string {
  return input.trim().toUpperCase().replace(/[\s_]+/g, "-");
}
