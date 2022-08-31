const XLSX = require("xlsx");
const path = require("path");
const db = require("../keys/firebase.js").firestore()

const ws = XLSX.readFile("../corregir usuarios.xlsx");


const usuarios =  XLSX.utils.sheet_to_json(ws.Sheets[ws.SheetNames[0]], {header: "A1"});

// editarUsuarios();
function editarUsuarios() {
    const centrosDeCosto = usuarios.map(u => u.SELLER);
    let cantidad = usuarios.length;
    usuarios.map(u => {
        console.log(u);
        db.collection("usuarios").where("centro_de_costo", "==", u.SELLER.trim())
        .get().then(q => {
            q.forEach(d => {
                // console.log(d.data());

                // return;
                d.ref.update({
                    nombres: u.NOMBRE.trim(),
                    apellidos: u.APELLIDO.trim(),
                    numero_documento: u["IDENTIFICACIÓN"].toString().trim(),
                    tipo_documento: u["TIPO DE IDENTIFICACIÓN"].trim()
                }).then(() => {
                    cantidad--
                    console.log("actual => ", u.SELLER);
                    console.log("faltan => ", cantidad);
                })
            })
        })
    })
}