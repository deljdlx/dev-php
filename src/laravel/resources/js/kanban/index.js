import '../bootstrap';
import '../../css/kanban.css';
import KanbanState from './state';
import demoFactory from './demoFactory';
import { DemoDataSource } from './datasource';
import createLogger from './utils/createLogger';
import { KanbanView } from './view';
import NewTicketForm from './ui/NewTicketForm';

(async function bootstrap(){
    const root = document.getElementById('kanban');
    if (!root) return;
    const logger = createLogger('Kanban');
    const dataSource = new DemoDataSource(demoFactory, 'demo.kanban.v6', logger);
    const state = new KanbanState(dataSource, { logger });
    await state.load();
    const view = new KanbanView(root, state, logger);

    // Open popup with the NewTicketForm and create a ticket on submit
    document.getElementById('createTicket')?.addEventListener('click', () => {
        const form = NewTicketForm({ getOptions: (k) => state.getTaxonomyOptions(k), getKeys: () => state.getTaxonomyKeys() });
        view.popup.open({
            title: 'Créer un ticket',
            content: () => {
                // Attach submit handler once the node is in the DOM
                setTimeout(() => {
                    form.el.addEventListener('submit', async (e) => {
                        e.preventDefault();
                        // Basic HTML5 validation
                        if (!form.el.checkValidity?.() && form.el.reportValidity) {
                            form.el.reportValidity();
                            return;
                        }
                        const data = form.getData();
                        // Default to first column for now
                        const targetCol = state.columns[0];
                        if (!targetCol) return;
                        const ticket = {
                            id: undefined,
                            title: data.title,
                            description: data.description,
                            author: data.author,
                            taxonomies: data.taxonomies,
                            createdAt: Date.now(),
                        };
                        logger.debug('index.createTicket.submit', { columnId: targetCol.id, ticket });
                        await state.addTicket(targetCol.id, ticket);
                        const list = document.querySelector(`#list-${targetCol.id}`);
                        const added = state.columns.find(c => c.id === targetCol.id)?.tickets[0] ?? ticket;
                        const card = view.createCardElement(added);
                        list?.prepend(card);
                        card.setAttribute('tabindex', '-1');
                        card.focus({ preventScroll: true });
                        view.updateCounts();
                        view.popup.close();
                    }, { once: true });
                });
                return form.el;
            },
        });
    });

    document.getElementById('addRandom')?.addEventListener('click', async () => {
        const first = state.columns[0];
        const labels = ['blue','green','orange',null];
        const categories = ['bug','feature','docs','chore'];
        const descs = ['Ticket généré pour test', 'Lorem ipsum dolor sit amet', 'Voir backlog pour contexte', 'Petite tâche technique'];
        const authors = ['Alice', 'Bob', 'Chloé', 'David'];
        const complexities = ['xs','s','m','l','xl'];
        const ticket = {
            id: undefined,
            title: 'Tâche aléatoire ' + Math.floor(Math.random()*1000),
            description: descs[Math.floor(Math.random()*descs.length)],
            author: authors[Math.floor(Math.random()*authors.length)],
            taxonomies: {
                label: labels[Math.floor(Math.random()*labels.length)],
                category: categories[Math.floor(Math.random()*categories.length)],
                complexity: complexities[Math.floor(Math.random()*complexities.length)],
            },
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
        await state.reset(demoFactory());
        new KanbanView(root, state, logger); // re-render
    });
})();
