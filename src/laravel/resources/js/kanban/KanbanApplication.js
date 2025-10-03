import KanbanState from './models/KanbanState';
import demoFactory from './demoFactory';
import { DemoDataSourceAdapter as DemoDataSource } from './datasource/DataSourceAdapter';
import { createDefaultStorage } from './storage/StorageStrategy';
import createLogger from './utils/createLogger';
import { KanbanView } from './KanbanView';
import openCreateTicketPopup from './ui/createTicket';
import ThemeService from './services/ThemeService';
import BackgroundService from './services/BackgroundService';
import FilterService from './services/FilterService';
import ImportService from './services/ImportService';

export default class KanbanApplication {
	constructor(root = document.getElementById('kanban')) {
		this.root = root;
		this.logger = createLogger('Kanban');
		this.storage = createDefaultStorage();
		this.dataSource = new DemoDataSource(demoFactory, 'demo.kanban.v6', this.logger, this.storage);
		this.state = new KanbanState(this.dataSource, { logger: this.logger });
		this.view = null;

		// Services
		this.theme = new ThemeService(this.storage);
		this.background = new BackgroundService(this.storage);
		this.filters = null; // created after view
		this.importer = null; // created after view
	}

	async init() {
		if (!this.root) return;
		await this.state.load();
		this.view = new KanbanView(this.root, this.state, this.logger);
		this.renderTitle();

		// Initialize services
		this.theme.init();
		this.filters = new FilterService(this.state, this.storage, this.view, this.logger);
		this.filters.init();
		this.filters.hookView(this.view);
		this.bindToolbar();

		this.background.onImport = async (data) => {
			try { await this.importSnapshot(data); }
			catch (e) { alert('Import JSON échoué: ' + (e?.message || e)); }
		};
		this.background.init();
	}

	// =============== Import logic (reusable) ===============
	async importSnapshot(data) {
		const validSnapshot = (obj) => {
			if (!obj || typeof obj !== 'object') return false;
			if (!Array.isArray(obj.columns)) return false;
			if (obj.board && typeof obj.board !== 'object') return false;
			return true;
		};
		if (!validSnapshot(data)) throw new Error('Format invalide: attendez { board?, columns: [] }');
		data.columns = (data.columns || []).map(c => ({ id: String(c.id), name: String(c.name), tickets: Array.isArray(c.tickets) ? c.tickets : [] }));
		await this.state.reset(data);

		// Restore background image if present under board
		try {
			const bg = data?.board?.backgroundImage;
			if (bg && typeof bg === 'string') {
				this.storage.setItem(this.background.BG_IMG_KEY, bg);
				this.background.setBackgroundImage(bg);
			}
		} catch { }

		// Rebuild the view and UI
		this.view.dispose?.();
		this.view = new KanbanView(this.root, this.state, this.logger);
		this.renderTitle();
		this.filters = new FilterService(this.state, this.storage, this.view, this.logger);
		this.filters.init();
		this.filters.hookView(this.view);
	}

	renderTitle() {
		try {
			const h1 = document.getElementById('kanban-title');
			const warnBtn = document.getElementById('kanban-title-warn');
			if (!h1) return;
			const name = this.state?.board?.name;
			if (typeof name === 'string' && name.trim()) {
				h1.textContent = name.trim();
				if (warnBtn) warnBtn.style.display = 'none';
			} else {
				h1.textContent = 'Kanban';
				if (warnBtn) {
					warnBtn.textContent = 'Board sans nom — Définir un nom';
					warnBtn.style.display = '';
					warnBtn.onclick = async () => {
						const current = (this.state?.board?.name || '').trim();
						const val = window.prompt('Nom du board ?', current);
						if (val == null) return; // cancelled
						const trimmed = String(val).trim();
						if (!trimmed) return;
						this.state.board = { ...(this.state.board || {}), name: trimmed };
						try { await this.dataSource.setBoardMeta(this.state.board); } catch { }
						this.renderTitle();
					};
				}
			}
		} catch { }
	}

	// =============== Toolbar ===============
	bindToolbar() {
		document.getElementById('createTicket')?.addEventListener('click', () => openCreateTicketPopup({ view: this.view, state: this.state, logger: this.logger }));
		document.getElementById('addRandom')?.addEventListener('click', () => this.addRandom());
		document.getElementById('resetBoard')?.addEventListener('click', () => this.resetBoard());
		document.getElementById('downloadJson')?.addEventListener('click', () => this.downloadJson());
		document.getElementById('importJson')?.addEventListener('click', () => {
			this.importer = this.importer || new ImportService(this.view, async (data) => { await this.importSnapshot(data); });
			this.importer.open();
		});

		const reapply = () => this.filters?.applyFilters?.();
		window.addEventListener('resize', reapply);
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
		const authors = Array.isArray(this.state.board?.authors) ? this.state.board.authors : [];
		const ticket = {
			id: undefined,
			title: 'Tâche aléatoire ' + Math.floor(Math.random() * 1000),
			description: descs[Math.floor(Math.random() * descs.length)],
			authorId: (authors.length ? authors[Math.floor(Math.random() * authors.length)].id : null),
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
		try { this.storage.clear(); } catch { }
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
		this.renderTitle();
		this.filters = new FilterService(this.state, this.storage, this.view, this.logger);
		this.filters.init();
		this.filters.hookView(this.view);
	}

	downloadJson() {
		const board = { ...(this.state.board || {}) };
		try {
			const bg = this.storage.getItem(this.background.BG_IMG_KEY);
			if (bg) board.backgroundImage = bg;
		} catch { }
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
}

