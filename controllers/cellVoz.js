const rp = require("request-promise");
const Cr = require("../keys/cellVoz");

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

module.exports = {singleMessage, sendMessage}