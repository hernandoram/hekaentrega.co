import CreateModal from "../utils/modal.js";
import { verificador, ChangeElementContenWhileLoading, enviarNotificacion } from "../utils/functions.js";


const formNuevaBodega = `
<form action="#" id="nueva-bodega">
    <div class="form-group">
    <label for="nombre-bodega">Nombre de la bodega</label>
    <input type="text" class="form-control" id="nombre-bodega" name="nombre" maxlength="15">
    <small class="form-text text-muted">Ingrese un nombre único para su nueva bodega.</small>
    </div>

    <div class="form-group">
    <label for="ciudad-bodega">Ciudad <small class="text-danger">*</small></label>
    <input type="text" class="form-control" id="ciudad-bodega" name="ciudad" required>
    <small class="form-text text-muted">Seleccione del menú desplegable.</small>
    </div>

    <div class="form-group">
    <label for="barrio-bodega">Barrio <small class="text-danger">*</small></label>
    <input type="text" class="form-control" id="barrio-bodega" name="barrio">
    </div>

    <div class="form-group">
    <label for="direccion-bodega">Dirección <small class="text-danger">*</small></label>
    <input type="text" class="form-control" id="direccion-bodega" name="direccion">
    </div>
</form>
`;

let modalNuevaBodega;

function agregarBodega() {
    const swalID = Swal.mixin({
        onBeforeOpen: (modal) => {
          modal.setAttribute('id', 'optimizado');
        }
      });
      swalID.fire({
        title: "<h4 class='text-center'>Nueva bodega</h4>",
        confirmButtonText: "Crear Bodega",
        html:formNuevaBodega,
        position:"relative",
    }).then((result) => {
        if (result.isConfirmed) {
          let form = document.getElementById("nueva-bodega")
          agregarNuevaBodega(form);
        }
    });

    console.log(document.getElementById("ciudad-bodega"))
    consultarCiudades(document.getElementById("ciudad-bodega"));
    
}

async function agregarNuevaBodega(form) {
    const formData = new FormData(form);
    const newcity = new Object();
    const nombreBodega = form.nombre;
    const idInpNombre = nombreBodega.getAttribute("id");
    const ciudadBodega = form.ciudad;
    const idInpCiudad = ciudadBodega.getAttribute("id");
    let bodegas = datos_usuario.bodegasCompletas;


    if (datos_usuario.type === "NATURAL-FLEXII" && !ciudadesFlexxi.includes(ciudadBodega.value)) {
        return Swal.fire({
            icon: 'error',
            text: 'No puedes crear bodegas en esta ciudad.'
          });
    }




    form.checkValidity();
    verificador([idInpNombre, idInpCiudad], null);

    for (let entrie of formData) {
        newcity[entrie[0]] = entrie[1].trim();
    }

    newcity.direccion_completa = newcity.direccion + ", " + newcity.barrio + ", " + newcity.ciudad;

    if(newcity.nombre && bodega) {
        const existeNombre = bodegas.some(b => {
            return b.nombre.toLowerCase() === newcity.nombre.toLowerCase();
        });
        
        if(existeNombre) {
            return verificador([idInpNombre], true, "Este nombre de empresa ya existe");
        }
    }

    if(!/^.+\(.+\)$/.test(newcity.ciudad)) {
        return verificador([idInpCiudad], true, "Recuerda ingresar una ciudad válida, selecciona entre el menú desplegable");
    }

    const id = bodegas ? bodegas.reduce((a,b) => {
        if(a < b.id) return b.id;

        return a
    }, 0) + 1 : 1;

    newcity.id = id;
    newcity.fecha_creacion = new Date();

    if(!newcity.nombre) newcity.nombre = "Bodega-"+id;


    bodegas ? bodegas.push(newcity) 
    : bodegas = new Array(newcity);

    const ready = await usuarioDoc.update({bodegas})
    .then(async () => {
        // datos_usuario.bodegas = bodegas;
        await notificarNuevaCiudad(newcity);
        return {
            icon: "success",
            text: "Se ha agregado una nueva bodega."
        }
    })
    .catch(() => {
        return {
            icon: "error",
            text: "No se ha podido agregar la ciudad, por favor intente nuevamente."
        }
    });

    Toast.fire(ready);
    
}

async function notificarNuevaCiudad(newCity) {
    const centroDeCosto = datos_usuario.centro_de_costo;
    const detalles = [
        "<b>Centro de costo: </b> " + centroDeCosto,
        "<b>Ciudad: </b> " + newCity.ciudad,
        "<b>Dirección: </b> " + newCity.direccion,
        "<b>Barrio: </b> " + newCity.barrio,
    ];
    
    return await enviarNotificacion({
        visible_admin: true,
        icon: ["map-marker-alt", "primary"],
        mensaje: centroDeCosto + " ha registrado una nueva ciudad",
        href: "usuarios",
        detalles,
        id_user: user_id
    });
}

export default agregarBodega;