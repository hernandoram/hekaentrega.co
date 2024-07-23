let displayUsers = [];
async function chargeUsers() {
  document.getElementById("loader-usuarios").classList.remove("d-none");
  if (listaUsuarios.length > 0) {
    return;
  }
  try {
    await firebase
      .firestore()
      .collection("usuarios")
      .get()
      .then((querySnapshot) => {
        querySnapshot.forEach((doc) => {
          listaUsuarios.push(doc.data().centro_de_costo);
          const primeraBodega = doc.data().bodegas
            ? doc.data().bodegas[0]
            : null;
          displayUsers.push({
            ...doc.data(),
            id: doc.id,
            bodega: primeraBodega?.ciudad || "Sin bodegas"
          });
        });
      })
      .then(() => {
        //list="sellersDatalist"
        document.getElementById("loader-usuarios").classList.add("d-none");
        const sellerDatalist = document.getElementById("sellersDatalist");
        listaUsuarios.forEach((user) => {
          const option = document.createElement("option");
          option.value = user; // Asumiendo que `user` es una cadena que representa el nombre del usuario
          option.textContent = user; // Esto establece el texto que se muestra en la opción
          sellerDatalist.appendChild(option);
        });
      });
  } catch (error) {
    console.log(error);
  }
}

const buscadorCallcenter = document.querySelector("#input-filtrado-callcenter");

const buscadorPagos = document.querySelector("#filtro-pago-usuario");

const buscadorUserEstados = document.querySelector(
  "#filtrado-novedades-usuario"
);

async function loadUsers() {
  if (displayUsers.length > 0) {
    console.log("Users uploaded");
  } else {
    await chargeUsers();
    generarTabla(displayUsers);
  }
}

function CargarUsuarios(element) {
  element.addEventListener("click", async () => {
    await loadUsers();
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  if (window.location.hash === "#usuarios") {
    await loadUsers();
  }
});

window.addEventListener("hashchange", async () => {
  if (window.location.hash === "#usuarios") {
    await loadUsers();
  }
});

CargarUsuarios(buscadorCallcenter);
CargarUsuarios(buscadorPagos);
CargarUsuarios(buscadorUserEstados);
