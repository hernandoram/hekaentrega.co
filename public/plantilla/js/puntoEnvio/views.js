import { idFormActualizadorEstados, idScannerEstados } from "./constantes.js";

const table = `
    <style>
    .table-cell-pd5 td {
        vertical-align: middle;
        padding: .5rem
    }
    </style>
    <div class="table-responsive mt-1">
        <table  
            class="table table-cell-pd5 table-bordered table-hover w-100"
            style="white-space: nowrap; width:100%"
        ></table>
    </div>
`;

const formActualizarEstado = `
    <form id="${idFormActualizadorEstados}">
        <div class="form-group">
            <label for="estado-${idScannerEstados}">Estado</label>
            <select class="form-control" id="estado-${idScannerEstados}" name="estado" required></select>
        </div>
        
        <div class="form-group">
            <label for="descripcion-${idScannerEstados}">Descripción estado</label>
            <select class="form-control" id="descripcion-${idScannerEstados}" name="descripcion" required></select>
            <input type="text" class="form-control mt-1" id="descripcion_extra-${idScannerEstados}" style="display:none" placeholder="Agregue la descripción personalizada">
        </div>
        
        <div class="form-group">
        <label for="observaciones-${idScannerEstados}">Observaciones</label>
        <textarea class="form-control" id="observaciones-${idScannerEstados}" name="observaciones"></textarea>
        </div>

        <div class="custom-file mt-2 mb-4">
            <input type="file" class="custom-file-input" id="evidencia-${idScannerEstados}" accept="image/*"
            name="evidencia" lang="es">
            <label class="custom-file-label" for="evidencia-${idScannerEstados}">Evidencia de entrega (opcional)</label>
        </div>

        <div class="custom-control custom-switch">
            <input type="checkbox" class="custom-control-input" id="switch_novedad-${idScannerEstados}" name="esNovedad">
            <label class="custom-control-label" for="switch_novedad-${idScannerEstados}">Es una novedad</label>
        </div>
    </form>
`;

const bodegasEl = $("#bodega-flexii_guia");
const oficinaDestinoEl = $("#ciudadD-flexii_guia");
const diceContenerEl = $("#dice_contener-flexii_guia");
const recoleccionEl = $("#recoleccion_esporadica-flexii_guia");
const containerQuoterResponse = $("#respuesta-flexii_guia");


export { table, bodegasEl, oficinaDestinoEl, diceContenerEl, recoleccionEl, containerQuoterResponse, formActualizarEstado }
