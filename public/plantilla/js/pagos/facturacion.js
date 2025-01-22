import { ChangeElementContenWhileLoading } from "../utils/functions.js";
import AnotacionesPagos from "./AnotacionesPagos.js";
import { cantidadFacturasencontradas } from "./comprobadores.js";
import {
    db,
    doc,
    collection,
    getDoc,
    getDocs,
    where,
    query,
  } from "/js/config/initializeFirebase.js";

const modulo = "pagos_facturacion";
const cambiadorFiltro = $("#tipo_filt-" + modulo);
const activadorFecha = $("#activador_filtro_fecha-pagos_facturacion");
const btnHistorialFacturas = $("#btn_historial-pagos_facturacion");
const btnDescargaFacturas = $("#btn_descarga-pagos_facturacion");
const principalReference = collection(db, "paquetePagos");
const anotacionesErrores = $("#visor_errores-pagos_facturacion");


export function activarFunctionesFacturas() {
    cambiadorFiltro.on("change", cambiarFiltroFacturacion);
    btnHistorialFacturas.on("click", revisarFacturacionesAdmin);
    btnDescargaFacturas.on("click", descargarInformeFacturas);
}

const columns = [
    {
        data: null,
        title: "Acciones",
        orderable: false,
        render: renderizarBotonesAccionFactura
    },
    { data: "centro_de_costo", title: "Centro de costo", defaultContent: "" },
    { data: "numero_documento", title: "Número documento", defaultContent: "" },
    { 
        data: "comision_heka", 
        title: "Comisión heka", 
        render: $.fn.DataTable.render.number(".", null, null, "$ ")
    },
    { 
        data: "comision_transportadora", 
        title: "Comisión Transportadora",
        defaultContent: "N/A",
        render: $.fn.DataTable.render.number(".", null, null, "$ ")
    },
    { 
        data: "total_pagado", 
        title: "Total pagado", 
        render: $.fn.DataTable.render.number(".", null, 0, "$ ")
    },
    { data: "num_factura", title: "Número de factura", defaultContent: "" },
    { 
        data: "fecha", 
        title: "Fecha", 
        render: (data) => {
            if(!data) return "N/A";

            const date = data.toDate();
            return genFecha("LR", date);
        } 
    }
];

const dataTable = $("#table-pagos_facturacion").DataTable({
    destroy: true,
    data: null,
    rowId: "row_id",
    order: [[5, "asc"]], // Se está ordenando por número de factura
    columns,
    language: {
      url: "https://cdn.datatables.net/plug-ins/1.10.24/i18n/Spanish.json",
    },
    dom: "Bfrtip",
    buttons: [
        {
            text: "Generar Facturas",
            action: facturacionMasivaAgrupada,
        },
    ],
    scrollY: "50vh",
    scrollX: true,
    scrollCollapse: true,
    rowCallback: activarAccionesFacturacion,
    initComplete: inicializacionTabla,
    drawCallback: analizarRegistros

});


function cambiarFiltroFacturacion(e) {
  const el = e.target;
  const idTarget = el.value;

  const target = $("#" + idTarget + "-" + modulo);

  $(".filtro-gen", "#"+modulo).addClass("d-none");

  target.removeClass("d-none");
}


async function obtenerDataFacturasAdmin() {
    let fechaI = new Date($("#filtro-fechaI-"+modulo).val()).setHours(0) + 8.64e7,
      fechaF = new Date($("#filtro-fechaF-"+modulo).val()).setHours(0) + 2 * 8.64e7,
      guia;

  
    const referenceNatural = principalReference;
  
    const referenceSorted = referenceNatural
        .orderBy("timeline")
        .startAt(fechaI)
        .endAt(fechaF);
  
    let reference = referenceSorted;
    const filtro = cambiadorFiltro.val();

  
    switch(filtro) {
        case "filt_1":
            const referenciaClave = referenceSorted;
        
            reference = referenciaClave.where(
                "centro_de_costo",
                "==",
                $("#filtro-pagos_facturacion-usuario").val().trim()
            );
        break;
        
        case "filt_2":
        
            reference = referenceSorted.where(
                "numero_documento",
                "==",
                $("#filtro-pagos_facturacion-num_doc").val().trim()
            );
        break;

        case "filt_3": {
            const guia = $("#filtro-pagos_facturacion-guia").val().trim();
  
            reference = referenceNatural.where("guiasPagadas", "array-contains", guia);
        }
        break;

        case "filt_4": {
            const numFact = $("#filtro-pagos_facturacion-num_fact").val().trim();
            console.log(numFact);
  
            reference = referenceNatural.where("num_factura", "==", parseInt(numFact));
        }
        
        break;
        

    }

    return await reference
    .get()
    .then((querySnapshot) => {
        const response = [];
        querySnapshot.forEach((doc) => {
            const data = getDocData(doc);

            response.push(data);
        });

        return response;
    });

};

