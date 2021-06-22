let datos_de_cotizacion,
    datos_a_enviar = new Object({});
    console.log(datos_usuario)
// Esta funcion verifica que los campos en el form esten llenados correctamente
async function cotizador(){
    let ciudadR = document.getElementById("ciudadR"),
    ciudadD = document.getElementById("ciudadD");
    let info_precio = new CalcularCostoDeEnvio();

    datos_de_cotizacion = {
        ciudadR: value("ciudadR"),
        ciudadD: value("ciudadD"), 
        peso: value("Kilos") < 3 ? 3 : value("Kilos"),
        seguro: value("seguro-mercancia"), 
        recaudo: 0, 
        trayecto: revisarTrayecto(), 
        tiempo: "2-3", 
        // precio: info_precio.costoEnvio,
        // flete: info_precio.flete,
        // comision_trasportadora: info_precio.sobreflete,
        // seguro_mercancia: info_precio.sobreflete_heka,
        ancho: value("dimension-ancho"), 
        largo: value("dimension-largo"), 
        alto: value("dimension-alto")
    }

    document.getElementById("cotizador").querySelectorAll("input").forEach(i => {
        i.addEventListener("input", (e) => {
            if(document.getElementById("result_cotizacion").style.display != "none"){
                document.getElementById("result_cotizacion").style.display = "none"
            }
        });
    })
    
    if(value("ciudadR") != "" && value('ciudadD') != "" &&
    value("Kilos") != "" && value("seguro-mercancia") != "" 
    && value("dimension-ancho") != "" && value("dimension-largo") != "" && value("dimension-alto") != ""){
        //Si todos los campos no estan vacios
        if(!ciudadR.dataset.ciudad || !ciudadD.dataset.ciudad) {
            alert("Recuerda ingresar una ciudad válida, selecciona entre el menú desplegable");
            verificador(["ciudadR", "CiudadD"], true); 
        } else if(value("Kilos") <= 0 || value("Kilos") > 25 ) {
            // Si la cantidad de kilos excede el limite permitido
            alert("Lo sentimos, la cantidad de kilos ingresada no está permitida, procure ingresar un valor mayor a 0 y menor o igual a 25")
            verificador("Kilos", true);
        } else if(value("seguro-mercancia") < 5000 || value("seguro-mercancia") > 300000000) {
            // Si el valor del recaudo excede el limite permitido
            alert("Ups! el valor declarado no puede ser menor a $5.000, ni mayor a $300.000.000")
            verificador("seguro-mercancia", true);
        } else if(value("dimension-ancho") < 1 || value("dimension-largo") < 1 || value("dimension-alto") < 1 ||
        value("dimension-ancho") > 150 || value("dimension-largo") > 150 || value("dimension-alto") > 150) {
            // Si el valor de las dimensiones exceden el limite permitido
            alert("Alguno de los valores ingresados en la dimensiones no es válido, Por favor verifique que no sean menor a 1cm, o mayor a 150cm");
            verificador(["dimension-alto", "dimension-largo", "dimension-ancho"], true)
        } else {
            //Si todo esta Correcto...
            verificador()

            
            if(revisarTrayecto() == "Urbano") {
                datos_de_cotizacion.tiempo = "1-2"
            } else if(revisarTrayecto() == "Especial"){
                datos_de_cotizacion.tiempo = "5-8"
            }
            let mostrador = document.getElementById("result_cotizacion");
            mostrador.style.display = "block"
            let respuesta = await response(datos_de_cotizacion);
            mostrador.innerHTML = respuesta;
            
            if(datos_de_cotizacion.recaudo < datos_de_cotizacion.precio) {
                alert("El costo del envío excede el valor declarado, para continuar, debe incrementar el valor declarado");
                document.getElementById("boton_continuar").disabled = true;
                verificador("seguro-mercancia", true);
            } else if(precios_personalizados.activar_saldo && datos_de_cotizacion.precio > precios_personalizados.saldo){
                let aviso = document.createElement("p")
                aviso.textContent = "No dispone de saldo suficiente para continuar con su transacción, si desea continuar, por favor comuniquese con nuestros asesores para mayor información"
                aviso.classList.add("text-danger");
                mostrador.insertBefore(aviso, document.getElementById("boton_continuar").parentNode);
                document.getElementById("boton_continuar").disabled = true;
                document.getElementById("boton_continuar").style.display = "none";
            }
            // ***** Agregando los datos que se van a enviar para crear guia ******* //
            datos_a_enviar.ciudadR = ciudadR.dataset.ciudad;
            datos_a_enviar.ciudadD = ciudadD.dataset.ciudad;
            datos_a_enviar.departamentoD = ciudadD.dataset.departamento;
            datos_a_enviar.departamentoR = ciudadR.dataset.departamento;
            datos_a_enviar.alto = value("dimension-alto");
            datos_a_enviar.ancho = value("dimension-ancho");
            datos_a_enviar.largo = value("dimension-largo");
            // datos_a_enviar.valor = 0;
            // datos_a_enviar.seguro = value("seguro-mercancia");
            datos_a_enviar.correoR = datos_usuario.correo || "notiene@gmail.com";
            datos_a_enviar.centro_de_costo = datos_usuario.centro_de_costo;
            // datos_a_enviar.peso = datos_de_cotizacion.peso;
            // datos_a_enviar.costo_envio = datos_de_cotizacion.precio;

            if(estado_prueba) datos_a_enviar.prueba = true;

            //Detalles del consto de Envío
            // datos_a_enviar.detalles = {
            //     peso_real: info_precio.kg,
            //     flete: info_precio.flete,
            //     comision_heka: info_precio.sobreflete_heka,
            //     comision_trasportadora: info_precio.sobreflete,
            //     peso_liquidar: info_precio.kgTomado,
            //     peso_con_volumen: info_precio.pesoVolumen,
            //     total: info_precio.costoEnvio,
            //     recaudo: 0,
            //     seguro: value("seguro-mercancia")
            // };
    
            $("#boton_continuar").click(() =>{
                let creador = document.getElementById("crear_guia");
                creador.innerHTML = "";
                creador.innerHTML = finalizarCotizacion(datos_de_cotizacion);
                location.href = "#crear_guia";
                scrollTo(0, 0);

                let informacion = document.getElementById("informacion-personal");
                document.getElementById("producto").addEventListener("blur", () => {
                    let normalmente_envia = false;
                    for(let product of datos_usuario.objetos_envio){
                        product = product.toLowerCase();
                        if(value("producto").trim().toLowerCase() == product){
                            normalmente_envia = true;
                        }
                    }
                    let aviso = document.getElementById("aviso-producto");
                    if(!normalmente_envia){
                        aviso.innerHTML = "No se registra en lo que normalmente envías: <b>\"" + datos_usuario.objetos_envio.join(", ") + "\".</b> \r si deseas continuar de todos modos, solo ignora este mensaje";
                        aviso.classList.remove("d-none");
                    }else {
                        aviso.classList.add("d-none")
                    }
                })

                console.log(informacion)
            })

            console.log(datos_de_cotizacion.tiempo)

            location.href = "#result_cotizacion"
        }
    }else{
        //si todos los campos estan vacios
        alert("Ups! ha habido un error inesperado, por favor, verifique que los campos no estén vacíos");
        verificador(["ciudadR", "ciudadD", "Kilos", "valor-a-recaudar", "dimension-alto", 
        "dimension-largo", "dimension-ancho"])
    }


}

