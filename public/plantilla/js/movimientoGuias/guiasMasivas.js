import { buscarCiudadPorCodigoDane, cotizarApi } from "../cotizador/cotizadorApi.js";
import { TranslatorFromApi } from "../cotizador/translator.js";
import AnotacionesPagos from "../pagos/AnotacionesPagos.js";
import { ChangeElementContenWhileLoading, fetchApp2 } from "../utils/functions.js";
import GuiaBase from "../utils/guiaBase.js";

const activarGuiasMasivas = new URLSearchParams(location.search).has(
    "guias_masivas"
);
const anotaciones = new AnotacionesPagos($("#anotaciones-creacion_masiva-guias_hist"), {title: "Creación masiva de guías"});

const btnGenerarGuia = $("#generarGuiasMasivas");
const inputGenerarGuias = $("#generarGuiasMasivas-input");
if(!activarGuiasMasivas) btnGenerarGuia.parent().remove();

btnGenerarGuia.on("click", () => inputGenerarGuias.click());
inputGenerarGuias.on("change", generarGuiasMasivas);

/** Función principal, disparada por un evento "onchange" de un input, que lee el archivo excel contenido, generando un "log" de los errores encontrados en el proceso
 * y se interpreta su información con los pasos:
 * 1. Convierte el excel en Json
 * 2. Genera una estructura clave para cotizar y/o crear guía
 * 3. Cotiza con el API de refactor
 * 4. Genera la guía en forma de pedido
 */
async function generarGuiasMasivas(e) {
    const l = new ChangeElementContenWhileLoading(btnGenerarGuia);
    l.init();
    const formData = new FormData();
    anotaciones.init();

    formData.append("documento", e.target.files[0]);

    const excelPeticionGuias = await fetch("/excel_to_json", {
        method: "POST",
        body: formData,
    })
    .catch(e => {
        Swal.fire("Erro al cargar", e.message, "error");
        return null;
    })
    .then(d => d.json());

    e.target.value = "";
    if(!excelPeticionGuias) {
        l.end();
        return;
    }

    let i = 0;
    for(let peticion of excelPeticionGuias) {
        i++;
        // Generamos la estructura de creación
        const estructuraCreacion = estructurarObjetoBase(peticion);
        if(estructuraCreacion.error) {
            const errorColumn = estructuraCreacion.columna ? `:${estructuraCreacion.columna}` : ""
            anotaciones.addError(`${i}${errorColumn} - ${estructuraCreacion.message}`);
            continue;
        }

        // Generamos el pedido
        const resultCreation = await generarPedido(estructuraCreacion);
        
        if(resultCreation.error) {
            anotaciones.addError(`Fila: ${i} - ${resultCreation.message}`);

        }

    }

    anotaciones.addError(`Proceso finalizado correctamente`, {
        color: "primary"
    }, {
        color: "primary",
        text: "Cerrar",
        onClick: () => anotaciones.reset()
    });

    l.end();

}

