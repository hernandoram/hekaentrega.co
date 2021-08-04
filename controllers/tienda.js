const vhost = require("vhost");
const firebase = require("../firebase");
const db = firebase.firestore();

exports.buscarTienda = async (req, res, next) => {
    let nombre_tienda = req.vhost.hostname.split(".")[0];
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
    if (!req.session.tienda) req.session.tienda = req.params.nombre_tienda;
    if(!id) return res.status(404).render("404", {url: req.vhost.hostname})

    next();
};

exports.obtenerProductos = async (req, res) => {
    let id = req.params.tiendaId || "";
    let productos = await db.collection("tiendas").doc(id).collection("productos")
    .get().then(querySnapshot => {
        let productos = new Array()
        querySnapshot.forEach(producto => {
            let editProducto = producto.data();
            console.log(producto.data())
            editProducto.showImg = editProducto.imagesUrl[0] ? editProducto.imagesUrl[0].url : "/img/heka entrega.png";
            editProducto.showStock = editProducto.stock[0];
            editProducto.id = producto.id;
            editProducto.nombre_tienda = req.params.nombre_tienda;
            productos.push(editProducto);
        })
        return productos;
    });
    
    // if (!req.session.tienda) req.session.tienda = req.params.nombre_tienda;
    if(req.query.json) return res.json(productos);
    res.render("productos", {productos, session: req.session});
};

exports.obtenerProducto = async (req, res) => {
    console.log(req.params);
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
    console.log(producto);
    if(!producto) return res.status(404).render("404", {url: req.url})

    res.render("producto", {producto, session: req.session});
};

let counter = 0
exports.probarSession = (req, res) => {
    counter += 1;
    console.log(req)
    console.log("REVISANDO")
    console.log(req.vhost);
    console.log(req.vhost[0]);
    res.render("pruebaSession", {counter})
}

exports.carritoDeCompra = (req, res) => {
    if(req.query.json) return res.json(req.session.carrito || [])
    res.render("carrito", {
        carrito: req.session.carrito || [],
        session: req.session
    });
}

exports.getCarrito = (req, res) => {
    console.log("CARRITO", req.session.carrito);
    res.json(req.session.carrito || {});
}

exports.agregarAlCarrito = async (req, res) => {
    
    let data = await db.collection("tiendas").doc(req.body.storeId)
    .collection("productos").doc(req.params.id)
    .get().then((doc) => {
        let data;
        if(doc.exists) {
            data = doc.data()
            data.imagesUrl = data.imagesUrl[0];
            data.tienda = req.body.tienda;
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
            console.log("REVISANDO AGREGADO", data);
        };
        return data;
    });
    
    let send = "Agregado al carrito"
    
    if(req.session.carrito) {
        let add = true;
        for(let prod of req.session.carrito) {
            let sumar = true;
            if(!Object.keys(data.atributos).length 
            && prod.external != data.external) sumar = false;
            for(let at in data.atributos) {
                if(prod.atributos[at] != data.atributos[at]) {
                    sumar = false;
                    break;
                }
            }
            
            if(sumar) {
                add = false;
                prod.cantidad++;
                if(prod.cantidad > prod.detalles.cantidad) {
                    send = "Es posible que haya excedido la cantidad en inventario del producto."
                }
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

    console.log(data.cantidad)
    console.log(data.detalles.cantidad)
    if(data.cantidad > data.detalles.cantidad) {
        send = "Es posible que haya excedido la cantidad en inventario del producto."
    }

    console.log(req.session.carrito);
    console.log(req.session.tienda);
    console.log(req.body.tienda);
    if(!req.session.tienda) req.session.tienda = req.body.tienda;

    res.json({carrito: req.session.carrito, mensaje: send});
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
    let identificador = req.body.identificacionR.toString().slice(-4);
    identificador = identificador.replace(/^0/, 1);
    let id = await db.collection("infoHeka").doc("heka_id")
    .get().then(doc => {
        if(doc.exists) {
            doc.ref.update({id: firebase.firestore.FieldValue.increment(1)});
            return doc.data().id;
        }
    })
    identificador += id + "-T";
    console.log(identificador);
    let data = req.body;

    data.id_heka = identificador;
    data.id_pedido = identificador;

    console.log(data);

    await db.collection("usuarios").doc(req.body.id_user)
    .collection("guias").doc(identificador).set(data);
    res.json(data);
};

exports.crearPedido = async (req, res) => {
    await db.collection("tiendas").doc(req.body.id_user)
    .collection("pedidos").doc(req.body.id).set(req.body)

    db.collection("tiendas").doc(req.body.id_user)
    .collection("productos").doc(req.body.id_producto)
    .get().then(doc => {
        let stock = doc.data().stock;
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

        doc.ref.update({stock})
    });

    res.json(req.body)
};

exports.vaciarCarrito = (req, res) => {
    req.session.carrito = [];
    res.json(req.session.carrito);
};

exports.enviarNotificacion = (req,res) => {
    db.collection("notificaciones").add(req.body);
    res.send("enviando notificación");
}