$("#agregar-al-carrito").click(agregarAlCarrito);
$("[data-function='quitar']").click(quitarDelCarrito);
$("[data-function='adicionar']").change(calcItem);
$("#ciudadD").blur(calcularCostoEnvio);
$("#comprar").click(calcularCostoEnvio);

let storeInfo;

function agregarAlCarrito() {
    let atributos = new  Object();
    $("[data-campo]").each((i, select) => {
        atributos[select.dataset.campo] = select.value
    });

    let tienda = $(this).attr("data-tienda");
    let storeId = $(this).attr("data-storeId");
    let data = new Object({atributos, tienda, storeId})
    
    fetch("/tienda/agregarAlCarrito/"+$(this).attr("data-id"),{
        method: "POST",
        body: JSON.stringify(data),
        headers: {"Content-Type": "application/json"}
    }).then(d => console.log(d));
};

function quitarDelCarrito() {
    let identificadorItem = $(this).attr("data-id");
    fetch("/tienda/quitarDelCarrito/"+identificadorItem)
    .then(d => d.json().then((data) => console.log(data)));
    $("#"+identificadorItem).remove();
    calcTotal();
};

function calcItem() {
    let identificador = $(this).attr("data-id");
    let cant = $(this).val();
    let unitPrice = $("#"+identificador).children()[1].textContent;
    let price = $("#"+identificador).children()[3];
    $(price).html(unitPrice * cant);
    calcTotal()
    modificarItemCarrito(this);
}

function calcTotal() {
    let subTotal = 0;
    $(".total-item").each((i, item) => {
        subTotal += parseInt($(item).text())
    })

    $("#sub-total").html(subTotal);
    return subTotal;
};

function modificarItemCarrito(input) {
    console.log("se está modificando el item del carrito");
    let identificador = $(input).attr("data-id");
    let value = $(input).val();
    fetch("/tienda/modificarItemCarrito/"+identificador, {
        method: "POST",
        body: JSON.stringify({cantidad: value}),
        headers: {"Content-Type": "application/json"}
    });
}

async function getStoreInfo(tienda) {
    let info = await fetch("/tienda/informacion/"+tienda)
    .then(async d => {
        return await d.json();
    });

    storeInfo = info;
    return info;
};

let precios = {
    costo_zonal1: 9050,
    costo_zonal2: 13050,
    costo_zonal3: 2800,
    costo_nacional1: 11500,
    costo_nacional2: 19250,
    costo_nacional3: 3400,
    costo_especial1: 22900,
    costo_especial2: 32000,
    costo_especial3: 6300,
    comision_servi: 3.1,
    comision_heka: 1,
    saldo: 0
};

async function getCarrito() {
    let carrito = await fetch("/tienda/getCarrito")
    .then(d => d.json());

    console.log(carrito);
    return carrito;
}

async function calcularCostoEnvio() {
    console.log(this);
    let tienda = $(this).attr("data-tienda");
    let ciudadR = await getStoreInfo(tienda);
    let carrito = await getCarrito();
    // let recaudo = parseInt($("#sub-total").text().replace(/\D/, ""));
    let datos_de_cotizacion = {
        precios,
        ciudadR: ciudadR.ciudadT,
        ciudadD: document.getElementById("ciudadD").dataset
    };
    let costo_envio = 0;

    for await (let item of carrito) {
        console.log(item)
        let volumen = item.alto * item.ancho * item.largo * item.cantidad;
        let peso = item.peso * item.cantidad;
        let recaudo = item.precio * item.cantidad
        let cotizador = item.sumar_envio ? 
            sumarCostoDeEnvio(recaudo, "PAGO CONTRAENTREGA", peso, volumen, datos_de_cotizacion) :
            new CalcularCostoDeEnvio(recaudo, "PAGO CONTRAENTREGA", peso, volumen, datos_de_cotizacion);
        costo_envio += cotizador.costoEnvio;
        if(this.getAttribute("id") == "comprar") await crearGuia(item, cotizador);
    };

    $("#costo-envio").text(costo_envio);
    $("#total").text(costo_envio + calcTotal());
    return cotizador;
};

async function crearGuia(item, cotizador) {
    let nuevaGuia = new Object();
    let infoDestino = document.getElementById("ciudadD").dataset;
    $("[data-campo]").each((i, input) => {
        let campo = $(input).attr("data-campo");
        nuevaGuia[campo] = $(input).val();
    });
    console.log(item);
    let camposItem = ["alto", "ancho", "largo", "peso", "centro_de_costo"];
    let camposCiudad = ["ciudad", "departamento"];
    let camposTienda = ["celular", "correo", "direccion", "nombre"];

    camposCiudad.forEach(city => {
        nuevaGuia[city + "D"] = infoDestino[city];
        nuevaGuia[city + "R"] = storeInfo.ciudadT[city];
    })
    camposItem.forEach(c => nuevaGuia[c] = item[c]);
    camposTienda.forEach(c => nuevaGuia[c+"R"] = storeInfo[c]);
    nuevaGuia.id_user = storeInfo.id_user
    item.id_user = storeInfo.id_user;
    nuevaGuia.centro_de_costo = storeInfo.centro_de_costo;

    let fecha = new Date();
    let dia = fecha.getDate() < 10 ? "0" + fecha.getDate() : fecha.getDate();
    let mes = parseInt(fecha.getMonth()) + 1;
    mes = mes < 10 ? "0" + mes : mes;
    nuevaGuia.nombreD = $("#billing-nombre").val() + " " + $("#billing-apellido").val();
    nuevaGuia.nombreD.trim();
    nuevaGuia.direccionD = $("#billing-direccion").val() + " " + $("#billing-barrio").val();
    nuevaGuia.direccionD.trim();
    nuevaGuia.detalles = cotizador.getDetails;
    nuevaGuia.fecha = fecha.getFullYear() + "-" + mes + "-" + dia;
    nuevaGuia.timeline = new Date().getTime();
    nuevaGuia.identificacionD = 123;
    nuevaGuia.tipo_doc_dest = 2;
    nuevaGuia.costo_envio = cotizador.costoEnvio;
    nuevaGuia.debe = -cotizador.costoEnvio;
    nuevaGuia.dice_contener = item.nombre;
    nuevaGuia.identificacionR = storeInfo.numero_documento;
    nuevaGuia.valor = cotizador.valor;
    nuevaGuia.type = "PAGO CONTRAENTREGA"
    nuevaGuia.id_producto = item.id;

    let pedido = await crearPedido(item);

    nuevaGuia.id_pedido = pedido.id;

    await fetch("/tienda/crearGuiaServientrega", {
        method: "POST",
        body: JSON.stringify(nuevaGuia),
        headers: {"Content-Type": "application/json"}
    }).then( d => console.log(d))
    // return pr;
};

async function crearPedido(item) {
    return await fetch("/tienda/crearPedido", {
        method: "POST",
        body: JSON.stringify(item),
        headers: {"Content-Type": "application/json"}
    }).then(d => d.json())
}