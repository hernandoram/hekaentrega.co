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