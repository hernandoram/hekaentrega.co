let ingreso, seller
class MensajeError {
    constructor (id) {
        this.id = id
    }

    input(valores, mensaje) {
        $(this.id).on("input", (e) => {
            let mostrar = false;
            valores.forEach(v => {
                if(e.target.value.indexOf(v) != -1) {
                    mostrar = true;
                }
            })
            
            if(mostrar) {
                if($(this.id).parent().children(".mensaje-error").length) {
                    $(this.id).parent().children(".mensaje-error").text(mensaje)
                } else {
                    $(this.id).parent().append('<p class="mensaje-error text-danger mt-2 text-center">'+ mensaje+ '</p>');
                }
                $("#registrar-nueva-cuenta").prop("disabled", true)
            } else {
                if($(this.id).parent().children(".mensaje-error")) {
                    $(this.id).parent().children(".mensaje-error").remove();
                }
            }
        })
    }
}
if(administracion){
    ingreso = "CPNnumero_documento";
    seller = "CPNcentro_costo";
    let documentoNvoUser = new MensajeError("#CPNnumero_documento");
    documentoNvoUser.input(["/", " ", "."], "Recuerde que los espacios y los carácteres \"/\", serán ignorados");
} else {
    ingreso = "CPNcontraseña";
    seller = "CPNnombre_empresa"
}
// Verificar que el docuento de identificacion es unico
document.getElementById(ingreso).addEventListener("blur", () => {
    verificarExistencia(administracion);
});

// Verificar que el centro de costo es unico
document.getElementById(seller).addEventListener("blur", () => {
    verificarExistencia(administracion);
});

