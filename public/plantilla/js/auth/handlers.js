import { firestore as db } from "../config/firebase.js";


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

function redirectIfAuthenticated() {
    if(localStorage.getItem("acceso_admin")){
        location.href = "admin.html";
    } else if(localStorage.getItem("user_id")) {
        location.href = "plataforma2.html";
    }
}

export {findUser, handleAuthErrors, redirectIfAuthenticated}