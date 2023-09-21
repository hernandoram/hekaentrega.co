export function visualizarNotificacion(noti) {
    return `
    <div class="col-md-3 card my-3">
        <div class="card-body" id="visor-centro_notificaciones">
        <h3 class="card-title">
            ${noti.name} <i class="fa fa-trash text-danger deleter"></i>
        </h3>
        
        <p><b>Tipo: </b> ${noti.type}</p>
        </div>
    </div>
    `;
}