function getDocData(doc) {
    const data = doc.data();
    data.id = doc.id;
    data.row_id = "fact-"+doc.id;

    return data;
}

async function revisarFacturacionesAdmin(e) {
    const loader = new ChangeElementContenWhileLoading(e.target);
    loader.init();

    dataTable.clear();
    const data = await obtenerDataFacturasAdmin();

    mostrarFacturacionesAdmin(data);
    loader.end();
}

function mostrarFacturacionesAdmin(data) {
    dataTable.clear();
    data.forEach(d => dataTable.row.add(d));
    console.log(data);
    dataTable.draw();

}

const opcionesAccionesFacturacionAdmin = [
    {
        titulo: "Botón de prueba", // Título que se muestra cuando se mos el mouse encima del botón
        icon: "question", // Ícono del botón
        color: "primary", // Color del botón (relacionado con bootstrap)
        id: "prueba", // Identificador del botón escencial para determinar la acción que se va a ejecutar
        visible: (data) => false, // Para saber si el botón será visible o no, para la guía dada
        accion: function (data) { // Función que será ejecutada al hacer click en el botón
            // La functionalidad que se vaya a activar, cuenta con datos de la factura
            console.log("Información de la factura: ", data);

            // "this" haría referencia al botón que se acciona en forma de Jquery
            console.log("Botón de prueba:" , this);
        } 
    },
    {
        titulo: "Ver Factura", // Título que se muestra cuando se mos el mouse encima del botón
        icon: "eye", // Ícono del botón
        color: "primary", // Color del botón (relacionado con bootstrap)
        id: "ver_factura", // Identificador del botón escencial para determinar la acción que se va a ejecutar
        visible: (data) => data.id_factura, // Para saber si el botón será visible o no, para la guía dada
        accion: verPdfFactura
    },
    {
        titulo: "Asociar factura", // Título que se muestra cuando se mos el mouse encima del botón
        icon: "link", // Ícono del botón
        color: "warning", // Color del botón (relacionado con bootstrap)
        id: "asociar_factura", // Identificador del botón escencial para determinar la acción que se va a ejecutar
        visible: (data) => data.num_factura === 0, // Para saber si el botón será visible o no, para la guía dada
        accion: asociarFactura
    },
    {
        titulo: "Facturar", // Título que se muestra cuando se mos el mouse encima del botón
        icon: "file-invoice-dollar", // Ícono del botón
        color: "primary", // Color del botón (relacionado con bootstrap)
        id: "crear_factura", // Identificador del botón escencial para determinar la acción que se va a ejecutar
        visible: (data) => data.num_factura === 0 && !data.facturada, // Para saber si el botón será visible o no, para la guía dada
        accion: crearGuardarFactura
    },
    {
        titulo: "Ver pagos relacionados", // Título que se muestra cuando se mos el mouse encima del botón
        icon: "search-plus", // Ícono del botón
        color: "primary", // Color del botón (relacionado con bootstrap)
        id: "ver_detalles", // Identificador del botón escencial para determinar la acción que se va a ejecutar
        visible: (data) => true, // Para saber si el botón será visible o no, para la guía dada
        accion: verDetallesPagos
    }
];
  

