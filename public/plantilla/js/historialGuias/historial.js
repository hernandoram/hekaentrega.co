import {title, table as htmlTable, filtersHtml, filterHtml} from "./views.js";
import { filters, defFiltrado, defineFilter } from "./config.js";
import { ChangeElementContenWhileLoading } from "../utils/functions.js";

const {novedad, proceso, pedido, pagada, finalizada, generada, neutro} = defFiltrado;

const container = $("#historial_guias");
const buscador = $("#filtrado-guias_hist")

buscador.after(filtersHtml);
container.append(htmlTable);

const typesGenerales = [neutro, novedad, proceso, pedido, pagada, finalizada, generada];

const columns = [
    {data: null, title: "Acciones", render: accionesDeFila, types: typesGenerales.slice(1)},
    // {data: null, title: "Empaque", render: accionEmpaque, types: [generada]},
    {data: null, title: "Gestionar", render: accionGestNovedad, types: [novedad]},
    {data: "id_heka", title: "Id", defaultContent: "", types: typesGenerales, saveInExcel: true},
    {data: "numeroGuia", title: "# Guía", defaultContent: "", saveInExcel: true, types: [novedad, proceso, pagada, finalizada, generada, neutro]},
    {data: "estado", title: "Estado", defaultContent: "", saveInExcel: true, types: [novedad, proceso, pagada, finalizada, neutro]},
    {data: "mostrar_transp", 
    orderable: false,
    title: "Transportadora", defaultContent: "", types: typesGenerales},
    {data: "type", title: "Tipo",
    orderable: false,
    defaultContent: "", types: typesGenerales},
    {data: "mostrar_transp", title: "Transportadora", defaultContent: "", saveInExcel: true, types: []},
    {data: "type", title: "Tipo", defaultContent: "", saveInExcel: true, types: []},
    {data: "nombreD", title: "Destinatario", defaultContent: "", types: typesGenerales, saveInExcel: true},
    {
        data: "telefonoD", title: "Telefonos",
        defaultContent: "", render: (valor,type,row) => {
            if(type === "display" || type === "filter") {
                const aCelular1 = `<a class="btn btn-light d-flex align-items-baseline mb-1 action" href="https://api.whatsapp.com/send?phone=57${valor.toString().replace(/\s/g, "")}" target="_blank"><i class="fab fa-whatsapp mr-1" style="color: #25D366"></i>${valor}</a>`;
                const aCelular2 = `<a class="btn btn-light d-flex align-items-baseline action" href="https://api.whatsapp.com/send?phone=57${row["celularD"].toString().replace(/\s/g, "")}" target="_blank"><i class="fab fa-whatsapp mr-1" style="color: #25D366"></i>${row["celularD"]}</a>`;
                return aCelular1;
            }

            return valor;
        }, 
        types: typesGenerales,
        saveInExcel: true
    },
    {data: "ciudadD", title: "Ciudad", defaultContent: "", types: typesGenerales, saveInExcel: true},
    {data: "fecha", title: "Fecha", defaultContent: "", types: typesGenerales, saveInExcel: true},
    {
        data: "seguro", title: "Seguro", 
        defaultContent: "", render: (value, type, row) => {
            if(type === "display" || type === "filter") {
                return value || row["valor"];
            }

            return value;
        },
        types: typesGenerales,
        saveInExcel: true
    },
    {
        data: "valor", title: "Recaudo", 
        defaultContent: "",
        types: typesGenerales,
        saveInExcel: true
    },
    {
        data: "costo_envio", title: "Costo de envío", 
        defaultContent: "",
        types: typesGenerales,
        saveInExcel: true
    },
    {
        data: "detalles.comision_punto", title: "Ganancia", 
        defaultContent: "No aplica", visible: ControlUsuario.esPuntoEnvio,
        types: typesGenerales,
        saveInExcel: ControlUsuario.esPuntoEnvio
    },
    {
        data: "referencia", title: "Referencia", 
        defaultContent: "No aplica",
        types: typesGenerales,
        saveInExcel: true
    }
]

