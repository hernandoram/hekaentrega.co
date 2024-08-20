export const defFiltrado = estadosGuia;

export const filters = [
    {
        name: "Por generar",
        description: "Aquellas guías registradas en la plataforma, pero no generadas aún con la transportadora.",
        dataFilter: defFiltrado.pedido
    },
    {
        name: "Generadas",
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
        description: "Pagos efectuados en el rango filtrado.",
        dataFilter: defFiltrado.pagada
    },
    {
        name: "Todas",
        description: "Total de todas las guías a mostrar.",
        dataFilter: defFiltrado.neutro
    },
    {
        id: "filter_novedad-guias_hist",
        name: "En novedad",
        description: "Muestran aquellas guías que presentan novedad.",
        dataFilter: defFiltrado.novedad,
        classColorBadge: "text-danger"
    },
    {
        id: "Eliminadas",
        name: "Eliminadas",
        description: "Muestran aquellas guías que fueron eliminadas.",
        dataFilter: defFiltrado.eliminada,
    },
    {
        id: "Anuladas",
        name: "Anuladas",
        description: "Muestran aquellas guías que fueron anuladas.",
        dataFilter: defFiltrado.anulada,
    },
];

//Devuelve un string con el tipo de filtrado según la guía
export function defineFilter(data) {
    const estGeneradas = ["Envío Admitido", "RECIBIDO DEL CLIENTE", "Enviado", "", undefined];
    const estAnuladas = ["Documento Anulado", "Anulada"];

    let filter;

    if (data.enNovedad) {
        filter = defFiltrado.novedad;
    } else if (data.estadoActual === defFiltrado.pedido) {
        filter = defFiltrado.pedido;
    } else if(!data.debe && data.type !== "CONVENCIONAL") {
        filter = defFiltrado.pagada
    }else if(data.estadoActual === defFiltrado.anulada) {
        filter = defFiltrado.anulada;
    } else if(data.estadoActual === defFiltrado.eliminada) {
        filter = defFiltrado.eliminada;
    } else if(data.estadoActual === defFiltrado.generada) {
        filter = defFiltrado.generada;
    } else if(data.estadoActual === defFiltrado.proceso) {
        filter = defFiltrado.proceso;
    } else if (data.seguimiento_finalizado) {
        filter = defFiltrado.finalizada;
    } else {
        filter = defFiltrado.proceso;
    }
    return filter;
}