Dropzone.options.imagenesProducto = {
    paramName: "file", // The name that will be used to transfer the file
    maxFilesize: 2, // MB
    maxFiles: 1,
    dictDefaultMessage: "Arreastre o Cargue las imágenes a mostrar<br><i class='fa fa-upload fa-2x'></i>",
    dictMaxFilesExceeded: "No puedes subir más imágenes",
    addRemoveLinks: true,
    uploadMultiple: true,
    acceptedFiles: "image/*",
    dictRemoveFile: "<button class='btn btn-danger badge'>Eliminar</button>"
};

let categorias = ["Tecnología", "Vehículos", "Hoga y Electrodométicos", "moda"];
let atributos = {
    color: [["Azul", "Verde", "Rojo", "Morado", "Negro"]],
    talla: [["SS", "S", "M", "X", "XL"]],
    forma: [["Cuadrada", "redonda", "rectangular"]]
}


class VentanaCrearProducto {
    constructor() {
        this.modal = createModal();
        this.id = "producto";
        this.categorias = categorias;
        this.atributos = atributos;
        this.stock; this.dropzone
    }

    appendBasicInfo() {
        this.modal.find(".modal-body").html(`<div>
            <h3>Información general</h3>
            <form class="row align-items-end">
            <div class="form-group col-12">
                <label for="nombre-${this.id}">Nombre del producto</label>
                <input type="text" name="nombre-${this.id}" data-campo="nombre" id="nombre-${this.id}" class="form-control">
            </div>
            <div class="form-group col">
                <label for="precio-${this.id}">Precio</label>
                <input type="number" name="precio-${this.id}" id="precio-${this.id}" data-campo="precio" class="form-control">
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

        $("#nombre-"+this.id+", #precio-"+this.id).on("input", () => {
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
        console.log(this.modal.find("#add-categoria-"+this.id))
        console.log(this.modal.find("#habilitar-nueva-categoria-" + this.id));
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
        htmlAtributos.classList.add("mb-4")
        let titulo = document.createElement("h3");
        titulo.innerHTML = "Atributos del producto";
        let btn_group = document.createElement("div");
        // btn_group.setAttribute("data-toggle", "buttons");
        // btn_group.setAttribute("class", "btn-group-toggle");

        for(let attrTitle in this.atributos) {
            let btn_inner_group = document.createElement("div")
            let card = document.createElement("div");
            card.setAttribute("id", attrTitle + this.id)
            card.setAttribute("class", "card attr-card m-2");
            btn_inner_group.setAttribute("class", "card-body");
            card.style.display = "none";
            
            btn_group.innerHTML += `<input type="button" class="btn btn-outline-info m-1 campo" value="${attrTitle}">`;

            for (let attr of this.atributos[attrTitle][0]) {
                btn_inner_group.innerHTML += `<input type="button" class="btn btn-outline-info m-1 btn-toggle atributo" data-fillStock="${attrTitle}" value="${attr}">`;
            }

            card.appendChild(btn_inner_group);
            btn_group.appendChild(card);
        }

        htmlAtributos.append(titulo, btn_group);
        htmlAtributos.innerHTML += `<input type="button" class="btn btn-info m-1" value="Ninguno" id="sn-attr-${this.id}">
        </input>`

        $(htmlAtributos).appendTo(this.modal.find(".modal-body"));
    }

    selectAttributes() {
        $("input.campo").click(function() {
            console.log($("input.campo.active").length > 1);
            if($("input.campo.active").length < 2 || $(this).hasClass("active")) {
                $(this).toggleClass("active");
                $(this).next().toggle("slow");
            }
        });

        $("#sn-attr-"+ this.id).click(() => {
            $(".atributo, .campo").removeClass("active");
            $(".attr-card").hide("fast")
        })

    }

    appendDimentions() {
        let dimentions = document.createElement("div");
        dimentions.classList.add("mb-3");
        let htmlDimentions = `<div>
        <h3>Dimensiones</h3>
        <p class="leads">Las dimensiones de Longitud serán expresadas en centímetros y el peso en kilogramos (Tomar en cuenta las limitaciones de la transportadora en cuanto a valores máximos y mínimos)</p>
        <form>
          <div class="form-row">
            <div class="form-group col-6 col-sm-3">
              <label for="dim-alto-${this.id}">Alto</label>
              <input type="number" class="form-control" data-campo="alto" id="dim-alto-${this.id}">
            </div>
            <div class="form-group col-6 col-sm-3">
              <label for="dim-ancho-${this.id}">Ancho</label>
              <input type="number" class="form-control" data-campo="ancho" id="dim-ancho-${this.id}">
            </div>
            <div class="form-group col-6 col-sm-3">
              <label for="dim-largo-${this.id}">Largo</label>
              <input type="number" class="form-control" data-campo="largo" id="dim-largo-${this.id}">
            </div>
            <div class="form-group col-6 col-sm-3">
              <label for="dim-peso-${this.id}">Peso</label>
              <input type="number" class="form-control" data-campo="peso" id="dim-peso-${this.id}">
            </div>
          </div>
        </form>`

        dimentions.innerHTML = htmlDimentions
        $(dimentions).appendTo(this.modal.find(".modal-body"))
    }

    appendProductImgs() {
        let divProducImgs = document.createElement("div")
        divProducImgs.innerHTML = `<h3>Imágenes del Producto</h3>
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
        $(htmlVariants).appendTo(this.modal.find(".modal-body"));
        htmlVariants.innerHTML = "<h3>Variantes de producto</h3>"
        let table = document.createElement("table");
        table.setAttribute("class", "table table-responsive");
        table.setAttribute("id", "table-"+this.id);

        $(".atributo,.campo").click((e) => {
            if ($(e.target).hasClass("atributo")) $(e.target).toggleClass("active");
            
            this.fillVariants();
        });

        htmlVariants.append(table);
    }

    fillVariants() {
        let variantes = this.fillAtributes();
        let table = document.getElementById("table-"+this.id);
        table.innerHTML = "<tr><th>Precio</th><th>Cód</th><th>Cantidad</th></tr>"
        for (let atrib of variantes) {
            let arrAttr = new Array();
            for(let at in atrib)  {
                if(at != "precio" && at != "cantidad") arrAttr.push(atrib[at]);
            }

            arrAttr = arrAttr.map(v => {
                return v.slice(0,2);
            })
            let tr = document.createElement("tr");
            tr.setAttribute("id", arrAttr.join("-"));
            tr.innerHTML = `
                <td><input class="form-control" data-campo-stock="precio" value="${atrib.precio}"/></td>
                <td><input class="form-control" data-campo-stock="cod" value="${arrAttr.join("-")}" readonly/></td>
                <td><input class="form-control" data-campo-stock="cantidad" value="${atrib.cantidad}"/></td>
            `;
            table.appendChild(tr)
        }

        this.stock = this.fillAtributes()
        // this.saveVariants()
    }

    saveVariants() {
        let counter = 0;
        $("[data-campo-stock]").each((i, v) => {
            if(i && i % 3 == 0) {
                counter ++;
            }
            let campo = v.getAttribute("data-campo-stock");
            if(typeof this.stock[counter] != "object") this.stock[counter] = new Object()
            this.stock[counter][campo] = isNaN(parseInt(v.value)) ? v.value : parseInt(v.value);
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

        // console.log(this.atributos);
        let precio = $("#precio-" + this.id).val();
        let nombre = $("#nombre-" +this.id).val();
        let variantes = new Array({nombre, precio, cantidad: 10});
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
        console.log(variantes)

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
        })
        console.log(variantes);
        return variantes;
    }

    appendAditionalInfo() {
        let htmlAditionalInfo = document.createElement("div");
        htmlAditionalInfo.innerHTML = "<h3>Infomación adicional</h3>"

        let btn_cobra_envio = `<div class="btn-group-toggle d-flex flex-wrap" data-toggle="buttons">
            <label class="btn btn-block btn-outline-success">
            <input type="checkbox" id="sumar-envio-${this.id}" data-campo="sumar_envio" value="0">
            <i class="fa fa-check-circle mr-3"></i>
            Cobrar Envío
            </label>
            <h6 class="text-center mt-2">Si eliges, Se cobrará el envío del producto.</h6>    
        </div>`;

        let form = `<form class="mt-3">
            <div class="form-group">
            <label for="descripcion-corta-producto">Descripción corta</label>
            <input type="text" name="descripcion-corta-producto" data-campo="descripcion" id="descripcion-corta-producto" class="form-control">
            </div>
            <div class="form-group">
            <label for="descripcion-completa-producto">Descripción completa</label>
            <textarea name="descripcion-completa-producto" id="descripcion-completa-producto" data-campo="Descipcion_detallada" class="form-control"></textarea>
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
        return product;
    }

    async uploadImages(storageRef, firestoreRef) {
        let files = document.getElementById("imagenes-" + this.id).dropzone.files;
        let urls = new Array()
        for await(let file of files) {
            let type = file.name.match(/\.\w+$/)[0];
            
            
            let fileUploaded = await storageRef.child(file.name).put(file);
            // await fileUploaded;
            
            urls.push(fileUploaded.task.snapshot.ref.getDownloadURL());
        }

        console.log(urls)
        let arrUrl = await Promise.all(urls);
        console.log(arrUrl);

        firestoreRef.get().then((doc) => {
            let urlsAntiguas = doc.data().imagesUrl;
            if(urlsAntiguas) {
                arrUrl = arrUrl.concat(urlsAntiguas);
            }
            doc.ref.update({imagesUrl: arrUrl});
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

        data.stock.forEach(stock => {
            for (let attr in stock) {
                $(".atributo, .campo").each((i, btn) => {
                    if((btn.value == stock[attr] || btn.value == attr) && !btn.classList.contains("active")) {
                        btn.classList.add("active")
                    }
                })
                
                if($("#" + attr + this.id).css("display") == "none") {
                    $("#" + attr + this.id).show();
                }
                $("[data-campo='"+attr+"']").val(stock[attr])
            }
            
            this.fillVariants();
        })


    }

    activatefunctions() {
        let btn_continue = this.modal.find("#btn-continuar-modal-creado");
        console.log(btn_continue)
        btn_continue.text("Crear Producto");
        btn_continue.click(async () => {
            let producto = this.productCreated;
            let docRef = usuarioDoc.collection("productos");
            let docId = await docRef.add(producto).then(docRef => docRef.id);
            console.log(docId);
            
            let storageRef = firebase.storage().ref().child(user_id+"/productos/" + docId);
            let firestoreRef = docRef.doc(docId)

            this.uploadImages(storageRef, firestoreRef)
            this.modal.modal("hide")
        });
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
}


globalThis.mod = new VentanaCrearProducto();
// mod.showModal();

async function fillProdcuts() {
    let list = $("#nav-tienda-productos > ul")
    list.html("");
    console.log(list);
    await usuarioDoc.collection("productos").get()
    .then(querySnapshot => {
        querySnapshot.forEach(doc => {
            let data = doc.data();
            let li = document.createElement("li");
            li.setAttribute("class", "list-group-item list-group-item-action d-flex");
            li.setAttribute("id", "tienda-producto-" + doc.id);
            li.innerHTML = `
                <div class="col-6">${data.nombre}</div>
                <div class="col">${data.stock[0].cod}</div>
                <div class="col">$${convertirMiles(data.stock[0].precio)}</div>
                <div class="col">${data.stock[0].cantidad} Unids.</div>
            `;

            list.append(li)
            li.addEventListener("click", () => {
                let mod = new VentanaCrearProducto()
                mod.showModal();
                new Dropzone("#imagenes-producto");
                mod.fillAll(data);
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

$("#nav-tienda-productos-tab").click(fillProdcuts);

$("#agregar-producto-tienda").click(() => {
    let modal = new VentanaCrearProducto();
    modal.showModal();
    new Dropzone("#imagenes-producto");
    modal.hideElements();
});