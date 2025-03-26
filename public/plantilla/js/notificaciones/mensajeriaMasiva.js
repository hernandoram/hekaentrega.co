import AnotacionesPagos from "../pagos/AnotacionesPagos.js";
import { guiaExiste } from "../pagos/comprobadores.js";
import { ChangeElementContenWhileLoading } from "../utils/functions.js";

const formCargador = $("#form-mensajeria_masiva");
const anotacionesJq = $("#anotaciones-mensajeria_masiva");
formCargador.on("submit", generarNotificacionMasiva);

async function generarNotificacionMasiva(e) {
    e.preventDefault();
    const l = new ChangeElementContenWhileLoading(e.originalEvent.submitter);
    
    const data = new FormData(e.target);
        
    l.init();
    const resultExcel = await fetch("/excel_to_json", {
        method: "POST",
        body: data,
    })
    .then(d => d.json())
    .catch( e => console.log(e));

    console.log(resultExcel);
    const type = e.target.type.value;
    const validaciones = validadorFormato(resultExcel, type);

    if(validaciones.icon === "error") {
        Swal.fire(validaciones);
        return l.end();
    }

    await enviarMensajesPorTipo(resultExcel, type);

    console.log(resultExcel);

    e.target.reset();

    l.end();
}


function validadorFormato(arrData, type) {
    if(!arrData.length) return {
        icon: "error",
        title: "No hay datos",
        text: "El archivo destino no tiene información"
    }

    const primerValor = arrData[0];
    let importantes = ["plantilla", "valor_1", "celular"];
    switch(type) {
        case "GUIA":
            importantes.push("numeroGuia");
        break;
        case "USUARIO":
            importantes.push("centro_de_costo");
        break;
    }

    if(importantes.some(v => !primerValor[v] && primerValor[v] !== 0)) {
        return {
            icon: "error",
            title: "Error en formato",
            text: `El formato de excel para el tipo masivo que se desea utilizar "${type}", no son correctos, estos campos son obligatorios: ${importantes.toString()}`
        }
    }

    return {
        icon: "success"
    };
}

async function enviarMensajesPorTipo(arrData, type) {
    switch(type) {
        case "GUIA":
            return enviarMensajePorGuia(arrData);
        case "USUARIO":
            return enviarMensajePorUsuario(arrData);
        case "DIRECTO":
            return enviarMensajeDirecto(arrData);
    }
}

async function enviarMensajePorUsuario(arrData) {
    const anotaciones = new AnotacionesPagos(anotacionesJq);
    anotaciones.init();
    for (let data of arrData) {
        const usuario = await db.collection("usuarios")
        .where("centro_de_costo", "==", data.centro_de_costo)
        .get()
        .then(q => {
            if(!q.size) return null;

            return q.docs[0].data();
        });

        if(usuario === null) {
            anotaciones.addError(`El usuario ${data.centro_de_costo}, no ha sido encontrado`);
            continue;
        }

        switch(data.celular) {
            case "PRINCIPAL":
                data.celular = usuario.celular;
            break;

            case "SECUNDARIO":
                data.celular = usuario.celular2;
            break;

            default: 
                anotaciones.addError(`El parámetro "celular" para el usuario ${data.centro_de_costo}, no está correctamente configurado, los disponibles son: PRINCIPAL Y SECUNDARIO`);
            continue;
        }
            
        if(!data.celular) {
            anotaciones.addError(`El celular encontrado en el usuario ${data.centro_de_costo}, no existe, intente con otro`);
            continue;
        }
        
        const messageResponse = await enviarMensaje(data);

        if(messageResponse.error) {
            anotaciones.addError(`No se pudo enviar el mensaje al número ${data.celular}: ${messageResponse.message}`);
        }
    
    }

    anotaciones.addError("Proceso finalizado correctamente.", {
        color: "success"
    });
}

async function enviarMensajePorGuia(arrData) {
    const anotaciones = new AnotacionesPagos(anotacionesJq);
    anotaciones.init();
    for (let data of arrData) {
        const guia = await guiaExiste({GUIA: data.numeroGuia});

        if(!guia) {
            anotaciones.addError(`La guia ${data.numeroGuia}, no ha sido encontrada.`);
            continue;
        }

        switch(data.celular) {
            case "DESTINATARIO":
                data.celular = guia.celularD;
            break;

            case "REMITENTE":
                data.celular = guia.celularR;
            break;

            default: 
                anotaciones.addError(`El parámetro "celular" para la guia ${data.numeroGuia}, no está correctamente configurado, los disponibles son: DESTINATARIO Y REMITENTE`);
                continue;
        }
            
        if(!data.celular) {
            anotaciones.addError(`El celular encontrado en la guia ${data.numeroGuia}, no existe, intente con otro parámetro`);
            continue;
        }

        const messageResponse = await enviarMensaje(data);

        if(messageResponse.error) {
            anotaciones.addError(`No se pudo enviar el mensaje al número ${data.celular}: ${messageResponse.message}`);
        }
    
    }
    
    anotaciones.addError("Proceso finalizado correctamente.", {
        color: "success"
    });
}

async function enviarMensajeDirecto(arrData) {
    const anotaciones = new AnotacionesPagos(anotacionesJq);
    anotaciones.init();
    let fila = 0;
    for (let data of arrData) {  
        fila++;          
        if(!data.celular) {
            anotaciones.addError(`El parámetro "Celular", en la fila ${fila}, está vacío.`);
            continue;
        }

        const messageResponse = await enviarMensaje(data);

        if(messageResponse.error) {
            anotaciones.addError(`No se pudo enviar el mensaje al número ${data.celular}: ${messageResponse.message}`);
        }
    }
    
    anotaciones.addError("Proceso finalizado correctamente.", {
        color: "success"
    });
}


async function enviarMensaje(data) {
    const {celular: telefono, plantilla: template} = data;

    const keys = Object.keys(data).filter(d => d.startsWith("valor_")).sort((a,b) => Number(a.split("_")[1]) - Number(b.split("_")[1]))
    const plantilla = keys.map(k => ({ default: data[k]?.toString() }));

    return fetch(
        `/mensajeria/ws/sendMessage/${template}`,
        organizarPostPlantillaMensaje(telefono, plantilla)
    )
    .then(d => d.json())
    .then(d => {
        if(d.errors) {
            return {
                error: true,
                message: JSON.stringify(d.errors)
            }
        }

        return d;
    })
    .catch(e => {
        return {
            error: true,
            message: e.message
        }
    });
}
