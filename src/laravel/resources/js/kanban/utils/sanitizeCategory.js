const ALLOWED = new Set(['bug','feature','docs','chore', null]);

/**
 * Ensure category is one of the allowed values; otherwise return null.
 * @param {any} category
 * @returns {'bug'|'feature'|'docs'|'chore'|null}
 */
export default function sanitizeCategory(category) {
  if (category === null || category === undefined) return null;
  const v = String(category).toLowerCase();
  return ALLOWED.has(v) ? v : null;
}
