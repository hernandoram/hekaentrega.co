const rp = require("request-promise");
const cron = require("node-cron");
const Cr = require("../keys/cellVoz");
const db = require("../keys/firebase").firestore();

async function authenticate() {
   const auth = await rp(Cr.endpoint + "auth/login", {
        "headers": { 
            "content-type": "application/json"
        },
        method: "POST",
        "body": JSON.stringify({
            "account": Cr.account,
            "password": Cr.password
        })
    });

    return JSON.parse(auth);
}

async function singleMessage(number, message, type = 1) {
    if (!message) throw new Error("Recuerda agregar el mensaje a enviar.")
    if (message.length > 466) throw new Error("El texto del mensaje a enviar no debe superar los 466 caracteres");

    const {token} = await authenticate();
    const res = await rp(Cr.endpoint + "sms/single", {
        "headers": {
            "content-type": "application/json",
            "Authorization": "Bearer " + token,
            "api-key": Cr.apiKey
        },
        method: "POST",
        "body": JSON.stringify({number, message, type})
    })
    .catch(e => {
        // db.collection("mensajesPendientes").add({
        //     number, message, type,
        //     reason: e.error
        // })
        return e.error;
    })

    console.log(res);
    return JSON.parse(res);
}

async function sendMessage(req, res) {
    console.log("enviando mensaje");
    const {number, message, type} = req.query;
    try {
        const response = await singleMessage(number, message || "mensaje de prueba", type);
        res.json(response);
    } catch (e) {
        res.status(400).json({success: false, message: e.message});
    }
}

function reSendMessages() {
    db.collection("mensajesPendientes").get()
    .then(querySnapshot => {
        querySnapshot.forEach(doc => {
            const {number, message} = doc.data();
            singleMessage(number, message);
            doc.ref.delete();
        })
    })
}

if(!process.env.DEVELOPMENT) {
    cron.schedule('0 9 * * *',() => {
        reSendMessages();
    });
}

module.exports = {singleMessage, sendMessage}