async function pagoContraentrega() {
    let recaudo = await Swal.fire({
        title: '<strong>Valor de Recaudo</strong>',
        icon: 'info',
        html:`
            <p>Recuerde que el "valor Declarado" será sustituido por el valor de recaudo</p>
            <input type="number" id="valor-recaudo" class="form-control" placeholder="Ingrese monto"
            min="5000" max="2000000" require></input>
            <div class="form-group form-check mt-2">
                <input type="checkbox" class="form-check-input" id="sumar-envio-cotizador"></input>
                <label class="form-check-label" for="sumar-envio-cotizador">¿Desea sumar costo de envío?</label>
            </div>
            <div class="form-group form-check mt-2">
                <input type="checkbox" class="form-check-input" id="restar-saldo-cotizador"></input>
                <label class="form-check-label" for="restar-saldo-cotizador">¿Desea restar el costo del envío del saldo?</label>
            </div>
          `,
        confirmButtonText:
          'Continuar',
        buttonsStyling: false,
        customClass: {
            confirmButton: "btn btn-success"
        },
        confirmButtonAriaLabel: 'continuar',
        preConfirm: () => {
            if(!value("valor-recaudo")) {
                Swal.showValidationMessage(
                    `¡Recuerde ingresar un valor!`
                )
            } else if (value("valor-recaudo") < 5000 || value("valor-recaudo") > 2000000) {
                Swal.showValidationMessage("El valor no puede ser menor a $5.000 ni menor a $2.000.000")
            }
            return {
                recaudo: value("valor-recaudo"),
                sumar_envio: $("#sumar-envio-cotizador").prop("checked"),
                restar_saldo: $("#restar-saldo-cotizador").prop("checked")
            }
        }
    }).then(result => {
        return result.isConfirmed ? result : ""
    });

    return recaudo;
}
// pagoContraentrega();

