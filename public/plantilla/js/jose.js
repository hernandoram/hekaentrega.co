const boton_actualizar = $("#actualizar-guia-"+data.numeroGuia);


boton_actualizar.click(async (e) => {
    e.target.remove();
    const resp = await actualizarEstadoGuia(data.numeroGuia, id_user, true);

    revisarMovimientosGuias(true, null, null, data.numeroGuia);
    console.log(resp);
});
