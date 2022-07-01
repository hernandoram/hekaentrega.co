
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

const filters = '<div id="filtros-historial-guias" class="d-flex overflow-auto my-3 px-3"></div>';

const filter = (opts, i, length) => `
    <div style="min-width: 180px" 
    data-filter="${opts.dataFilter}"
    class="filtro d-flex justify-content-between align-items-center p-2 position-relative ${i ? "m-12" : ""}">
        ${i + 1 != length ? '<div class="filter-arrow-start"></div>' : ""}
        <p class="text-truncate m-0 ml-2">${opts.name}</p> 
        <span class="badge badge-light mx-2 counter">0</span>
        ${i ? '<div class="filter-arrow-end"></div>' : ""}
    </div>
`;

export {table, title, filters, filter}