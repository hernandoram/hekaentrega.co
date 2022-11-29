const XLSX = require("xlsx");
const fs = require("fs");
const path = require("path");
const db = require("../keys/firebase.js").firestore()

const pathCities = "../../ciudadesAnt.js";
const newCities = "../../ciudades.js"

const ws = XLSX.readFile("../Entregas en oficina gk.xlsx");

const json =  XLSX.utils.sheet_to_json(ws.Sheets["FINALES"], {header:1});

json.shift();
const ciudadesEntregaOficina = json.map(v => v[0]);

// leerciudadesAntiguas();
// Función para actualizar las ciudades en el archivo interno
function leerciudadesAntiguas() {
    const listaCiudades = fs.readFileSync(path.join(__dirname, pathCities), "utf-8");

    const lista = JSON.parse(listaCiudades);
    let contador = 0;

    lista.map(d => {
        const fin = ciudadesEntregaOficina.some(l => {
            const from = d.ciudad + " ("+d.departamento+")";

            return from == l;
        });

        if(fin) {
            contador++;
            d.tipo_distribucion = "ENTREGA EN OFICINA";
        }

        return d;
    })

    console.log(contador, ciudadesEntregaOficina.length, lista);

    fs.writeFileSync(path.join(__dirname, newCities), JSON.stringify(lista, null, 2));
}

// leerCiudadesBaseDeDatos()
// función para actualizar entrega en oficina en la base de datos
function leerCiudadesBaseDeDatos() {
    let counter = 0;

    const buscadores = ciudadesEntregaOficina.map(d => {
        const reg = /\s\([\w\sÑ]+\)$/;
        const match = d.toString().match(reg);
        const i = match.index;

        const ciudadSplit = d.split("");
        ciudadSplit.splice(i, 1);

        const res = ciudadSplit.join("");


        db.collection("ciudades").where("nombre", "==", res)
        .get().then(q => q.forEach(d => {
            console.log(d.data().nombre);

            d.ref.update({
                "transportadoras.SERVIENTREGA.tipo_distribucion": "ENTREGA EN OFICINA"
            });
        }));

        return res;

    });

    console.log(buscadores);
}


//#region => A eliminar si todo sale bien!!
function reiniciarSeguimientoGuia() {
    const i = new Date(2022, 01, 01);
    const f = new Date(2022, 02, 01);
    db.collectionGroup("guias")
    .orderBy("timeline")
    .startAfter(i.getTime())
    .endAt(f.getTime())
    // .limit(1)
    .get()
    .then(async q => {
        const docs = q.docs;
        let [act, des] = [0,0]
    
        for await(let d of docs) {
            const data = d.data();
            // console.log(data, data.enNovedad, data.en_novedad);
    
            const {ultima_actualizacion} = data;
            const codicionalUno = ultima_actualizacion && ultima_actualizacion.toDate().getTime() > new Date(2022, 05, 01).getTime();
            if(data.enNovedad != undefined) {
                console.count("Actualizados");
                act++;
            } else {
                console.count("No Actualizados");
                des++
                await d.ref.update({seguimiento_finalizado: false})
            }
        }
    
        console.log("Actualizados: " + act, "No Actualizados: " + des);
        console.log("Finalizado desde " + i + " Hasta " + f);
        process.exit();
    })
}
//#endregion fi 

// acomodarPagos();
function acomodarPagos() {
    db.collection("pagos").doc("tcc")
    .collection("pagos").where("comprobante_bacario", "!=", "c")
    // .limit(1)
    .get().then(q => {
        let size = q.size;
        console.log(q.size);
        q.forEach(d => {
            console.log(d.data());

            return;
            d.ref.update({comprobante_bancario: d.data().comprobante_bacario})
            .then(() => {
                size--;
                console.log("Faltan: ", size);
            })
        })
    });
}