const table = $("#tabla-historial-guias").DataTable({
    destroy: true,
    data: null,
    rowId: "row_id",
    order: [[1, "desc"]],
    columns: [
        {data: "id_heka", title: "Id", defaultContent: ""},
        {data: "numeroGuia", title: "Guía transportadora", defaultContent: ""},
        {data: "estado", title: "Estado", defaultContent: ""},
        {data: "transportadora", 
        orderable: false,
        title: "Transportadora", defaultContent: ""},
        {data: "type", title: "Tipo", defaultContent: ""},
        {data: "nombreD", title: "Destinatario", defaultContent: ""},
        {
            data: "telefonoD", title: "Telefonos",
            defaultContent: "", render: (valor,type,row) => {
                if(type === "display" || type === "filter") {
                    const aCelular1 = `<a class="btn btn-light d-flex align-items-baseline mb-1 action" href="https://api.whatsapp.com/send?phone=57${valor.toString().replace(/\s/g, "")}" target="_blank"><i class="fab fa-whatsapp mr-1" style="color: #25D366"></i>${valor}</a>`;
                    const aCelular2 = `<a class="btn btn-light d-flex align-items-baseline action" href="https://api.whatsapp.com/send?phone=57${row["celularD"].toString().replace(/\s/g, "")}" target="_blank"><i class="fab fa-whatsapp mr-1" style="color: #25D366"></i>${row["celularD"]}</a>`;
                    return aCelular1;
                }

                return valor;
            }
        },
        {data: "ciudadD", title: "Ciudad", defaultContent: ""},
        {data: "fecha", title: "Fecha", defaultContent: ""},
        {
            data: "seguro", title: "Seguro", 
            defaultContent: "", render: (value, type, row) => {
                if(type === "display" || type === "filter") {
                    return value || row["valor"];
                }

                return value;
            }
        },
        {
            data: "valor", title: "Recaudo", 
            defaultContent: ""
        },
        {
            data: "costo_envio", title: "Costo de envío", 
            defaultContent: "",
        },
    ],
    language: {
      url: "https://cdn.datatables.net/plug-ins/1.10.24/i18n/Spanish.json"
    },
    dom: 'Bfrtip',
    buttons: [{
        extend: "excel",
        text: "Descargar excel",
        filename: "Historial Guías",
        exportOptions: {
          columns: [1,2,3,4,5,6,7,9,10,11,12,13]
        }
    }, {
        text: "Descargar guías",
        className: "btn btn-primary",
        action: descargarGuiasParticulares
    }, {
        text: "Crear Documentos",
        className: "btn btn-success",
        action: crearDocumentos
    }],
    scrollY: '50vh',
    scrollX: true,
    scrollCollapse: true,
    paging: false,
    lengthMenu: [ [-1, 10, 25, 50, 100], ["Todos", 10, 25, 50, 100] ],
});

export default class SetHistorial {
    constructor() {
        this.guias = [];
        this.filtradas = [];
        this.filtrador = "SERVIENTREGA";
        this.renderTable = true;
    }

    add(guia) {
        const filtro = this.defineFilter(guia.transportadora) === this.filtrador;
        const gIdx = this.guias.findIndex(g => g.id_heka === guia.id_heka);
        const lIdx = this.filtradas.findIndex(g => g.id_heka === guia.id_heka);

        if (filtro) {
            if(lIdx === -1) {
                this.filtradas.push(guia);
                table.row.add(guia)
                this.renderTable = true;
            } else {
                const row = table.row(lIdx);
                this.filtradas[lIdx] = guia;
                row.data(guia);
                this.renderTable = false;
            }
        } else if(!filtro && lIdx !== -1) {
            const row = table.row(lIdx);
            table.row(lIdx).remove();
            this.filtradas.splice(lIdx, 1);
            this.renderTable = true;
        }

        if(gIdx === -1) {
            this.guias.push(guia);
        } else {
            this.guias[gIdx] = guia;
        }
    }

    delete(id_heka) {
        const index = this.guias.indexOf(g => g.id_heka === id_heka);

        if(index !== -1) this.guias.splice(index,1);
    }

    defineFilter(t) {
        return t;
    }

    filter(filt) {
        this.filtrador = filt;
        this.filtradas = this.guias.filter(g => this.defineFilter(g.transportadora) === filt);
        this.render(true);
        return this.filtradas;
    }

    render(clear) {
        if(!this.renderTable && !clear) return;
        
        if(clear) {
            table.clear()
            this.filtradas.forEach(guia => {
                table.row.add(guia);
            });
        }
        table.draw();

        this.renderTable = false;
    }
}