import '../bootstrap';
import '../../css/kanban.css';
import KanbanController from './KanbanController';
import startParticles, { MouseFX } from './ui/ParticlesFX';

(async function bootstrap(){
    const root = document.getElementById('kanban');
    if (!root) return;
    const controller = new KanbanController(root);
    await controller.init();
        // Fancy: mouse FX isolated via class (purely visual)
        try {
            const fx = new MouseFX({ effect: 'cursor' });
            fx.start();
            // Optional: expose to window for quick toggling in dev
            window.__mouseFx = fx;
        } catch {}
})();
