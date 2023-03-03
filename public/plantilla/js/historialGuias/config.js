export const defFiltrado = estadosGuia;

export const filters = [
    {
        name: "Pedidos",
        description: "Aquellas guías registradas en heka, pero no generadas aún con la transportadora.",
        dataFilter: defFiltrado.pedido
    },
    {
        name: "Listado",
        description: "Guías que, una vez creada con la transportadora, no presentas movimientos o que aún no han sido procesadas.",
        dataFilter: defFiltrado.generada,
        id: "filter_listado-guias_hist"
    },
    {
        name: "En Proceso",
        description: "Guías procesadas o con movimiento activo con la transportadora.",
        dataFilter: defFiltrado.proceso,
        id: "filter_proceso-guias_hist"
    },
    {
        name: "Finalizadas",
        description: "Guías que han culminado su proceso de entrega.",
        dataFilter: defFiltrado.finalizada
    },
    {
        name: "Pagadas",
        description: "Pagos efectuados por heka en el rango filtrado.",
        dataFilter: defFiltrado.pagada
    },
    {
        name: "Todas",
        description: "Total de todas las guías a mopstrar.",
        dataFilter: defFiltrado.neutro
    },
    {
        id: "filter_novedad-guias_hist",
        name: "En novedad",
        description: "Muesran aquellas guías que presentan novedad.",
        dataFilter: defFiltrado.novedad,
        classColorBadge: "text-danger"
    }
];

//Devuelve un string con el tipo de filtrado según la guía
export function defineFilter(data) {
    const estGeneradas = ["Envío Admitido", "RECIBIDO DEL CLIENTE", "Enviado", "", undefined];
    const estAnuladas = ["Documento Anulado", "Anulada"];

    let filter;

    if (data.enNovedad) {
        filter = defFiltrado.novedad;
    } else if (data.staging) {
        filter = defFiltrado.pedido;
    } else if(!data.debe && data.type !== "CONVENCIONAL") {
        filter = defFiltrado.pagada
    } else if (data.seguimiento_finalizado) {
        filter = defFiltrado.finalizada;
    } else if(data.estadoActual === defFiltrado.generada) {
        filter = defFiltrado.generada;
    } else {
        filter = defFiltrado.proceso;
    }

    return filter;
}