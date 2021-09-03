$("#agregar-al-carrito").click(agregarAlCarrito);
$("[data-function='quitar']").click(quitarDelCarrito);
$("[data-function='adicionar']").change(calcItem);
$("#ciudadD").blur(calcularCostoEnvio);
$("#comprar").click(calcularCostoEnvio);
$("#inp-search-product").on("input", filtrarProductoPorNombre);
$("#categoria-select").change(filtrarProductoPorCategoria);
$("#sort-select").change(organizarProductos);
$(".vaciar-carrito").click(vaciarCarrito);
$("[data-campo]").change(modifyPricesAndLimitsPerProduct);

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
    //Para agregar al carrito necesito los atributos del prodcuto
    //y tomar el identificador de la tienda colocado en el data-storeId en html que se llama con this
    let atributos = new  Object();
    $("[data-campo]").each((i, select) => {
        atributos[select.dataset.campo] = select.value
    });

    let storeId = $(this).attr("data-storeId");
    let data = new Object({atributos, tienda, storeId})
    
    // Se envía el body al back con los atributos activos, el nombre de la url de la tienda
    //en contrado en *tienda*.hekaentrega.co y el identificador de la tienda.
    fetch("/tienda/agregarAlCarrito/"+$(this).attr("data-id"),{
        method: "POST",
        body: JSON.stringify(data),
        headers: {"Content-Type": "application/json"}
    }).then(d => d.json().then(res => {
        //cuando obtiene respuesta me va llenando el carrito
        llenarNotificacionCarrito(res.carrito);
        let verMensaje = res.mensaje.split(" ")[0]
        Toast.fire({
            icon: verMensaje == "Agregado" ? "success":"warning",
            title: res.mensaje
        })
    }));
};

function quitarDelCarrito() {
    //necesita el identificador del item {external} que identifica cada item particular.
    //Responde con la lista actualizada del carrito
    //finalmente me recalcula el sub-total de la compra
    let identificadorItem = $(this).attr("data-id");
    fetch("/tienda/quitarDelCarrito/"+identificadorItem)
    .then(d => d.json().then((data) => llenarNotificacionCarrito(data)));
    $("#"+identificadorItem).remove();
    calcTotal();
};

function calcItem() {
    //función que utiliza el external de cada item, para calcularme el total del item específico
    let identificador = $(this).attr("data-id");
    let cant = $(this).val();
    let unitPrice = $("#"+identificador).children()[1].textContent;
    let price = $("#"+identificador).children()[3];
    $(price).html(unitPrice * cant);

    //modifica el sub-totasl nuevamente
    calcTotal()

    //si la cantidad de productos solicitado es reducido a cero, se llama la función que elimina el item del carrito
    if(cant <= 0) return quitarDelCarrito.call(this);

    modificarItemCarrito(this);
}

function calcTotal() {
    let subTotal = 0;
    //revisa todos los totales del item para sumar el sub total (valor que se otorga antes de utilizar el cotizador)
    $(".total-item").each((i, item) => {
        subTotal += parseInt($(item).text())
    })

    $("#sub-total").html(subTotal);
    return subTotal;
};

function modificarItemCarrito(input) {
    //Es llamada por cada iteración o cambio en la cantidad de items
    console.log("se está modificando el item del carrito");
    //modifica el valores específicos del item, tanto del back como en el front
    let identificador = $(input).attr("data-id");
    let value = parseInt($(input).val());
    let maxValue = $(input).attr("max");
    $(input).parent().children("p").remove()

    //también me verifica si el valor excede al obtenido del inventario
    if(value > maxValue) {
        let p = document.createElement("p");
        p.classList.add("text-danger");
        p.innerHTML = "Excede la cantidad registrada en inventario. será modificado a: " + maxValue;
        
        $(p).insertAfter(input);
        $(input).val(maxValue)
    };

    //Empieza a utilizar el cotizador
    calcularCostoEnvio();

    //Solo me cambia la cantidad de item en el carrito, para cuando se recargue la página, se guarde la información del cambio
    fetch("/tienda/modificarItemCarrito/"+identificador, {
        method: "POST",
        body: JSON.stringify({cantidad: value}),
        headers: {"Content-Type": "application/json"}
    });
}

