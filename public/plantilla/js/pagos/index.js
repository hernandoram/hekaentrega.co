import "./pagar.js";
import AnotacionesPagos from "./AnotacionesPagos.js";
import { cantidadDeUsuariosPorCentroDeCosto, comprobarGuiaPagada } from "./comprobadores.js";
import { ChangeElementContenWhileLoading, segmentarArreglo } from "../utils/functions.js";
import { empaquetarGuias } from "./pagar.js";
import { activarFunctionesFacturas } from "./facturacion.js";


/*
 Aquí se encuentran las funcionalidades de pagos para la parte administrativa, encargada de:
  - Cargar un excel para pagar
  - Dicha información se almancena en "pendientePorPagar", para luego ser consultada
  - La consulta de los pagos pendietes se puede hace por fecha, por centro de costo, por trasportadora o por tipos de pagos por cosulta
  - El aplicativo permite pagar usuario por usuario las guías que correspodan
  - Muestra saldos positivos si así se desea, de otra manera se puede solicitar ver los negativos para conocer de los usuarios con saldo pendiente
  - Permite realizar una facturación con "siigo" y almacenarla en el pago correspondiente
*/

import { db, collection, collectionGroup } from "/js/config/initializeFirebase.js";
// Contantes base de datos
const referencePagos = collection(db, "pendientePorPagar");
const refHistGuias = collectionGroup(db, "guias");

// Contantes de elementos html
const formularioPrincipal = $("#form-cargador_pagos");
const errorContainer = $("#errores-cargador_pagos");
const btnCargarPagos = $("#btn-cargar_cargador_pagos");
const btnCargarPagosHistGuias = $("#pagar-hist_guias");
const cargador = $("#cargador-cargador_pagos");

// Handlers de eventos
btnCargarPagos.click(cargarPagosPendientes);
btnCargarPagosHistGuias.click(cargarPagosDirectos);

/**
 * Es una función asíncrona que carga datos de pagos pendientes, tomando en cuenta la información proveniente de un excel, los
 * procesa y los agrega a una base de datos.
 */
async function cargarPagosPendientes(e) {
  const loader = new ChangeElementContenWhileLoading(e.target);
  loader.init();

  cargador.removeClass("d-none");
  const counterEl = $(".counter", cargador);
  const fEl = $(".f", cargador);
  fEl.text("excel");
  
  let i = 1;
  let agregados = 0;

  // Anotaciones para ir listando los errores en caso de que existan
  const anotaciones = new AnotacionesPagos(errorContainer);
  anotaciones.init();

  const finalizarProceso = (e) => {
    anotaciones.addError(e.message, {color: e.color || "danger"});
    cargador.addClass("d-none");
    loader.end();
  }

  const data = new FormData(document.getElementById("form-cargador_pagos"));
  console.log(data.get("documento"));

  // Se le pide al back que devuelva la información del excel en json para procesarla
  const datosDePago = await fetch("/excel_to_json", {
    method: "POST",
    body: data
  }).then(res => res.json())
  .catch(finalizarProceso)

  console.log(datosDePago);

  fEl.text(datosDePago.length);

  // Se evalúa cada guía para asegurarse que: No hay sido pagada previamente y que el excel no tenga errores en las columnas que se suben
  for await (const guia of datosDePago) {
    counterEl.text(i);

    const numeroGuia = guia["GUIA"].toString();
    guia["GUIA"] = numeroGuia;
    
    const reference = referencePagos.doc(numeroGuia);
    
    const erroresSubida = datosImportantesIncompletos(guia, datosDePago);
    if(erroresSubida) {
      anotaciones.addError(erroresSubida);
      i++;
      continue;
    }

    await comprobarGuiaPagada(guia)
    .then(revisarEnPagos => { // Se valida que la guía esté pagada en base de datos
      if(revisarEnPagos)
        throw new Error("La guía "+numeroGuia+" ya ha sido pagada.");

      console.log("Esto non debería verse");
      
      return cantidadDeUsuariosPorCentroDeCosto(guia["REMITENTE"]);
    })
    .then(cantidadUsuarios => { // Se valida que el centro de costo no esté repetido
      if(cantidadUsuarios === 0) // Debe existir el centro de costo
        throw new Error("El centro de costo "+guia["REMITENTE"]+" no se encuentra en nuestra base de datos.");
      
      if(cantidadUsuarios > 1) // Debe existir únicamente un centro de costo, no debe haber ni más ni menos
        throw new Error(`El centro de costo ${guia["REMITENTE"]} se encuentra repetido en nuestra base de datos (${cantidadUsuarios}), valide para saber que hacer con el usuario.`);

      return reference.get(numeroGuia);
    })
    .then(pagoPendiente => { // Para validar los datos que existían con respectoa los nuevos
      const clavesEspecificas = ["COMISION HEKA", "ENVÍO TOTAL", "RECAUDO", "TOTAL A PAGAR"]
      if(pagoPendiente.exists) {
        const dataPagoExistente = pagoPendiente.data();
        const noHayCorrelacion = clavesEspecificas.some(k => guia[k] !== dataPagoExistente[k]);

        if(noHayCorrelacion) anotaciones.addError(`Revisar relación: ${JSON.stringify(dataPagoExistente)} VS ${JSON.stringify(guia)}`, {color: "warning"});
      }

      return true;
    })
    .then(success => { // Debe devolver true para poder guardar el pago
      if(success) {
        guia.timeline = new Date().getTime();
    
        return reference.set(guia)
        .then(() => agregados ++)
        .catch(e => anotaciones.addError(e.message));
      }
    })
    .catch(e => {
      anotaciones.addError(e.message);
    })
    .finally(() => i++);

  }

  finalizarProceso({message: "Se han agregado " + agregados + " cargues correctamente", color: "success"});
}

