import '../bootstrap';
import '../../css/kanban.css';
import KanbanController from './KanbanController';
import { MouseFX } from './ui/ParticlesFX';

(async function bootstrap(){
    const root = document.getElementById('kanban');
    if (!root) return;
    const controller = new KanbanController(root);
    await controller.init();
    // Soft mouse trail (gentle)
    try {
        const fx = new MouseFX({ effect: 'trail' });
        fx.start();
        window.__mouseFx = fx; // optional for toggling/debug
    } catch {}
})();
