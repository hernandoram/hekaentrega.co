import "../utils/viewer.js";
import iniciarSesion from "./login.js";
import {registro} from "./register.js";
import { handleAuthErrors, redirectIfAuthenticated, agregarObjetoDeEnvio } from "./handlers.js"
import { auth } from "../config/firebase.js";
import ciudades from "../../data/ciudades.js";
import llenarCiudades from "../consultarCiudades.js"

$("#signinWidthEmailAndPassword").on("submit", iniciarSesion);
$("#signinWidthCode").on("submit", iniciarSesion);
$("#register-form").on("submit", registro);
$("#rgOficina-form").on("submit", registro);
$("#restablecerCon-form").on("submit", restorePassword);
$("#register-add-objetos_envio").click(agregarObjetoDeEnvio);
$("#register-objetos_envio").on("keypress", agregarObjetoDeEnvio);

window.onload = () => {
    redirectIfAuthenticated();
    llenarCiudades(document.getElementById("register-ciudad"), ciudades);
    llenarCiudades(document.getElementById("rgOficina-ciudad"), ciudades);
    $("#contenedor").removeClass("d-none");
    $("#cargador").addClass("d-none");
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