function filtradoVisual(datos) {
    let transportadoras = [], numero_flotante = 0;
      let filtro_transportadoras = formularioPrincipal[0].getElementsByName("filtro-trasnportadoras");
      for(let transp of filtro_transportadoras){
        if(transp.checked){
          transportadoras.push(transp.value.toUpperCase());
        }
      }
      let filtroInputs = datos.filter((data) => {
        let fechaI, fechaF, guia, permitir_transportadora;
        if(!Number.isInteger(data["ENVÍO TOTAL"]) || !Number.isInteger(data.RECAUDO) || !Number.isInteger(data["TOTAL A PAGAR"])){
          numero_flotante += 1;
        }
        if(data.TRANSPORTADORA && transportadoras.indexOf(data.TRANSPORTADORA.toUpperCase()) != -1 && transportadoras.length != 0) {
          permitir_transportadora = true;
        } else if (transportadoras.length == 0){
          permitir_transportadora = true;
        }
      
        if($("#filtro-guia-cargador_pagos").val()){
          guia = $("#filtro-guia-pagos2").val();
          return permitir_transportadora && data.GUIA == guia;
        } else {
          fechaI = new Date($("#filtro-fechaI-pagos2").val()).getTime();
          fechaF = new Date($("#filtro-fechaF-pagos2").val()).getTime();
          fechaObtenida = fechaI;
          if(data.FECHA != undefined) {
            fechaObtenida = new Date(data.FECHA.split("-").reverse().join("-")).getTime();
          }
          remitente = $("#filtro-usuario-pagos2").val();
          if($("#fecha-pagos2").css("display") != "none" && $("#filtro-usuario-pagos2").val()){
            return permitir_transportadora && fechaI <= fechaObtenida && fechaF >= fechaObtenida && data.REMITENTE.indexOf(remitente) != -1;
          } else if($("#fecha-pagos2").css("display") != "none"){
            return permitir_transportadora && fechaI <= fechaObtenida && fechaF >= fechaObtenida
          } else if ($("#filtro-usuario-pagos2").val()) {
            return permitir_transportadora && data.REMITENTE.indexOf(remitente) != -1;
          } else {
            return permitir_transportadora;
          }
        }
      })

      if(numero_flotante) {
        alert("He registrado "+ numero_flotante +" fila(s) con números decimales y los he transformado en enteros, revíselo con cuidado");
      }

      return filtroInputs;
}

