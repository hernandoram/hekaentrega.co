exports.crearGuia = async (req, res) => {
  const guia = req.body;
  const maquetador = new MaquetadorXML("./estructura/crearGuia.cord.xml");
  const datos_destinatario = transformarDatosDestinatario(guia);
  console.log("importante:" + guia);

  const esConvencional = guia.type === "CONVENCIONAL";
  if (esConvencional) {
    guia.referencia = undefined;
    guia.valor = undefined;
  } else {
    guia.forma_pago = 1;
  }

  const { v16, nit, div } = credentials;
  const peticion = Object.assign(
    {
      nit: nit,
      div: div,
      usuario: v16.usuario,
      clave: v16.clave,
      id_cliente: v16.id_cliente,
      codigo_cuenta: 2, // Codigo de la cuenta, 1 = Cuenta Corriente, 2 = Acuerdo semanal (siempre), 3 = Flete Pago
    },
    guia,
    datos_destinatario
  );

  const structure = maquetador.maqueta("CREADOR").fill(peticion);

  console.log(structure);
  try {
    const response = await fetch(v16.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "text/xml",
      },
      body: structure,
    }).then((d) => d.text());

    let xmlResponse = new DOMParser().parseFromString(response, "text/xml");
    const resCrearGuia =
      xmlResponse.documentElement.getElementsByTagName("return");
    const resError =
      xmlResponse.documentElement.getElementsByTagName("faultstring");

    const conv = async (xml) =>
      await xml2js.parseStringPromise(xml, {
        explicitArray: false,
        ignoreAttrs: true,
      });

    let responseJson = await conv(resCrearGuia);

    if (responseJson) {
      responseJson = responseJson.return;
    } else {
      responseJson = await conv(resError);
      if (responseJson) {
        responseJson.error = true;
        responseJson.message = responseJson.faultstring;
      }
    }

    res.send(
      responseJson || {
        error: true,
        message: "Problemas de comunicación",
      }
    );
  } catch (e) {
    res.send({
      error: true,
      message: e.message,
    });
  }
};