// me devuelve el resultado de cada formulario al hacer una cotizacion
async function response(datos) {
    let result_cotizacion, act_btn_continuar = true;
    let type = await Swal.fire({
        title: '¿Desea habilitar pago contraentrega?',
        text: "Su destinatario será quien pagará el valor de su venta",
        icon: 'question',
        showCancelButton: true,
        confirmButtonClass: "bg-primary",
        confirmButtonText: 'Sí, lo necesito',
        cancelButtonText: "no, gracias"
    }).then((result) => {
        if(result.isConfirmed) {
            return "PAGO CONTRAENTREGA";
        } else if(result.dismiss === Swal.DismissReason.cancel) {
            return "CONVENCIONAL"
        } else {
            return ""
        }
    });

    if(!type) {
        return ""
    }if(type == "PAGO CONTRAENTREGA") {
        const tipo_pago_contraentrega = await pagoContraentrega();

        if(tipo_pago_contraentrega) {
            let recaudo = tipo_pago_contraentrega.value.recaudo;
            result_cotizacion = new CalcularCostoDeEnvio(parseInt(recaudo));
            if(tipo_pago_contraentrega.value.sumar_envio){
                result_cotizacion = sumarCostoDeEnvio(parseInt(recaudo))
            }

            if(tipo_pago_contraentrega.value.restar_saldo) {
                datos_a_enviar.debe = false;
            } else {
                datos_a_enviar.debe = -result_cotizacion.costoEnvio
            }

            if (result_cotizacion.seguro < result_cotizacion.costoEnvio) {
                act_btn_continuar = false;
                Swal.fire({
                    position: "top-end",
                    icon: 'error',
                    title: 'El valor de recaudo no debe ser menor que el costo del envío',
                    showConfirmButton: false,
                    timer: 5000
                })
                  
            }
        } else {
            return ""
        }
    } else {
        result_cotizacion = new CalcularCostoDeEnvio(value("seguro-mercancia"), type);
        datos_a_enviar.debe = false;
    }

    datos_a_enviar.peso = Math.max(3, result_cotizacion.kg);
    datos_a_enviar.costo_envio = result_cotizacion.costoEnvio;
    datos_a_enviar.valor = result_cotizacion.valor;
    datos_a_enviar.seguro = result_cotizacion.seguro;
    datos_a_enviar.type = type;

    datos_de_cotizacion.peso = Math.max(3, result_cotizacion.kg);
    datos_de_cotizacion.costo_envio = result_cotizacion.costoEnvio;
    datos_de_cotizacion.valor = result_cotizacion.valor;
    datos_de_cotizacion.seguro = result_cotizacion.seguro;
    datos_de_cotizacion.type = type;

    //Detalles del costo de Envío
    datos_a_enviar.detalles = result_cotizacion.getDetails;
    console.log(datos_a_enviar);


    let c_destino = document.getElementById('ciudadD').dataset;
    let div_principal = document.createElement("DIV"),
        crearNodo = str => new DOMParser().parseFromString(str, "text/html").body,
        boton_regresar = crearNodo(`<a class="btn btn-outline-primary mb-2" href="#cotizar_envio" onclick="regresar()">
            Subir
            </a>`),
        divisor = crearNodo(`<hr class="sidebar-divider">`),
        info_principal = detalles_cotizacion(datos_de_cotizacion),
        servientrega = crearNodo(`<div class="card card-shadow m-6">
            <div class="card-header py-3 bg-primary">
                <div class="d-flex justify-content-center"><img style="max-width: 300px" class="w-100" src="img/servientrega-logotipo.png"/></div>
            </div>
            <div class="card-body row">
                <div class="col mb-3">
                    <h5>Tipo de Trayecto: <span>${datos.trayecto}</span></h5>
                    <h5>Tiempo de trayecto: <span>${datos.tiempo} días</span></h5>
                    <h5>Los envíos a ${c_destino.ciudad} frecuentan los días: <span class="text-primary text-capitalize">${c_destino.frecuencia.toLowerCase()}</span></h5>
                    <h5>Los envíos a ${c_destino.ciudad} disponen de: <span class="text-primary text-capitalize">${c_destino.tipo_distribucion.toLowerCase()}</span></h5>
                    <h5 class="mt-3 text-danger">En caso de devolución pagas solo el envío ida: $${convertirMiles(result_cotizacion.costoEnvio)}</h5>
                </div>
                <div class="col-12 col-md-7 mb-3 mb-sm-0">
                    <ul class="list-group">
                        <li class="list-group-item d-flex justify-content-between align-items-center">
                        Valor flete
                        <span class="badge badge-secondary badge-pill">$${convertirMiles(result_cotizacion.flete)}</span>
                        </li>
                        <li class="list-group-item d-flex justify-content-between align-items-center">
                        Comisión Transportadora
                        <span class="badge badge-secondary badge-pill">$${convertirMiles(result_cotizacion.sobreflete)}</span>
                        </li>
                        <li class="list-group-item d-flex justify-content-between align-items-center">
                        Seguro Mercancía
                        <span class="badge badge-secondary badge-pill">$${convertirMiles(result_cotizacion.sobreflete_heka)}</span>
                        </li>
                        <li class="list-group-item d-flex justify-content-between align-items-center">
                        Costo Total de Envío
                        <span class="badge badge-primary badge-pill text-lg">$${convertirMiles(result_cotizacion.costoEnvio)}</span>
                        </li>
                    </ul>
                    </div>
                
            </div>
        </div>`),
        boton_continuar = crearNodo(`<div class="d-flex justify-content-end mt-2"><input type="button" id="boton_continuar" 
            class="btn btn-success mt-3" value="Continuar" ${!act_btn_continuar ? "disabled=true" : ""}></div>`);
        
    console.log(!datos_a_enviar.debe, !precios_personalizados.actv_credit);
    if(!datos_a_enviar.debe && !precios_personalizados.actv_credit &&
        datos_a_enviar.costo_envio > precios_personalizados.saldo) {
            boton_continuar = crearNodo(`<div class="d-flex justify-content-center text-danger mt-3">
                <p>Lo sentimos, en este momento, el costo de envío excede el saldo
                que tienes actualmente, por lo tanto este metodo de envío no estará 
                permitido hasta que recargues tu saldo.</p>
                <p>Puedes comunicarte con la asesoría logística para conocer los pasos
                a seguir para recargar tu saldo.</p>
            </div>`)
    }

    div_principal.append(divisor, boton_regresar, info_principal, servientrega, boton_continuar)
    if(document.getElementById("cotizar_envio").getAttribute("data-index")){
       boton_continuar.firstChild.firstChild.style.display = "none";
       console.log("EStoy en el index");
    }
    
    return  div_principal.innerHTML
};

