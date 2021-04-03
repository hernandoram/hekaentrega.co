//Script utilizado Solo en admin.html
document.getElementById("CPNusuario_corporativo").checked = true;

function nuevaCuentaViejo(){
    //datos de registro 
     var CPNnombres=value('CPNnombres');
     var CPNapellidos=value('CPNapellidos');
     var CPNtipo_documento=value('CPNtipo_documento');
     var CPNnumero_documento=value('CPNnumero_documento');
     var CPNtelefono=value('CPNtelefono');
     var CPNcelular=value('CPNcelular');
     var CPNciudad=value('CPNciudad');
     var CPNdireccion=value('CPNdireccion');
     var CPNbarrio=value('CPNbarrio');
     var CPNnombre_empresa=value('CPNnombre_empresa');
     var CPNcorreo=value('CPNcorreo');
     var CPNcontraseña=value('CPNcontraseña');
     var CPNrepetir_contraseña=value('CPNrepetir_contraseña');
     var CPNcentro_costo = value("CPNcentro_costo");
     var CPNobjetos_envio = value("CPNobjetos_envio").split(",");

   
     ///div datos bancarios
     var mostrar_ocultar_registro_bancario= document.getElementById('mostrar-ocultar-registro-bancario').style.display;
     //datos bancarios
     var CPNbanco=value('CPNbanco');
     var CPNnombre_representante=value('CPNnombre_representante');
     var CPNtipo_de_cuenta=value('CPNtipo_de_cuenta');
     var CPNnumero_cuenta=value('CPNnumero_cuenta');
     var CPNconfirmar_numero_cuenta=value('CPNconfirmar_numero_cuenta');
     var CPNtipo_documento_banco=value('CPNtipo_documento_banco');
     var CPNnumero_identificacion_banco=value('CPNnumero_identificacion_banco');
     var CPNconfirmar_numero_identificacion_banco=value('CPNconfirmar_numero_identificacion_banco');
   
     //retornar si check está activado o desactivado
     var CPNcheck=document.getElementById('CPNdiv_terminos_condiciones').style.display;
     
   
   
   
     
     
     
     if(CPNnombres=="" | CPNapellidos==""  | CPNnumero_documento=="" | CPNtelefono=="" | CPNcelular=="" | CPNciudad=="" | CPNdireccion=="" | CPNbarrio=="" |
     CPNnombre_empresa=="" | CPNcorreo=="" | CPNcontraseña=="" | CPNrepetir_contraseña==""){
       //si todos los datos estan vacios 
       inHTML('error_crear_cuenta','<h6 class="text-danger">Error: Ningún campo debe estar vacío</h6>');
     }else{
       //si todos los datos estan llenados
   
       //si la contraseña coincide
       if(CPNcontraseña==CPNrepetir_contraseña){
           // si el check de datos bancarios esta activado
           if(mostrar_ocultar_registro_bancario=="block"){
                
                //si todos los datos bancarios estan en blanco
                if(CPNbanco=="" | CPNnombre_representante=="" | CPNtipo_de_cuenta=="" | CPNnumero_cuenta=="" | CPNconfirmar_numero_cuenta=="" |
                CPNtipo_documento_banco=="" | CPNnumero_identificacion_banco=="" | CPNconfirmar_numero_identificacion_banco==""){

                 inHTML('error_crear_cuenta',`<h6 class="text-danger">Error: Ningún dato bancario puede estar vacio</h6>`);
                
                 //si los datos bancarios estan llenos   
                }else{
                    //si numero de cuenta coincide
                    if(CPNnumero_cuenta==CPNconfirmar_numero_cuenta){
                        //si numero de identificacion coindice
                        if(CPNnumero_identificacion_banco==CPNconfirmar_numero_identificacion_banco){
                        
                            //si check de terminos y condiciones está activo
                            if(CPNcheck=="block"){
                            
                                //COMPROBACIONES CORRECTAS CON DATOS BANCARIOS
                                inHTML('error_crear_cuenta',`<h6 class="text-danger">${"CON DATOS BANCARIOS: "+CPNbanco+"|"+CPNnombre_representante+"|"+CPNtipo_de_cuenta+"|"+CPNnumero_cuenta+"|"+CPNconfirmar_numero_cuenta+"|"+
                                CPNtipo_documento_banco+"|"+CPNnumero_identificacion_banco+"|"+CPNconfirmar_numero_identificacion_banco}</h6>`);

                                
                                //Registrar usuario firebase con cuenta bancaria////////////////////////////////////////////////////////////////////
                                firebase.auth().createUserWithEmailAndPassword(CPNcorreo, CPNcontraseña)
                                .then(function(data){
                                    firebase.auth().onAuthStateChanged(function(user) {
                                        if(user){
                                            firebase.firestore().collection("usuarios").doc(user.uid)
                                            .collection("informacion").doc("personal").set({
                                                nombres: CPNnombres,
                                                apellidos: CPNapellidos,
                                                tipo_documento: CPNtipo_documento,
                                                numero_documento: CPNnumero_documento,
                                                
                                                celular: CPNtelefono,
                                                
                                                celular2:CPNcelular,
                                                ciudad: CPNciudad,
                                                direccion: CPNdireccion,
                                                barrio: CPNbarrio,
                                                
                                                nombre: CPNnombre_empresa,
                                                correo: CPNcorreo,
                                                con: CPNcontraseña,
                                                centro_de_costo: CPNcentro_costo,
                                                objetos_envio: CPNobjetos_envio
                                            }).then(() => {
                                                firebase.firestore().collection("usuarios").doc(user.uid).set({
                                                    ingreso: CPNnumero_documento,
                                                    nombres: CPNnombres,
                                                    apellidos: CPNapellidos,
                                                    contacto: CPNtelefono,
                                                    direccion: `${CPNdireccion}, ${CPNbarrio}, ${CPNciudad}`,
                                                    objetos_envio: CPNobjetos_envio,
                                                    centro_de_costo: CPNcentro_costo
                                                }).catch((err) => {
                                                    inHTML('error_crear_cuenta',`<h6 class="text-danger">${err} \n
                                                        No se pudo crear el identificador de ingreso</h6>`);
                                                })
                                            }).then(() => {
                                                firebase.firestore().collection('usuarios').doc(user.uid)
                                                .collection("informacion").doc("bancaria").set({
                                               
                                                    //////datos bancarios
                                                    banco: CPNbanco,
                                                    nombre_banco: CPNnombre_representante,
                                                    tipo_de_cuenta: CPNtipo_de_cuenta,
                                                    numero_cuenta: CPNnumero_cuenta,
                                                    tipo_documento_banco: CPNtipo_documento_banco,
                                                    numero_iden_banco: CPNnumero_identificacion_banco

                                                }).catch(function(error){
                                                    inHTML('error_crear_cuenta',`<h6 class="text-danger">Problemas al agregar Datos bancarios</h6>`);
                                                });
                                            }).then(function(){
                                                avisar("¡Cuenta creada con éxito!", 
                                                "User_id = "+ user.uid + "\n Puede ingresar con: " + CPNnumero_documento);
                                            })
                                            .catch(function(error){
                                                inHTML('error_crear_cuenta',`<h6 class="text-danger">${error}</h6>`);
                                            });
                                        }else{}
                                    })

                                })
                                .catch(function (error) {
                                    // Handle Errors here.
                                    var errorCode = error.code;
                                    var errorMessage = error.message;
                                    
                                    if(errorCode=="auth/invalid-email"){
                                    errorCode="Correo invalido";
                                    }
                                    if(errorMessage=="The email address is badly formatted."){
                                    errorMessage="El correo es incorrecto";
                                    }
                                    if(errorCode=="auth/weak-password"){
                                    errorCode="Contraseña débil";
                                    }
                                    if(errorMessage=="Password should be at least 6 characters"){
                                    errorMessage="La contraseña debe ser mínimo de 6 caracteres";

                                    }
                                    if(errorCode=="auth/email-already-in-use"){
                                    errorCode="Correo en uso";
                                    }
                                    if(errorMessage=="The email address is already in use by another account."){
                                    errorMessage="EL correo ya está registrado";
                                    }
                                    inHTML('error_crear_cuenta',`<h6 class="text-danger">${"error: "+errorCode+" | "+errorMessage}</h6>`);

                                    // ...
                                });
                        
                                //si check de terminos y condiciones está desactivado
                            }else{
                             inHTML('error_crear_cuenta',`<h6 class="text-danger">Error: Debes aceptar los términos y condiciones para seguir</h6>`);
                            }
                        
                    
                    //si numero de identificacion no coincide
                        }else{
                            inHTML('error_crear_cuenta',`<h6 class="text-danger">Error: Los números de identificación no coinciden</h6>`);
                        }
                    //si numero de cuenta no coincide
                    }else{
                        inHTML('error_crear_cuenta',`<h6 class="text-danger">Error: Los números de cuenta no coinciden</h6>`);
                    }
                }
                
                //si el check de datos bancarios está desactivado
            }else{
                
                //si check de terminos y condiciones está activado
                if(CPNcheck=="block"){

                    //COMPROBACIONES CORRECTAS SIN DATOS BANCARIOS
                    inHTML('error_crear_cuenta',`<h6 class="text-danger">${"SIN DATOS BANCARIOS: "+CPNnombres+"|"+CPNapellidos+"|"
                    +CPNtipo_documento+"|"+CPNnumero_documento+"|"+CPNtelefono+"|"+CPNcelular+"|"+CPNciudad+"|"+CPNdireccion+"|"+CPNbarrio+"|"
                    +CPNnombre_empresa+"|"+CPNcorreo+"|"+CPNcontraseña+"|"+CPNrepetir_contraseña}</h6>`);

                    //Registrar usuario firebase sin cuenta bancaria////////////////////////////////////////////////////////////////////
                    firebase.auth().createUserWithEmailAndPassword(CPNcorreo, CPNcontraseña)
                    .then(function(data){

                        firebase.auth().onAuthStateChanged(function(user) {

                            if(user){

                                firebase.firestore().collection("usuarios").doc(user.uid)
                                .collection("informacion").doc("personal").set({
                                    nombres: CPNnombres,
                                    apellidos: CPNapellidos,
                                    tipo_documento: CPNtipo_documento,
                                    numero_documento: CPNnumero_documento,
                                    
                                    celular: CPNtelefono,
                                    
                                    celular2:CPNcelular,
                                    ciudad: CPNciudad,
                                    direccion: CPNdireccion,
                                    barrio: CPNbarrio,
                                    
                                    nombre: CPNnombre_empresa,
                                    correo: CPNcorreo,
                                    con: CPNcontraseña,
                                    centro_de_costo: CPNcentro_costo,
                                    objetos_envio: CPNobjetos_envio
                                }).then(() => {
                                    firebase.firestore().collection("usuarios").doc(user.uid).set({
                                        ingreso: CPNnumero_documento,
                                        nombres: CPNnombres,
                                        apellidos: CPNapellidos,
                                        contacto: CPNtelefono,
                                        direccion: `${CPNdireccion}, ${CPNbarrio}, ${CPNciudad}`,
                                        centro_de_costo: CPNcentro_costo,
                                        objetos_envio: CPNobjetos_envio
                                    }).catch((err) => {
                                        inHTML('error_crear_cuenta',`<h6 class="text-danger">${err} \n
                                            No se pudo crear el identificador de ingreso</h6>`);
                                    })
                                }).then(() => {
                                    firebase.firestore().collection('usuarios').doc(user.uid)
                                    .collection("informacion").doc("bancaria").set({
                                
                                        //////datos bancarios
                                        banco: "",
                                        nombre_banco: "",
                                        tipo_de_cuenta: "",
                                        numero_cuenta: "",
                                        tipo_documento_banco: "",
                                        numero_iden_banco: "",

                                    }).catch(function(error){
                                        inHTML('error_crear_cuenta',`<h6 class="text-danger">Problemas al agregar Datos bancarios</h6>`);
                                    });
                                }).then(function(data){
                                    avisar("¡Cuenta creada con éxito!", 
                                    "User_id = "+ user.uid + "\n Puede ingresar con: " + CPNnumero_documento);
                                })
                                .catch(function(error){
                                    inHTML('error_crear_cuenta',`<h6 class="text-danger">${error}</h6>`);
                                });
                            }else{}
                        })

                    })
                    .catch(function (error) {
                        // Handle Errors here.
                        var errorCode = error.code;
                        var errorMessage = error.message;
                        
                        if(errorCode=="auth/invalid-email"){
                        errorCode="Correo invalido";
                        }
                        if(errorMessage=="The email address is badly formatted."){
                        errorMessage="El correo es incorrecto";
                        }
                        if(errorCode=="auth/weak-password"){
                        errorCode="Contraseña débil";
                        }
                        if(errorMessage=="Password should be at least 6 characters"){
                        errorMessage="La contraseña debe ser mínimo de 6 caracteres";

                        }
                        if(errorCode=="auth/email-already-in-use"){
                        errorCode="Correo en uso";
                        }
                        if(errorMessage=="The email address is already in use by another account."){
                        errorMessage="EL correo ya está registrado";
                        }
                        inHTML('error_crear_cuenta',`<h6 class="text-danger">${"error: "+errorCode+" | "+errorMessage}</h6>`);

                        // ...
                    });
                    //si check de terminos y condiciones NO está activado  
                }else{
                    inHTML('error_crear_cuenta',`<h6 class="text-danger">Error: Debes aceptar los términos y condiciones para poder seguir</h6>`);
                }
            }
   //si la contraseña no coincide
        }else{
            inHTML('error_crear_cuenta',`<h6 class="text-danger">Error: Las contraseñas no coinciden</h6>`);
        }
    } 
}

