$("#nav-tienda-productos-tab").click(fillProducts);
$("#nav-tienda-home-tab").click(cargarInfoTienda);

$("#agregar-producto-tienda").click(() => {
    let modal = new VentanaCrearProducto();
    modal.showModal();
    new Dropzone("#imagenes-producto");
    modal.hideElements();
});

$("#actualizar-tienda").click(actualizarTienda)
$("#nombre-tienda").blur(verificarExistenciaTienda);

$(document).ready(function(){
    $("#mytoast").toast("show");
})

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
let tiendaDoc = firebase.firestore().collection("tiendas").doc(user_id);

let categorias = ["Tecnología", "Vehículos", "Hoga y Electrodométicos", "moda"];
let atributos = {
    color: ["Azul", "Verde", "Rojo", "Rosado", "Morado", "Negro"],
    talla: ["SS", "S", "M", "X", "XL"],
    forma: ["Cuadrada", "redonda", "rectangular"]
}


class VentanaCrearProducto {
    constructor(id) {
        this.modal = createModal();
        this.id = id || "producto";
        this.categorias = categorias;
        this.atributos = atributos;
        this.stock; this.dropzone; this.imagesUrl;
    }

    appendBasicInfo() {
        this.modal.find(".modal-body").html(`<div class="my-4">
            <h3>Información general</h3>
            <form class="row align-items-end">
            <div class="form-group col-12">
                <label for="nombre-${this.id}">Nombre del producto</label>
                <input type="text" name="nombre-${this.id}" data-campo="nombre" id="nombre-${this.id}" class="form-control" required>
            </div>
            <div class="form-group col">
                <label for="precio-${this.id}">Precio</label>
                <input type="number" name="precio-${this.id}" id="precio-${this.id}" data-campo="precio" class="form-control" required>
            </div>
            <div class="form-group col-12 col-sm-6">
            
                <label for="categoria-${this.id}">Seleccionar categoría</label>
                <div class="input-group">
                    <select class="custom-select" data-campo="categoria" id="categoria-${this.id}" aria-label="Seleccionar Categoría">
                        <option value="">Seleccione una Categoría...</option>
                    </select>
                    <div class="input-group-append">
                        <button id="habilitar-nueva-categoria-${this.id}" alt="Agregar nueva" class="btn btn-outline-secondary" type="button"><i class="fa fa-plus d-md-none"></i><span class="d-none d-md-block">Agregar Nueva</span></button>
                    </div>
                </div>

                <div class="input-group" style="display: none">
                    <input type="text" class="form-control" id="new-categoria-${this.id}" placeholder="Agregar Categoría"></input>
                    <div class="input-group-append">
                        <button id="cancel-add-categoria-${this.id}" alt="cancelar" class="btn btn-outline-secondary" type="button"><i class="fa fa-times d-md-none"></i><span class="d-none d-md-block">Cancelar</span></button>
                        <button id="add-categoria-${this.id}" alt="Agregar nueva categoría" class="btn btn-outline-primary" type="button"><i class="fa fa-check d-md-none"></i><span class="d-none d-md-block">Agregar</span></button>
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
            console.log($("#nombre-"+this.id).val());
            console.log($("#precio-"+this.id).val());
            console.log(this.id);
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
        for(let categoria of this.categorias) {
            let option = document.createElement("option");
            option.setAttribute("value", categoria)
            option.innerHTML = categoria
            $(option).appendTo(this.modal.find("#categoria-" + this.id))
        }
    }
    
    addNewCategory() {
        this.modal.find("#habilitar-nueva-categoria-" + this.id).click(function () {
            console.log(this)
            $(this).parents(".input-group").hide("slow")
            $(this).parents(".input-group").next().show("slow")
        });

        this.modal.find("#cancel-add-categoria-" + this.id).click(function () {
            $(this).parents(".input-group").hide("slow")
            $(this).parents(".input-group").prev().show("slow")
        });
        let addCategoria = this.modal.find("#add-categoria-"+this.id)

        addCategoria.click(async (e) => {
            let newCategory = addCategoria.parent().prev().val();

            console.log(newCategory);
                
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
        })

    }

    appendAttributes() {
        let htmlAtributos = document.createElement("div");
        htmlAtributos.setAttribute("id", "atributos-"+this.id);
        htmlAtributos.classList.add("my-4")
        let titulo = document.createElement("h3");
        titulo.innerHTML = "Atributos del producto";
        let definicion = document.createElement("div");
        definicion.innerHTML = "<h6 class='ml-2'><small>Puede que tu producto tenga uno, varios o ningún atributo o característica. Elige los atributos de tu producto y sus respectivas variaciones.</small></h6>"
        definicion.classList.add("text-muted", "border-left-secondary");
        let btn_group = document.createElement("div");

        for(let attrTitle in this.atributos) {
            let btn_inner_group = document.createElement("div")
            let card = document.createElement("div");
            card.setAttribute("id", attrTitle + this.id)
            card.setAttribute("class", "card attr-card m-2");
            btn_inner_group.setAttribute("class", "card-body");
            card.style.display = "none";
            
            btn_group.innerHTML += `<input type="button" class="btn btn-outline-info m-1 campo" value="${attrTitle}">`;

            for (let attr of this.atributos[attrTitle]) {
                btn_inner_group.innerHTML += `<input type="button" class="btn btn-outline-info m-1 btn-toggle atributo" data-fillStock="${attrTitle}" value="${attr}">`;
            }

            card.appendChild(btn_inner_group);
            btn_group.appendChild(card);
        }

        htmlAtributos.append(titulo, definicion, btn_group);
        htmlAtributos.innerHTML += `<input type="button" class="btn btn-info m-1" value="Ninguno" id="sn-attr-${this.id}">
        </input>`

        $(htmlAtributos).appendTo(this.modal.find(".modal-body"));
    }

    selectAttributes() {
        $("input.campo").click(function() {
            if($("input.campo.active").length < 2 || $(this).hasClass("active")) {
                $(this).toggleClass("active");
                $(this).next().toggle("slow");
            } else {
                Toast.fire({
                    icon: "error",
                    title: "Solo puedes seleccionar 2 atributos."
                })
            }
        });

        $("#sn-attr-"+ this.id).click(() => {
            $(".atributo, .campo").removeClass("active");
            $(".attr-card").hide("fast");

        })

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
        // divProducImgs.innerHTML = `<h3>Imágenes del Producto</h3>
        // <div id="dropej" class="dropzone"></div>`;

        $(divProducImgs).appendTo(this.modal.find(".modal-body"));

    }

    appendVariants() {
        let htmlVariants = document.createElement("div");
        htmlVariants.classList.add("my-4")
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
            if ($(e.target).hasClass("atributo")) $(e.target).toggleClass("active");
            
            this.fillVariants();
        });

