const XLSX = require("xlsx");
const path = require("path");
const db = require("../keys/firebase.js").firestore()

// const ws = XLSX.readFile("../procesos/Para corregir en plataforma.xlsx");


// const usuarios =  XLSX.utils.sheet_to_json(ws.Sheets[ws.SheetNames[0]], {header: "A1"});

// editarUsuarios();
async function editarUsuarios() {
    const centrosDeCosto = usuarios.map(u => u.SELLER);
    let cantidad = usuarios.length;
    for await(let u of usuarios) {
        console.log(u);
        await db.collection("usuarios").where("centro_de_costo", "==", u.SELLER.trim())
        .get().then(async q => {
            for await (let d of q.docs) {
                // console.log(d.data());
    
                const existe = await db.collection("usuarios").where("numero_documento", "==", u["IDENTIFICACIÓN"].toString().trim())
                .get().then(q => q.size);
    
                if(existe) {
                    console.log("Ya existe el usuario con el numero de documento: " + u["IDENTIFICACIÓN"].toString().trim());
                    return;
                }
    
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
            }
        })
    }
}

// cambiarSistemaTransportadoraEnUsuario("datos_personalizados.habilitar_servientrega");
// cambiarSistemaTransportadoraEnUsuario("datos_personalizados.habilitar_envia");
// cambiarSistemaTransportadoraEnUsuario("datos_personalizados.habilitar_interrapidisimo");
// cambiarSistemaTransportadoraEnUsuario("datos_personalizados.habilitar_tcc");
function cambiarSistemaTransportadoraEnUsuario(buscador) {
    db.collection("usuarios").where(buscador, "==", true)
    // .limit(5)
    .get().then(q => {
        console.log(q.size);
        let x = q.size;
        q.forEach(d => {
            console.log(d.data());
            const datos_personalizados = d.data().datos_personalizados;

            datos_personalizados.sistema_servientrega = "automatico";

            d.ref.update({datos_personalizados})
            .then(() => {
                x--;
                console.log("Actualizado => ", d.data().centro_de_costo);
                console.log("Faltan => ", x);

            })
            .catch(() => {
                x--;
                console.log("NO ACTUALIZADO => ", d.data().centro_de_costo);
                console.log("Faltan => ", x);

            });
        })
    })
}

async function asignarReferido(data) {
    const refReferido = db.collection("referidos").doc(data.sellerReferido);
    const existeReferido = await refReferido.get().then(d => d.exists);
    if(existeReferido) throw new Error("El usuario referido ya se encuentra asignado.");

    const usuarioReferido = await db.collection("usuarios")
    .where("centro_de_costo", "==", data.sellerReferido)
    .limit(1)
    .get()
    .then(q => q.size ? q.docs[0].data() : null);
    if(!usuarioReferido) throw new Error("El usuario referido que se desea asignar no existe.");

    data.cantidadEnvios = 0;
    data.cantidadReclamos = 0;
    data.enviosPorReclamar = 0;
    data.enviosReclamados = 0;
    data.celularReferido = usuarioReferido.celular;
    data.nombreApellido = [usuarioReferido.nombres.trim(), usuarioReferido.apellidos.trim()].join(" ");

    refReferido.set(data)
    .then(() => console.log("Usuario agregado correctamente"))
    .finally(() => process.exit());
}