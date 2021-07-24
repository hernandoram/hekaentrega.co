const firebase = require("../firebase");
const db = firebase.firestore();

exports.buscarUsuario = async (req, res, next) => {
    let nombre_tienda = req.params[0].split("/")[0];
    req.params.nombre_tienda = nombre_tienda;
    console.log(nombre_tienda);
    let id = await db.collection("tiendas").where("tienda", "==", nombre_tienda)
    .get().then(querySnapshot => {
        let identificador;
        querySnapshot.forEach(doc => {
            identificador = doc.id;
        })

        return identificador;
    });

    req.params.tiendaId = id;

    next();
};

exports.obtenerProductos = async (req, res) => {
    let id = req.params.tiendaId
    let productos = await db.collection("tiendas").doc(id).collection("productos")
    .get().then(querySnapshot => {
        let productos = new Array()
        querySnapshot.forEach(producto => {
            let editProducto = producto.data();
            editProducto.showImg = editProducto.imagesUrl[0].url;
            editProducto.showStock = editProducto.stock[0];
            editProducto.id = producto.id;
            editProducto.nombre_tienda = req.params.nombre_tienda;
            productos.push(editProducto);
        })
        return productos;
    });

    console.log(productos)
    res.render("productos", {productos});
};

exports.obtenerProducto = async (req, res) => {
    // console.log(req.params);
    let producto = await db.collection("tiendas").doc(req.params.tiendaId)
    .collection("productos").doc(req.params.productId)
    .get().then(doc => {
        if(doc.exists) {
            let data = doc.data();
            data.id = doc.id;
            data.storeId = req.params.tiendaId;
            data.nombre_tienda = req.params.nombre_tienda;
            return data
        }
    });

    res.render("producto", {producto});
};

let counter = 0
exports.probarSession = (req, res) => {
    counter += 1;
    console.log(req)
    res.render("pruebaSession", {counter})
}

exports.carritoDeCompra = (req, res) => {
    let ej = [
        {
          imagesUrl: 'https://firebasestorage.googleapis.com/v0/b/hekaapp-23c89.appspot.com/o/000000%2Fproductos%2FGoCbJZgMj6q2GjndHg3t%2Fdescarga.jpg?alt=media&token=b91e1e37-f845-4710-880e-05d608657cfd',
          descripcion_detallada: 'Adorna tu oficina con estos hermoso cuadros ',
          ancho: 5,
          precio: 27900,
          sumar_envio: 0,
          categoria: 'Arte',
          stock: { color: 'Verde', forma: 'Cuadrada', detalles: [Object] },
          nombre: 'Pintura',
          peso: 4,
          largo: 40,
          alto: 20,
          garantia: 3,
          descripcion: 'Cuadro Corporativo',
          detalles: { precio: 27900, cantidad: 12, cod: 'Pi-Ve-Cu' },
          atributos: { color: 'Verde', forma: 'Cuadrada' },
          external: 'GoCbJZgMj6q2GjndHg3t',
          cantidad: 2,
          storeId: "000000",
          store: "prueba"
        }, {
            imagesUrl: 'https://firebasestorage.googleapis.com/v0/b/hekaapp-23c89.appspot.com/o/000000%2Fproductos%2FGoCbJZgMj6q2GjndHg3t%2Fdescarga.jpg?alt=media&token=b91e1e37-f845-4710-880e-05d608657cfd',
            descripcion_detallada: 'Adorna tu oficina con estos hermoso cuadros ',
            ancho: 5,
            precio: 27900,
            sumar_envio: 0,
            categoria: 'Arte',
            stock: { color: 'Verde', forma: 'Cuadrada', detalles: [Object] },
            nombre: 'Pintura',
            peso: 4,
            largo: 40,
            alto: 20,
            garantia: 3,
            descripcion: 'Cuadro Corporativo',
            detalles: { precio: 27900, cantidad: 12, cod: 'Pi-Ve-Cu' },
            atributos: { color: 'Verde', forma: 'Cuadrada' },
            external: 'GoCbJZgMj6q2GjndHg3t2',
            cantidad: 5,
            storeId: "000000",
            store: "prueba"
          }
      ];
    //   req.session.carrito = ej;
    res.render("carrito", {
        carrito: req.session.carrito || [],
        tienda: req.session.tienda
    });
}

exports.getCarrito = (req, res) => {
    console.log("CARRITO", req.session.carrito);
    res.json(req.session.carrito);
}

