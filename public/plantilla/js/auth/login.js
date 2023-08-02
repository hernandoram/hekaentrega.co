import { auth } from "../config/firebase.js";
import { ChangeElementContenWhileLoading } from "../utils/functions.js";
import { handleAuthErrors, findUser } from "./handlers.js";

export default async function iniciarSesion(e) {
    e.preventDefault();
    const form = new FormData(this);
    const response = $(".response", this);
    const submBtn = $("[type='submit']", this);
    const charge = new ChangeElementContenWhileLoading(submBtn);
    const signinType = this.getAttribute("id");
    const firebaseAuth = signinType === "signinWidthEmailAndPassword";

    response.text("");
    charge.init();

    
    let auth, user;
    if(firebaseAuth) {
        const email = form.get("email");
        const password = form.get("password");
        auth = await signInWithEmailAndPassword(email, password);
        const errorAuth = auth && auth.code;
        console.log(auth);
        if(errorAuth) {
            response.text(auth.message);
        } else {
            user = await findUser(auth.uid);
        }
    } else {
        const cod_ingreso = form.get("ingreso");
        user = await findUser(cod_ingreso);
    }

    if(user && user.error) response.text(user.message);



    charge.end();
}

async function signInWithEmailAndPassword(email, password) {
    const user = await auth.signInWithEmailAndPassword(email, password)
    .then(cr => cr.user)
    .catch(handleAuthErrors);

    // auth.signOut();
    return user;
}