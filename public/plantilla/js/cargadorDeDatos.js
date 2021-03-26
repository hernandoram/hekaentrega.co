let user_id = localStorage.user_id;
if(localStorage.getItem("acceso_admin")){

} else if(localStorage.user_id){
  cargarDatosUsuario();
} else {
  alert("La sesión ha expirado, por favor inicia sesión nuevamente");
  location.href = "iniciarSesion2.html"
}
//Administradara datos basicos del usuario que ingresa
let datos_usuario = {},
//Almacena los costos de envios (nacional, urbano...) y el porcentaje de comision
precios_personalizados = {
    costo_zonal1: 6750,
    costo_zonal2: 10200,
    costo_zonal3: 2700,
    costo_nacional1: 11500,
    costo_nacional2: 17700,
    costo_nacional3: 3600,
    costo_especial1: 21200,
    costo_especial2: 32000,
    costo_especial3: 6700,
    comision_servi: 3.1,
    comision_heka: 2.9
};

//funcion principal del Script que carga todos los datos del usuario
function cargarDatosUsuario(){
        var informacion = firebase.firestore().collection('usuarios').doc(user_id).collection("informacion");
        //Carga la informacion personal en un objeto
        informacion.doc("personal").get().then((doc) => {
          if(doc.exists){
            let datos = doc.data();
            datos_usuario = {
              nombre_completo: datos.nombres.split(" ")[0] + " " + datos.apellidos.split(" ")[0],
              direccion: datos.direccion + " " + datos.barrio,
              celular: datos.celular,
              correo: datos.correo,
              centro_de_costo: datos.centro_de_costo,
              objetos_envio: datos.objetos_envio
            }

            // A partir de aqui, verificara que los elementos existan para mostrar datos
            if(document.getElementById('usuario')){
            document.getElementById('usuario').innerText = datos.nombres.split(" ")[0] + " " + datos.apellidos.split(" ")[0];                
            }       
            if(document.getElementById('CPNnombres')){
              document.getElementById('CPNnombres').value=datos.nombres;
              document.getElementById('usuario').innerText = datos.nombres.split(" ")[0] + " " + datos.apellidos.split(" ")[0];
            }
            if(document.getElementById('CPNapellidos')){
              document.getElementById('CPNapellidos').value=datos.apellidos;
            }
            if(document.getElementById('CPNtipo_documento')){
              document.getElementById('CPNtipo_documento').value=datos.tipo_documento;
            }
            if(document.getElementById('CPNnumero_documento')){
              document.getElementById('CPNnumero_documento').value=datos.numero_documento;
            }
            if(document.getElementById('CPNtelefono')){
              document.getElementById('CPNtelefono').value=datos.celular;
            }
            if(document.getElementById('CPNcelular')){
              document.getElementById('CPNcelular').value=datos.celular2;
            }
            if(document.getElementById('CPNciudad')){
              document.getElementById('CPNciudad').value=datos.ciudad;
            }
            if(document.getElementById('CPNdireccion')){
              document.getElementById('CPNdireccion').value=datos.direccion;
            }
            if(document.getElementById('CPNbarrio')){
              document.getElementById('CPNbarrio').value=datos.barrio;
            }
            if(document.getElementById('CPNnombre_empresa')){
              document.getElementById('CPNnombre_empresa').value=datos.nombre;
            }
            if(document.getElementById('CPNcorreo')){
              document.getElementById('CPNcorreo').value=datos.correo;
            }

            if(document.getElementById('CPNobjetos_envio')){
              document.getElementById('CPNobjetos_envio').value=datos.objetos_envio.join(", ");
            }

            ///desactivar texto "cargando datos"
            if(document.getElementById('texto-cargar-datos')){
              document.getElementById('texto-cargar-datos').innerHTML=``;
            }
            ////activar panel de datos de usuario
            if(document.getElementById('contenedor-datos-actualizar')){
              document.getElementById('contenedor-datos-actualizar').style.display='block';
            }
          }
           
        });

        // muestra informacion bancaria
        informacion.doc("bancaria").get().then((doc) => {
          if(doc.exists) {
            let datos = doc.data();
            ////datos bancarios
            if(document.getElementById('CPNbanco') && datos.banco!=""){
              document.getElementById('CPNbanco').value = datos.banco;
            }
            if(document.getElementById('CPNnombre_representante') && datos.nombre_banco!=""){
              document.getElementById('CPNnombre_representante').value=datos.nombre_banco;
            }
            if(document.getElementById('CPNtipo_de_cuenta') && datos.tipo_de_cuenta!=""){
              document.getElementById('CPNtipo_de_cuenta').value=datos.tipo_de_cuenta;
            }
            if(document.getElementById('CPNnumero_cuenta') && datos.numero_cuenta!=""){
              document.getElementById('CPNnumero_cuenta').value=datos.numero_cuenta;
            }
            if(document.getElementById('CPNconfirmar_numero_cuenta') && datos.numero_cuenta!=""){
              document.getElementById('CPNconfirmar_numero_cuenta').value=datos.numero_cuenta;
            }
            if(document.getElementById('CPNtipo_documento_banco') && datos.tipo_documento_banco!=""){
              document.getElementById('CPNtipo_documento_banco').value=datos.tipo_documento_banco;
            }
            if(document.getElementById('CPNnumero_identificacion_banco') && datos.numero_iden_banco!=""){
              document.getElementById('CPNnumero_identificacion_banco').value=datos.numero_iden_banco;
            }
            if(document.getElementById('CPNconfirmar_numero_identificacion_banco') && datos.numero_iden_banco!=""){
              document.getElementById('CPNconfirmar_numero_identificacion_banco').value=datos.numero_iden_banco;
            }
          }
        });

        //Modifica los costos de envio si el usuario tiene costos personalizados
        informacion.doc("heka").get().then((doc) => {
          if(doc.exists){
            for(let precio in doc.data()){
              let pryce = parseFloat(doc.data()[precio]);
              if(pryce && typeof pryce == "number"){
                precios_personalizados[precio] = pryce;
              }
            }
          }
        })
}