const table = $("#tabla-historial-guias").DataTable({
    destroy: true,
    data: null,
    rowId: "row_id",
    order: [[2, "desc"]],
    columns,
    language: {
      url: "https://cdn.datatables.net/plug-ins/1.10.24/i18n/Spanish.json"
    },
    dom: 'Bfrtip',
    buttons: [],
    scrollY: '60vh',
    scrollX: true,
    scrollCollapse: true,
    paging: false,
    initComplete: agregarFuncionalidadesTablaPedidos,
    drawCallback: renderizadoDeTablaHistorialGuias
});

globalThis.filtrador = new Watcher(pedido);

export default class SetHistorial {
    constructor() {
        this.guias = [];
        this.filtradas = [];
        this.guiasNeutras = new Set();
        this._filtrador = generada;
        this.renderTable = true;
    }

    get filtrador() {
        return this._filtrador
    }

    set filtrador(filt) {
        this._filtrador = filt;
        filtrador.change(filt);
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
        let indexBtn = 0;

        // Acceptar pedido
        if(filt === pedido) {
            table.button().add(indexBtn, {
                action: aceptarPedido,
                className: "btn-success",
                text: "Acceptar pedido <i class='fa fa-arrow-right ml-2'></i>",
            });
            indexBtn++;
        } 

        // Descargar pdfs guías
        if([proceso, finalizada, generada, neutro].includes(filt)) {
            table.button().add(indexBtn, {
                action: descargarGuiasParticulares,
                text: "Descargar Pdf"
            });
            indexBtn++;
        }

        // Generar documento o procesar
        if (filt === generada){
            table.button().add(indexBtn, {
                action: crearDocumentos,
                className: "btn-success",
                text: "Procesar <i class='fa fa-arrow-right ml-2'></i>"
            });
            indexBtn++;
        }

        // Descargar excel
        if([proceso, finalizada, pagada, neutro].includes(filt)) {
            const indiceColumnas = columns
            .map((c,i) => c.saveInExcel ? i : -1)
            .filter(g => g >= 0);

            console.log(indiceColumnas);
            table.button().add(indexBtn, {
                extend: "excel",
                text: "Descargar excel",
                filename: "Historial Guías",
                exportOptions: {
                  columns: indiceColumnas
                }
            });
            indexBtn++;
        }
        
    }

