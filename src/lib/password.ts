/* ---------------------------------------------------------------------------
 * Password strength rules - CY Login style.
 *
 * Mirrors passwordIssues() in server/index.js exactly. Client-side checks
 * are a live-typing UX convenience only; the server enforces the same rules
 * as the actual security boundary, so a request forged past this file still
 * gets rejected.
 * ------------------------------------------------------------------------- */

export interface PasswordRule {
  label: string;
  ok: boolean;
}

export function checkPassword(pw: string): PasswordRule[] {
  return [
    { label: 'At least 10 characters', ok: pw.length >= 10 },
    { label: 'A lowercase letter', ok: /[a-z]/.test(pw) },
    { label: 'An uppercase letter', ok: /[A-Z]/.test(pw) },
    { label: 'A number', ok: /[0-9]/.test(pw) },
    { label: 'A symbol (e.g. ! @ # $ %)', ok: /[^A-Za-z0-9]/.test(pw) },
  ];
}

export function isStrongPassword(pw: string): boolean {
  return checkPassword(pw).every((r) => r.ok);
}

/** A full legal name, not a single word or nickname - CY Login requires this too. */
export function isFullName(name: string): boolean {
  return name.trim().split(/\s+/).filter(Boolean).length >= 2;
}
