import { ALLOWED_TAXONOMIES } from '../utils/taxonomies';
import escapeHtml from '../utils/escapeHtml';

/**
 * NewTicketForm renders a form for creating a ticket and returns {el, getData}
 */
export default function NewTicketForm() {
  const el = document.createElement('form');
  el.className = 'ticket-form';
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
        <label class="tf-field">
          <span class="tf-label">Complexité</span>
          <select class="tf-input" name="complexity">
            <option value="">--</option>
            ${Array.from(ALLOWED_TAXONOMIES.complexity).filter(Boolean).map(v => `<option value="${v}">${v.toUpperCase()}</option>`).join('')}
          </select>
        </label>
      </div>
      <div class="tf-row">
        <label class="tf-field">
          <span class="tf-label">Catégorie</span>
          <select class="tf-input" name="category">
            <option value="">--</option>
            ${Array.from(ALLOWED_TAXONOMIES.category).filter(Boolean).map(v => `<option value="${v}">${escapeHtml(v)}</option>`).join('')}
          </select>
        </label>
        <label class="tf-field">
          <span class="tf-label">Couleur</span>
          <select class="tf-input" name="label">
            <option value="">--</option>
            ${Array.from(ALLOWED_TAXONOMIES.label).filter(Boolean).map(v => `<option value="${v}">${v.toUpperCase()}</option>`).join('')}
          </select>
        </label>
      </div>
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
    const tx = {
      complexity: (fd.get('complexity') || null) || null,
      category: (fd.get('category') || null) || null,
      label: (fd.get('label') || null) || null,
    };
    return { title, description, author, taxonomies: tx };
  }

  return { el, getData };
}
