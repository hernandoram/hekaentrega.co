const numeroGuia = new URLSearchParams(location.search).get("n");

const seleccionRespSimple = $("#respuesta-simple");
const campoDireccion = $("#dirrecion");
const campoDetalles = $("#observaciones");

$(".form-sol").on("submit", enviarSolucion);
seleccionRespSimple.on("change", seleccionarSolSimple);

async function enviarSolucion(e) {
    e.preventDefault();

    const form = new FormData(e.target);

    const respuestasimple = form.get("respuestaSimple");

    if(respuestasimple !== "1") {
        const resp = await Swal.fire({
            icon: "warning",
            title: "Solución de novedad",
            text: "¿Deseas continuar con esta opción?",
            showCancelButton: true,
            cancelButtonText: "No",
            confirmButtonText: "Si"
        });
      
        if(!resp.isConfirmed) return;
    }

    console.log(respuestasimple);

    return;

    fetch("plantearSolucion", {
        method: "POST",
        body: form,
    })
    .then(d => location.reload())
}

function seleccionarSolSimple(e) {
    campoDireccion.addClass("d-none");
    campoDetalles.addClass("d-none");
    
    const tipo = e.target.dataset.tipo;
    const val = e.target.value;

    if(val !== "1") return;

    switch(tipo) {
        case "DIRECCION":
            campoDireccion.removeClass("d-none");
            campoDetalles.removeClass("d-none");
        break;

        default:
        break;
    }
}