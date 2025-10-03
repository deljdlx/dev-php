import 'tabulator-tables/dist/css/tabulator_bootstrap5.min.css';
import { TabulatorFull as Tabulator } from 'tabulator-tables';


// resources/js/app.js
import '@tabler/core/dist/js/tabler.min.js';

// resources/css/app.css
import "@tabler/core/dist/css/tabler.min.css";
import "@tabler/core/dist/css/tabler-vendors.min.css"; /* si tu veux les vendors (datepicker, etc.) */
// Font Awesome (installed via npm) – used in the sandbox navbar examples
import "@fortawesome/fontawesome-free/css/all.min.css";


// MDB UI Kit (CSS + ALL components)
// import 'mdb-ui-kit/css/mdb.min.css';
// import * as mdb from 'mdb-ui-kit';

// // Initialize all MDB components at once
// document.addEventListener('DOMContentLoaded', () => {
//     if (typeof mdb.initMDB === 'function') {
//         mdb.initMDB(mdb);
//     }
// });


// Optionally include custom overrides if present
// import '../css/tabulator-demo.css';

// Jeu de données de démonstration
const tabledata = [
    {id:1, name:"Oli Bob", age:12, gender:"male", height:1.65, col:"red", dob:"14/04/2010", rating:5, passed:true},
    {id:2, name:"Mary May", age:1, gender:"female", height:1.00, col:"blue", dob:"14/05/2024", rating:4, passed:true},
    {id:3, name:"Christine Lobowski", age:42, gender:"female", height:1.72, col:"green", dob:"22/05/1983", rating:3, passed:false},
    {id:4, name:"Brendon Philips", age:125, gender:"male", height:1.82, col:"orange", dob:"01/08/1900", rating:5, passed:true},
    {id:5, name:"Margret Marmajuke", age:16, gender:"female", height:1.67, col:"yellow", dob:"31/01/2009", rating:2, passed:false},
];

window.addEventListener('DOMContentLoaded', () => {
    const table = new Tabulator('#example-table', {
        data: tabledata,
        layout: "fitColumns",
        height: 420,
        columns: [
            {title: "", field: "_select", formatter:"rowSelection", titleFormatter:"rowSelection", hozAlign:"center", headerSort:false, width:50},
            {title: "ID", field: "id", width: 60, sorter: "number"},
            {title: "Nom", field: "name", editor: "input", headerFilter:"input"},
            {title: "Âge", field: "age", width: 90, sorter: "number", editor:"number"},
            {title: "Sexe", field: "gender", width: 110, editor: "select", editorParams:{values:{male:"Homme", female:"Femme"}},
                formatter:function(cell){
                    const v = cell.getValue();
                    return v === 'male' ? 'Homme' : v === 'female' ? 'Femme' : v;
                }
            },
            {title: "Taille (m)", field: "height", width: 110, sorter: "number", formatter:"money", formatterParams:{decimal: ",", thousand: " ", precision: 2}},
            {title: "Couleur", field: "col"},
            {title: "Date de naissance", field: "dob"},
            {title: "Note", field: "rating", width: 110, formatter: "star", hozAlign: "center", editor:true},
            {title: "Validé", field: "passed", width: 100, hozAlign:"center", formatter:"tickCross", sorter:"boolean", editor:true},
        ],
        rowAdded:function(row){
            row.getTable().scrollToRow(row);
        }
    });

    document.querySelector('#add-row').addEventListener('click', () => {
        const id = (Math.max(0, ...table.getData().map(r => r.id)) + 1) || 1;
        table.addRow({id, name: 'Nouveau', age: 18, gender: 'male', height: 1.70, col: 'violet', dob: '01/01/2000', rating: 3, passed: false}, true);
    });

    document.querySelector('#del-row').addEventListener('click', () => {
        const selected = table.getSelectedRows();
        if (selected.length === 0) return alert('Sélectionnez au moins une ligne');
        selected.forEach(r => r.delete());
    });

    document.querySelector('#download').addEventListener('click', () => {
        table.download('csv', 'table.csv');
    });

    const filterInput = document.querySelector('#filter-value');
    const clearBtn = document.querySelector('#clear-filter');

    function applyFilter() {
        const v = filterInput.value?.trim();
        if (!v) { table.clearHeaderFilter(); return; }
        table.setHeaderFilterValue('name', v);
    }

    filterInput.addEventListener('input', applyFilter);
    clearBtn.addEventListener('click', () => { filterInput.value=''; table.clearHeaderFilter(); });
});