async function getStoreInfo(tienda) {
    //Se llama al cargar la página para mostrar información de la tienda y utilizarla tambien en el desarrollo
    //Solo necesita el nombre de la URL de la tienda
    let info = await fetch("/tienda/informacion/"+tienda)
    .then(async d => {
        return await d.json();
    });

    $("[data-store_info]").each((i,e) => {
        let campo = e.getAttribute("data-store_info");
        $(e).text(info[campo]);
    });

    if(info.logoUrl) {
        $("img[alt='Logo tienda']").attr("src", info.logoUrl);
    }

    //Retorna la información de la tienda y también me llena la variable global donde que hace refencia a la misma
    storeInfo = info;
    return info;
};

//La tienda tienda sus propios precios personalizados
let precios = {
    costo_zonal1: 7550,
    costo_zonal2: 11550,
    costo_zonal3: 2800,
    costo_nacional1: 10000,
    costo_nacional2: 17750,
    costo_nacional3: 3400,
    costo_especial1: 21400,
    costo_especial2: 30500,
    costo_especial3: 6300,
    comision_servi: 3.1,
    comision_heka: 1,
    constante_convencional: 600,
    constante_pagoContraentrega: 1500,
    saldo: 0
};

async function getCarrito() {
    //función que me devuelve la lista de items colocados en el carrito.
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
    //Comienzo de la función que utiliza el cotizador que utiliza la plataforma principal para calcular el costo del envío
    let carrito = await getCarrito();
    if(JSON.stringify(carrito) == "{}") {
        return Toast.fire({
            icon: "error",
            text: "El carrito está vacío."
        })
    }
    // let recaudo = parseInt($("#sub-total").text().replace(/\D/, ""));
    //Objeto necesario en el que salen los precios de cotización, la ciudad del remitente y del destinatario para proseguir
    let datos_de_cotizacion = {
        precios,
        ciudadR: storeInfo.ciudadT,
        ciudadD: document.getElementById("ciudadD").dataset
    };
    let costo_envio = 0;
    let guias = new Array();

    //si se le da click al botón de comprar, me inhabilita el boton y le coloca un spiner
    if($(this).attr("id") == "comprar") {
        //Lo primero es revisar que todos los campos son válidos, caso contrario, arroja la excepción
        if(revisarCampos()) {
            return Toast.fire({
                icon: "error",
                text: "Por favor revise los datos ingresados."
            });
        };

        $(this).prop("disabled", true);
        $(this).html('<span class="spinner-grow spinner-grow-sm" role="status" aria-hidden="true"></span> Cargando...');

        const continuar = await Swal.fire({
            icon: "question",
            title: "¿Desea continuar con su compra?",
            showConfirmButton: true,
            showCancelButton: true
        }).then((result) =>{
            if(result.isConfirmed) return true;

            $(this).html('<i class="mdi mdi-truck-fast mr-1"></i> Comprar');
            $(this).removeAttr("disabled");
            return false;
        });

        if(!continuar) return;
    };

    //comienza la revisión de cada item del carrito
    for await (let item of carrito) {
        //multiplica los valores básicos de cotización por la catidad de productos solicitados
        let volumen = item.alto * item.ancho * item.largo * item.cantidad;
        let peso = item.peso * item.cantidad;
        let recaudo = item.precio * item.cantidad
        console.log(item);

        //revisa si hay que sumarle el envío o no para utilar la funciones obtenidas desde el "cotizador.js"
        let cotizador = item.sumar_envio ? 
            sumarCostoDeEnvio(recaudo, "PAGO CONTRAENTREGA", peso, volumen, datos_de_cotizacion) :
            new CalcularCostoDeEnvio(recaudo, "PAGO CONTRAENTREGA", peso, volumen, datos_de_cotizacion);
        
        
        if(!cotizador.flete) continue;

        costo_envio += cotizador.costoEnvio;
        console.log(cotizador);

        //Si fue llamada desde el botón de comprar, comienza a crear la guía del item actual
        if($(this).attr("id") == "comprar") {
            let guia = await crearGuia(item, cotizador);

            //si la función me retorna una guía la guarda, es importante que el usuario verifique la compra
            //ya que la función continúa sin generar error
            if (guia) {
                guias.push(guia);
            }
        };

    };

    console.log("El costo de envío",costo_envio);
    let total = costo_envio + calcTotal();
    if(!costo_envio) {
        total = "No disponible";
        $("#total").addClass("text-danger");
    };

    $("#costo-envio").text(costo_envio);
    $("#total").text(total);
    $(this).html('<i class="mdi mdi-truck-fast mr-1"></i> Comprar');
    $(this).removeAttr("disabled");

    //si se accede a comprar pero por alguna razón no se generó ninguna guía, el progama detona el error
    if (guias.length) {
        //caso contrario, envía una notificación al dueño de la tienda en la plataforma
        //y acomoda el whatsapp que se enviará al mismo (este si tiene que ser manual por parte del comprador)
        enviarNotificacion(guias);
        Swal.fire({
            icon: "success",
            title: "¡Pedido realizado exitosamente!",
            text: "Se recomienda confirmar su pedido a través de WhatsApp, por medio de la siguiente ventana emergente."
        }).then(() =>{
            enviarWhatsappRemitente(guias);
            vaciarCarrito();
            location.reload();
        });
    };
};

