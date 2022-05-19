import { ChangeElementContenWhileLoading, segmentarArreglo } from "../utils/functions.js";
import Stepper from "../utils/stepper.js";
import { formularioPrincipal, inpFiltCuentaResp, inpFiltUsuario, nameCollectionDb, selFiltDiaPago, visor } from "./config.js";
import { comprobarGuiaPagada, guiaExiste } from './comprobadores.js';

const db = firebase.firestore();

const btnGestionar = $("#btn-gestionar_pagos");

btnGestionar.click(consultarPendientes);

class Empaquetado {
    constructor() {
        this.pagosPorUsuario = {};
        this.id = 1;
        this.actual = 0;
        this.usuarioActivo = "";
        this.totalAPagar = 0;
    }

    addPago(guia) {
        const usuario = guia["REMITENTE"];
        if(this.pagosPorUsuario[usuario]) {
            this.pagosPorUsuario[usuario].guias.push(guia);
        } else {
            this.pagosPorUsuario[usuario] = {
                guias: [guia],
                id: this.id,
                usuario
            }
            this.id++;
        }

    }

    init() {
        const valoresHtml = `
            <div class="d-flex justify-content-between m-3 align-items-center">
                <p>Has pagado: <span id="pagado-gestionar_pagos">$${convertirMiles(0)}</span></p>
                <p>Por pagar: <span id="pendiente-gestionar_pagos">$${convertirMiles(this.totalAPagar - this.pagado)}</span></p>
                <p>Total Procesado: <span id="total-gestionar_pagos">$${convertirMiles(this.totalAPagar)}</span></p>
            </div>
        `;
        visor.html('<div class="step-view"></div>' + valoresHtml);
        this.usuarios = Object.keys(this.pagosPorUsuario);
        if(this.usuarios.length > 1) {
            visor.append(`<button class="btn btn-secondary prev mt-2" style="display: none;">anterior</button>
            <button class="btn btn-primary next mt-2">siguiente</button>`);
        }

        this.setPages();
        const usuariosIniciales = this.usuarios.slice(0, 2);
        usuariosIniciales.forEach(usuario => this.analizarGuias(usuario));
    }

    setPages() {
        this.usuarios
        .forEach((usuario, i) => {
            const element = `
                <div class="step ${i ? "" : "active"}">
                    <div class="card mt-3" id="pagos-usuario-${usuario}">
                        <div class="card-body">
                            <h5 class="card-title">
                                ${usuario}
                                <div class="btn-group">
                                    <button class="btn btn-light dropdown-toggle set-info-bank" data-user="${usuario}" data-toggle="dropdown" aria-expanded="false"></button>
                                    <ul class="dropdown-menu" id="info-bank-${usuario}">
                                        <li class="dropdown-item">Cargando Información...</li>
                                    </ul>
                                </div>
                            </h5>
                            <div class="loader text-center d-none"></div>
                            <div class="table-responsive">
                                <table class="table table-borderless">
                                    <thead>
                                        <tr>
                                            <th>Centro de Costo</th>
                                            <th>Transportadora</th>
                                            <th>Guía</th>
                                            <th>Recaudo</th>
                                            <th>Envío Total</th>
                                            <th>Total a Pagar</th>
                                            <th>Fecha</th>
                                            <th>Cuenta responsable</th>
                                            <th>Estado</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>  
                </div>      
            `;
    
            visor.children(".step-view").append(element);
        });

        $(".set-info-bank").click(e => this.cargarInformacionBancaria(e));
    }

    cargarInformacion(usuario) {
        let btnDisabled = false;
        let total = 0;
        console.log($("#pagos-usuario-"+usuario + " tbody", visor));
        $("#pagos-usuario-"+usuario + " tbody", visor).html("");
        $("#btn-pagar-"+usuario).remove();

        this.pagosPorUsuario[usuario].guias.forEach(guia => {
            if(guia.guiaPaga) {
                btnDisabled = true;
            } else {
                total += guia["TOTAL A PAGAR"];
            }
            const clase = "table-" + this.tipoAviso(guia.estado);
            const helper = (type, mensaje) => `<i class="fa fa-${type}" tabindex="0" data-toggle="popover" data-trigger="focus" data-content="${mensaje}"><i>`
            const popover = guia.mensaje
                ? `<i class="fa fa-question-circle" tabindex="0" data-toggle="popover" data-trigger="focus" data-content="${guia.mensaje}"></i>`
                : ""
            const eliminar = true 
                ? `
                    <i class="fa fa-trash deleter" title="Click para eliminar guía" data-user="${usuario}" data-numeroGuia="${guia.GUIA}"></i>
                ` 
                : "";
            const fila = `
                <tr class="${clase}" id="row-${usuario + guia.GUIA}">
                    <td class="show-error">${guia.REMITENTE}</td>
                    <td>${guia.TRANSPORTADORA}</td>
                    <td>${guia.GUIA}</td>
                    <td>${guia.RECAUDO}</td>
                    <td>${guia["ENVÍO TOTAL"]}</td>
                    <td>${guia["TOTAL A PAGAR"]}</td>
                    <td>${guia.FECHA || genFecha()}</td>
                    <td>${guia.cuenta_responsable || "No registró"}</td>
                    <td>
                        ${guia.estado} 
                        ${popover}
                        ${eliminar}
                        <span class="extra-opt"></span>
                    </td>
                </tr>
            `;

            $("#pagos-usuario-"+usuario + " tbody", visor).append(fila);
        });

        const button = document.createElement("button");
        button.setAttribute("class", "btn btn-success");
        button.setAttribute("id", "btn-pagar-"+usuario);

        if(btnDisabled) button.setAttribute("disabled", btnDisabled);
        button.innerHTML = "Pagar $" + convertirMiles(total);
        button.addEventListener("click", () => this.pagar(usuario));
        
        $("#pagos-usuario-"+usuario +" [data-toggle='popover']").popover();
        visor.find("#pagos-usuario-"+usuario + ">.card-body").append(button);
        $(".deleter", visor).click(eliminarGuiaStagging);

        this.totalAPagar += total;
        this.renderTotales;

        this.pagosPorUsuario[usuario].analizado = true;
        this.actual++
    }

