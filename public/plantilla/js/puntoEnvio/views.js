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

export { table, idTable }
