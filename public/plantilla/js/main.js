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


function check_sumar_envio(){
  var id_tipoenvio=document.getElementById('envio_tipo');
  var check_cobr=document.getElementById('check-cobr');
  
  
  if(check_cobr.checked){
    id_tipoenvio.value="1";
  }else{
    id_tipoenvio.value="0";
    
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
        if(document.getElementById('comision_heka')){
        
        //Comision heka
          if(snapshot.val().comisionHeka){ 
          asignacion('comision_heka',snapshot.val().comisionHeka);
        }else{
          asignacion('comision_heka',"2");
        }
      }

        ///////// llenar tabla-novedades /////////////////////////////7777
//if(document.getElementById('tabla-novedades')){
if(document.getElementById('tabla-novedades')){
  inHTML("tabla-novedades", "");
  }
  if(document.getElementById('tabla-enproceso')){
    inHTML("tabla-enproceso", "");
    }    
    
    var contar=0;   
  var reference = db.ref('Guias').child(user.uid);
      reference.once('value', function (datas) {
        var data = datas.val();
        $.each(data, function (nodo, value) {
         console.log(value.fecha);
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
          var sendData = tableGuias(value .fecha,value.rutaguia,value.nomRem,value.dirDes,value.contenido,value.kilos,value.numguia,value.nomDes,value.ciudadD,value.transportadora);
            if(document.getElementById('tabla-guias')){
              
              printHTML('tabla-guias', sendData);
            }
         
          }
        





        
          
        });
      });
      

       

      /////////////////////////////////////////////////////////7
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
mostrarPrueba();
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

function tableGuias(fecha,linkguia,nomRem,dirDes,contenido,peso,numero_guia,nomDes,ciudadD,trans) {
  return `
  
  <tr>
  <!--
  <td>
  
  <input class="btn btn-danger" type="checkbox">
  
  </td>
  -->
  <td>
  <form action="documentoGuia" method="post">
      <input type="hidden" name="paraGuia" value="${linkguia}">
      
      <button class="btn btn-warning" type="submit">Guia</button>
    
      
      </form>
      </td>
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
  <td>${trans}</td>
 
  
  

   


  
   
  
    
    
   
</tr>`
    ;
}



//bloquear boton



