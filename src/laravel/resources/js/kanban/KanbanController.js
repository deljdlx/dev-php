import KanbanState from './state';
import demoFactory from './demoFactory';
import { DemoDataSource } from './datasource';
import createLogger from './utils/createLogger';
import { KanbanView } from './view';
import openCreateTicketPopup from './ui/createTicket';

export default class KanbanController {
  constructor(root = document.getElementById('kanban')) {
    this.root = root;
    this.logger = createLogger('Kanban');
    this.dataSource = new DemoDataSource(demoFactory, 'demo.kanban.v6', this.logger);
    this.state = new KanbanState(this.dataSource, { logger: this.logger });
    this.view = null;
    this.THEME_KEY = 'kanban.theme';
  this.FILTER_LOGIC_KEY = 'kanban.filter.logic';
  this._filterLogic = (localStorage.getItem(this.FILTER_LOGIC_KEY) === 'OR') ? 'OR' : 'AND';
  }

  async init() {
    if (!this.root) return;
    await this.state.load();
    this.view = new KanbanView(this.root, this.state, this.logger);
    this.initTheme();
    this.initFilters();
  this.bindToolbar();
  this.hookViewFiltering();
  }

  initFilters() {
    // Build a generic filter UI: for each taxonomy, checkboxes for its options.
    const host = document.getElementById('kanban-filters');
    if (!host) return;
    host.innerHTML = '';
    this._filters = {}; // key -> Set(allowed option keys) that are visible
    // Add logic toggle (AND/OR)
    const logicGroup = document.createElement('div');
    logicGroup.className = 'filter-group';
    const logicTitle = document.createElement('span');
    logicTitle.className = 'filter-title';
    logicTitle.textContent = 'Logique';
    logicGroup.appendChild(logicTitle);
    const mkLogic = (val, label) => {
      const chip = document.createElement('label');
      chip.className = 'filter-chip';
      const input = document.createElement('input');
      input.type = 'radio';
      input.name = 'filter-logic';
      input.value = val;
      input.checked = this._filterLogic === val;
      const span = document.createElement('span');
      span.textContent = label;
      chip.appendChild(input);
      chip.appendChild(span);
      input.addEventListener('change', () => {
        if (input.checked) {
          this._filterLogic = val;
          localStorage.setItem(this.FILTER_LOGIC_KEY, this._filterLogic);
          this.applyFilters();
        }
      });
      return chip;
    };
    logicGroup.appendChild(mkLogic('AND', 'AND'));
    logicGroup.appendChild(mkLogic('OR', 'OR'));
    host.appendChild(logicGroup);

    const keys = this.state.getTaxonomyKeys();
    for (const key of keys) {
      const options = this.state.getTaxonomyOptions(key) || [];
      if (!options.length) continue; // skip taxonomies with no options
      const meta = this.state.getTaxonomyMeta(key);
      const group = document.createElement('div');
      group.className = 'filter-group';
      const title = document.createElement('span');
      title.className = 'filter-title';
      title.textContent = meta?.label || key;
      group.appendChild(title);

      this._filters[key] = new Set();
      for (const opt of options) {
        const chip = document.createElement('label');
        chip.className = 'filter-chip';
        const input = document.createElement('input');
        input.type = 'checkbox';
        input.checked = true; // default: show all
        input.dataset.taxoKey = key;
        input.value = opt.key;
        const span = document.createElement('span');
        span.textContent = opt.label ?? opt.key;
        chip.appendChild(input);
        chip.appendChild(span);
        group.appendChild(chip);
        // Seed visible set
        this._filters[key].add(opt.key);
        input.addEventListener('change', () => {
          if (input.checked) this._filters[key].add(opt.value || opt.key);
          else this._filters[key].delete(opt.value || opt.key);
          this.applyFilters();
        });
      }
      host.appendChild(group);
    }
    this.applyFilters();
  }

