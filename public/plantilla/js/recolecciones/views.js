export const cardBodegaRecoleccion = (data) => {
  return `
        <li class="list-group-item"><span class="mr-2">
        <h5 class="card-title font-weight-bold text-info text-uppercase mb-2">${
          data.centro_de_costo
        }</h5>
            <p>Sucursal: ${data.codigo_sucursal}</p> 
            <p>ID Usuario: ${data.id_user}</p> 

            <p class="text-truncate"
            data-mostrar="texto">Id Guias Generadas: <br><small class="text-break">${data.guias.map(
              (guia) => `<span>${guia.numeroGuia}  </span>`
            )}</small> </p>
            <button class="btn btn-primary" data-action="solicitarRecoleccion" data-codigo_sucursal="${
              data.codigo_sucursal
            }">
                Solicitar Recolección
                <span class="badge badge-light badge-pill">${
                  data.guias.length
                }</span>
            </button>
        </li>
    `;
};

export const formRecoleccion = (data) => {
  return `
        <form>
            <div class="mb-3">
                <label for="fecha-recoleccion">Fecha Recolección</label>
                <input type="datetime-local" class="form-control" required id="fecha-recoleccion" name="fechaRecogida">
                <div class="invalid-feedback">Please provide a valid city.</div>
            </div>
            <div class="mb-3 d-none">
                <input type="number" class="form-control" required name="idSucursalCliente" value="${data.codigo_sucursal}">
            </div>
        </form>
    `;
};


export const recoleccionSolicitada = (data) => {
  return `
    <tr>
      <td>${data.numeroGuia}</td>
      <td>${data.centro_de_costo}</td>
      <td>${data.fecha_recoleccion}</td>
      <td>${data.codigo_sucursal}</td>
      <td>${data.radicado_recoleccion}</td>
    </tr>
  `;
};