/** Encargada de mostrar la lista de los botones en {@link opcionesAccionesFacturacionAdmin} sobre cada fila de las guías */
function renderizarBotonesAccionFactura(datos, type, row) {
    if (type === "display" || type === "filter") {  
      const buttons = opcionesAccionesFacturacionAdmin
      .filter(btn => btn.visible(datos)) // Se filtran aquellas que colocamos como visibles
      .map((ac, i) => `
        <button class="btn btn-${ac.color} btn-circle btn-sm mx-1 action"
        data-action="${ac.id}"
        data-placement="right" title="${ac.titulo}">
          <i class="fas fa-${ac.icon}"></i>
        </button>
      `).join("");
  
      return `<div class="d-flex justify-content-around align-items-center">${buttons}</div>`;
    }
  
    return datos;
}


/** Funcion que, una vez cargado los botones en el DOM del historial de guías de admin, activa la funcionalidad expuesta sobre dicho botón */
function activarAccionesFacturacion(row, data) {
   
    opcionesAccionesFacturacionAdmin.forEach((opt, i) => {
      const button = $(`[data-action='${opt.id}']`, row);
      
      if(!button.data("hasAssignedEvent")) {
        button.on("click", opt.accion.bind(button, data));
        button.data("hasAssignedEvent", true);
      }
    });

}

function inicializacionTabla(settings) {
    this.parent().parent().before(`
        <ul id="errores_generadas-pagos_facturacion">
        </ul>
    `);
}

function analizarRegistros(settings) {
    const api = this.api();
    const contenedorAnotaciones = $("#errores_generadas-pagos_facturacion");
    const anotaciones = [];

    // Contadores
    let totalPagado = 0;
    let totalFacturado = 0;
    let sinNumFactura = 0;

    const data = api.data().toArray();

    let lastNumFact = -1;
    data
    .sort((a,b) => a.num_factura - b.num_factura)
    .forEach(d => {
        const {num_factura, comision_heka, total_pagado} = d;

        totalPagado += total_pagado;
        totalFacturado += comision_heka;

        if(lastNumFact > 0) {
            const difference = num_factura - lastNumFact;

            if(difference > 1) {
                anotaciones.push({
                    type: "warning",
                    message: `Existe una interrupción de consecutivos desde las factura ${lastNumFact} hasta ${num_factura}: ${difference - 1}`
                });
            }
        }

        if(num_factura === 0) {
            sinNumFactura++;
        }

        lastNumFact = num_factura;
    });

    if(sinNumFactura) {
        anotaciones.push({
            type: "danger",
            message: `Existen ${sinNumFactura} facturas sin el número agregado, por favor asocielos para evitar incongruencias.`
        })
    }

    anotaciones.push({
        type: "primary",
        message: `<b>Total pagado:</b> $${convertirMiles(totalPagado)}`
    });
    
    anotaciones.push({
        type: "primary",
        message: `<b>Total facturado:</b> $${convertirMiles(totalFacturado)}`
    });
    

    contenedorAnotaciones.html("");
    anotaciones.forEach(a => {
        contenedorAnotaciones.append(`<li class="text-${a.type}">${a.message}</li>`)
    });
}

async function verPdfFactura(data) {
    const {id_factura} = data;
    const loader = new ChangeElementContenWhileLoading(this);
    loader.charger = loader.charger.replace("Cargando...", ""); // Para que solo quede la rueda dando vueltas sin las letras
    loader.init();

    const finalizar = (...args) => {
        console.log(args);
        Toast.fire(...args);
        loader.end();
    };

    try {
        const factura = await fetch("/siigo/pdfFactura/" + id_factura).then(
        (d) => d.json()
        );

        if (!factura.base64)
        return finalizar("No se pudo cargar la factura.", "", "error");

        openPdfFromBase64(factura.base64);

        loader.end();
    } catch (e) {
    console.log(e);
    loader.end();
    finalizar("Error al cargar la información.", "", "error");
    }
}

