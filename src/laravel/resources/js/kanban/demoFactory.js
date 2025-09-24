import Column from './models/Column';
import Ticket from './models/Ticket';

function demoFactory() {
  const pick = (arr) => arr[Math.floor(Math.random()*arr.length)];
  const sampleTitles = [
    'Configurer CI GitHub', 'Corriger bug pagination', 'Design page profil',
    'Intégrer Stripe', 'Refacto service mail', 'Rédiger docs API', 'Revue sécurité'
  ];
  const sampleDescs = [
    null,
    'Détails à vérifier avec l\'équipe QA.',
    'Voir la PR précédente pour le contexte.',
    'Ajouter des tests unitaires minimaux.',
  ];

  const authors = ['Alice', 'Bob', 'Chloé', 'David'];
  const board = {
    taxonomies: {
      label: { label: 'Couleur', options: [
        { key: 'blue', label: 'BLEU' },
        { key: 'green', label: 'VERT' },
        { key: 'orange', label: 'ORANGE' },
      ] },
      category: { label: 'Catégorie', options: [
        { key: 'bug', label: 'Bug' },
        { key: 'feature', label: 'Feature' },
        { key: 'docs', label: 'Docs' },
        { key: 'chore', label: 'Chore' },
      ] },
      complexity: { label: 'Complexité', options: [
        { key: 'xs', label: 'XS' },
        { key: 's', label: 'S' },
        { key: 'm', label: 'M' },
        { key: 'l', label: 'L' },
        { key: 'xl', label: 'XL' },
      ] },
    }
  };
  const mk = (n) => Array.from({length:n}, () => {
    const chosen = {};
    for (const [key, meta] of Object.entries(board.taxonomies)) {
      const opts = Array.isArray(meta?.options) ? meta.options : [];
      // 25% chance to be null, else pick a valid option if available
      const picked = Math.random() < 0.25 ? null : (opts.length ? pick(opts) : null);
      chosen[key] = picked ? picked.key : null;
    }
    return new Ticket({
      title: pick(sampleTitles) + ' #' + Math.floor(Math.random()*900+100),
      description: pick(sampleDescs),
      author: pick(authors),
      taxonomies: chosen,
    });
  });
  const columns = [
    new Column({ id:'todo',   name:'À faire',     tickets: mk(4) }),
    new Column({ id:'doing',  name:'En cours',    tickets: mk(3) }),
    new Column({ id:'review', name:'En revue',    tickets: mk(2) }),
    new Column({ id:'done',   name:'Terminé',     tickets: mk(3) }),
  ];
  return { board, columns };
}

export default demoFactory;
