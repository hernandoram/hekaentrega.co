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
        id: "filter_novedad-guias_hist",
        name: "En novedad",
        description: "Muesran aquellas guías que presentan novedad.",
        dataFilter: defFiltrado.novedad,
        classColorBadge: "text-danger"
    }
];