async function asociarFactura(data) {
    const loader = new ChangeElementContenWhileLoading(this);
    loader.charger = loader.charger.replace("Cargando...", ""); // Para que solo quede la rueda dando vueltas sin las letras
    loader.init();

    const {comision_heka, numero_documento, fecha, row_id} = data;
    const { value: dataFactura } = await Swal.fire({
        title: "Nombre de la factura",
        input: "text",
        inputLabel: "FV-1-12345",
        showCancelButton: true,
        preConfirm: async (nombreFactura) => {
            try {
                nombreFactura = nombreFactura.trim();
                const cantidadFacturas = await cantidadFacturasencontradas("nombre_factura", nombreFactura);
                
                // revisamos que no exista previamente una factura con el nombre insertado
                // Para no tener necesidad de buscarla luego
                if(cantidadFacturas) {
                    throw new Error("La factura con el nombre " + nombreFactura + " ya existe registrada en la base de datos");
                }

                const searching = {
                    created_start: estandarizarFecha(fecha.toDate(),"YYYY-MM-DD"),
                    name: nombreFactura
                }

                const response = await fetch("siigo/facturaPorNombre", {
                    method: "POST",
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(searching)
                });

                const resData = await response.json();
                if (!response.ok) {
                    const message = [400, 417].includes(response.status) ? resData.message : JSON.stringify(resData);
                    return Swal.showValidationMessage(message);
                }

                const {total, customer, number} = resData;

                if(customer.identification !== numero_documento) {
                    return Swal.showValidationMessage(`El número de documento (${numero_documento}), no coincide con el devuelto por siigo (${customer.identification})`);
                }

                if(total !== comision_heka) {
                    return Swal.showValidationMessage(`La comisión Heka guardada ($ ${convertirMiles(comision_heka)}), no coincide con la factura ingresada ($ ${convertirMiles(total)})`);
                }
            
                const facturasExistenteConNumero = await cantidadFacturasencontradas("num_factura", number);
                if(facturasExistenteConNumero) throw new Error("La factura bajo el número " + number + " ya existe registrada en la base de datos");
                
                return resData;
            } catch (error) {
              return Swal.showValidationMessage(error.message);
            }
        }
    });

    if(!dataFactura) return loader.end();
    
    actualizarFactura(data, dataFactura)
    .finally(() => loader.end());
}

const pagoFacturacionRevisado = {}
async function verDetallesPagos(data) {
    let tr = this.closest('tr');
    let row = dataTable.row(tr);
    const loader = new ChangeElementContenWhileLoading(this);
    loader.charger = loader.charger.replace("Cargando...", ""); // Para que solo quede la rueda dando vueltas sin las letras

    
    if (row.child.isShown()) {
        // This row is already open - close it
        row.child.hide();
    }
    else {
        loader.init();
        
        if(!pagoFacturacionRevisado[data.id]) {
            const promisePagos = data.guiasPagadas.map(cargarInfoPagoPorGuia);
            pagoFacturacionRevisado[data.id] = await Promise.all(promisePagos);
        }
    
        // Open this row
        row.child(mostrarTablaHija(pagoFacturacionRevisado[data.id])).show();
        loader.end();
    }
}


const usuarioCargados = new Map();
async function descargarInformeFacturas(e) {
    const l = new ChangeElementContenWhileLoading(this);
    l.init();
  
    let fechaI = new Date($("#filtro-fechaI").val()).setHours(0) + 8.64e7,
      fechaF = new Date($("#filtro-fechaF").val()).setHours(0) + 2 * 8.64e7;
  
      const referencia = query(
        collection(db, "paquetePagos"),
        orderBy("timeline"),
        startAt(fechaI),
        endAt(fechaF)
      );
  
    const facturas = await obtenerDataFacturasAdmin();
    
    const facturasErroneas = facturas.filter(f => f.num_factura === 0);
    if(facturasErroneas.length) {
        const resp = await Swal.fire({
            title: "Revisar Información",
            text: `Hemos detectado ${facturasErroneas.length} fectura sin consecutivo. ¿Desea validar Antes de descargar?`,
            showCancelButton: true,
            cancelButtonText: "Descargar",
            confirmButtonText: "Validar"
        });

        if(resp.isConfirmed) {
            mostrarFacturacionesAdmin(facturasErroneas);
            return l.end();
        }
    }

    const promiseFacturas = facturas
    .filter(f => f.num_factura !== -1) // Quitamos los número de factura = -1 ya que son pagos que no ameritan facturación o no fueron facturados a propósito
    .map(async (f) => {
      const id_user = f.id_user;
      if (!usuarioCargados.has(id_user)) {
        const respuestaUsuario = await getDoc(doc(db, "usuarios", id_user)).then((d) =>
          d.exists() ? d.data() : null
        );
      
        usuarioCargados.set(id_user, respuestaUsuario);
      }
      
      const info_usuario = usuarioCargados.get(id_user);
      let identificacion, nombre_completo;
      if (info_usuario) {
        identificacion = info_usuario.numero_documento;
        nombre_completo = info_usuario.nombres + " " + info_usuario.apellidos;
      }
  
      const strFecha = genFecha("LR", f.timeline).replace(/\-/g, "/");
      const jsonArchivo = {
        "Centro de costo": f.centro_de_costo,
        "COMISION HEKA": f.comision_heka,
        "TOTAL A PAGAR": f.total_pagado,
        CEDULA: identificacion,
        TERCERO: nombre_completo,
        FACTURA: f.num_factura,
        "Fecha elaboración": strFecha
      };
  
      return jsonArchivo;
    });
  
    const dataDescarga = await Promise.all(promiseFacturas);
  
    crearExcel(
      dataDescarga,
      `Informe Facturas ${genFecha("LR", fechaI)} ${genFecha("LR", fechaF)}`
    );
  
    l.end();
}


