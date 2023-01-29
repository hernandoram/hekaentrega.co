const db = firebase.firestore();
const filtradorPagos = $(".filtro-pagos");
const listaVer = $("#lista-usuarios_pagos");
listaVer.change(mirarColeccion);

cargarFiltroDePagosPersonalizados();
async function cargarFiltroDePagosPersonalizados() {
    filtroPagos = await db.collection("infoHeka").doc("usuariosPorDiaDePago")
    .get().then(d => d.data());

    const opcionesVer = Object.keys(filtroPagos)
    .filter(f => filtroPagos.ver.includes(f))
    .map((c) => `<option value="${c}">${filtroPagos.titulos[c]}</option>`);

    const listaPagos = Object.keys(filtroPagos)
    .filter(f => filtroPagos.pagar.includes(f))
    .map((c) => `<option value="${c}">${filtroPagos.titulos[c]}</option>`);

    opcionesVer.unshift('<option value="">Seleccione pagos</option>');
    listaPagos.unshift('<option value="">Seleccione pagos</option>');

    filtradorPagos.html(listaPagos);
    listaVer.html(opcionesVer);

    return filtroPagos;
}

const mostrarioUsuario = (tipo, seller) => `
    <div class="form-group col-md-3 col-sm-6">
        <label for="usuario_pago-${tipo}_${seller}" class="w-100"
        data-usuario="${seller}" data-coleccion="${tipo}">
            <span>${seller}</span>
            <span class="d-none fa fa-trash text-danger"></span>
            <span class="d-none fa fa-pen"></span>
            <span class="d-none fa fa-check"></span>
            <span class="d-none fa fa-window-close"></span>
        </label>
        <input type="text" class="form-control d-none" id="usuario_pago-${tipo}_${seller}" value="${seller}">
    </div>
`;

function mirarColeccion(e) {
    const { editar } = filtroPagos;
    const collection = e.target.value;
    const listaUsuarios = filtroPagos[collection];
    const mostrario = $("#mostrador-usuarios_pagos");
    mostrario.html(listaUsuarios.map(seller => mostrarioUsuario(collection, seller)));
    const puedeEditar = editar.includes(collection);

    if(puedeEditar) {
        $(".fa-trash, .fa-pen", mostrario).removeClass("d-none");
    }

    $(".fa-pen", mostrario).click((e) => {
        const parent = e.target.parentNode;
        const {usuario, coleccion} = e.target.parentNode.dataset;
        const id = parent.getAttribute("for");
        
        $(`#${id}`).removeClass("d-none");
    })
}