import { mostrarRenderFormNovedades, obtenerDescripcion } from "./renderForm.js";

const numeroGuia = new URLSearchParams(location.search).get("n");

const seleccionRespSimple = $("#respuesta-simple");
const campoDireccion = $("#dirrecion");
const campoDetalles = $("#observaciones");
const idVistaRender = "#render_form-mensajeria";
const elFormulario = $(idVistaRender);


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
            text: "¿Seguro con la solución planteada?",
            showCancelButton: true,
            cancelButtonText: "No",
            confirmButtonText: "Si"
        });
      
        if(!resp.isConfirmed) return;
    }

    form.append("gestion", obtenerDescripcion());

    console.log(form.get("gestion"));

    fetch("plantearSolucion", {
        method: "POST",
        body: form,
    })
    .then(d => d.json())
    .then(d => {
        if(d.error) throw new Error(d.message || "Error desconocido.");
        
        location.reload();
    })
    .catch(e => Swal.fire("Error", e.message, "error"));
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

renderizar();
function renderizar() {
    const form = elFormulario.attr("data-formulario");
    const formulario = JSON.parse(form);

    mostrarRenderFormNovedades(idVistaRender, formulario);
}