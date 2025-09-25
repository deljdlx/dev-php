import '../bootstrap';
import '../../css/kanban.css';
import KanbanController from './KanbanController';

(async function bootstrap(){
    const root = document.getElementById('kanban');
    if (!root) return;
    const controller = new KanbanController(root);
    await controller.init();
})();
