import {title, table as htmlTable, filters, filter} from "./views.js";


const container = $("#historial_guias2");

container.append(title);
container.append(filters);
container.append(htmlTable);

const table = $("#tabla-historial-guias").DataTable({
    destroy: true,
    data: null,
    rowId: "row_id",
    order: [[1, "desc"]],
    columns: [
        {data: "id_heka", title: "Id", defaultContent: ""},
        {data: "numeroGuia", title: "Guía transportadora", defaultContent: ""},
        {data: "estado", title: "Estado", defaultContent: ""},
        {data: "transportadora", 
        orderable: false,
        title: "Transportadora", defaultContent: ""},
        {data: "type", title: "Tipo", defaultContent: ""},
        {data: "nombreD", title: "Destinatario", defaultContent: ""},
        {
            data: "telefonoD", title: "Telefonos",
            defaultContent: "", render: (valor,type,row) => {
                if(type === "display" || type === "filter") {
                    const aCelular1 = `<a class="btn btn-light d-flex align-items-baseline mb-1 action" href="https://api.whatsapp.com/send?phone=57${valor.toString().replace(/\s/g, "")}" target="_blank"><i class="fab fa-whatsapp mr-1" style="color: #25D366"></i>${valor}</a>`;
                    const aCelular2 = `<a class="btn btn-light d-flex align-items-baseline action" href="https://api.whatsapp.com/send?phone=57${row["celularD"].toString().replace(/\s/g, "")}" target="_blank"><i class="fab fa-whatsapp mr-1" style="color: #25D366"></i>${row["celularD"]}</a>`;
                    return aCelular1;
                }

                return valor;
            }
        },
        {data: "ciudadD", title: "Ciudad", defaultContent: ""},
        {data: "fecha", title: "Fecha", defaultContent: ""},
        {
            data: "seguro", title: "Seguro", 
            defaultContent: "", render: (value, type, row) => {
                if(type === "display" || type === "filter") {
                    return value || row["valor"];
                }

                return value;
            }
        },
        {
            data: "valor", title: "Recaudo", 
            defaultContent: ""
        },
        {
            data: "costo_envio", title: "Costo de envío", 
            defaultContent: "",
        },
    ],
    language: {
      url: "https://cdn.datatables.net/plug-ins/1.10.24/i18n/Spanish.json"
    },
    dom: 'Bfrtip',
    buttons: [{
        extend: "excel",
        text: "Descargar excel",
        filename: "Historial Guías",
        exportOptions: {
          columns: [1,2,3,4,5,6,7,9,10,11,12,13]
        }
    }, {
        text: "Descargar guías",
        className: "btn btn-primary",
        action: descargarGuiasParticulares
    }, {
        text: "Crear Documentos",
        className: "btn btn-success",
        action: crearDocumentos
    }],
    scrollY: '50vh',
    scrollX: true,
    scrollCollapse: true,
    paging: false,
    lengthMenu: [ [-1, 10, 25, 50, 100], ["Todos", 10, 25, 50, 100] ],
    initComplete: agregarFuncionalidadesTablaPedidos
});

export default class SetHistorial {
    constructor() {
        this.guias = [];
        this.filtradas = [];
        this.filtrador = "pedido";
        this.renderTable = true;
    }

    add(guia) {
        const filtro = this.defineFilter(guia) === this.filtrador;
        const gIdx = this.guias.findIndex(g => g.id_heka === guia.id_heka);
        const lIdx = this.filtradas.findIndex(g => g.id_heka === guia.id_heka);

        if (filtro) {
            if(lIdx === -1) {
                this.filtradas.push(guia);
                table.row.add(guia)
                this.renderTable = true;
            } else {
                const row = table.row(lIdx);
                this.filtradas[lIdx] = guia;
                row.data(guia);
                this.renderTable = false;
            }
        } else if(!filtro && lIdx !== -1) {
            const row = table.row(lIdx);
            table.row(lIdx).remove();
            this.filtradas.splice(lIdx, 1);
            this.renderTable = true;
        }

        if(gIdx === -1) {
            this.guias.push(guia);
        } else {
            this.guias[gIdx] = guia;
        }
    }

    delete(id_heka) {
        const index = this.guias.indexOf(g => g.id_heka === id_heka);

        if(index !== -1) this.guias.splice(index,1);
    }

    defineFilter(data) {
        const estGeneradas = ["Envío Admitido", "RECIBIDO DEL CLIENTE", "Enviado", "", undefined];
        const estAnuladas = ["Documento Anulado", "Anulada"];

        let filter;

        if (data.staging) {
            filter = "pedido";
        } else if(!data.debe && data.type !== "CONVENCIONAL") {
            filter = "pagada"
        } else if (data.seguimiento_finalizado) {
            filter = "finalizada";
        } else if(!data.estado) {
            filter = "generada";
        } else {
            filter = "en proceso";
        }

        return filter;
    }

