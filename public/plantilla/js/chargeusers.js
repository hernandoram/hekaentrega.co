let displayUsers = [];
import { listaUsuarios } from '/js/cargadorDeDatos.js';
import { generarTabla, manejarClickMovimientos } from '/js/buscarUsuarios.js'
import { db, getDocs, collection } from "/js/config/initializeFirebase.js";
import { seleccionarUsuario } from '/js/usuarios.js';

window.seleccionarUsuario = seleccionarUsuario;
window.manejarClickMovimientos = manejarClickMovimientos;


async function chargeUsers() {
  document.getElementById("loader-usuarios").classList.remove("d-none");

  // Verifica si ya tienes usuarios cargados
  if (listaUsuarios.length > 0) {
    return;
  }

  try {
    const querySnapshot = await getDocs(collection(db, "usuarios"));

    // Almacena y procesa los datos de los usuarios
    querySnapshot.forEach((doc) => {
      displayUsers.push({
        ...doc.data(),
        id: doc.id,
      });
    });

    // Oculta el loader una vez que los datos han sido procesados
    document.getElementById("loader-usuarios").classList.add("d-none");

    // Crea el datalist de vendedores
    const sellerDatalist = document.getElementById("sellersDatalist");
    listaUsuarios.forEach((user) => {
      const option = document.createElement("option");
      option.value = user; // Asumiendo que `user` es una cadena que representa el nombre del usuario
      option.textContent = user; // Texto mostrado en la opción
      sellerDatalist.appendChild(option);
    });
  } catch (error) {
    console.error("Error al cargar los usuarios:", error);
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
  console.log(window.location.hash);
  if (window.location.hash === "#usuarios") {
    await loadUsers();
  }
  if (window.location.hash.includes('?idFirebase')) {
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
