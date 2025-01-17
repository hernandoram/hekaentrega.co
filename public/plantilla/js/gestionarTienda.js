import { db, doc, collection } from "/js/config/initializeFirebase.js";
import { user_id } from '/js/cargadorDeDatos.js';
import { createModal } from '/js/render.js'
$("#nav-tienda-productos-tab").click(fillProducts);
$("#nav-tienda-home-tab").one("click", cargarInfoTienda);
$("[href='#tienda']").one("click", cargarInfoTienda);

$("#agregar-producto-tienda").click(() => {
    let modal = new VentanaCrearProducto();
    modal.showModal();
    new Dropzone("#imagenes-producto");
    modal.hideElements();
});

$("#actualizar-tienda").click(actualizarTienda);
$("#url-tienda").blur(verificarExistenciaTienda);
$("#url-tienda").on("input", muestraDelLinkTienda);

$("#subir-logo-tienda").click(cargarLogoPortada);
$("#subir-portada-tienda").click(cargarLogoPortada);

$("#btn-buscar-pedidos").click(fillPedidos);

$("#logo-portada-tienda").on("mouseenter", () => $("#actualizar-logo-portada").show("fast"))
$("#logo-portada-tienda").on("mouseleave", () => $("#actualizar-logo-portada").hide("fast"))

$(".icon-selector").click(selectIcon)
$("#colorP-tienda,#colorI-tienda").change(selectorColor)

if(location.hash === "#tienda") {
    $(document).ready(cargarInfoTienda);
}

//comienzo configurando dropzone
Dropzone.options.imagenesProducto = {
    paramName: "file", // The name that will be used to transfer the file
    maxFilesize: 2, // MB
    maxFiles: 10,
    dictDefaultMessage: "Arreastre o Cargue las imágenes a mostrar<br><i class='fa fa-upload fa-2x'></i>",
    dictMaxFilesExceeded: "No puedes subir más imágenes",
    addRemoveLinks: true,
    uploadMultiple: true,
    acceptedFiles: "image/*",
    dictRemoveFile: "<button class='btn btn-danger badge'>Eliminar</button>"
};

const summernoteOptions = {
    fontNames: ['Arial', 'Arial Black', 'Comic Sans MS', 'Courier New', "Times New Roman", "Helvetica", "Impact"],
    styleTags: [
        'p',
        // {title: 'pequeña', tag: 'h6', value: 'h6'},
        {title: 'Título', tag: 'h4', value: 'h4'},
        {title: 'Sub-título', tag: 'h5', value: 'h5'},
    ],
    toolbar: [
        ['style', ['style']],
        ['config', ['bold', 'italic', 'underline', 'strikethrough', 'superscript', 'subscript']],
        ['font', ['fontsize', 'fontname']],
        ['color', ['color']],
        ['paragraph', ['ul', 'ol', 'paragraph', 'height', 'fullscreen']],
    ],
    lang: "es-ES",
    callbacks: {
        onChange: limitarCaracteres
    }
};
const tiendaDoc = doc(collection(db, "tiendas"), user_id);

let categorias = ["Juguetes y Bebés", "Accesorios para Vehículos", "Herramientas e Industrias", "Bienestar", "Kits", "Alimentos", "Moda", "Arte", "Rituales", "Telas y Espumas", "Aretes", "Mascotas", "Tecnología", "Relojes y Joyas", "Hogar y electrodomesticos", "Hilo piedra", "Collares", "Anillos", "Salud sexual", "Vehículos", "Pulseras", "Inmuebles", "Velas", "Deportes y Aire Libre", "Colchones y Colchonetas", "Belleza y Cuidado Personal", "Otros", "Sin Categoría"];
let atributos = {
    color: ["Amarillo", "Azul", "Rojo", "Verde", "Rosado", "Purpura", "Marrón", "Blanco", "Negro", "Naranja"],
    talla: ["XXS", "XS", "S", "M", "L", "XL", "XXL"],
    sabor: ["Vainilla", "Chocolate", "Fresa", "Mora", "Arequipe", "Coco", "Chicle"]
}

class VentanaCrearProducto {
    constructor(id) {
        this.modal = createModal();
        this.id = id || "producto";
        this.categorias = categorias.slice();
        this.atributos = JSON.parse(JSON.stringify(atributos));
        this.stock; this.dropzone; this.imagesUrl;
    }

    appendBasicInfo() {
        this.modal.find(".modal-body").html(`<div class="my-4">
            <h3>Información general</h3>
            <form class="row align-items-end">
            <div class="form-group col-12">
                <label for="nombre-${this.id}">Nombre del producto</label>
                <input type="text" name="nombre-${this.id}" data-campo="nombre"
                id="nombre-${this.id}" class="form-control" maxlength="25" required>
            </div>
            <div class="form-group col">
                <label for="precio-${this.id}">Precio</label>
                <input type="number" name="precio-${this.id}" id="precio-${this.id}" data-campo="precio" class="form-control" required>
            </div>
            <div class="form-group col-12 col-sm-6">
            
                <label for="categoria-${this.id}">Seleccionar categoría</label>
                <div class="input-group">
                    <select class="custom-select form-control" data-campo="categoria" id="categoria-${this.id}" aria-label="Seleccionar Categoría">
                        <option value="">Seleccione una Categoría...</option>
                    </select>
                    <div class="input-group-append">
                        <button id="habilitar-nueva-categoria-${this.id}" alt="Agregar nueva" class="btn btn-outline-secondary" type="button"><i class="fa fa-plus d-lg-none"></i><span class="d-none d-lg-block">Agregar Nueva</span></button>
                    </div>
                </div>

                <div class="input-group" style="display: none">
                    <input type="text" class="form-control" id="new-categoria-${this.id}" placeholder="Agregar Categoría"></input>
                    <div class="input-group-append">
                        <button id="cancel-add-categoria-${this.id}" alt="cancelar" class="btn btn-outline-secondary" type="button"><i class="fa fa-times d-lg-none"></i><span class="d-none d-lg-block">Cancelar</span></button>
                        <button id="add-categoria-${this.id}" alt="Agregar nueva categoría" class="btn btn-outline-primary" type="button"><i class="fa fa-check d-lg-none"></i><span class="d-none d-lg-block">Agregar</span></button>
                    </div>
                </div>
                
            </div>
            <div class="form-group col">
                <label for="garantia-${this.id}">Garantía (meses)</label>
                <input type="number" name="garantia-${this.id}" data-campo="garantia" id="garantia-${this.id}" class="form-control">
            </div>
            </form>
        </div>`);

        $("#nombre-"+this.id+", #precio-"+this.id).blur(() => {
            //Luego que deje el input...
            console.log($("#nombre-"+this.id).val());
            console.log($("#precio-"+this.id).val());
            console.log(this.id);
            //Si ambos están vacios, se ocultan los otros valores del formulario, de resto se muestran
            if($("#nombre-"+this.id).val() && $("#precio-"+this.id).val()) {
                this.fillVariants()
                this.modal.find(".modal-body").children().show("fast")
            } else {
                this.hideElements();
            }
        })

        this.fillSelectCategory();
    }

    fillSelectCategory() {
        //Itera entre las categorías para llenar el select.
        for(let categoria of this.categorias) {
            let option = document.createElement("option");
            option.setAttribute("value", categoria)
            option.innerHTML = categoria
            $(option).appendTo(this.modal.find("#categoria-" + this.id))
        };
    }
    
