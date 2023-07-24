import { ChangeElementContenWhileLoading, segmentarArreglo } from "../utils/functions.js";
import Stepper from "../utils/stepper.js";
import { checkShowNegativos, camposExcel, formularioPrincipal, inpFiltCuentaResp, inpFiltUsuario, nameCollectionDb, selFiltDiaPago, visor, codigos_banco } from "./config.js";
import { comprobarGuiaPagada, guiaExiste } from './comprobadores.js';
import { defFiltrado as estadosGlobalGuias } from "../historialGuias/config.js";

const db = firebase.firestore();
const storage = firebase.storage();

const btnGestionar = $("#btn-gestionar_pagos");

btnGestionar.click(consultarPendientes);

/**
 * Clase en cargada de manipular la información de pagos para almacenarla de manera organizada, por usuario
 */
class Empaquetado {
    constructor() {
        this.pagosPorUsuario = {};
        this.id = 1;
        this.actual = 0;
        this.usuarioActivo = "";
        this.totalAPagar = 0;
        this.guiasAnalizadas = 0;
    }

    /**
     * La función `addPago` agrega una guia (guía) al objeto pagosPorUsuario (pagos por usuario),
     * agrupándolos por la propiedad REMITENTE (remitente).
     * @param guia - El parámetro "guia" es un objeto que representa una guía de pago. Contiene
     * información sobre el remitente ("REMITENTE") y otras propiedades relacionadas con el pago.
     */
    addPago(guia) {
        const usuario = guia["REMITENTE"];
        if(this.pagosPorUsuario[usuario]) {
            this.pagosPorUsuario[usuario].guias.push(guia);
        } else {
            this.pagosPorUsuario[usuario] = {
                guias: [guia],
                guiasPagadas: [],
                id: this.id,
                id_user: "",
                usuario
            }
            this.id++;
        }

    }

    /**
     * La función `init()` inicializa el contenido HTML y establece los valores para los elementos
     * "pagado", "por pago" y "total procesado".
     */
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

