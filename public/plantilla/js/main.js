var firebaseConfig = {
    apiKey: "AIzaSyCtzXKSoweSMLPej5-MbkTfQzFH719y-MM",
    authDomain: "hekaapp-23c89.firebaseapp.com",
    databaseURL: "https://hekaapp-23c89.firebaseio.com",
    projectId: "hekaapp-23c89",
    storageBucket: "hekaapp-23c89.appspot.com",
    messagingSenderId: "539740310887",
    appId: "1:539740310887:web:66f9ab535d18addeb173c2"
};
// Initialize Firebase
firebase.initializeApp(firebaseConfig);
var db=firebase.database();
var autenticacion=firebase.auth();

function value(request) {
    return document.getElementById(request).value;
}
function asignacion(request, response) {
    return document.getElementById(request).value = response;
  }

  function validar_email(email) {
    var regex = /^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/;
    return regex.test(email) ? true : false;
  }
  function asignacionStyle() {
   cargarHtml("preciosEnvios-mostrar-ocultar","");
   
}
function printHTML(request, response) {
  return document.getElementById(request).innerHTML += response;
}
function inHTML(request, response) {
    return document.getElementById(request).innerHTML = response;
  }
  //DESACTIVAR MODULO
function desactivar(a) {
    var x = document.getElementById(a);
    x.style.display = "none";
}
////////////validar email////////////7
function validar_email(email) {
    var regex = /^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/;
    return regex.test(email) ? true : false;
  }


  function soloNumeros(campo){
    var textoFinal="";
    
    var numeros="1234567890";
    for(let i=0;i<campo.length;i++){
      for(let j=0;j<numeros.length;j++){
        if(campo[i]==numeros[j]){
          textoFinal+=campo[i];
        }

      }

    }
    return textoFinal;
    
  }
 
  
//ACTIVAR MODULO
function activar(a) {
    var x = document.getElementById(a);
    x.style.display = "block";
}
function activar_query(a) {
  var x = document.querySelector(a);
  x.style.display = "block";
}
// Iniciar sesion
  function iniciarSesion() {

    var email = value('usuario');
    var password = value('contrasena');

    
    
    
    firebase.auth().signInWithEmailAndPassword(email, password)
        
        .then(function (data) {
            
        })

        .catch(function (error) {

            var errorCode = error.code;
            var errorMessage = error.message;
            if(errorCode=="auth/invalid-email"){
              errorCode="Correo invalido";
            }
            if(errorCode=="auth/wrong-password"){
              errorCode="Contraseña incorrecta";
            }
            if(errorCode=="auth/user-not-found"){
              errorCode="Este correo no está registrado, por favor crea una cuenta";
            }

            if(errorMessage=="The email address is badly formatted."){
              errorMessage="El correo está incorrecto";
            }
            if(errorMessage=="The password is invalid or the user does not have a password."){
              errorMessage="La contraseña no es válida o el usuario no tiene contraseña.";
            }
            if(errorMessage=="There is no user record corresponding to this identifier. The user may have been deleted."){
              errorMessage="No hay ningún registro de usuario que corresponda a este identificador. Es posible que se haya eliminado al usuario.";
            }
            inHTML('inicio2',`<h5 class="text-danger" >error: ${"| "+errorCode+" | "+errorMessage}</h5>`);
           

        });
}

function crearCuenta(){
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
  //var CPNcorreo=validar_email(CPNcorreo);
  var CPNcontraseña=value('CPNcontraseña');
  var CPNrepetir_contraseña=value('CPNrepetir_contraseña');

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
         

  firebase.database().ref('usuarios').child(user.uid).set({
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
            

            //////datos bancarios
            banco: CPNbanco,
            nombre_banco: CPNnombre_representante,
            tipo_de_cuenta: CPNtipo_de_cuenta,
            numero_cuenta: CPNnumero_cuenta,
            tipo_documento_banco: CPNtipo_documento_banco,
            numero_iden_banco: CPNnumero_identificacion_banco

            
            
            
          }).then(function(data){
            window.location.href='/index-antiguo.html';
          }).catch(function(error){
            inHTML('error_crear_cuenta',`<h6 class="text-danger">${codigoUsuario}</h6>`);
          });
        


          

        }else{

        }
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
          
 
  

  firebase.database().ref('usuarios').child(user.uid).set({
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
            codigo: "",

            //////datos bancarios
            banco: "",
            nombre_banco: "",
            tipo_de_cuenta: "",
            numero_cuenta: "",
            tipo_documento_banco: "",
            numero_iden_banco: "",

            
            
            
          }).then(function(data){
            window.location.href='/plataforma.html';
          }).catch(function(error){
            inHTML('error_crear_cuenta',`<h6 class="text-danger">${codigoUsuario}</h6>`);
          });
        


          

        }else{

        }
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

