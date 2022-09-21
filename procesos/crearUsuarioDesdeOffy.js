const db = require("../keys/firebase.js").firestore()

// agregarUsuario("KMbytBzY6rPAEVHTXqwnvvlM4RL2");
// agregarUsuario("UhumALpRphcsHkwfaef8nsUTKTT2");
// agregarUsuario("Nz4d6LxQIZMLRDx6zinZYyESjlu1");
function agregarUsuario(idEmpresa) {
    db.collection("oficinas").doc(idEmpresa)
    .get().then(async d => {
        if(d.exists) {
            const data = d.data();
            const cod_empresa = data.cod_empresa;
            const usuarioExiste = await db.collection("usuarios").where("cod_empresa", "==", cod_empresa)
            .get().then(q => q.size);

            console.log(usuarioExiste);
    
            if(usuarioExiste) return console.log("No es posible transladar el usuario, porque ya exite una empresa con este nombre entre los usuarios");
    
            delete data.barrio;
            delete data.descripcion;
            delete data.direccion;
            delete data.direccion_completa;
            delete data.ciudad;
            delete data.visible;
    
            data.ingreso = idEmpresa;
            data.objetos_envio = [];

            console.log(data);
            // return;
    
            db.collection("usuarios").add(data)
            .then(() => console.log("usuario agregado correctamente"))
        }
    })
}