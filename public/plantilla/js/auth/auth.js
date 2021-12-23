import "../utils/viewer.js";
import { auth, firestore as db } from "../config/firebase.js";
import ciudades from "../../data/ciudades.js";
import llenarCiudades from "../consultarCiudades.js"
import { ChangeElementContenWhileLoading, verificador, DetectorErroresInput } from "../utils/functions.js";
import Stepper from "../utils/stepper.js";

$("#signin-form").on("submit", iniciarSesion);
$("#register-form").on("submit", revisarErroresAntesDeRegistrarNuevoUsuario);
$("#checkbox-signin").change(toggleSigninWidthCode);
$("#restablecerCon-form").on("submit", restorePassword);
$("#register-add-objetos_envio").click(agregarObjetoDeEnvio);

const comprobacionesRegistro = habilitarComprobacionesDeInputs();
window.onload = () => {
    redirectIfAuthenticated();
    llenarCiudades(document.getElementById("register-ciudad"), ciudades);
}

async function iniciarSesion(e) {
    e.preventDefault();
    const form = new FormData(this);
    const response = $(".response", this);
    const charge = new ChangeElementContenWhileLoading("#signin");
    const signinType = this.getAttribute("action");
    const firebaseAuth = signinType === "signinWidthEmailAndPassword";

    response.text("");
    charge.init();

    
    let auth, user;
    if(firebaseAuth) {
        const email = form.get("email");
        const password = form.get("password");
        auth = await signInWithEmailAndPassword(email, password);
        const errorAuth = auth && auth.code;
        if(errorAuth) {
            response.text(auth.message);
        } else {
            await findUser(auth.uid);
        }
    } else {
        const cod_ingreso = form.get("ingreso");
        user = await findUser(cod_ingreso);
    }

    if(user && user.error) response.text(user.message);



    charge.end();
}

function toggleSigninWidthCode(e) {
    const form = $("#signin-form");
    const onlyCode = $(this).prop("checked");
    const widthPassword = $("#signinWidthEmailAndPassword");
    const widthCode = $("#signinWidthCode");
    const instructions = $("#signin-instruction");
    const initialText = "Ingrese su correo electrónico y contraseña para ingresar a la plataforma.";
    const alternText = "Ingresa la contraseña que utilizaste al momento de registrarte.";
    const animate = () => {
        return instructions
        .text("")
        .hide("fast")
        .show("fast")
    }

    if(onlyCode) {
        animate().text(alternText)
        widthCode.show("fast");
        widthPassword.hide();
        form.prop("action", "signinWidthCode");
    } else {
        animate().text(initialText);
        widthPassword.show("fast");
        widthCode.hide();
        form.prop("action", "signinWidthEmailAndPassword");
    }
}


async function signInWithEmailAndPassword(email, password) {
    const user = await auth.signInWithEmailAndPassword(email, password)
    .then(cr => cr.user)
    .catch(handleAuthErrors);

    // auth.signOut();
    return user;
}

async function findUser(ingreso) {
    const user = await db.collection("usuarios").where("ingreso", "==", ingreso).get()
    .then(querySnapshot => {
        let user;
        querySnapshot.forEach(doc => {
            user = doc.data();
            user.id = doc.id;
        });

        if(!user) {
            return {
                error: true,
                message: "No se encontró ningún usuario guardado con las credenciales ingresadas."
            }
        } else {
            localStorage.setItem("user_id", user.id);
            localStorage.setItem("user_login", user.ingreso);
            if(user.acceso_admin){
                localStorage.setItem("acceso_admin", user.acceso_admin);
            }

            redirectIfAuthenticated();

            return user
        }
    }).catch(error => {
        return {
            error: true,
            message: error.message
        }
    });

    return user;
}

function handleAuthErrors(error) {
    const code = error.code;
    console.log(error);
    let res;
    switch(code) {
        case "auth/email-already-exists":
            res = {
                title: "Correo Exitente.",
                message: "Otro usuario ya está utilizando el correo electrónico proporcionado."
            }; 
            break;
        case "auth/email-already-in-use":
            res = {
                title: "Correo en uso.",
                message: "La direccion de correo electrónico ingresada ya está en uso."
            }
            break;
        case "auth/invalid-email":
            res = {
                title: "Correo inválido.",
                message: "El valor que se proporcionó para la propiedad del correo del usuario no es válido."
            };
            break;
        case 'auth/user-not-found':
            res = {
                title: "Usuario no encontrado.",
                message: "El usuario ingresado no existe."
            };
            break
        case 'auth/wrong-password':
            res = {
                title: "Contraseña inválida.",
                message: "La contraseña ingresada no es válida."
            }
            break;
        case "auth/network-request-failed":
            res = {
                title: "Conección débil",
                message: "Se ha producido un error de red (como tiempo de espera o conexión interrumpida) intente nuevamente más tarde."
            }
            break;
        default: 
            return {
                title: "Error desconocido",
                message: "Error: " + error.message
            }
    }

    res.code = code;
    res.error = true;
    return res;
}