    defineColumns() {
        // No está funcionando como debería (error desconocido)
        
        let columnas = columns.map((c,i) =>  c.types.includes(this.filtrador) && c.visible !== false ? i : false)
        .filter(f => f !== false);

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

    generalFilter(filt) {
        const neutral = g => this.guiasNeutras.has(g.id_heka);
        const filtNeutro = filt === neutro;
        const filtProceso = filt === proceso;
        return this.guias.filter(g => {
            const original = defineFilter(g) === filt;
            const esNovedad = defineFilter(g) === novedad;
            if(filtNeutro) return neutral(g) && filtNeutro;

            if(filtProceso) return original || (neutral(g) && esNovedad);
            return original;
        });
    }
    
    filter(filt) {
        this.filtrador = filt;
        this.filtradas = this.generalFilter(filt)
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
            const cant = this.generalFilter(filt).length;

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

        nodeFilters.tooltip({
            placement: "auto",
            offset: "2",
            boundary: "window"
        });

        this.nodeFilters = nodeFilters;

        return filters;
    }

    clean(avoid) {
        const respaldo = this.guias.filter(g => defineFilter(g) === avoid);
        this.filtradas = [];
        this.guiasNeutras.clear();
        this.guias = respaldo;

        this.render(true);
    }
}



function getContadorGuiasSeleccionadas() {
    const inpSelectGuias = $("#select-all-guias");
    const contenedorSelector = inpSelectGuias.parent();
    const textoSelector = contenedorSelector.find(".texto");
    const counterSelector = contenedorSelector.find(".counter");
    return {
        inpSelectGuias,
        contenedorSelector,
        textoSelector,
        counterSelector
    }
}

function agregarFuncionalidadesTablaPedidos() {
    const api = this.api();
    this.parent().parent().before(`
        <div class="form-group form-check">
            <input type="checkbox" class="form-check-input" id="select-all-guias">
            <label class="form-check-label" for="select-all-guias"><span class='texto'>Seleccionar Todas </span><span class="counter"></span></label>
        </div>
    `);

    const {
        inpSelectGuias,
        counterSelector
    } = getContadorGuiasSeleccionadas();

    const findIndex = data => columns.findIndex(d => d.data === data);
    const colTransp = findIndex("mostrar_transp");
    const colType = findIndex("type");

    filtrador.watch(filt => {
        setTimeout(() => {
            renderContador(filt, api.data());
            filtrarHistorialGuiasPorColumna(api.column(colTransp))
            filtrarHistorialGuiasPorColumna(api.column(colType))
        }, 300);
    })

    inpSelectGuias.change(async (e) => {
        const checked = e.target.checked;
        // if(filtrador.value === generada) {
        //     const cant = await empacarMasivo(api.data(), checked);
        //     counterSelector.text(cant ? "("+cant+")" : "");
        //     return
        // } 

        if(checked) {
            let counter = 0;
            const limit = 50;
            const row = $("tr:gt(0)", this).each((i,row) => {
                const data = api.row(row).data();
                if(counter < limit) {
                    $(row).addClass("selected bg-gray-300");
                    counter ++;
                }
            })
        } else {
            $("tr:gt(0)", this).removeClass("selected bg-gray-300");
        }

        const cant = $("tr.selected", this).length;
        counterSelector.text(cant ? "("+cant+")" : "");
    });


    // if (this[0].getAttribute("data-table_initialized")) {
    //     return;
    // } else {
    //     this[0].setAttribute("data-table_initialized", true);
    // }

    $('tbody', this).on( 'click', 'tr', function (e) {
        console.log(!e.target.classList.contains("action"), e.target.tagName !== "I")
        if([novedad].includes(filtrador.value)) return;
        if(!e.target.classList.contains("action") && e.target.tagName !== "I")
        $(this).toggleClass('selected bg-gray-300');
        renderContador(filtrador.value, api.data());
    });

        
}

function renderizadoDeTablaHistorialGuias(config) {
    console.count("renderizando tabla");
    const api = this.api();
    const data = this.api().data();

    data.each((data, i) => {
        const row = api.row(i).node();
        const buttonsActivated = row.getAttribute("data-active");
        
        if(!buttonsActivated) {
            // $(".action", row).tooltip();
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

function renderContador(filt, data) {
    const llenarContador = cant => counterSelector.text(cant ? " ("+cant+")" : "");
    const empacadas = () => data.filter(g => g.empacada);

    const {
        inpSelectGuias,
        contenedorSelector,
        textoSelector,
        counterSelector
    } = getContadorGuiasSeleccionadas();

    contenedorSelector.removeClass("d-none");

    // if(filt === generada) {
    //     const cantidadEmpacadas = empacadas().length;
    //     const textoDevuelto = cantidadEmpacadas > 0
    //         ? "Empacar todas - cantidad empacadas" 
    //         : "Empacar todas";

    //     if(cantidadEmpacadas >= 50 || cantidadEmpacadas === data.length) inpSelectGuias.prop("checked", true);
    //     textoSelector.text(textoDevuelto);
    //     llenarContador(empacadas().length);
    // }
    if ([pedido, proceso, finalizada, pagada, generada, neutro].includes(filt)) {
        inpSelectGuias.prop("checked", false);
        textoSelector.text("Seleccionar todas");
        const selectedRows = data.rows(".selected").data().length;
        
        llenarContador(selectedRows);
    } else {
        contenedorSelector.addClass("d-none");
    }
}

//Para cuando los pedidos están en staggin, permiter proceder con la creación de la guía
async function aceptarPedido(e, dt, node, config) {
    let api = dt;

    const loader = new ChangeElementContenWhileLoading(node);
    loader.init();
    const finalizar = () => {
        loader.end();
    }


    // Cargador.fire("Creando guías", "Estamos generando las guías solicitadas, esto podría demorar unos minutos, por favor espere.")

    const selectedRows = api.rows(".selected");
    let datas = selectedRows.data();
    const nodos = selectedRows.nodes();

    if(!nodos.length) {
        finalizar();
        return;
    }
    // return;

    let errores = [];
    const columnasEnPedidos = columns.filter(c => c.types.includes(pedido)).length
    let i = 0;
    for await ( let guia of datas.toArray()) {
        const row = nodos[i];
        const errorFabricado = {
            error: !Math.floor(Math.random() * 2),
            message: "Error Fabricado"
        };

        Swal.fire({
            title: "Creando Guía",
            text: "Por favor espere mientras le generamos sus guías " + parseInt(100 * i / datas.length) + "%",
            didOpen: () => {
                Swal.showLoading();
            },
            allowOutsideClick: false,
            allowEnterKey: false,
            showConfirmButton: false,
            allowEscapeKey: true
        })

        const respuesta = await crearGuiaTransportadora(guia);
        
        // const respuesta = errorFabricado.error ? errorFabricado : await crearGuiaTransportadora(guia);
        let icon, color;
        if(!respuesta.error) {
            icon = "clipboard-check";
            color = "text-success";
            row.classList.remove("selected", "bg-gray-300");
            await descontarSaldo(guia);
        } else {
            icon = "exclamation-circle";
            color = "text-danger";
            errores.push({
                row, mensaje: respuesta.message, icon, color,
                id: guia.id_heka
            });
        }
        i++;

        
    }

    if(!errores.length) $("#filter_listado-guias_hist").click(); 

    finalizar();
    
    Toast.fire({
        icon: "success",
        title: "¡Proceso terminado!"
    });
    
    if(errores.length) {
        Swal.fire({
            title: "No todas las guías fueron creadas de forma exitosa", 
            html: `
                <p>Hubo error al crear ${errores.length} guías. Se recomienda recargar la página y volver a intentar.</p>
                <ul>${errores.map(e => "<li class='text-left'>" + "<b>" + e.id + ":</b> "+e.mensaje+"</li>").join("")}</ul>
            `,
            icon: "warning"
        })
        // .then(() => location.reload());
    }

    errores.forEach(({row, mensaje, icon, color, id}) => {
        $(row).after(`<tr><td colspan='${columnasEnPedidos}' class='${color} action'><i class='fa fa-${icon} mr-2'></i>${mensaje}</td></tr>`)
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
        class="d-flex justify-content-around align-items-center">
        `;

        const btnCrearSticker = `<button class="btn btn-primary btn-circle btn-sm mx-1 action" data-id="${id}"
        data-funcion="activar-desactivar"
        data-placement="right"
        id="crear_sticker${id}" title="Crear Sticker de la guía">
            <i class="fas fa-stamp"></i>
        </button>`
        
        const btnEdit = `<button class="btn btn-primary btn-circle btn-sm mx-1 action" data-id="${id}"
        data-funcion="activar-desactivar"
        data-placement="right"
        id="editar_guia${id}" title="Editar guía">
            <i class="fas fa-edit"></i>
        </button>`

        const btnMovimientos = `<button class="btn btn-primary btn-circle btn-sm mx-1 action" data-id="${id}"
        id="ver_movimientos${id}" data-toggle="modal" data-target="#modal-gestionarNovedad"
        data-placement="right"
        title="Revisar movimientos">
            <i class="fas fa-truck"></i>
        </button>`

        const btnDownloadDocs =  `<button class="btn btn-primary btn-circle btn-sm mx-1 action" data-id="${id}"
        data-placement="right"
        id="descargar_documento${id}" title="Descargar Documentos">
            <i class="fas fa-file-download"></i>
        </button>`;

        const btnRotulo = `<button class="btn btn-primary btn-circle btn-sm mx-1 action" data-id="${id}"
        data-funcion="activar-desactivar" data-activate="after" 
        data-placement="right"
        id="generar_rotulo${id}" title="Generar Rótulo">
            <i class="fas fa-ticket-alt"></i>
        </button>`

        const btnClone = `<button class="btn btn-success btn-circle btn-sm mx-1 action ${showCloneAndDelete}" data-id="${id}" 
        id="clonar_guia${id}" data-funcion="activar-desactivar" data-costo_envio="${datos.costo_envio}"
        data-placement="right"
        title="Clonar Guía">
            <i class="fas fa-clone"></i>
        </button>`;

        //quitarle el d-none al siguiente elemento para que aparezca otra vez el botón de eliminar guía

        const btnDelete = `<button class="btn d-none btn-danger btn-circle btn-sm mx-1 action ${showCloneAndDelete}" data-id="${id}" 
        id="eliminar_guia${id}" data-funcion="activar-desactivar" data-costo_envio="${datos.costo_envio}"
        data-placement="right"
        title="Eliminar Guía">
            <i class="fas fa-trash"></i>
        </button>`;
        
        const btnActualizar= `<button class="btn btn-circle btn-primary btn-sm mx-1 id="actualizar-guia-${id}>
        <i class="fa fa-sync" title="Actualizar guía ${id}" style="cursor: pointer"></i>
        </button>`;
    
        function actualizar(id){
            console.log(id)
        }
        // btnActualizar.onclick = (e)=>{
        //     e.preventDefault();
        //     console.log(id)
        // }

        //Bottón para re crear el sticker de guía.
        if((datos.numeroGuia && !datos.has_sticker && generacion_automatizada) || estado_prueba) {
            buttons += btnCrearSticker;
        }

        buttons += `
            <button class="btn btn-primary btn-circle btn-sm mx-1 action" data-id="${id}"
            id="ver_detalles${id}" data-toggle="modal" data-target="#modal-detallesGuias"
            data-placement="right"
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
        if(datos.enviado && !datos.enNovedad) {
            buttons += btnDownloadDocs + btnRotulo;
        }

        if(filtrado === pedido) {
            buttons += btnClone;
        }

        if(!datos.estado)
        buttons += btnDelete;
        

        // buttons += "<a href='javascript:void(0)' class='action text-trucate'>Ver más</a>"
        // buttons += btnEdit;
        buttons += btnActualizar + "</div>";
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
            <input type="checkbox" class="custom-control-input action" id="empacar-${id_heka}" ${empacada ? "checked" : ""}
            data-id="${id_heka}"
            data-funcion="activar-desactivar">
            <label class="custom-control-label action" for="empacar-${id_heka}">${empacada ? "Empacada" : "No empacada"}</label>
        </div>
        `;

        return res;
    } 
    return datos;
}

function accionGestNovedad(datos, type, row) {
    if(type === "display" || type === "filter") {
        const filtrado = defineFilter(row);
        const {numeroGuia, novedad_solucionada, transportadora, id_heka} = row;
        if (filtrado !== novedad) return "";

        const btnGestionar = novedad_solucionada 
        || transportadora === "INTERRAPIDISIMO" ? "Revisar" : "Gestionar";

        const res = `
        <div class="text-center">
            <button class="btn btn-sm btn-${novedad_solucionada ? "secondary" : "primary"} action" 
                id="gestionar-novedad-${id_heka}"
                data-id="${id_heka}"
                data-toggle="modal" data-target="#modal-gestionarNovedad"}>
                    ${btnGestionar}
            </button>
        </div>
        `;

        return res;
    } 
    return datos;
}

async function empacarMasivo(data, empacar) {
    const lista = data.toArray().filter(g => {
        return g.empacada != empacar;
    })

    if(empacar) lista.slice(0,51);

    // console.log(lista);
    // return;
    const enviado = lista.map(g => usuarioDoc.collection("guias").doc(g.id_heka).update({empacada: empacar}));

    await Promise.all(enviado);
    return lista.length
}