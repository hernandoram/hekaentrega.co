const express = require("express");
const app = express();
const router = express.Router();
// const request = require("request");
// const bodyParser = require("body-parser");
// const firebase = require("../firebase");
// const db = firebase.firestore();
// const path = require("path");
const Handlebars = require("handlebars");
const tiendaCtrl = require("../controllers/tienda");


// var exphbs  = require('express-handlebars');

// // var hbs = exphbs.create({});

// // Register `hbs.engine` with the Express app.
// app.engine('hbs', exphbs({extname: "hbs", defaultLayout:"index", layoutsDir: __dirname + "/public/views/layouts"}));

// app.set('view engine', '.hbs');

router.post("/subirImagen", (req, res) => {
    console.log(req.params)
    res.send("Archivo cargado")
})

router.get("/:tienda/productos", tiendaCtrl.buscarTienda, tiendaCtrl.obtenerProductos);

router.get("/:tienda/producto/:productId", tiendaCtrl.buscarTienda, tiendaCtrl.obtenerProducto);

router.get("/carrito", tiendaCtrl.carritoDeCompra);

router.post("/agregarAlCarrito/:id", tiendaCtrl.agregarAlCarrito);

router.get("/quitarDelCarrito/:external", tiendaCtrl.quitarDelCarrito);

router.get("/informacion/:tienda", tiendaCtrl.getStoreInfo);

router.get("/getCarrito", tiendaCtrl.getCarrito);

router.post("/modificarItemCarrito/:external", tiendaCtrl.modificarItemCarrito);

router.post("/crearGuiaServientrega", tiendaCtrl.crearGuiaServientrega);

router.post("/crearPedido", tiendaCtrl.crearPedido);

router.get("/vaciarCarrito", tiendaCtrl.vaciarCarrito);

router.post("/enviarNotificacion", tiendaCtrl.enviarNotificacion);

Handlebars.registerHelper("listar_atributos", function(context, options) {
    //Este ayudante de handlebars me lista todos los atributos existentes el listas de select
    let atributos = new Object();
    let precios = new Array();
    let limites = new Array();

    context.forEach((variante, i) => {
        //Itero cada variante del contexto, para luego revisar cada campo
        for (let campo in variante) {
            if(typeof variante[campo] == "object") {
                precios.push(variante[campo].precio);
                limites.push(variante[campo].cantidad);
                continue;
            };
            //Si no existe en la lista de atributos, lo crea, en caso contrario agrega el atributo al campo que corresponda
            if(!atributos[campo]) {
                atributos[campo] = [variante[campo]]
            } else{
                atributos[campo].push(variante[campo])
            }
        }
    });
    
    let res = '<form class="form-inline mb-4" id="selectores-atributos">'
    res+= `<span id="precios_filtrado" class="d-none">${precios}</span>`
    res+= `<span id="inventarios_filtrado" class="d-none">${limites}</span>`
    //Luego itera entre todos los campos de atributos para crear el selecto crrespondiente de la lista de posibilidades
    for(let campo in atributos) {
        let attrIndx = new Object();
        atributos[campo].forEach((value, i) => {
            if(!attrIndx[value]) {
                attrIndx[value] = [i];
            } else {
                attrIndx[value].push(i);
            }
        });

        res += '<label class="my-1 mr-2" for="'+campo+'input">' + campo + '</label>';
        res += '<select data-campo="'+campo+'" class="custom-select my-1 mr-sm-3" id="'+campo+'input">'
        
        for (let value in attrIndx) {
            console.log(attrIndx[value]);
            res += '<option value="'+value+'" data-indexes="'+attrIndx[value]+'">' 
            + value + '</option>'
        }

        res += '</select>';
    }
    res += '</form>';
    return res;
});

Handlebars.registerHelper("calcular_precio", function(context) {
    //devuelve el precio ingresado por la cantidad
    return context.cantidad * context.precio;
});

Handlebars.registerHelper("calcTotal", carrito => {
    //devuelve el computo del valor neto de cada item
    let total = 0;
    console.log(carrito)
    for(let it of carrito) {
        total += it.cantidad * it.precio;
    }

    return total;
});

Handlebars.registerHelper("categorias", (context, options) => {
    //Me devuelve un html de opciones del total de característica de productos existente en la tienda
   let res = "";
   let categorias = new Array();
   context.forEach(item => {
       if(!categorias.includes(item.categoria) && item.categoria) {
           categorias.push(item.categoria);
           res += options.fn(item);
       } 
   })

   return res;
});

Handlebars.registerHelper("getCurrency", context => {
    return context.toLocaleString("es-CO", {
        style: "currency", 
        currency: "COP",
        minimumFractionDigits: 0
    });
})


module.exports = router;