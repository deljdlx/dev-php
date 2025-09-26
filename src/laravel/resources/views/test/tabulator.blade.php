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
    <div class="d-flex align-items-center mb-3">
        <h1 class="h3 mb-0">Tabulator - Thème Bootstrap</h1>
        <a class="btn btn-outline-secondary ms-3" href="/" title="Accueil">Accueil</a>
    </div>


<div class="accordion" id="accordionExample">
  <div class="accordion-item">
    <h2 class="accordion-header" id="headingOne">
      <button
        data-mdb-collapse-init
        class="accordion-button"
        type="button"
        data-mdb-target="#collapseOne"
        aria-expanded="true"
        aria-controls="collapseOne"
      >
        Accordion Item #1
      </button>
    </h2>
    <div id="collapseOne" class="accordion-collapse collapse show" aria-labelledby="headingOne" data-mdb-parent="#accordionExample">
      <div class="accordion-body">
        <strong>This is the first item's accordion body.</strong> It is hidden by default,
        until the collapse plugin adds the appropriate classes that we use to style each
        element. These classes control the overall appearance, as well as the showing and
        hiding via CSS transitions. You can modify any of this with custom CSS or
        overriding our default variables. It's also worth noting that just about any HTML
        can go within the <strong>.accordion-body</strong>, though the transition does
        limit overflow.
      </div>
    </div>
  </div>
  <div class="accordion-item">
    <h2 class="accordion-header" id="headingTwo">
      <button
        data-mdb-collapse-init
        class="accordion-button collapsed"
        type="button"
        data-mdb-target="#collapseTwo"
        aria-expanded="false"
        aria-controls="collapseTwo"
      >
        Accordion Item #2
      </button>
    </h2>
    <div id="collapseTwo" class="accordion-collapse collapse" aria-labelledby="headingTwo" data-mdb-parent="#accordionExample">
      <div class="accordion-body">
        <strong>This is the second item's accordion body.</strong> It is hidden by
        default, until the collapse plugin adds the appropriate classes that we use to
        style each element. These classes control the overall appearance, as well as the
        showing and hiding via CSS transitions. You can modify any of this with custom CSS
        or overriding our default variables. It's also worth noting that just about any
        HTML can go within the <strong>.accordion-body</strong>, though the transition
        does limit overflow.
      </div>
    </div>
  </div>
  <div class="accordion-item">
    <h2 class="accordion-header" id="headingThree">
      <button
        data-mdb-collapse-init
        class="accordion-button collapsed"
        type="button"
        data-mdb-target="#collapseThree"
        aria-expanded="false"
        aria-controls="collapseThree"
      >
        Accordion Item #3
      </button>
    </h2>
    <div id="collapseThree" class="accordion-collapse collapse" aria-labelledby="headingThree" data-mdb-parent="#accordionExample">
      <div class="accordion-body">
        <strong>This is the third item's accordion body.</strong> It is hidden by default,
        until the collapse plugin adds the appropriate classes that we use to style each
        element. These classes control the overall appearance, as well as the showing and
        hiding via CSS transitions. You can modify any of this with custom CSS or
        overriding our default variables. It's also worth noting that just about any HTML
        can go within the <strong>.accordion-body</strong>, though the transition does
        limit overflow.
      </div>
    </div>
  </div>
</div>




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