  applyFilters() {
    // Generic filtering: a card is visible if for every taxonomy key where filters exist,
    // either the card has null/empty for that key (treated as visible) or its value is in the allowed set.
    const cards = document.querySelectorAll('#kanban .card');
    const filters = this._filters || {};
    const logic = this._filterLogic || 'AND';
    // Precompute if there is at least one selected option across all taxonomies
    let totalSelected = 0;
    for (const s of Object.values(filters)) totalSelected += (s?.size || 0);
    for (const el of cards) {
      let visible;
      if (logic === 'AND') {
        visible = true;
        for (const [key, allowed] of Object.entries(filters)) {
          const keySafe = String(key).toLowerCase().replace(/[^a-z0-9_-]/g, '-');
          const val = el.getAttribute(`data-taxo-${keySafe}`);
          if (val == null || val === '' || val === 'null') continue; // no value -> non-restrictive for AND
          if (!allowed.has(val)) { visible = false; break; }
        }
      } else { // OR logic
        if (totalSelected === 0) {
          // if nothing is selected anywhere, show all to avoid empty board
          visible = true;
        } else {
          visible = false;
          for (const [key, allowed] of Object.entries(filters)) {
            const keySafe = String(key).toLowerCase().replace(/[^a-z0-9_-]/g, '-');
            const val = el.getAttribute(`data-taxo-${keySafe}`);
            if (val == null || val === '' || val === 'null') continue; // null doesn't match any selection
            if (allowed.has(val)) { visible = true; break; }
          }
        }
      }
      el.style.display = visible ? '' : 'none';
    }
    // update counts after filtering
    this.view.updateCounts();
  }

  initTheme() {
    const applyTheme = (theme) => {
      const target = document.body;
      if (theme === 'light') target.setAttribute('data-theme', 'light');
      else target.removeAttribute('data-theme');
      const btn = document.getElementById('toggleTheme');
      if (btn) btn.textContent = theme === 'light' ? 'Mode sombre' : 'Mode clair';
    };
    this._applyTheme = applyTheme;
    const saved = localStorage.getItem(this.THEME_KEY);
    applyTheme(saved === 'light' ? 'light' : 'dark');
    document.getElementById('toggleTheme')?.addEventListener('click', () => {
      const isLight = document.body.getAttribute('data-theme') === 'light';
      const next = isLight ? 'dark' : 'light';
      localStorage.setItem(this.THEME_KEY, next);
      applyTheme(next);
    });
  }

  bindToolbar() {
    document.getElementById('createTicket')?.addEventListener('click', () => openCreateTicketPopup({ view: this.view, state: this.state, logger: this.logger }));
    document.getElementById('addRandom')?.addEventListener('click', () => this.addRandom());
    document.getElementById('resetBoard')?.addEventListener('click', () => this.resetBoard());
    document.getElementById('downloadJson')?.addEventListener('click', () => this.downloadJson());
    document.getElementById('importJson')?.addEventListener('click', () => this.openImportPopup());
    // Re-apply filters when the board is re-rendered or on window events if needed
    const reapply = () => this.applyFilters?.();
    window.addEventListener('resize', reapply);
    this.hookViewFiltering();
  }

  hookViewFiltering() {
    if (!this.view) return;
    if (!this.view._createCardOriginal) {
      this.view._createCardOriginal = this.view.createCardElement.bind(this.view);
      this.view.createCardElement = (t) => {
        const node = this.view._createCardOriginal(t);
        Promise.resolve().then(() => this.applyFilters());
        return node;
      };
    }
    Promise.resolve().then(() => this.applyFilters());
  }

  async addRandom() {
    const first = this.state.columns[0];
    if (!first) return;
    const taxonomies = {};
    for (const key of this.state.getTaxonomyKeys()) {
      const opts = this.state.getTaxonomyOptions(key) || [];
      const picked = (opts.length ? opts[Math.floor(Math.random() * opts.length)] : null);
      taxonomies[key] = Math.random() < 0.25 ? null : (picked ? picked.key : null);
    }
    const descs = ['Ticket généré pour test', 'Lorem ipsum dolor sit amet', 'Voir backlog pour contexte', 'Petite tâche technique'];
    const authors = ['Alice', 'Bob', 'Chloé', 'David'];
    const ticket = {
      id: undefined,
      title: 'Tâche aléatoire ' + Math.floor(Math.random() * 1000),
      description: descs[Math.floor(Math.random() * descs.length)],
      author: authors[Math.floor(Math.random() * authors.length)],
      taxonomies,
      createdAt: Date.now()
    };
    this.logger.debug('controller.addRandom', { columnId: first.id, ticket });
    await this.state.addTicket(first.id, ticket);
    const list = document.querySelector(`#list-${first.id}`);
    const added = this.state.columns.find(c => c.id === first.id)?.tickets[0] ?? ticket;
    list?.prepend(this.view.createCardElement(added));
    this.view.updateCounts();
  }