    //función con capacida de agregarme una nueva categoría al select de categorías
    addNewCategory() {
        //cuando se le da click a agrega nueva categoría, me cambia a un input para agregar dicha categoría
        this.modal.find("#habilitar-nueva-categoria-" + this.id).click(function () {
            $(this).parents(".input-group").hide("slow")
            $(this).parents(".input-group").next().show("slow")
        });

        //si se cancela, vuelve a su estado natural
        this.modal.find("#cancel-add-categoria-" + this.id).click(function () {
            $(this).parents(".input-group").hide("slow")
            $(this).parents(".input-group").prev().show("slow")
        });

        let addCategoria = this.modal.find("#add-categoria-"+this.id)

        addCategoria.click(async (e) => {
            let newCategory = addCategoria.parent().prev().val();

            //si existe valor, me agrega la nueva categoría al select y la selecciona por defecto
            if (newCategory) {
                this.categorias.push(newCategory);
                let option = document.createElement("option");
                option.setAttribute("value", newCategory)
                option.setAttribute("selected", true)
                option.innerHTML = newCategory
                $(option).appendTo(this.modal.find("#categoria-" + this.id))
            }
            
            addCategoria.parents(".input-group").hide("slow")
            addCategoria.parents(".input-group").prev().show("slow")
        });
    }

    //inserta en el modal los atributos ingresados.
    appendAttributes() {
        //Agrega los htmls necesarios
        let htmlAtributos = document.createElement("div");
        htmlAtributos.setAttribute("id", "atributos-"+this.id);
        htmlAtributos.classList.add("my-4")
        let titulo = document.createElement("h3");
        titulo.innerHTML = "Atributos del producto";
        let definicion = document.createElement("div");
        definicion.innerHTML = "<h6 class='ml-2'><small>Puede que tu producto tenga uno, varios o ningún atributo o característica. Elige los atributos de tu producto y sus respectivas variaciones.</small></h6>"
        definicion.classList.add("text-muted", "border-left-secondary");
        let btn_group = document.createElement("div");

        //Itera entre los campos de atributos
        for(let attrTitle in this.atributos) {
            let btn_inner_group = document.createElement("div")
            let card = document.createElement("div");
            card.setAttribute("id", attrTitle + this.id)
            card.setAttribute("class", "card attr-card m-2");
            btn_inner_group.setAttribute("class", "card-body");
            card.style.display = "none";
            
            //agrega el botón principal que contendrá las los atributos
            btn_group.innerHTML += `<input type="button" class="btn btn-outline-info m-1 campo" value="${attrTitle}">`;

            //Luego itera en lo atributos específicos para insertarlo en el html
            for (let attr of this.atributos[attrTitle]) {
                btn_inner_group.innerHTML += `<input type="button" class="btn btn-outline-info m-1 btn-toggle atributo" data-fillStock="${attrTitle}" value="${attr}">`;
            }

            card.appendChild(btn_inner_group);
            btn_group.appendChild(card);
        }

        htmlAtributos.append(titulo, definicion, btn_group);
        // agrega el botón que vacía los atributos
        htmlAtributos.innerHTML += `<input type="button" class="btn btn-info m-1" value="Ninguno" id="sn-attr-${this.id}">
        </input>`

        $(htmlAtributos).appendTo(this.modal.find(".modal-body"));
    }

    selectAttributes() {
        $("input.campo").click(function() {
            //Muestra los atributos disponibles a seleccionar
            if($("input.campo.active").length < 2 || $(this).hasClass("active")) {
                //me limita la cantidad de atributos por producto
                $(this).toggleClass("active");
                $(this).next().toggle("slow");
            } else {
                Toast.fire({
                    icon: "error",
                    title: "Solo puedes seleccionar 2 atributos."
                })
            }
        });

        //Vacía todos los atributos
        $("#sn-attr-"+ this.id).click(() => {
            $(".atributo, .campo").removeClass("active");
            $(".attr-card").hide("fast");
        });

    }

    appendDimentions() {
        let dimentions = document.createElement("div");
        dimentions.classList.add("mb-3");
        let htmlDimentions = `<div class="my-4">
        <h3>Dimensiones</h3>
        <div class="text-muted border-left-secondary">
            <h6 class="ml-2"><small>Las dimensiones de Longitud serán expresadas en centímetros y el peso en kilogramos, se utilizan para calcular el costo de envío al momento de realizar la compra (Tomar en cuenta las limitaciones de la transportadora en cuanto a valores máximos y mínimos).</small></h6>
        </div>
        <form>
          <div class="form-row">
            <div class="form-group col-6 col-sm-3">
              <label for="dim-alto-${this.id}">Alto</label>
              <input type="number" class="form-control" data-campo="alto" id="dim-alto-${this.id}" required>
            </div>
            <div class="form-group col-6 col-sm-3">
              <label for="dim-ancho-${this.id}">Ancho</label>
              <input type="number" class="form-control" data-campo="ancho" id="dim-ancho-${this.id}" required>
            </div>
            <div class="form-group col-6 col-sm-3">
              <label for="dim-largo-${this.id}">Largo</label>
              <input type="number" class="form-control" data-campo="largo" id="dim-largo-${this.id}" required>
            </div>
            <div class="form-group col-6 col-sm-3">
              <label for="dim-peso-${this.id}">Peso</label>
              <input type="number" class="form-control" data-campo="peso" id="dim-peso-${this.id}" required>
            </div>
          </div>
        </form>`

        dimentions.innerHTML = htmlDimentions
        $(dimentions).appendTo(this.modal.find(".modal-body"))
    }

    appendProductImgs() {
        let divProducImgs = document.createElement("div")
        divProducImgs.classList.add("my-4")
        divProducImgs.setAttribute("id", "contenedor-imagenes-producto");
        divProducImgs.innerHTML = `<h3>Imágenes del Producto</h3>
        <div class="text-muted border-left-secondary">
            <h6 class="ml-2"><small>Procura utilizar imágenes cuadradas de máximo 1000 pixeles de ancho y que su tamaño no sea mayor a 2 mb</small></h6>
        </div>
        <form action="/tienda/subirImagen" class="dropzone" id="imagenes-producto">
          <div class="fallback">
            <input name="file" type="file" accept=".jpg, .jpeg, .png" multiple/>
          </div>
        </form>`;

        $(divProducImgs).appendTo(this.modal.find(".modal-body"));

    }

    //función que me muestra las variantes del producto a partir de su nombre y atributos
    appendVariants() {
        let htmlVariants = document.createElement("div");
        htmlVariants.classList.add("my-4");
        $(htmlVariants).appendTo(this.modal.find(".modal-body"));
        htmlVariants.innerHTML = "<h3>Variantes de producto</h3>";

        let definicion = document.createElement("div");
        definicion.innerHTML = "<h6 class='ml-2'><small>Cada variación tiene un precio, código de almacenamiento y una cantidad en inventario.</small></h6>"
        definicion.classList.add("text-muted", "border-left-secondary");
        htmlVariants.appendChild(definicion);
        let table = document.createElement("table");
        table.setAttribute("class", "table table-responsive");
        table.setAttribute("id", "table-"+this.id);

        $(".atributo,.campo,#sn-attr-"+this.id).click((e) => {
            //cada vez que se da click a algún atributo o campo del atributo comienza a llenar las variantes desde cero
            if ($(e.target).hasClass("atributo")) $(e.target).toggleClass("active");
            
            this.fillVariants();
        });

        htmlVariants.append(table);

    }