/**
 * La función comprueba si faltan ciertos datos importantes de un objeto y devuelve un mensaje de error
 * si falta algún dato.
 * @param objToSend - Un objeto que contiene datos para enviar.
 * @returns un mensaje de cadena que indica los datos faltantes o incompletos en el objeto `objToSend`.
 * El mensaje específico depende de qué condición no se cumpla.
 */
function datosImportantesIncompletos(objToSend, completeData) {
    
    const transportadorasAdmitidas = ["SERVIENTREGA", "INTERRAPIDISIMO", "TCC", "ENVIA", "COORDINADORA", "HEKA"];

    if (!objToSend.GUIA) {
      return "Sin número de guía para subir: " + objToSend.GUIA;
    } else if (!objToSend.REMITENTE) {
      return "Recuerde el usuario al que pertenece la guía " + objToSend.GUIA
    } else if (!objToSend.TRANSPORTADORA) {
      return "Lo siento, no se a que transportadora subir la guía: " + objToSend.GUIA;
    } else if (!objToSend["CUENTA RESPONSABLE"]) {
      return "Recuerda por favor agregar la cuenta responsable de la guia " + objToSend.GUIA;
    } else if (!objToSend["COMISION HEKA"] && objToSend["COMISION HEKA"] !== 0) {
      return "Falta el campo \"COMISION HEKA\" de la guia " + objToSend.GUIA;
    } else if (!transportadorasAdmitidas.includes(objToSend.TRANSPORTADORA)) {
      return "Por favor, Asegurate que la factura de la guía: " + objToSend.GUIA + " le pertenezca a <b>"+ transportadorasAdmitidas.join(", ") +"</b>"
    }
}

/*
    COORDINADORA

        ENTREGADA
        CERRADO POR INCIDENCIA, VER CAUSA

    ENVIA

        ENTREGADA DIGITALIZADA
        DEVOLUCION

    INTER

        Entrega Exitosa
        Entregada
        Devuelto al Remitente

    SERVI

        ENTREGADO
        ENTREGADO A REMITENTE
*/
let estadosEntregado = []; // Serán extraidos por el backend

let estadosDevolucion = []; // Serán extraidos por el backend


// #region Cargue pagos directo
// Cargue hacia pagos directo del historial de guías
/**
 * Función encargada de solicitar directamente del historial de guías, las que entén listas para pagar y de esta forma pasarla a la lista
 * de pagos pendientes, sin ncesidad de tener que pasar por un excel
 * @param {any} e Evento del click que activa el cargador de pagos directo
 */
