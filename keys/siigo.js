const credencialesPrueba = {
    endpoint: "https://private-anon-9d1e9d44b6-siigoapi.apiary-mock.com",
    username: "sandbox@siigoapi.com",
    access_key: "NDllMzI0NmEtNjExZC00NGM3LWE3OTQtMWUyNTNlZWU0ZTM0OkosU2MwLD4xQ08=",
    document_id: 24446,
    identificacion: 13832081,
    id_vendedor: 629,
    id_tipo_pago: 5636,
    idAutoRetencion: 27481, // Autorretencion 0.8%
    partnerId: "OFFYSAS" // Un nuevo header solicitado https://siigoapi.docs.apiary.io/#introduction/partner-id
};

const credenciales = {
    endpoint: "https://api.siigo.com",
    username: "hekaentregaco@gmail.com",
    access_key: "NmE5ZTdlODgtZDA2Ni00ODczLTk5MzQtYmU0OTEwNWFlNTc2OnJPYXo0Y20hM1A=",
    document_id: 23159,
    identificacion: 1072497419,
    id_vendedor: 953,
    id_tipo_pago: 17992, // Recarga sellers,
    idAutoRetencion: 27657, // Autorretencion 1.10%
    partnerId: "OFFYSAS" // Un nuevo header solicitado https://siigoapi.docs.apiary.io/#introduction/partner-id
}

// module.exports = credencialesPrueba;
module.exports = credenciales;