    //Muestra y edita la tabla en la que se muestran las variantes
    fillVariants() {
        let variantes = this.fillAtributes();
        let table = document.getElementById("table-"+this.id);
        table.innerHTML = "<tr><th>Precio</th><th>Cód</th><th>Cantidad</th></tr>";
        //itero entre los atributos de cada variante
        for (let atrib of variantes) {
            let arrAttr = new Array();
            let precio = $("#precio-" + this.id).val();
            let nombre = $("#nombre-" +this.id).val();
            let cantidad = 10;
            //Itero entre los atributos para generar el codigo de la variante
            for(let at in atrib)  {
                if(typeof atrib[at] != "object") arrAttr.push(atrib[at]);
            }
            arrAttr.unshift(nombre)
            arrAttr = arrAttr.map(v => {
                return v.slice(0,2);
            })

            if(document.getElementById(arrAttr.join("-"))) {
                let el = document.querySelectorAll("#"+arrAttr.join("-")).length;
                console.log(document.querySelectorAll("#"+arrAttr.join("-")))
                console.log(el)
            }
            let tr = document.createElement("tr");
            tr.setAttribute("id", arrAttr.join("-"));
            tr.innerHTML = `
                <td><input class="form-control" data-campo-stock="precio" value="${precio}" required/></td>
                <td><input class="form-control" data-campo-stock="cod" value="${arrAttr.join("-")}" readonly/></td>
                <td><input class="form-control" data-campo-stock="cantidad" value="${cantidad}" required/></td>
            `;
            table.appendChild(tr)
        }

        console.log(variantes);
        this.stock = variantes;
        this.saveVariants()
        console.info("fillVariants");

    }

    saveVariants() {
        let counter = 0;
        //Itera entre aquellos inputs que tienen dicho atributo, para llenar el stock que será enviado a la base de datos
        $("[data-campo-stock]").each((i, v) => {
            //El contador es necesario para insertalos en el nº de stock correspondiente
            //verifica que i sea diferente de cero y que el residuo sea cero para iniciar el contador
            //el contador corresponde al número que toma el item en el arreglo del stock
            if(i && i % 3 == 0) {
                counter ++;
            };

            let campo = v.getAttribute("data-campo-stock");
            if(typeof this.stock[counter].detalles != "object") this.stock[counter] = new Object()
            this.stock[counter].detalles[campo] = isNaN(parseInt(v.value)) ? v.value : parseInt(v.value);
        });
    }

    fillAtributes() {
        let atributes = new Object();

        //reviso entre los botones de las distiguidas clases para insertar los atribitos con
        //sus pares clave-valor en {atributes}
        $(".atributo.active").each(function() {
            let active = $(this).parents(".attr-card").prev().hasClass("active");
            if(atributes[$(this).attr("data-fillStock")] && active) {
                //verifica que exita la clave para solo sumar el atributo al final del array
                atributes[$(this).attr("data-fillStock")].push($(this).val())
            } else if (active) {
                //si la condicion anterior no se cumple, me crea un arreglo con el valor actual
                atributes[$(this).attr("data-fillStock")] = new Array($(this).val())
            }
        });


        // ****** ALGORITMO REAL ************///
        let variantes = new Array({});
        
        //Itero entre las llaves de los atributos llenos previamente para llenar las variantes
        let x = 0;
        console.group("\nComienza algoritmo");
        for(let attr in atributes) {
            x++
            console.group("viendo atributo")
            console.log(x, attr)
            for (let i = 0; i < atributes[attr].length; i++) {
                console.log("viendo valor atributo", i, atributes[attr][i]);
                //por cada atributo reviso las variantes para llenarla.
                variantes.map((v,j) => {
                    //copio la variante
                    let conjAttr = Object.assign({}, v);
                    //le asigno el valor del atributo actual
                    conjAttr[attr] = atributes[attr][i];
                    
                    if(!v[attr]) {
                        //Si no exite el atributo, lo introduzco en el arreglo de variantes
                        variantes[j][attr] = atributes[attr][i];
                    } else if(variantes.length == j + 1){
                        variantes.splice(j+1,1,conjAttr);
                    } else {
                        variantes.push(conjAttr)
                    }
                    console.log("Conociendo las variantes", v);
                })
            };
            console.groupEnd();
        }
        console.groupEnd("Termina algoritmo");

        //Necesito filtrar para aliminar aquellas variantes que se parecen, y así no duplicarlas
        variantes = variantes.filter((v, i) => {
            let res = true;
            for(let j = i+1; j < variantes.length; j++) {
                let equals = 0, all = 0
                for (let at in v) {
                    all++
                    if(variantes[j][at] == v[at]) equals++
                }

                if (equals == all) {
                    res = false;
                    break;
                }
            }
            return res;
        });


        variantes.forEach(v => v.detalles = new Object());
        return variantes;
    }

    appendAditionalInfo() {
        let htmlAditionalInfo = document.createElement("div");
        htmlAditionalInfo.classList.add("my-4");
        htmlAditionalInfo.innerHTML = "<h3>Infomación adicional</h3>"

        let btn_cobra_envio = `<div class="btn-group-toggle m-3 d-flex flex-wrap" data-toggle="buttons">
            <label class="btn btn-block btn-outline-success">
            <input type="checkbox" id="sumar-envio-${this.id}" data-campo="sumar_envio" value="0">
            <i class="fa fa-check-circle mr-3"></i>
            Cobrar Envío
            </label>
        </div>
        <div class="text-muted border-left-secondary">
            <h6 class="ml-2"><small>Si habilitas \"Cobrar envío\", el costo del envío no lo asumirá tu tienda, se sumará al valor del recaudo de la transacción</small></h6>
        </div>`;

        let form = `<form class="mt-3">
            <div class="form-group">
            <label for="descripcion-corta-producto">Descripción corta</label>
            <input type="text" name="descripcion-corta-producto" data-campo="descripcion"
            id="descripcion-corta-producto" class="form-control" maxlength="40">
            </div>
            <div class="form-group">
            <label for="descripcion-completa-producto">Descripción completa</label>
            <textarea name="descripcion-completa-producto" id="descripcion-completa-producto" data-campo="descripcion_detallada" class="form-control"></textarea>
            </div>
        </form>`;

        htmlAditionalInfo.innerHTML += btn_cobra_envio + form;
        $(htmlAditionalInfo).appendTo(this.modal.find(".modal-body"))

        $("#sumar-envio-"+this.id).change(function () {
            this.value = this.checked ? 1 : 0
        })
    }

    //Obtiene el nuevo producto que se creó
    get productCreated() {
        //Primero lleno el stock.
        this.saveVariants();
        let product = new Object();

        //Itera entre todos los campos para llenar el producto
        $("[data-campo]").each((i,v) => {
            let campo = v.getAttribute("data-campo");
            let value = isNaN(parseInt(v.value)) ? v.value : parseInt(v.value);
            product[campo] = value;
        });

        //Me devuelve el producto creado.
        product.stock = this.stock;
        product.storeId = user_id;
        return product;
    };

    //me guarda la imagenes agregadas al producto, recibe la referencia de firestore y storage
    async uploadImages(storageRef, firestoreRef) {
        //Obtengo las imagenes agregadas al dropzone
        let files = document.getElementById("imagenes-producto").dropzone.files;
        
        let urls = new Array()
        for await(let file of files) {
            if(!file.accepted) continue;
            //obtengo el nombre del archivo subido
            let name = new Date().getTime() + file.name;
            //Elimino los parentesis de las imagenes para que se puedan mostrar sin problema como fondo
            name = name.replace(/[\(\)]/g, "");

            let fileUploaded = await storageRef.child(name).put(file);
            let url = await fileUploaded.task.snapshot.ref.getDownloadURL()

            //Luego de subir la imágen, guardo la url junto con el nombre final
            urls.push({url, fileName: name});
        };

        console.log(urls)

        //Antes de terminar con la función es necesario actualizar el la referencia del documento
        //con las nuevas imagenes ingresadas
        firestoreRef.get().then((doc) => {
            let urlsAntiguas = doc.data().imagesUrl;
            console.log(doc.data());
            //Para productos que fueron actualizados, revisa si existen imágenes previamente
            //para concatenarlas con las imegenes nuevas
            if(urlsAntiguas) {
                urls = urls.concat(urlsAntiguas);
            };

            //finalmente actualizo el arreglo de imágenes que tiene el documento
            doc.ref.update({imagesUrl: urls});
        });

    };