function crearCuentaEmpresa(){
  //datos de registro 
  var CErazon_social=value('CErazon_social'); 
  var CPNnombres=value('CEnombres');
   var CPNapellidos=value('CEapellidos');
   var CPNtipo_documento=value('CEtipo_documento');
   var CPNnumero_documento=value('CEnumero_documento');
   var CPNtelefono=value('CEtelefono');
   var CPNcelular=value('CEcelular');
   var CPNciudad=value('CEciudad');
   var CPNdireccion=value('CEdireccion');
   var CPNbarrio=value('CEbarrio');
   var CPNnombre_empresa=value('CEnombre_empresa');
   var CPNcorreo=value('CEcorreo');
   //var CPNcorreo=validar_email(CPNcorreo);
   var CPNcontraseña=value('CEcontraseña');
   var CPNrepetir_contraseña=value('CErepetir_contraseña');
 
   ///div datos bancarios
   var mostrar_ocultar_registro_bancario= document.getElementById('mostrar-ocultar-registro-bancario-empresa').style.display;
   //datos bancarios
   var CPNbanco=value('CEbanco');
   var CPNnombre_representante=value('CEnombre_representante');
   var CPNtipo_de_cuenta=value('CEtipo_de_cuenta');
   var CPNnumero_cuenta=value('CEnumero_cuenta');
   var CPNconfirmar_numero_cuenta=value('CEconfirmar_numero_cuenta');
   var CPNtipo_documento_banco=value('CEtipo_documento_banco');
   var CPNnumero_identificacion_banco=value('CEnumero_identificacion_banco');
   var CPNconfirmar_numero_identificacion_banco=value('CEconfirmar_numero_identificacion_banco');
 
   //retornar si check está activado o desactivado
   var CPNcheck=document.getElementById('CEdiv_terminos_condiciones').style.display;
   
 
 
 
   
   
   
   if(CErazon_social=="" |CPNnombres=="" | CPNapellidos==""  | CPNnumero_documento=="" | CPNtelefono=="" | CPNcelular=="" | CPNciudad=="" | CPNdireccion=="" | CPNbarrio=="" |
   CPNnombre_empresa=="" | CPNcorreo=="" | CPNcontraseña=="" | CPNrepetir_contraseña==""){
     //si todos los datos estan vacios 
     inHTML('error_crear_cuenta_empresa','<h6 class="text-danger">Ningún campo debe estar vacío</h6>');
     
   }else{
     //si todos los datos estan llenados
 
     //si la contraseña coincide
     if(CPNcontraseña==CPNrepetir_contraseña){
 
 
     // si el check de datos bancarios esta activado
     if(mostrar_ocultar_registro_bancario=="block"){
       
       //si todos los datos bancarios estan en blanco
       if(CPNbanco=="" | CPNnombre_representante=="" | CPNtipo_de_cuenta=="" | CPNnumero_cuenta=="" | CPNconfirmar_numero_cuenta=="" |
       CPNtipo_documento_banco=="" | CPNnumero_identificacion_banco=="" | CPNconfirmar_numero_identificacion_banco==""){
   
         inHTML('error_crear_cuenta_empresa',`<h6 class="text-danger">Ningún dato bancario puede estar vacio</h6>`);
       
      //si los datos bancarios estan llenos   
       }else{
         //si numero de cuenta coincide
         if(CPNnumero_cuenta==CPNconfirmar_numero_cuenta){
           //si numero de identificacion coindice
           if(CPNnumero_identificacion_banco==CPNconfirmar_numero_identificacion_banco){
             
             
             //si check de terminos y condiciones está activo
 
             if(CPNcheck=="block"){
             
             //COMPROBACIONES CORRECTAS CON DATOS BANCARIOS
               inHTML('error_crear_cuenta_empresa',`<h6 class="text-danger">${"CON DATOS BANCARIOS: "+CErazon_social+"|"+CPNbanco+"|"+CPNnombre_representante+"|"+CPNtipo_de_cuenta+"|"+CPNnumero_cuenta+"|"+CPNconfirmar_numero_cuenta+"|"+
         CPNtipo_documento_banco+"|"+CPNnumero_identificacion_banco+"|"+CPNconfirmar_numero_identificacion_banco}</h6>`);
               //si check de terminos y condiciones está desactivado
       }else{
         inHTML('error_crear_cuenta_empresa',`<h6 class="text-danger">Debes aceptar los términos y condiciones para seguir</h6>`);
             }
             
         
         //si numero de identificacion no coincide
           }else{
             inHTML('error_crear_cuenta_empresa',`<h6 class="text-danger">Los números de identificación no coinciden</h6>`);
 
           }
         //si numero de cuenta no coincide
         }else{
           inHTML('error_crear_cuenta_empresa',`<h6 class="text-danger">Los números de cuenta no coinciden</h6>`);
 
         }
         
         
   
       }
       
       //si el check de datos bancarios está desactivado
     }else{
       
       //si check de terminos y condiciones está activado
       if(CPNcheck=="block"){
 
         //COMPROBACIONES CORRECTAS SIN DATOS BANCARIOS
       inHTML('error_crear_cuenta_empresa',`<h6 class="text-danger">${"SIN DATOS BANCARIOS: "+CErazon_social+"|"+CPNnombres+"|"+CPNapellidos+"|"
       +CPNtipo_documento+"|"+CPNnumero_documento+"|"+CPNtelefono+"|"+CPNcelular+"|"+CPNciudad+"|"+CPNdireccion+"|"+CPNbarrio+"|"
       +CPNnombre_empresa+"|"+CPNcorreo+"|"+CPNcontraseña+"|"+CPNrepetir_contraseña}</h6>`);
     //si check de terminos y condiciones NO está activado  
     }else{
       inHTML('error_crear_cuenta_empresa',`<h6 class="text-danger">Debes aceptar los terminos y condiciones para poder seguir</h6>`);
 
       }
 
 
     }
 //si la contraseña no coincide
   }else{
     inHTML('error_crear_cuenta_empresa',`<h6 class="text-danger">Las contraseñas no coinciden</h6>`);
 
   }
     
 
   }
 
   
   
   
   
   
   
   
   /*
   if(CPNnombres=="" || CPNapellidos=="" || Ccorreo=="" || Ccontraseña==""){
     inHTML('error_crear_cuenta','<h6 class="text-danger">Ningún campo debe estar vacío</h6>');
 
   }else{
   if(Ccorreo_validado==false){
     inHTML('error_crear_cuenta',`<h6 class="text-danger">Correo invalido </h6>`);
   
    
   }else{
     firebase.auth().createUserWithEmailAndPassword(Ccorreo, Ccontraseña)
     .then(function(data){
 
       firebase.auth().onAuthStateChanged(function(user) {
 
         if(user){
           firebase.database().ref('usuarios').child(user.uid).set({
             username: Cprimernombre ,
             email: Csegundonombre
             
           });
           inHTML('error_crear_cuenta',`<h6 class="text-danger">Iniciado </h6>`);
 
         }else{
 
         }
       })
 
     })
     
     .catch(function (error) {
       // Handle Errors here.
       var errorCode = error.code;
       var errorMessage = error.message;
       inHTML('error_crear_cuenta',`<h6 class="text-danger">${"error: "+errorCode+" | "+errorMessage}</h6>`);
     
       // ...
     });
   }
 }
 */
 
 
 
 
 }



function pruebacheck(){
  var id_banco=document.getElementById('mostrar-ocultar-registro-bancario');
  var chekBanco=document.getElementById('checkbox-banco');
  
  if(chekBanco.checked){
    id_banco.style.display="block";
  }else{
    id_banco.style.display="none";
  }
}

function checkTerminosCondiciones(){
// check Terminos y condiciones
var check=document.getElementById('CPNcheck_terminos_condiciones');
var div=document.getElementById('CPNdiv_terminos_condiciones');
if(check.checked){
  div.style.display="block";
}else{
  div.style.display="none";
}

}