/** Función encargada de generar el pedido con una estructura básica, que servirá para cotizar directamente y generar la guía con los datos importantes para la misma */
async function generarPedido(estructuraCreacion) {
    const {dataBodega, dataDestinatario, producto} = estructuraCreacion;

    // Validamos la ciudad destino y extraemos nombres
    const ciudadDestino = await validarDaneCiudad(estructuraCreacion.city_destination);
    if(ciudadDestino.error) {
        return ciudadDestino;
    }

    // Se llena esta información para que se almacene en la creción de guía
    dataDestinatario.ciudad = ciudadDestino.label;
    dataDestinatario.departamento = ciudadDestino.state.label;

    // cotizamos con el api
    const {response: resultCotizacion} = await cotizarApi(estructuraCreacion);
    const cotizacionTransportadora = resultCotizacion.find(c => c.distributor_id === estructuraCreacion.distributor_id);

    // validamos que exista la transportadora insertada
    if(!cotizacionTransportadora) {
        return {
            error: true,
            message: `La transportadora ${estructuraCreacion.distributor_id} no se encuentra disponible`
        }
    }

    // generamos la traducción a objeto natural
    const traduccionCotizacion = new TranslatorFromApi(estructuraCreacion, cotizacionTransportadora);

    if(cotizacionTransportadora.message) {
        return {
            error: true,
            message: cotizacionTransportadora.message
        }
    }

    // generamos la maqueta básica de guía
    const guia = new GuiaBase(traduccionCotizacion);

    if(guia.saldoInvalido) {
        return {
            error: true,
            text: "No posee saldo suficiente para crear guías"
        }
    }
    
    // Revisamos la configuración de ciudad destino, para conocer si está habilitada
    configuracionesDestinoActual = await cargarConfiguracionesCiudad(guia.dane_ciudadD);
    const configCity = obtenerConfiguracionCiudad(guia.transportadora, guia.type);
    if (
        configCity &&
        !configCity.tipo_distribucion.length
    ) {
        return {
            error: true,
            message: configCity.descripcion
                ? configCity.descripcion
                : "No hay cobertura para este destino"
        }
    }

    // Si es una entrega en oficina y si la transportadora es inter o servi
    // se elimina la dirección ingresad
    if(estructuraCreacion.id_tipo_entrega === 2 && ["SERVIENTREGA", "INTERRAPIDISIMO"].includes(guia.transportadora)) {
        const newDirection = `Oficina principal ${estructuraCreacion.distributor_id}`;
        dataDestinatario.direccionDestinatario = newDirection;
        dataDestinatario.observaciones = "";
        dataDestinatario.barrio = "";
        guia.id_tipo_entrega = estructuraCreacion.id_tipo_entrega;
    }

    // Estas dos transportadoras son las única que pueden solicitar recolección esporádica
    if(["SERVIENTREGA", "INTERRAPIDISIMO"].includes(guia.transportadora)) {
        guia.recoleccion_esporadica = estructuraCreacion.recoleccion_esporadica;
    }

    guia.datosBodega = dataBodega;
    guia.datosDestinatario = dataDestinatario;
    guia.datosRemitente = datos_usuario;
    guia.detallesProducto = producto;


    const pedidoPorGenerar = guia.toObject();

    // finalmente generamos el pedido
    const resCreation = await enviar_firestore(pedidoPorGenerar); // Si a esta altura todo ha salido bien, el pedido por generar debe tener un id heka creado correctamente
    if(resCreation.icon === "error") {
        return {
            error: true,
            message: resCreation.message
        }
    }

    return {
        error: false,
        message: `La guía ha sido creada exitosamente con el id ${guia.id_heka}`
    }
}

const objetoEjemplo = {
    "Tipo de envio": "Pago destino", // type_payment
    "Bodega": "Testing",
    "Ciudad destino": "11001000",
    "Valor seguro": 25000,
    "Valor recaudo": 90000,
    "Peso": 1,
    "Alto": 1,
    "Ancho": 1,
    "Largo": 1,
    "Sumar costo de envio": "NO",
    "Transportadora": "servientrega",
    "Nota": "prueba documentos",
    "Contenido": "Prueba",
    "Solicitar recoleccion": "NO",
    "Nombres D": "Alberto",
    "Apellidos D": "Gutierrez",
    "Direccion D": "Calle del medio",
    "Barrio D": "Invertido",
    "Celular D": 1231231231,
    "Correo D": "correo@correo.com",
    "Identificacion D": "123",
    "Tipo identificacion D": "CC"
}

const converToBoolean = val => val.toUpperCase() === "SI";
const converToNumber = val => Number(val);
const converToString = val => val.toString();

const diccionarioBase = {
    "Tipo de envio": {
        key: "type_payment", 
        transform: val => {
            val = val.toUpperCase();
            switch(val) {
                // PAGO CONTRAENTREGA | PAGO DESTINO | CONVENCIONAL
                case "PAGO CONTRAENTREGA": return 1; 
                case "PAGO DESTINO": return 2; 
                case "CONVENCIONAL": return 3;
            }
        },
        validator: val => {
            const valores = ["PAGO CONTRAENTREGA", "PAGO DESTINO", "CONVENCIONAL"];
            const valido = valores.includes(val.toUpperCase());
            
            return {
                error: !valido,
                message: valido ? "Validaciones correctas" : "La columna debe poseer alguno de los siguientes valores: " + valores.toString()
            }
        }
    }, // type_payment
    "Tipo entrega": {
        key: "id_tipo_entrega", 
        transform: val => {
            val = val.toUpperCase();
            switch(val) {
                case "DIRECCION": return 1;
                case "OFICINA": return 2;
                default: return 1
            }
        }
    },
    "Ciudad destino": {key: "city_destination", transform: converToString, required: true},
    "Valor seguro": {key: "declared_value", transform: converToNumber, required: true},
    "Valor recaudo": {key: "collection_value", transform: converToNumber, transform: val => val ?? 0},
    "Peso": {key: "weight", transform: converToNumber, required: true},
    "Alto": {key: "height", transform: converToNumber, required: true},
    "Ancho": {key: "width", transform: converToNumber, required: true},
    "Largo": {key: "long", transform: converToNumber, required: true},
    "Sumar costo de envio": {key: "withshipping_cost", transform: converToBoolean},
    "Transportadora": {key: "distributor_id", transform: val => val.toLowerCase(), required: true},
    "Contenido": {key: "producto.nombre", required: true},
    "Referencia": {key: "producto.referencia", transform: val => val ?? ""},
    "Detalles Empaque": {key: "producto.paquete", transform: val => val ?? ""},
    "Solicitar recoleccion": {key: "recoleccion_esporadica", transform: val => converToBoolean(val) ? 1 : 0},
    "Observaciones": {key: "dataDestinatario.observaciones"},
    "Nombres D": {key: "dataDestinatario.nombre"},
    "Apellidos D": {key: "dataDestinatario.last_name"},
    "Direccion D": {key: "dataDestinatario.direccionDestinatario"},
    "Barrio D": {key: "dataDestinatario.barrio"},
    "Celular D": {key: "dataDestinatario.otroCelular"},
    "Correo D": {key: "dataDestinatario.email"},
    "Identificacion D": {key: "dataDestinatario.documentoIdentidad", transform: converToString},
    "Tipo identificacion D": {
        key: "dataDestinatario.tipoDocumento", 
        transform: val => {
            val = val.toUpperCase();
            switch(val) {
                case "NIT": return 1;
                case "CC": return 2;
                default: return 2;
            }
        }
    }
}