async function cargarPagosDirectos(e) {
  const limiteConsulta = 5000;
  const finalId = e.target.id.split("-")[1];
  const loader = new ChangeElementContenWhileLoading(e.target);
  loader.init();

  const anotaciones = new AnotacionesPagos($("#status_pagos-historial_guias"), {
    title: "Estado Consulta",

  });
  anotaciones.init();

  let fechaI = document.querySelector("#fechaI-"+finalId).value + "::";
  let fechaF = document.querySelector("#fechaF-"+finalId).value + "::";
  const filtroCentroDeCosto = $("#filtro_pagos-"+finalId).val();
  const filtroTransp = $("#filtro_transp-"+finalId).val();
  const listaGuias = [];

  if(!estadosEntregado.length || estadosDevolucion.length) {
    await cargarEstados();
  }

  let ultimaFecha;

  // Función utilizada por cada ocasión que se consulte la referencia con una lista de data por firebase
  const manejarInformacion = querySnapshot => {
    const s = querySnapshot.size;

    querySnapshot.forEach(doc => {
      const guia = doc.data();

      const {type, numeroGuia, estado} = guia;
      const deuda = guia.debe;
      // Ignorar aquellas que no presenten número de guía
      if(!numeroGuia) return;

      // Si la guía no fue entregada ni devuelta
      if(!estadosEntregado.includes(estado) && !estadosDevolucion.includes(estado)) return;
      
      // Ignorar la convencionales
      if(type === "CONVENCIONAL") return;

      // Ignorar aquelas que hayan sido pagadas;
      if(type === "PAGO CONTRAENTREGA" && deuda === 0) return;

      ultimaFecha = guia.fecha;
          
      listaGuias.push(transformarGuiaAPago(guia));
    });

    const message = `Ten paciencia, hago lo mejor que puedo, vamos por ${ultimaFecha}. ¡SI SE PUEDE!`

    anotaciones.addError(message, {color: "info"});
    
  }

  let filtroPagoSeleccionado;

  if(filtroCentroDeCosto) {
    if(!filtroPagos) {
      filtroPagos = await db.collection("infoHeka").doc("manejoUsuarios")
      .get().then(d => d.data());
    }

    filtroPagoSeleccionado = filtroPagos[filtroCentroDeCosto];
  }

  // Se inicia con la referencia importante que toma en cuenta aquellas con el estado finalizado
  const referencia = refHistGuias
  .orderBy("timeline")
  .startAt(new Date(fechaI).getTime()).endAt(new Date(fechaF).getTime() + 8.64e+7)
  .where("seguimiento_finalizado", "==", true)

  // Según el filtro que se haya escogido, se le añade los comportamientos necesarios sobre la referencia anterior marcada
  if(filtroPagoSeleccionado) {
    const segementado = segmentarArreglo(filtroPagoSeleccionado, 10);
    for await (const paquete of segementado) {
        await referencia.where("centro_de_costo", "in", paquete)
        .get().then(manejarInformacion);
    }
  } else if(filtroTransp) {
    await referencia.where("transportadora", "==", filtroTransp).get().then(manejarInformacion);
  } else {
    await recursividadPorReferencia(referencia, manejarInformacion, limiteConsulta);
    // await referencia.get().then(manejarInformacion);
  }

  // una vez finalice la carga, se redirige al cargador que puede mostrar la lista de errores, en caso d equ eexistan
  location.href = "#cargador_pagos";
  
  anotaciones.addError("¡LO HEMOS LOGRADO! ya te muestro bien, dejame respirar 😪😥😴", {color: "success"});
  setTimeout(() => anotaciones.reset(), 5000);
  // Se encarga de filtrar la lista encontrando errores o guías ya pagadas
  const lista = await filtraPendientes(listaGuias);

  loader.end();
  
  console.log(lista);

  // LLama a una función externa que se encarga de la muesra de la interfaz
  empaquetarGuias(lista);

  if(!document.getElementById("btn-gotoGestionar_cargador_pagos"))
    btnCargarPagos.after("<a class='btn btn-success mt-4' href='#gestionar_pagos' id='btn-gotoGestionar_cargador_pagos'>Ir a gestionar</a>")
}

async function cargarEstados() {
  try {
    const estados = await fetch("/procesos/EstadosFinalizacion")
    .then(d => d.json());
  
    estadosEntregado = estados.entregados;
    estadosDevolucion = estados.devolucion;
  
    return estados;
  } catch (e) {
    Swal.fire("Error", "Hubo un error para extraer los estados: " + e.message, "error");
    throw new Error(e.message);
  }
}

/**
 * Función en cargada de recibir la guía como viene del historial, para transformarla a como se está guardando en el panel de pagos.
 * Encargada de manipular los precios según se hacía de forma manual para identificar las guía en devolución y otro tipo de información relevante
 * @param {*} guia 
 * @returns El objeto formateado a como se va a registrar en la base de datos
 */
