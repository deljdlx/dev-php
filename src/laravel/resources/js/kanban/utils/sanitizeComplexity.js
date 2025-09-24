const ALLOWED = new Set(['xs','s','m','l','xl', null]);

/**
 * Ensure complexity is one of the allowed values; otherwise return null.
 * @param {any} complexity
 * @returns {'xs'|'s'|'m'|'l'|'xl'|null}
 */
export default function sanitizeComplexity(complexity) {
  if (complexity === null || complexity === undefined) return null;
  const v = String(complexity).toLowerCase();
  return ALLOWED.has(v) ? v : null;
}