//Para crear nueva cuenta
function nuevaCuenta(){

    //datos de registro
    let datos_personales = {
        nombres: value("CPNnombres").trim(),
        apellidos: value("CPNapellidos").trim(),
        tipo_documento: value("CPNtipo_documento"),
        numero_documento: value("CPNnumero_documento").trim(),
        
        celular: value("CPNtelefono"),
        
        celular2:value("CPNcelular"),
        ciudad: value("CPNciudad"),
        direccion: value("CPNdireccion"),
        barrio: value("CPNbarrio"),
        
        nombre: value("CPNnombre_empresa").trim(),
        correo: value("CPNcorreo"),
        con: value("CPNcontraseña").replace(/\/|\s/g, ""),
        objetos_envio: value("CPNobjetos_envio").split(",").map(s => s.trim()),
    }

    
    let datos_relevantes = {
        nombres: value("CPNnombres").trim(),
        apellidos: value("CPNapellidos").trim(),
        contacto: value("CPNtelefono"),
        direccion: `${value("CPNdireccion")}, ${value("CPNbarrio")}, ${value("CPNciudad")}`,
        objetos_envio: value("CPNobjetos_envio").split(",").map(s => s.trim()),
    }
    
    if(administracion){
        datos_personales.centro_de_costo = value("CPNcentro_costo").trim().replace(/[^A-Za-z1-9\-]/g, "");
        
        datos_relevantes.ingreso = value("CPNnumero_documento").replace(/\/|\s/g, "");
        datos_relevantes.centro_de_costo = value("CPNcentro_costo").trim().replace(/[^A-Za-z1-9\-]/g, "");
        datos_personales.usuario_corporativo = document.getElementById("CPNusuario_corporativo").checked;
        datos_relevantes.usuario_corporativo = datos_personales.usuario_corporativo;
    }else {
        datos_personales.centro_de_costo = "Seller"+value("CPNnombre_empresa").trim().replace(/[^A-Za-z1-9\-]/g, "");

        datos_relevantes.ingreso = value("CPNcontraseña").replace(/\/|\s/g, "");
        datos_relevantes.centro_de_costo = "Seller"+value("CPNnombre_empresa").trim().replace(/[^A-Za-z1-9\-]/g, "");
    }

    let datos_bancarios = {
        banco: value("CPNbanco"),
        nombre_banco: value("CPNnombre_representante"),
        tipo_de_cuenta: value("CPNtipo_de_cuenta"),
        numero_cuenta: value("CPNnumero_cuenta"),
        tipo_documento_banco: value("CPNtipo_documento_banco"),
        numero_iden_banco: value("CPNnumero_identificacion_banco")
    }

    ///div datos bancarios
    var mostrar_ocultar_registro_bancario= document.getElementById('mostrar-ocultar-registro-bancario').style.display;
    //datos bancarios
    console.log(datos_relevantes.centro_de_costo);
    //retornar si check está activado o desactivado
    var CPNcheck=document.getElementById('CPNdiv_terminos_condiciones').style.display;
    verificarExistencia(administracion).then(()=> {
        if(value("CPNnombres")=="" | value("CPNapellidos")==""  | value("CPNnumero_documento")=="" | 
        value("CPNtelefono")=="" | value("CPNcelular")=="" | value("CPNciudad")=="" | 
        value("CPNdireccion")=="" | value("CPNbarrio")=="" | value("CPNnombre_empresa")=="" | 
        value("CPNcorreo")=="" | value("CPNcontraseña")=="" | value("CPNrepetir_contraseña")=="" |
        !value("CPNobjetos_envio") | datos_relevantes.centro_de_costo == ""){
            //si todos los datos estan vacios 
            let id_centro_costo = administracion ? "CPNcentro_costo" : "CPNobjetos_envio";
            inHTML('error_crear_cuenta','<h6 class="text-danger">Error: Ningún campo debe estar vacío</h6>');
            verificador(["CPNnombres", "CPNapellidos", "CPNnumero_documento", 
            "CPNtelefono", "CPNcelular", "CPNciudad", "CPNdireccion", "CPNbarrio", 
            "CPNnombre_empresa", "CPNcorreo", "CPNcontraseña", "CPNrepetir_contraseña", 
            "CPNobjetos_envio", id_centro_costo], false, "Este campo no debería estar vacío.");
        }else{
            //si todos los datos estan llenos
            let puede_continuar = true;
            if(document.getElementById("registrar-nueva-cuenta").disabled == true){
                inHTML('error_crear_cuenta','<h6 class="text-danger">Error en registro: el usuario ya existe, o la contraseña es muy débil</h6>');
            } else if (value("CPNcontraseña")!=value("CPNrepetir_contraseña")){
                verificador(["CPNcontraseña", "CPNrepetir_contraseña"], "no-scroll")
                inHTML('error_crear_cuenta',`<h6 class="text-danger">Error: Las contraseñas no coinciden</h6>`);
            } else if (CPNcheck!="block"){
                inHTML('error_crear_cuenta',`<h6 class="text-danger">Error: Debes aceptar los términos y condiciones para poder seguir</h6>`);
            } else {
                if(mostrar_ocultar_registro_bancario == "block"){
                    if(value("CPNbanco")=="" | value("CPNnombre_representante")=="" | value("CPNtipo_de_cuenta")=="" | value("CPNnumero_cuenta")=="" | value("CPNconfirmar_numero_cuenta")=="" |
                    value("CPNtipo_documento_banco")=="" | value("CPNnumero_identificacion_banco")=="" | value("CPNconfirmar_numero_identificacion_banco")==""){
                        puede_continuar = false;
                        inHTML('error_crear_cuenta',`<h6 class="text-danger">Error: Ningún dato bancario puede estar vacio</h6>`);
                        verificador(["CPNbanco", "CPNnombre_representante", "CPNtipo_de_cuenta", "CPNnumero_cuenta", 
                        "CPNconfirmar_numero_cuenta", "CPNtipo_documento_banco", "CPNnumero_identificacion_banco", 
                        "CPNconfirmar_numero_identificacion_banco"], false, "Este campo no debe estar vacío.")
                    } else if (value("CPNnumero_cuenta") != value("CPNconfirmar_numero_cuenta")) {
                        puede_continuar = false;
                        inHTML('error_crear_cuenta',`<h6 class="text-danger">Error: Los números de cuenta no coinciden</h6>`);
                        verificador(["CPNnumero_cuenta", "CPNconfirmar_numero_cuenta"], "no-scroll")
                    } else if (value("CPNnumero_identificacion_banco") != value("CPNconfirmar_numero_identificacion_banco")) {
                        puede_continuar = false;
                        inHTML('error_crear_cuenta',`<h6 class="text-danger">Error: Los número de indentificación en los datos bancarios no coinciden</h6>`);
                        verificador(["CPNnumero_identificacion_banco", "CPNconfirmar_numero_identificacion_banco"], "no-scroll")
                    }
                }

                if(puede_continuar){
                    let boton_crear_usuario = document.getElementById("registrar-nueva-cuenta");
                    boton_crear_usuario.setAttribute("onclick", "");
                    boton_crear_usuario.disabled = true;
                    boton_crear_usuario.textContent = "Cargando...";

                    inHTML('error_crear_cuenta',`<h6 class="text-danger"> DATOS BANCARIOS: "${value("CPNbanco")}" | "${value("CPNnombre_representante")}" | "${value("CPNtipo_de_cuenta")}" | "${value("CPNnumero_cuenta")}" | "${value("CPNconfirmar_numero_cuenta")}" | 
                    "${value("CPNtipo_documento_banco")}" | "${value("CPNnumero_identificacion_banco")}" | "${value("CPNconfirmar_numero_identificacion_banco")}</"h6>`);
    
                    let user = value("CPNnumero_documento").toString().trim();
                    
                    firebase.firestore().collection("usuarios").doc(user).get()
                    .then((doc) => {
                        console.log(datos_bancarios);
                        console.log(datos_personales);
                        console.log(datos_relevantes);
                        if(!doc.exists) {
                            firebase.firestore().collection("usuarios").doc(user)
                            .collection("informacion").doc("personal").set(datos_personales)
                            .then(() => {
                                firebase.firestore().collection("usuarios").doc(user).set(datos_relevantes)
                                .catch((err) => {
                                    inHTML('error_crear_cuenta',`<h6 class="text-danger">${err} \n
                                        No se pudo crear el identificador de ingreso</h6>`);
                                })
                            }).then(() => {
                                firebase.firestore().collection('usuarios').doc(user)
                                .collection("informacion").doc("bancaria").set(datos_bancarios)
                                .catch(function(error){
                                    inHTML('error_crear_cuenta',`<h6 class="text-danger">Problemas al agregar Datos bancarios</h6>`);
                                });
                            }).then(() => {
                                if(datos_relevantes.usuario_corporativo){
                                    firebase.firestore().collection('usuarios').doc(user)
                                    .collection("informacion").doc("heka").set({
                                        activar_saldo: true,
                                        fecha: genFecha(),
                                        saldo: 0
                                    })
                                }
                            }).then(function(){
                                if(administracion) {
                                    avisar("¡Cuenta creada con éxito!", 
                                    "User_id = "+ user + "\n Puede ingresar con: " + value("CPNnumero_documento"), "", "admin.html");
                                } else {
                                    firebase.firestore().collection("usuarios").where("ingreso", "==", datos_relevantes.ingreso.toString()).get()
                                    .then((querySnapshot) => {
                                    localStorage.setItem("user_id", "");
                                    querySnapshot.forEach((doc) => {
                                        localStorage.setItem("user_id", doc.id);
                                        localStorage.setItem("user_login", doc.data().ingreso);
                                        console.log(localStorage);
                                        
                                        location.href = "plataforma2.html";
                                    })
                                    }).then((d) => {
                                    if(localStorage.user_id == ""){
                                        alert("Usuario no encontrado");
                                    }
                                    }).catch((error) => {
                                    console.log("Error getting documents: ", error);
                                    });
                                }
                            })
                            .catch(function(error){
                                boton_crear_usuario.setAttribute("onclick", "nuevaCuenta()");
                                boton_crear_usuario.disabled = false;
                                boton_crear_usuario.textContent = "Registrar Cuenta";
                                inHTML('error_crear_cuenta',`<h6 class="text-danger">${error}</h6>`);
                            });
                        } else {
                            inHTML('error_crear_cuenta',`<h6 class="text-danger">No podemos procesar tu solicitud, ya existe un usuario con ese documento de identificación</h6>`);
                            verificador("CPNnumero_documento", "no-scroll");
                            boton_crear_usuario.addEventListener("click", () => {
                                nuevaCuenta(administracion);
                            })
                            boton_crear_usuario.disabled = false;
                            boton_crear_usuario.textContent = "Crear Cuenta";
                        }
                    })
    
                }
            }
        } 
    })
}


