export default class FilterService {
  constructor(state, storage, view, logger, filterKey = 'kanban.filter.logic') {
    this.state = state;
    this.storage = storage;
    this.view = view;
    this.logger = logger;
    this.FILTER_LOGIC_KEY = filterKey;
    this._filterLogic = (this.storage.getItem(this.FILTER_LOGIC_KEY) === 'OR') ? 'OR' : 'AND';
    this._filters = {};
    this._filtersToggle = null;
    this._filtersPanel = null;
    this._filtersDocClick = null;
    this._filtersKeydown = null;
  }

  init() {
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
      input.type = 'radio'; input.name = 'filter-logic'; input.value = val; input.checked = this._filterLogic === val;
      const span = document.createElement('span'); span.textContent = label;
      chip.appendChild(input); chip.appendChild(span);
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
        input.type = 'checkbox'; input.checked = true; input.dataset.taxoKey = key; input.value = opt.key;
        const span = document.createElement('span'); span.textContent = opt.label ?? opt.key;
        chip.appendChild(input); chip.appendChild(span);
        group.appendChild(chip);

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
    // Reapply on window resize for count recalculation
    window.addEventListener('resize', () => this.applyFilters());
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

  hookView(view) {
    if (!view) return;
    if (!view._createCardOriginal) {
      view._createCardOriginal = view.createCardElement.bind(view);
      view.createCardElement = (t) => {
        const node = view._createCardOriginal(t);
        Promise.resolve().then(() => this.applyFilters());
        return node;
      };
    }
    Promise.resolve().then(() => this.applyFilters());
  }
}
