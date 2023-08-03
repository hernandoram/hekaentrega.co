import "./pagar.js";
import AnotacionesPagos from "./AnotacionesPagos.js";
import { comprobarGuiaPagada } from "./comprobadores.js";
import { ChangeElementContenWhileLoading, segmentarArreglo } from "../utils/functions.js";
import { empaquetarGuias } from "./pagar.js";


/*
 Aquí se encuentran las funcionalidades de pagos para la parte administrativa, encargada de:
  - Cargar un excel para pagar
  - Dicha información se almancena en "pendientePorPagar", para luego ser consultada
  - La consulta de los pagos pendietes se puede hace por fecha, por centro de costo, por trasportadora o por tipos de pagos por cosulta
  - El aplicativo permite pagar usuario por usuario las guías que correspodan
  - Muestra saldos positivos si así se desea, de otra manera se puede solicitar ver los negativos para conocer de los usuarios con saldo pendiente
  - Permite realizar una facturación con "siigo" y almacenarla en el pago correspondiente
*/

// Contantes base de datos
const db = firebase.firestore();
const referencePagos = db.collection("pendientePorPagar");
const refHistGuias = db.collectionGroup("guias");

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
    
    const revisarEnPagos = await comprobarGuiaPagada(guia);
    const erroresSubida = datosImportantesIncompletos(guia, datosDePago);

    guia.timeline = new Date().getTime();

    if(revisarEnPagos) {
      anotaciones.addError("La guía "+numeroGuia+" ya ha sido pagada.");
    } else if(erroresSubida) {
      anotaciones.addError(erroresSubida);
    } else {
      await reference.set(guia)
      .then(() => agregados ++)
      .catch(e => anotaciones.addError(e.message));
    }

    i++;
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
    
    const transportadorasAdmitidas = ["SERVIENTREGA", "INTERRAPIDISIMO", "TCC", "ENVIA", "COORDINADORA"];

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


// #region Cargue hacia pagos directo del historial de guías
/**
 * Función encargada de solicitar directamente del historial de guías, las que entén listas para pagar y de esta forma pasarla a la lista
 * de pagos pendientes, sin ncesidad de tener que pasar por un excel
 * @param {any} e Evento del click que activa el cargador de pagos directo
 */
async function cargarPagosDirectos(e) {
  const finalId = e.target.id.split("-")[1];
  const loader = new ChangeElementContenWhileLoading(e.target);
  loader.init();

  let fechaI = document.querySelector("#fechaI-"+finalId).value + "::";
  let fechaF = document.querySelector("#fechaF-"+finalId).value + "::";
  const filtroCentroDeCosto = $("#filtro_pagos-"+finalId).val();
  const filtroTransp = $("#filtro_transp-"+finalId).val();
  const listaGuias = [];

  // Función utilizada por cada ocasión que se consulte la referencia con una lista de data por firebase
  const manejarInformacion = querySnapshot => {
    console.log(querySnapshot.size);
    querySnapshot.forEach(doc => {
      const guia = doc.data();

      const type = guia.type;
      const deuda = guia.debe;
      
      // Ignorar la convencionales
      if(type === "CONVENCIONAL") return;

      // Ignorar aquelas que hayan sido pagadas;
      if(type === "PAGO CONTRAENTREGA" && deuda === 0) return;
          
      listaGuias.push(transformarGuiaAPago(guia));
    });
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
    await referencia.get().then(manejarInformacion);
  }

  // una vez finalice la carga, se redirige al cargador que puede mostrar la lista de errores, en caso d equ eexistan
  location.href = "#cargador_pagos";
  
  // Se encarga de filtrar la lista encontrando errores o guías ya pagadas
  const lista = await filtraPendientes(listaGuias);

  loader.end();
  
  console.log(lista);

  // LLama a una función externa que se encarga de la muesra de la interfaz
  empaquetarGuias(lista);

  if(!document.getElementById("btn-gotoGestionar_cargador_pagos"))
    btnCargarPagos.after("<a class='btn btn-success mt-4' href='#gestionar_pagos' id='btn-gotoGestionar_cargador_pagos'>Ir a gestionar</a>")
}

/**
 * Función en cargada de recibir la guía como viene del historial, para transformarla a como se está guardando en el panel de pagos.
 * Encargada de manipular los precios según se hacía de forma manual para identificar las guía en devolución y otro tipo de información relevante
 * @param {*} guia 
 * @returns El objeto formateado a como se va a registrar en la base de datos
 */
function transformarGuiaAPago(guia)  {  
  const estadosDevolucion = [
    "ENTREGADO A REMITENTE", "Devuelto al Remitente",
    "CERRADO POR INCIDENCIA, VER CAUSA", "DEVOLUCION"
  ];

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
      case "COORDINADORA": case "ENVIA":
        comisionHeka = 2000;
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
    "TOTAL A PAGAR": totalPagar
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