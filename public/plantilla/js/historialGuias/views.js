const container = $("#historial_guias2");
const idTable = "tabla-historial-guias";
const table = `
    <div class="table-responsive">
        <table 
            id="${idTable}" 
            class="display table table-bordered table-hover"
        ></table>
    </div>
`;

const title = "<h3>Nuevo historial de guías</h3>";

container.append(title);
container.append(table);

export {idTable}