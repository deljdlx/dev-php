import KanbanState from './KanbanState';
import demoFactory from './demoFactory';
import { DemoDataSource } from './datasource';
import { createDefaultStorage } from './storage/StorageStrategy';
import createLogger from './utils/createLogger';
import { KanbanView } from './view';
import openCreateTicketPopup from './ui/createTicket';

export default class KanbanController {
  constructor(root = document.getElementById('kanban')) {
    this.root = root;
    this.logger = createLogger('Kanban');
    this.storage = createDefaultStorage();
    this.dataSource = new DemoDataSource(demoFactory, 'demo.kanban.v6', this.logger, this.storage);
    this.state = new KanbanState(this.dataSource, { logger: this.logger });
    this.view = null;

    // Keys and defaults
    this.THEME_KEY = 'kanban.theme';
    this.FILTER_LOGIC_KEY = 'kanban.filter.logic';
    this._filterLogic = (this.storage.getItem(this.FILTER_LOGIC_KEY) === 'OR') ? 'OR' : 'AND';
    this.BG_IMG_KEY = 'kanban.bgImage';

    // Internals
    this._filters = {}; // taxonomyKey -> Set(selectedOptionKeys)
    this._filtersToggle = null;
    this._filtersPanel = null;
    this._filtersDocClick = null;
    this._filtersKeydown = null;
    this._bgHandlers = null;
  }

  async init() {
    if (!this.root) return;
    await this.state.load();
    this.view = new KanbanView(this.root, this.state, this.logger);
    this.initTheme();
    this.initFilters();
    this.bindToolbar();
    this.hookViewFiltering();
    this.initBackgroundDnD();
  }

  // =============== Background image via global DnD ===============
  initBackgroundDnD() {
    let dragDepth = 0;
    const isFromModal = (target) => !!(target && (target.closest?.('.modal') || target.closest?.('.modal-dropzone')));

    const enter = (e) => {
      if (e.dataTransfer && !Array.from(e.dataTransfer.types || []).includes('Files')) return;
      dragDepth++;
      document.body.classList.add('bg-drag-active');
      e.preventDefault();
    };
    const over = (e) => {
      if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
      e.preventDefault();
    };
    const leave = (e) => {
      dragDepth = Math.max(0, dragDepth - 1);
      if (dragDepth === 0) document.body.classList.remove('bg-drag-active');
      e.preventDefault();
    };
    const drop = (e) => {
      e.preventDefault();
      dragDepth = 0;
      document.body.classList.remove('bg-drag-active');
      if (isFromModal(e.target)) return;
      const files = Array.from(e.dataTransfer?.files || []);
      if (!files.length) return;
      const img = files.find(f => (f.type || '').startsWith('image/'));
      if (!img) return;
      try {
        const reader = new FileReader();
        reader.onload = () => {
          const dataUrl = reader.result;
          this.setBackgroundImage(dataUrl);
          try { this.storage.setItem(this.BG_IMG_KEY, dataUrl); } catch {}
        };
        reader.readAsDataURL(img);
      } catch {}
    };

    if (this._bgHandlers) {
      const { enter: a, over: b, leave: c, drop: d } = this._bgHandlers;
      window.removeEventListener('dragenter', a);
      window.removeEventListener('dragover', b);
      window.removeEventListener('dragleave', c);
      window.removeEventListener('drop', d);
    }
    this._bgHandlers = { enter, over, leave, drop };
    window.addEventListener('dragenter', enter);
    window.addEventListener('dragover', over);
    window.addEventListener('dragleave', leave);
    window.addEventListener('drop', drop);

    try {
      const cached = this.storage.getItem(this.BG_IMG_KEY);
      if (cached) this.setBackgroundImage(cached);
    } catch {}
  }

  setBackgroundImage(url) {
    if (!url) return;
    const b = document.body;
    b.style.backgroundImage = `url('${url}')`;
    b.classList.add('has-custom-bg');
  }

