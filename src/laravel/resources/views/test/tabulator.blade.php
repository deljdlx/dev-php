<!doctype html>
<html lang="fr">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Tabulator + Bootstrap theme (demo)</title>
    <style>
        body { padding: 20px; }
        .tabulator { font-size: 0.95rem; }
    </style>

    <!-- Font Awesome -->
    <link
    href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css"
    rel="stylesheet"
    />
    <!-- Google Fonts -->
    <link
    href="https://fonts.googleapis.com/css?family=Roboto:300,400,500,700&display=swap"
    rel="stylesheet"
    />

    @vite('resources/js/tabulator-demo.js')
</head>
<body>
<div class="container">


  @include('test.navbar')


    <div class="card">
        <div class="card-header d-flex gap-2 flex-wrap">
            <button id="add-row" class="btn btn-primary btn-sm">Ajouter une ligne</button>
            <button id="del-row" class="btn btn-danger btn-sm">Supprimer sélection</button>
            <button id="download" class="btn btn-outline-secondary btn-sm">Télécharger CSV</button>
            <div class="ms-auto d-flex gap-2">
                <input id="filter-value" class="form-control form-control-sm" placeholder="Filtrer par nom...">
                <button id="clear-filter" class="btn btn-sm btn-outline-secondary">Effacer</button>
            </div>
        </div>
        <div class="card-body">
            <div id="example-table"></div>
        </div>
    </div>
</div>

<!-- Scripts chargés via Vite -->
</body>
</html>