const transportadoras = ["SERVIENTREGA", "INTERRAPIDISIMO", "ENVIA", "COORDINADORA", "REFERIDOS", "HEKA"];
async function cargarInfoPagoPorGuia(guiaRefrencia) {
    const transportadoras = transportadoraProbable(guiaRefrencia);
    
    let data;
    while(transportadoras.length && !data) {
        const transp = transportadoras.shift()

        data = await getDoc(doc(db, "pagos", transp, "pagos", guiaRefrencia)).then((doc) =>
            doc.exists() ? doc.data() : null
          );

    }

    return data;
}

export async function cargarInfoPagoPorIdRelacionado(idPaquetePago) {
    const pagosRealizados = [];
    for (let transp of transportadoras) {
        data = await getDocs(
            query(collection(db, "pagos", transp, "pagos"), where("idPaquetePago", "==", idPaquetePago))
          ).then((q) => {
            q.forEach((d) => {
              pagosRealizados.push(d.data());
            });
          });

    }

    return pagosRealizados;
}

function transportadoraProbable(guia) {
    const puntos = transportadoras.map(t => ({
        transp: t,
        puntos: 0
    }));

    const lengths = [10, 12, 12, 11, 15, 10];
    const regexs = [/^2\d+/, /^2\d00\d+/, /^0\d+/, /^3\d+/, /^RSeller/, /^1\d+/];

    puntos.forEach((p,i) => {
        if(guia.length === lengths[i]) p.puntos++;
        if(regexs[i].test(guia)) p.puntos++;
    });

    return puntos.sort((a,b) => b.puntos - a.puntos).map(p => p.transp);

}


function mostrarTablaHija(arrData) {
    return `
        <table class="table table-bordered table-sm w-100">
            <thead class="table-dark sticky-top">
                <tr>
                    <th>Transportadora</th>
                    <th>Guía</th>
                    <th>Recaudo</th>
                    <th>Envío Total</th>
                    <th>Comisión Heka</th>
                    <th>Tipo</th>
                </tr>
            </thead>

            <tbody>
                
                ${
                    arrData.map(data => {
                        return `
                        <tr>
                            <td>${data["TRANSPORTADORA"]}</td>
                            <td>${data["GUIA"]}</td>
                            <td>${data["RECAUDO"]}</td>
                            <td>${data["ENVÍO TOTAL"]}</td>
                            <td>${data["COMISION HEKA"]}</td>
                            <td>${data["estado"] ?? "N/A"}</td>
                        </tr>
                        `
                    }).join("")
                }
                
            </tbody>
        </table>
    `
}

