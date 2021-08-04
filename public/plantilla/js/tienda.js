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
let tienda = window.location.hostname.split(".")[0];

const Toast = Swal.mixin({
    toast: true,
    position: "bottom-start",
    showConfirmButton: false,
    timer: 3000,
    didOpen: (toast) => {
        toast.addEventListener('mouseenter', Swal.stopTimer)
        toast.addEventListener('mouseleave', Swal.resumeTimer)
    }
});

function agregarAlCarrito() {
    let atributos = new  Object();
    $("[data-campo]").each((i, select) => {
        atributos[select.dataset.campo] = select.value
    });

    // let tienda = $(this).attr("data-tienda");
    let storeId = $(this).attr("data-storeId");
    let data = new Object({atributos, tienda, storeId})
    
    fetch("/tienda/agregarAlCarrito/"+$(this).attr("data-id"),{
        method: "POST",
        body: JSON.stringify(data),
        headers: {"Content-Type": "application/json"}
    }).then(d => d.json().then(res => {
        llenarNotificacionCarrito(res.carrito);
        let verMensaje = res.mensaje.split(" ")[0]
        Toast.fire({
            icon: verMensaje == "Agregado" ? "success":"warning",
            title: res.mensaje
        })
    }));
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

    calcularCostoEnvio();

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

    $("[data-store_info]").each((i,e) => {
        let campo = e.getAttribute("data-store_info");
        $(e).text(info[campo]);
    })

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
    try {
        let carrito = await fetch("/tienda/getCarrito")
        .then(d => d.json());
    
        console.log(carrito);
        return carrito;
    } catch (error){
        console.log(error);
    };
}

async function calcularCostoEnvio() {
    console.log(this);
    // let tienda = $(this).attr("data-tienda");
    let carrito = await getCarrito();
    if(JSON.stringify(carrito) == "{}") {
        return Toast.fire({
            icon: "error",
            text: "El carrito está vacío."
        })
    }
    // let recaudo = parseInt($("#sub-total").text().replace(/\D/, ""));
    let datos_de_cotizacion = {
        precios,
        ciudadR: storeInfo.ciudadT,
        ciudadD: document.getElementById("ciudadD").dataset
    };
    let costo_envio = 0;
    let guias = new Array();

    if($(this).attr("id") == "comprar") {
        $(this).prop("disabled", true);
        $(this).html('<span class="spinner-grow spinner-grow-sm" role="status" aria-hidden="true"></span> Cargando...');
    };

    for await (let item of carrito) {
        let volumen = item.alto * item.ancho * item.largo * item.cantidad;
        let peso = item.peso * item.cantidad;
        let recaudo = item.precio * item.cantidad
        console.log(item)
        let cotizador = item.sumar_envio ? 
            sumarCostoDeEnvio(recaudo, "PAGO CONTRAENTREGA", peso, volumen, datos_de_cotizacion) :
            new CalcularCostoDeEnvio(recaudo, "PAGO CONTRAENTREGA", peso, volumen, datos_de_cotizacion);
        costo_envio += cotizador.costoEnvio;
        console.log(cotizador);
        if($(this).attr("id") == "comprar") {
            let guia = await crearGuia(item, cotizador);
            if (guia) {
                guias.push(guia);
            }
        };
    };

    $("#costo-envio").text(costo_envio);
    $("#total").text(costo_envio + calcTotal());
    $(this).html('<i class="mdi mdi-truck-fast mr-1"></i> Comprar');
    $(this).removeAttr("disabled");
    if($(this).attr("id") == "comprar" && !guias.length) {
        Swal.close();
        Toast.fire({
            icon: "error",
            text: "Por favor revise los datos ingresados."
        })
    } else if (guias.length) {
        enviarNotificacion(guias);
        Swal.fire({
            icon: "success",
            title: "¡Pedido realizado exitosamente!",
            text: "Se recomienda confirmar su pedido a través de WhatsApp, por medio de la siguiente ventana emergente."
        }).then(() =>{
            enviarWhatsappRemitente(guias);
            vaciarCarrito();
        });
    };
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
    camposItem.forEach(c => {
        nuevaGuia[c] = typeof item[c] == "number" ? item[c] * item.cantidad : item[c];
    });
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
    nuevaGuia.type = "PAGO CONTRAENTREGA";
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
    let pedido = await crearPedido(item);
    let orden = Object.assign({}, pedido, guiaCreada);
    return orden;
    // return pr;
};