let CpnKey = new MensajeError("#CPNcontraseña");
CpnKey.input(["/", " "], "La contraseña no debe tener espacios ni los carácteres \"/\", si continúa, los carácteres mencionados serán ignorados");


//Verifica que el usuario a crear no exista ni el centro de costo que se le quiere asignar
async function verificarExistencia(administracion){
    await firebase.firestore().collection("usuarios").get()
    .then((querySnapshot) => {
        let existe_usuario = false, existe_centro_costo = false
        let identificador = administracion ? value("CPNnumero_documento") : value("CPNcontraseña");
        let centro_de_costo = administracion ? value("CPNcentro_costo") : "Seller" + value("CPNnombre_empresa");
        querySnapshot.forEach(doc => {
            let sellerFb = doc.data().centro_de_costo
            if(doc.data().ingreso == identificador.replace(/\s/g, "")){
                document.getElementById("registrar-nueva-cuenta").disabled = true;
                existe_usuario = true;
            }

            if(sellerFb && sellerFb.toString().toLowerCase() == centro_de_costo.toLowerCase().replace(/[^A-Za-z1-9\-]/g, "")){
                document.getElementById("registrar-nueva-cuenta").disabled = true;
                existe_centro_costo = true;
            }
        });
        if(existe_usuario){
            document.getElementById("usuario-existente").classList.remove("d-none");
        } else {
            document.getElementById("usuario-existente").classList.add("d-none");
        }
        if(existe_centro_costo){
            document.getElementById("centro_costo-existente").classList.remove("d-none");
        } else {
            document.getElementById("centro_costo-existente").classList.add("d-none");
        }
        if(!existe_usuario && !existe_centro_costo){
            document.getElementById("registrar-nueva-cuenta").disabled = false;
        }     
    })
}


