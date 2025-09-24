import '../bootstrap';
import '../../css/kanban.css';
import KanbanState from './state';
import demoFactory from './demoFactory';
import { DemoDataSource } from './datasource';
import createLogger from './utils/createLogger';
import { KanbanView } from './view';

(async function bootstrap(){
    const root = document.getElementById('kanban');
    if (!root) return;
    const logger = createLogger('Kanban');
    const dataSource = new DemoDataSource(demoFactory, 'demo.kanban.v5', logger);
    const state = new KanbanState(dataSource, { logger });
    await state.load();
    const view = new KanbanView(root, state, logger);

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