    defineButtons(filt) {
        table.buttons().remove();

        if(filt === "pedido") {
            table.button().add(0, {
                action: aceptarPedido,
                text: "Acceptar pedido"
            });
        } else {
            table.button().add(0, {
                action: () => console.log("funciona con " + filt),
                text: filt
            });
        }
    }

    filter(filt) {
        this.filtrador = filt;
        this.filtradas = this.guias.filter(g => this.defineFilter(g) === filt);
        this.render(true);


        return this.filtradas;
    }

    render(clear) {
        this.counterFilter();
        if(!this.renderTable && !clear) return;
        
        this.defineButtons(this.filtrador)
        if(clear) {
            table.clear()

            this.filtradas.forEach(guia => {
                table.row.add(guia);
            });
        }
        table.draw();

        this.renderTable = false;
    }

    counterFilter() {
        if(!this.nodeFilters) return;
        this.nodeFilters.each((i,node) => {
            const filt = node.getAttribute("data-filter");
            const cant = this.guias.filter(g => this.defineFilter(g) === filt).length;
            $(node).find(".counter").text(cant);
        })
    }

    includeFilters() {
        const container = $("#filtros-historial-guias");
        const filters = [
            {
                name: "Pedidos",
                dataFilter: "pedido"
            },
            {
                name: "Listado",
                dataFilter: "generada"
            },
            {
                name: "En Proceso",
                dataFilter: "en proceso"
            },
            {
                name: "Finalizadas",
                dataFilter: "finalizada"
            },
            {
                name: "otro",
                dataFilter: "nuevo"
            }
        ];
    
        filters.forEach(filt => {
            container.append(filter(filt));
        });
    
        const nodeFilters = container.children(".filtro");
        nodeFilters.css({width: 100 / nodeFilters.length + "%"});
        nodeFilters.filter((i, node) => node.getAttribute("data-filter") === this.filtrador)
        .addClass("active")

        const filtrar = this.filter.bind(this);
        
        nodeFilters.click(function() {
            nodeFilters.removeClass("active");
            this.classList.add("active");
            filtrar(this.getAttribute("data-filter"));
        });

        this.nodeFilters = nodeFilters;

        return filters;
    }
}

function agregarFuncionalidadesTablaPedidos() {
    $("#select-all-orders").change((e) => {
        if(e.target.checked) {
            $("tr:gt(0)", this).addClass("selected bg-gray-300");
        } else {
            $("tr:gt(0)", this).removeClass("selected bg-gray-300");
        }
    });


    // if (this[0].getAttribute("data-table_initialized")) {
    //     return;
    // } else {
    //     this[0].setAttribute("data-table_initialized", true);
    // }


    $('tbody', this).on( 'click', 'tr', function (e) {
        if(!e.target.classList.contains("selector") && e.target.nodeName !== "IMG")
        $(this).toggleClass('selected bg-gray-300');
    } );
}


async function aceptarPedido(e, dt, node, config) {
    let api = dt;
    const btnInitialText = $(node).text();
    // $(node).prop("disabled", true);
    $(node).html(`
        <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
        Generando guías
    `);

    // Cargador.fire("Creando guías", "Estamos generando las guías solicitadas, esto podría demorar unos minutos, por favor espere.")

    const selectedRows = api.rows(".selected");
    let datas = selectedRows.data();
    const nodos = selectedRows.nodes();
    console.log(datas);
    console.log(nodos);
    // return;


    for ( let i = 0; i < nodos.length; i++) {
        const guia = datas[i];
        const respuesta = await crearGuiaTransportadora(guia);
        const row = nodos[i];
        let icon, color;
        if(!respuesta.error) {
            icon = "clipboard-check";
            color = "text-success"
            row.classList.remove("selected", "bg-gray-300")
        } else {
            icon = "exclamation-circle";
            color = "text-danger";
        }
        notificacionPorGuia(row, respuesta.message, icon, color)    
    }
    
    function notificacionPorGuia(row, mensaje, icon, colorText) {
        $(row).after(`<tr><td colspan='10' class='${colorText}'><i class='fa fa-${icon} mr-2'></i>${mensaje}</td></tr>`)
    }
    
    $(node).text(btnInitialText);
    $(node).prop("disabled", false);

    Toast.fire({
        icon: "success",
        title: "¡Proceso terminado!"
    })
}