//esta funcion utilizara a otra para retornarme informacion basica del usuario
function buscarUsuarios(){
    document.getElementById("cargador-usuarios").classList.remove("d-none");
    // let busqueda = ["!=", ""];
    // if(value("buscador_usuarios-id")){
    //     busqueda = ["==", value("buscador_usuarios-id")];
    // }
    firebase.firestore().collection("usuarios").get()
    .then((querySnapshot) => {
        inHTML("mostrador-usuarios", "");
        console.log(querySnapshot.size);
        querySnapshot.forEach((doc) => {
            if(value("buscador_usuarios-nombre")){
                if(doc.data().centro_de_costo && 
                (doc.data().centro_de_costo.toLowerCase().indexOf(value("buscador_usuarios-nombre").toLowerCase()) != -1 || 
                doc.data().nombres.toLowerCase().indexOf(value("buscador_usuarios-nombre").toLowerCase()) != -1)){
                    document.getElementById("mostrador-usuarios").innerHTML += mostrarUsuarios(doc.data(), doc.id);
                }
            }

            if(value("buscador_usuarios-direccion")) {
                if(doc.data().centro_de_costo && doc.data().direccion.toLowerCase().indexOf(value("buscador_usuarios-direccion").toLowerCase()) != -1 ) {
                    document.getElementById("mostrador-usuarios").innerHTML += mostrarUsuarios(doc.data(), doc.id);
                }
            }

            if(!value("buscador_usuarios-direccion") && !value("buscador_usuarios-nombre")){
                document.getElementById("mostrador-usuarios").innerHTML += mostrarUsuarios(doc.data(), doc.id);
            }
            
            if(value("buscador_usuarios-nombre").toLowerCase() == doc.data().nombres.toLowerCase()){
                document.getElementById("usuario-seleccionado").setAttribute("data-id", doc.id);
                seleccionarUsuario(doc.id);
            }
            
        })
    }).then(() => {
        if(document.getElementById("mostrador-usuarios").innerHTML == ""){
            inHTML("mostrador-usuarios", "<div class='card text-danger'><h5 class='m-3'>Lo sentimos, Sin resultados para tu búsqueda</h5></div>")
        } else {
            let botones_ver = document.querySelectorAll('[data-funcion="ver-eliminar"]');
            let botones_movimientos = document.querySelectorAll('[data-funcion="movimientos"]');
            let boton_filtrador_movs = document.getElementById("filtrador-movimientos");
            for(let boton of botones_ver){
                boton.addEventListener("click", (e) => {
                    let identificador = e.target.parentNode.getAttribute("data-buscador");
                    seleccionarUsuario(identificador);
                    
                    let contenedor = document.getElementById("usuario-seleccionado");
                    let mostrador = document.getElementById("mostrador-usuarios");
                    contenedor.setAttribute("data-id", identificador);
                    contenedor.classList.remove("d-none");
                    mostrador.classList.add("d-none");
                })
            }

            for(let boton of botones_movimientos){
                boton.addEventListener("click", e => {
                    let identificador = e.target.parentNode.getAttribute("data-buscador");
                    let fechaI = genFecha().split("-");
                    fechaI[1] -= 1;
                    fechaI = new Date(fechaI.join("-")).getTime();
                    let fechaF = new Date(genFecha()).getTime();
                    console.log(fechaI, fechaF)
                    verMovimientos(identificador, fechaI, fechaF + 8.64e+7);
                    boton_filtrador_movs.setAttribute("data-usuario", identificador);
                    document.getElementById("nombre-usuario-movs").textContent = e.target.parentNode.getAttribute("data-nombre")
                    location.href = "#movimientos"
                })
            }
            boton_filtrador_movs.addEventListener("click", e => {
                let identificador = e.target.getAttribute("data-usuario")
                fechaI = new Date(document.getElementById("movs-fecha-inicio").value).getTime()
                fechaF = new Date(document.getElementById("movs-fecha-final").value).getTime()
                verMovimientos(identificador, fechaI, fechaF + 8.64e+7);
            })
        }
        document.getElementById("cargador-usuarios").classList.add("d-none");

    })
}



