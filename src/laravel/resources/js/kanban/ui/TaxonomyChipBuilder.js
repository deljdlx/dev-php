import escapeHtml from '../utils/escapeHtml';

// Build a taxonomy chip HTML string based on key and value key
export function buildTaxoChip(key, valKey, getTaxonomyMeta) {
  if (valKey == null || valKey === '') return '';
  const meta = typeof getTaxonomyMeta === 'function' ? getTaxonomyMeta(key) : null;
  const optionLabel = meta?.options?.find?.(o => o.key === valKey)?.label ?? valKey;

  if (key === 'label') {
    return `<span class="label ${escapeHtml(String(valKey))}">${escapeHtml(String(optionLabel))}</span>`;
  }
  if (key === 'category') {
    return `<span class="category cat-${escapeHtml(String(valKey))}">${escapeHtml(String(optionLabel))}</span>`;
  }
  if (key === 'complexity') {
    return `<span class="complexity complexity-${escapeHtml(String(valKey)).toLowerCase()}">${escapeHtml(String(optionLabel))}</span>`;
  }
  const safeKey = escapeHtml(String(key));
  const safeVal = escapeHtml(String(valKey));
  return `<span class="taxo-chip taxo-${safeKey} taxo-${safeKey}-${safeVal}">${escapeHtml(String(optionLabel))}</span>`;
}
