const db = firebase.firestore();
const filtradorPagos = $(".filtro-pagos");
const listaVer = $("#lista-manejo_usuarios");
const inpNuevo = $("#nuevo-manejo_usuarios");
const buttonAdd = $("#agrega_nuevo-manejo_usuarios");
const buttonSave = $("#agregar_nuevo-manejo_usuarios");
const btnDownload = $("#descargar-manejo_usuarios");

let valorseleccionado = "";

const referencia = db.collection("infoHeka").doc("manejoUsuarios");

listaVer.change(mirarColeccion);
buttonAdd.on("click", activarNuevo);
buttonSave.on("click", guardarNuevo);
btnDownload.on("click", descargarLista);

cargarFiltroDePagosPersonalizados();
async function cargarFiltroDePagosPersonalizados() {
    filtroPagos = await referencia
    .get().then(d => d.data());

    if(!filtroPagos) return;

    const opcionesVer = Object.keys(filtroPagos)
    .filter(f => filtroPagos.ver.includes(f) || filtroPagos.editar.includes(f))
    .map((c) => `<option value="${c}">${filtroPagos.titulos[c]}</option>`);

    const listaPagos = Object.keys(filtroPagos)
    .filter(f => filtroPagos.pagar.includes(f))
    .map((c) => `<option value="${c}">${filtroPagos.titulos[c]}</option>`);

    opcionesVer.unshift('<option value="">Seleccione colección</option>');
    listaPagos.unshift('<option value="">-- Seleccione pagos -- </option>');

    filtradorPagos.html(listaPagos);
    listaVer.html(opcionesVer);
    listaVer.val(valorseleccionado);

    listaVer.change();

    return filtroPagos;
}

function reset() {
    buttonAdd.addClass("d-none");
    buttonSave.addClass("d-none");
    btnDownload.addClass("d-none");
    inpNuevo.parent().addClass("d-none");
}

const mostrarioUsuario = (tipo, seller) => `
    <div class="form-group col-md-3 col-sm-6">
        <label for="usuario_pago-${tipo}_${seller}" class="w-100"
        data-usuario="${seller}" data-coleccion="${tipo}">
            <span>${seller}</span>
            <span class="d-none fa fa-pen text-primary"></span>
            <span class="d-none fa fa-trash text-danger"></span>
            <span class="d-none fa fa-check text-success"></span>
        </label>
        <input type="text" class="form-control d-none" id="usuario_pago-${tipo}_${seller}" value="${seller}">
    </div>
`;

function mirarColeccion(e) {
    reset();

    const { editar } = filtroPagos;
    const collection = e.target.value;
    const mostrario = $("#mostrador-manejo_usuarios");
    valorseleccionado = collection;
    if(!collection) return mostrario.html("");

    const listaUsuarios = filtroPagos[collection];
    mostrario.html(listaUsuarios.map(seller => mostrarioUsuario(collection, seller)));
    const puedeEditar = editar.includes(collection);

    if(puedeEditar) {
        $(".fa-pen", mostrario).removeClass("d-none");
        buttonAdd.removeClass("d-none")
    }

    btnDownload.removeClass("d-none");

    $(".fa-trash", mostrario).click(eliminarDeLista);
    $(".fa-pen", mostrario).click(activarEditarUsuario);
    $(".fa-check", mostrario).click(guardarEdicion);
}

async function eliminarDeLista(e) {
    const parent = e.target.parentNode;
    const {usuario, coleccion} = parent.dataset;

    const confirmacion = await Swal.fire({
        title: 'Quitar de la colección',
        text: "Estás a punto de quitar al " + usuario + " de la colección de: " + filtroPagos.titulos[coleccion] + " ¿Estás seguro?",
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Has lo que digo 😠',
        cancelButtonText: "No, perdón 😥"
    });

    if(!confirmacion.isConfirmed) return;

    
    const actualizacion = {};
    actualizacion[coleccion] = firebase.firestore.FieldValue.arrayRemove(usuario);
    
    await referencia.update(actualizacion);

    Toast.fire("", "¡El usuario " + usuario + " ha sido quitado de la colección!", "success");
    cargarFiltroDePagosPersonalizados();
}

function activarNuevo(e) {
    buttonSave.toggleClass("d-none");
    inpNuevo.parent().toggleClass("d-none");
}

async function guardarNuevo(e) {
    const coleccion = listaVer.val();
    const nuevoUsuario = inpNuevo.val().trim();

    const agregado = {
        [coleccion]: firebase.firestore.FieldValue.arrayUnion(nuevoUsuario)
    };
    await referencia.update(agregado);

    Toast.fire("", "¡El usuario " + nuevoUsuario + " ha sido agregado con éxito.", "success");
    cargarFiltroDePagosPersonalizados();
}

function activarEditarUsuario(e) {
    const parent = e.target.parentNode;
    const {usuario, coleccion} = e.target.parentNode.dataset;
    const id = parent.getAttribute("for");
    const btnGuardar = $(".fa-check", parent);
    
    $(`#${id}`).toggleClass("d-none");
    btnGuardar.toggleClass("d-none");
    $(".fa-trash", parent).toggleClass("d-none");

}

async function guardarEdicion(e) {
    const parent = e.target.parentNode;
    const {usuario, coleccion} = e.target.parentNode.dataset;
    const id = parent.getAttribute("for");
    const inp = $("#" + id);
    const nuevo = inp.val().trim();
    
    const eliminacion = {
        [coleccion]: firebase.firestore.FieldValue.arrayRemove(usuario),
    };
    await referencia.update(eliminacion);
    
    const agregado = {
        [coleccion]: firebase.firestore.FieldValue.arrayUnion(nuevo)
    };
    await referencia.update(agregado);

    Toast.fire("", "¡El usuario " + usuario + " ha sido aditado a "+nuevo+"!", "success");
    cargarFiltroDePagosPersonalizados();

}

function cancelarEdicion(e) {
    const parent = e.target.parentNode;
    const {usuario, coleccion} = e.target.parentNode.dataset;
    const id = parent.getAttribute("for");
    const btnGuardar = $(".fa-check", parent);
    
    $(`#${id}`).addClass("d-none");
    btnGuardar.addClass("d-none");
    $(".fa-times", parent).addClass("d-none");
}

function descargarLista(e) {
    const tipoLista = listaVer.val();
    const lista = filtroPagos[tipoLista];
    const columnas = {u: "Usuarios"};
    const paraDescargar = lista.map(u => ({u: u}));

    descargarInformeExcel(columnas, paraDescargar, "Lista");
}