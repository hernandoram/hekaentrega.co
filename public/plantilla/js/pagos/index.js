import "./pagar.js";
import AnotacionesPagos from "./AnotacionesPagos.js";
import { ChangeElementContenWhileLoading } from "../utils/functions.js";

const db = firebase.firestore();
const formularioPrincipal = $("#form-cargador_pagos");
const errorContainer = $("#errores-cargador_pagos");
const btnCargarPagos = $("#btn-cargar_cargador_pagos");
const cargador = $("#cargador-cargador_pagos");

btnCargarPagos.click(cargarPagosPendientes);

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
    
    const reference = db.collection("pendientePorPagar").doc(numeroGuia);
    
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
      return "Recuerda por favor agregar una la cuenta responsable de la guia " + objToSend.GUIA;
    } else if (objToSend.TRANSPORTADORA.toLowerCase() !== "servientrega" 
    && objToSend.TRANSPORTADORA.toLowerCase() != "envía" 
    && objToSend.TRANSPORTADORA.toLowerCase() != "tcc"
    && objToSend.TRANSPORTADORA.toLowerCase() != "interrapidisimo") {
      return "Por favor, Asegurate que la factura de la guía: " + objToSend.GUIA + " le pertenezca a <b>Envía, TCC, Servientrega o Interrapidisimo</b>"
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