        // usuariosIniciales.reduce( async usuario => this.analizarGuias(usuario));
    }

    /**
     * La función "chargeAll" es una función asíncrona que itera a través de una lista de usuarios y
     * realiza un análisis de sus datos, y luego actualiza la interfaz de usuario en consecuencia.
     * @param [condition=POSITIVO] - El parámetro de condición es una cadena que especifica la
     * condición para filtrar los usuarios. En este código, está configurado en "POSITIVO" por defecto.
     */
    async chargeAll(condition = "POSITIVO") {

        this.condition = condition;

        for await (let u of this.usuarios) {
            await this.analizarGuias(u);
        }
        $("#total-gestionar_pagos").addClass("text-success");


        this.usuarios = Object.keys(this.pagosPorUsuario)
        .filter(cc => this.pagosPorUsuario[cc].condition === condition);
        
        this.usuarioActivo = this.usuarios[this.actual];
        if(this.usuarios.length > 1) {
            visor.append(`
                <button class="btn btn-secondary prev mt-2" style="display: none;">anterior <span class="badge badge-light">0</span></button>
                <button class="btn btn-primary next mt-2">
                    siguiente 
                    <span class="badge badge-light">
                        ${this.usuarios.length - 1}
                    </span>
                </button>
                <button class="btn btn-outline-primary mt-2 ml-3" id="descargador-guias-pagos">Descargar info</button>
            `);
        }

        const descargarExcel = $("#descargador-guias-pagos");

        descargarExcel.click((e) => this.descargarExcelPagos(e));

        $(".step-view > .step:first-child", visor).addClass("active");
        this.activeActionsAfterSetPages();

    }

    /**
     * La función "setPages" itera sobre una lista de usuarios y llama a la función "setPage" para cada
     * usuario, y luego llama a la función "activeActionsAfterSetPages".
     */
    setPages() {
        this.usuarios
        .forEach(this.setPage);

        this.activeActionsAfterSetPages();
        
    }
    
    /**
     * La función "activeActionsAfterSetPages" inicializa detectores de eventos para hacer clic en
     * elementos con las clases "set-info-bank" y "dwload-excel", y también inicializa una entrada de
     * archivo personalizada.
     */
    activeActionsAfterSetPages() {
        $(".set-info-bank").click(e => this.cargarInformacionBancaria(e));
        $(".dwload-excel").click(e => this.descargarExcelPagosUsuario(e));
    
        // importante para cambiar el label del selector de archivos cuando cambia
        bsCustomFileInput.init();
    }

    /**
     * La función `setPage` genera elementos HTML para la página de pago de un usuario.
     * @param usuario - El parámetro "usuario" representa al usuario para el que se está configurando
     * la página. Se utiliza para personalizar los elementos de la página y mostrar información
     * específica del usuario.
     * @param i - El parámetro "i" se utiliza para determinar si el paso debe estar activo o no. Si "i"
     * es verdadero, entonces el paso no tendrá la clase "activa", de lo contrario, tendrá la clase
     * "activa".
     */
    setPage(usuario, i) {
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
                            <button class="btn btn-light dwload-excel" data-user="${usuario}">Descargar Excel</button>
                        </h5>
                        <div class="loader text-center d-none"></div>
                        <div class="table-responsive">
                            <table class="table table-borderless">
                                <thead>
                                    <tr>
                                        ${this.columnas.map(c => "<th>" + c.title +"</th>").join("")}
                                    </tr>
                                </thead>
                                <tbody>
                                </tbody>
                            </table>
                        </div>
                        <div class="custom-file mt-2 mb-4">
                            <input type="file" class="custom-file-input" id="comprobante_pago-${usuario}" accept=".pdf" name="comprobante_bancario" lang="es">
                            <label class="custom-file-label" data-browse="Elegir" for="comprobante_pago-${usuario}">Cargar comprobante ${usuario}</label>
                        </div>
                    </div>
                </div>  
            </div>      
        `;

        visor.children(".step-view").append(element);
    }

    /**
     * La función `cargarInformacion(usuario)` carga información de un usuario específico y la muestra
     * en una tabla, incluyendo botones para pagar y generar factura.
     * @param usuario - El parámetro "usuario" representa al usuario para el cual se está cargando la
     * información.
     * @returns La función no tiene declaración de retorno, por lo que no devuelve ningún valor.
     */
    cargarInformacion(usuario) {
        let btnDisabled = false;
        let btnFactDisabled = true;
        let totalFact = 0;
        $("#pagos-usuario-"+usuario + " tbody", visor).html("");
        $("#btn-pagar-"+usuario).remove();
        const userRef = this.pagosPorUsuario[usuario];

        // Calcula el total por usuario
        const total = userRef.guias.reduce((a,b) => {
            if(!b.guiaPaga) a += b["TOTAL A PAGAR"];
            return a;
        },0);

        // revisa si el pago pendiente es negativo para aplicarle el filtro correspondiente
        if(total < 0) {
            btnDisabled = true;
            userRef.condition = "NEGATIVO";
            // return;
        } else {
            userRef.condition = "POSITIVO";
        }
        
        // En caso que la condición corresponda con la marcada inicialmente se agrega la página para el usuario
        if(userRef.condition === this.condition) this.setPage(usuario, true);
        else return;

        // Se analiza cada guía del usuario para añadirle ciertas funciones y/o mensajes de utilidad
        userRef.guias.forEach(guia => {
            if(guia.guiaPaga) {
                btnDisabled = true;
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
                <tr class="${clase}" id="row-${usuario + guia.GUIA}" title="" data-delay='${JSON.stringify({show: 500, hide: 100})}'>
                    <td class="show-error">${guia.REMITENTE}</td>
                    <td>${guia.TRANSPORTADORA}</td>
                    <td>${guia.GUIA}</td>
                    <td>${guia.RECAUDO}</td>
                    <td>${guia["ENVÍO TOTAL"]}</td>
                    <td>${guia["TOTAL A PAGAR"]}</td>
                    <td>${guia["COMISION HEKA"] || 0}</td>
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

        
        // Se añaden la configuraciones sobre el botón encargado de pagar
        if(btnDisabled) button.setAttribute("disabled", btnDisabled);
        button.innerHTML = "Pagar $" + convertirMiles(total);
        button.addEventListener("click", () => this.pagar(usuario));
        
        // Se agregan la configuraciones al botón encagado de facturar
        const buttonFact = document.createElement("button");
        buttonFact.setAttribute("class", "btn btn-outline-success ml-2 d-none");
        buttonFact.setAttribute("id", "btn-facturar-"+usuario);

        // if(btnFactDisabled) buttonFact.setAttribute("disabled", btnFactDisabled);
        buttonFact.addEventListener("click", () => this.facturar());
        
        $("#pagos-usuario-"+usuario +" [data-toggle='popover']").popover();

        visor.find("#pagos-usuario-"+usuario + ">.card-body").append(button, buttonFact);

        // Se agrega la función sobre el botón encargado de eliminar
        $(".deleter", visor).click(eliminarGuiaStagging);

        this.totalAPagar += total;
        this.renderTotales;

        userRef.analizado = true;
        userRef.pagoPendiente = total;
        // this.actual++
    }

    /**
     * La función `analizarGuias` analiza una lista de guías para un usuario determinado, verifica si
     * son pagas y si existen, y actualiza su estado en consecuencia.
     * @param usuario - El parámetro `usuario` representa al usuario para el que se deben analizar las
     * guías.
     * @returns La función `analizarGuias` no tiene declaración de retorno, por lo que no devuelve nada
     * explícitamente.
     */
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

        const guiasRevisadas = guias.map(async guia => {
            const guiaPaga = await comprobarGuiaPagada(guia);
            const existente = await guiaExiste(guia);
            loader.html("cargando " + (i+1) + " de " + f + "...");

            if(existente) {
                guia.cuenta_responsable = existente.cuenta_responsable || guia["CUENTA RESPONSABLE"] || "SCR";
                guia.estado = existente.type;
                guia.id_heka = existente.id_heka;
                guia.id_user = existente.id_user;
                guia.referencia = existente.referencia || "No aplica";
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

            if(!guia.estado) guia.estado = "No registra";

            if(!guia.FECHA) guia.FECHA = genFecha("LR");

            if(!guia.cuenta_responsable) guia.cuenta_responsable = guia["CUENTA RESPONSABLE"] || "SCR";

            i++;

            return guia;
        });

        await Promise.all(guiasRevisadas);

        this.cargarInformacion(usuario);
        loader.addClass("d-none");
        prevNext.attr("disabled", false);
        
        this.guiasAnalizadas+=f;
        
    }

    /**
     * La función "tipoAviso" devuelve una cadena que representa el tipo de alerta en función de la
     * frase de entrada.
     * @param sentencia - El parámetro "sentencia" es una cadena que representa el estado de un aviso.
     * @returns La función `tipoAviso` devuelve un valor de cadena. El valor de cadena específico
     * devuelto depende del valor del parámetro `sentencia`. Si `sentencia` es igual a "PAGADA", la
     * función devuelve "peligro". Si `sentencia` es igual a "NO EXISTE", la función devuelve
     * "advertencia". Para cualquier otro valor de `sentencia`, la función devuelve
     */
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

    /**
     * La función "cargarInformacionBancaria" es una función asíncrona que carga y muestra la
     * información bancaria de un usuario.
     * @param e - El parámetro `e` es un objeto de evento que representa el evento que activó la
     * función. Por lo general, se pasa a las funciones del controlador de eventos y contiene
     * información sobre el evento, como el elemento de destino que desencadenó el evento.
     * @returns nada (indefinido).
     */
    async cargarInformacionBancaria(e) {
        const target = e.target;
        const usuario = target.getAttribute("data-user");
        const visualizador = $("#info-bank-"+ usuario);

        const cargada = visualizador.hasClass("cargado");
        if(cargada) return;
        
        const infoUser = await this.cargarInfoUsuario();
        
        if(infoUser === null) {
            visualizador.html('<h6 class="dropdown-item">No se encontró el usuario</h6>');
            return;
        }

        const {datos_bancarios} = infoUser;

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
    }

    /**
     * La función `descargarExcelPagosUsuario` descarga un archivo Excel que contiene la información de
     * pago de un usuario específico.
     * @param e - El parámetro "e" es un objeto de evento que se pasa a la función cuando se
     * desencadena por un evento. Se usa comúnmente para acceder a información sobre el evento que
     * ocurrió, como el elemento de destino que desencadenó el evento.
     */
    descargarExcelPagosUsuario(e) {
        const target = e.target;
        const usuario = target.getAttribute("data-user");
        const pagos = this.pagosPorUsuario[usuario];
        const guias = pagos.guias;

        console.log(pagos);
        const columnas = this.columnas

        descargarInformeGuiasAdmin(columnas, guias, "Pagos");
    }

    /**
     * La función `descargarExcelPagos` es una función asíncrona que descarga un archivo de Excel que
     * contiene información de pago para usuarios con detalles de cuenta bancaria.
     * @param e - El parámetro `e` es un objeto de evento que se pasa a la función
     * `descargarExcelPagos`. Por lo general, es un objeto de evento que se desencadena por un evento,
     * como hacer clic en un botón o enviar un formulario.
     */
    async descargarExcelPagos(e) {
        const loader = new ChangeElementContenWhileLoading(e.target);
        loader.init();
        const columnas = [
            {data: "tipo_doc_number", title: "Tipo Documento Beneficiario"}, // tengo que convertir [null, cc, ce, nit, TI, Pasaporte]
            {data: "numero_iden_banco", title: "Nit Beneficiario"},
            {data: "nombre_ben", title: "Nombre Beneficiario"},
            {data: "tipo_transaccion", title: "Tipo Transaccion"},
            {data: "cod_bank", title: "Código Banco"},
            {data: "numero_cuenta", title: "No Cuenta Beneficiario"},
            {data: "correo", title: "Email"},
            {data: "documento_autorizado", title: "Documento Autorizado"},
            {data: "referencia", title: "Referencia"},
            {data: "celular", title: "Celular Beneficiario"},
            {data: "pagoPendiente", title: "ValorTransaccion"},
            {data: "fecha_aplicacion", title: "Fecha de aplicación"}
        ];

        const tiposDocumento = {
            CC: 1,
            "Cédula extranjería": 2,
            "NIT": 3,
            TI: 4,
            PASAPORTE: 5
        }

        const infoUsuariosProm = this.usuarios.map(this.cargarInfoUsuario.bind(this));
        const infoUsuarios = await Promise.all(infoUsuariosProm);
        const usuariosSinCuenta = infoUsuarios.filter(us => !us.datos_bancarios);
        
        

        const guiasDescarga = infoUsuarios
        .filter(us => !!us.datos_bancarios)
        .map((us) => {
            const datos_bancarios = us.datos_bancarios;
            const pagos = this.pagosPorUsuario[us.centro_de_costo];

            return {
                tipo_doc_number: tiposDocumento[datos_bancarios.tipo_documento_banco],
                numero_iden_banco: datos_bancarios.numero_iden_banco,
                nombre_ben: us.centro_de_costo,
                tipo_transaccion: datos_bancarios.tipo_de_cuenta === "Ahorros" ? 37 : 27,
                cod_bank: codigos_banco[datos_bancarios.banco],
                numero_cuenta: datos_bancarios.numero_cuenta,
                correo: "",
                documento_autorizado: "",
                referencia: "",
                celular: "",
                pagoPendiente: pagos.pagoPendiente,
                fecha_aplicacion: genFecha().replace(/\-/g, "")
            };
        });

        console.log(guiasDescarga);

        if(usuariosSinCuenta.length) {
            Swal.fire(
                "Revise los datos bancarios de los siguientes usuarios", 
                `Los usuarios ${usuariosSinCuenta.map(u => u.centro_de_costo).join(", ")} no fueron tomados en cuenta para la descarga.`, 
                "warning"
            );
        }

        descargarInformeGuiasAdmin(columnas, guiasDescarga, "Guías a pagar");

        loader.end();
    }

    /**
     * La función `cargarInfoUsuario` es una función asíncrona que recupera información del usuario de
     * una base de datos basada en la identificación del usuario o la identificación del usuario activo
     * si no se proporciona una identificación.
     * @param user - El parámetro de usuario es opcional y representa el usuario para el que queremos
     * cargar la información. Si no se proporciona ningún usuario, se establecerá de forma
     * predeterminada en el usuario activo.
     * @returns la información del usuario de la base de datos.
     */
    async cargarInfoUsuario(user) {
        user = user ? user : this.usuarioActivo;
        const userRef = this.pagosPorUsuario[user];

        if(userRef.informacion) return userRef.informacion;

        return await db.collection("usuarios").where("centro_de_costo", "==", user).limit(1)
        .get().then(q => {

            let usuario = null;
            
            q.forEach(doc => {
                usuario = doc.data();
                const {
                    datos_bancarios, numero_documento, celular, centro_de_costo,
                    correo
                } = usuario;
                userRef.informacion = {
                    datos_bancarios, numero_documento, celular, centro_de_costo,
                    correo
                }
                userRef.id_user = doc.id;
            });

            return usuario;
        })
    }

    /**
     * La función `pagar` es una función asíncrona en JavaScript que maneja el proceso de pago de un
     * usuario, incluida la carga de un recibo de pago, la actualización de la información de pago en
     * la base de datos y el envío de notificaciones.
     * @param usuario - El parámetro `usuario` representa al usuario por el cual se está realizando el
     * pago.
     * @returns La función `pagar` no tiene declaración de retorno, por lo que no devuelve ningún
     * valor.
     */
    async pagar(usuario) {
        const timeline = new Date().getTime();
        const storageRef = storage.ref("comprobantes_bancarios").child(usuario).child(timeline + ".pdf");
        const refDiasPago = db.collection("infoHeka").doc("manejoUsuarios");

        const file = $("#comprobante_pago-"+usuario)[0].files[0];

        const pagoUser = this.pagosPorUsuario[usuario];
        pagoUser.guiasPagadas = [];
        const guias = pagoUser.guias;
        const buttons = $(".next,.prev");
        const loader = new ChangeElementContenWhileLoading("#btn-pagar-"+usuario);
        loader.init();
        // buttons.attr("disabled", true);

        const terminar = () => {
            loader.end();
            buttons.attr("disabled", false);

            this.renderTotales;

            console.log(usuario, guias);
        }

        let comprobante_bancario = null;
        const swalObj = {
            title: 'Continuar...',
            text: "Estás a punto de efectuar un pago de $" + convertirMiles(pagoUser.pagoPendiente) + " al usuario " + usuario + " ¿Deseas continuar?",
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: '¡Sin miedo al éxito! 😎',
            cancelButtonText: "¡pera reviso!"
        }

        // Si se le carga un comporbante manual, se guarda
        if(file) {
            const comprobar = await Swal.fire(swalObj);

            if(!comprobar.isConfirmed) return terminar();

            const uploadTask = storageRef.put(file);

            await uploadTask;
            comprobante_bancario = await uploadTask.snapshot.ref.getDownloadURL();
        } else {
            swalObj.title = "¡Falta el comprobante!";
            swalObj.confirmButtonText = '¡Sé lo que hago! 😠';
            swalObj.cancelButtonText = "no, perate! 😱";
            swalObj.icon= 'warning';

            const comprobar = await Swal.fire(swalObj);

            if(!comprobar.isConfirmed) return terminar();
        }

        let pagado = 0;
        let comision_heka = 0;
        for await(let guia of guias) {
            guia.timeline = timeline;
            guia.comprobante_bancario = comprobante_bancario;

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
                const pagoRef = db.collection("pagos").doc(transp)
                .collection("pagos").doc(numeroGuia);
                batch.set(pagoRef, guia);

                //Actualizar la guía como paga
                if(id_heka && id_user) {
                    const guiaRef = db.collection("usuarios").doc(id_user.toString())
                    .collection("guias").doc(id_heka.toString());
                    batch.update(guiaRef, {debe: 0, estadoActual: estadosGlobalGuias.pagada});
                }

                // y finalmente eliminar la guía  en cargue que ya fue paga
                const registroRef = db.collection(nameCollectionDb).doc(numeroGuia);
                batch.delete(registroRef);
                
                await batch.commit();

                fila.addClass("table-success");

                // Agregar la guía que sea paga.
                pagoUser.guiasPagadas.push(numeroGuia);
                
                // Sumar las comisiones y los totales
                pagado += guia["TOTAL A PAGAR"];
                comision_heka += guia[camposExcel.comision_heka];

            } catch(e) {
                console.log(e);
                fila.addClass("table-danger");
                fila.attr({
                    "title": e.message
                });
                fila.tooltip();
            }
        }

        if(comision_heka && !pagoUser.facturaGenerada) {
            const buttonFact = $("#btn-facturar-"+usuario);
            buttonFact.prop("disabled", false);
            buttonFact.removeClass("d-none");
            buttonFact.text("Facturar $" + convertirMiles(comision_heka));
        }

        if(pagoUser.informacion) {
            const {celular} = pagoUser.informacion;
            const parametros = [pagado.toString(), comision_heka.toString()].map(p => ({default: p}));
            fetch("/mensajeria/ws/sendMessage/pagos_factura", organizarPostPlantillaMensaje(celular, parametros))
        }

        const actualizacion = {
            diarioSolicitado: firebase.firestore.FieldValue.arrayRemove(usuario),
        }
    
        refDiasPago.update(actualizacion);

        this.pagosPorUsuario[usuario].pagoConcreto = pagado;
        this.pagosPorUsuario[usuario].comision_heka_total = comision_heka;

        terminar();
    }

    /**
     * La función `guardarPaquetePagado` guarda la información de pago de un paquete en una colección
     * de Firestore.
     * @param factura - El parámetro `factura` es un objeto que representa una factura de pago.
     * Contiene las siguientes propiedades:
     */
    async guardarPaquetePagado(factura) {
        const userRef = this.pagosPorUsuario[this.usuarioActivo];
        const {guiasPagadas, pagoConcreto, comision_heka_total} = userRef;
        const {timeline, comprobante_bancario} = userRef.guias[0];

        const infoToSave = {
            guiasPagadas,
            total_pagado: pagoConcreto,
            comision_heka: comision_heka_total,
            timeline,
            fecha: new Date(),
            comprobante_bancario,
            id_factura: factura.id,
            num_factura: factura.number,
            centro_de_costo: this.usuarioActivo,
            id_user: userRef.id_user || ""
        }

        console.log(infoToSave);
        // return;

        await db.collection("paquetePagos").add(infoToSave)

    }

    /**
     * La función `facturar` genera una factura (factura) para un usuario, muestra un mensaje de
     * confirmación y realiza una solicitud para crear la factura utilizando la API de Siigo.
     * @returns La función `facturar()` devuelve una Promesa.
     */
    async facturar() {
        const userRef = this.pagosPorUsuario[this.usuarioActivo];
        const swalObj = {
            title: 'Continuar...',
            text: "Estás a punto de generar una factura de $" + convertirMiles(userRef.comision_heka_total) + " al usuario " + this.usuarioActivo + " ¿Deseas continuar?",
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: '¡Hágale! 👍',
            cancelButtonText: "¡No, me equivoqué!"
        }

        const buttons = $(".next,.prev");
        const idButtonFacturar = "#btn-facturar-"+this.usuarioActivo;
        const loader = new ChangeElementContenWhileLoading(idButtonFacturar);
        loader.init();

        const terminar = (proceso_correcto) => {
            loader.end();

            if(proceso_correcto) {
                userRef.facturaGenerada = true;
                loader.el.prop("disabled", true);
            }

            buttons.attr("disabled", false);
        }

        const comprobar = await Swal.fire(swalObj);

        if(!comprobar.isConfirmed) return terminar();

        const comision_heka_total = userRef.comision_heka_total;
        
        if(!userRef.numero_documento) {
            const infoUser = await this.cargarInfoUsuario();
            userRef.numero_documento = infoUser.numero_documento;
        }

        const numero_documento = userRef.numero_documento;

        if(!comision_heka_total) {
            Toast.fire("No hay comisión para facturar", "", "error");
            terminar();
            return;
        }
        try {
            const resFact = await fetch("/siigo/crearFactura", {
                method: "POST",
                headers: {"Content-Type": "Application/json"},
                body: JSON.stringify({comision_heka: comision_heka_total, numero_documento})
            })
            .then(d => d.json())
            .catch(e => {
                return {
                    error: true,
                    message: "Error al crear la factura con siigo"
                }
            });

            if(resFact.error) throw new Error(resFact.message);

            await this.guardarPaquetePagado(resFact);

            terminar(true);
            
            Toast.fire("Factura agregada correctamente.", "", "success");

        } catch (e) {
            Swal.fire("¡ERROR!", e.message, "error");
            terminar();
        }


    }

    /**
     * La función calcula y representa el monto total pagado, pendiente y el monto total general.
     */
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

    /**
     * La función devuelve una matriz de objetos que representan columnas con sus respectivos títulos.
     * @returns Se devuelve una matriz de objetos. Cada objeto representa una columna en una tabla y
     * contiene dos propiedades: "datos" y "título". La propiedad "datos" representa el campo de datos
     * o la clave de esa columna, mientras que la propiedad "título" representa el título o el
     * encabezado de esa columna.
     */
    get columnas() {
        return [
            {data: "REMITENTE", title: "Centro de costo"},
            {data: "TRANSPORTADORA", title: "Transportadora"},
            {data: "GUIA", title: "Guía"},
            {data: "RECAUDO", title: "Recaudo"},
            {data: "ENVÍO TOTAL", title: "Envío total"},
            {data: "TOTAL A PAGAR", title: "Total a pagar"},
            {data: "COMISION HEKA", title: "Comisión heka"},
            {data: "FECHA", title: "Fecha"},
            {data: "cuenta_responsable", title: "Cuenta responsable"},
            {data: "estado", title: "Estado"},
        ]
    }

    /**
     * La función `countTotalGuides` calcula el número total de guías para todos los usuarios en el
     * objeto `PaymentsPerUser`.
     * @returns el conteo total de guías para todos los usuarios en el objeto "pagosPorUsuario".
     */
    get conteoTotalGuias() {
        const usuarios = Object.keys(this.pagosPorUsuario);
        return usuarios.reduce((a,b) => a + this.pagosPorUsuario[b].guias.length, 0)
    }
}

/**
 * La función `consultarPendientes` es una función asincrónica que recupera elementos
 * pendientes en función de varios filtros y los muestra en la página web.
 * @param e - El parámetro `e` es un objeto de evento que representa el evento que activó la función.
 * Por lo general, se usa para acceder a información sobre el evento, como el elemento de destino que
 * activó el evento.
 */
async function consultarPendientes(e) {
    const selectorFecha = $("#fecha-gestionar_pagos");
    const fechaI = $("#filtro-fechaI-gestionar_pagos");
    const fechaF = $("#filtro-fechaF-gestionar_pagos");

    const startAtMilli = new Date(fechaI.val()).getTime();
    const endAtMilli = new Date(fechaF.val()).getTime() + 8.64e+7;

    const formData = new FormData(formularioPrincipal[0]);
    const transpSelected = formData.getAll("filtro-transportadoras");

    let reference = db.collection(nameCollectionDb)
    .orderBy("timeline")

    if(selectorFecha.css("display") != "none") {
        console.log("fecha inicial => ", new Date(startAtMilli))
        console.log("fecha final => ", new Date(endAtMilli))
        reference = reference.startAt(startAtMilli).endAt(endAtMilli);
    }

    const loader = new ChangeElementContenWhileLoading(e.target);
    loader.init();

    let respuesta = [];

    if(selFiltDiaPago.val()) {
        const data = await db.collection("infoHeka").doc("manejoUsuarios")
        .get().then(d => d.data());

        const usuarios = data[selFiltDiaPago.val()];

        if(usuarios)
        inpFiltUsuario.val(usuarios.join())
    }

    if(inpFiltUsuario.val() || selFiltDiaPago.val()) {
        const filt = inpFiltUsuario.val().split(",");
        const empaquetador = segmentarArreglo(filt, 9);

        for await (let paquete of empaquetador) {
            const data = await reference.where("REMITENTE", "in", paquete)
            .get().then(handlerInformation);

            respuesta = respuesta.concat(data);
        }

        if(inpFiltCuentaResp.val()) {
            respuesta = respuesta.filter(guia => guia["CUENTA RESPONSABLE"] === inpFiltCuentaResp.val());
        }

    } else if(inpFiltCuentaResp.val()) {
        if(transpSelected.length) {
            reference = reference.where("TRANSPORTADORA", "in", transpSelected)
        }
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
    
    await empaquetarGuias(respuesta);

    loader.end();
}

/**
 * La función `empaquetarGuias` es una función asíncrona que toma una matriz como entrada, la ordena
 * según la propiedad "REMITENTE" y realiza varias operaciones sobre los datos de la matriz.
 * @param arr - El parámetro `arr` es una matriz de objetos. Cada objeto representa una guía y tiene
 * propiedades como "REMITENTE" (remitente), que se utiliza para ordenar las guías.
 */
async function empaquetarGuias(arr) {
    const paquete = new Empaquetado();

    arr
    .sort((a,b) => a["REMITENTE"].localeCompare(b["REMITENTE"]))
    .forEach(d => paquete.addPago(d));
    
    paquete.init();

    const condition = checkShowNegativos.prop("checked") ? "NEGATIVO" : "POSITIVO";
    
    visor.children(".step-view").addClass("d-none");
    await paquete.chargeAll(condition);
    visor.children(".step-view").removeClass("d-none");

    const stepper = new Stepper(visor);
    stepper.init();
    visor.children(".step-view").click();

    /* El código anterior define un controlador de eventos para el evento `onAfterChange` de un objeto
    `stepper`. Cuando se activa el evento `onAfterChange`, el código actualiza la variable
    `paquete.actual` con el nuevo valor del paso. Luego recupera la información del usuario y del
    pago para el paso actual del objeto `paquete`. La información del usuario se almacena en la
    variable `paq` y la información de pago se almacena en la variable `pagoUser`. */
    stepper.onAfterChange = step => {
        paquete.actual = step;
        const paq = paquete.usuarios[paquete.actual];
        const pagoUser = paquete.pagosPorUsuario[paq]

        paquete.usuarioActivo = paq;
        console.log(paq, pagoUser);

        if(paq && !paq.analizado) paquete.analizarGuias(paq);
        const buttons = $(".next,.prev", visor);
        buttons.first().find("span").text(step);
        buttons.last().find("span").text(paquete.usuarios.length - step - 1);
        setTimeout(() => {
            buttons[0].scrollIntoView({
                behavior: "smooth"
            });
        }, 1000)
    }

    console.log(paquete);
}

/**
 * La función "handlerInformation" recupera datos de una instantánea de consulta y los devuelve como
 * una matriz.
 * @param querySnapshot - El parámetro querySnapshot es un objeto que representa el resultado de una
 * consulta. Contiene los documentos devueltos por la consulta y proporciona métodos para acceder a los
 * datos de cada documento.
 * @returns una matriz llamada "respuesta" que contiene los datos de cada documento en el
 * querySnapshot.
 */
function handlerInformation(querySnapshot) {
    const respuesta = [];
    querySnapshot.forEach(doc => {
        const data = doc.data();
        respuesta.push(data);
    });

    return respuesta;
}

/**
 * Se utiliza para eliminar una guía que no es necesaria pagar porque esté mal, o esté repetida o porque tenga un error ya solucionado,
 * pero que a su vez, genera un obstaculo para proceder con el pago
 * @param e - El parámetro "e" es un objeto de evento que representa el evento que activó la función.
 * Se usa comúnmente en los controladores de eventos para acceder a información sobre el evento, como
 * el elemento de destino que activó el evento.
 */
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
        
            Toast.fire("", "¡Guía " + numeroGuia + " Eliminada!", "success");
        }
    });
}

export {empaquetarGuias}