// esta funcion me busca el usuario seleccionado con informacion un poco mas detallada
function seleccionarUsuario(id){
    let type = ["personal", "bancaria", "heka"], n = 0;
    while(n < 3){
        firebase.firestore().collection("usuarios").doc(id).collection("informacion").doc(type[n]).get()
        .then((doc) => {
            if (doc.exists) {
                mostrarDatosPersonales(doc.data(), doc.id);
            } else {
                // doc.data() will be undefined in this case
                console.log("No such document!");
            }
        }).catch((error) => {
            console.log("Error getting document:", error);
        });
        n++;
    }
}

// esta funcion solo llena los datos solicitados en los inputs
function mostrarDatosPersonales(data, info) {

    $("#aumentar_saldo").val("");
    asignacion("actualizar_costo_zonal1", data.costo_zonal1);
    asignacion("actualizar_costo_zonal2", data.costo_zonal2);
    asignacion("actualizar_costo_zonal3", data.costo_zonal3);
    asignacion("actualizar_costo_nacional1", data.costo_nacional1);
    asignacion("actualizar_costo_nacional2", data.costo_nacional2);
    asignacion("actualizar_costo_nacional3", data.costo_nacional3);
    asignacion("actualizar_costo_especial1", data.costo_especial1);
    asignacion("actualizar_costo_especial2", data.costo_especial2);
    asignacion("actualizar_costo_especial3", data.costo_especial3);
    asignacion("actualizar_comision_servi", data.comision_servi);
    asignacion("actualizar_comision_heka", data.comision_heka);
    let mostrador_saldo = document.getElementById("actualizar_saldo");
    mostrador_saldo.textContent = "$" + convertirMiles(0);
    mostrador_saldo.setAttribute("data-saldo", 0);
    mostrador_saldo.setAttribute("data-saldo_anterior", 0);


    if(info == "personal"){
        // Datos personales
        inHTML("nombre-usuario", data.nombres.split(" ")[0] + " " + data.apellidos.split(" ")[0]);
        asignacion("actualizar_nombres", data.nombres);
        asignacion("actualizar_apellidos", data.apellidos);
        asignacion("actualizar_tipo_documento", data.tipo_documento);
        asignacion("actualizar_numero_documento", data.numero_documento);
        asignacion("actualizar_telefono", data.celular);
        asignacion("actualizar_celular", data.celular2);
        asignacion("actualizar_ciudad", data.ciudad);
        asignacion("actualizar_direccion", data.direccion);
        asignacion("actualizar_barrio", data.barrio);
        asignacion("actualizar_nombre_empresa", data.nombre);
        asignacion("actualizar_centro_costo", data.centro_de_costo);
        asignacion("actualizar_correo", data.correo);
        asignacion("actualizar_contraseña", data.con);
        asignacion("actualizar_repetir_contraseña", data.con);
        asignacion("actualizar_objetos_envio", data.objetos_envio);

    } else if(info == "bancaria") {
        // Datos bancarios
        asignacion("actualizar_banco", data.banco);
        asignacion("actualizar_nombre_representante", data.nombre_banco);
        asignacion("actualizar_tipo_de_cuenta", data.tipo_de_cuenta);
        asignacion("actualizar_numero_cuenta", data.numero_cuenta);
        asignacion("actualizar_confirmar_numero_cuenta", data.numero_cuenta);
        asignacion("actualizar_tipo_documento_banco", data.tipo_documento_banco);
        asignacion("actualizar_numero_identificacion_banco", data.numero_iden_banco);
        asignacion("actualizar_confirmar_numero_identificacion_banco", data.numero_iden_banco);
    } else {
        $("#aumentar_saldo").val("");
        asignacion("actualizar_costo_zonal1", data.costo_zonal1);
        asignacion("actualizar_costo_zonal2", data.costo_zonal2);
        asignacion("actualizar_costo_zonal3", data.costo_zonal3);
        asignacion("actualizar_costo_nacional1", data.costo_nacional1);
        asignacion("actualizar_costo_nacional2", data.costo_nacional2);
        asignacion("actualizar_costo_nacional3", data.costo_nacional3);
        asignacion("actualizar_costo_especial1", data.costo_especial1);
        asignacion("actualizar_costo_especial2", data.costo_especial2);
        asignacion("actualizar_costo_especial3", data.costo_especial3);
        asignacion("actualizar_comision_servi", data.comision_servi);
        asignacion("actualizar_comision_heka", data.comision_heka);
        mostrador_saldo.textContent = "$" + convertirMiles(data.saldo) || 0;
        mostrador_saldo.setAttribute("data-saldo", data.saldo || 0);
        mostrador_saldo.setAttribute("data-saldo_anterior", data.saldo || 0);
        document.getElementById("activador-saldo").checked = data.activar_saldo;

        
    }

    $("#aumentar_saldo").keyup((e) => {
        let saldo_nuevo = parseInt(data.saldo || 0) + parseInt(e.target.value);
        if(e.target.value && typeof saldo_nuevo == "number"){
            $("#actualizar_saldo").attr("data-saldo", saldo_nuevo)
            .text("$" + convertirMiles(saldo_nuevo))
            .addClass("text-success");
        } else {
            $("#actualizar_saldo").attr("data-saldo", data.saldo || 0)
            .text("$" + convertirMiles(data.saldo || 0))
            .removeClass("text-success");
        }  
    });

    activarDesactivarSaldo(data.activar_saldo)
    $("#activador-saldo").change((e) => {
        activarDesactivarSaldo(e.target.checked)
    })

    function activarDesactivarSaldo(boolean){
        if(boolean){
            $("#mostrador_saldo").removeClass("d-none");
        } else {
            $("#mostrador_saldo").addClass("d-none");
        } 
    }

    let id_user = $("#usuario-seleccionado").attr("data-id");
    firebase.firestore().collection("usuarios").doc(id_user)
    .get().then((doc) => {
        if(doc.data().usuario_corporativo){
            document.getElementById("activador-saldo").parentNode.classList.remove("d-none");
        } else {
            document.getElementById("mostrador_saldo").classList.add("d-none");
            document.getElementById("activador-saldo").checked = false;
            document.getElementById("activador-saldo").parentNode.classList.add("d-none");
        }
    })
    
}