    async analizarGuias(usuario) {
        const paq = this.pagosPorUsuario[usuario];
        const guias = paq.guias;
        const parent = $("#pagos-usuario-"+usuario);
        const loader = $(".loader", parent);
        const prevNext = $(".prev,.next");
        if(paq.analizado) return;

        let i = 0;
        const f = guias.length;

        loader.removeClass("d-none");
        prevNext.attr("disabled", true);

        guias.map(async guia => {
            const guiaPaga = await comprobarGuiaPagada(guia);
            const existente = await guiaExiste(guia);
            loader.html("cargando " + (i+1) + " de " + f + "...");

            if(existente) {
                guia.cuenta_responsable = existente.cuenta_responsable;
                guia.estado = existente.type;
                guia.id_heka = existente.id_heka;
                guia.id_user = existente.id_user
            } else {
                guia.noExiste = true;
                guia.estado = "NO EXISTE";
                guia.mensaje = "Guía no encontrada.";
            }

            if(guiaPaga) {
                guia.guiaPaga = guiaPaga;
                guia.mensaje = "¡Esta guía ya se encuentra pagada!";
                guia.estado = "PAGADA";
            }

            if(!guia.FECHA) guia.FECHA = genFecha();

            i++;
            if(i === f) {
                this.cargarInformacion(usuario);
                loader.addClass("d-none");
                prevNext.attr("disabled", false);

            }
            return guia;
        });
    }

    tipoAviso(sentencia) {
        switch(sentencia) {
            case "PAGADA":
                return "danger";
            case "NO EXISTE":
                return "warning";
            default: 
                return "light"
        }
    }

    cargarInformacionBancaria(e) {
        const target = e.target;
        const usuario = target.getAttribute("data-user");
        const visualizador = $("#info-bank-"+ usuario);
    
        const cargada = visualizador.hasClass("cargado");
        if(cargada) return;
    
        db.collection("usuarios").where("centro_de_costo", "==", usuario).limit(1)
        .get().then(q => {
            if(!q.size) {
                visualizador.html('<h6 class="dropdown-item">No se encontró el usuario</h6>');
            }
            q.forEach(doc => {
                const data = doc.data();
                const {datos_bancarios} = data;

                if(datos_bancarios) {
                    visualizador.html(`
                        <h6 class="dropdown-item">${datos_bancarios.banco}</h6>
                        <h6 class="dropdown-item">Representante: ${datos_bancarios.nombre_banco}</h6>
                        <h6 class="dropdown-item">${datos_bancarios.tipo_de_cuenta}: ${datos_bancarios.numero_cuenta}</h6>
                        <h6 class="dropdown-item">${datos_bancarios.tipo_documento_banco} - ${datos_bancarios.numero_iden_banco}</h6>
                    `);
                    this.pagosPorUsuario[usuario].datos_bancarios = datos_bancarios;
                } else {
                    visualizador.html('<h6 class="dropdown-item">Sin datos bancarios</h6>');
                }

                visualizador.addClass("cargado");
            })
        })
    }

    async pagar(usuario) {
        const guias = this.pagosPorUsuario[usuario].guias;
        const buttons = $(".next,.prev");
        const loader = new ChangeElementContenWhileLoading("#btn-pagar-"+usuario);
        loader.init();
        buttons.attr("disabled", true);
        const timeline = new Date().getTime();

        let pagado = 0;
        for await(let guia of guias) {
            guia.timeline = timeline;

            const transp = guia["TRANSPORTADORA"].toLowerCase();
            const numeroGuia = guia["GUIA"].toString();
            const id_heka = guia.id_heka;
            const id_user = guia.id_user;

            const fila = $("#row-"+usuario+numeroGuia, visor);
            fila.removeClass();

            //Procurar hacer todo esto por medio de una transacción
            try {
                let batch = db.batch();
                //Se debe pagar
                // const pagoRef = db.collection("pagos").doc(transp)
                // .collection("pagos").doc(numeroGuia);
                // batch.set(pagoRef, guia);

                //Actualizar la guía como paga
                if(false && id_heka && id_user) {
                    const guiaRef = collection("usuario").doc(id_user.toString())
                    .collection("guias").doc(id_heka.toString());
                    batch.update(guiaRef, {debe: 0});
                }

                // y finalmente eliminar la guía que ya fue paga
                const registroRef = db.collection(nameCollectionDb).doc(numeroGuia);
                batch.delete(registroRef);

                await batch.commit();

                fila.addClass("table-success");
                pagado += guia["TOTAL A PAGAR"];

            } catch(e) {
                console.log(e);
                fila.addClass("table-danger");
                
            }
        }

        loader.end();
        buttons.attr("disabled", false);

        this.pagosPorUsuario[usuario].pagoConcreto = pagado;
        this.renderTotales;

        console.log(usuario, guias);
    }