//Para crear nueva cuenta
function nuevaCuenta(){
    //datos de registro
    let datos_personales = {
        nombres: value("CPNnombres"),
        apellidos: value("CPNapellidos"),
        tipo_documento: value("CPNtipo_documento"),
        numero_documento: value("CPNnumero_documento"),
        
        celular: value("CPNtelefono"),
        
        celular2:value("CPNcelular"),
        ciudad: value("CPNciudad"),
        direccion: value("CPNdireccion"),
        barrio: value("CPNbarrio"),
        
        nombre: value("CPNnombre_empresa"),
        correo: value("CPNcorreo"),
        con: value("CPNcontraseña"),
        centro_de_costo: value("CPNcentro_costo"),
        objetos_envio: value("CPNobjetos_envio").split(",").map(s => s.trim()),
        usuario_corporativo: document.getElementById("CPNusuario_corporativo").checked
    }

    let datos_relevantes = {
        ingreso: value("CPNnumero_documento"),
        nombres: value("CPNnombres"),
        apellidos: value("CPNapellidos"),
        contacto: value("CPNtelefono"),
        direccion: `${value("CPNdireccion")}, ${value("CPNbarrio")}, ${value("CPNciudad")}`,
        objetos_envio: value("CPNobjetos_envio").split(",").map(s => s.trim()),
        centro_de_costo: value("CPNcentro_costo"),
        usuario_corporativo: document.getElementById("CPNusuario_corporativo").checked
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

    //retornar si check está activado o desactivado
    var CPNcheck=document.getElementById('CPNdiv_terminos_condiciones').style.display;
    verificarExistencia().then(()=> {
        if(value("CPNnombres")=="" | value("CPNapellidos")==""  | value("CPNnumero_documento")=="" | value("CPNtelefono")=="" | value("CPNcelular")=="" | value("CPNciudad")=="" | value("CPNdireccion")=="" | value("CPNbarrio")=="" |
        value("CPNnombre_empresa")=="" | value("CPNcorreo")=="" | value("CPNcontraseña")=="" | value("CPNrepetir_contraseña")==""){
            //si todos los datos estan vacios 
            inHTML('error_crear_cuenta','<h6 class="text-danger">Error: Ningún campo debe estar vacío</h6>');
            verificador(["CPNnombres", "CPNapellidos", "CPNnumero_documento", 
            "CPNtelefono", "CPNcelular", "CPNciudad", "CPNdireccion", "CPNbarrio", 
            "CPNnombre_empresa", "CPNcorreo", "CPNcontraseña", "CPNrepetir_contraseña"]);
        }else{
            //si todos los datos estan llenos
            console.log(document.getElementById("usuario-existente").style.display)
            let puede_continuar = true;
            if(mostrar_ocultar_registro_bancario == "block"){
                if(value("CPNbanco")=="" | value("CPNnombre_representante")=="" | value("CPNtipo_de_cuenta")=="" | value("CPNnumero_cuenta")=="" | value("CPNconfirmar_numero_cuenta")=="" |
                value("CPNtipo_documento_banco")=="" | value("CPNnumero_identificacion_banco")=="" | value("CPNconfirmar_numero_identificacion_banco")==""){
                    puede_continuar = false;
                    inHTML('error_crear_cuenta',`<h6 class="text-danger">Error: Ningún dato bancario puede estar vacio</h6>`);
                }
            }
            if(document.getElementById("registrar-nueva-cuenta").disabled == true){
                inHTML('error_crear_cuenta','<h6 class="text-danger">Error en registro: el usuario o el centro de costo ya existe</h6>');
            } else if (value("CPNcontraseña")!=value("CPNrepetir_contraseña")){
                inHTML('error_crear_cuenta',`<h6 class="text-danger">Error: Las contraseñas no coinciden</h6>`);
            } else if (CPNcheck!="block"){
                inHTML('error_crear_cuenta',`<h6 class="text-danger">Error: Debes aceptar los términos y condiciones para poder seguir</h6>`);
            } else {
                if(puede_continuar){
                    inHTML('error_crear_cuenta',`<h6 class="text-danger"> DATOS BANCARIOS: "${value("CPNbanco")}" | "${value("CPNnombre_representante")}" | "${value("CPNtipo_de_cuenta")}" | "${value("CPNnumero_cuenta")}" | "${value("CPNconfirmar_numero_cuenta")}" | 
                    "${value("CPNtipo_documento_banco")}" | "${value("CPNnumero_identificacion_banco")}" | "${value("CPNconfirmar_numero_identificacion_banco")}</"h6>`);
    
                    console.log(datos_bancarios);
                    console.log(datos_personales);
                    console.log(datos_relevantes);
    
                    firebase.auth().createUserWithEmailAndPassword(value("CPNcorreo"), value("CPNcontraseña"))
                    .then(function(data){
                        firebase.auth().onAuthStateChanged(function(user) {
                            if(user){
                                firebase.firestore().collection("usuarios").doc(user.uid)
                                .collection("informacion").doc("personal").set(datos_personales)
                                .then(() => {
                                    firebase.firestore().collection("usuarios").doc(user.uid).set(datos_relevantes)
                                    .catch((err) => {
                                        inHTML('error_crear_cuenta',`<h6 class="text-danger">${err} \n
                                            No se pudo crear el identificador de ingreso</h6>`);
                                    })
                                }).then(() => {
                                    firebase.firestore().collection('usuarios').doc(user.uid)
                                    .collection("informacion").doc("bancaria").set(datos_bancarios)
                                    .catch(function(error){
                                        inHTML('error_crear_cuenta',`<h6 class="text-danger">Problemas al agregar Datos bancarios</h6>`);
                                    });
                                }).then(() => {
                                    if(datos_relevantes.usuario_corporativo){
                                        firebase.firestore().collection('usuarios').doc(user.uid)
                                        .collection("informacion").doc("heka").set({
                                            activar_saldo: true,
                                            fecha: genFecha(),
                                            saldo: 0
                                        })
                                    }
                                }).then(function(){
                                    avisar("¡Cuenta creada con éxito!", 
                                    "User_id = "+ user.uid + "\n Puede ingresar con: " + value("CPNnumero_documento"));
                                })
                                .catch(function(error){
                                    inHTML('error_crear_cuenta',`<h6 class="text-danger">${error}</h6>`);
                                });
                            }else{}
                        })
    
                    })
                    .catch(function (error) {
                        // Handle Errors here.
                        var errorCode = error.code;
                        var errorMessage = error.message;
                        
                        if(errorCode=="auth/invalid-email"){
                        errorCode="Correo invalido";
                        }
                        if(errorMessage=="The email address is badly formatted."){
                        errorMessage="El correo es incorrecto";
                        }
                        if(errorCode=="auth/weak-password"){
                        errorCode="Contraseña débil";
                        }
                        if(errorMessage=="Password should be at least 6 characters"){
                        errorMessage="La contraseña debe ser mínimo de 6 caracteres";
    
                        }
                        if(errorCode=="auth/email-already-in-use"){
                        errorCode="Correo en uso";
                        }
                        if(errorMessage=="The email address is already in use by another account."){
                        errorMessage="EL correo ya está registrado";
                        }
                        inHTML('error_crear_cuenta',`<h6 class="text-danger">${"error: "+errorCode+" | "+errorMessage}</h6>`);
    
                        // ...
                    });
                }
            }
        } 
    })
}

//Verifica que el usuario a crear no exista ni el centro de costo que se le quiere asignar
async function verificarExistencia(){
    await firebase.firestore().collection("usuarios").get()
    .then((querySnapshot) => {
        let existe_usuario = false, existe_centro_costo = false
        querySnapshot.forEach(doc => {
            if(doc.data().ingreso == value("CPNnumero_documento")){
                document.getElementById("registrar-nueva-cuenta").disabled = true;
                existe_usuario = true;
            }
            if(doc.data().centro_de_costo == value("CPNcentro_costo")){
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

// Verificar que el docuento de identificacion es unico
document.getElementById("CPNnumero_documento").addEventListener("blur", () => {
    verificarExistencia();
});

// Verificar que el centro de costo es unico
document.getElementById("CPNcentro_costo").addEventListener("blur", () => {
    verificarExistencia();
});


//esta funcion utilizara a otra para retornarme informacion basica del usuario
function buscarUsuarios(){
    document.getElementById("cargador-usuarios").classList.remove("d-none");
    let busqueda = ["!=", ""];
    if(value("buscador-de-usuarios")){
        busqueda = ["==", value("buscador-de-usuarios")];
    }
    inHTML("mostrador-usuarios", "");
   firebase.firestore().collection("usuarios").limit(12).where("ingreso", busqueda[0], busqueda[1]).get()
    .then((querySnapshot) => {
        querySnapshot.forEach((doc) => {
            document.getElementById("mostrador-usuarios").innerHTML += mostrarUsuarios(doc.data(), doc.id);
            if(busqueda[0] == "=="){
                document.getElementById("usuario-seleccionado").setAttribute("data-id", doc.id);
                seleccionarUsuario(doc.id);
            }
        })
    }).then(() => {
        if(document.getElementById("mostrador-usuarios").innerHTML == ""){
            inHTML("mostrador-usuarios", "<div class='card text-danger'><h5 class='m-3'>Lo sentimos, Sin resultados para tu búsqueda</h5></div>")
        } else {
            let botones = document.querySelectorAll('[data-funcion="ver-eliminar"]');
            for(let boton of botones){
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
        diferencia: $("#aumentar_saldo").val() || 0
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
                        medio: "Administrador: " + localStorage.user_id
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
async function prueba(usuario){
    try {
        let buscador = await firebase.firestore().collection("usuarios").doc("22032021")
        .get().then((doc) => {
            let pagos = doc.data().pagos;
            pagos.filter((d) => {
                return d.user == usuario
            });
            return pagos
        }) 


        async function miradorUsuario(usuario){
            let res = []
            await firebase.firestore().collection("usuarios").doc(usuario).collection("movimientos")
            .get().then((querySnapshot) => {
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
            console.log(data2);
            miradorPrueba(usuario).then(d2 => data1 = d2)
            .then(() => {
                let saldo_legal = data1.reduce((a,b) => {
                    return parseInt(a) + parseInt(b.diferencia)
                }, 0);

                console.log(buscador.length == data2.length);
                console.log(buscador.length == data1.length);
                firebase.firestore().collection('usuarios').doc(usuario)
                .collection("informacion").doc("heka")
                .get().then((doc) => {
                    if(doc.exists){
                        console.log("Saldos coinciden? => ", parseInt(doc.data().saldo) == saldo_legal);
                    }
                });
            });
        })


    } catch(error) {
        console.log(error)
    }
}

// prueba("nk58Yq6Y1GUFbaaRkdMFuwmDLxO2");