function actualizarInformacionPersonal() {
    let datos = {
        nombres: value("actualizar_nombres"), 
        apellidos: value("actualizar_apellidos"),
        tipo_documento: value("actualizar_tipo_documento"),
        numero_documento: value("actualizar_numero_documento"),
        celular: value("actualizar_telefono"),
        celular2: value("actualizar_celular"),
        ciudad: value("actualizar_ciudad"),
        direccion: value("actualizar_direccion"),
        barrio: value("actualizar_barrio"),
        nombre: value("actualizar_nombre_empresa"),
        centro_de_costo: value("actualizar_centro_costo"),
        correo: value("actualizar_correo"),
        con: value("actualizar_contraseña"),
        objetos_envio: value("actualizar_objetos_envio").split(",")
    };
    let id_usuario = document.getElementById("usuario-seleccionado").getAttribute("data-id");

    firebase.firestore().collection("usuarios").doc(id_usuario).collection("informacion").doc("personal").set(datos)
    .then(() => {
        firebase.firestore().collection("usuarios").doc(id_usuario).update({
            apellidos: datos.apellidos,
            contacto: datos.celular,
            direccion: datos.direccion + " " + datos.barrio + " " + datos.ciudad,
            nombres: datos.nombres,
            objetos_envio: datos.objetos_envio,
            centro_de_costo: datos.centro_de_costo
        })
    }).then(() => {
        avisar("Actualización de Datos exitosa", 
        "Se han registrado cambios en información personal para: " + datos.nombres.split(" ")[0] + " " + datos.apellidos.split(" ")[0]);
    })
}