function detalles_cotizacion(datos) {
    return new DOMParser().parseFromString(`
        <div class="mb-4">
            <div class="card-header py-3">
                <h4 class="m-0 font-weight-bold text-primary text-center">Datos de envío (${datos.type})</h4>
            </div>
            <div class="card-body row">
                <div class="col-sm-6 mb-3 mb-sm-2">
                    <h5>Ciudad de Origen</h5>
                    <input readonly="readonly" type="text" class="form-control form-control-user" value="${datos.ciudadR}" required="">  
                </div>
                <div class="col-sm-6 mb-3 mb-sm-2">
                    <h5>Ciudad de Destino</h5>
                    <input readonly="readonly" type="text" class="form-control form-control-user" value="${datos.ciudadD}" required="">  
                </div>
                <div class="col-sm-6 mb-3 mb-sm-2">
                    <h5>Kilos</h5>
                    <input readonly="readonly" type="text" class="form-control form-control-user" value="${datos.peso} Kg" required="">  
                </div>
                <div class="col-sm-6 mb-3 mb-sm-2">
                    <h5>Valor declarado</h5>
                    <input readonly="readonly" type="text" class="form-control form-control-user" value="$${convertirMiles(datos.seguro)}" required="">  
                </div>
                <div class="col-sm-12 mb-3 mb-sm-2 ${!datos.valor ? "d-none" : ""}">
                    <h5>Recaudo (valor a cobrar al remitente)</h5>
                    <input readonly="readonly" type="text" class="form-control form-control-user" value="$${convertirMiles(datos.valor)}" required="">  
                </div>
                
                <div class="col">
                    <h5 class="mb-2 mt-3 text-center">Dimensiones <span>(Expresadas en Centímetros)</span></h5>
                    <div class="row d-flex justify-content-center">
                        <div class="col-sm-4 mt-2 d-flex align-items-center">
                            <h6>Ancho:  </h6>
                            <input readonly="readonly type="text" class="form-control form-control-user ml-2" value="${datos.ancho} Cm">
                        </div>
                        <div class="col-sm-4 mt-2 d-flex align-items-center">
                            <h6>Largo:  </h6>
                            <input readonly="readonly type="text" class="form-control form-control-user ml-2" value="${datos.largo} Cm">
                        </div>
                        <div class="col-sm-4 mt-2 d-flex align-items-center">
                            <h6>Alto:  </h6>
                            <input readonly="readonly type="text" class="form-control form-control-user ml-2" value="${datos.alto} Cm">
                        </div>
                    </div>
                </div>
                <p class="${datos.type == "CONVENCIONAL" ? "d-none" : "col-12 text-center mt-2"}">
                El Valor consignado a tu cuenta será: $${convertirMiles(datos.valor - datos.costo_envio)}</p>
            </div>
        </div>
        `, "text/html").body;
}

