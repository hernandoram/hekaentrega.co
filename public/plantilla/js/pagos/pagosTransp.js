import { ChangeElementContenWhileLoading } from "../utils/functions.js";
import { guiaExiste, obtenerInformacionPago } from "./comprobadores.js";

const formCargador = $("#form-pagos_transportadoras");
formCargador.on("submit", actualizarDatosGuiasPagadas);
const tabla = $("#tabla-pagos_transportadoras");

const columns = [{
    title: "GUIA",
    data: "numeroGuia"
}, {
    title: "SEMANA DE PAGO",
    data: "semana_pago"
}, {
    title: "RECAUDO",
    data: "recaudo"
}, {
    title: "FLETE",
    data: "flete"
}, {
    title: "COMISION HEKA",
    data: "comision_heka"
}, {
    title: "FECHA DE PAGO",
    data: "fecha_pago_heka"
}, {
    title: "FACTURA TRNSPO",
    data: "num_traslado"
}];

const dataTable = tabla.DataTable({
    destroy: true,
    data: null,
    rowId: "row_id",
    order: [[0, "asc"]],
    columns,
    language: {
      url: "https://cdn.datatables.net/plug-ins/1.10.24/i18n/Spanish.json",
    },
    dom: "Bfrtip",
    buttons: [
        {
            extend: "excel",
            text: "Descargar Historial",
            filename: "Pagos Transportadora",
            title: "Pagos Transportadora",
        }
    ],
    scrollY: "50vh",
    scrollX: true,
    scrollCollapse: true

});

async function actualizarDatosGuiasPagadas(e) {
    e.preventDefault();
    const l = new ChangeElementContenWhileLoading(e.originalEvent.submitter);
    
    const data = new FormData(e.target);
        
    l.init();
    const resultExcel = await fetch("/excel_to_json", {
        method: "POST",
        body: data,
    })
    .then(d => d.json())
    .catch( e => console.log(e));

    const infoPagosTransp = await transformarPagosTransportadora(resultExcel, e.target.transportadora.value);

    dataTable.clear();
    dataTable.rows.add(infoPagosTransp).draw();

    e.target.reset();

    l.end();
}


async function transformarPagosTransportadora(arrData, transp) {
    const infobase = {
        num_traslado: 0,
        fecha_traslado: "",
        numeroGuia: "",
        num_documento: "",
        nombre_destinatario: "",
        tel_destinatario: 0,
        valor_producto: 0,
        fecha_busqueda: 0,
        semana_pago: "",
        recaudo: 0,
        flete: 0,
        comision_heka: 0,
        fecha_pago_heka: ""
    };

    const result = [];

    for (let data of arrData) {
        const infoResultante = Object.assign({}, infobase);
        result.push(infoResultante);
        
        infoResultante.num_traslado = data.Num_Traslado;
        infoResultante.fecha_traslado = data.Fec_Traslado;
        infoResultante.numeroGuia = data.Guia;
        infoResultante.nombre_destinatario = data.Nom_Destinatario;
        infoResultante.num_documento = data.Num_Documentos;
        infoResultante.tel_destinatario = data.Tel_Destinatario;
        infoResultante.valor_producto = data.Valor_Producto;

        switch(transp) {
            case "ENVIA":
                infoResultante.fecha_traslado = infoResultante.fecha_traslado.slice(1);
                infoResultante.num_documento = infoResultante.num_documento.slice(1);
            break;
        }

        infoResultante.semana_pago = infoResultante.fecha_traslado;

        infoResultante.fecha_busqueda = parseInt(infoResultante.fecha_traslado.split("/").reverse().join(""));

        const guia = await guiaExiste({GUIA: infoResultante.numeroGuia});
        
        if (guia) {
            infoResultante.recaudo = guia.detalles.recaudo;
            infoResultante.flete = guia.detalles.flete;
            infoResultante.comision_heka = guia.detalles.comision_heka;
        }

        const infoPago = await obtenerInformacionPago(infoResultante.numeroGuia, transp);

        if(infoPago) {
            infoResultante.fecha_pago_heka = infoPago.FECHA;
        }
    }

    return result;
}