  async resetBoard() {
    if (!confirm('Réinitialiser le board aux données de démo ?')) return;
    this.logger.debug('controller.resetBoard');
    const cfg = demoFactory();
    await this.state.reset(cfg);
    this.view.dispose?.();
    this.view = new KanbanView(this.root, this.state, this.logger);
  this.initFilters();
  this.hookViewFiltering();
  }

  downloadJson() {
    const snapshot = {
      board: this.state.board,
      columns: this.state.columns.map(c => ({ id: c.id, name: c.name, tickets: c.tickets.map(t => (typeof t.toJSON === 'function' ? t.toJSON() : t)) }))
    };
    const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const date = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
    a.href = url;
    a.download = `kanban-board-${date}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  openImportPopup() {
    if (!this.view?.popup) return;
    const wrap = document.createElement('div');
    wrap.innerHTML = `
      <form class="ticket-form" id="import-form">
        <div class="tf-grid">
          <div class="tf-field">
            <label class="tf-label">Fichier JSON</label>
            <input class="tf-input" type="file" id="import-file" accept="application/json,.json" />
          </div>
          <div class="tf-field">
            <div id="import-drop" class="modal-dropzone">Glissez-déposez votre fichier JSON ici</div>
          </div>
          <div class="tf-field">
            <label class="tf-label">Ou collez le JSON</label>
            <textarea class="tf-input" id="import-text" rows="8" placeholder="{\n  \"board\": { ... },\n  \"columns\": [ ... ]\n}"></textarea>
          </div>
          <div class="tf-actions">
            <button type="submit" class="btn">Importer</button>
          </div>
        </div>
      </form>
    `;
    const form = wrap.querySelector('#import-form');
    const fileInput = wrap.querySelector('#import-file');
    const textInput = wrap.querySelector('#import-text');
    const drop = wrap.querySelector('#import-drop');

    const parsePayload = async () => {
      if (fileInput.files && fileInput.files[0]) {
        const txt = await fileInput.files[0].text();
        return JSON.parse(txt);
      }
      if (textInput.value.trim()) {
        return JSON.parse(textInput.value);
      }
      throw new Error('Aucune donnée fournie');
    };

    const validSnapshot = (obj) => {
      if (!obj || typeof obj !== 'object') return false;
      if (!Array.isArray(obj.columns)) return false;
      if (obj.board && typeof obj.board !== 'object') return false;
      return true;
    };

    // Drag & Drop support
    if (drop) {
      const prevent = (e) => { e.preventDefault(); e.stopPropagation(); };
      ['dragenter','dragover','dragleave','drop'].forEach(evt => drop.addEventListener(evt, prevent));
      drop.addEventListener('dragover', () => drop.classList.add('is-dragover'));
      drop.addEventListener('dragleave', () => drop.classList.remove('is-dragover'));
      drop.addEventListener('drop', async (e) => {
        drop.classList.remove('is-dragover');
        try {
          const file = e.dataTransfer?.files?.[0];
          if (!file) return;
          if (!/json|\.json$/i.test(file.type || file.name)) throw new Error('Type de fichier non supporté');
          const txt = await file.text();
          textInput.value = txt;
          const dt = new DataTransfer();
          dt.items.add(file);
          fileInput.files = dt.files;
        } catch (err) {
          alert('Lecture du fichier échouée: ' + (err?.message || err));
        }
      });
    }

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        const data = await parsePayload();
        if (!validSnapshot(data)) throw new Error('Format invalide: attendez { board?, columns: [] }');
        data.columns = (data.columns || []).map(c => ({ id: String(c.id), name: String(c.name), tickets: Array.isArray(c.tickets) ? c.tickets : [] }));
        await this.state.reset(data);
        this.view.dispose?.();
        this.view = new KanbanView(this.root, this.state, this.logger);
  this.initFilters();
  this.hookViewFiltering();
        this.view.popup.close();
      } catch (err) {
        alert('Import échoué: ' + (err?.message || err));
      }
    }, { once: true });

    this.view.popup.open({ title: 'Importer un board JSON', content: wrap });
  }
}
