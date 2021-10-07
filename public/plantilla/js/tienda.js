import * as controllers from "./controladoresTienda.js"

$("#agregar-al-carrito").click(agregarAlCarrito);
$("#inp-search-product").on("input", filtrarProductoPorNombre);
$("#categoria-select > .category-filter").click(filtrarProductoPorCategoria);
$("#sort-select").change(organizarProductos);
$(".price-changer").change(modifyPricesAndLimitsPerProduct);
$(".vaciar-carrito").click(() => controllers.vaciarCarrito(tienda));


let storeInfo;
console.log(location)
let tienda = location.pathname.split("/")[1];
const Toast = controllers.Toast

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
        const carrito = res.carrito.filter(d => d.tienda === tienda)
        controllers.llenarNotificacionCarrito(carrito);
        let verMensaje = res.mensaje.split(" ")[0]
        Toast.fire({
            icon: verMensaje == "Agregado" ? "success":"warning",
            title: res.mensaje
        })
    }));
};


// async function getStoreInfo(tienda) {
//     //Se llama al cargar la página para mostrar información de la tienda y utilizarla tambien en el desarrollo
//     //Solo necesita el nombre de la URL de la tienda
//     let info = await fetch("/tienda/informacion/"+tienda)
//     .then(async d => {
//         return await d.json();
//     });

//     $("[data-store_info]").each((i,e) => {
//         let campo = e.getAttribute("data-store_info");
//         $(e).text(info[campo]);
//     });

//     if(info.logoUrl) {
//         $("img[alt='Logo tienda']").attr("src", info.logoUrl);
//     }

//     //Retorna la información de la tienda y también me llena la variable global donde que hace refencia a la misma
//     storeInfo = info;
//     return info;
// };

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

function filtrarProductoPorNombre() {
    let filtro = this.value.toLowerCase();
    
    let productos = $(".ver");
    productos.removeClass("d-none");
    if(!filtro) return;
    productos.each((i,e) => {
        let filtrado = $(e).attr("data-filter-name").toLowerCase();
        if(!filtrado.includes(filtro)) $(e).addClass("d-none");
    }); 
};

function filtrarProductoPorCategoria() {
    let filtro = this.getAttribute("data-category");

    let productos = $(".producto");
    productos.removeClass("d-none");
    productos.addClass("ver")
    // if(!filtro) return;
    productos.each((i,e) => {
        let filtrado = $(e).attr("data-filter-categoria");
        if(!filtrado.includes(filtro)) {
            $(e).addClass("d-none");
            $(e).removeClass("ver");
        }
    });
    let filtradorInp = document.getElementById("inp-search-product");

    filtrarProductoPorNombre.call(filtradorInp);
};

function organizarProductos() {
    let sortBy = this.value;
    if(!sortBy) return;
    let stock = $(".ver");
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

const swiper = new Swiper('.swiper', {
    // Optional parameters
    direction: 'horizontal',
    // loop: true,
    spaceBetween: 10,
    slidesPerView: 4,
    breakpoints: {
        640: {
            slidesPerView: 6,
        },
        1080: {
            slidesPerView: 10
        }
    }

    // // If we need pagination
    // pagination: {
    //     el: '.swiper-pagination',
    // },

    // // Navigation arrows
    // navigation: {
    //     nextEl: '.swiper-button-next',
    //     prevEl: '.swiper-button-prev',
    // },

    // // And if we need scrollbar
    // scrollbar: {
    //     el: '.swiper-scrollbar',
    // },
});
//*FIN DE PÁGINA PRINCIPAL DE LA TIENDA*

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
    mostrador_precio.text(controllers.currency(precio));
    
    mostrador_inventario.addClass("text-danger alert");
    mostrador_inventario.text(inventario);

    setTimeout(() => {
        mostrador_inventario.removeClass("text-danger alert");
        mostrador_precio.removeClass("text-danger alert");
    }, 500);

}

// function currency(val) {
//     val = parseInt(val);
//     const res = val.toLocaleString("es-CO", {
//         style: "currency", 
//         currency: "COP",
//         minimumFractionDigits: 0
//     });

//     return res;
// }

$(document).ready(function() {
    //solicitamos la info de la tienda
    storeInfo = controllers.getStoreInfo(tienda);
    fetch("/"+tienda+"/carrito?json=true")
    .then(res => {
        console.log(res);
        res.json().then(d => controllers.llenarNotificacionCarrito(d));
    });
    
    //Modifico el tamaño de las imagenes para que sean cuadradas
    $(".contenedor-img").each((i,e) => {
        let w = $(e).css("width");
        console.log(w);
        $(e).css("height", w);
    });
});