function checkTerminosCondicionesEmpresa(){
  var check=document.getElementById('CEterminos_y_condiciones');
var div=document.getElementById('CEdiv_terminos_condiciones');
if(check.checked){
  div.style.display="block";
}else{
  div.style.display="none";
}
}

function pruebacheck_empresa(){
  var id_banco=document.getElementById('mostrar-ocultar-registro-bancario-empresa');
  var chekBanco=document.getElementById('checkbox-banco-empresa');
  
  if(chekBanco.checked){
    id_banco.style.display="block";
  }else{
    id_banco.style.display="none";
  }
}


function check_pago_contraentrega(){
  //tipo de envio
  var id_tipoenvio=document.getElementById('envio_tipo');
  //conbro al cliente
 
// activar o desactivar input de recaudo
var valor_recaudo=document.getElementById('valor-recaudo');
//Valor de recaudo
var recaudo=document.getElementById('valor-a-recaudar');
//Check pago contraentrega
  var check_cobr=document.getElementById('check-cobr');
  //check cobrar a remitente
  var check_cobrar_remite=document.getElementById('check-cobrar-remite');
  //check cobrar destino
  var check_cobrar_destino=document.getElementById('check-cobrar-destino');
//texto envio
  var texto_envio=document.getElementById('texto_envio');
 
  
  
  
  
  if(check_cobr.checked){
    id_tipoenvio.value="RECAUDO";
    console.log(id_tipoenvio.value);
    
    recaudo.value="";
    texto_envio.innerHTML=`<h7  class="h8 mb-10 text-gray-500">NOTA: En esta opción tu cliente pagará el valor del producto al recibir, de dicho valor se descontará el costo de envío y el restante será consignado a tu cuenta bancaria.</h7>`;
    check_cobrar_remite.checked=false;
    check_cobrar_destino.checked=false;
    valor_recaudo.style.display="block";
  }else{
    valor_recaudo.style.display="none";
    //id_tipoenvio.value="0";
    //idasumecosto.value="0";
    //recaudo.value="0";
    texto_envio.innerHTML="";
    
    
  }
}

function check_cobrar_remite(){
  //tipo de envio
  var id_tipoenvio=document.getElementById('envio_tipo');
  //conbro al cliente
 
// activar o desactivar input de recaudo
var valor_recaudo=document.getElementById('valor-recaudo');
//Valor de recaudo
var recaudo=document.getElementById('valor-a-recaudar');
//Check pago contraentrega
  var check_cobr=document.getElementById('check-cobr');
  //check cobrar a remitente
  var check_cobrar_remite=document.getElementById('check-cobrar-remite');
  //check cobrar destino
  var check_cobrar_destino=document.getElementById('check-cobrar-destino');
//texto envio
  var texto_envio=document.getElementById('texto_envio');
 
  
  
  
  
  if(check_cobrar_remite.checked){
    id_tipoenvio.value="COMUN";
   
    recaudo.value="0";
    texto_envio.innerHTML=`<h7  class="h8 mb-10 text-gray-500">NOTA: En esta opción el remitente paga el envío</h7>`;
    check_cobr.checked=false;
    check_cobrar_destino.checked=false;
    valor_recaudo.style.display="none";
  }else{
    //valor_recaudo.style.display="none";
    //id_tipoenvio.value="0";
    //idasumecosto.value="0";
    //recaudo.value="0";
    texto_envio.innerHTML="";
    
    
  }
}

function check_cobrar_destino(){
  //tipo de envio
  var id_tipoenvio=document.getElementById('envio_tipo');
  //conbro al cliente

// activar o desactivar input de recaudo
var valor_recaudo=document.getElementById('valor-recaudo');
//Valor de recaudo
var recaudo=document.getElementById('valor-a-recaudar');
//Check pago contraentrega
  var check_cobr=document.getElementById('check-cobr');
  //check cobrar a remitente
  var check_cobrar_remite=document.getElementById('check-cobrar-remite');
  //check cobrar destino
  var check_cobrar_destino=document.getElementById('check-cobrar-destino');
//texto envio
  var texto_envio=document.getElementById('texto_envio');
 
  
  
  
  
  if(check_cobrar_destino.checked){
    id_tipoenvio.value="CONTRAENTREGA";
   
    recaudo.value="1";
    texto_envio.innerHTML=`<h7  class="h8 mb-10 text-gray-500">NOTA: En esta opción el destinatario paga el envío</h7>`;
    check_cobr.checked=false;
    check_cobrar_remite.checked=false;
    valor_recaudo.style.display="none";
  }else{
    //valor_recaudo.style.display="none";
    //id_tipoenvio.value="0";
    //idasumecosto.value="0";
    //recaudo.value="0";
    texto_envio.innerHTML="";
    
    
  }
}

