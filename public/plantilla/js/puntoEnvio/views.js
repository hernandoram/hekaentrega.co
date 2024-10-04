const idTable = "tabla-flexii_guia";
const table = `
    <style>
    #${idTable} td {
        vertical-align: middle;
        padding: .5rem
    }
    </style>
    <div class="table-responsive mt-1">
        <table 
            id="${idTable}" 
            class="table table-bordered table-hover w-100"
            style="white-space: nowrap; width:100%"
        ></table>
    </div>
`;

const bodegasEl = $("#bodega-flexii_guia");
const oficinaDestinoEl = $("#ciudadD-flexii_guia");
const diceContenerEl = $("#dice_contener-flexii_guia");
const recoleccionEl = $("#recoleccion_esporadica-flexii_guia");



export { table, idTable, bodegasEl, oficinaDestinoEl, diceContenerEl, recoleccionEl }
