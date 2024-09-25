import { table as htmlTable, idTable } from "./views.js";


const columns = [
  {
    data: "numeroGuia",
    title: "Id",
    defaultContent: ""
  },
  {
    data: "peso",
    title: "Peso",
    defaultContent: ""
  },
  {
    data: "alto",
    title: "Alto",
    defaultContent: ""
  },
  {
    data: "ancho",
    title: "Ancho",
    defaultContent: ""
  },
  {
    data: "largo",
    title: "Largo",
    defaultContent: ""
  },
  {
    data: "valorSeguro",
    title: "Seguro de mercancía",
    defaultContent: ""
  },
  {
    data: "valorRecaudo",
    title: "Valor a recaudar",
    defaultContent: ""
  },
  {
    data: "idDaneCiudadDestino",
    title: "Ciudad destino",
    defaultContent: ""
  },
];

const config = {
    destroy: true,
    data: null,
    rowId: "row_id",
    order: [[2, "desc"]],
    columns,
    language: {
      url: "https://cdn.datatables.net/plug-ins/1.10.24/i18n/Spanish.json",
    },
    dom: "Bfrtip",
    buttons: [],
    scrollY: "60vh",
    scrollX: true,
    scrollCollapse: true
}

export default class TablaEnvios {
  constructor(selectorContainer) {
    const container = $(selectorContainer);
    container.append(htmlTable);

    this.table = $("#" + idTable).DataTable(config);

    this.table.on('click', 'tbody tr', e => {
        $(e.currentTarget).toggleClass('selected bg-gray-300');
        const dataSelected = this.table.rows(".selected").data().toArray();
        actualizarCotizador(dataSelected);
    });
  }

  add(guia) {
    const guias = this.table.data().toArray();
    const gIdx = guias.findIndex((g) => g.id === guia.id);
    
    console.log(guias);

    if (gIdx === -1) {
        this.table.row.add(guia).draw(false);
        console.log("Se ha agregado");
    } else {
        const row = this.table.row(lIdx).draw(false);
        row.data(guia);
    }

    console.log("Pintando tabla");
    // this.table.draw();

  }

  delete(id) {
    const index = this.guias.findIndex((g) => g.id === id);

    if(index !== -1) {
        this.guias.splice(index,1);
        this.renderTable = true;
    };
  }

  defineColumns() {
    // No está funcionando como debería (error desconocido)
    const renderizar = () => {
      this.table.columns().every((nCol) => {
        const col = this.table.column(nCol);

        const ver = columnas.includes(nCol);
        const visibilidadPrev = col.visible();

        if (visibilidadPrev != ver) {
          col.visible(ver);
        }
      });
    };

    try {
      renderizar();
    } catch {
      setTimeout(() => {
        renderizar();
      }, 500);
    }
  }

  render(clear) {
    if (!this.renderTable && !clear) return;

    if (clear) {
      this.table.clear();

      this.filtradas.forEach((guia) => {
        this.table.row.add(guia);
      });

      this.defineColumns();
    }

    this.table.draw();

    this.renderTable = false;
  }

  clean(avoid) {
    this.filtradas = [];
    this.guiasNeutras.clear();
    this.guias = respaldo;

    this.render(true);
  }
}

const formularioCotizacion = document.getElementById("cotizador-flexii_guia");
function actualizarCotizador(envios) {
    if(!envios.length) return formularioCotizacion.reset();
    const totales = {
        weight: 0,
        height: 0,
        width: 0,
        long: 0,
        declaredValue: 0
    }

    envios.forEach((val) => {
        totales.weight += val.peso;
        totales.height += val.alto;
        totales.width += val.ancho;
        totales.long += val.largo;
        totales.declaredValue += val.valorSeguro;
    });

    for ( let [key, value] of Object.entries(totales)) {
        const element = formularioCotizacion.elements[key];
        element.value = value;
    }
}