function cerrarSesion(){
    firebase.auth().signOut().then(function() {
        // Sign-out successful.
        location.href("/index.html");
      }).catch(function(error) {
        // An error happened.
      });
}
function mostrarPrueba(){

    firebase.auth().onAuthStateChanged(function(user) {

    if(user){
        /*
        usuario = firebase.database().ref('usuarios').child(user.uid);
        usuario.on('value', function(snapshot) {

            var codigoFirebase= snapshot.val().codigo;
            cargarHtml("inicio",`<h1>${codigoFirebase}</h1>`);
        
                
        });
        */
       
       if(document.getElementById('login-mostrar-ocultar')){
       desactivar('login-mostrar-ocultar');
       }
       if(document.getElementById('sesionIniciada-mostrar-ocultar')){
        activar('sesionIniciada-mostrar-ocultar');
       }
        
        usuario = firebase.database().ref('usuarios').child(user.uid);
      usuario.on('value', function(snapshot) {
        if(document.getElementById('uidFirebase')){
          asignacion("uidFirebase", user.uid);
          }
          if(document.getElementById('uidParaRelacion')){
            asignacion("uidParaRelacion", user.uid);
            }
            if(document.getElementById('id-abrir-guia')){
              asignacion("id-abrir-guia", user.uid);
              }

            
            if(document.getElementById('idUsuario')){
              inHTML("idUsuario", `Bienvenid@ ${snapshot.val().nombre} <sup></sup>`);
              }
              if(document.getElementById('idUsuario2')){
                inHTML("idUsuario2", `${snapshot.val().nombre}`);
                }
        if(document.getElementById('ciudadRFirebase')){
        asignacion("ciudadRFirebase", snapshot.val().ciudad);
        }
        if(document.getElementById('codigoFirebase')){
        asignacion("codigoFirebase", snapshot.val().codigo);
        }
        if(document.getElementById('codigoFirebase1')){
        asignacion("codigoFirebase1", snapshot.val().codigo);
        }
        if(document.getElementById('codigoFirebase2')){
        asignacion("codigoFirebase2", snapshot.val().codigo);
        }
        if(document.getElementById('codigoFirebase3')){
        asignacion("codigoFirebase3", snapshot.val().codigo);
        }
        if(document.getElementById('codigoFirebase4')){
        asignacion("codigoFirebase4", snapshot.val().codigo);
        }
        if(document.getElementById('nomRem')){
        asignacion("nomRem", snapshot.val().nombre);
        }
        if(document.getElementById('dirRem')){
        asignacion("dirRem", snapshot.val().direccion);
        }
        if(document.getElementById('barrioRem')){
        asignacion("barrioRem", snapshot.val().barrio);
        }
        if(document.getElementById('celRem')){
        asignacion("celRem", snapshot.val().celular);
        }
        
       

        ///////// llenar tabla-novedades /////////////////////////////7777
//if(document.getElementById('tabla-novedades')){
if(document.getElementById('tabla-novedades')){
  inHTML("tabla-novedades", "");
  }
  if(document.getElementById('tabla-enproceso')){
    inHTML("tabla-enproceso", "");
    }    
   ///////////////////////Mostrar Guias/////////////////////////////////
    

      

      //////////////////////Para crear relacion de envio/////////////
      

       

      /////////////////////////////////////////////////////////


      /////////////////////////////Imprimir usuarios registrados////////////////
      var referenciaUsuarios = db.ref('usuarios');
      referenciaUsuarios.on('value', function (datas) {
        
        var data = datas.val();
        $.each(data, function (nodo, value) {
   
      var sendData = `
    
          <tr>
          
          <td>nombre: ${value.nombre}</td>
          <td>nombre: ${value.correo}</td>
          <td>nombre: ${value.celular}</td>
          <td>codigo: ${value.codigo}</td>
          <td>banco: ${value.banco}</td>
          <td>banco: ${value.tipo_de_cuenta}</td>
          <td>numero de cuenta: ${value.numero_cuenta}</td>
          <td>documento de identidad: ${value.numero_iden_banco}</td>
          
          </tr>`;
            if(document.getElementById('tabla-usuarios')){
              
              printHTML('tabla-usuarios', sendData);
            }
         
          
        





        
          
        });
      });
      //////////////////////////////////////////////////////////////
    });

       



    }else{
      if(document.getElementById('login-mostrar-ocultar')){      
      activar('login-mostrar-ocultar');
      }
      if(document.getElementById('sesionIniciada-mostrar-ocultar')){
            desactivar('sesionIniciada-mostrar-ocultar');
      }  
            if(document.getElementById("codigo-usuario")){
            asignacion("codigo-usuario","no inicio");
          }
          }

    

    });

}
mostrarPrueba();


//llenar tabla de relación de envío

function llenarTablaRelacionEnvio(){

  firebase.auth().onAuthStateChanged(function(user) {

    if(user){


      ///////// llenar tabla-novedades /////////////////////////////7777
//if(document.getElementById('tabla-novedades')){
if(document.getElementById('tabla-relacion')){
  inHTML("tabla-relacion", "");
  }
  
    /*
    var contar=0;   
  var reference = db.ref('RelacionEnvio').child(user.uid);
      reference.once('value', function (datas) {
        var data = datas.val();
        $.each(data, function (nodo, value) {
          if(document.getElementById('fecha_inicio')){
            var fecha_inicio=document.getElementById('fecha_inicio').value;
            }
            if(document.getElementById('fecha_final')){
            var fecha_final=document.getElementById('fecha_final').value;
            }
            console.log(fecha_inicio+"|"+fecha_final);
   
            var fechaf=Date.parse(value.fecha);
            var fechaFire=new Date(fechaf);
   
            var fechaI=Date.parse(fecha_inicio); 
            var fechaIni=new Date(fechaI);
   
            var fechaff=Date.parse(value.fecha);
            var fechaFinalF=new Date(fechaff);
   
            var fechafff=Date.parse(fecha_final);
            var fechaF= new Date(fechafff);

            
   
            
              if(fechaFire>= fechaIni&& fechaFinalF <= fechaF){
              contar=contar+1;
          console.log(contar);
          var sendData2 = tableRelacion(value.codTrans,value.fecha,value.numeroRelacion,value.ruta);
            if(document.getElementById('tabla-relacion')){
              
              printHTML('tabla-relacion', sendData2);
            }
          }
         
          
        





        
          
        });
      });

      */
      

      



    }else{

    }

  });
  

}
llenarTablaRelacionEnvio();




function fechaActual(){
  var now;
  let date = new Date()
  let day = date.getDate();
  let month = date.getMonth() + 1;
  let year = date.getFullYear();
  
  if(day<10){
    day=`0${day}`;
  }
  
  if(month < 10){
     
     now=`${year}-0${month}-${day}`;
  }else{
    now=`${year}-${month}-${day}`;
  }
  if(document.getElementById('fecha_inicio')){
  document.getElementById('fecha_inicio').value=now;
  }
  if(document.getElementById('fecha_final')){
  document.getElementById('fecha_final').value=now;
  }
  
}
fechaActual();


function cambiarFecha(){
location.href='#tabla-guias';
if(document.getElementById('tabla-guias')){
inHTML('tabla-guias','');
}

  if(document.getElementById('guiaRelacion')){
    
    document.getElementById('guiaRelacion').value="";
    }
    if(document.getElementById('nodoRelacion')){
    
      document.getElementById('nodoRelacion').value="";
      }
     
  
historialGuias();
}

function cambiarFechaRelacion(){
  location.href='#tabla-relacion';
  if(document.getElementById('tabla-relacion')){
  inHTML('tabla-relacion','');
  }
  llenarTablaRelacionEnvio();
  }

