import "../utils/viewer.js";
import iniciarSesion from "./login.js";
import registro from "./register.js";
import { redirectIfAuthenticated } from "./handlers.js"
import { auth } from "../config/firebase.js";
import ciudades from "../../data/ciudades.js";
import llenarCiudades from "../consultarCiudades.js"

$("#signinWidthEmailAndPassword").on("submit", iniciarSesion);
$("#signinWidthCode").on("submit", iniciarSesion);
$("#register-form").on("submit", registro);
$("#rgOficina-form").on("submit", registro);
$("#restablecerCon-form").on("submit", restorePassword);
$("#register-add-objetos_envio").click(agregarObjetoDeEnvio);
$("#register-objetos_envio").on("keypress", agregarObjetoDeEnvio)

window.onload = () => {
    redirectIfAuthenticated();
    llenarCiudades(document.getElementById("register-ciudad"), ciudades);
    llenarCiudades(document.getElementById("rgOficina-ciudad"), ciudades);
}

async function restorePassword(e) {
    e.preventDefault();
    const instructions = $("#mensaje-respuesta-restablecerCon");
    const email = $("#restablecerCon-email").val();
    const respuesta = $("#respuesta-restablecerCon");
    const resError = $("#error-restablecerCon-form");
    resError.text("");

    const res = await sendPasswordResetEmail(email)
    
    if(res.error) return resError.text(res.message);

    e.target.classList.add("d-none");
    respuesta.removeClass("d-none");
    instructions
    .html(`
        Se acaba de enviar correctamente un mensaje al correo <strong>${email}</strong> para proseguir con su restablecimiento de contraseña.
    `);
}

async function sendPasswordResetEmail(email) {
    const user = await auth.sendPasswordResetEmail(email)
    .then(cr => cr.user)
    .catch(handleAuthErrors);

    return user;
}

function agregarObjetoDeEnvio(e) {
    if (e.target.nodeName === "INPUT" && e.keyCode !== 13) return;
    const input = $("#register-objetos_envio")
    const val = input.val().trim();
    const valores = $("[data-objeto_envio]").map((i,it) => it.getAttribute("data-objeto_envio")).get();

    if(!val) return;

    const contenedor = $("#register-cont-objetos_envio");
    const objeto = document.createElement("p");
    objeto.innerText = val;
    objeto.setAttribute("class", "badge badge-soft-primary p-1 m-1");
    objeto.setAttribute("data-objeto_envio", val);

    const deleterObject =  document.createElement("span");
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
