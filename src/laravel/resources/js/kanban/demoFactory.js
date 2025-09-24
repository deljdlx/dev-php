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
  const mk = (n) => Array.from({length:n}, () => new Ticket({
  title: pick(sampleTitles) + ' #' + Math.floor(Math.random()*900+100),
  label: pick([null,'blue','green','orange']),
    category: pick([null,'bug','feature','docs','chore']),
    description: pick(sampleDescs),
    author: pick(authors)
  }));
  return [
    new Column({ id:'todo',   name:'À faire',     tickets: mk(4) }),
    new Column({ id:'doing',  name:'En cours',    tickets: mk(3) }),
    new Column({ id:'review', name:'En revue',    tickets: mk(2) }),
    new Column({ id:'done',   name:'Terminé',     tickets: mk(3) }),
  ];
}

export default demoFactory;