/////restablecer contraseña 
function restartContrasena(){
  
var emailAddress = value('correo_recuperacion');


autenticacion.sendPasswordResetEmail(emailAddress).then(function() {
inHTML('error_restart',`<h6>Hemos enviado  un correo de restablecimiento a tu correo, por favor verifica</h6>`);
  console.log('funciono');
  window.location.href='/plataforma.html';

 
}).catch(function(error) {
  asignacion('error_restart','error: ');
  console.log(error.message);
  inHTML('error_restart',`<h6>error: Verifica que el correo se haya escrito de manera correcta y/o no registrado en nuestro sistema</h6>`);
});
}

function tableGuias(uid,fecha,nomDes,fletetotal,costoManejo,valorOtrosRecaudos,comision_heka,recaudo,tipo_envio,linkguia,nomRem,dirDes,contenido,peso,numero_guia,nomDes,ciudadD,trans) {
  
var flete=parseInt(fletetotal);
var manejo=parseInt(costoManejo);
var costoRecaudo=parseInt(valorOtrosRecaudos);
var comision=parseInt(comision_heka);

var costoEnvio=flete+manejo+costoRecaudo+comision;

if(trans=="ENVIA"){
var logo=`<img src="img/2001.png" alt="" height="30" width="50">`;
}else{
if(trans=="TCC SA"){
  logo=`<img src="img/logo-tcc.png" alt="" height="50" width="70">`;
}else{
  logo="Creando....";
}
}
  
  return `
  
  <tr>
  <!--
  <td>
  
  <input class="btn btn-danger" type="checkbox">
  
  </td>
  -->
  <td>${logo}</td>
  <td>
  <button  onclick="abrirGuias('${linkguia}','${uid}')" class="btn btn-primary btn-user btn-block">
  Buscar
</button>


  
  <td>
  <form action="documentoGuia" method="post">
      <input type="hidden" name="paraGuia" value="${linkguia}">
      
      <button class="btn btn-warning" type="submit">Guia</button>
    
      <h1></h1>
      
      </form>
      <form action="rotuloHeka" method="post">
      <input type="hidden" name="guia"         value="${numero_guia}">
      <input type="hidden" name="remitente"    value="${nomRem}">
      <input type="hidden" name="destinatario" value="${nomDes}">
      <input type="hidden" name="direccion"    value="${dirDes}">
      <input type="hidden" name="ciudad"       value="${ciudadD}">
      <input type="hidden" name="contenido"    value="${contenido}">
      <input type="hidden" name="peso"         value="${peso}">
      <input type="hidden" name="transportadora"         value="${trans}">
      
      <button class="btn btn-danger" type="submit">Rotulo</button>
      </form>
      </td>
      <!--
      <td>
  <form action="rotuloHeka" method="post">
      <input type="hidden" name="guia"         value="${numero_guia}">
      <input type="hidden" name="remitente"    value="${nomRem}">
      <input type="hidden" name="destinatario" value="${nomDes}">
      <input type="hidden" name="direccion"    value="${dirDes}">
      <input type="hidden" name="ciudad"       value="${ciudadD}">
      <input type="hidden" name="contenido"    value="${contenido}">
      <input type="hidden" name="peso"         value="${peso}">
      <input type="hidden" name="transportadora"         value="${trans}">
      
      <button class="btn btn-danger" type="submit">Rotulo</button>
      </form>
      </td>
-->
      <form action="verEstado" method="post">
    <input type="hidden" name="paraVerEstado" value="">
    <!--
    <td><button class="btn btn-danger" type="submit">Ver estado</button></td>
    -->
    </form>
  
  <td>${numero_guia}</td>
  
  <td>${fecha}</td>
  
  <td>${nomRem}</td>
  
  <td>${ciudadD}</td>
  <td>${nomDes}</td>
  <td>${tipo_envio}</td>
  <td>${recaudo}</td>
  <td>${costoEnvio}</td>
  
  
 
  
  

   


  
   
  
    
    
   
</tr>`
    ;
}

function tableRelacion(contar2,uid,nodo,fecha,nomDes,fletetotal,costoManejo,valorOtrosRecaudos,comision_heka,recaudo,tipo_envio,linkguia,nomRem,dirDes,contenido,peso,numero_guia,nomDes,ciudadD,trans) {
  
  var flete=parseInt(fletetotal);
  var manejo=parseInt(costoManejo);
  var costoRecaudo=parseInt(valorOtrosRecaudos);
  var comision=parseInt(comision_heka);
  
  var costoEnvio=flete+manejo+costoRecaudo+comision;
  
  if(trans=="ENVIA"){
  var logo=`<img src="img/2001.png" alt="" height="30" width="50">`;
  var codigoTrans="29";
  }else{
  if(trans=="TCC SA"){
    logo=`<img src="img/logo-tcc.png" alt="" height="50" width="70">`;
    var codigoTrans="1010";
  }else{
    logo="Creando....";
  }
  }
    
    return `
    
    <tr>
    
    <td>
    
    <input class="btn btn-danger" id="check${contar2-1}" type="checkbox" onchange="sumarguia(${contar2-1});">
    <input class="btn btn-danger" value="${contar2-1}" type="hidden">
    <input class="btn btn-danger" id="numero_guia${contar2-1}" value="${numero_guia}" type="hidden">
    <input class="btn btn-danger" id="nodo${contar2-1}" value="${nodo}" type="hidden">
    <input class="btn btn-danger" id="codigoTrans" value="${codigoTrans}" type="hidden">

    
    
    </td>
    
    <td>${logo}</td>
    <!--
    <td>
    <form action="documentoGuia" method="post">
        <input type="hidden" name="paraGuia" value="${linkguia}">
        
        <button class="btn btn-warning" type="submit">Guia</button>
      
        <h1></h1>
        
        </form>
        <form action="rotuloHeka" method="post">
        <input type="hidden" name="guia"         value="${numero_guia}">
        <input type="hidden" name="remitente"    value="${nomRem}">
        <input type="hidden" name="destinatario" value="${nomDes}">
        <input type="hidden" name="direccion"    value="${dirDes}">
        <input type="hidden" name="ciudad"       value="${ciudadD}">
        <input type="hidden" name="contenido"    value="${contenido}">
        <input type="hidden" name="peso"         value="${peso}">
        <input type="hidden" name="transportadora"         value="${trans}">
        
        <button class="btn btn-danger" type="submit">Rotulo</button>
        </form>
        </td>
        -->
        <!--
        <td>
    <form action="rotuloHeka" method="post">
        <input type="hidden" name="guia"         value="${numero_guia}">
        <input type="hidden" name="remitente"    value="${nomRem}">
        <input type="hidden" name="destinatario" value="${nomDes}">
        <input type="hidden" name="direccion"    value="${dirDes}">
        <input type="hidden" name="ciudad"       value="${ciudadD}">
        <input type="hidden" name="contenido"    value="${contenido}">
        <input type="hidden" name="peso"         value="${peso}">
        <input type="hidden" name="transportadora"         value="${trans}">
        
        <button class="btn btn-danger" type="submit">Rotulo</button>
        </form>
        </td>
  -->
        <form action="verEstado" method="post">
      <input type="hidden" name="paraVerEstado" value="">
      <!--
      <td><button class="btn btn-danger" type="submit">Ver estado</button></td>
      -->
      </form>
    
    <td>${numero_guia}</td>
    
    <td>${fecha}</td>
    
    <td>${nomDes}</td>
    
    <td>${ciudadD}</td>
    <td>${nomDes}</td>
    <td>${tipo_envio}</td>
    <td>${recaudo}</td>
    
    
    
   
    
    
  
     
  
  
    
     
    
      
      
     
  </tr>`
      ;
  }