    //oculta todos los divs contenidos en el cuerpo del modal ignorando el primero
    hideElements() {
        this.modal.find(".modal-body").children().each((i, c) => {
            if(i) {
                c.style.display = "none";
            }
        })
    }

    //función utilizada particularmente para productos ya existentes, recibe el producto solicitado
    fillAll(data) {
        for(let campo in data) {
            //me llena cada input con la información correspondiente
            $("[data-campo='"+campo+"']").val(data[campo]);

            //ya que las categorías no son un input, son necesarios un funcionamiento diferente para cuando el 
            // atributo registrado en la base de datos no exista en la lista de atributos
            if(campo == "categoria" && this.categorias.indexOf(data[campo]) == -1) {
                let categoria = this.modal.find("#new-categoria-"+this.id);
                let addCategoria = this.modal.find("#add-categoria-"+this.id);
                categoria.val(data[campo]);
                addCategoria.click();
            };
        };

        data.stock.forEach((stock, i) => {
            //Reviso el stock registrado, para activar los botones correpondientes a cada atributo
            //Y así llenar la variantes desde cero
            for (let attr in stock) {
                $(".atributo, .campo").each((i, btn) => {
                    //Para mostrarle al usuario los atributos que agregó previamente del producto
                    //y que se vuelvan a guardar sin ningún problema,
                    //Se verifica que el botón actual tenga como valor el atributo o el campo del atributo correspondiente
                    if((btn.value == stock[attr] || btn.value == attr) 
                    && !btn.classList.contains("active")) {
                        btn.classList.add("active")
                    }
                })
                
                //Habilito también la visibilidad de los atributos contenidos, si no estaban visibles anteriormente
                if($("#" + attr + this.id).css("display") == "none") {
                    $("#" + attr + this.id).show();
                }
                
            };

            //finalmente lleno las variantes
            this.fillVariants();
        });

        let counter = 0;

        //de la misma manera en que se llenan las variantes, itero en cada campo del stock
        //para actualizarla con el valor correspondiente del stock
        $("[data-campo-stock]").each((index, item) => {
            if(index && index % 3 == 0) counter ++
            let campo = $(item).attr("data-campo-stock");
            let stock = data.stock[counter];
            $(item).val(stock.detalles[campo]);
        });

        //me aseguro que el botón de sumar envío también esté como corresponda
        let sumar_envio = $("#sumar-envio-"+this.id);
        if(parseInt(sumar_envio.val())) {
            sumar_envio.click();
        }

        this.modal.find(".note-editable").html(data.descripcion_detallada);

        //Llenos laimagenes de ladata, para mostrarle también al usuario las imágenes que tiene el producto actualmente
        this.imagesUrl = data.imagesUrl;
        this.fillImagesPreloaded(data.imagesUrl);
    };

    fillImagesPreloaded(urls) {
        let div = document.createElement("div");
        div.setAttribute("id", "imagenes-precargadas")
        div.setAttribute("class", "d-flex justify-content-arround");
        for(let urlInfo of urls) {
            let imgCont = document.createElement("div");
            let img = document.createElement("img");
            let action = document.createElement("span");

            //Dependiendo de la cantidad de imágenes, se cambia el botón de eliminar, pera que respete el responsive
            if(urls.length < 6) {
                action.innerHTML = "<i class='fa fa-trash d-md-none'></i><span class='d-none d-md-block text-truncate'>Eliminar</span>";
            } else {
                action.innerHTML = "<small><i class='fa fa-trash fa-sm'></i></small>"
            };

            action.setAttribute("class", "btn btn-danger badge badge-pill float-right eliminar-imagen")
            action.addEventListener("click", () => {
                this.deleteImage(urlInfo, urls)
            })
            action.style.position = "relative";

            img.setAttribute("src", urlInfo.url);
            img.classList.add("rounded", "w-100")
            imgCont.classList.add("m-1")
            action.classList.add("m-2")
            imgCont.style.width = urls.length > 4 ? (100 / urls.length) + "%" : "25%";
            
            imgCont.append(img, action);
            
            div.appendChild(imgCont);
        }

        $(div).insertBefore("#imagenes-producto");
    }

    deleteImage(urlInfo, urls) {
        //recibe como parámetros el arreglo de las imágenes a modificar, y la imagen que se desea eliminar
        urls = urls.filter(dato => {
            //Si la imagen conincide con la seleccionada, ésta no será tomada en cuenta
            return dato.url != urlInfo.url
        });


        let storageRef = firebase.storage().ref()
        .child(user_id+"/productos/" + this.id);

        //inmediatamente elimino el seleccionada de la referencia
        storageRef.child(urlInfo.fileName).delete().catch(() => {
            console.log("El documento .../" + this.id + "/" + urlInfo.fileName + " no existe");
        });

        //y a su vez, actualizo el banco de imágenes del producto
        tiendaDoc.collection("productos").doc(this.id).update({imagesUrl: urls}).then(() => {
            $("#imagenes-precargadas").remove();
            this.fillImagesPreloaded(urls);
        });
    };

    //función que se habilita para un producto existente
    appendBtnDelete() {
        let btn = document.createElement("button");
        btn.setAttribute("class", "btn btn-danger mr-4");
        btn.setAttribute("id", "eliminar-producto");
        btn.addEventListener("click", () => {
            Swal.fire({
                icon: "warning",
                text: "¿Estás seguro que desea eliminar el producto?, no lo podrá recuperar",
                confirmButtonText: "Si, eliminar"
            }).then(res => {
                if(res.isConfirmed) {
                    this.deleteProducto();
                }
            })
        });

        btn.innerHTML = "Eliminar Producto"
        this.modal.find(".modal-footer > button:first").before(btn);
        this.modal.find(".modal-footer > button:last").text("Actualizar");
    };
 
    //me habilita algunas funciones necesarias como la de crear producto
    activatefunctions() {
        let btn_continue = this.modal.find("#btn-continuar-modal-creado");
        const options = Object.assign({} ,summernoteOptions);
        options.toolbar = [
            ['style', ['style']],
            ['config', ['bold', 'italic', 'underline']],
            ['paragraph', ['ul', 'ol']],
            ['font', ['fontsize', 'fontname', 'color']],
        ];
        options.height = "120px"
        const summernote = $("#descripcion-completa-producto").summernote(options);
        btn_continue.text("Crear Producto");
        btn_continue.click(() => {
            btn_continue.html('<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Loading...')
            btn_continue.prop("disabled", true);
            this.createProduct();
        });
    }


    async deleteProducto() {
        let producto = tiendaDoc.collection("productos").doc(this.id);
        let images = await producto.get().then(doc => doc.data().imagesUrl);

        //Primero necesito iterar entre las imágenes para eliminarlas todas del banco de imagenes
        for (let url of images) {
            this.deleteImage(url, images)
        };

        //luego elimino la referencia del producto en cuestión
        producto.delete();
        this.modal.modal("hide");
        fillProducts();
    }