/** Función que recibe la información que viene desde un excel y la traduce a un objeto clave con validaciones y transformaciones para proseguir con la creación */
function estructurarObjetoBase(informacion) {
    const result = {};

    // Validamos el campo "Bodega"
    if(!informacion.Bodega) {
        return {
            error: true,
            message: "Falta el campo de Bodega"
        }
    }

    // Validamos qu ela bodega exista en el usuario
    const bodega = encontrarBodega(informacion.Bodega.trim());
    if(!bodega) {
        return {
            error: true,
            message: "La bodega ingresada no existe o no ha sido encontrada: " + informacion.Bodega
        }
    }

    result.warehouse = bodega.id;
    result.city_origin = bodega.dane_ciudad;
    result.dataBodega = bodega;
    for(let key in diccionarioBase) {
        let value = informacion[key] ?? "";
        
        const config = diccionarioBase[key];

        // Validamos los campos obligatorios
        if(config.required && !value) {
            return {
                error: true,
                columna: key,
                message: "Este campo es obligatorio"
            }
        }

        // Revisamos si tiene algún validador
        const newKey = config.key;
        if(typeof value === "string") value = value.trim();
        if(config.validator) {
            const validation = config.validator(value);
            validation.columna = key;
            if(validation.error) return validation;
        }

        // trnasformamos el dato, en caso de que tenga un transformador
        if(config.transform) value = config.transform(value);

        const keys = newKey.split(".");
    
        // Cuando corresponda, generamos un objeto anidado
        let ultimoObjeto = result;
        for(let i = 0; i < keys.length; i++) {
            const lastKey = i === keys.length - 1;
            const currentKey = keys[i];
            
            
            if(lastKey) {
                ultimoObjeto[currentKey] = value;
            } else if(!ultimoObjeto[currentKey]) {
                ultimoObjeto[currentKey] = {};
            }

            ultimoObjeto = ultimoObjeto[currentKey];
        }
    }

    result.in_order_form = false;

    return result;
}

/** Busca entre las bodegas que el usuario tiene registrada por el nombre */
function encontrarBodega(value) {
    const bodega = bodegasWtch.value.find(b => b.nombre === value);
    return bodega;
}

/** Encargado de buscar y cocmprobar la exxistencia de una determinada ciudad por el código dane */
async function validarDaneCiudad(dane) {
    const ciudad = await buscarCiudadPorCodigoDane(dane);

    if(ciudad.error) {
        return {
            error: true,
            message: `Error al consultar la ciudad ${dane}: ${ciudad.message}`
        }
    }

    if(!ciudad.response.rows.length) {
        return {
            error: true,
            message: `El código de ciudad ${dane} no ha sido encontrado`
        }
    }
 
    return ciudad.response.rows[0];
}

/** Función que recibe un Json y te devuelve un código de 17 dígitos, posiblemente único para realizar una marca de similitud de datos */
function codigoStandarRepeticiones(estructura) {
    const base64data = btoa(JSON.stringify(estructura));
    const middle = Math.round(base64data.length / 2);
    const uniqueCode = [base64data.slice(0, 5), base64data.slice(middle, middle + 5), base64data.slice(-5)].join("-");
    console.log(uniqueCode)
}