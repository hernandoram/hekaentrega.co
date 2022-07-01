const opcionesBasicas = {
    destroy: true,
    data: null,
    rowId: "row_id",
    order: [[1, "desc"]],
    language: {
      url: "https://cdn.datatables.net/plug-ins/1.10.24/i18n/Spanish.json"
    },
    dom: 'Bfrtip',
    scrollY: '60vh',
    scrollX: true,
    scrollCollapse: true,
    paging: false,
    lengthMenu: [ [-1, 10, 25, 50, 100], ["Todos", 10, 25, 50, 100] ],
}

export const tablaInicial = $("#tabla_pedidos-historial_guia").DataTable({
    ...opcionesBasicas,
    columns: [
        {data: null, title: "Acción", render: accionesDeFila},
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
    buttons: [{
        action: aceptarPedido,
        text: "Acceptar pedido"
    }],
    initComplete: agregarFuncionalidadesTablaPedidos,
    drawCallback: renderizadoDeTablaHistorialGuias
});


// ******** ACCIONES DE LOS BOTONES ********** //
//Para cuando los pedidos están en staggin, permiter proceder con la creación de la guía
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

// ******** FIN DE ACCIONES DE LOS BOTONES ********** //

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
        console.log(!e.target.classList.contains("action"), e.target.tagName !== "I")
        if(!e.target.classList.contains("action") && e.target.tagName !== "I")
        $(this).toggleClass('selected bg-gray-300');
    } );
}

function renderizadoDeTablaHistorialGuias(config) {
    console.count("renderizando tabla");
    const api = this.api();
    const data = this.api().data();

    data.each((data, i) => {
        const row = api.row(i).node();
        const buttonsActivated = row.getAttribute("data-active");
        
        if(!buttonsActivated) {
            activarBotonesDeGuias(data.id_heka, data, true);
        }

        row.setAttribute("data-active", true);
    });

    return;

    api.column(0).nodes().to$().each((i, el) => {
        const buttonsToHide = $(el).children().children("button:gt(1)");
        const verMas = $(el).children().children("a:not(.activated)");

        verMas.click(() => {
            if(buttonsToHide.css("display") === "none") {
                buttonsToHide.show();
                verMas.text("Ver menos");
            } else {
                buttonsToHide.hide();
                verMas.text("Ver más");
            }
        });
        buttonsToHide.css("display", "none");
        verMas.text("Ver más");
        verMas.addClass("activated");
    });

}

function accionesDeFila(datos, type, row) {
    if(type === "display" || type === "filter") {
        const filtrado = defineFilter(row);
        const id = datos.id_heka;
        const generacion_automatizada = ["automatico", "automaticoEmp"].includes(transportadoras[datos.transportadora || "SERVIENTREGA"].sistema());
        const showCloneAndDelete = datos.enviado ? "d-none" : "";
        const showDownloadAndRotulo = !datos.enviado ? "d-none" : "";
        const showMovements = datos.numeroGuia && datos.estado ? "" : "d-none";
        let buttons = `
        <div data-search="${datos.filter}"
        class="d-flex justify-content-around flex-wrap">
        `;

        const btnCrearSticker = `<button class="btn btn-primary btn-circle btn-sm mt-2 action" data-id="${id}"
        data-funcion="activar-desactivar"
        id="crear_sticker${id}" title="Crear Sticker de la guía">
            <i class="fas fa-stamp"></i>
        </button>`
        
        const btnEdit = `<button class="btn btn-primary btn-circle btn-sm mt-2 action" data-id="${id}"
        data-funcion="activar-desactivar"
        id="editar_guia${id}" title="Editar guía">
            <i class="fas fa-edit"></i>
        </button>`

        const btnMovimientos = `<button class="btn btn-primary btn-circle btn-sm mt-2 action" data-id="${id}"
        id="ver_movimientos${id}" data-toggle="modal" data-target="#modal-gestionarNovedad"
        title="Revisar movimientos">
            <i class="fas fa-truck"></i>
        </button>`

        const btnDownloadDocs =  `<button class="btn btn-primary btn-circle btn-sm mt-2 action" data-id="${id}"
        id="descargar_documento${id}" title="Descargar Documentos">
            <i class="fas fa-file-download"></i>
        </button>`;

        const btnRotulo = `<button class="btn btn-primary btn-circle btn-sm mt-2 action" data-id="${id}"
        data-funcion="activar-desactivar" data-activate="after"
        id="generar_rotulo${id}" title="Generar Rótulo">
            <i class="fas fa-ticket-alt"></i>
        </button>`

        const btnClone = `<button class="btn btn-success btn-circle btn-sm mt-2 action ${showCloneAndDelete}" data-id="${id}" 
        id="clonar_guia${id}" data-funcion="activar-desactivar" data-costo_envio="${datos.costo_envio}"
        title="Clonar Guía">
            <i class="fas fa-clone"></i>
        </button>`;

        const btnDelete = `<button class="btn btn-danger btn-circle btn-sm mt-2 action ${showCloneAndDelete}" data-id="${id}" 
        id="eliminar_guia${id}" data-funcion="activar-desactivar" data-costo_envio="${datos.costo_envio}"
        title="Eliminar Guía">
            <i class="fas fa-trash"></i>
        </button>`;
        
        //Bottón para re crear el sticker de guía.
        if(datos.numeroGuia && !datos.has_sticker && generacion_automatizada) {
            buttons += btnCrearSticker;
        }

        buttons += `
            <button class="btn btn-primary btn-circle btn-sm mt-2 action" data-id="${id}"
            id="ver_detalles${id}" data-toggle="modal" data-target="#modal-detallesGuias"
            title="Detalles">
                <i class="fas fa-search-plus"></i>
            </button>
        `;

        //Botón para ver movimientos
        if (datos.numeroGuia && datos.estado) {
            buttons += btnMovimientos;
        }

        //Botones para descargar documentosy rótulos cuando accede a la condición
        //botones para clonar y eliminar guía cuando rechaza la condición.
        if(datos.enviado) {
            buttons += btnDownloadDocs + btnRotulo;
        }

        if(!datos.estado)
        buttons += btnClone + btnDelete;
        

        // buttons += "<a href='javascript:void(0)' class='action text-trucate'>Ver más</a>"
        // buttons += btnEdit;
        buttons += "</div>";
        return buttons
    }
    return datos;
}