function actualizarInformacionBancaria() {
    // Datos bancarios
    let datos = {
        banco: value("actualizar_banco"),
        nombre_banco: value("actualizar_nombre_representante"),
        tipo_de_cuenta: value("actualizar_tipo_de_cuenta"),
        numero_cuenta: value("actualizar_numero_cuenta"),
        tipo_documento_banco: value("actualizar_tipo_documento_banco"),
        numero_iden_banco: value("actualizar_numero_identificacion_banco")
    };
  
    let id_usuario = document.getElementById("usuario-seleccionado").getAttribute("data-id");

    firebase.firestore().collection("usuarios").doc(id_usuario).collection("informacion").doc("bancaria").set(datos)
    .then(() => {
        avisar("Actualización de Datos exitosa", 
        "Se han registrado cambios en información Bancaria para id: " + value("actualizar_numero_documento"));
    })
}

function actualizarInformacionHeka() {
    // Datos contabilidad
    document.querySelector('[onclick="actualizarInformacionHeka()"]').value = "cargando";

    let datos = {
        costo_zonal1: value("actualizar_costo_zonal1"),
        costo_zonal2: value("actualizar_costo_zonal2"),
        costo_zonal3: value("actualizar_costo_zonal3"),
        costo_nacional1: value("actualizar_costo_nacional1"),
        costo_nacional2: value("actualizar_costo_nacional2"),
        costo_nacional3: value("actualizar_costo_nacional3"),
        costo_especial1: value("actualizar_costo_especial1"),
        costo_especial2: value("actualizar_costo_especial2"),
        costo_especial3: value("actualizar_costo_especial3"),
        comision_servi: value("actualizar_comision_servi"),
        comision_heka: value("actualizar_comision_heka"),
        saldo: $("#actualizar_saldo").attr("data-saldo"),
        activar_saldo: document.getElementById("activador-saldo").checked,
        fecha: genFecha()
    };

    
    let momento = new Date().getTime();
    let id_usuario = document.getElementById("usuario-seleccionado").getAttribute("data-id");
    
    saldo = {
        saldo: $("#actualizar_saldo").attr("data-saldo"),
        saldo_anterior: $("#actualizar_saldo").attr("data-saldo_anterior"),
        activar_saldo: document.getElementById("activador-saldo").checked,
        fecha: genFecha(),
        user_id: id_usuario,
        momento: momento,
        diferencia: $("#aumentar_saldo").val() || 0,
        mensaje: "Hubo algún cambio por parte del administrador",
        medio: "Administrador: " + localStorage.user_id
    }
    firebase.firestore().collection("usuarios").doc(id_usuario).collection("informacion").doc("heka").set(datos)
    .then(() => {
        firebase.firestore().collection("prueba").add(saldo)
        .then((docRef1)=> {
            console.log(docRef1.id)
            firebase.firestore().collection("usuarios").doc(id_usuario).collection("movimientos").add(saldo)
            .then((docRef2) => {
                firebase.firestore().collection("usuarios").doc("22032021").get()
                .then((doc) => {
                    pagos = doc.data().pagos;
                    pagos.push({
                        id1: docRef1.id,
                        id2: docRef2.id,
                        user: saldo.user_id,
                        medio: "Administrador: " + localStorage.user_id,
                        momento: momento
                    })
                    return pagos;
                }).then(reg => {
                    firebase.firestore().collection("usuarios").doc("22032021").update({
                        pagos: reg
                    });
                })
            })
        });
    }).then(() => {
        document.querySelector('[onclick="actualizarInformacionHeka()"]').value = "Actualizar Costos de Envío";
        avisar("Actualización de Datos exitosa", 
        "Se han registrado cambios en los costos de envíos para id: " + value("actualizar_numero_documento"));
    })


}