function finalizarCotizacion(datos) {
    let div_principal = document.createElement("DIV"),
        crearNodo = str => new DOMParser().parseFromString(str, "text/html").body;

    let detalles = detalles_cotizacion(datos),
        boton_regresar = crearNodo(`<a class="btn btn-outline-primary btn-block mb-2" href="#cotizar_envio" onclick="regresar()">
            Regresar
            </a>`),
        input_producto = crearNodo(`<div class="col mb-3 mb-sm-0">
            <h6>producto <span>(Lo que se va a enviar)</span></h6>
            <input id="producto" class="form-control form-control-user" name="producto" type="text" placeholder="Introduce el contenido de tu envío">
            <p id="aviso-producto" class="text-danger d-none m-2"></p>
        </div>`),
        datos_remitente = crearNodo(`
        <div class="card card-shadow m-6 mt-5" id="informacion-personal">
            <div class="card-header py-3">
                <h4 class="m-0 font-weight-bold text-primary text-center">Datos de ${datos_usuario.nombre_completo}</h4>
            </div>
            <div class="card-body row">
                <div class="col-sm-6 mb-3 mb-sm-0">
                    <h5>Nombre del Remitente</h5>
                    <input id="actualizar_nombreR" type="text" class="form-control form-control-user" value="${datos_usuario.nombre_completo}" required="">  
                </div>
                <div class="col-sm-6 mb-3 mb-sm-0">
                    <h5>Dirección del Remitente</h5>
                    <input id="actualizar_direccionR" type="text" class="form-control form-control-user" value="${datos_usuario.direccion}" required="">  
                </div>
                <div class="col-sm-6 mb-3 mb-sm-0">
                    <h5>Celular del remitente</h5>
                    <input id="actualizar_celularR"  type="text" class="form-control form-control-user" value="${datos_usuario.celular}" required="">  
                </div>
            </div>
        </div>
        `),
        datos_destinatario = crearNodo(`
        <div class="card card-shadow m-6 mt-5">
            <div class="card-header py-3">
                <h4 class="m-0 font-weight-bold text-primary text-center">Datos del Destinatario</h4>
            </div>
            <form id="datos-destinatario">
                <div class="card-body row">
                    <div class="col-lg-6 mb-3 mb-2">
                        <h5>Nombre del Destinatario</h5>
                        <input type="text" name="nombreD" id="nombreD" class="form-control form-control-user" value="" placeholder="Nombre" required="">
                    </div>
                    <div class="col-lg-6 mb-3 mb-2">
                        <div class="row align-items-center">
                            <div class="col-sm-8 mb-2">
                                <label for="identificacionD">Documento de identificación</label>
                                <input type="number" id="identificacionD" class="form-control form-control-user" value="" placeholder="ej. 123456789" required="">
                            </div>
                            <div class="col mb-2">
                                <label for="tipo-doc-dest" class="col-form-label">Tipo De Documento</label>
                                <select class="custom-select" form="datos-destinatario" id="tipo-doc-dest">
                                    <option value="2">Seleccione</option>
                                    <option value="1">NIT</option>
                                    <option value="2">CC</option>
                                </select>
                            </div>
                        
                        </div>
                    </div>
                    <div class="col-sm-6 mb-3 mb-2">
                        <h5>Dirección del Destinatario</h5>
                        <input type="text" id="direccionD" class="form-control form-control-user" value="" placeholder="Dirección-Conjunto-Apartemento" required="">
                    </div>
                    <div class="col-sm-6 mb-3 mb-2">
                        <h5>Barrio del Destinatario</h5>
                        <input type="text" id="barrioD" class="form-control form-control-user" value="" placeholder="Barrio" required="">
                    </div>
                    <div class="col-sm-6 mb-3 mb-2">
                        <h5>Celular del Destinatario</h5>
                        <input type="tel" id="telefonoD" class="form-control form-control-user" value="" placeholder="Celular" required="">
                    </div>
                    <div class="col-sm-6 mb-3 mb-2">
                        <h5>Otro celular del Destinatario</h5>
                        <input type="tel" id="celularD" class="form-control form-control-user" value="" placeholder="celular">
                    </div>
                    <div class="col-sm-6 mb-3 mb-2">
                        <h5>Email</h5>
                        <input type="email" id="correoD" class="form-control form-control-user" value="" placeholder="nombre@ejemplo.com">
                    </div>
                    <div class="col-sm-6 mb-3 mb-2">
                        <h5>Observaciones Adicionales</h5>
                        <input type="text" id="observaciones" class="form-control form-control-user" value="" placeholder="Observaciones Adicionales">
                    </div>
                    <div class="col-sm-6 mb-3 mb-2 form-check">
                        <input type="checkbox" id="recoleccion" class="form-check-input">
                        <label for="recoleccion" class="form-check-label">Solicitud de Recolección</label>
                    </div>
                </div>
            </form>
        </div>
        `),
        boton_crear = crearNodo(`<input type="button" id="boton_final_cotizador" 
            class="btn btn-success btn-block mt-5" value="Crear Guía" onclick="crearGuiasServientrega()"/>`);

    div_principal.append(boton_regresar, detalles, input_producto, datos_remitente, datos_destinatario, boton_crear);
    return div_principal.innerHTML;
}

function regresar() {
    document.getElementById("result_cotizacion").style.display = "none";
    location.href = "#cotizar_envio"
}

