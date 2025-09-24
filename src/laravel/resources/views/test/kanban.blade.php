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
    <h1 class="title">Kanban demo</h1>
        <div>
            <button class="btn" id="createTicket">Créer nouveau ticket</button>
            <button class="btn" id="addRandom">Ajouter une carte aléatoire</button>
            <button class="btn" id="resetBoard">Réinitialiser</button>
        </div>
    </div>
    <div id="kanban" class="board"></div>
    <p class="credits">JS POO + SortableJS. Aucun backend; données en mémoire/localStorage.</p>
</div>

@vite('resources/js/kanban/index.js')
</body>
</html>
