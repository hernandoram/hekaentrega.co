let datos_de_cotizacion,
    datos_a_enviar = new Object({});
    console.log(datos_usuario)
// Esta funcion verifica que los campos en el form esten llenados correctamente
function cotizador(){
    let ciudadR = document.getElementById("ciudadR"),
    ciudadD = document.getElementById("ciudadD");
    let info_precio = new CalcularCostoDeEnvio();

    datos_de_cotizacion = {
        tipo: "CONTRAENTREGA",
        ciudadR: value("ciudadR"),
        ciudadD: value("ciudadD"), 
        peso: value("Kilos") < 3 ? 3 : value("Kilos"),
        seguro: value("valor-a-recaudar"), 
        recaudo: value("valor-a-recaudar"), 
        trayecto: revisarTrayecto(), 
        tiempo: "2-3", 
        precio: info_precio.costoEnvio,
        flete: info_precio.flete,
        comision_trasportadora: info_precio.sobreflete,
        seguro_mercancia: info_precio.sobreflete_heka,
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
    value("Kilos") != "" && value("valor-a-recaudar") != "" 
    && value("dimension-ancho") != "" && value("dimension-largo") != "" && value("dimension-alto") != ""){
        //Si todos los campos no estan vacios
        if(!ciudadR.dataset.ciudad || !ciudadD.dataset.ciudad) {
            alert("Recuerda ingresar una ciudad válida, selecciona entre el menú desplegable");
            verificador(["ciudadR", "CiudadD"], true); 
        } else if(value("Kilos") <= 0 || value("Kilos") > 25 ) {
            // Si la cantidad de kilos excede el limite permitido
            alert("Lo sentimos, la cantidad de kilos ingresada no está permitida, procure ingresar un valor mayor a 0 y menor o igual a 25")
            verificador("Kilos", true);
        } else if(value("valor-a-recaudar") < 5000 || value("valor-a-recaudar") > 2000000) {
            // Si el valor del recaudo excede el limite permitido
            alert("Ups! el valor a recaudar no puede ser menor a $5.000, ni mayor a $2.000.000")
            verificador("valor-a-recaudar", true);
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
            mostrador.innerHTML = response(datos_de_cotizacion);
            
            if(datos_de_cotizacion.recaudo < datos_de_cotizacion.precio) {
                alert("El costo del envío excede el valor de recaudo, para continuar, debe incrementar el valor a recaudar");
                document.getElementById("boton_continuar").disabled = true;
                verificador("valor-a-recaudar", true);
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
            datos_a_enviar.peso = datos_de_cotizacion.peso;
            datos_a_enviar.valor = value("valor-a-recaudar");
            datos_a_enviar.costo_envio = datos_de_cotizacion.precio;
            datos_a_enviar.correoR = datos_usuario.correo || "notiene@gmail.com";
            datos_a_enviar.centro_de_costo = datos_usuario.centro_de_costo;

            //Detalles del consto de Envío
            datos_a_enviar.detalles = {
                peso_real: info_precio.kg,
                flete: info_precio.flete,
                comision_heka: info_precio.sobreflete_heka,
                comision_trasportadora: info_precio.sobreflete,
                peso_liquidar: info_precio.kgTomado,
                peso_con_volumen: info_precio.pesoVolumen,
                total: info_precio.costoEnvio,
                recaudo: value("valor-a-recaudar"),
                seguro: value("valor-a-recaudar")
            }
            console.log(datos_a_enviar)
    
            document.getElementById("boton_continuar").addEventListener("click", () =>{
                let creador = document.getElementById("crear_guia");
                creador.innerHTML = "";
                creador.innerHTML = response(datos_de_cotizacion, true);
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

// me devuelve el resultado de cada formulario al hacer una cotizacion
function response(datos, tipo) {
    let c_destino = document.getElementById('ciudadD').dataset;
    let div_principal = document.createElement("DIV"),
        crearNodo = str => new DOMParser().parseFromString(str, "text/html").body,
        boton_regresar = crearNodo(`<a class="btn btn-outline-primary mb-2" href="#cotizar_envio" onclick="regresar()">
            Subir
            </a>`),
        divisor = crearNodo(`<hr class="sidebar-divider">`),
        info_principal = crearNodo(`
        <div class="mb-4">
            <div class="card-header py-3">
                <h4 class="m-0 font-weight-bold text-primary text-center">Datos de envío (${datos.tipo})</h4>
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
                    <h5>Recaudo</h5>
                    <input readonly="readonly" type="text" class="form-control form-control-user" value="$${convertirMiles(datos.recaudo)}" required="">  
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
            </div>
        </div>
        `),
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
                    <h5 class="mt-3 text-danger">En caso de devolución pagas solo el envío ida: $${convertirMiles(datos.precio)}</h5>
                </div>
                <div class="col-12 col-md-7 mb-3 mb-sm-0">
                    <ul class="list-group">
                        <li class="list-group-item d-flex justify-content-between align-items-center">
                        Valor flete
                        <span class="badge badge-secondary badge-pill">$${convertirMiles(datos.flete)}</span>
                        </li>
                        <li class="list-group-item d-flex justify-content-between align-items-center">
                        Comisión Transportadora
                        <span class="badge badge-secondary badge-pill">$${convertirMiles(datos.comision_trasportadora)}</span>
                        </li>
                        <li class="list-group-item d-flex justify-content-between align-items-center">
                        Seguro Mercancía
                        <span class="badge badge-secondary badge-pill">$${convertirMiles(datos.seguro_mercancia)}</span>
                        </li>
                        <li class="list-group-item d-flex justify-content-between align-items-center">
                        Costo Total de Envío
                        <span class="badge badge-primary badge-pill text-lg">$${convertirMiles(datos.precio)}</span>
                        </li>
                    </ul>
                    </div>
                
            </div>
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
        boton_continuar = crearNodo(`<div class="d-flex justify-content-end"><input type="button" id="boton_continuar" 
            class="btn btn-success mt-3" value="Continuar"/></div>`),
        boton_crear = crearNodo(`<input type="button" id="boton_final_cotizador" 
            class="btn btn-success btn-block mt-5" value="Crear Guía" onclick="crearGuiasServientrega()"/>`),
        input_producto = crearNodo(`<div class="col mb-3 mb-sm-0">
            <h6>producto <span>(Lo que se va a enviar)</span></h6>
            <input id="producto" class="form-control form-control-user" name="producto" type="text" placeholder="Introduce el contenido de tu envío">
            <p id="aviso-producto" class="text-danger d-none m-2"></p>
        </div>`);

    div_principal.append(divisor, boton_regresar, info_principal, servientrega, boton_continuar)
    if(document.getElementById("cotizar_envio").getAttribute("data-index")){
       boton_continuar.firstChild.firstChild.style.display = "none";
       console.log("EStoy en el index");
    }
    boton_crear.firstChild.style.display = "none";
    
    if(tipo) {
        divisor.remove();
        boton_regresar.firstChild.textContent = "Regresar";
        boton_continuar.firstChild.style.display = "none";
        boton_continuar.firstChild.classList.remove("d-flex")
        boton_crear.firstChild.style.display = "block";
        servientrega.remove();
        info_principal.firstChild.appendChild(input_producto)
        div_principal.append(datos_remitente, datos_destinatario);
        div_principal.appendChild(boton_crear)
    }


    return  div_principal.innerHTML
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

//Esta función está parcialmente eliminada, será sustituidad por la clase CalcularCostoDeEnvio
function calcularCostoDeEnvio(kilos, vol) {
    let kg = kilos || Math.floor(value("Kilos")), 
        volumen = vol || value("dimension-ancho") * value("dimension-alto") * value("dimension-largo"),
        factor_de_conversion = 0.022,
        sobreflete = Math.ceil(Math.max(value("valor-a-recaudar") * precios_personalizados.comision_servi / 100, 3000)),
        sobreflete_heka = Math.ceil(value("valor-a-recaudar") * precios_personalizados.comision_heka / 100),
        total  = revisadorInterno(precios_personalizados.costo_especial2, 
            precios_personalizados.costo_nacional2, precios_personalizados.costo_zonal2);

    if(kg < 3){
        kg = 3;
    }

    let peso_con_volumen = volumen * factor_de_conversion / 100;
    peso_con_volumen = Math.ceil(Math.floor(peso_con_volumen * 10) / 10);

    kg = Math.max(peso_con_volumen, kg)
    
    if(kg >= 1 && kg < 4){
        total = revisadorInterno(precios_personalizados.costo_especial1, 
            precios_personalizados.costo_nacional1, precios_personalizados.costo_zonal1)
    } else if (kg >= 4 && kg < 9) {
        
    } else {
        let kg_adicional = kg - 8;
        total += (kg_adicional * revisadorInterno(precios_personalizados.costo_especial3, 
            precios_personalizados.costo_nacional3, precios_personalizados.costo_zonal3))
    }

    function revisadorInterno(especial, nacional, urbano){
        switch(revisarTrayecto()){
            case "Especial":
                return especial;
                break;
            case "Urbano":
                return urbano;
                break;
            default:
                return nacional;
                break;
        }
    }

    console.log("kg = ", Math.round(kg))
    console.log("peso_con_volumen = ", peso_con_volumen);
    console.log("volumen = ", volumen);
    console.log("sobreflete = ", sobreflete);
    console.log("sobreflete de heka = ", sobreflete_heka);
    console.log("total del trayecto = ", total);
    return total + sobreflete + sobreflete_heka;
}

// Realiza el calculo del envio y me devuelve sus detalles
class CalcularCostoDeEnvio {
    constructor(kilos, vol){
        this.kg = kilos || Math.floor(value("Kilos"));
        this.volumen = vol || value("dimension-ancho") * value("dimension-alto") * value("dimension-largo");
        this.factor_de_conversion = 0.022;
        this.sobreflete = Math.ceil(Math.max(value("valor-a-recaudar") * precios_personalizados.comision_servi / 100, 3000));
        this.sobreflete_heka = Math.ceil(value("valor-a-recaudar") * precios_personalizados.comision_heka / 100);
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
        console.log("Kg => ", this.kgTomado);
        console.log("Volumen => ", this.volumen);
        console.log("comision Servientrega => ", this.sobreflete);
        console.log("Comision heka => ", this.sobreflete_heka);
        console.log("Flete => ", this.flete);
        let resultado = this.flete + this.sobreflete + this.sobreflete_heka;
        return resultado;
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
            let fecha = new Date(), mes = fecha.getMonth() + 1, dia = fecha.getDate();
            if(dia < 10){
                dia = "0" + dia;
            }
            if(mes < 10) {
                mes = "0" + mes;
            }

            
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
            datos_a_enviar.fecha = `${fecha.getFullYear()}-${mes}-${dia}`

            boton_final_cotizador = document.getElementById("boton_final_cotizador")
            boton_final_cotizador.classList.add("disabled");

            let cargador = document.createElement("div");
            cargador.classList.add("d-flex", "justify-content-center");
            cargador.innerHTML = "<div class='lds-ellipsis'><div></div><div></div><div></div><div></div></div>";
            cargador.setAttribute("id", "respuesta-crear_guia");
            boton_final_cotizador.parentNode.insertBefore(cargador, boton_final_cotizador);
            boton_final_cotizador.remove()

            // console.log(datos_a_enviar)
            enviar_firestore(datos_a_enviar);
        }
    } else {
        alert("Por favor, verifique que los campos escenciales no estén vacíos");
        verificador(["producto", "nombreD", "direccionD", "barrioD", "telefonoD"]);
    }
}



function enviar_firestore(datos){
    let id_heka = datos_usuario.numero_documento.slice(-4);
    let firestore = firebase.firestore()
    firestore.collection("infoHeka").doc("heka_id").get()
        .then((doc) => {
            if(doc.exists){
                id_heka += doc.data().id.toString();

                datos.id_heka = id_heka;
                console.log(datos);
                firestore.collection("infoHeka").doc("heka_id").update({id: doc.data().id + 1});
                firestore.collection("usuarios").doc(localStorage.user_id)
                    .collection("guias").doc(id_heka).set(datos);
                return doc.data().id;
            }
        }).then((id) => {
            firestore.collection("usuarios").doc(localStorage.user_id).collection("informacion")
            .doc("heka").get()
            .then((doc) => {
                if(doc.exists){
                    let momento = new Date().getTime();
                    let saldo = doc.data().saldo;
                    
                    let saldo_detallado = {
                        saldo: saldo,
                        saldo_anterior: saldo,
                        activar_saldo: doc.data().activar_saldo,
                        fecha: genFecha(),
                        user_id: localStorage.user_id,
                        momento: momento,
                        diferencia: 0,
                        mensaje: "Guía " + id + " creada exitósamente",
                        guia: id
                    }
                    if(doc.data().activar_saldo){
                        saldo_detallado.saldo = saldo - datos_de_cotizacion.precio;
                        saldo_detallado.diferencia = saldo_detallado.saldo - saldo_detallado.saldo_anterior;
                        firestore.collection("usuarios").doc(localStorage.user_id).collection("informacion")
                        .doc("heka").update({
                            saldo: saldo - datos_de_cotizacion.precio
                        }).then(() => {
                            firebase.firestore().collection("prueba").add(saldo_detallado)
                            .then((docRef1)=> {
                                firebase.firestore().collection("usuarios").doc(localStorage.user_id)
                                .collection("movimientos").add(saldo_detallado)
                                .then((docRef2) => {
                                    firebase.firestore().collection("usuarios").doc("22032021").get()
                                    .then((doc) => {
                                        pagos = doc.data().pagos;
                                        pagos.push({
                                            id1: docRef1.id,
                                            id2: docRef2.id,
                                            user: saldo_detallado.user_id,
                                            medio: "Usuario: " + datos_usuario.nombre_completo + ", Id: " + saldo_detallado.user_id,
                                            guia: id,
                                            momento: momento
                                        })
                                        return pagos;
                                    }).then(reg => {
                                        console.log(reg);
                                        firebase.firestore().collection("usuarios").doc("22032021").update({
                                            pagos: reg
                                        });
                                    })
                                })
                            });
                        })
                    }
                }
            })
            return id;
        }).then((id) => {
            let respuesta = document.getElementById("respuesta-crear_guia")
            respuesta.innerHTML = "";
            respuesta.innerHTML = "Guía Creada exitósamente.";
            avisar("¡Guía creada exitósamente!", "Indetificador Heka = " + id, "", "plataforma2.html");
        }).catch((err)=> {
            console.log("revisa que paso, algo salio mal => ", err);
            avisar("¡Lo sentimos! Error inesperado", "Intente nuevamente al desaparecer este mensaje. \n si su problema persiste, comuniquese con nosotros", "advertencia", "plataforma2.html");
        })
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

