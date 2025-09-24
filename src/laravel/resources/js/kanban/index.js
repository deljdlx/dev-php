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
    const dataSource = new DemoDataSource(demoFactory, 'demo.kanban.v6', logger);
    const state = new KanbanState(dataSource, { logger });
    await state.load();
    const view = new KanbanView(root, state, logger);

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
        new KanbanView(root, state, logger);
    });
})();