/*
function tableRelacion(codTrans,fecha,numeroRelacion,ruta) {

  if(codTrans=="1010"){

    var tipodelink=`<a class="btn btn-warning" href="http://aveonline.co/app/modulos/paqueteo/impresiones.masivas.tcc.php?id_relacion=${numeroRelacion}&imprimir=1">Guias</a>`;

  }else{
    tipodelink=`<form action="documentoGuia" method="post">
    <input type="hidden" name="paraGuia" value="">
    
    <button disabled=disabled class="btn btn-warning" type="submit">Guias</button>
  
    
    </form>`;
  }
  return `
  
  <tr>
  <!--
  <td>
  
  <input class="btn btn-danger" type="checkbox">
  
  </td>
  -->
  <!--
  <td>
  ${tipodelink}
      </td>
      <td>
  <form action="rotuloHeka" method="post">
      <input type="hidden" name="guia"         value="">
      
      
      <button class="btn btn-danger" type="submit">Rotulos</button>
      </form>
      </td>
      -->
      <td>
      <form action="descargarRelacion" method="post">
    <input type="hidden" name="ruta" value="${ruta}">
    
    <button class="btn btn-danger" type="submit">Descargar</button>
    </form></td>
    
    </form>
  
  <td>${fecha}</td>
  
  <td>${numeroRelacion}</td>
  
  
  
  
 
  
  

   


  
   
  
    
    
   
</tr>`
    ;
}
*/



//bloquear boton

function sumarguia(id){
  //check
  var check=document.getElementById('check'+id);
  //valor de la guia y nodo
  var numero_guia=document.getElementById('numero_guia'+id);
  var nodo=document.getElementById('nodo'+id);
  //aquí se suman las guías y los codigos push
  var guiaRelacion=document.getElementById('guiaRelacion');
  var nodoRelacion=document.getElementById('nodoRelacion');
  //codigo de cada guia
  var codigoTrans=document.getElementById('codigoTrans');
  //cambiar en el formulario el codigo 
  var codigoTransportadora=document.getElementById('codigoTransportadora');
  
  if(check.checked){
    guiaRelacion.value+=numero_guia.value+",";
    nodoRelacion.value+=nodo.value+",";
    codigoTransportadora.value=codigoTrans.value;
    
   
  }else{
    guiaRelacion.value=guiaRelacion.value.replace(numero_guia.value+",","");
    nodoRelacion.value=nodoRelacion.value.replace(nodo.value+",","");
    
  }
  
  
  
}

function crearConsolidado(){
  ////////variables a separar por comas/////////////
  //////nodo
  var now;
  let date = new Date()
  let day = date.getDate()
  let month = date.getMonth() + 1
  let year = date.getFullYear()
  if (day < 10) {
    day = `0${day}`;
  }
  if (month < 10) {

    now = `${year}-0${month}-${day}`;
  } else {
    now = `${year}-${month}-${day}`;
  }
  var nodoArray=[];
  var contNodo=0;
  var nodoTexto="";
  /////////////////////variables////////////////
var guiaRelacion=document.getElementById('guiaRelacion');
var nodoRelacion=document.getElementById('nodoRelacion');
var uidParaRelacion=document.getElementById('uidParaRelacion');
var codigoTransportadora=document.getElementById('codigoTransportadora');
///////////////////////recorrer arreglo y separar por coma los nodos//////////////////////////////

  //////////////////guardar consolidado de envíos
  var push=db.ref('ConsolidadosNuevos').child(uidParaRelacion.value).push().getKey();
  
  ////////////////// para crear consolidado
 
 if(guiaRelacion.value!="" && nodoRelacion.value!=""){
  db.ref('consolidados').child(push).set({
    nodo: push,
    guias: guiaRelacion.value,
    uid: uidParaRelacion.value,
    codigoTrans:codigoTransportadora.value,
    fecha: now,
    relacionenvio: "Creando....",
      rutaimpresion: "Creando...."
}, (error) =>{
  if(error){
    window.alert('Error al guardar consolidado');
  }else{
    db.ref('ConsolidadosNuevos').child(uidParaRelacion.value).child(push).set({
      nodo: push,
      guias: guiaRelacion.value,
      uid: uidParaRelacion.value,
      codigoTrans:codigoTransportadora.value,
      fecha: now,
      relacionenvio: "Creando....",
      rutaimpresion: "Creando...."
  }, (error) =>{
    if(error){
      window.alert('Error al guardar consolidado');
    }else{
      for(let i=0;i<nodoRelacion.value.length;i++){
  
        nodoTexto+=nodoRelacion.value[i];
        if(nodoRelacion.value[i]==","){
           nodoArray[contNodo]=nodoTexto.replace(",","");
           //////////////relacionEnvio=1////////////
           db.ref('GuiasNuevas').child(uidParaRelacion.value).child(nodoArray[contNodo]).update({
             relacionEnvio:"1"
         }, (error) =>{
           if(error){
             window.alert('Error al guardar consolidado');
           }else{
         
           
           }
         });
       
       
          //console.log("nodo"+contNodo+": "+nodoArray[contNodo]);
       
          nodoTexto="";
          contNodo++;
        }
       
       }

       guiaRelacion.value="";
       nodoRelacion.value="";
       codigoTransportadora="";
       window.alert('Consolidado creado con exito');
       window.location.href='/relacionesCreadas.html';
      
    }
  });

  }
});
 }else{
   window.alert('Para continuar selecciona las guías de las que deseas crear consolidado');
 }


////////////////////////

}