function transformarGuiaAPago(guia)  {  
  const detalles = guia.detalles;
  const esDevolucion = estadosDevolucion.includes(guia.estado);
  const costoDevolucion = guia.detalles.costoDevolucion; // El costo de devolución debe ser negativo

  const totalPagar = esDevolucion 
    ? -costoDevolucion
    : guia.detalles.recaudo - guia.detalles.total;

  const envioTotal = esDevolucion
    ? costoDevolucion
    : guia.detalles.total;

  const valorRecaudo = esDevolucion
    ? 0
    : guia.detalles.recaudo;

  let comisionHeka = guia.detalles.comision_heka;

  if(esDevolucion) {
    switch(guia.transportadora) {
      case "COORDINADORA": 
        comisionHeka = 2000;
      break;

      case "ENVIA":
        comisionHeka = Math.round(detalles.flete * 0.25); // Cuando es devolución con envía la comisión heka pasa a ser el 25%
      break;
  
      case "INTERRAPIDISIMO":
        comisionHeka = 1000;
      break;
    }
  }
  
  return {
    GUIA: guia.numeroGuia,
    "REMITENTE": guia.centro_de_costo,
    TRANSPORTADORA: guia.transportadora,
    "CUENTA RESPONSABLE": guia.cuenta_responsable,
    "COMISION HEKA": comisionHeka,
    RECAUDO: valorRecaudo,
    "ENVÍO TOTAL": envioTotal,
    "TOTAL A PAGAR": totalPagar,
    causaPago: esDevolucion ? "DEVOLUCION" : "ENTREGA"
  }
}

/**
 * Función en cargada de segmentar un arreglo y observar en la base de datos si dicha guía fue pagada para guardarla en la lisa de pendientes
 * @param {*} listaGuias Lista de guías encontradas del historial
 * @returns La lista de guías que corresponde a aquellas guías que pasan el filtrado correcamente
 */
async function filtraPendientes(listaGuias) {
  const anotaciones = new AnotacionesPagos(errorContainer);
  anotaciones.init();

  cargador.removeClass("d-none");
  const counterEl = $(".counter", cargador);
  const fEl = $(".f", cargador);
  fEl.text(listaGuias.length + " guías");

  const finalizarProceso = (e) => {
    anotaciones.addError(e.message, {color: e.color || "danger"});
    cargador.addClass("d-none");
    // loader.end();
  }

  let i = 1;
  let agregados = 0;
  let restantes = listaGuias.length;

  let respuesta = [];

  // Segementa la lisa para verificarlas por parte
  const listaGuiasSegmentada = segmentarArreglo(listaGuias, 500);
  for await (let segmento of listaGuiasSegmentada) {
    restantes-= segmento.length;
    agregados+=segmento.length;

    counterEl.text(agregados);
    
    // const revisarEnPagos = false;
    const listaAnalizada = await comprobarSegmentoGuias(segmento, anotaciones);
    // const erroresSubida = datosImportantesIncompletos(g, listaGuias);

    i+= segmento.length

    respuesta = respuesta.concat(listaAnalizada);

  }

  finalizarProceso({message: "Se han agregado " + agregados + " cargues correctamente", color: "success"});

  return respuesta;
  
}

/**
 * Toma un segmento de guias, verifica si cada guia esta pagada, y
 * devuelve una lista filtrada de guias que no estan pagadas.
 * @param segmento - Una matriz de objetos que representan un segmento de guias (guías).
 * @param logger - El parámetro `logger` es un objeto que tiene un método llamado `addError`. Este
 * método se utiliza para agregar un mensaje de error al registrador.
 * @returns una lista filtrada de guias (segmento) que no han sido pagadas.
 */
async function comprobarSegmentoGuias(segmento, logger) {
  const listaAsync = segmento.map(comprobarGuiaPagada);

  const lista = await Promise.all(listaAsync);

  return segmento.filter((g, i) => {
    g.timeline = new Date().getTime();

    const pagada = lista[i];

    if(pagada) logger.addError("La guia " + g.GUIA + " fue pagada.");

    return !pagada;
  })
}

//#endregion


//#region Facturacion
activarFunctionesFacturas();
//#endregion