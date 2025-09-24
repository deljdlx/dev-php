import escapeHtml from '../utils/escapeHtml';

/**
 * NewTicketForm renders a form for creating a ticket and returns {el, getData}
 */
export default function NewTicketForm({ getOptions, getKeys } = { getOptions: (k) => [], getKeys: () => [] }) {
  const el = document.createElement('form');
  el.className = 'ticket-form';
  // Config for taxonomy rendering without repetition
  const taxoKeys = (getKeys?.() || []).filter(Boolean);
  const TAXO_LABELS = { complexity: 'Complexité', category: 'Catégorie', label: 'Couleur' };
  const renderSelect = (key) => {
    const values = (getOptions?.(key) || []).filter(Boolean);
    const options = ['<option value="">--</option>'].concat(
      values.map(v => `<option value="${v}">${key === 'category' ? escapeHtml(v) : String(v).toUpperCase()}</option>`) 
    ).join('');
    return `
      <label class="tf-field">
        <span class="tf-label">${TAXO_LABELS[key] || key}</span>
        <select class="tf-input" name="${key}">${options}</select>
      </label>
    `;
  };
  const selects = taxoKeys.map(renderSelect);
  const firstSelect = selects.shift();
  const rowsAfter = [];
  for (let i = 0; i < selects.length; i += 2) {
    rowsAfter.push(`<div class="tf-row">${selects[i] || ''}${selects[i+1] || ''}</div>`);
  }

  el.innerHTML = `
    <div class="tf-grid">
      <label class="tf-field">
        <span class="tf-label">Titre</span>
        <input class="tf-input" name="title" type="text" required placeholder="Titre du ticket">
      </label>
      <label class="tf-field">
        <span class="tf-label">Description</span>
        <textarea class="tf-input" name="description" rows="3" placeholder="Description (optionnelle)"></textarea>
      </label>
      <div class="tf-row">
        <label class="tf-field">
          <span class="tf-label">Auteur</span>
          <input class="tf-input" name="author" type="text" placeholder="Votre nom (optionnel)">
        </label>
        ${firstSelect || ''}
      </div>
      ${rowsAfter.join('')}
      <div class="tf-actions">
        <button type="submit" class="btn">Créer</button>
      </div>
    </div>
  `;

  function getData() {
    const fd = new FormData(el);
    const title = String(fd.get('title') || '').trim();
    const description = String(fd.get('description') || '').trim() || null;
    const author = String(fd.get('author') || '').trim() || null;
  const taxonomies = (getKeys?.() || []).reduce((acc, key) => {
      const val = fd.get(key);
      acc[key] = val ? String(val) : null;
      return acc;
    }, {});
    return { title, description, author, taxonomies };
  }

  return { el, getData };
}