    async createProduct() {
        let producto = this.productCreated;
        console.log(this.invalidFields);
        //Primero verifica que todos los campos importantes estén llenos
        if(this.invalidFields) {
            let btn = this.modal.find("#btn-continuar-modal-creado");
            btn.removeAttr("disabled");
            btn.html("Continuar")
            return;
        };

        let docRef = tiendaDoc.collection("productos");
        let docId;

        //si es un nuevo producto lo crea y me devuelve el id
        //En caso contrario toma el id del producto existente y actuliza la información correspondiente
        if(this.id == "producto") {
            docId = await docRef.add(producto).then(docRef => docRef.id);
        } else {
            docId = this.id;
            docRef.doc(docId).update(producto);
        }

        //luego tomo las referencias del producto y de sus imagenes para actualizarlas también
        let storageRef = firebase.storage().ref().child(user_id+"/productos/" + docId);
        let firestoreRef = docRef.doc(docId);

        await this.uploadImages(storageRef, firestoreRef);
        Toast.fire({
            icon: "success",
            title: "¡Producto creado exitósamente!"
        })
        this.modal.modal("hide");
        fillProducts();
    };

    get invalidFields() {
        //Antes de crear o actualizar el producto, verifica que los campos necesarios estén llenos
        //correctamente, en caso de que no, devuelte true para arrojar la excepción
        console.log(this.modal.find("[required]"))
        let invalid = false;
        let scroll;
        this.modal.find("[required]").each((i,e) => {
            $(e).parent().children(".mensaje-error").remove();
            $(e).removeClass("border-danger");

            //Si algún campo es inválido arroja la excepción
            if(!e.checkValidity()) {
                $(e).addClass("border-danger")
                $(e).parent().append("<div class='d-flex text-danger mensaje-error'><i class='fa fa-exclamation-circle'></i><small class='ml-1'>Este campo también es importante</small></div>")
                invalid = true;
                if(!scroll) scroll = $(e).parent()[0];
                return false;
            }
        });
        if(scroll) scroll.scrollIntoView({behavior: "smooth"});
        return invalid;
    }

    btnToggle() {
        $(".btn-toggle").click(function() {
            $(this).toggleClass("active");
        })
    }

    //me habilita todas las funciones necesarias que va armando el modal
    showModal() {
        console.log(this.modal)
        this.modal.modal("show");
        this.appendBasicInfo();
        this.appendAttributes();
        this.selectAttributes();
        this.addNewCategory();
        this.appendDimentions();
        this.appendVariants()
        this.appendProductImgs()
        this.appendAditionalInfo();
        this.activatefunctions();
    }

    //En caso de que sea necesario cambiar la configuración por defecto del dropzone
    configurateDropzone() {
        let drop = new Dropzone("#imagenes-producto", {
            maxFiles: 10 - this.imagesUrl.length
        });
        if(this.imagesUrl.length >= 10) {
            drop.disable();
            $("#imagenes-producto").click(() => {
                Toast.fire({
                    icon: "error",
                    title: "Puede cargar como máximo 10 imágenes"
                })
            })
        }
    }
}

globalThis.mod = new VentanaCrearProducto();
// mod.showModal();

//muestra todos los productos que tiene la tienda actualmente con información básica
async function fillProducts() {
    let list = $("#nav-tienda-productos > ul")
    await tiendaDoc.collection("productos").get()
    .then(querySnapshot => {
        list.html("");
        querySnapshot.forEach(doc => {
            let data = doc.data();
            let url = data.imagesUrl[0] ? data.imagesUrl[0].url : "";
            let li = document.createElement("li");
            li.setAttribute("class", "list-group-item list-group-item-action");
            li.setAttribute("id", "tienda-producto-" + doc.id);
            li.innerHTML = `
            <div class="row">
                <div class="col-3 col-md-1" style="
                background-image: url(${url});
                background-size: 100%;
                background-position: center;
                background-repeat: no-repeat;
                "></div>
                <div class="col-9 col-md-11">
                    <div class="row">
                        <div class="col-12 col-md-6 mb-2 mb-md-0">
                            <b>${data.nombre}</b>
                        </div>
                        <div class="col d-none d-md-block">
                            <small class="text-muted d-md-none">Código</small>
                            <p class="d-none d-md-block">${data.stock[0].detalles.cod}</p>
                        </div>
                        <div class="col">
                            <small class="text-muted d-md-none">Precio: <br/>
                            $${convertirMiles(data.stock[0].detalles.precio)}</small>
                            <p class="d-none d-md-block">$${convertirMiles(data.stock[0].detalles.precio)}</p>
                        </div>
                        <div class="col">
                            <small class="text-muted d-md-none">Cantidad: <br/>${data.stock[0].detalles.cantidad} Unids.</small>
                            <p class="d-none d-md-block">${data.stock[0].detalles.cantidad} Unidades.</p>
                        </div>
                    </div>
                </div>
            </div>
            `;

            list.append(li)
            li.addEventListener("click", async () => {
                let mod = new VentanaCrearProducto(doc.id);
                data.productId = doc.id;
                mod.showModal();
                mod.fillAll(data);
                mod.configurateDropzone();
                mod.appendBtnDelete();
            })
        })
    })

    if (list.html() == "") {
        let div = document.createElement("div");
        div.setAttribute("class", "text-center mt-4");
        div.style.display = "none";

        div.innerHTML = `<li class="fa fa-frown m-4 fa-10x"></li><br>
            <h3>No se ha cargado ningún producto aún</h3>
        `;
        list.append(div);

        $(div).show("fast")
    }
}

async function cargarInfoTienda() {
    $("#cargador-info-tienda").removeClass("d-none")
    const docRef = doc(db, "tiendas", user_id);
    const info = await getDoc(docRef).then((docSnapshot) => docSnapshot.data());

    $("#cargador-info-tienda").addClass("d-none")
    
    $('#descripcion-tienda').summernote(summernoteOptions);

    
    //intenta llenarme toda la info de la tienda, esté activa o no
    obtenerLinkTienda(info);
    if(!info) {
        info = datos_usuario;
        info.nombre = info.nombre_completo;
        info.tienda = info.centro_de_costo.replace(/seller/i, "").toLowerCase();
        $("#actualizar-tienda").text("Activar");
    };

    for (let campo in info) {
        $("#form-tienda [name='"+campo+"']").val(info[campo]);
    }

    if(info.ciudadT) {
        $("#logo-portada-tienda").show("fast")
        for(let campo in info.ciudadT) {
            $("#ciudad-tienda").attr("data-"+campo, info.ciudadT[campo])
        }
    };

    if(info.logoUrl) {
        mostrarLogoCargado(info.logoUrl);
    }

    if(info.portadaUrl) {
        mostrarPortada(info.portadaUrl);
    }

    if(info.descripcion) {
        $("#form-tienda").find(".note-editable").html(info.descripcion)
        // $('#descripcion-tienda').summernote('pasteHTML', info.descripcion);
    }

    if(info.colores) {
        $("#colorP-tienda").val(info.colores.primary)
        $("#colorI-tienda").val(info.colores.info)
    }
    
    if(typeof info.mostrar_transportadoras === "boolean") {
        $("#mostrar-transp-tienda").prop("checked", info.mostrar_transportadoras);
    }

    $("#colorI-tienda").change();
    $("#colorP-tienda").change();
    muestraDelLinkTienda.call($("#url-tienda")[0]);
    return info
};

