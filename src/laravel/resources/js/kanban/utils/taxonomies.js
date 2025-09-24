export const ALLOWED_TAXONOMIES = {
  label: new Set(['blue','green','orange']),
  category: new Set(['bug','feature','docs','chore']),
  complexity: new Set(['xs','s','m','l','xl']),
};

export function sanitizeTaxonomies(input = {}, allowedMap = ALLOWED_TAXONOMIES) {
  const out = {};
  for (const [k, v] of Object.entries(input || {})) {
    if (v == null || v === '') { out[k] = null; continue; }
    const val = String(v).toLowerCase();
    const allowed = allowedMap?.[k];
    out[k] = allowed ? (allowed.has ? allowed.has(val) : new Set(allowed).has(val)) ? val : null : val;
  }
  return out;
}

export function legacyToTaxonomies(dto = {}, allowedMap = ALLOWED_TAXONOMIES) {
  const tx = {};
  if (dto.label != null) tx.label = String(dto.label).toLowerCase();
  if (dto.category != null) tx.category = String(dto.category).toLowerCase();
  if (dto.complexity != null) tx.complexity = String(dto.complexity).toLowerCase();
  return sanitizeTaxonomies(tx, allowedMap);
}
