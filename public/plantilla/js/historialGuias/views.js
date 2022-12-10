
const idTable = "tabla-historial-guias";
const table = `
    <style>
    #${idTable} td {
        vertical-align: middle;
    }
    </style>
    <div class="table-responsive mt-1">
        <table 
            id="${idTable}" 
            class="table table-bordered table-hover w-100"
            style="white-space: nowrap"
        ></table>
    </div>
`;

const title = "<h3>Nuevo historial de guías</h3>";

const filtersHtml = '<div id="filtros-historial-guias" class="d-flex overflow-auto px-3"></div>';

const filterHtml = (opts, i, length) => `
    <div style="min-width: 180px" 
    data-filter="${opts.dataFilter}"
    ${opts.id ? `id="${opts.id}"` : ""}
    class="filtro d-flex justify-content-between align-items-center p-2 position-relative ${i ? "m-12" : ""}">
        ${i + 1 != length ? '<div class="filter-arrow-start"></div>' : ""}
        <p class="text-truncate m-0 ml-2">${opts.name}</p> 
        <span class="badge badge-light mx-2 counter ${opts.classColorBadge ? opts.classColorBadge : ""}">0</span>
        ${i ? '<div class="filter-arrow-end"></div>' : ""}
    </div>
`;

const renderInfoFecha = (fechas) => {
    const [initial, final, numeroGuia] = fechas;
    const contenedor = $("#motrador_filt-guias_hist");

    if(numeroGuia) {
        contenedor.text("Número guía " + numeroGuia);
        return;
    }

    console.log(final, initial);
    const dayToMilli = 8.64e7;
    const meses = ["En.", "Febr.", "Mzo.", "Abr.", "My.", "Jun.", "Jul.", "Agto.", "Sept.", "Oct.", "Nov.", "Dic."];
    const mesN = n => new Date(n).getMonth();
    const yearN = n => new Date(n).getFullYear();
    const dayN = n => new Date(n).getDate();
    const actual = new Date().getTime();

    const parserDateToStr = (i,act) => `${dayN(i)} de ${meses[mesN(i)]} ${yearN(i) === yearN(act) && yearN(act) === yearN(actual) ? "" : "del " + yearN(i)}`;
    let respuesta = "";
    if(final - dayToMilli === initial) {
        respuesta = `Guías del ${parserDateToStr(initial, actual)}`;
    } else {
        const primeraPart = `${parserDateToStr(initial, final)}`;
        const segundaPart = `${parserDateToStr(final, initial)}`;
        respuesta = primeraPart + " - " + segundaPart
    }

    contenedor.text(respuesta);
}

export {table, title, filtersHtml, filterHtml, renderInfoFecha}