    get renderTotales() {
        let pagado = 0;
        for(const usuario in this.pagosPorUsuario) {
            const pago = this.pagosPorUsuario[usuario].pagoConcreto;

            if(pago) pagado += pago;
        }
        const pag = $("#pagado-gestionar_pagos", visor);
        const pend = $("#pendiente-gestionar_pagos", visor);
        const total = $("#total-gestionar_pagos", visor);
        const saldoPendiente = this.totalAPagar - pagado;

        pag.text("$"+convertirMiles(pagado));
        pend.text("$"+convertirMiles(saldoPendiente));
        total.text("$"+convertirMiles(this.totalAPagar));
    }
}

async function consultarPendientes(e) {
    // *** Segmento preparado *** para cuando se vayan a filtrar solo los pagos desde el último viernes
    const diaSemana = new Date().getDay();
    const diaEnMilli = 8.64e+7;
    let fechaFinal;
    if(diaSemana <= 5 ) {
        const retrasoInicial = 2 + diaSemana;
        const diasMilisegundos = retrasoInicial * diaEnMilli;
        const milisegundosRetraso = new Date().getTime() - diasMilisegundos;
        fechaFinal = genFecha(null, milisegundosRetraso);
    }
    // *** Fin segemento preparado ***

    const formData = new FormData(formularioPrincipal[0]);
    const transpSelected = formData.getAll("filtro-transportadoras");

    let reference = db.collection(nameCollectionDb);
    // .orderBy("timeline")

    const loader = new ChangeElementContenWhileLoading(e.target);
    loader.init();

    const paquete = new Empaquetado();
    let respuesta = [];

    if(selFiltDiaPago.val()) {
        const data = await db.collection("infoHeka").doc("usuariosPorDiaDePago")
        .get().then(d => d.data());

        const usuarios = data[selFiltDiaPago.val()];

        if(usuarios)
        inpFiltUsuario.val(usuarios.join())
    }

    if(inpFiltUsuario.val()) {
        const filt = inpFiltUsuario.val().split(",");
        const empaquetador = segmentarArreglo(filt, 9);

        for await (let paquete of empaquetador) {
            const data = await reference.where("REMITENTE", "in", paquete)
            .get().then(handlerInformation);

            respuesta = respuesta.concat(data);
        }
    } else if(inpFiltCuentaResp.val()) {
        const data = await reference.where("CUENTA RESPONSABLE", "==", inpFiltCuentaResp.val())
        .get().then(handlerInformation);

        respuesta = respuesta.concat(data);
    } else if(transpSelected.length) {
        const data = await reference.where("TRANSPORTADORA", "in", transpSelected)
        .get().then(handlerInformation);

        respuesta = respuesta.concat(data);
    } else {
        const data = await reference.get().then(handlerInformation);

        respuesta = data;
    }

    respuesta.forEach(d => paquete.addPago(d));
    paquete.init();

    const stepper = new Stepper(visor);
    stepper.init();
    stepper.findErrorsBeforeNext = () => {
        const paq = paquete.usuarios[paquete.actual];
        console.log(paquete.pagosPorUsuario[paq]);
        if(paq)
        paquete.analizarGuias(paq);
    }

    console.log(paquete);

    loader.end();
}

function handlerInformation(querySnapshot) {
    const respuesta = [];
    querySnapshot.forEach(doc => {
        const data = doc.data();
        respuesta.push(data);
    });

    return respuesta;
}

function eliminarGuiaStagging(e) {
    const target = e.target;
    const numeroGuia = target.getAttribute("data-numeroGuia");
    const usuario = target.getAttribute("data-user");

    Swal.fire({
        title: '¿Deseas eliminar una guía?',
        text: "Estás a punto de eliminar del cargue la guía número " + numeroGuia + " ¿Estás seguro?",
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Se lo que hago 😎',
        cancelButtonText: "No"
    }).then(async r => {
        if(r.isConfirmed) {
            $("#" + "btn-pagar-"+usuario).attr("disabled", true);
            await db.collection(nameCollectionDb).doc(numeroGuia.toString()).delete();
        
            Toast.fire("success","¡Guía " + numeroGuia + " Eliminada!");
        }
    });
}