async function crearGuardarFactura(data) {
    const resSwal = await Swal.fire({
        icon: "question",
        title: "¿Deseas facturar este pago?",
        text: "Utilizar este método sin precaución prodría generar repeticiones en los consecutivos de facturación, asegúrese de que efectivamente no existe factura para este pago, antes de proceder.",
        showCancelButton: true,
        confirmButtonText: "Si, deseo facturar"
    });

    if(!resSwal.isConfirmed) return;

    const {numero_documento, comision_heka, comision_transportadora} = data;
    const loader = new ChangeElementContenWhileLoading(this);
    loader.charger = loader.charger.replace("Cargando...", ""); // Para que solo quede la rueda dando vueltas sin las letras
    loader.init();

    const resFact = await crearFactura(numero_documento, comision_heka, comision_transportadora);

    if(resFact.error) {
        Swal.fire("Error de comunicación", resFact.message, "error");
        return loader.end();
    }
    
    if(!resFact.id) {
        Swal.fire("Error al facturar", JSON.stringify(resFact), "error");
        return loader.end();
    }

    actualizarFactura(data, resFact)
    .then(res => Swal.fire(res))
    .finally(() => {
        loader.end()
    });

}

async function crearFactura(numero_documento, comision_heka, costo_transportadora = null) {
    return fetch("/siigo/crearFactura", {
        method: "POST",
        headers: {"Content-Type": "Application/json"},
        body: JSON.stringify({comision_heka: comision_heka, numero_documento, costo_transportadora})
    })
    .then(d => d.json())
    .catch(e => {
        return {
            error: true,
            message: "Error al crear la factura con siigo " + e.message
        }
    });
}

async function actualizarFactura(dataPack, dataFactura) {
    const {name, number, id: idFactura} = dataFactura;
    const {row_id, id: idDatabase} = dataPack;

    return principalReference.doc(idDatabase)
    .update({
        nombre_factura: name,
        num_factura: number,
        id_factura: idFactura,
        facturada: true
    })
    .then((result) => {
        return principalReference.doc(idDatabase).get();
    })
    .then((doc) => {
        const data = getDocData(doc);
        dataTable.row("#"+row_id).remove().draw(false);
        dataTable.row.add(data).draw(false);
        return {
            title: "La factura ha sido vinculada existósamente.",
            text: "",
            icon: "success" 
        }
    })
    .catch(e => ({title: "No se ha podido actualizar.", text: e.message, icon: "error"}))
}


async function facturacionMasivaAgrupada(e, dt, node, config) {
    const l = new ChangeElementContenWhileLoading(e.target);
    const anotaciones = new AnotacionesPagos(anotacionesErrores);
    anotaciones.init();
    l.init();

    const facturasAgrupadas = new Map();
    
    const dataFacturacion = 
    dt.data()
    .filter(d => d.num_factura === 0) // Solo se vana a facturar aquellas que no hayan sido facturadas aún

    dataFacturacion
    .each(current => {
        const {numero_documento} = current;

        if(facturasAgrupadas.has(numero_documento)) {
            const conjuntoFacturacionActual = facturasAgrupadas.get(numero_documento);

            conjuntoFacturacionActual.comision_heka += current.comision_heka;
            conjuntoFacturacionActual.comision_transportadora += current.comision_transportadora;
            conjuntoFacturacionActual.total_pagado += current.total_pagado;
        } else {
            facturasAgrupadas.set(numero_documento, current);
        }
    });

    for (const factura of facturasAgrupadas.values()) {
        // Por acá se generaran las facturas de a una
        const {numero_documento, comision_heka, comision_transportadora} = factura;

        const actualizacionConjunto = dataFacturacion.filter(v => v.numero_documento === numero_documento);

        const resFact = await crearFactura(numero_documento, comision_heka, comision_transportadora);

        if(resFact.error) {
            anotaciones.addError(`Error de comunicación ${numero_documento}: ${resFact.message}`);
            continue;
        }
        
        if(!resFact.id) {
            anotaciones.addError(`Error al facturar ${numero_documento}: ${JSON.stringify(resFact)}`, "error");
            continue;
        }

        const actualizacionesFirebase = actualizacionConjunto.map(conjuntoPago => actualizarFactura(conjuntoPago, resFact));

        const resultActualizaciones = await Promise.all(actualizacionesFirebase);

        const erroresFirebase = resultActualizaciones.find(act => act.incon === "error");
        if(erroresFirebase) {
            anotaciones.addError(`Hemos tenido un problema para guardar en nuestra base de datos la información resultante que la factura que ha sido generada en siigo: ${erroresFirebase.text}`);
            continue;
        }
    }

    l.end();
}

export { activarFunctionesFacturas, crearFactura }