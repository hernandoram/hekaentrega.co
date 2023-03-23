/*
Buen dia

Envío información sobre los web service, documentación y wsdl para la integración de envíos, usuarios y contraseñas, estos datos están en la base de datos de pruebas, cuando tengan todo listo envio las de producción:

Web Service generacion de guias

Documentación
https://sandbox.coordinadora.com/agw/ws/guias/1.6/server.php?doc

WSDL
https://sandbox.coordinadora.com/agw/ws/guias/1.6/server.php?wsdl

Id_cliente:   41272 (Div.01 Acuerdo Semanal)  

Usuario:      offy.ws
Contraseña:  Off!41s = b54593b3c36f4e7a3406865be186da6966791b55c6fdb0855972b8f630627924

Web Service Seguimiento de despachos

Documentación
https://sandbox.coordinadora.com/ags/1.5/server.php?doc

WSDL
https://sandbox.coordinadora.com/ags/1.5/server.php?wsdl
https://ws.coordinadora.com/ags/1.5/server.php

Apikey:  97ccbc6f-4fff-4cb4-be36-7d6d68b693d6
Contraseña:  lN6qN2xB4bM9nM5b
Nit.  901521629

*/

const credPrueba = {
    nit: 901521629,
    div: "01",
    v15: {
        apikey: "97ccbc6f-4fff-4cb4-be36-7d6d68b693d6",
        clave: "lN6qN2xB4bM9nM5b",
        endpoint: "https://ws.coordinadora.com/ags/1.5/server.php"
    },
    v16: {
        usuario: "offy.ws",
        claveSinSha: "Off!41s",
        id_cliente: "41272",
        clave: "b54593b3c36f4e7a3406865be186da6966791b55c6fdb0855972b8f630627924",
        endpoint: "https://guias.coordinadora.com/ws/guias/1.6/server.php"
    }
}

module.exports = credPrueba;