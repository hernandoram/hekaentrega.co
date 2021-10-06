$(".vaciar-carrito").click(vaciarCarrito);


export const Toast = Swal.mixin({
    toast: true,
    position: "bottom-start",
    showConfirmButton: false,
    timer: 3000,
    didOpen: (toast) => {
        toast.addEventListener('mouseenter', Swal.stopTimer)
        toast.addEventListener('mouseleave', Swal.resumeTimer)
    }
});

export async function getCarrito() {
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

export function llenarNotificacionCarrito(carrito) {
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

        notificacion.innerHTML += `<a href="${item.tienda}/producto/${item.id_producto}" class="dropdown-item notify-item">
            <div class="notify-icon">
                <img src="${item.imagesUrl ? item.imagesUrl.url : "/img/heka entrega.png"}" class="img-fluid rounded-circle" alt="" /> </div>
            <p class="notify-details">${item.nombre}</p>
            <p class="text-muted mb-0 user-msg">
                <small>${atributos}</small>
            </p>
        </a>`;

        menu.innerHTML += `<li>
            <a href="${item.tienda}/producto/${item.id_producto}">
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

export function currency(val) {
    val = parseInt(val);
    const res = val.toLocaleString("es-CO", {
        style: "currency", 
        currency: "COP",
        minimumFractionDigits: 0
    });

    return res;
}

function vaciarCarrito() {
    fetch("/tienda/vaciarCarrito")
    .then(res => {
        if(res.ok) {
            controllers.llenarNotificacionCarrito([]);
        }
    })
};

export async function getStoreInfo(tienda) {
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
    return info;
};

export function calcItem(calcItem) {
    throw new Error("Function not implemented.");
}
