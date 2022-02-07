const firebase = require("../keys/firebase");
const db = firebase.firestore();
const {estandarizarFecha} = require("./funciones");

exports.notificarGuiaOficina = async (options) => {
    //Este es el patrón utilizado para el objeto que se ingresa en las notificaciones
    let example_data = {
        visible_admin: false,
        visible_user: false,
        visible_office: true,
        icon: ["exclamation", "danger"],
        detalles: "arrErroresUsuario", //mostrar una lista de posibles causas
        user_id: "vinculo.id_user",
        office_id: "identificador de una oficina",
        mensaje: "Mensaje a mostrar en la notificación",
        href: "id destino",
        fecha: "dd/mm/aaaa",
        timeline: "new Date().getTime()", // ej. 125645584895
        id_heka: "id_heka"
    }

    let fecha = estandarizarFecha();
    let hora = new Date().getHours();
    let minutos = new Date().getMinutes();    
    if(hora <= 9) hora = "0" + hora;
    if(minutos <= 9) minutos = "0" + minutos;
    fecha += ` - ${hora}:${minutos}`;;
    let notificacion = {
        visible_office: true,
        fecha,
        timeline: new Date().getTime(),
        mensaje: "Se ha creado una nueva guía que se dirige a tu oficina."
    };

    Object.assign(notificacion, options);

    db.collection("notificaciones").add(notificacion);
}