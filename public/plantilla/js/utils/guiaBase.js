export default class GuiaBase {
    peso = 0;
    alto = 0;
    ancho = 0;
    largo = 0;
    costo_envio = 0;
    valor = 0;
    seguro = 0;
    type = 0;
    dane_ciudadR = "";
    dane_ciudadD = "";
    ciudadR = "";
    ciudadD = "";
    departamentoR = "";
    departamentoD = "";
    transportadora = "";
    recoleccion_esporadica = 0; // 0:Sin recolección - 1: con recolección
    id_tipo_entrega = 1; // 1: Entrega en Dirección - 2: Entrega en oficina
    estadoActual = estadosGuia.pedido; // Básicamente empezarán siendo de tipo pedido
    seguimiento_finalizado = false;
    id_user = "";
    cuenta_responsable = "EMPRESA"; // Siempre es empresa
    centro_de_costo = ""

    constructor(baseCotizacion) {
        this.peso = baseCotizacion.kgTomado;
        this.alto = baseCotizacion.alto;
        this.ancho = baseCotizacion.ancho;
        this.largo = baseCotizacion.largo;
        this.costo_envio = baseCotizacion.costoEnvio;
        this.valor = baseCotizacion.valor;
        this.seguro = baseCotizacion.seguro;
        this.type = baseCotizacion.type;
        this.dane_ciudadR = baseCotizacion.dane_ciudadR;
        this.dane_ciudadD = baseCotizacion.dane_ciudadD;
        this.transportadora = baseCotizacion.transportadora;
        this.debe = baseCotizacion.debe;

        this.detalles = baseCotizacion.getDetails;

        this.transpVisible = this.transportadora;

        this.fecha = genFecha();
        this.timeline = new Date().getTime();
        this.id_user = user_id;
    }

    get saldoInvalido() {
        return !this.debe &&
        !datos_personalizados.actv_credit &&
        this.costo_envio > datos_personalizados.saldo &&
        this.type !== CONTRAENTREGA
    }

    set datosRemitente(remitente) {
        this.nombreR = remitente.nombre_completo.trim();
        this.nombre_empresa = remitente.nombre_empresa || "";
        this.celularR = remitente.celular?.toString();
        this.correoR = remitente.correo?.toString();
        this.centro_de_costo = remitente.centro_de_costo;
    }

    set datosBodega(bodega) {
        this.direccionR = bodega.direccion.trim() + ", " + bodega.barrio.trim();
        this.ciudadR = bodega.nombreCiudad;
        this.departamentoR = bodega.nombreDepartamento;

        if (
            this.transportadora === transportadoras.INTERRAPIDISIMO.cod
        ) {
            this.codigo_sucursal = bodega.codigo_sucursal_inter;

            // Por ahora solo se presentará esta varialbe con interrapidísimo
            // Ya que este permite filtrar la solicitud de recolección
            this.recoleccion_solicitada = false;
        }
    }

    set datosDestinatario(destinatario) {
        this.nombreD = destinatario.nombre.trim();
        this.identificacionD = destinatario.documentoIdentidad || 123;
        
        const direccion =
        destinatario.direccionDestinatario.trim() +
        ", " +
        destinatario.barrio.trim() +
        ", " +
        destinatario.observaciones.trim();
        this.direccionD = direccion.trim();

        this.telefonoD = destinatario.otroCelular;
        this.celularD = destinatario.celular || destinatario.otroCelular;
        this.correoD = destinatario.email.trim() || "notiene@gmail.com";

        this.tipo_doc_dest = destinatario.tipoDocumento;
        this.observaciones = destinatario.observaciones;

        this.ciudadD = destinatario.ciudad ?? this.ciudadD;
        this.departamentoD = destinatario.departamento ?? this.departamentoD;

    }

    set detallesProducto(producto) {
        this.dice_contener = producto.nombre.trim();
        this.referencia = producto.referencia.trim();
        this.empaqueDetalles = producto.paquete.trim();
    }    

    toObject() {
        return Object.assign({}, this);
    }
}