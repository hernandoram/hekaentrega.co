$("#agregar-al-carrito").click(agregarAlCarrito);
$("[data-function='quitar']").click(quitarDelCarrito);
$("[data-function='adicionar']").change(calcItem);
$("#ciudadD").blur(calcularCostoEnvio);
$("#comprar").click(calcularCostoEnvio);
$("#inp-search-product").on("input", filtrarProductoPorNombre);
$("#categoria-select").change(filtrarProductoPorCategoria);
$("#sort-select").change(organizarProductos);
$(".vaciar-carrito").click(vaciarCarrito);

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
    }).then(d => d.json().then(res => llenarNotificacionCarrito(res.carrito)));
};

function quitarDelCarrito() {
    let identificadorItem = $(this).attr("data-id");
    fetch("/tienda/quitarDelCarrito/"+identificadorItem)
    .then(d => d.json().then((data) => llenarNotificacionCarrito(data)));
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
    if(cant <= 0) return quitarDelCarrito.call(this);
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
    let value = parseInt($(input).val());
    let maxValue = $(input).attr("max");
    $(input).parent().children("p").remove()
    if(value > maxValue) {
        let p = document.createElement("p");
        p.classList.add("text-danger");
        p.innerHTML = "La cantidad solicitada excede la cantidad en inventario, por favor asegurece que la tienda tenga lo que solicita.";

        $(p).insertAfter(input);
    };

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
    if(revisarCampos()) return;
    let nuevaGuia = new Object();
    let infoDestino = document.getElementById("ciudadD").dataset;
    $("[data-campo]").each((i, input) => {
        let campo = $(input).attr("data-campo");
        nuevaGuia[campo] = $(input).val();
    });
    console.log(item);
    console.log(storeInfo);
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
    nuevaGuia.nombreD = nuevaGuia.nombreD.trim();
    nuevaGuia.direccionD = $("#billing-direccion").val() + " " + $("#billing-barrio").val();
    nuevaGuia.direccionD = nuevaGuia.direccionD.trim();
    if (!nuevaGuia.celularD) nuevaGuia.celularD = nuevaGuia.telefonoD; 
    if (!nuevaGuia.correoD) nuevaGuia.correoD = "notiene@gmail.com";
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
    nuevaGuia.recoleccion_esporadica = 1;
    nuevaGuia.id_producto = item.id_producto;

    
    // nuevaGuia.id_pedido = pedido.id;
    
    let guiaCreada = await fetch("/tienda/crearGuiaServientrega", {
        method: "POST",
        body: JSON.stringify(nuevaGuia),
        headers: {"Content-Type": "application/json"}
    }).then( d => d.json());
    console.log(guiaCreada);
    
    item.id = guiaCreada.id_pedido;
    await crearPedido(item);
    // return pr;
};

function revisarCampos() {
    let vacios = 0;
    $(".mensaje-error").remove();
    $("[required]").each((i,e) => {
        $(e).removeClass("border-danger");
        if(!$(e).val()) {
            vacios++
            $(e).addClass("border-danger");
            $(e).after("<p class='text-danger text-center mensaje-error'>Este campo no debe estar vacío</p>");
            if(vacios == 1) {
                $(e).parent()[0].scrollIntoView({behavior: "smooth"});
            }
        }
    });
    if(vacios) return true
    let ciudad = $("#ciudadD")[0].dataset;
    if(Object.entries(ciudad).length <= 1) {
        $("#ciudadD").addClass("border-danger");
        $("#ciudadD").after("<p class='text-danger text-center mensaje-error'>Por favor asegurese de seleccionar del desplegable</p>");
        $("#ciudadD").parent()[0].scrollIntoView({behavior: "smooth"});
        return true;
    };
    return true;
}

async function crearPedido(item) {
    return await fetch("/tienda/crearPedido", {
        method: "POST",
        body: JSON.stringify(item),
        headers: {"Content-Type": "application/json"}
    }).then(d => d.json())
};

function filtrarProductoPorNombre() {
    let filtro = this.value.toLowerCase();
    
    let productos = $(".visible");
    productos.removeClass("d-none");
    if(!filtro) return;
    productos.each((i,e) => {
        let filtrado = $(e).attr("data-filter-name").toLowerCase();
        if(!filtrado.includes(filtro)) $(e).addClass("d-none");
    }); 
}

function filtrarProductoPorCategoria() {
    let filtro = this.value;

    let productos = $(".producto");
    productos.removeClass("d-none");
    productos.addClass("visible")
    // if(!filtro) return;
    productos.each((i,e) => {
        let filtrado = $(e).attr("data-filter-categoria");
        if(!filtrado.includes(filtro)) {
            $(e).addClass("d-none");
            $(e).removeClass("visible");
        }
    });
    let filtradorInp = document.getElementById("inp-search-product");

    filtrarProductoPorNombre.call(filtradorInp);
};

function organizarProductos() {
    let sortBy = this.value;
    if(!sortBy) return;
    let stock = $(".visible");
    for(let i = 1; i < stock.length; i++) {
        let anterior = stock[i - 1];
        let actual = stock[i];
        let valAnt = parseInt(anterior.getAttribute("data-sort-precio"));
        let valAct = parseInt(actual.getAttribute("data-sort-precio"));
        let variante = sortBy == "1" ? valAnt > valAct : valAnt < valAct;
        if(variante) {
            anterior.parentNode.insertBefore(actual, anterior);
        }
    }
};

function llenarNotificacionCarrito(carrito) {
    let notificacion = document.getElementById("carrito-noti");
    let menu = document.getElementById("carrito-side-menu");

    notificacion.innerHTML = "";
    menu.innerHTML = "";
    console.log(carrito);
    carrito.forEach(item => {
        let atributos = "";
        for (let attr in item.atributos) {
            atributos += `<small class="mr-2"><b>${attr}:</b> ${item.atributos[attr]} </small>`; 
        }

        notificacion.innerHTML += `<a href="/tienda/${item.tienda}/producto/${item.id_producto}" class="dropdown-item notify-item">
            <div class="notify-icon">
                <img src="${item.imagesUrl ? item.imagesUrl.url : "/img/heka entrega.png"}" class="img-fluid rounded-circle" alt="" /> </div>
            <p class="notify-details">${item.nombre}</p>
            <p class="text-muted mb-0 user-msg">
                <small>${atributos}</small>
            </p>
        </a>`;

        menu.innerHTML += `<li>
            <a href="/tienda/${item.tienda}/producto/${item.id_producto}">
                <span> ${item.nombre} <small>(${item.detalles.cod})</small> </span>
            </a>
        </li>`;
    });

    $(".counter-carrito").text(carrito.length)
    $(".counter-carrito").removeClass("d-none");
    if(!carrito.length) {
        $(".counter-carrito").addClass("d-none")
    }
};

function vaciarCarrito() {
    fetch("/tienda/vaciarCarrito")
    .then(res => {
        if(res.ok) {
            llenarNotificacionCarrito([]);
        }
    })
};


$(document).ready(function() {
    fetch("/tienda/carrito?json=true")
    .then(res => {
        console.log(res);
        res.json().then(d => llenarNotificacionCarrito(d));
    })
});