function cargarRelacionCreadas(){
 
  firebase.auth().onAuthStateChanged(function(user) {

    if(user){
      var reference = db.ref('ConsolidadosNuevos').child(user.uid);
      reference.on('value', function (datas) {
        if(document.getElementById('tabla-relacion-creadas')){
          inHTML("tabla-relacion-creadas", "");
          }  
        var data = datas.val();
        var tabla=[];
        var contar=0;
        $.each(data, function (nodo, value) {
         
         if(document.getElementById('fecha_inicio')){
         var fecha_inicio=document.getElementById('fecha_inicio').value;
         }
         if(document.getElementById('fecha_final')){
         var fecha_final=document.getElementById('fecha_final').value;
         }
         if(document.getElementById('relacion_transportadora')){
          var relacion_transportadora=document.getElementById('relacion_transportadora').value;
          }
          if(document.getElementById('relacion_tipo_envio')){
            var relacion_tipo_envio=document.getElementById('relacion_tipo_envio').value;
            }
         

         var fechaf=Date.parse(value.fecha);
         var fechaFire=new Date(fechaf);

         var fechaI=Date.parse(fecha_inicio); 
         var fechaIni=new Date(fechaI);

         var fechaff=Date.parse(value.fecha);
         var fechaFinalF=new Date(fechaff);

         var fechafff=Date.parse(fecha_final);
         var fechaF= new Date(fechafff);

        

           


            

           if(fechaFire>= fechaIni&& fechaFinalF <= fechaF){
             
               
                if(document.getElementById('tabla-guias-relacion-creadas')){
  
                  document.getElementById('tabla-guias-relacion-creadas').style.display='block';
                  }
           console.log(value.codigoTrans);
         if(value.codigoTrans=="29"){
          var logo=`<img src="img/2001.png" alt="" height="30" width="50">`;
         }
         if(value.codigoTrans=="1010"){
          logo=`<img src="img/logo-tcc.png" alt="" height="50" width="70">`;
        }

        if(value.rutaimpresion=="Creando...."){
          var rutaimpresion="Creando...."
        }else{
          var rutaimpresion=`<a href="${value.rutaimpresion}">Relacion Envío</a>`;
        }

       
          
         
          
          
          tabla[contar] = `<tr>
    
          <td>${logo}</td>
          <td>${value.fecha}</td>
          
          <td>${value.relacionenvio}</td>
          
          <td>${rutaimpresion}</td>
          
          </tr>`;
          contar++;
            
          
             
        
          }
        
         




        
          
        });

        for(let i=tabla.length-1;i>=0;i--){
          if(document.getElementById('tabla-relacion-creadas')){
          printHTML('tabla-relacion-creadas',tabla[i]);
          }
        }
      });

       



    }else{
      if(document.getElementById('login-mostrar-ocultar')){      
      activar('login-mostrar-ocultar');
      }
      if(document.getElementById('sesionIniciada-mostrar-ocultar')){
            desactivar('sesionIniciada-mostrar-ocultar');
      }  
            if(document.getElementById("codigo-usuario")){
            asignacion("codigo-usuario","no inicio");
          }
          }

    

    });
}
cargarRelacionCreadas();
 

function cargarRelacionNoCreadas(){
  firebase.auth().onAuthStateChanged(function(user) {

    if(user){
      
       

       



    }else{
      if(document.getElementById('login-mostrar-ocultar')){      
      activar('login-mostrar-ocultar');
      }
      if(document.getElementById('sesionIniciada-mostrar-ocultar')){
            desactivar('sesionIniciada-mostrar-ocultar');
      }  
            if(document.getElementById("codigo-usuario")){
            asignacion("codigo-usuario","no inicio");
          }
          }

    

    });
}


function cargarGuiasCreadas(){
  firebase.auth().onAuthStateChanged(function(user) {

    if(user){
      
       

       



    }else{
      if(document.getElementById('login-mostrar-ocultar')){      
      activar('login-mostrar-ocultar');
      }
      if(document.getElementById('sesionIniciada-mostrar-ocultar')){
            desactivar('sesionIniciada-mostrar-ocultar');
      }  
            if(document.getElementById("codigo-usuario")){
            asignacion("codigo-usuario","no inicio");
          }
          }

    

    });
}

function historialGuias(){
  firebase.auth().onAuthStateChanged(function(user) {

    if(user){
      var contar=0;   
      
    var reference = db.ref('GuiasNuevas').child(user.uid);
        reference.on('value', function (datas) {
          if(document.getElementById('tabla-guias')){
            inHTML("tabla-guias", "");
            }  
          var data = datas.val();
         var tabla=[];
         var contarTabla=0;
    
          $.each(data, function (nodo, value) {
           
           if(document.getElementById('fecha_inicio')){
           var fecha_inicio=document.getElementById('fecha_inicio').value;
           }
           if(document.getElementById('fecha_final')){
           var fecha_final=document.getElementById('fecha_final').value;
           }
           
    
           var fechaf=Date.parse(value.fecha);
           var fechaFire=new Date(fechaf);
    
           var fechaI=Date.parse(fecha_inicio); 
           var fechaIni=new Date(fechaI);
    
           var fechaff=Date.parse(value.fecha);
           var fechaFinalF=new Date(fechaff);
    
           var fechafff=Date.parse(fecha_final);
           var fechaF= new Date(fechafff);
    
           
             if(fechaFire>= fechaIni&& fechaFinalF <= fechaF){
             
           
            
            contar=contar+1;
            
            tabla[contarTabla] = tableGuias(value.uid,value .fecha,value.nomDes,value.fletetotal,value.costoManejo,value.valorOtrosRecaudos,value.comision_heka,value.recaudo,value.tipo_envio,value.rutaguia,value.nomRem,value.dirDes,value.contenido,value.kilos,value.numguia,value.nomDes,value.ciudadD,value.transportadora);
              contarTabla++;
           
            }
          
    
    
    
    
    
          
            
          });
          var contarExistencia=0;
          for(let i=tabla.length-1;i>=0;i--){
           
            if(document.getElementById('tabla-guias')){
              printHTML('tabla-guias',tabla[i]);
            }
            contarExistencia++;
          }

          if(contarExistencia==0){
            if(document.getElementById('tabla-historial-guias')){
              document.getElementById('tabla-historial-guias').style.display='none';
            }
            if(document.getElementById('nohaydatos')){
              document.getElementById('nohaydatos').style.display='block';
            }
          }else{
            if(document.getElementById('tabla-historial-guias')){
              document.getElementById('tabla-historial-guias').style.display='block';
            }
            if(document.getElementById('nohaydatos')){
              document.getElementById('nohaydatos').style.display='none';
            }
          }
        });
       

       



    }else{
      if(document.getElementById('login-mostrar-ocultar')){      
      activar('login-mostrar-ocultar');
      }
      if(document.getElementById('sesionIniciada-mostrar-ocultar')){
            desactivar('sesionIniciada-mostrar-ocultar');
      }  
            if(document.getElementById("codigo-usuario")){
            asignacion("codigo-usuario","no inicio");
          }
          }

    

    });

 
}