function onAuthStateChange() {
    auth.onAuthStateChanged(user => {
        console.log(user);
        if(user) {
            findUser(user.uid);
        } else {
            // .... Todavía no manejaremos exepciones
        }
    });
}

function redirectIfAuthenticated() {
    if(localStorage.getItem("acceso_admin")){
        location.href = "admin.html";
    } else if(localStorage.getItem("user_id")) {
        location.href = "plataforma2.html";
    }
}

function habilitarComprobacionesDeInputs() {
    const varifyInputsImportants = new DetectorErroresInput(".verificacion-especial");
    varifyInputsImportants.init("blur");
    varifyInputsImportants.setBooleans = [{
        operator: '<',
        message: 'La contraseña debe tener como mínimo 8 carácteres',
        selector: "#register-password",
        forbid: 8,
        case: "length"
    }, {
        operator: 'regExp',
        message: 'El carácter {forbidden} no está permitido',
        selector: "#register-empresa",
        forbid: /[^\w\d\s_\-ñÑ]/g
    }, {
        operator: '>=',
        message: 'Has llegado al límite de carácteres ({forbidden}).',
        selector: "#register-empresa",
        forbid: 25,
        case: "length"
    }, {
        operator: 'regExp',
        message: 'Recuerde ingresar solo números.',
        selectors: ["#register-celular", "#register-celular2", "#register-numero_documento"],
        forbid: /[^\d]/
    }, {
        operator: '!=',
        message: 'El celular debe tener 10 díjitos',
        selector: "#register-celular",
        forbid: 10,
        case: "length",
    }];

    return [varifyInputsImportants]
}

const registerStep = new Stepper("#register-form");
registerStep.init();
// registerStep.findErrorsBeforeNext = (active) => {
//     const inputs = active.find("input");
//     const ids = new Array();
//     inputs.each((i, input) => ids.push(input.getAttribute("id")));

//     if(revisarErroresParticularesRegistro()) return true;

//     if(verificador(ids, null, "Este campo es obligatorio.")) {
//         return true;
//     };
// }

function revisarErroresParticularesRegistro() {
    const [comprobador_particular] = comprobacionesRegistro;

    if(comprobador_particular.hasError()) {
        const firstSelector = comprobador_particular.errores[0];
        const firstError = $(firstSelector);
        const step = firstError.parents(".step");
        const index = step.index();
        registerStep.moveTo(step);
        return true;
    }
}

async function revisarErroresAntesDeRegistrarNuevoUsuario(e) {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);
    const inputs = $(form).find("input:required");
    const loader = new ChangeElementContenWhileLoading("#registrar-nuevo-usuario");
    
    if(revisarErroresParticularesRegistro()) return;

    const ids = new Array();
    inputs.each((i, input) => ids.push(input.getAttribute("id")));


    if(verificador(ids, null, "Este campo es obligatorio.")) {
        return true;
    };

    if(!$("#register-terms").prop("checked")) {
        verificador(["register-terms"], true, "Debe aceptar términos y condiciones.")
        return true;
    }

    loader.init()

    registrarNuevoUsuario(formData)
    .catch(error => {
        const errorEl = document.createElement("p");
        errorEl.setAttribute("class", "mt-1 text-danger text-center mensaje-error");
        errorEl.innerText = error.message;
        console.log(error);
        form.append(errorEl);
        loader.end();
    });
}

async function registrarNuevoUsuario(formData) {
    const toSend = new Object();
    for(let registro of formData) {
        toSend[registro[0]] = registro[1].trim();
    }

    toSend.objetos_envio = $("[data-objeto_envio]").map((i,it) => it.getAttribute("data-objeto_envio")).get();
    toSend.direccion_completa = toSend.direccion + ", " + toSend.barrio + ", " + toSend.ciudad;

    const empresa = toSend.nombre_empresa.replace(/\s/g, "");
    
    toSend.centro_de_costo = "Seller" + empresa;
    toSend.cod_empresa = empresa.toLowerCase();
    
    const {correo, con, nombre_empresa} = toSend;
    const existe_empresa = await verificarExistencia(toSend.cod_empresa);
    if(existe_empresa) throw new Error('¡El nombre de empresa "' +nombre_empresa+ '" ya existe!');

    const newUser = await createUserWithEmailAndPassword(correo, con);

    if(newUser.error) throw new Error(newUser.message);

    toSend.ingreso = newUser.uid;

    console.log(toSend);
    await db.collection("usuarios").add(toSend);
    await auth.currentUser.sendEmailVerification();
    await findUser(toSend.ingreso);
}

async function verificarExistencia(cod_empresa) {
    return await db.collection("usuarios").where("cod_empresa", "==", cod_empresa)
    .get().then(querySnapshot => {
        return querySnapshot.size;
    });
}

async function createUserWithEmailAndPassword(email, password) {
    const user = await auth.createUserWithEmailAndPassword(email, password)
    .then(cr => cr.user)
    .catch(handleAuthErrors);

    return user;
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
    const input = $("#register-objetos_envio")
    const val = input.val().trim();
    const valores = $("[data-objeto_envio]").map((i,it) => it.getAttribute("data-objeto_envio")).get();
    console.log(valores);

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
