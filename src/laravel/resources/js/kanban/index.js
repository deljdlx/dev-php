import '../bootstrap';
import '../../css/kanban.css';
import KanbanState from './state';
import demoFactory from './demoFactory';
import { DemoDataSource } from './datasource';
import createLogger from './utils/createLogger';
import { KanbanView } from './view';
import openCreateTicketPopup from './ui/createTicket';

(async function bootstrap(){
    const root = document.getElementById('kanban');
    if (!root) return;
    const logger = createLogger('Kanban');

    // Theme init: read preference and apply to body or #kanban
    const THEME_KEY = 'kanban.theme';
    const applyTheme = (theme) => {
        const target = document.body; // apply globally; CSS is scoped to #kanban
        if (theme === 'light') target.setAttribute('data-theme', 'light');
        else target.removeAttribute('data-theme');
        const btn = document.getElementById('toggleTheme');
        if (btn) btn.textContent = theme === 'light' ? 'Mode sombre' : 'Mode clair';
    };
    const savedTheme = localStorage.getItem(THEME_KEY);
    applyTheme(savedTheme === 'light' ? 'light' : 'dark');
    document.getElementById('toggleTheme')?.addEventListener('click', () => {
        const isLight = document.body.getAttribute('data-theme') === 'light';
        const next = isLight ? 'dark' : 'light';
        localStorage.setItem(THEME_KEY, next);
        applyTheme(next);
    });
    const dataSource = new DemoDataSource(demoFactory, 'demo.kanban.v6', logger);
    const state = new KanbanState(dataSource, { logger });
    await state.load();
    let view = new KanbanView(root, state, logger);

    // Open popup with unified create-ticket flow
    document.getElementById('createTicket')?.addEventListener('click', () => openCreateTicketPopup({ view, state, logger }));

    document.getElementById('addRandom')?.addEventListener('click', async () => {
        const first = state.columns[0];
        // Build random taxonomies dynamically from board
        const taxonomies = {};
        for (const key of state.getTaxonomyKeys()) {
            const opts = state.getTaxonomyOptions(key) || [];
            const picked = (opts.length ? opts[Math.floor(Math.random()*opts.length)] : null);
            taxonomies[key] = Math.random() < 0.25 ? null : (picked ? picked.key : null);
        }
        const descs = ['Ticket généré pour test', 'Lorem ipsum dolor sit amet', 'Voir backlog pour contexte', 'Petite tâche technique'];
        const authors = ['Alice', 'Bob', 'Chloé', 'David'];
        const ticket = {
            id: undefined,
            title: 'Tâche aléatoire ' + Math.floor(Math.random()*1000),
            description: descs[Math.floor(Math.random()*descs.length)],
            author: authors[Math.floor(Math.random()*authors.length)],
            taxonomies,
            createdAt: Date.now()
        };
        logger.debug('index.addRandom', { columnId: first.id, ticket });
        await state.addTicket(first.id, ticket);
        const list = document.querySelector(`#list-${first.id}`);
        const added = state.columns.find(c => c.id === first.id)?.tickets[0] ?? ticket;
        list?.prepend(view.createCardElement(added));
        view.updateCounts();
    });

    document.getElementById('resetBoard')?.addEventListener('click', async () => {
        if (!confirm('Réinitialiser le board aux données de démo ?')) return;
        logger.debug('index.resetBoard');
        const cfg = demoFactory();
        await state.reset(cfg);
        view.dispose?.();
        // Re-render with current state
                view = new KanbanView(root, state, logger);
    });

        // Import JSON via popup (file or paste)
        document.getElementById('importJson')?.addEventListener('click', () => {
                if (!view?.popup) return;
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
                                    textInput.value = txt; // also populate textarea for visibility
                                    // Also set the file input to keep a reference
                                    const dt = new DataTransfer();
                                    dt.items.add(file);
                                    fileInput.files = dt.files;
                                } catch (err) {
                                    alert('Lecture du fichier échouée: ' + (err?.message || err));
                                }
                            });
                        }

                const validSnapshot = (obj) => {
                        if (!obj || typeof obj !== 'object') return false;
                        if (!Array.isArray(obj.columns)) return false;
                        if (obj.board && typeof obj.board !== 'object') return false;
                        return true;
                };

                wrap.addEventListener('submit', async (e) => {
                        e.preventDefault();
                        try {
                                const data = await parsePayload();
                                if (!validSnapshot(data)) throw new Error('Format invalide: attendez { board?, columns: [] }');
                                // Normalize minimal snapshot: ensure columns id/name
                                data.columns = (data.columns || []).map(c => ({ id: String(c.id), name: String(c.name), tickets: Array.isArray(c.tickets) ? c.tickets : [] }));
                                await state.reset(data);
                                view.dispose?.();
                                view = new KanbanView(root, state, logger);
                                view.popup.close();
                        } catch (err) {
                                alert('Import échoué: ' + (err?.message || err));
                        }
                }, { once: true });

                view.popup.open({ title: 'Importer un board JSON', content: wrap });
        });

    // Download JSON snapshot (board meta + columns + tickets)
    document.getElementById('downloadJson')?.addEventListener('click', () => {
        const snapshot = {
            board: state.board,
            columns: state.columns.map(c => ({ id: c.id, name: c.name, tickets: c.tickets.map(t => (typeof t.toJSON === 'function' ? t.toJSON() : t)) }))
        };
        const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const date = new Date().toISOString().slice(0,19).replace(/[:T]/g,'-');
        a.href = url;
        a.download = `kanban-board-${date}.json`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    });
})();
