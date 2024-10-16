let users = listaUsuarios;

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
    "direccion_completa",
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

function generarTabla(users) {
  $("#tablaUsers").removeClass("d-none");
  $("#control-buttons").removeClass("d-none");

  $(document).ready(function () {
    $("#tablaUsers").DataTable({
      columnDefs: [
        {
          targets: 0, // Corregido a 0 ya que "Acciones" es la primera columna
          data: null,
          name: "Acciones",
          defaultContent: "N/A",
          render: function (data, type, row) {
            return (
              `<button class="btn btn-primary me-2 accion-btn p-1" data-id="${row.id}" onclick="seleccionarUsuario(this.getAttribute('data-id'))"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-search" viewBox="0 0 16 16">
  <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"/>
</svg></button>` +
              `<button class="btn btn-secondary accion-btn p-1" data-id="${row.id}" onclick="manejarClickMovimientos('${row.id}')"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-graph-up" viewBox="0 0 16 16">
  <path fill-rule="evenodd" d="M0 0h1v15h15v1H0V0Zm14.5 1a.5.5 0 0 1 .5.5v11h-11a.5.5 0 0 1-.5-.5v-11a.5.5 0 0 1 .5-.5h11ZM10 10h1V6h-1v4Zm-3 2h1V4h-1v8Zm-3-3h1V7H4v2Z"/>
</svg></button>`
            );
          },
          orderable: false,
        },
      ],
      destroy: true,
      scrollX: true,
      responsive: true,
      columns: [
        {
          data: null,
          name: "Acciones",
          defaultContent: "N/A",
          orderable: false,
        }, // Columna de acciones ajustada
        { data: "nombres", name: "Nombre", defaultContent: "N/A" },
        {
          data: "centro_de_costo",
          name: "Nombre Seller",
          defaultContent: "N/A",
        },
        {
          data: "numero_documento",
          name: "No Documento",
          defaultContent: "N/A",
        },
        { data: "correo", name: "Correo", defaultContent: "N/A" },
        { data: "contacto", name: "Telefono", defaultContent: "N/A" },
      ],
      data: users,
    });
  });
}

volver2button = document.getElementById("volver2");

volver2button.addEventListener("click", volver2);

function volver2() {
  referidos = [];
  guiasStats = [];
  console.warn(guiasStats);
  statsGlobales.classList.add("d-none");
  document.getElementById("load-stats").classList.add("collapsed");
  document.getElementById("load-stats").setAttribute("aria-expanded", "false");
  document.getElementById("estadisticas").classList.add("collapse");
  document.getElementById("estadisticas").classList.remove("show");

  if (displayUsers.length > 0) {
    document.getElementById("usuario-seleccionado").classList.add("d-none");

    document.getElementById("tablaUsers").classList.remove("d-none");
    document.getElementById("control-buttons").classList.remove("d-none");

    let wrapper = document.getElementById("tablaUsers_wrapper");
    wrapper.classList.remove("d-none");
  }
}

function manejarClickMovimientos(id) {
  let fechaI = genFecha().split("-");
  fechaI[1] -= 1;
  fechaI = new Date(fechaI.join("-") + "::").getTime();
  let fechaF = new Date(genFecha() + "::").getTime();
  console.log(fechaI, fechaF);
  verMovimientos(id, fechaI, fechaF + 8.64e7);

  location.href = `#movimientos`;

  document.getElementById("nombre-usuario-movs").textContent = users.find(
    (user) => user.id == id
  ).nombres;
}
