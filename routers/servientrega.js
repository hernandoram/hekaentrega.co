///SErvientrega
let express = require("express");
const app = express();
let router = express.Router();
let request = require("request");
let parseString = require("xml2js").parseString;
const bodyParser = require("body-parser");

router.use(bodyParser.urlencoded({extended: true}));
router.use(bodyParser.json());

function consultarGuia(numGuia){
    let res=`<?xml version="1.0" encoding="utf-8"?>
    <soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
      <soap:Body>
      <ConsultarGuia xmlns="http://servientrega.com/">
      <NumeroGuia>${numGuia}</NumeroGuia>
      </ConsultarGuia>
      </soap:Body>
    </soap:Envelope>`;

    return res;
}

  
  var EncriptarContrasena = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
<soap:Body>
<EncriptarContrasena xmlns="http://tempuri.org/">
<strcontrasena>Stv1234</strcontrasena>
</EncriptarContrasena>
</soap:Body>
</soap:Envelope>`

var consultarGuiaPorNumDoc = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Header>
  <AuthHeader xmlns="http://tempuri.org/">
  <login>KatheRecaudo</login>
  <pwd>Yt0208@s</pwd>
  <Id_CodFacturacion>SER122990</Id_CodFacturacion>
  <Nombre_Cargue></Nombre_Cargue>
  </AuthHeader>
  </soap:Header>
  <soap:Body>
  <ConsultarGuiasByNumDocumento xmlns="http://tempuri.org/">
  <numeroGuia>2102566145</numeroGuia>
  <Ide_CodFacturacion>SER122990</Ide_CodFacturacion>
  </ConsultarGuiasByNumDocumento>
  </soap:Body>
  </soap:Envelope>`
  var url = "http://sismilenio.servientrega.com/wsrastreoenvios/wsrastreoenvios.asmx"
  
router.post("/consultarGuia", (req, res) => {
    console.log(req.body.guia);

  request.post({
    "headers": { "content-type": "text/xml" },
    "url": url,
    "body": consultarGuia(req.body.guia) 
  }, (error, response, body) => {
    if(error) {
        return console.dir(error);
    }
    console.log(response.statusCode);
    // console.log(JSON.stringify(body));
    res.send(JSON.stringify(body));
    parseString(body, (err, result) => {
        // console.dir(result);
        // console.dir(result["soap:Envelope"]["soap:Body"]);
        // console.dir(result["soap:Envelope"]["soap:Body"][0]["ConsultarGuiaResponse"][0].ConsultarGuiaResult);
        // res.json(result);
        // res.json(result["soap:Envelope"]["soap:Body"][0]["ConsultarGuiaResponse"][0].ConsultarGuiaResult[0]);
    })
  });
})
//2102566145
module.exports = router;