/*****************
    ******************* ATENTO CON ESTA PARTE DEL CÓDIGO *****************
**********************/

async function verMovimientos(usuario, fechaI, fechaF){
    document.getElementById("card-movimientos").innerHTML = "";
    document.getElementById("card-movimientos").innerHTML = "<div class='d-flex justify-content-center'><div class='lds-ellipsis'><div></div><div></div><div></div><div></div></div>";
    try {
        let buscador = await firebase.firestore().collection("usuarios").doc("22032021")
        .get().then((doc) => {
            let pagos = doc.data().pagos;
            return pagos.filter((d) => {
                return d.user == usuario && fechaI <= d.momento && fechaF >= d.momento;
            });
        }) 


        async function miradorUsuario(usuario){
            let res = []
            await firebase.firestore().collection("usuarios").doc(usuario).collection("movimientos")
            .orderBy("momento").startAt(fechaI).endAt(fechaF).get().then((querySnapshot) => {
                querySnapshot.forEach(doc => {
                    res.push(doc.data());
                })
            });
            return res
        }

        async function miradorPrueba(usuario){
            let res = []
            await firebase.firestore().collection("prueba").where("user_id", "==", usuario)
            .get().then((querySnapshot) => {
                querySnapshot.forEach((doc) => {
                    res.push(doc.data());
                })
            })
            return res
        }

        let data1, data2
        console.log(buscador)
        miradorUsuario(usuario).then(data => {
            data2 = data;
            miradorPrueba(usuario).then(d2 => data1 = d2)
            .then(() => {
                document.getElementById("card-movimientos").innerHTML = "";
                let detalles = document.createElement("ul");
                lista_detalles = []
                console.log(data2);
                console.log(data1);
                let saldo_momento = data2.reduce((a,b) => {
                    return parseInt(a) + parseInt(b.diferencia)
                }, parseInt(data2[0].saldo_anterior));
                let saldo_momento_legal = data1.reduce((a,b) => {
                    if(b.momento >= fechaI && b.momento <= fechaF){
                        return parseInt(a) + parseInt(b.diferencia);
                    } else {
                        return a
                    }
                }, parseInt(data2[0].saldo_anterior));
                let saldo_legal = data1.reduce((a,b) => {
                    return parseInt(a) + parseInt(b.diferencia)
                }, 0);
                if(buscador.length == data2.length && buscador.length == data1.length) {
                    lista_detalles.push("La cantidad de movimientos coinciden en todos los documentos")
                } else if(buscador.length == data2.length) {
                    lista_detalles.push("La cantidad de movimientos coincide solo con los movimientos del usuario");
                } else if(buscador.length == data1.length) {
                    lista_detalles.push("La cantidad de movimientos coincide solo con los movimientos secundarios, si no estás filtrando datos es posible qeu sea un error");
                }
                lista_detalles.push("El saldo del cliente a la fecha era de: $" + convertirMiles(saldo_momento)
                + " Y debió haber sido de: $" + convertirMiles(saldo_momento_legal))
                tablaMovimientos(data2);
                firebase.firestore().collection('usuarios').doc(usuario)
                .collection("informacion").doc("heka")
                .get().then((doc) => {
                    if(doc.exists){
                        lista_detalles.push("El saldo Actual del cliente es: $" + convertirMiles(doc.data().saldo)
                        + " Y debería ser de: $" + convertirMiles(saldo_legal));
                        console.log("Saldos coinciden? => ", parseInt(doc.data().saldo) == saldo_legal);
                    }
                }).then(() => {
                    for(let d of lista_detalles) {
                        detalles.innerHTML += `<li>${d}</li>`;
                    }
                    document.getElementById("card-movimientos").appendChild(detalles)
                });
            });
        })


    } catch(error) {
        console.log(error)
    }
}
