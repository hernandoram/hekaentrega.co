const fetch = require("node-fetch");
const db = require("../keys/firebase.js").firestore()
const XLSX = require("xlsx");

const key_prod = "WYLRFc9YwKNN3swvQ64owaOIg";
const key_dev = "test_baDWoKRn30HA5fNAZeU2wZLME";
// senMes();
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


const ws = XLSX.readFile("../procesos/InformeEnvios_20230905_8088.xlsx");

const listaGuias =  XLSX.utils.sheet_to_json(ws.Sheets["Table1"], {header:"A1"});
// actualizarFlete();
async function actualizarFlete() {
    console.log(listaGuias.length);

    const resultado = {
        iguales: 0,
        diferentes: 0,
        finalmenteIguales: 0,
        guiasPagadas: 0,
        erroresApi: 0
    }

    const respuestaAsincrona = listaGuias
    // .slice(0,5)
    .map(async (g, i) => {
        const flete = g["FLETE"];
        const sobreFlete = g["SOBREFLETE"];
        const numeroGuia = g["Número de Guia"].toString();


        await db.collectionGroup("guias").where("numeroGuia", "==", numeroGuia)
        .get()
        .then(async q => {
            const doc = q.docs[0];
            const infoOriginal = doc.data();
            const nuevaData = JSON.parse(JSON.stringify(infoOriginal));
            const detalles = nuevaData.detalles;
            const sobrefleteOficina = detalles.sobreflete_oficina ?? 0;
            const seguroMercancia = 0;

            
            if(nuevaData.debe == 0) {
                resultado.guiasPagadas++;
                return;
            }
            
            const cotizacionApi = await cotizarApi(nuevaData);
            if(cotizacionApi.error) {
                resultado.erroresApi++;
                console.log(cotizacionApi, nuevaData.numeroGuia);
                return;
            }

            const {flete, sobreflete:sobreFlete} = cotizacionApi;

            if(detalles.flete !== flete || detalles.comision_trasportadora !== sobreFlete) resultado.diferentes++
            else resultado.iguales++;
            

            detalles.flete = flete;
            detalles.comision_trasportadora = sobreFlete;

            const total = flete + sobreFlete + detalles.comision_heka 
                + seguroMercancia + sobrefleteOficina

            detalles.total = total;
            detalles.costoDevolucion = total;

            nuevaData.costo_envio = detalles.total;
            nuevaData.debe = -detalles.total;


            const arrayCambios = ["costo_envio", "debe", "detalles"];
            const origen = tomarSoloCiertosCampos(infoOriginal, arrayCambios);
            const resultante = tomarSoloCiertosCampos(nuevaData, arrayCambios);

            if(analizardiferenciaSuperficial(origen, resultante)) resultado.finalmenteIguales++;

            // console.log("ANTES => ", origen);
            // console.log("DESPUES => ", resultante);

            // doc.ref.update(resultante);
        });
    
        return resultado;
    });

    const analisis = await Promise.all(respuestaAsincrona);

    console.log(resultado);

}

function tomarSoloCiertosCampos(objeto, arrCampos) {
    return arrCampos.reduce((a,b) => {
        a[b] = objeto[b];
        return a;
    }, {});
}

function analizardiferenciaSuperficial(obj1, obj2) {
    return JSON.stringify(obj1) == JSON.stringify(obj2);
}

async function cotizarApi(data) {
    const id_user = data.id_user;
    const detalles = data.detalles;
    const cotizar = {
        "peso": detalles.peso_liquidar,
        "alto": parseInt(data.alto),
        "largo": parseInt(data.largo),
        "ancho": parseInt(data.ancho),
        "valorSeguro": data.seguro,
        "valorRecaudo": detalles.recaudo,
        "idDaneCiudadOrigen": data.dane_ciudadR,
        "idDaneCiudadDestino": data.dane_ciudadD,
        "tipo": data.type
    }

    const res = await fetch("http://localhost:6201/Api/Servientrega/Cotizar", {
        method: "POST",
        headers: {
            Authentication: id_user,
            "Content-Type": "Application/json"
        },
        body: JSON.stringify(cotizar)
    }).then(d => d.json());

    return res.body;
}