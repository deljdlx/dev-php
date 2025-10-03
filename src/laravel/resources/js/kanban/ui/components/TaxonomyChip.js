import escapeHtml from '../../utils/escapeHtml';

/**
 * Render a taxonomy chip as HTML string (keeps legacy classes for known keys).
 * @param {string} key
 * @param {string|null|undefined} valKey
 * @param {{ label: string, options: Array<{key: string, label: string}> } | undefined} meta
 * @returns {string}
 */
export function renderTaxonomyChip(key, valKey, meta) {
  if (valKey == null || valKey === '') return '';
  const optionLabel = meta?.options?.find?.(o => o.key === valKey)?.label ?? valKey;
  if (key === 'label') {
    return `<span class="label ${valKey}">${escapeHtml(String(optionLabel))}</span>`;
  }
  if (key === 'category') {
    return `<span class="category cat-${valKey}">${escapeHtml(String(optionLabel))}</span>`;
  }
  if (key === 'complexity') {
    return `<span class="complexity complexity-${String(valKey).toLowerCase()}">${escapeHtml(String(optionLabel))}</span>`;
  }
  return `<span class="taxo-chip taxo-${escapeHtml(String(key))} taxo-${escapeHtml(String(key))}-${escapeHtml(String(valKey))}">${escapeHtml(String(optionLabel))}</span>`;
}
