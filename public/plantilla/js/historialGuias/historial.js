import {title, table as htmlTable, filtersHtml, filterHtml} from "./views.js";
import { filters, defFiltrado } from "./config.js";

const {novedad, proceso, pedido, pagada, finalizada, generada} = defFiltrado;

const container = $("#historial_guias");

container.append(filtersHtml);
container.append(htmlTable);

const table = $("#tabla-historial-guias").DataTable({
    destroy: true,
    data: null,
    rowId: "row_id",
    order: [[1, "desc"]],
    columns: [
        {data: null, title: "Acción", render: accionesDeFila},
        {data: null, title: "Empaque", render: accionEmpaque},
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
    buttons: [],
    scrollY: '60vh',
    scrollX: true,
    scrollCollapse: true,
    paging: false,
    lengthMenu: [ [-1, 10, 25, 50, 100], ["Todos", 10, 25, 50, 100] ],
    initComplete: agregarFuncionalidadesTablaPedidos,
    drawCallback: renderizadoDeTablaHistorialGuias
});

export default class SetHistorial {
    constructor() {
        this.guias = [];
        this.filtradas = [];
        this.filtrador = pedido;
        this.renderTable = true;
    }

    add(guia) {
        const filtro = defineFilter(guia) === this.filtrador;
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
        const index = this.guias.findIndex(g => g.id_heka === id_heka);

        if(index !== -1) {
            this.guias.splice(index,1);
            this.renderTable = true;
        };
    }

    //Según el tipo de filtrado muestra los botones necesarios
    defineButtons(filt) {
        table.buttons().remove();

        if(filt === pedido) {
            table.button().add(0, {
                action: aceptarPedido,
                text: "Acceptar pedido"
            });
        } else if (filt === generada){
            table.button().add(0, {
                action: descargarGuiasParticulares,
                text: "Descargar Pdf"
            });
            table.button().add(1, {
                action: crearDocumentos,
                text: "Empacar"
            });
        } else if (filt === proceso || filt === finalizada){
            table.button().add(0, {
                action: descargarGuiasParticulares,
                text: "Descargar Pdf"
            });
            table.button().add(1, {
                extend: "excel",
                text: "Descargar excel",
                filename: "Historial Guías",
                exportOptions: {
                  columns: [1,2,3,4,5,6,7,9,10,11,12,13]
                }
            });
        }
    }

    defineColumns() {
        // No está funcionando como debería (error desconocido)
        
        let columnas;
        switch(this.filtrador) {
            case pedido:
                columnas = [0,1,4,5,6,7,8,9,10,11,12];
                break;
            case generada: 
                columnas = [0,1,2,4,5,6,7,8,9,10,11,12];
            break;
            default:
                columnas = [0,1,2,3,4,5,6,7,8,9,10,11,12];
                break
        }

        const renderizar = () => {
            table.columns().every(nCol => {
                const col = table.column(nCol);
                
                const ver = columnas.includes(nCol);
                const visibilidadPrev = col.visible();
                
                if(visibilidadPrev != ver) {
                    col.visible(ver);
                }
            });
        }

        try {
            renderizar();
        } catch {
            setTimeout(() => {
               renderizar(); 
            }, 500)
            
        } 
    
    }

    filter(filt) {
        this.filtrador = filt;
        this.filtradas = this.guias.filter(g => defineFilter(g) === filt);
        this.render(true);

        return this.filtradas;
    }

    render(clear) {
        this.counterFilter();
        if(!this.renderTable && !clear) return;
        
        this.defineButtons(this.filtrador);
        if(clear) {
            table.clear()

            this.filtradas.forEach(guia => {
                table.row.add(guia);
            });

            this.defineColumns();
        }
        table.draw();

        this.renderTable = false;
    }

    counterFilter() {
        if(!this.nodeFilters) return;
        this.nodeFilters.each((i,node) => {
            const filt = node.getAttribute("data-filter");
            const cant = this.guias.filter(g => defineFilter(g) === filt).length;
            $(node).find(".counter").text(cant);
        })
    }

    includeFilters() {
        const container = $("#filtros-historial-guias");
    
        filters.forEach((filt, i) => {
            container.append(filterHtml(filt, i, filters.length));
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

    clean(avoid) {
        const respaldo = this.guias.filter(g => defineFilter(g) === avoid);
        this.filtradas = [];
        this.guias = respaldo;

        this.render(true);
    }
}

//Devuelve un string con el tipo de filtrado según la guía
function defineFilter(data) {
    const estGeneradas = ["Envío Admitido", "RECIBIDO DEL CLIENTE", "Enviado", "", undefined];
    const estAnuladas = ["Documento Anulado", "Anulada"];

    let filter;

    if (data.enNovedad) {
        filter = novedad;
    } else if (data.staging) {
        filter = pedido;
    } else if(!data.debe && data.type !== "CONVENCIONAL") {
        filter = pagada
    } else if (data.seguimiento_finalizado) {
        filter = finalizada;
    } else if(!data.estado) {
        filter = generada;
    } else {
        filter = proceso;
    }

    return filter;
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
            color = "text-success";
            row.classList.remove("selected", "bg-gray-300");
            await descontarSaldo(guia);
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

async function descontarSaldo(datos) {
    const datos_heka = datos_personalizados || await db.collection("usuarios").doc(localStorage.user_id)
    .get().then(doc => doc.data().datos_personalizados);

    //Estas líneas será utilizadas para cuando todos los nuevos usuarios por defecto
    //no tengan habilitadas las transportadoras, para que administración se las tenga que habilitar
    // if(!datos_heka) {
    //     return {
    //         mensaje: "Lo sentimos, no pudimos carga su información de pago, por favor intente nuevamente.",
    //         mensajeCorto: "No se pudo cargar su información de pago",
    //         icon: "error",
    //         title: "Sin procesar"
    //     }
    // }

    // FIN DEL BLOQUE

    const id = datos.id_heka;
    console.log(datos.debe);
    if(!datos.debe && !datos_personalizados.actv_credit &&
        datos.costo_envio > datos_personalizados.saldo) {
        return {
            mensaje: `Lo sentimos, en este momento, el costo de envío excede el saldo
            que tienes actualmente, por lo tanto este metodo de envío no estará 
            permitido hasta que recargues tu saldo. Puedes comunicarte con la asesoría logística para conocer los pasos
            a seguir para recargar tu saldo.`,
            mensajeCorto: "El costo de envío excede el saldo que tienes actualmente",
            icon: "error",
            title: "¡No permitido!"
        }
    };

    let user_debe;
    datos_personalizados.saldo <= 0 ? user_debe = datos.costo_envio
    : user_debe = - datos_personalizados.saldo + datos.costo_envio;

    if(user_debe > 0 && !datos.debe) datos.user_debe = user_debe;



    if(!datos_heka) return id;

    let momento = new Date().getTime();
    let saldo = datos_heka.saldo;
    let saldo_detallado = {
        saldo: saldo,
        saldo_anterior: saldo,
        limit_credit: datos_heka.limit_credit || 0,
        actv_credit: datos_heka.actv_credit || false,
        fecha: genFecha(),
        diferencia: 0,
        mensaje: "Guía " + id + " creada exitósamente",
        momento: momento,
        user_id: localStorage.user_id,
        guia: id,
        medio: "Usuario: " + datos_usuario.nombre_completo + ", Id: " + localStorage.user_id
    };

    //***si se descuenta del saldo***
    if(!datos.debe){
        saldo_detallado.saldo = saldo - datos.costo_envio;
        saldo_detallado.diferencia = saldo_detallado.saldo - saldo_detallado.saldo_anterior;
        
        let factor_diferencial = parseInt(datos_heka.limit_credit) + parseInt(saldo);
        console.log(saldo_detallado);
        
        /* creo un factor diferencial que sume el limite de credito del usuario
        (si posee alguno) más el saldo actual para asegurarme que 
        este por encima de cero y por debajo del costo de envío, 
        en caso de que no se cumpla, se envía una notificación a administración del exceso de gastos*/
        if(factor_diferencial <= datos.costo_envio && factor_diferencial > 0) {
            notificarExcesoDeGasto();
        }
        await actualizarSaldo(saldo_detallado);
    }
    return id;
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

        if(filtrado === pedido) {
            buttons += btnClone;
        }

        if(!datos.estado)
        buttons += btnDelete;
        

        // buttons += "<a href='javascript:void(0)' class='action text-trucate'>Ver más</a>"
        // buttons += btnEdit;
        buttons += "</div>";
        return buttons
    }
    return datos;
}

function accionEmpaque(datos, type, row) {
    if(type === "display" || type === "filter") {
        const filtrado = defineFilter(row);
        const {empacada, id_heka} = row;
        if (filtrado !== generada) return "";

        const res = `
        <div class="custom-control custom-switch action">
            <input type="checkbox" class="custom-control-input" id="empacar-${id_heka}" ${empacada ? "checked" : ""}
            data-id="${id_heka}"
            data-funcion="activar-desactivar">
            <label class="custom-control-label" for="empacar-${id_heka}">${empacada ? "Empacada" : "No empacada"}</label>
        </div>
        `;

        return res;
    } 
    return datos;
}