async function crearGuia(item, cotizador) {
    // if(revisarCampos()) return;
    let nuevaGuia = new Object();
    let infoDestino = document.getElementById("ciudadD").dataset;

    //La nueva guía comienza por utilizar los campos llenados para agregarlos al destinatario automáticamente
    $("[data-campo]").each((i, input) => {
        let campo = $(input).attr("data-campo");
        nuevaGuia[campo] = $(input).val();
    });

    //Creo arreglos de los que puedo sacar información necesaria contenida en cada objeto de manera más sencilla
    let camposItem = ["alto", "ancho", "largo", "peso", "centro_de_costo"];
    let camposCiudad = ["ciudad", "departamento"];
    let camposTienda = ["celular", "correo", "direccion", "nombre"];

    //Luego itero sobre los mismos para llenar la información de la guía correspondiente
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

    //lleno de forma manual aquellos datos que no pudieron ser llenos de manera automática
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

    
    //Envío la solicitud POST para crear la guía correspondiente a la base de datos, que me devuelve el objeto de la guía creada    
    let guiaCreada = await fetch("/tienda/crearGuiaServientrega", {
        method: "POST",
        body: JSON.stringify(nuevaGuia),
        headers: {"Content-Type": "application/json"}
    }).then( d => d.json());
    console.log(guiaCreada);
    
    item.id = guiaCreada.id_pedido;
    item.timeline = new Date().getTime();

    //Genero el pedido con el mismo id de la guía
    let pedido = await crearPedido(item);

    //retorna la combinación de el pedido y la guía generada en un nuevo objeto
    let orden = Object.assign({}, pedido, guiaCreada);
    return orden;
    // return pr;
};

