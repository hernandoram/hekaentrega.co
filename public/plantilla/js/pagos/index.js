import "./pagar.js";
import AnotacionesPagos from "./AnotacionesPagos.js";
import { ChangeElementContenWhileLoading, segmentarArreglo } from "../utils/functions.js";
import { empaquetarGuias } from "./pagar.js";

const db = firebase.firestore();
const formularioPrincipal = $("#form-cargador_pagos");
const errorContainer = $("#errores-cargador_pagos");
const btnCargarPagos = $("#btn-cargar_cargador_pagos");
const btnCargarPagosHistGuias = $("#pagar-hist_guias");
const cargador = $("#cargador-cargador_pagos");

btnCargarPagos.click(cargarPagosPendientes);
btnCargarPagosHistGuias.click(cargarPagosDirectos);

const referencePagos = db.collection("pendientePorPagar");
const refHistGuias = db.collectionGroup("guias");

async function cargarPagosPendientes(e) {
  const loader = new ChangeElementContenWhileLoading(e.target);
  loader.init();

  cargador.removeClass("d-none");
  const counterEl = $(".counter", cargador);
  const fEl = $(".f", cargador);
  fEl.text("excel");
  
  let i = 1;
  let agregados = 0;

  const anotaciones = new AnotacionesPagos(errorContainer);
  anotaciones.init();

  const finalizarProceso = (e) => {
    anotaciones.addError(e.message, {color: e.color || "danger"});
    cargador.addClass("d-none");
    loader.end();
  }

  const data = new FormData(document.getElementById("form-cargador_pagos"));
  console.log(data.get("documento"));
  const datosDePago = await fetch("/excel_to_json", {
    method: "POST",
    body: data
  }).then(res => res.json())
  .catch(finalizarProceso)

  console.log(datosDePago);

  fEl.text(datosDePago.length);

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
          transportadoras.push(transp.value.toLowerCase());
        }
      }
      let filtroInputs = datos.filter((data) => {
        let fechaI, fechaF, guia, permitir_transportadora;
        if(!Number.isInteger(data["ENVÍO TOTAL"]) || !Number.isInteger(data.RECAUDO) || !Number.isInteger(data["TOTAL A PAGAR"])){
          numero_flotante += 1;
        }
        if(data.TRANSPORTADORA && transportadoras.indexOf(data.TRANSPORTADORA.toLowerCase()) != -1 && transportadoras.length != 0) {
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

function datosImportantesIncompletos(objToSend, completeData) {
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
    } else if (objToSend.TRANSPORTADORA !== "Servientrega" 
    && objToSend.TRANSPORTADORA != "ENVÍA" 
    && objToSend.TRANSPORTADORA != "TCC"
    && objToSend.TRANSPORTADORA != "Interrapidisimo") {
      return "Por favor, Asegurate que la factura de la guía: " + objToSend.GUIA + " le pertenezca a <b>ENVÍA, TCC, Servientrega o Interrapidisimo</b>"
    }
}

async function comprobarGuiaPagada(objToSend) {
    const transportadora = objToSend["TRANSPORTADORA"];
    const numeroGuia = objToSend["GUIA"];
    
    const guiaPaga = await firebase.firestore().collection("pagos").doc(transportadora.toLocaleLowerCase())
    .collection("pagos").doc(numeroGuia.toString()).get();

    if(guiaPaga.exists) {
        return true;
    }

    return false;
}

async function cargarPagosDirectos(e) {
  const finalId = e.target.id.split("-")[1];
  const loader = new ChangeElementContenWhileLoading(e.target);
  loader.init();

  let fechaI = document.querySelector("#fechaI-"+finalId).value + "::";
  let fechaF = document.querySelector("#fechaF-"+finalId).value + "::";
  const filtroCentroDeCosto = $("#filtro_pagos-"+finalId).val();
  const filtroTransp = $("#filtro_transp-"+finalId).val();
  const listaGuias = [];

  const manejarInformacion = querySnapshot => {
    console.log(querySnapshot.size);
    querySnapshot.forEach(doc => {
      const guia = doc.data();

      const type = guia.type;
      const deuda = guia.debe;
      
      // Ignorar aquelas que hayan sido pagadas;
      if(type === "CONVENCIONAL") return;
      if(type === "PAGO CONTRAENTREGA" && deuda === 0) return;
          
      listaGuias.push(transformarGuiaAPago(guia));
    });
  }

  let filtroPagoSeleccionado;

  if(filtroCentroDeCosto) {
    if(!filtroPagos) {
      filtroPagos = await db.collection("infoHeka").doc("usuariosPorDiaDePago")
      .get().then(d => d.data());
    }

    filtroPagoSeleccionado = filtroPagos[filtroCentroDeCosto];
  }

  const referencia = refHistGuias
  .orderBy("timeline")
  .startAt(new Date(fechaI).getTime()).endAt(new Date(fechaF).getTime() + 8.64e+7)
  .where("seguimiento_finalizado", "==", true)

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


  location.href = "#cargador_pagos";
  
  const lista = await filtraPendientes(listaGuias);

  loader.end();
  
  console.log(lista);
  
  location.href = "#gestionar_pagos";

  empaquetarGuias(lista);

}

function transformarGuiaAPago(guia)  {  
  return {
    GUIA: guia.numeroGuia,
    "REMITENTE": guia.centro_de_costo,
    TRANSPORTADORA: guia.transportadora,
    "CUENTA RESPONSABLE": guia.cuenta_responsable,
    "COMISION HEKA": guia.detalles.comision_heka,
    RECAUDO: guia.detalles.recaudo,
    "ENVÍO TOTAL": guia.detalles.total,
    "TOTAL A PAGAR": guia.detalles.recaudo - guia.detalles.total
  }
}

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

  let respuesta = []
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

async function comprobarSegmentoGuias(segmento, logger) {
  const listaAsync = segmento.map(comprobarGuiaPagada);

  const lista = await Promise.all(listaAsync);

  return segmento.filter((g, i) => {
    g.timeline = new Date().getTime();

    const pagada = !lista[i];

    if(pagada) logger.addError("La guia " + g.GUIA + " fue pagada.");

    return pagada;
  })
}