function obtenerLinkTienda(data) {
    let contenedor = $("#link-tienda");
    let link = document.createElement("p");
    let btnLink = document.createElement("a");

    contenedor.html("");
    contenedor.addClass("alert d-flex flex-wrap justify-content-around m-2");
    contenedor.attr("role", "alert")
    btnLink.setAttribute("class", "btn btn-primary");
    link.classList.add("text-center", "w-100", "text-break")

    //si no está activa la tienda, le muestra al usuario la opción para activarla
    //Caso contrario, muestra el link de la tienda junto con un botón para ir a ella
    if(!data || !data.tienda) {
        contenedor.addClass("alert-danger");
        link.innerHTML = "Actualmente la tienda no se encuentra activa. Por favor, llene la información correspondiente para activarla.";
        btnLink.setAttribute("href", "javascript: void(0);");
        btnLink.innerText = "Activar";
        btnLink.addEventListener("click", actualizarTienda);
    } else {
        contenedor.addClass("alert-success");
        let host = window.location.host;
        // host = host.split(".")[0] == "www" ? host.split(".").splice(1).join(".") : host
        let dir = host + "/" + data.tienda + "/productos"
        let protocol = window.location.protocol;
        link.innerHTML = dir;
        btnLink.setAttribute("href", protocol + "//" + dir);
        btnLink.innerText = "Ver tienda";
    };

    contenedor.append(link, btnLink);
};

function mostrarLogoCargado(url) {
    const img = $("#img-logo-tienda");
    img.attr("src", url);
}

function mostrarPortada(url) {
    const contenedor = $("#portada-tienda");
    contenedor.css("background-image", "url("+url+")");
}

function muestraDelLinkTienda() {
    this.value = this.value.toLowerCase();
    let protocol = window.location.protocol;
    let host = window.location.hostname;
    // host = host.split(".")[0] == "www" ? host.split(".").splice(0,1).join(".") : host

    let valor = this.value;
    $("#ver-url-tienda").html(host + "/<b>" + valor + "</b>/productos");
}

async function actualizarTienda() {
    let data = new Object();
    let ciudad = document.getElementById("ciudad-tienda").dataset
    let invalid = new Array();
    const colores = {
        primary: $("#colorP-tienda").val(),
        info: $("#colorI-tienda").val()
    };
    const mostrar_transportadoras = $("#mostrar-transp-tienda").prop("checked");
    const set = this.textContent === "Activar";

    //revisa que los inputs necesarios estén llenos
    $("#form-tienda [name]").each((i, e) => {
        let campo = e.name;
        let valor = $(e).val();
        if(e.validity.valueMissing) invalid.push($(e).attr("id"));
        data[campo] = valor;
        console.log(data[campo]);
    });
    
    ciudad = JSON.parse(JSON.stringify(ciudad));
    
    verificador(invalid, "scroll", "Este campo no debe estar vacío.");
    let storeCity = $("#ciudad-tienda");
    storeCity.removeClass("border-danger");

    //también verifica que la ciudad tenga los datos complementarios
    if(!Object.entries(ciudad).length) {
        storeCity.addClass("border-danger");
        storeCity.parent().children("small").addClass("text-danger");
        storeCity.parent().children("small").removeClass("text-muted");
    };

    //si alguna de las varificaciones anterires falla, solo muetra el fallo y no se actualiza ni habilita la tienda
    if (await verificarExistenciaTienda() || invalid.length
    || !Object.entries(ciudad).length) return;

    // if(logo.files.length) {
    //     let file = logo.files[0];
    //     const nombre_logo = "logo" + file.name.match(/\.\w+$/)[0];
    //     const storageRef = firebase.storage().ref().child(user_id).child("tienda");

    //     let fileUploaded = await storageRef.child(nombre_logo).put(file);
    //     let url = await fileUploaded.task.snapshot.ref.getDownloadURL()
    //     data.nombre_logo = nombre_logo
    //     data.logoUrl = url;
    // }
    
    //lleno datos que son implícitos y necesarios para el correcto funcionamiento de la tienda
    data.ciudadT = ciudad;
    data.centro_de_costo = datos_usuario.centro_de_costo;
    data.id_user = user_id;
    data.colores = colores;
    data.mostrar_transportadoras = mostrar_transportadoras;

    console.log(data);
    swal.fire({
        title: "Actualizando tienda",
        html: "Estamos trabajando en ello, por favor espere...",
        didOpen: () => {
            Swal.showLoading();
        },
        allowOutsideClick: false,
        allowEnterKey: false,
        showConfirmButton: false,
        allowEscapeKey: true
    });

    let reference = doc(db, "tiendas", user_id);

    if(set) {
        reference = reference.set(data);
    } else {
        reference = reference.update(data);
    }

    reference.then(() => {
        Swal.fire({
            icon: "success",
            text: "Tienda actualizada exitósamente"
        }).then(() => {
            cargarInfoTienda();
        });
    });
};

async function verificarExistenciaTienda() {
    let tienda = $("#url-tienda");
    tienda.removeClass("is-invalid");
    const tiendaQuery = query(
        collection(db, "tiendas"),
        where("tienda", "==", tienda.val())
    );
    
    let exists = await getDocs(tiendaQuery).then(querySnapshot => {
        let bool = true;
        if (querySnapshot.empty) return false;
        querySnapshot.forEach(doc => {
            if (doc.id === user_id) bool = false;
        });
        return bool;
    });

    console.log(exists)

    if(exists || !tienda[0].checkValidity()) {
        tienda.addClass("is-invalid")
        tienda.parent()[0].scrollIntoView({behavior: "smooth"});
        return true;
    }

    return exists
};

function fillPedidos() {
    let fecha_inicio = Date.parse(value("fecha_inicio-pedidos").replace(/\-/g, "/")),
        fecha_final = Date.parse(value("fecha_final-pedidos").replace(/\-/g, "/")) + 8.64e7;

    tiendaDoc.collection("pedidos")
    .orderBy("timeline", "desc")
    .startAt(fecha_final).endAt(fecha_inicio)
    .get()
    .then(querySnapshot => {
        let data = new Array();
        querySnapshot.forEach(doc => {
            let dato = doc.data();
            dato.total = dato.cantidad * dato.precio;
            data.push(dato);
        });

        console.log(data);
        const table = $("#tabla-pedidos-tienda").DataTable({
            data,
            destroy: true,
            language: {
                url: "https://cdn.datatables.net/plug-ins/1.10.24/i18n/Spanish.json",
                "emptyTable": "Aún no tienes guías saldadas."
            },
            columns: [
                {data: "id", title: "id", className: "identificador"},
                {
                    data: null,
                    title: "Transportadoras",
                    defaultContent: `
                        <button type="button" class="btn btn-light m-2 selector"
                        data-filter="SERVIENTREGA"><img src="img/servientrega-logotipo.png" width="80px"/></button>
                        <button type="button" class="btn btn-light m-2 selector"
                        data-filter="INTERRAPIDISIMO"><img src="img/logo-inter2.png" width="80px"/></button>
                    `
                },
                {
                    data: null,
                    title: "Tipo",
                    defaultContent: `
                        <button type="button" class="btn btn-light m-2 selector text-truncate" 
                        data-filter="CONVENCIONAL">CONVENCIONAL</button>
                        <button type="button" class="btn btn-light m-2 selector text-truncate" 
                        data-filter="PAGO CONTRAENTREGA">PAGO CONTRAENTREGA</button>
                    `
                },
                {
                    data: null,
                    title: "Costo P.C",
                    defaultContent: `
                        <p class="precio"
                        data-transp="SERVIENTREGA"
                        data-filter="PAGO CONTRAENTREGA,SERVIENTREGA">------</p> 
                        <br/> 
                        <p class="precio"
                        data-transp="INTERRAPIDISIMO"
                        data-filter="PAGO CONTRAENTREGA,INTERRAPIDISIMO">------</p>
                    `
                },
                {
                    data: null,
                    title: "Costo C",
                    defaultContent: `
                        <p class="precio"
                        data-transp="SERVIENTREGA"
                        data-filter="CONVENCIONAL,SERVIENTREGA">------</p> 
                        <br/> 
                        <p class="precio"
                        data-transp="INTERRAPIDISIMO"
                        data-filter="CONVENCIONAL,INTERRAPIDISIMO">------</p>
                    `
                },
                {
                    data: "atributos",
                    title: "Atibutos",
                    render: function(data) {
                        let res = "";
                        for(let atributo in data) {
                            res += `<b>${atributo}:</b> ${data[atributo]} <br>`
                        }
                        return res;
                    }
                },
                {data: "detalles.cod", title:"Código"},
                {data: "cantidad", title:"Cantidad"},
                {data: "precio", title: "Precio Unit."},
                {data: "nombre", title:"Producto", defaultContent: "Error"},
                {data: "detalles.cod", title: "Cod", className: "text-nowrap"},
                {data: "ciudad.ciudad", title:"Ciudad destino", defaultContent: "Error"},
                {data: "nombreD", title:"Cliente", defaultContent: ""},
                {data: "telefonoD", title:"Contacto", defaultContent: ""},
            ],
            order: [[0, 'des']],
            dom: 'B<"clear">lfrtip',
            buttons: [{
                text: "Generar Guías",
                className: "btn btn-success",
                colTr: 1,
                colTp: 2,
                action: crearGuiasDesdePedido
            }, {
                text: "Cotizar",
                colPc: 3,
                colC: 4,
                action: calcularCostoEnvioPedidos
            }],
            initComplete: agregarFuncionalidadesTablaPedidos
        });

        const infoExtra  = new InfoExtraPedidos(table);

        $('#tabla-pedidos-tienda tbody').on('click', 'td.details-control', function() {
            infoExtra.mostrarInfo(this, table);
        });
    })
}

