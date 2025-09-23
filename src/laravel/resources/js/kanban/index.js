import '../bootstrap';
import { KanbanState, demoFactory } from './state';
import { KanbanView } from './view';

(function bootstrap(){
    const root = document.getElementById('kanban');
    if (!root) return;
    const state = new KanbanState('demo.kanban.v1');
    state.load(demoFactory);
    const view = new KanbanView(root, state);

    document.getElementById('addRandom')?.addEventListener('click', () => {
        const first = state.columns[0];
        const labels = ['blue','green','orange',null];
        const ticket = { id: undefined, title: 'Tâche aléatoire ' + Math.floor(Math.random()*1000), label: labels[Math.floor(Math.random()*labels.length)], createdAt: Date.now() };
        state.addTicket(first.id, ticket);
        const list = document.querySelector(`#list-${first.id}`);
        list?.prepend(view.createCardElement(ticket));
        view.updateCounts();
    });

    document.getElementById('resetBoard')?.addEventListener('click', () => {
        if (!confirm('Réinitialiser le board aux données de démo ?')) return;
        state.reset(demoFactory());
        new KanbanView(root, state); // re-render
    });
})();