// Verifica que el trayecto sea especial, nacional, o urbano
function revisarTrayecto(){
    let c_origen = document.getElementById('ciudadR').dataset;
    let c_destino = document.getElementById('ciudadD').dataset;
    if(c_destino.tipo_trayecto == "TRAYECTO ESPECIAL"){
        return "Especial";
    } else {
        if(c_destino.id == c_origen.id) {
            return "Urbano";
        } else if(c_destino.departamento == c_origen.departamento) {
            return "Zonal";
        } else {
            return "Nacional";
        }
    }
}

function sumarCostoDeEnvio(valor, type, kg, volumen) {
    let constructor = new CalcularCostoDeEnvio(valor, type, kg, volumen);
    // a = new CalcularCostoDeEnvio(a.costoEnvio + rec);
    // console.log(a.valor - a.costoEnvio);
    let counter = 0
    while(valor > constructor.valor - constructor.costoEnvio) {
        counter ++;
        console.log("\n *** Estamos en bucle fase " + counter)
        constructor.getDetails;
        constructor = new CalcularCostoDeEnvio(valor + constructor.costoEnvio, type, kg, volumen);
    }

    return constructor
};

// Realiza el calculo del envio y me devuelve sus detalles
class CalcularCostoDeEnvio {
    constructor(valor, type, kilos, vol){
        this.type = type;
        this.valor = type == "CONVENCIONAL" ? 0 : valor;
        this.seguro = valor;
        this.kg = kilos || Math.floor(value("Kilos"));
        this.volumen = vol || value("dimension-ancho") * value("dimension-alto") * value("dimension-largo");
        this.factor_de_conversion = 0.022;
        this.comision_servi = type == "CONVENCIONAL" ? 1 : precios_personalizados.comision_servi;
        this.sobreflete_min = type == "CONVENCIONAL" ? 350 : 3000;
        this.sobreflete = Math.ceil(Math.max(valor * this.comision_servi / 100, this.sobreflete_min));
        this.sobreflete_heka = Math.ceil(valor * precios_personalizados.comision_heka / 100);
    }

    get pesoVolumen(){
        let peso_con_volumen = this.volumen * this.factor_de_conversion / 100;
        peso_con_volumen = Math.ceil(Math.floor(peso_con_volumen * 10) / 10);

        return peso_con_volumen
    }
    
    get kgTomado(){
        if(this.kg < 3){
            this.kg = 3;
        }

        this.kg = Math.max(this.pesoVolumen, this.kg)

        return this.kg;    
    } 
    
    get flete(){
        this.kgTomado;
        let total = this.revisadorInterno(precios_personalizados.costo_especial2,
            precios_personalizados.costo_nacional2, precios_personalizados.costo_zonal2);
        if(this.kg >= 1 && this.kg < 4){
            total = this.revisadorInterno(precios_personalizados.costo_especial1, 
                precios_personalizados.costo_nacional1, precios_personalizados.costo_zonal1)
        } else if (this.kg >= 4 && this.kg < 9) {

        } else {
            let kg_adicional = this.kg - 8;
            total += (kg_adicional * this.revisadorInterno(precios_personalizados.costo_especial3, 
                precios_personalizados.costo_nacional3, precios_personalizados.costo_zonal3))
        }
        return total;
    }

    get costoEnvio(){
        let resultado = this.flete + this.sobreflete + this.sobreflete_heka;
        return resultado;
    }
    
    get getDetails() {
        console.groupCollapsed("Detalles de Cotización")
        console.log("Valor ingresado =>", this.seguro);
        console.log("Kg => ", this.kgTomado);
        console.log("Volumen => ", this.volumen);
        console.log("comision Servientrega => ", this.sobreflete);
        console.log("Comision heka => ", this.sobreflete_heka);
        console.log("Flete => ", this.flete);
        console.log("Costo de envío =>", this.costoEnvio);
        console.groupEnd();
        return {
            peso_real: this.kg,
            flete: this.flete,
            comision_heka: this.sobreflete_heka,
            comision_trasportadora: this.sobreflete,
            peso_liquidar: this.kgTomado,
            peso_con_volumen: this.pesoVolumen,
            total: this.costoEnvio,
            recaudo: this.valor,
            seguro: this.seguro
        };
    }

    revisadorInterno(especial, nacional, urbano){
        switch(revisarTrayecto()){
            case "Especial":
                return especial;
                break;
            case "Nacional":
                return nacional;
                break;
            default:
                return urbano;
                break;
        }
    }
}

