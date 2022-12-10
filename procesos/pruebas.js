const fetch = require("node-fetch");


/*
    curl -X POST https://messages-sandbox.nexmo.com/v1/messages \
-u '097f0f9a:nhDrqPrlxShR8stV' \
-H 'Content-Type: application/json' \
-H 'Accept: application/json' \
-d '{
    "from": "14157386102",
    "to": "$TO_NUMBER",
    "message_type": "text",
    "text": "This is a WhatsApp Message sent from the Messages API",
    "channel": "whatsapp"
  }'

  curl -X POST https://messages-sandbox.nexmo.com/v1/messages \
-u '097f0f9a:nhDrqPrlxShR8stV' \
-H 'Content-Type: application/json' \
-H 'Accept: application/json' \
-d '{
    "from": "14157386102",
    "to": "573103228343",
    "message_type": "text",
    "text": "This is a WhatsApp Message sent from the Messages API",
    "channel": "whatsapp"
  }'
*/
// fetch("https://messages-sandbox.nexmo.com/v1/messages", {
//     method: "POST",
//     headers: {
//         "097f0f9a": "nhDrqPrlxShR8stV",
//         "Content-Type": "Application/json",
//         'Accept': 'application/json',
//         "Authorization": "Bearer " + "MDk3ZjBmOWEsbmhEcnFQcmx4U2hSOHN0Vg=="
//     },
//     body: JSON.stringify({
//         "from": "14157386102",
//         "to": "573214929471",
//         "message_type": "text",
//         "text": "This is a WhatsApp Message sent from the Messages API",
//         "channel": "whatsapp"
//     })
// }).then(d => d.json())
// .then(d => {
//     console.log(d);
// })


/**
 curl -X "POST" "https://conversations.messagebird.com/v1/send" \
-H "Authorization: AccessKey YOUR-API-KEY" \
-H "Content-Type: application/json" \
--data '{
  "to": "+31XXXXXXXXX",
  "from": "WHATSAPP-CHANNEL-ID",
  "type": "text",
  "content": {
    "text": "Hello!",
    "disableUrlPreview": false
  }
}'
 */
const key_prod = "WYLRFc9YwKNN3swvQ64owaOIg";
const key_dev = "test_baDWoKRn30HA5fNAZeU2wZLME";
senMes();
function senMes() {
    fetch("https://conversations.messagebird.com/v1/send", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            // "Authorization": "baDWoKRn30HA5fNAZeU2wZLME",
            "Accept": "application/json",
            "Authorization": "AccessKey " + key_prod
        },
        body: JSON.stringify({
            "to": "+573214929471",
            "type": "hsm",
            "from": "f35e7a08-2086-49ae-a3b8-1c6be7920624",
            "content": {
                "hsm": {
                    "namespace": "f186f970_7b89_4b0e_bf3c_da3abf5a8e55",
                    "templateName": "sample_shipping_confirmation",
                    "language": {
                        "policy": "deterministic",
                        "code": "SPA"
                    },
                    "params": [
                        {
                        "default": "5"
                        }
                    ],
                }
            },
        })
        // body: JSON.stringify({
        //     "to": "+573154252018",
        //     "from": "f35e7a08-2086-49ae-a3b8-1c6be7920624",
        //     // "from": "100922832859150",
        //     "type": "text",
        //     "content": {
        //         "text": "Hello!",
        //         "disableUrlPreview": false
        //     }
        // })
    }).then(d => d.json())
    .then(d => {
        console.log(d);
    })
    .catch(e => console.log(e.message))
}

// curl -X GET https://rest.messagebird.com/balance -H 'Authorization: AccessKey test_gshuPaZoeEG6ovbc8M79w0QyM'
// getMes();
function getMes() {

    fetch("https://rest.messagebird.com/balance", {
        method: "GET",
        headers: {
            Authorization: "AccessKey " + key_prod
        }
    }).then(d => d.json())
    .then(d => {
        console.log(d);
    })
    .catch(e => console.log(e.message))
}
