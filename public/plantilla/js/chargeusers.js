async function chargeUsers() {
  if (listaUsuarios.length > 0) {
    return;
  }
  try {
    await firebase
      .firestore()
      .collection("usuarios")
      .limit(300)
      .get()
      .then((querySnapshot) => {
        querySnapshot.forEach((doc) => {
          listaUsuarios.push(doc.data().centro_de_costo);
        });
      })
      .then(() => {
        //list="sellersDatalist"
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

const buscadorNombre = document.querySelector("#buscador_usuarios-nombre");

const buscadorCallcenter = document.querySelector("#input-filtrado-callcenter");

const buscadorPagos = document.querySelector("#filtro-pago-usuario")

const buscadorUserEstados= document.querySelector("#filtrado-novedades-usuario")

function CargarUsuarios(element) {
  element.addEventListener("click", () => {
    chargeUsers();
  });
}


CargarUsuarios(buscadorNombre);
CargarUsuarios(buscadorCallcenter);
CargarUsuarios(buscadorPagos);
CargarUsuarios(buscadorUserEstados);