// Para enviar la guia generada a firestore
function crearGuiasServientrega() {
    if(value("nombreD") != "" && value("direccionD") != "" && value("barrioD") != "" && 
    value("telefonoD") != ""){
        let recoleccion = 0
        if(document.getElementById("recoleccion").checked){
            recoleccion = 1;
        }

        if(value("producto") == ""){
            alert("Recuerde llenar también lo que contine su envío");
            scrollTo({
                top: document.getElementById("producto").parentNode.offsetTop - 60,
                left: document.getElementById("producto").parentNode.offsetLeft,
                behavior: "smooth"
            })
        } else if (!/(.)*@(.)*\.(.)/.test(value("correoD")) && value("correoD")){
            //Recordar que existe una funcion llamada "validar_email(email)" que es mas especifica.
            alert("Lo sentimos, verifique por favor que la dirección de correo sea valida")
        } else if (value("telefonoD").length != 10) {
            alert("Por favor verifique que el celular esta escrito correctamente (debe contener 10 digitos)")
        } else if(!datos_usuario.centro_de_costo) {
            avisar("¡Error al generar Guía!", "Póngase en Contacto con nosotros para asignarle un centro de costo", "advertencia");
        } else {
            Swal.fire({
                title: "Creando Guía",
                text: "Por favor espere mientras le generamos su nueva Guía",
                didOpen: () => {
                    Swal.showLoading();
                },
                allowOutsideClick: false,
                allowEnterKey: false,
                showConfirmButton: false,
                allowEscapeKey: true
            })
            let fecha = new Date(), mes = fecha.getMonth() + 1, dia = fecha.getDate();
            if(dia < 10){
                dia = "0" + dia;
            }
            if(mes < 10) {
                mes = "0" + mes;
            }

            let user_debe;
            precios_personalizados.saldo <= 0 ? user_debe = datos_a_enviar.costo_envio
            : user_debe = - precios_personalizados.saldo + datos_a_enviar.costo_envio;

            if(user_debe > 0) datos_a_enviar.user_debe = user_debe;
            
            datos_a_enviar.nombreR = value("actualizar_nombreR")
            datos_a_enviar.direccionR = value("actualizar_direccionR")
            datos_a_enviar.celularR = value("actualizar_celularR")
            datos_a_enviar.nombreD = value("nombreD");
            datos_a_enviar.identificacionD = value("identificacionD") || 123;
            datos_a_enviar.direccionD = value("direccionD") + " " + value("barrioD") + " " + value("observaciones");
            datos_a_enviar.telefonoD = value("telefonoD");
            datos_a_enviar.celularD = value("celularD") || value("telefonoD");
            datos_a_enviar.correoD = value("correoD") || "notiene@gmail.com";
            datos_a_enviar.tipo_doc_dest = value("tipo-doc-dest");
            datos_a_enviar.dice_contener = value("producto");
            datos_a_enviar.observaciones = value("observaciones");
            datos_a_enviar.recoleccion_esporadica = recoleccion;
            datos_a_enviar.fecha = `${fecha.getFullYear()}-${mes}-${dia}`;
            datos_a_enviar.timeline = new Date().getTime();
            datos_a_enviar.id_user = user_id;
            

            boton_final_cotizador = document.getElementById("boton_final_cotizador")
            boton_final_cotizador.classList.add("disabled");

            let cargador = document.createElement("div");
            cargador.classList.add("d-flex", "justify-content-center");
            cargador.innerHTML = "<div class='lds-ellipsis'><div></div><div></div><div></div><div></div></div>";
            cargador.setAttribute("id", "respuesta-crear_guia");
            boton_final_cotizador.parentNode.insertBefore(cargador, boton_final_cotizador);
            boton_final_cotizador.remove()

            console.log(datos_a_enviar)
            enviar_firestore(datos_a_enviar);
        }
    } else {
        alert("Por favor, verifique que los campos escenciales no estén vacíos");
        verificador(["producto", "nombreD", "direccionD", "barrioD", "telefonoD"]);
    }
}