class InfoExtraPedidos {
    constructor() {
        this.infoGuardada = new Object();
    }
    
    mostrarInfo(target, table) {
        var tr = $(target).closest('tr');
        var row = table.row( tr );
        const guia = $(target).parent().children(".identificador").text();
        
        if ( row.child.isShown() ) {
            $(target).html("<button class='btn btn-success btn-circle btn-sm'><i class='fa fa-plus'></i></button>")
            row.child.hide();
            tr.removeClass('shown');
        }
        else {
            row.child( '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>Cargando...' ).show();

            if(this.infoGuardada[guia]) {
                const info = this.infoGuardada[guia];
                row.child(this.resInfo(info)).show();
                console.log("info desde la base guardada");

            } else {
                console.log("info desde firestore");
                usuarioDoc.collection("guias").doc(guia)
                .get().then(doc => {
                    if(doc.exists) {
                        this.infoGuardada[doc.id] = doc.data();
                        row.child(this.resInfo(doc.data())).show();
                    }
                })
            }
            $(target).html("<button class='btn btn-danger btn-circle btn-sm'><i class='fa fa-minus'></i></button>")

            tr.addClass('shown');
        }
    }

    resInfo(data) {
        return `<h5>${data.nombreD}</h5>
        <p><b>Telefono: </b> ${data.telefonoD}</p>
        <p><b>Dirección: </b> ${data.direccionD}</p>
        <p><b>Costo envío: </b> ${data.costo_envio}</p>
        `
    }
}

function cargarLogoPortada() {
    const textoOriginal = this.innerHTML;
    this.disabled = true;
    this.innerHTML = "<span class='spinner-grow spinner-grow-sm'></span> Cargando";
    let mostrarImagen = mostrarLogoCargado

    let type = "logo"
    let toUpdate;

    if(this.getAttribute("id") === "subir-portada-tienda") {
        type = "portada"
    } 

    const inputFile = $("#logo-tienda");
    const reader = new FileReader();
    inputFile.click();
    inputFile.one("change", async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const nombre_logo = type + file.name.match(/\.\w+$/)[0];
        const storageRef = firebase.storage().ref().child(user_id).child("tienda");
    
        let fileUploaded = await storageRef.child(nombre_logo).put(file);
        let url = await fileUploaded.task.snapshot.ref.getDownloadURL()
        if(this.getAttribute("id") === "subir-portada-tienda") {
            mostrarImagen = mostrarPortada
            toUpdate = {
                nombre_portada_img: nombre_logo,
                portadaUrl: url
            }
        } else {
            toUpdate = {
                nombre_logo, logoUrl: url
            }
        }

        // return;

        try {
            const docRef = doc(db, "tiendas", user_id);
            await updateDoc(docRef, toUpdate)
                .then(() => {
                    mostrarImagen(url);
                    this.innerHTML = textoOriginal;
                    this.removeAttribute("disabled");
                    Toast.fire({
                        icon: "success",
                        text: "Imagen actualizada"
                    });
                })
                .catch(e => console.log("firebase si me devuelve error=> ", e));
        } catch (err) {
            console.log(err);
        }

    });
}

function agregarFuncionalidadesTablaPedidos() {
    this.before(`
        <div class="form-group form-check">
            <input type="checkbox" class="form-check-input" id="select-all-orders">
            <label class="form-check-label" for="select-all-orders">Seleccionar Todas</label>
        </div>
    `);

    $("#select-all-orders").change((e) => {
        if(e.target.checked) {
            $("tr:gt(0)", this).addClass("selected bg-gray-300");
        } else {
            $("tr:gt(0)", this).removeClass("selected bg-gray-300");
        }
    })

    $(".selector").click(function() {
        const tr = $(this).parents("tr");
        const td = $(this).parent();

        td.children(".selector").removeClass("active");
        $(this).toggleClass("active");

        let filters = new Array();
        tr.find(".selector").each((i, el) => {
            if($(el).hasClass("active"))
            filters.push($(el).attr("data-filter"))
        });

        tr.find(".precio").removeClass("alert-success img-thumbnail")
        tr.find(".precio").each((i, el) => {
            const innerFilter = $(el).attr("data-filter").split(",");
            const corresponde = filters.every(val => innerFilter.includes(val));

            if (corresponde) $(el).addClass("alert-success img-thumbnail");
        });

    });


    if (this[0].getAttribute("data-table_initialized")) {
        return;
    } else {
        this[0].setAttribute("data-table_initialized", true);
    }


    $('tbody', this).on( 'click', 'tr', function (e) {
        if(!e.target.classList.contains("selector") && e.target.nodeName !== "IMG")
        $(this).toggleClass('selected bg-gray-300');
    } );

    // setTimeout(() => {
    //     calcularCostoEnvioPedidos(null, this.api())
    // }, 5000)
}

