export function visualizarNotificacion(noti) {
    return `
    <div class="col-md-3 card m-3">
        <div class="card-body" id="visor-centro_notificaciones">
        <h3 class="card-title">
            ${noti.name} 
            <small id="${noti.id}">
                <i class="mx-1 fa fa-trash text-danger" title="Eliminar notificación" data-action="eliminarNotificacion"></i>
                <i class="mx-1 fa fa-eye text-primary" title="Vista previa" data-action="vistaPrevia"></i>
            </small>
        </h3>
        
        <p><b>Tipo: </b> ${noti.type}</p>
        <p><b>Mensaje: </b> ${noti.mensaje}</p>

        </div>
    </div>
    `;
}