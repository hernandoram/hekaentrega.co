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
fetch("https://messages-sandbox.nexmo.com/v1/messages", {
    method: "POST",
    headers: {
        "097f0f9a": "nhDrqPrlxShR8stV",
        "Content-Type": "Application/json",
        'Accept': 'application/json',
        "Authorization": "Bearer " + "MDk3ZjBmOWEsbmhEcnFQcmx4U2hSOHN0Vg=="
    },
    body: JSON.stringify({
        "from": "14157386102",
        "to": "573214929471",
        "message_type": "text",
        "text": "This is a WhatsApp Message sent from the Messages API",
        "channel": "whatsapp"
    })
}).then(d => d.json())
.then(d => {
    console.log(d);
})