exports.agregarAlCarrito = async (req, res) => {
    let data = await db.collection("tiendas").doc(req.body.storeId)
    .collection("productos").doc(req.params.id)
    .get().then((doc) => {
        let data;
        if(doc.exists) {
            data = doc.data()
            data.imagesUrl = data.imagesUrl[0];
            data.stock = data.stock.filter(atrib => {
                let pertenece = true;
                for (let val in req.body.atributos) {
                    if(req.body.atributos[val] != atrib[val]) {
                        pertenece = false;
                        break;
                    }
                }
                return pertenece;
            })[0];
            data.detalles = data.stock.detalles;
            data.atributos = new Object();
            for(let campo in data.stock) {
                if(typeof data.stock[campo] != "object") data.atributos[campo] = data.stock[campo];
            }
            data.external = doc.id;
            data.id_producto = doc.id;
            data.precio = data.detalles.precio;
        };
        return data;
    });
    
    if(req.session.carrito) {
        let add = true;
        for(let prod of req.session.carrito) {
            let sumar = true;
            for(let at in data.atributos) {
                if(prod.atributos[at] != data.atributos[at]) {
                    sumar = false;
                    break;
                }
            }
            
            if(sumar) {
                add = false;
                prod.cantidad++;
            }
        }
        
        if(add) {
            req.session.cantProd ? req.session.cantProd++ : req.session.cantProd = 1;
            data.external += "-"+req.session.cantProd;
            data.cantidad = 1;

            req.session.carrito.push(data);
        }

        
    } else {
        data.cantidad = 1;

        req.session.carrito = new Array(data);
    }

    console.log(req.session.carrito);
    console.log(req.session.tienda);
    console.log(req.body.tienda);
    if(!req.session.tienda) req.session.tienda = req.body.tienda;

    res.send("Todo bien mano")
}

exports.quitarDelCarrito = (req,res) => {
    console.log("Quitando item: ", req.params.external);
    for (let i = 0; i < req.session.carrito.length; i++) {
        console.log(req.session.carrito[i].external, req.params.external)
        if(req.session.carrito[i].external == req.params.external) {
            req.session.carrito.splice(i,1);
            break;
        }
    };

    res.json(req.session.carrito);
}

exports.getStoreInfo = async (req, res) => {
    let query = await db.collection("tiendas").where("tienda", "==", req.params.tienda)
    .get().then(querySnapshot => {
        let data;
        querySnapshot.forEach(doc => {
            data = doc.data();
        })
        return data;
    });

    console.log(190,query);
    res.json(query);
};

exports.modificarItemCarrito = (req, res) => {
    let external = req.params.external;
    for (let item of req.session.carrito) {
        if(item.external == external) {
            item.cantidad = req.body.cantidad;
            break;
        }
    };

    res.send("carrito actualizado");
}

exports.crearGuiaServientrega = async(req, res) => {
    console.log("Hola")
    let identificador = req.body.identificacionR.toString().slice(-4);
    let id = await db.collection("infoHeka").doc("heka_id")
    .get().then(doc => {
        if(doc.exists) {
            // doc.ref.update({id: firebase.firestore.FieldValue.increment(1)});
            return doc.data().id;
        }
    })
    identificador += id + "-T";
    console.log(identificador);
    let data = req.body;

    data.id_heka = identificador;

    console.log(data);

    await db.collection("usuarios").doc(req.body.id_user)
    .collection("guias").doc(identificador).set(data);
    res.send("creación exitosa");
};

exports.crearPedido = async (req, res) => {
    let id = await db.collection("tiendas").doc(req.body.id_user)
    .collection("pedidos").add(req.body).then(docRef => docRef.id);

    db.collection("tiendas").doc(req.body.id_user)
    .collection("productos").doc(req.body.id_producto)
    .get().then(doc => {
        let stock = doc.data().stock;
        console.log("AFTER",stock);
        for(let item of stock) {
            let isEqual = true
            for(let attr in req.body.atributos) {
                if(typeof item[attr] == "object") continue;
                if(item[attr] != req.body.atributos[attr]) {
                    isEqual = false;
                    break;
                }
            }

            if(isEqual) {
                item.detalles.cantidad -= req.body.cantidad;
                break;
            }
        }
        console.log("BEFORE", stock);


        doc.ref.update({stock})
    });

    req.body.id = id;
    res.json(req.body)
}