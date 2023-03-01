export const defFiltrado = estadosGuia;

export const filters = [
    {
        name: "Pedidos",
        dataFilter: defFiltrado.pedido
    },
    {
        name: "Listado",
        dataFilter: defFiltrado.generada,
        id: "filter_listado-guias_hist"
    },
    {
        name: "En Proceso",
        dataFilter: defFiltrado.proceso,
        id: "filter_proceso-guias_hist"
    },
    {
        name: "Finalizadas",
        dataFilter: defFiltrado.finalizada
    },
    {
        name: "Pagadas",
        dataFilter: defFiltrado.pagada
    },
    {
        id: "filter_novedad-guias_hist",
        name: "En novedad",
        dataFilter: defFiltrado.novedad,
        classColorBadge: "text-danger"
    }
];