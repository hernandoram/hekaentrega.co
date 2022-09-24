export const defFiltrado = {
    novedad: "novedad",
    pedido: "pedido",
    pagada: "pagada",
    finalizada: "finalizada",
    generada: "generada",
    proceso: "en proceso"
}

export const filters = [
    {
        name: "Pedidos",
        dataFilter: defFiltrado.pedido
    },
    {
        name: "Listado",
        dataFilter: defFiltrado.generada
    },
    {
        name: "En Proceso",
        dataFilter: defFiltrado.proceso
    },
    {
        name: "Finalizadas",
        dataFilter: defFiltrado.finalizada
    },
    {
        name: "En novedad",
        dataFilter: defFiltrado.novedad
    }
];