  // =============== Filters (dropdown + AND/OR) ===============
  initFilters() {
    const host = document.getElementById('kanban-filters');
    if (!host) return;
    host.innerHTML = '';
    this._filters = {};

    // Dropdown shell
    const shell = document.createElement('div');
    shell.className = 'filters-dd';
    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.id = 'filtersToggle';
    toggle.className = 'btn filters-toggle';
    toggle.setAttribute('aria-haspopup', 'true');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.textContent = 'Filtres';
    const panel = document.createElement('div');
    panel.className = 'filters-panel';
    panel.setAttribute('role', 'menu');
    panel.hidden = true;
    shell.appendChild(toggle);
    shell.appendChild(panel);
    host.appendChild(shell);
    this._filtersToggle = toggle;
    this._filtersPanel = panel;

    const openPanel = () => { panel.hidden = false; toggle.setAttribute('aria-expanded', 'true'); shell.setAttribute('data-open', 'true'); };
    const closePanel = () => { panel.hidden = true; toggle.setAttribute('aria-expanded', 'false'); shell.removeAttribute('data-open'); };
    const togglePanel = () => { panel.hidden ? openPanel() : closePanel(); };
    toggle.addEventListener('click', togglePanel);

    // Cleanup and reattach global listeners
    if (this._filtersDocClick) document.removeEventListener('click', this._filtersDocClick);
    if (this._filtersKeydown) document.removeEventListener('keydown', this._filtersKeydown);
    this._filtersDocClick = (e) => { if (!shell.contains(e.target)) closePanel(); };
    document.addEventListener('click', this._filtersDocClick);
    this._filtersKeydown = (e) => { if (e.key === 'Escape') closePanel(); };
    document.addEventListener('keydown', this._filtersKeydown);

    // Logic group (AND/OR)
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
          this.storage.setItem(this.FILTER_LOGIC_KEY, this._filterLogic);
          this.applyFilters();
          this.updateFilterSummary();
        }
      });
      return chip;
    };
    logicGroup.appendChild(mkLogic('AND', 'AND'));
    logicGroup.appendChild(mkLogic('OR', 'OR'));
    panel.appendChild(logicGroup);

    // Taxonomy groups
    const keys = this.state.getTaxonomyKeys();
    for (const key of keys) {
      const options = this.state.getTaxonomyOptions(key) || [];
      if (!options.length) continue;
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
        input.checked = true;
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
          if (input.checked) this._filters[key].add(input.value);
          else this._filters[key].delete(input.value);
          this.applyFilters();
          this.updateFilterSummary();
        });
      }
      panel.appendChild(group);
    }

    this.updateFilterSummary();
    this.applyFilters();
  }

  updateFilterSummary() {
    try {
      const btn = this._filtersToggle;
      const keys = this.state.getTaxonomyKeys();
      let active = 0;
      for (const key of keys) {
        const opts = this.state.getTaxonomyOptions(key) || [];
        if (!opts.length) continue;
        const selected = this._filters?.[key]?.size ?? 0;
        if (selected > 0 && selected < opts.length) active++;
      }
      const logic = this._filterLogic || 'AND';
      const label = active > 0 ? `Filtres (${active}) · ${logic}` : `Filtres · ${logic}`;
      if (btn) btn.textContent = label;
    } catch {}
  }

  applyFilters() {
    const cards = document.querySelectorAll('#kanban .card');
    const filters = this._filters || {};
    const logic = this._filterLogic || 'AND';

    let totalSelected = 0;
    for (const s of Object.values(filters)) totalSelected += (s?.size || 0);

    for (const el of cards) {
      let visible;
      if (logic === 'AND') {
        visible = true;
        for (const [key, allowed] of Object.entries(filters)) {
          const keySafe = String(key).toLowerCase().replace(/[^a-z0-9_-]/g, '-');
          const val = el.getAttribute(`data-taxo-${keySafe}`);
          if (val == null || val === '' || val === 'null') continue;
          if (!allowed.has(val)) { visible = false; break; }
        }
      } else {
        if (totalSelected === 0) {
          visible = true;
        } else {
          visible = false;
          for (const [key, allowed] of Object.entries(filters)) {
            const keySafe = String(key).toLowerCase().replace(/[^a-z0-9_-]/g, '-');
            const val = el.getAttribute(`data-taxo-${keySafe}`);
            if (val == null || val === '' || val === 'null') continue;
            if (allowed.has(val)) { visible = true; break; }
          }
        }
      }
      el.style.display = visible ? '' : 'none';
    }
    this.view.updateCounts();
  }

  // =============== Theme ===============
  initTheme() {
    const applyTheme = (theme) => {
      const target = document.body;
      if (theme === 'light') target.setAttribute('data-theme', 'light');
      else target.removeAttribute('data-theme');
      const btn = document.getElementById('toggleTheme');
      if (btn) btn.textContent = theme === 'light' ? 'Mode sombre' : 'Mode clair';
    };
    this._applyTheme = applyTheme;
    const saved = this.storage.getItem(this.THEME_KEY);
    applyTheme(saved === 'light' ? 'light' : 'dark');
    document.getElementById('toggleTheme')?.addEventListener('click', () => {
      const isLight = document.body.getAttribute('data-theme') === 'light';
      const next = isLight ? 'dark' : 'light';
      this.storage.setItem(this.THEME_KEY, next);
      applyTheme(next);
    });
  }

  // =============== Toolbar / View hooks ===============
  bindToolbar() {
    document.getElementById('createTicket')?.addEventListener('click', () => openCreateTicketPopup({ view: this.view, state: this.state, logger: this.logger }));
    document.getElementById('addRandom')?.addEventListener('click', () => this.addRandom());
    document.getElementById('resetBoard')?.addEventListener('click', () => this.resetBoard());
    document.getElementById('downloadJson')?.addEventListener('click', () => this.downloadJson());
    document.getElementById('importJson')?.addEventListener('click', () => this.openImportPopup());

    const reapply = () => this.applyFilters?.();
    window.addEventListener('resize', reapply);
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

  // =============== Actions ===============
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
  // Clear all app storage (theme, filters, background image, demo data)
  try { this.storage.clear(); } catch {}
  // Remove any inline background style
  document.body.style.backgroundImage = '';
  document.body.classList.remove('has-custom-bg');
  // Recreate dataSource with a fresh storage reference (same object, but data wiped)
  this.dataSource = new DemoDataSource(demoFactory, 'demo.kanban.v6', this.logger, this.storage);
  // Reset state by reloading demo factory
  const cfg = demoFactory();
  await this.state.reset(cfg);
  // Rebuild the view
  this.view.dispose?.();
  this.view = new KanbanView(this.root, this.state, this.logger);
  this.initFilters();
  this.hookViewFiltering();
  }

  downloadJson() {
    const board = { ...(this.state.board || {}) };
    try {
      const bg = this.storage.getItem(this.BG_IMG_KEY);
      if (bg) board.backgroundImage = bg;
    } catch {}
    const snapshot = {
      board,
      columns: this.state.columns.map(c => ({ id: c.id, name: c.name, tickets: c.tickets.map(t => (typeof t.toJSON === 'function' ? t.toJSON() : t)) })),
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
        // Restore background image if present under board
        try {
          const bg = data?.board?.backgroundImage;
          if (bg && typeof bg === 'string') {
            this.storage.setItem(this.BG_IMG_KEY, bg);
            this.setBackgroundImage(bg);
          }
        } catch {}
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