async function calcularCostoEnvioPedidos(e, dt, node, config) {
    let api = dt;

    const btnInitialText = $(node).text();
    $(node).prop("disabled", true);
    $(node).html(`
        <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
        Cotizando
    `);

    let datas = api.rows().data();
    const storeInfo = await cargarInfoTienda();
    console.log(storeInfo);
    let datos_de_cotizacion = {
        precios: datos_personalizados,
        ciudadR: storeInfo.ciudadT,
    };

    if(!datas.length) {
        Toast.fire({
            icon: "warning",
            text: "No has seleccionado el pedido que deseas generar."
        })
    }

    for (let i = 0; i < datas.length; i++) {
        const row = api.rows(i).nodes()[0];

        const pedido = datas[i];
        let volumen = pedido.alto * pedido.ancho * pedido.largo * pedido.cantidad;
        let peso = pedido.peso * pedido.cantidad;
        let recaudo = pedido.precio * pedido.cantidad
        datos_de_cotizacion.ciudadD = pedido.ciudad;
        const trasnportadoras = ["SERVIENTREGA", "INTERRAPIDISIMO"];

        for (let transp of trasnportadoras) {
            if(!row.classList.contains("selected")) continue;

            let cotizacionPC = await new CalcularCostoDeEnvio(recaudo, "PAGO CONTRAENTREGA", peso, volumen, datos_de_cotizacion)
            .putTransp(transp, {
                dane_ciudadR: storeInfo.ciudadT.dane_ciudad,
                dane_ciudadD: pedido.ciudad.dane_ciudad,
            });
            
            let cotizacionC = await new CalcularCostoDeEnvio(recaudo, "CONVENCIONAL", peso, volumen, datos_de_cotizacion)
            .putTransp(transp, {
                dane_ciudadR: storeInfo.ciudadT.dane_ciudad,
                dane_ciudadD: pedido.ciudad.dane_ciudad,
            });

            const pc = config.colPc, c = config.colC;
        
            const cellPc = $("td", row).eq(pc);
            const cellC = $("td", row).eq(c);
            
            if(!cotizacionPC.empty) {
                if(pedido.sumar_envio) cotizacionPC.sumarCostoDeEnvio = cotizacionPC.valor
                // console.log("Pago contraentrega", cotizacionPC)
                const mostrador = cellPc.find("[data-transp='"+transp+"']")
                mostrador.text(cotizacionPC.costoEnvio)
                console.log(cotizacionPC);
            }
            
            if(!cotizacionC.empty) {
                const mostrador = cellC.find("[data-transp='"+transp+"']")
                // console.log("Pago contraentrega", cotizacionC)

                mostrador.text(cotizacionC.costoEnvio)

            }
        
        }
    }

    $(node).text(btnInitialText);
    $(node).prop("disabled", false);

}

async function crearGuiasDesdePedido(e, dt, node, config) {
    let api = dt;
    const btnInitialText = $(node).text();
    $(node).prop("disabled", true);
    $(node).html(`
        <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
        Generando guías
    `);

    Cargador.fire("Creando guías", "Estamos generando las guías solicitadas, esto podría demorar unos minutos, por favor espere.")

    const selectedRows = api.rows(".selected");
    let datas = selectedRows.data();
    const nodos = selectedRows.nodes();
    const storeInfo = await cargarInfoTienda();

    let datos_de_cotizacion = {
        precios: datos_personalizados,
        ciudadR: storeInfo.ciudadT,
    };

    for ( let i = 0; i < nodos.length; i++) {
        const row = nodos[i];
        const pedido = datas[i];
        const fieldFromOrder = ["celularD", "correoD", "dice_contener", "direccionD", "identificacionD", "nombreD", "observaciones", "telefonoD", "tipo_doc_dest"]
        const fieldFromCity = ["ciudad", "departamento", "dane_ciudad"];
        const fieldFromStore = ["celular", "correo", "direccion", "nombre"];

        let guia = new Object();

        for (let campo of fieldFromOrder) {
            guia[campo] = pedido[campo]
        }
        
        for (let campo of fieldFromCity) {
            guia[campo + "D"] = pedido.ciudad[campo]
            guia[campo + "R"] = storeInfo.ciudadT[campo]
        }
        
        for (let campo of fieldFromStore) {
            guia[campo + "R"] = storeInfo[campo]
        }

        guia.centro_de_costo = storeInfo.centro_de_costo || datos_usuario.centro_de_costo

        const seleccionTr = $("td",row).eq(config.colTr);
        const transp = seleccionTr.find(".active").attr("data-filter")

        const seleccionTp = $("td",row).eq(config.colTp);
        const type = seleccionTp.find(".active").attr("data-filter")

        const transpDef = $("#transportadora-pedidos").val();
        const typeDef = $("#type-pedidos").val();
       
        datos_de_cotizacion.ciudadD = pedido.ciudad;

        guia.transportadora = transp || transpDef;
        guia.type = type || typeDef;

        let volumen = pedido.alto * pedido.ancho * pedido.largo * pedido.cantidad;
        let peso = pedido.peso * pedido.cantidad;
        let recaudo = pedido.precio * pedido.cantidad

        let cotizacion = await new CalcularCostoDeEnvio(recaudo, guia.type, peso, volumen, datos_de_cotizacion)
        .putTransp(guia.transportadora, {
            dane_ciudadR: storeInfo.ciudadT.dane_ciudad,
            dane_ciudadD: pedido.ciudad.dane_ciudad,
        });
        
        console.log(cotizacion);

        if(cotizacion.empty) {
            notificacionPorGuia(row, "Sin resultados por parte de la transportadora seleccionada", "exclamation-circle", "text-danger")
            continue;
        }

        if(pedido.sumar_envio) cotizacion.sumarCostoDeEnvio = cotizacion.valor


        if(cotizacion.seguro < cotizacion.costoEnvio) {
            notificacionPorGuia(row, "El valor del recaudo no debe ser menor al costo del envío.", "exclamation-triangle", "text-danger")
            continue;
        }

        guia.costo_envio = cotizacion.costoEnvio;
        guia.detalles = cotizacion.getDetails;
        guia.seguro = cotizacion.seguro;
        guia.valor = cotizacion.valor;
        guia.peso = cotizacion.kgTomado;
        guia.alto = pedido.alto * pedido.cantidad;
        guia.ancho = pedido.ancho * pedido.cantidad;
        guia.largo = pedido.largo * pedido.cantidad;
        guia.id_user = localStorage.user_id;
        guia.recoleccion_esporadica = 1;
        guia.id_pedido = pedido.id;
        guia.prueba = estado_prueba;

        guia.debe = guia.type === "CONVENCIONAL" ? false : -guia.costo_envio;

        console.log(guia);

        const respuesta = await enviar_firestore(guia);
        let icon, color;
        if(respuesta.icon === "success") {
            icon = "clipboard-check";
            color = "text-success"
            row.classList.remove("selected", "bg-gray-300")
        } else {
            icon = "exclamation-circle";
            color = "text-danger";
        }
        notificacionPorGuia(row, respuesta.mensajeCorto, icon, color)
        
    }
    
    function notificacionPorGuia(row, mensaje, icon, colorText) {
        $(row).after(`<tr><td colspan='10' class='${colorText}'><i class='fa fa-${icon} mr-2'></i>${mensaje}</td></tr>`)
    }
    
    $(node).text(btnInitialText);
    $(node).prop("disabled", false);

    Toast.fire({
        icon: "success",
        title: "¡Proceso terminado!"
    })
}

//Para seleccionar la catización más económica puesta en los productos
function buscarMasEconomicoEnPedido() {
    const table = $("#tabla-pedidos-tienda").DataTable();
    table.rows().every((i,e) => {
        const row = table.row(i).node()
        let selected = Infinity;
        let filtrado;
        $(".precio", row).each((i,e) => {
            const precio = parseInt($(e).text());
            if(precio < selected) {
                filtrado = $(e).attr("data-filter").split(",");
                
                selected = precio;
            } 
        });

        if(filtrado) {
            for (let filter of filtrado) {
                $("[data-filter='"+filter+"']", row).click();
            }
        }

    })
}

function limitarCaracteres(cont, editable) {
    const prevText = this.value;
    let limiter = cont.replace(/<[^<]+>/gi, "");
    limiter = limiter.replace(/&\w+;$/gi, "");
    const limit = 165;
    if(limiter.length > limit) {
        editable.html(prevText)
        Toast.fire({
            icon: "warning",
            text: "Puedes ingresar como máximo " + limit + " carácteres"
        })
    }

}

function selectIcon() {
    $("#form-tienda").find(".note-editable").html((i,html) => {
        return html += this.textContent
    });
}

function selectorColor() {
    const color = this.value;
    const identificador = this.getAttribute("id");

    $("[for='"+identificador+"']").css("color", color)
    $("#mostrador-color-bg").css("background-color", color)
}