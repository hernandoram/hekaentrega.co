const numeroGuia = new URLSearchParams(location.search).get("n");

$(".form-sol").on("submit", enviarSolucion);

function enviarSolucion(e) {
    e.preventDefault();

    const form = new FormData(e.target);

    fetch("plantearSolucion", {
        method: "POST",
        body: form,
    })
    .then(d => location.reload())
}