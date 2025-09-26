import '../bootstrap';
import '../../css/kanban.css';
import KanbanApplication from './KanbanApplication';
import { MouseFX } from './ui/ParticlesFX';

(async function bootstrap() {

  console.group('%cindex.js :: 8 =============================', 'color: #135484; font-size: 1rem');
  console.log('📅', new Date().toLocaleString());
  console.groupEnd();

    const root = document.getElementById('kanban');
    if (!root) return;
  const controller = new KanbanApplication(root);
    await controller.init();
    // Soft mouse trail (gentle)
    try {
        const fx = new MouseFX({ effect: 'trail' });
        fx.start();
        window.__mouseFx = fx; // optional for toggling/debug
    } catch {}
})();