function historialRelacionesNoCreadas(){
  firebase.auth().onAuthStateChanged(function(user) {
  if(user){
    var contar2=0;
    var reference = db.ref('GuiasNuevas').child(user.uid);
      reference.on('value', function (datas) {
        if(document.getElementById('tabla-relacion')){
          inHTML("tabla-relacion", "");
          }  
        var data = datas.val();
        var tabla=[];
        var contarTabla=0;
        $.each(data, function (nodo, value) {
         
         if(document.getElementById('fecha_inicio')){
         var fecha_inicio=document.getElementById('fecha_inicio').value;
         }
         if(document.getElementById('fecha_final')){
         var fecha_final=document.getElementById('fecha_final').value;
         }
         if(document.getElementById('relacion_transportadora')){
          var relacion_transportadora=document.getElementById('relacion_transportadora').value;
          }
          if(document.getElementById('relacion_tipo_envio')){
            var relacion_tipo_envio=document.getElementById('relacion_tipo_envio').value;
            }
         

         var fechaf=Date.parse(value.fecha);
         var fechaFire=new Date(fechaf);

         var fechaI=Date.parse(fecha_inicio); 
         var fechaIni=new Date(fechaI);

         var fechaff=Date.parse(value.fecha);
         var fechaFinalF=new Date(fechaff);

         var fechafff=Date.parse(fecha_final);
         var fechaF= new Date(fechafff);

        

            if(value.tipo_envio=="RECAUDO" | value.tipo_envio=="CONTRAENTREGA"){
              var tipoFirebase="RECAUDO";
            }
            if(value.tipo_envio=="COMUN"){
              var tipoFirebase="COMUN";
            }


            

           if(fechaFire>= fechaIni&& fechaFinalF <= fechaF){
             if(relacion_transportadora==value.transportadora){
               if(relacion_tipo_envio==tipoFirebase){
                if(document.getElementById('tabla-guias-relacion')){
  
                  document.getElementById('tabla-guias-relacion').style.display='block';
                  }
           
         
          
          contar2=contar2+1;
          
          if(value.relacionEnvio=="0"){
          tabla[contarTabla] = tableRelacion(contar2,value.uid,value.nodo,value .fecha,value.nomDes,value.fletetotal,value.costoManejo,value.valorOtrosRecaudos,value.comision_heka,value.recaudo,value.tipo_envio,value.rutaguia,value.nomRem,value.dirDes,value.contenido,value.kilos,value.numguia,value.nomDes,value.ciudadD,value.transportadora);
            contarTabla++;
          }
             }
        }
          }
        
         




        
          
        });
        var contarExistencia=0;
        for(let i=tabla.length-1;i>=0;i--){
         
          if(document.getElementById('tabla-relacion')){
            printHTML('tabla-relacion',tabla[i]);
          }
          contarExistencia++;
        }

        if(contarExistencia==0){
          if(document.getElementById('tabla-guias-relacion')){
            document.getElementById('tabla-guias-relacion').style.display='none';
          }
          if(document.getElementById('nohaydatos')){
            document.getElementById('nohaydatos').style.display='block';
          }
        }else{
          if(document.getElementById('tabla-guias-relacion')){
            document.getElementById('tabla-guias-relacion').style.display='block';
          }
          if(document.getElementById('nohaydatos')){
            document.getElementById('nohaydatos').style.display='none';
          }
        }
      });
  }else{
    if(document.getElementById('login-mostrar-ocultar')){      
      activar('login-mostrar-ocultar');
      }
      if(document.getElementById('sesionIniciada-mostrar-ocultar')){
            desactivar('sesionIniciada-mostrar-ocultar');
      }  
            if(document.getElementById("codigo-usuario")){
            asignacion("codigo-usuario","no inicio");
          }
  }
    
    
    
    
    });













}

function abrirGuias(linkguia,uid){
  console.log(linkguia+"|"+uid);
 
  
  db.ref('abrirGuia').child(uid).child('estado').set({
    link: linkguia
   
}, (error) =>{
  if(error){
    window.alert('Error al abrir guía');
  }else{
    window.open(`/guiaHeka.html`, "Descargar guia heka", "width=800, height=700");
  }
});


 // abrirGuia.innerHTML=`<embed src="${link}" type="application/pdf" width="100%" height="800px" />`;
  /*
  if(document.getElementById('abrirGuia')){
    var abrirGuia = document.getElementById('abrirGuia');
    //abrirGuia.innerHTML=`<embed src="${linkguia}" type="application/pdf" width="100%" height="800px" />`;
  }
  */
 
}

function cargarAbrirGuia(){
  if(document.getElementById('abrirGuia')){
  var embed=document.getElementById('abrirGuia');
  
  firebase.auth().onAuthStateChanged(function(user) {
    if(user){
      var reference = db.ref('abrirGuia').child(user.uid).child('estado');
  
  reference.on('value', function (datas) {
    
    var data = datas.val().link;
    embed.innerHTML=`<embed src="${data}" type="application/pdf" width="100%" height="800px" />`;
    //<embed src="https://aveonline.co/app/modulos/paqueteo/impresiones.unicas.tcc.php?dsconsec=532668794&imprimir=1" type="application/pdf" width="100%" height="800px" />
    });
      
    }else{

    }


  });
}

  }

cargarAbrirGuia();










