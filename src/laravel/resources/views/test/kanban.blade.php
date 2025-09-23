<!doctype html>
<html lang="fr">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Kanban (SortableJS, no backend)</title>
    <style>
        :root { --bg:#0b1020; --panel:#131a2a; --muted:#98a2b3; --text:#e2e8f0; --accent:#6ea8fe; }
        * { box-sizing: border-box; }
        html, body { height: 100%; }
        body { margin:0; font-family: system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, "Helvetica Neue", Arial, "Noto Sans", "Apple Color Emoji", "Segoe UI Emoji"; background: var(--bg); color: var(--text); }
        .wrap { padding: 20px; }
        .board {
            display: grid;
            grid-template-columns: repeat(4, minmax(260px, 1fr));
            gap: 16px;
            align-items: start;
        }
        .col { background: var(--panel); border-radius: 10px; padding: 12px; box-shadow: 0 0 0 1px rgba(255,255,255,.04) inset; }
        .col-header { display:flex; align-items:center; justify-content: space-between; margin-bottom: 10px; }
        .col-title { font-weight: 700; letter-spacing:.2px; }
        .count { background: #1f2937; color: #cbd5e1; padding: 2px 8px; border-radius: 999px; font-size: 12px; }
        .list { display:flex; flex-direction: column; gap: 8px; min-height: 40px; }
        .card { background: #0f172a; border: 1px solid #1f2937; border-radius: 10px; padding: 10px; cursor: grab; user-select: none; }
        .card:active { cursor: grabbing; }
        .card-title { font-size: 14px; font-weight: 600; }
        .card-meta { color: var(--muted); font-size: 12px; margin-top: 6px; display:flex; gap:10px; align-items:center; }
        .label { padding: 2px 6px; border-radius: 6px; font-size: 11px; font-weight: 700; letter-spacing:.25px; opacity:.9; }
        .label.blue { background:#1d4ed8; color:white; }
        .label.green { background:#16a34a; color:white; }
        .label.orange { background:#ea580c; color:white; }
        .ghost { opacity: .4; }
        .drag-hint { outline: 2px dashed rgba(110,168,254,.4); border-radius: 8px; }
        .toolbar { display:flex; align-items:center; justify-content: space-between; margin-bottom: 16px; }
        .btn { background:#1f2937; color: #e2e8f0; border:1px solid #334155; padding:8px 12px; border-radius:8px; cursor:pointer; }
        .btn:hover { background:#263244; }
        .credits { margin-top: 18px; color:#94a3b8; font-size:12px; }
        @media (max-width: 1100px) { .board { grid-template-columns: repeat(2, minmax(260px, 1fr)); } }
        @media (max-width: 600px) { .board { grid-template-columns: 1fr; } }
    </style>
</head>
<body>
<div class="wrap">
    <div class="toolbar">
        <h1 style="margin:0; font-size:18px;">Kanban demo</h1>
        <div>
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
