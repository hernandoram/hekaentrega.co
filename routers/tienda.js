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

router.get("/", tiendaCtrl.buscarTienda, tiendaCtrl.obtenerProductos);

router.get("/producto/:productId", tiendaCtrl.buscarTienda, tiendaCtrl.obtenerProducto);

router.get("/carrito", tiendaCtrl.carritoDeCompra);

router.get("/prueba", tiendaCtrl.probarSession);

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
    let atributos = new Object()
    console.log(context);
    console.log(options);
    context.forEach((variante, i) => {
        for (let campo in variante) {
            console.log(40,typeof variante[campo]);
            if(typeof variante[campo] == "object") continue;
            if(!atributos[campo]) {
                atributos[campo] = [variante[campo]]
            } else if(atributos[campo].indexOf(variante[campo]) == -1){
                atributos[campo].push(variante[campo])
            }
        }
    })
    
    let res = '<form class="form-inline mb-4">'
    for(let campo in atributos) {
        res += '<label class="my-1 mr-2" for="'+campo+'input">' + campo + '</label>';
        res += '<select data-campo="'+campo+'" class="custom-select my-1 mr-sm-3" id="'+campo+'input">'
        atributos[campo].forEach(value => {
            res += '<option value="'+value+'">' + value + '</option>'
        });
        res += '</select>';
    }
    res += '</form>';
    return res;
});

Handlebars.registerHelper("calcular_precio", function(context) {
    return context.cantidad * context.precio;
});

Handlebars.registerHelper("calcTotal", carrito => {
    let total = 0;
    console.log(carrito)
    for(let it of carrito) {
        total += it.cantidad * it.precio;
    }

    return total;
});

Handlebars.registerHelper("categorias", (context, options) => {
   let res = "<option value=''>Seleccionar Todas</option>";
   let categorias = new Array();
   context.forEach(item => {
       if(!categorias.includes(item.categoria) && item.categoria) {
           categorias.push(item.categoria);
           res += options.fn(item.categoria);
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