function revisarCampos() {
    let vacios = 0;
    $(".mensaje-error").remove();

    $("[required]").each((i,e) => {
        $(e).removeClass("is-invalid");
        if(!$(e)[0].checkValidity()) {
            console.log(e);
            $(e).addClass("is-invalid")
            vacios++
        }
    });

    let inpTelefonos = ["billing-phone", "billing-phone2"];
    inpTelefonos.forEach(t => {
        $("#"+t).removeClass("is-invalid")
        if ($("#"+t).val().length > 10) {
            $("#"+t).addClass("is-invalid");
            return true
        };
    });
    if(vacios) return true
    let ciudad = $("#ciudadD")[0].dataset;
    if(Object.entries(ciudad).length <= 1) {
        $("#ciudadD").addClass("is-invalid");
        return true;
    };
    return false;
}

async function crearPedido(item) {
    return await fetch("/tienda/crearPedido", {
        method: "POST",
        body: JSON.stringify(item),
        headers: {"Content-Type": "application/json"}
    }).then(d => d.json())
};

function enviarWhatsappRemitente(arrData) {
    let mensaje = "Hola, vengo de la tienda en Heka Entrega %0A"
    mensaje+= "*Mi nombre es:* " + arrData[0].nombreD + "%0A";
    mensaje+= "*Ciudad y departamento:* " + arrData[0].ciudadD + ", " + arrData[0].departamentoD + "%0A";
    mensaje+= "*Dirección:* " + arrData[0].direccionD + "%0A";
    mensaje+= "*Números de contacto:* ";
    mensaje += arrData[0].telefonoD == arrData[0].celularD ?
        arrData[0].telefonoD : arrData[0].telefonoD +", "+ arrData[0].celularD;
    
    let identificadores = arrData.reduce((a,b,i) => {
        console.log(a);
        console.log(b.id_heka);
        console.log("index", i);
        return a + "%0A-" + b.id_heka;
    }, "");
    
    mensaje += "%0A%0AMi pedido ha sido realizado con los Nº:" + identificadores;
    if(arrData[0].observaciones) mensaje += "%0A%0ANota adicional: " + arrData[0].observaciones;

    console.log(arrData);
    console.log(mensaje);
    window.open("https://api.whatsapp.com/send?phone=+57" +arrData[0].celularR+ "&text="+mensaje, "_blank");
};

function enviarNotificacion(arrData) {
    let fecha = new Date(),
        year = fecha.getFullYear(),
        mes = estandarizar(parseInt(fecha.getMonth()) + 1),
        dia = estandarizar(fecha.getDay()),
        hora = estandarizar(fecha.getHours()),
        minutos = estandarizar(fecha.getMinutes());

    function estandarizar(n) {
        return n < 10 ? "0"+n : n;
    };

    fecha = dia + "/" + mes + "/" + year + " - " + hora + ":" + minutos;

    let detalles = new Array();
    let guiasPlural = arrData.length > 1 ? "las guías: " : "la guía: ";
    let mensaje = arrData.reduce((a,b,i) => {
        let divisor = i == arrData.length - 1 ? "." : ", ";
        detalles.push(b.id_heka);
        return a + b.id_heka + divisor;
    }, "Ha sido generado un pedido desde latienda con " + guiasPlural);

    let dataToSend = {
        icon: ["store", "primary"],
        timeline: new Date().getTime(),
        visible_user: true, fecha,
        user_id: arrData[0].id_user,
        mensaje, detalles
    };

    fetch("/tienda/enviarNotificacion", {
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(dataToSend),
        method: "POST"
    });
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
};

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

        notificacion.innerHTML += `<a href="/producto/${item.id_producto}" class="dropdown-item notify-item">
            <div class="notify-icon">
                <img src="${item.imagesUrl ? item.imagesUrl.url : "/img/heka entrega.png"}" class="img-fluid rounded-circle" alt="" /> </div>
            <p class="notify-details">${item.nombre}</p>
            <p class="text-muted mb-0 user-msg">
                <small>${atributos}</small>
            </p>
        </a>`;

        menu.innerHTML += `<li>
            <a href="/producto/${item.id_producto}">
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
    getStoreInfo(tienda);
    fetch("/tienda/carrito?json=true")
    .then(res => {
        console.log(res);
        res.json().then(d => llenarNotificacionCarrito(d));
    });
    
    $(".contenedor-img").each((i,e) => {
        let w = $(e).css("width");
        console.log(w);
        $(e).css("height", w);
    });
});


console.log(window);
