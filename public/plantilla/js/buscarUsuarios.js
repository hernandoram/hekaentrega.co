let users;

async function searchUsers(esGeneral) {
  document.getElementById("cargador-usuarios").classList.remove("d-none");

  users = await buscarUsuarios2(esGeneral);

  if (!users) {
    users = await filtrarUsuarios();
    // renderizar usuarios en la tabla
  }
  document.getElementById("cargador-usuarios").classList.add("d-none");
  Array.isArray(users) ? generarTabla() : "";
}

async function buscarUsuarios2(esGeneral) {
  console.log("buscando usuarios");

  let nombreInpOriginal = value("buscador_usuarios-nombre").trim();
  if (esGeneral) {
    nombreInpOriginal = nombreInpOriginal.toLowerCase();
  }

  const nombreInp = value("buscador_usuarios-nombre").toLowerCase().trim();

  const mayusNombreInp = nombreInp.toUpperCase();

  const reference = firebase.firestore().collection("usuarios");

  const casesToSearch = [
    "centro_de_costo",
    "numero_documento",
    "celular",
    "celular2",
    "correo",
    "direccion_completa"
  ];
  let especifico;
  let userEncontrado;

  for await (let caso of casesToSearch) {
    especifico =
      nombreInp &&
      (await reference
        .where(caso, "==", nombreInp)
        .get()
        .then((querySnapshot) => {
          let bool;
          if (!querySnapshot.size) return false;
          querySnapshot.forEach((doc) => {
            if (doc.exists) {
              userEncontrado = { ...doc.data(), id: doc.id };
              seleccionarUsuario(doc.id);
              bool = true;
            }
          });
          return bool;
        }));
    //minus mayus
    if (!especifico && caso === "correo") {
      especifico =
        mayusNombreInp &&
        (await reference
          .where(caso, "==", mayusNombreInp)
          .get()
          .then((querySnapshot) => {
            let bool;
            if (!querySnapshot.size) return false;
            querySnapshot.forEach((doc) => {
              if (doc.exists) {
                userEncontrado = { ...doc.data(), id: doc.id };
                bool = true;
              }
            });
            return bool;
          }));
    }

    if (especifico) break;
  }

  if (especifico) return userEncontrado;
}

const filtrarUsuarios = async () => {
  const nombreInp = value("buscador_usuarios-nombre").toLowerCase().trim();

  const reference = firebase.firestore().collection("usuarios");
  let usuariosFiltrados = [];

  await reference.get().then((querySnapshot) => {
    querySnapshot.forEach((doc) => {
      const nombre = doc.data().nombres.trim().toLowerCase();
      const apellido = doc.data().apellidos.trim().toLowerCase();
      const nombre_completo = nombre + " " + apellido;
      const nombre_apellido =
        nombre.split(" ")[0] + " " + apellido.split(" ")[0];
      const centro_de_costo = doc.data().centro_de_costo || "SCC";
      const direcciones = doc.data().bodegas || [];

      if (nombreInp) {
        if (
          centro_de_costo.toLowerCase().includes(nombreInp) ||
          nombre.includes(nombreInp) ||
          apellido.includes(nombreInp) ||
          nombre_completo.includes(nombreInp) ||
          nombre_apellido.includes(nombreInp) ||
          direcciones.some((dir) =>
            dir.direccion_completa.includes(nombreInp)
          ) ||
          direcciones.some(
            (dir) => dir.codigo_sucursal_inter == nombreInp.trim()
          )
        ) {
          usuariosFiltrados.push({ ...doc.data(), id: doc.id });
        }
      } else {
        usuariosFiltrados.push({ ...doc.data(), id: doc.id });
      }
    });
  });

  return usuariosFiltrados;
};

function generarTabla() {
  $("#tablaUsers").removeClass("d-none");

  console.warn(users);

  $(document).ready(function () {
    $("#tablaUsers").DataTable({
      destroy: true,
      scrollX: true,
      responsive: true,
      columns: [
        {
          data: null,
          name: "Acciones",
          defaultContent: "N/A",
          render: function (data, type, row) {
            return `<button class="accion-btn" data-id="${row.id}" onclick="seleccionarUsuario(this.getAttribute('data-id'))">Ver Más</button>`;
          },
          orderable: false
        },

        { data: "nombres", name: "Nombre", defaultContent: "N/A" },
        {
          data: "centro_de_costo",
          name: "Nombre Seller",
          defaultContent: "N/A"
        },
        { data: "correo", name: "Correo", defaultContent: "N/A" },
        { data: "contacto", name: "Telefono", defaultContent: "N/A" }
      ],
      data: users
    });
  });
}

function volver2() {
  document.getElementById("usuario-seleccionado").classList.add("d-none");
  
  if (users.length > 1) {
    document.getElementById("tablaUsers").classList.remove("d-none");
    let wrapper = document.getElementById("tablaUsers_wrapper");
    wrapper.classList.remove("d-none");
  }
}
