<!doctype html>
<html lang="fr">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Kanban (SortableJS, no backend)</title>
</head>
<body>
<div class="wrap">
    <div class="toolbar">
    <h1 class="title" id="kanban-title">Kanban</h1>
    <button id="kanban-title-warn" type="button" class="btn" style="margin-left:8px; display:none;"></button>
        <div>
            <button class="btn" id="toggleTheme" title="Basculer thème">Mode clair</button>
            <button class="btn" id="createTicket">Créer nouveau ticket</button>
            <button class="btn" id="addRandom">Ajouter une carte aléatoire</button>
            <button class="btn" id="downloadJson">Télécharger JSON</button>
            <button class="btn" id="importJson">Importer JSON</button>
            <button class="btn" id="resetBoard">Réinitialiser</button>
        </div>
    </div>
    <div id="kanban-filters" class="filters"></div>
    <div id="kanban" class="board"></div>
    <p class="credits">JS POO + SortableJS. Aucun backend; données en mémoire/localStorage.</p>
</div>

@vite('resources/js/kanban/index.js')
</body>
</html>