//invocada por el boton para buscar guias
function cambiarFecha(){
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

//Muestra el historial de guias en rango de fecha seleccionado
function historialGuias(){
  $('#dataTable').DataTable().destroy();
  if(user_id){     
    var reference = firebase.firestore().collection("usuarios").doc(user_id).collection("guias");
    reference.get().then((querySnapshot) => {
      var tabla=[];
      if(document.getElementById('tabla-guias')){
        inHTML("tabla-guias", "");
      }  
      querySnapshot.forEach((doc) => {
          if(document.getElementById('fecha_inicio')){
            var fecha_inicio=document.getElementById('fecha_inicio').value;
          }
          if(document.getElementById('fecha_final')){
            var fecha_final=document.getElementById('fecha_final').value;
          }
          var fechaFire = new Date(doc.data().fecha).getTime();
          fecha_inicio = new Date(fecha_inicio).getTime();
          fecha_final = new Date(fecha_final).getTime();
          if(fechaFire >= fecha_inicio && fechaFire <= fecha_final){          
            tabla.push(tablaDeGuias(doc.id, doc.data()));
            //Caragador de datos en tiepo real, sera utilizado para actualizar el estado de guia
            firebase.firestore().collection("Estado de Guias").doc(doc.id).onSnapshot((row) => {
              if(row.exists) {
                document.getElementById("historial-guias-row" + row.id).children[2].textContent = row.data().numero_guia_servientrega;
                document.getElementById("historial-guias-row" + row.id).children[3].textContent = row.data().estado_envio;
                activarBotonesDeEnvio(row.id, row.data().enviado);
              }
            });
          } 
      });

      var contarExistencia=0;
      for(let i=tabla.length-1;i>=0;i--){
        
        if(document.getElementById('tabla-guias')){
          printHTML('tabla-guias',tabla[i]);
        }
        contarExistencia++;
      }

      //si no encuentra guias...
      if(contarExistencia==0){
        if(document.getElementById('tabla-historial-guias')){
          document.getElementById('tabla-historial-guias').style.display='none';
        }
        if(document.getElementById('nohaydatosHistorialGuias')){
          document.getElementById('nohaydatosHistorialGuias').style.display='block';
          location.href='#nohaydatosHistorialGuias';
        }
      }else{
        if(document.getElementById('tabla-historial-guias')){
          document.getElementById('tabla-historial-guias').style.display='block';
          location.href = "#tabla-historial-guias";
        }
        if(document.getElementById('nohaydatosHistorialGuias')){
          document.getElementById('nohaydatosHistorialGuias').style.display='none';
        }
        $(document).ready( function () {
          $('#dataTable').DataTable( {
            language: {
                url: "https://cdn.datatables.net/plug-ins/1.10.24/i18n/Spanish.json"
            }
          });
        });
      }
    }).then(() => {
      // activarBotonesDeEnvio()
    });
  } 
}


function cerrarSession() {
  localStorage.clear()
}