function revisarCampos() {
    //Función que revisa los campos ingresados antes de generar generar las guías
    //y los muestra para que el usuario detecte donde está el error
    let vacios = 0;
    $(".mensaje-error").remove();

    //primero verifico que todos los campos requeridos estén bien, si no, aumenta la cantidad de vacíos
    $("[required]").each((i,e) => {
        $(e).removeClass("is-invalid");
        if(!$(e)[0].checkValidity()) {
            console.log(e);
            $(e).addClass("is-invalid")
            vacios++
        }
    });

    let inpTelefonos = ["billing-phone", "billing-phone2"];
    //también verifico que los números tengan la longitud correspondiente
    inpTelefonos.forEach(t => {
        $("#"+t).removeClass("is-invalid")
        if ($("#"+t).val().length > 10) {
            $("#"+t).addClass("is-invalid");
            return true
        };
    });

    if(vacios) return true;

    let ciudad = $("#ciudadD")[0].dataset;
    if(Object.entries(ciudad).length <= 1) {
        $("#ciudadD").addClass("is-invalid");
        return true;
    };
    //Devuelve true para cuando haya algún campo inválido y false para cuando todo esté marchando bien
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

    window.open("https://api.whatsapp.com/send?phone=+57" +arrData[0].celularR+ "&text="+mensaje, "_blank");
};

//utiliza la api para enviar la notificación al usuario, recibe la nueva guía + el pedido
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

    //Envía todo lo que contendrá la notificación
    fetch("/tienda/enviarNotificacion", {
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(dataToSend),
        method: "POST"
    });
};

//*PÁGINA PRINCIPAL DE LA TIENDA*
//funciones que utilizan las clases .visible .producto para sortearlo o filtrarlo
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
//*FIN DE PÁGINA PRINCIPAL DE LA TIENDA*

//llena la barra lateral de la tienda y la notificación del carrito, mostrando los items seleccionados y su cantidad
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

//Revisa las opciones seleccionadas en el formulario de atributos y me devuelve el indice coincidente
function getFilteredIndex() {
    const selectores = $("#selectores-atributos").children("select");
    
    let indices;

    //Revisa todos los selectores del formulario
    selectores.each((i,selector) => {
        const selectVal = selector.value;
        let indexes;
        const opciones = selector.querySelectorAll("option");
        
        //Luego revisa entre las opciones que coincidan con el valor seleccionado
        for(let i = 0; i < opciones.length; i++) {
            if(opciones[i].value === selectVal) {
                indexes = $(opciones[i]).attr("data-indexes");
                break;
            }
        }

        indexes = indexes.split(",");

        //para el caso de que haya un solo select
        if(!indices) {
            indices = indexes;
        } else {
            //si hay más de un selector, comienza a filtrar solo aquellos indices coincidentes
            //De manera que la longitud final de *indices* termina siendo 1
            indices = indices.filter(i => {
                let res = false;
                indexes.forEach(j => {
                    if (j === i) res = true;
                });

                return res
            });

        }
    });

    const indice = indices.reduce(v => v);
    return indice;
}

function modifyPricesAndLimitsPerProduct() {
    const index = getFilteredIndex();
    const precios = $("#precios_filtrado").text().split(",");
    const inventarios = $("#inventarios_filtrado").text().split(",");
    const precio = precios[index];
    const inventario = inventarios[index];
    const mostrador_precio = $("#mostrador-precio");
    const mostrador_inventario = $("#mostrador-inventario");

    mostrador_precio.addClass("text-danger alert");
    mostrador_precio.text(currency(precio));
    
    mostrador_inventario.addClass("text-danger alert");
    mostrador_inventario.text(inventario);

    setTimeout(() => {
        mostrador_inventario.removeClass("text-danger alert");
        mostrador_precio.removeClass("text-danger alert");
    }, 500);

}

function currency(val) {
    val = parseInt(val);
    const res = val.toLocaleString("es-CO", {
        style: "currency", 
        currency: "COP",
        minimumFractionDigits: 0
    });

    return res;
}
globalThis.p = modifyPricesAndLimitsPerProduct;

$(document).ready(function() {
    //solicitamos la info de la tienda
    getStoreInfo(tienda);
    fetch("/tienda/carrito?json=true")
    .then(res => {
        console.log(res);
        res.json().then(d => llenarNotificacionCarrito(d));
    });
    
    //Modifico el tamaño de las imagenes para que sean cuadradas
    $(".contenedor-img").each((i,e) => {
        let w = $(e).css("width");
        console.log(w);
        $(e).css("height", w);
    });
});