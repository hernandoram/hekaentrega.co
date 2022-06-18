
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

const filters = '<div id="filtros-historial-guias" class="d-flex overflow-auto my-3"></div>';

const filter = (opts) => `
    <div style="min-width: 180px" 
    data-filter="${opts.dataFilter}"
    class="filtro d-flex justify-content-between border align-items-center p-2">
        <p class="text-truncate m-0">${opts.name}</p> 
        <div class="d-flex align-items-center">
            <span class="badge badge-light mx-2 counter">0</span>
            <i class="fa fa-2x fa-angle-right"></i>
        </div>
    </div>
`;

export {table, title, filters, filter}