import '../bootstrap';
import '../../css/kanban.css';
import KanbanState from './state';
import demoFactory from './demoFactory';
import { DemoDataSource } from './datasource';
import { KanbanView } from './view';

(async function bootstrap(){
    const root = document.getElementById('kanban');
    if (!root) return;
    const dataSource = new DemoDataSource(demoFactory, 'demo.kanban.v1');
    const state = new KanbanState(dataSource);
    await state.load();
    const view = new KanbanView(root, state);

    document.getElementById('addRandom')?.addEventListener('click', async () => {
        const first = state.columns[0];
        const labels = ['blue','green','orange',null];
        const ticket = { id: undefined, title: 'Tâche aléatoire ' + Math.floor(Math.random()*1000), label: labels[Math.floor(Math.random()*labels.length)], createdAt: Date.now() };
        await state.addTicket(first.id, ticket);
        const list = document.querySelector(`#list-${first.id}`);
        const added = state.columns.find(c => c.id === first.id)?.tickets[0] ?? ticket;
        list?.prepend(view.createCardElement(added));
        view.updateCounts();
    });

    document.getElementById('resetBoard')?.addEventListener('click', async () => {
        if (!confirm('Réinitialiser le board aux données de démo ?')) return;
    await state.reset(demoFactory());
        new KanbanView(root, state); // re-render
    });
})();