        htmlVariants.append(table);
    }

    fillVariants() {
        let variantes = this.fillAtributes();
        console.log("Variantes", variantes)
        let table = document.getElementById("table-"+this.id);
        table.innerHTML = "<tr><th>Precio</th><th>Cód</th><th>Cantidad</th></tr>"
        for (let atrib of variantes) {
            let arrAttr = new Array();
            let precio = $("#precio-" + this.id).val();
            let nombre = $("#nombre-" +this.id).val();
            atrib.precio = precio;
            atrib.cantidad = 10;
            for(let at in atrib)  {
                if(at != "precio" && at != "cantidad" && typeof atrib[at] != "object") arrAttr.push(atrib[at]);
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
            console.log(arrAttr.join("-"));
            tr.innerHTML = `
                <td><input class="form-control" data-campo-stock="precio" value="${atrib.precio}" required/></td>
                <td><input class="form-control" data-campo-stock="cod" value="${arrAttr.join("-")}" readonly/></td>
                <td><input class="form-control" data-campo-stock="cantidad" value="${atrib.cantidad}" required/></td>
            `;
            table.appendChild(tr)
        }

        this.stock = this.fillAtributes();
        this.saveVariants()
    }

    saveVariants() {
        let counter = 0;
        $("[data-campo-stock]").each((i, v) => {
            if(i && i % 3 == 0) {
                counter ++;
            }
            let campo = v.getAttribute("data-campo-stock");
            if(typeof this.stock[counter].detalles != "object") this.stock[counter] = new Object()
            this.stock[counter].detalles[campo] = isNaN(parseInt(v.value)) ? v.value : parseInt(v.value);
        })

    }

    fillAtributes() {
        let atributos = new Object();

        $(".atributo.active").each(function() {
            let active = $(this).parents(".attr-card").prev().hasClass("active")
            if(atributos[$(this).attr("data-fillStock")] && active) {
                atributos[$(this).attr("data-fillStock")].push($(this).val())
            } else if (active) {
                atributos[$(this).attr("data-fillStock")] = new Array($(this).val())
            } else if(atributos[$(this).attr("data-fillStock")]) {
                atributos[$(this).attr("data-fillStock")].remove()
            }
        })

        // ****** ALGORITMO REAL ************///
        let variantes = new Array({});
        for(let attr in this.atributos) {
            this.atributos[attr].splice(1,1)
            if(atributos[attr]) {
                this.atributos[attr][1] = atributos[attr];
                for (let i = 0; i < atributos[attr].length; i++) {
                    variantes.map((v,j) => {
                        let conjAttr = Object.assign({}, v);
                        conjAttr[attr] = atributos[attr][i];
                        if(!v[attr]) {
                            variantes[j][attr] = atributos[attr][i];
                        } else if(variantes.length == j + 1){
                            variantes.splice(j+1,1,conjAttr);
                        } else {
                            variantes.push(conjAttr)
                        }
                    })
                }
            }
        }


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
            <input type="text" name="descripcion-corta-producto" data-campo="descripcion" id="descripcion-corta-producto" class="form-control">
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

    get productCreated() {
        this.saveVariants();
        let product = new Object();
        $("[data-campo]").each((i,v) => {
            let campo = v.getAttribute("data-campo");
            let value = isNaN(parseInt(v.value)) ? v.value : parseInt(v.value);
            product[campo] = value;
        })

        product.stock = this.stock;
        product.storeId = user_id;
        return product;
    }

    async uploadImages(storageRef, firestoreRef) {
        let files = document.getElementById("imagenes-producto").dropzone.files;
        let urls = new Array()
        for await(let file of files) {
            let type = file.name.match(/\.\w+$/)[0];
            
            
            let fileUploaded = await storageRef.child(file.name).put(file);
            // await fileUploaded;
            let url = await fileUploaded.task.snapshot.ref.getDownloadURL()
            urls.push({url, fileName: file.name});
        }

        console.log(urls)

        firestoreRef.get().then((doc) => {
            let urlsAntiguas = doc.data().imagesUrl;
            console.log(doc.data());
            if(urlsAntiguas) {
                urls = urls.concat(urlsAntiguas);
            }
            console.log(urls)

            doc.ref.update({imagesUrl: urls});
        })

    }

    ej() {
        firebase.storage().ref().child('00000').listAll().then(res => {
            res.prefixes.forEach(pr => console.log(pr))
            res.items.forEach(itemRf => {
                console.log(itemRf);
            })
        });
    }

    hideElements() {
        this.modal.find(".modal-body").children().each((i, c) => {
            if(i) {
                c.style.display = "none";
            }
        })
    }

    fillAll(data) {
        console.log(data)
        for(let campo in data) {
            $("[data-campo='"+campo+"']").val(data[campo])
            if(campo == "categoria") {
                let categoria = this.modal.find("#new-categoria-"+this.id)
                let addCategoria = this.modal.find("#add-categoria-"+this.id)
                categoria.val(data[campo]);
                addCategoria.click()
            }
        }

        data.stock.forEach((stock, i) => {
            for (let attr in stock) {
                $(".atributo, .campo").each((i, btn) => {
                    if((btn.value == stock[attr] || btn.value == attr) && !btn.classList.contains("active")) {
                        btn.classList.add("active")
                    }
                })
                
                if($("#" + attr + this.id).css("display") == "none") {
                    $("#" + attr + this.id).show();
                }
                
            }

            this.fillVariants();
        });

        let counter = 0;
        $("[data-campo-stock]").each((index, item) => {
            if(index && index % 3 == 0) counter ++
            let campo = $(item).attr("data-campo-stock");
            let stock = data.stock[counter];
            $(item).val(stock.detalles[campo]);
        })

        this.imagesUrl = data.imagesUrl;
        this.fillImagesPreloaded(data.imagesUrl);
    }

    fillImagesPreloaded(urls) {
        let div = document.createElement("div");
        div.setAttribute("id", "imagenes-precargadas")
        div.setAttribute("class", "d-flex justify-content-arround");
        for(let urlInfo of urls) {
            let imgCont = document.createElement("div");
            let img = document.createElement("img");
            let action = document.createElement("span");
            action.innerHTML = "<i class='fa fa-trash d-md-none'></i><span class='d-none d-md-block'>Eliminar</span>";
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

        console.log(div);
        $(div).insertBefore("#imagenes-producto");
    }

    deleteImage(urlInfo, urls) {
        console.log(urls);

        urls = urls.filter(dato => {
            return dato.url != urlInfo.url
        });
        console.log(urls);

        let storageRef = firebase.storage().ref()
        .child(user_id+"/productos/" + this.id);

        storageRef.child(urlInfo.fileName).delete().catch(() => {
            console.log("El documento .../" + this.id + "/" + urlInfo.fileName + " no existe");
        });

        tiendaDoc.collection("productos").doc(this.id).update({imagesUrl: urls}).then(() => {
            $("#imagenes-precargadas").remove();
            this.fillImagesPreloaded(urls);
        })
    }

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
 
    activatefunctions() {
        let btn_continue = this.modal.find("#btn-continuar-modal-creado");
        console.log(btn_continue)
        btn_continue.text("Crear Producto");
        btn_continue.click(() => {
            this.createProduct();
        });
    }

    async deleteProducto() {
        let producto = tiendaDoc.collection("productos").doc(this.id);
        let images = await producto.get().then(doc => doc.data().imagesUrl);

        for (let url of images) {
            this.deleteImage(url, images)
        };

        producto.delete();
        this.modal.modal("hide");
        fillProducts()
    }

    async createProduct() {
        let producto = this.productCreated;
        console.log(this.invalidFields);
        if(this.invalidFields) {
            return;
        };

        let docRef = tiendaDoc.collection("productos");
        let docId;

        if(this.id == "producto") {
            docId = await docRef.add(producto).then(docRef => docRef.id);
        } else {
            docId = this.id;
            docRef.doc(docId).update(producto);
        }

        console.log(docId);

        let storageRef = firebase.storage().ref().child(user_id+"/productos/" + docId);
        let firestoreRef = docRef.doc(docId);

        await this.uploadImages(storageRef, firestoreRef);
        this.modal.modal("hide");
        fillProducts();
    }

    get invalidFields() {
        console.log(this.modal.find("[required]"))
        let invalid = false;
        let scroll;
        this.modal.find("[required]").each((i,e) => {
            $(e).parent().children(".mensaje-error").remove();
            $(e).removeClass("border-danger");

            console.log(e.checkValidity());
            if(!e.checkValidity()) {
                $(e).addClass("border-danger")
                $(e).parent().append("<div class='d-flex text-danger mensaje-error'><i class='fa fa-exclamation-circle'></i><small class='ml-1'>Este campo también es importante</small></div>")
                invalid = true;
                if(!scroll) scroll = $(e).parent()[0];
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

    showModal() {
        this.modal.modal("show");
        this.appendBasicInfo();
        this.appendAttributes();
        this.selectAttributes();
        this.addNewCategory();
        this.appendDimentions();
        this.appendVariants()
        this.appendProductImgs()
        this.appendAditionalInfo();
        // mod.hideElements();
        this.activatefunctions();
    }

    configurateDropzone() {
        let drop = new Dropzone("#imagenes-producto", {
            maxFiles: 10 - this.imagesUrl.length
        });
        console.log(drop)
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

async function fillProducts() {
    let list = $("#nav-tienda-productos > ul")
    console.log(list);
    await tiendaDoc.collection("productos").get()
    .then(querySnapshot => {
        list.html("");
        querySnapshot.forEach(doc => {
            let data = doc.data();
            console.log(data);
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
    let info = await firebase.firestore().collection("tiendas")
    .doc(user_id).get().then(doc => doc.data());

    obtenerLinkTienda(info);
    if(!info) {
        info = datos_usuario;
        info.nombre = info.nombre_completo;
        info.tienda = info.centro_de_costo.replace(/seller/i, "").toLowerCase();
        $("#actualizar-tienda").text("Activar")
    }

    for (let campo in info) {
        $("#form-tienda [name='"+campo+"']").val(info[campo]);
    }

    if(info.ciudadT) {
        for(let campo in info.ciudadT) {
            console.log(campo)
            $("#ciudad-tienda").attr("data-"+campo, info.ciudadT[campo])
        }
    }
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

    if(!data) {
        contenedor.addClass("alert-danger");
        link.innerHTML = "Actualmente la tienda no se encuentra activa. Por favor, llene la información correspondiente para activarla.";
        btnLink.setAttribute("href", "javascript: void(0);");
        btnLink.innerText = "Activar";
        btnLink.addEventListener("click", actualizarTienda);
    } else {
        contenedor.addClass("alert-success");
        link.innerHTML = "www.hekaetrega.co/tienda/" + data.tienda + "/productos";
        btnLink.setAttribute("href", "/tienda/" + data.tienda + "/productos");
        btnLink.innerText = "Ver tienda";
    };

    contenedor.append(link, btnLink);
};

async function actualizarTienda() {
    let data = new Object();
    let ciudad = document.getElementById("ciudad-tienda").dataset
    let invalid = new Array();
    $("#form-tienda [name]").each((i, e) => {
        let campo = e.name;
        let valor = $(e).val();
        if(e.validity.valueMissing) invalid.push($(e).attr("id"));
        data[campo] = valor;
    });
    
    
    ciudad = JSON.parse(JSON.stringify(ciudad));
    
    verificador(invalid, "scroll", "Este campo no debe estar vacío.");
    let storeCity = $("#ciudad-tienda");
    storeCity.removeClass("border-danger");
    if(!Object.entries(ciudad).length) {
        storeCity.addClass("border-danger");
        storeCity.parent().children("small").addClass("text-danger");
        storeCity.parent().children("small").removeClass("text-muted");
    };

    if (await verificarExistenciaTienda() || invalid.length
    || !Object.entries(ciudad).length) return;
    
    data.ciudadT = ciudad;
    data.centro_de_costo = datos_usuario.centro_de_costo;
    data.id_user = user_id

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

    firebase.firestore().collection("tiendas").doc(user_id)
    .set(data).then(() => {
        Swal.fire({
            icon: "success",
            text: "Tienda actualizada exitósamente"
        }).then(() => {
            cargarInfoTienda();
        });
    });
};

async function verificarExistenciaTienda() {
    let tienda = $("#nombre-tienda");
    tienda.removeClass("is-invalid");
    let exists = await firebase.firestore().collection("tiendas")
    .where("tienda", "==", tienda.val()).get()
    .then(querySnapshot => {
        let bool = true;
        if(querySnapshot.empty) return false;
        querySnapshot.forEach(doc => {
            if(doc.id == user_id) bool = false
        });
        return bool;
    });

    console.log(exists)

    if(exists || !tienda[0].checkValidity()) {
        tienda.addClass("is-invalid")
        tienda.parent()[0].scrollIntoView({behavior: "smooth"})
    }

    return exists
};