import { firestore as db } from "../config/firebase.js";

function handleAuthErrors(error) {
  const code = error.code;
  console.log(error);
  let res;
  switch (code) {
    case "auth/email-already-exists":
      res = {
        title: "Correo Exitente.",
        message:
          "Otro usuario ya está utilizando el correo electrónico proporcionado.",
      };
      break;
    case "auth/email-already-in-use":
      res = {
        title: "Correo en uso.",
        message: "La direccion de correo electrónico ingresada ya está en uso.",
      };
      break;
    case "auth/invalid-email":
      res = {
        title: "Correo inválido.",
        message:
          "El valor que se proporcionó para la propiedad del correo del usuario no es válido.",
      };
      break;
    case "auth/user-not-found":
      res = {
        title: "Usuario no encontrado.",
        message: "El usuario ingresado no existe.",
      };
      break;
    case "auth/wrong-password":
      res = {
        title: "Contraseña inválida.",
        message: "La contraseña ingresada no es válida.",
      };
      break;
    case "auth/network-request-failed":
      res = {
        title: "Conección débil",
        message:
          "Se ha producido un error de red (como tiempo de espera o conexión interrumpida) intente nuevamente más tarde.",
      };
      break;
    case "auth/too-many-requests":
      res = {
        title: "Cantidad de intentos excedida",
        message:
          "El acceso a esta cuenta ha sido temporalmente desactivado debido a la cantidad de intentos fallidos, puedes cambiar la contraseña o intentarlo más tarde.",
      };
      break;
    default:
      return {
        title: "Error desconocido",
        message: "Error: " + error.message,
      };
  }

  res.code = code;
  res.error = true;
  return res;
}

async function findUser(ingreso) {
  const user = await db
    .collection("usuarios")
    .where("ingreso", "==", ingreso)
    .get()
    .then((querySnapshot) => {
      let user;
      querySnapshot.forEach((doc) => {
        user = doc.data();
        user.id = doc.id;
      });

      if (!user) {
        return {
          error: true,
          message:
            "No se encontró ningún usuario guardado con las credenciales ingresadas.",
        };
      } else {
        localStorage.setItem("user_id", user.id);
        localStorage.setItem("user_login", user.ingreso);
        if (user.acceso_admin) {
          localStorage.setItem("acceso_admin", user.acceso_admin);
        }

        redirectIfAuthenticated();

        return user;
      }
    })
    .catch((error) => {
      return {
        error: true,
        message: error.message,
      };
    });

  return user;
}

const urlParams = new URLSearchParams(window.location.search);
const idguia = urlParams.get("idguia");
const iduser = urlParams.get("iduser");
console.log(idguia, iduser);

function redirectIfAuthenticated() {
  if (localStorage.getItem("acceso_admin")) {
    location.href = "admin.html";
  } else if (localStorage.getItem("user_id") && idguia && iduser) {
    location.href = `plataforma2.html?idguia=${idguia}&iduser=${iduser}#flexii-guia`;
  } else if (localStorage.getItem("user_id")) {
    location.href = "plataforma2.html";
  }
}

function agregarObjetoDeEnvio(e) {
  if (e.target.nodeName === "INPUT" && e.keyCode !== 13) return;
  const input = $("#register-objetos_envio");
  const val = input.val().trim();
  const valores = $("[data-objeto_envio]")
    .map((i, it) => it.getAttribute("data-objeto_envio"))
    .get();

  if (!val) return;

  const contenedor = $("#register-cont-objetos_envio");
  const objeto = document.createElement("p");
  objeto.innerText = val;
  objeto.setAttribute("class", "badge badge-soft-primary p-1 m-1");
  objeto.setAttribute("data-objeto_envio", val);

  const deleterObject = document.createElement("span");
  deleterObject.innerHTML = " &times;";
  deleterObject.style.cursor = "pointer";
  deleterObject.onclick = quitarObjetoEnvio;

  objeto.appendChild(deleterObject);
  contenedor.append(objeto);

  input.val("");

  function quitarObjetoEnvio() {
    $(this).parent().remove();
  }
}

// función que será utilizada para validar diariamente la contraseña del sistema administrativo
async function ValidarAccesoAdmin() {
  console.log("Validando acceso admin");
}

export {
  findUser,
  handleAuthErrors,
  redirectIfAuthenticated,
  agregarObjetoDeEnvio,
  ValidarAccesoAdmin,
};