//función que envía los datos tomados a servientrega
function enviar_firestore(datos){
    //tome los últimos 4 digitos del documento para crear el id
    let id_heka = datos_usuario.numero_documento.slice(-4);
    let firestore = firebase.firestore()

    //Reviso por donde va el identificador heka
    firestore.collection("infoHeka").doc("heka_id").get()
        .then(async (doc) => {
            // return doc.data().id;
            if(doc.exists){
                id_heka += doc.data().id.toString();

                //lo guardo en una varible
                datos.id_heka = id_heka;
                console.log(datos);

                //Creo la referencia para la nueva guía generada con su respectivo id
                let referenciaNuevaGuia = firestore.collection("usuarios").doc(localStorage.user_id)
                .collection("guias").doc(id_heka);
                firestore.collection("infoHeka").doc("heka_id").update({id: doc.data().id + 1});
                if(generacion_automatizada) {
                    //Para cuando el usuario tenga activa la creación deguías automáticas.
                    //Primero consulto la respuesta del web service
                    let respuesta = await generarGuiaServientrega(datos)
                        .then(async (resGuia) => {
                            //le midifico los datos de respuesta al que será enviado a firebase
                            datos.numeroGuia = resGuia.numeroGuia;
                            datos.id_archivoCargar = resGuia.id_archivoCargar;
                            //y creo el documento de firebase
                            if(resGuia.numeroGuia) {
                                let guia = await referenciaNuevaGuia.set(datos)
                                .then(doc => {
                                    return resGuia;
                                })
                                .catch(err => {
                                    console.log("Hubo un error al crear la guía con firebase => ", err);
                                    return {numeroGuia: "0"}
                                })
                                console.log(guia);
                                return guia;
                            }
                        })
                        console.log(respuesta);
                    
                    if(respuesta.numeroGuia != "0") {
                        return doc.data().id;
                    } else {
                        throw new Error("No se pudo generar el número de guía, por favor intente nuevamente");
                    }
                } else {
                    //Para cuendo el usurio tenga la opcion de creacion de guias automática desactivada.

                    //Creo la guía para que administracion le cree los documentos al usuario
                    let id = await referenciaNuevaGuia.set(datos).then(() => {
                        return doc.data().id;
                    })
                    .catch(() => {
                        throw new Error("no pudimos guardar la información de su guía, por falla en la conexión, por favor intente nuevamente");
                    })

                    return id;
                }
            }
        })
        .then((id) => {
            firestore.collection("usuarios").doc(localStorage.user_id).collection("informacion")
            .doc("heka").get()
            .then((doc) => {
                if(doc.exists){
                    let momento = new Date().getTime();
                    let saldo = doc.data().saldo;
                    let saldo_detallado = {
                        saldo: saldo,
                        saldo_anterior: saldo,
                        limit_credit: doc.data().limit_credit || 0,
                        actv_credit: doc.data().actv_credit || false,
                        fecha: genFecha(),
                        diferencia: 0,
                        mensaje: "Guía " + id + " creada exitósamente",
                        momento: momento,
                        user_id: localStorage.user_id,
                        guia: id,
                        medio: "Usuario: " + datos_usuario.nombre_completo + ", Id: " + localStorage.user_id
                    }

                    if(!datos.debe){
                        saldo_detallado.saldo = saldo - datos.costo_envio;
                        saldo_detallado.diferencia = saldo_detallado.saldo - saldo_detallado.saldo_anterior;
                        let factor_diferencial = parseInt(doc.data().limit_credit) + parseInt(saldo);
                        console.log(saldo_detallado);

                        if(factor_diferencial <= datos.costo_envio && factor_diferencial > 0) {
                            notificarExcesoDeGasto();
                        }
                        actualizarSaldo(saldo_detallado);
                    }
                    return saldo_detallado;
                }
            })
        })
        .then(() => {
            Swal.fire({
                icon: "success",
                title: "¡Guía creada con éxito!",
                text: "¿Desea crear otra guía?",
                timer: 6000,
                showCancelButton: true,
                confirmButtonText: "Si, ir al cotizador.",
                cancelButtonText: "No, ver el historial."

            }).then((res) => {
                if(res.isConfirmed) {
                    location.href = "plataforma2.html";
                } else {
                    location.href = "#historial_guias";
                    cambiarFecha();
                }
            })
        })
        .catch((err)=> {
            Swal.fire({
                icon: "error",
                text: "Hubo un error al crear la guía",
                timer: 3000
            }).then(() => {
                console.log("revisa que paso, algo salio mal => ", err);
                avisar("¡Lo sentimos! Error inesperado", err.message);
            })
        })
}

function notificarExcesoDeGasto() {
    enviarNotificacion({
        mensaje: `El usuario ${datos_usuario.nombre_completo} acaba de exceder el límite de Gastos asignado.`,
        detalles: ["Su límite de gastos es de " + precios_personalizados.limit_credit,
        "Tenía un saldo de: " + precios_personalizados.saldo,
        "Sumando el envío realizado: " + (precios_personalizados.saldo - datos_a_enviar.costo_envio)],
        icon: ["dollar-sign", "warning"],
        visible_user: true,
        user_id,
        href: "usuarios"
    })
}

// setTimeout(notificarExcesoDeGasto, 5000);

async function generarGuiaServientrega(datos) {
    let res = await fetch("/servientrega/crearGuia", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(datos)
    })
    .then(res => res.json())
    .then(data => {
        let parser = new DOMParser();
        data = parser.parseFromString(data, "application/xml");
        console.log(data);
        console.log("se recibió respuesta");
        let retorno = {
            numeroGuia: data.querySelector("Num_Guia").textContent,
            nombreD: data.querySelector("Nom_Contacto").textContent,
            ciudadD: data.querySelector("Des_Ciudad").textContent,
            id_archivoCargar: data.querySelector("Id_ArchivoCargar").textContent,
            prueba: datos.centro_de_costo == "SellerNuevo" ? true : false
        }
        return retorno;
    })
    .catch(err => console.log("Hubo un error: ", err))

    return res;
}

function convertirMiles(n){
    let entero = Math.floor(n);
    let number_inv = entero.toString().split("").reverse();
    let response = []
    for(let i = 0; i < number_inv.length; i++){
        response.push(number_inv[i]);
        if((i+1) % 3 == 0){
        if(i+1 != number_inv.length){
            response.push(".")
        }   
        }
    }  
    return response.reverse().join("");
};
