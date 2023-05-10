function gestionarNovedadModal(dataN, dataG) {
  // console.log(dataN.numeroGuia);
  // console.log(dataG)
  const ultimo_mov = dataN.movimientos[dataN.movimientos.length - 1];

  const noguia = dataN.numeroGuia;

  const tiempoguardado = new Date(localStorage.getItem("tiempoguia" + noguia));
  const tiempoguardadomilis = tiempoguardado.getTime();
  let tiempoactual = new Date();
  let tiempoactualmilis = tiempoactual.getTime();

  console.log("el tiempo guardado es " + tiempoguardado);
  console.log("el tiempo actual es " + tiempoactual);

  let diffCounter = 21600000 - (tiempoactualmilis - tiempoguardadomilis); //modificar el valor para cambiar el número de horas

  hours = Math.floor(diffCounter / (1000 * 60 * 60));
  mins = Math.floor(diffCounter / (1000 * 60));

  m = mins - hours * 60;

  let mostrador_gestionar;

  if (mins >= 1) {
    // indicar número de minutos a esperar!
    mostrador_gestionar = `
        <div class="card">
        <div class="card-header">
        <h5>Anuncio</h5>
    </div>
    <div class="card-body">
    Debes esperar <b> ${hours} </b> horas y <b> ${m} </b> minutos  para volver a gestionar la guía
    </div>
    </div>
    `;
  } else {
    mostrador_gestionar = `
        
        <h3>Escribe aquí tu solución a la novedad</h3>
        <textarea type="text" class="form-control" name="solucion-novedad" id="solucion-novedad-${dataN.numeroGuia}"></textarea>
        <button class="btn btn-success m-2" id="solucionar-novedad-${dataN.numeroGuia}">Enviar Solución</button>
    `;
  }

  if (dataG.oficina && !dataG.recibidoEnPunto) {
    mostrador_gestionar = `<p>Las guías que se dirigen hacia las oficinas flexii, no pueden ser gestionadas por este medio.</p>`;
  }

  //Acá estableceré la información general de la guía
  const ultimoMovConNovedad =
    revisarNovedad(ultimo_mov, dataN.transportadora) || dataN.enNovedad;
  let info_gen = document.createElement("div"),
    info_guia = `
            <div class="col-12 col-sm-6 col-md-4 col-lg mb-3">
            <div class="card">
            <div class="card-header">
                <h5>Datos de la guía</h5>
            </div>
            <div class="card-body">
                <p>Número de guía: <span>${dataN.numeroGuia}</span></p>
                <p>Fecha de envío: <span>${dataN.fechaEnvio}</span></p>
                <p>Estado: <span class="${
                  ultimoMovConNovedad ? "text-danger" : "text-primary"
                }">
                  ${ultimoMovConNovedad ? "En novedad" : dataN.estadoActual}
                </span></p>
                <p>Peso: <span>${dataG.detalles.peso_liquidar} Kg</span></p>
                <p>Dice contener: <span>${dataG.dice_contener}</p>
            </div>
            </div>
        </div>
        `,
    info_rem = `
            <div class="col-12 col-sm-6 col-md-4 col-lg mb-3">
                <div class="card">
                <div class="card-header">
                    <h5>Datos Remitente</h5>
                </div>
                <div class="card-body">
                    <p>Nombre: <span>${dataG.nombreR}</span></p>
                    ${
                      administracion
                        ? `<p>Centro de Costo: <span>${dataG.centro_de_costo}</span></p>`
                        : ""
                    }
                    <p>Direccion: <span>${dataG.direccionR}</span></p>
                    <p>Ciudad: <span>${dataG.ciudadR}</span></p>
                    <p>teléfono: <span>${dataG.celularR}</span></p>
                </div>
                </div>
            </div>
        `,
    info_dest = `
            <div class="col-12 col-sm-6 col-md-4 col-lg mb-3">
                <div class="card">
                <div class="card-header">
                    <h5>Datos del destinatario</h5>
                </div>
                <div class="card-body">
                    <p>Nombre: <span>${dataG.nombreD}</span></p>
                    <p>Direccion: <span>${dataG.direccionD}</span></p>
                    <p>Ciudad: <span>${dataG.ciudadD}</span></p>
                    <p>teléfonos: <span>
                        <a href="https://api.whatsapp.com/send?phone=57${dataG.telefonoD
                          .toString()
                          .replace(/\s/g, "")}" target="_blank">${
      dataG.telefonoD
    }</a>, 
                        <a href="https://api.whatsapp.com/send?phone=57${dataG.celularD
                          .toString()
                          .replace(/\s/g, "")}" target="_blank">${
      dataG.celularD
    }</a>
                    </span></p>
                </div>
                </div>
            </div>
        `,
    gestionar = `
            <div class="col mb-3">
            ${mostrador_gestionar}
            </div>
        `;

  info_gen.classList.add("row");
  info_gen.innerHTML = info_guia + info_rem + info_dest;

  //Acá etableceré la información de movimientos y gestiones anteriores de la guía
  let detalles = document.createElement("div"),
    mensajeGetionada = dataG.novedad_solucionada
      ? "<p class='text-success text-center'>Esta guía ya ha sido gestionada en base a la última solución enviada.</p>"
      : "",
    desplegadores = new DOMParser().parseFromString(
      `
        <div class="col-12">
        ${mensajeGetionada}
        <div class="btn-group mb-3 col-12" role="group">
            <button class="btn btn-primary" type="button" data-toggle="collapse" data-target="#historial-estados-gestionarNovedad" aria-expanded="false" aria-controls="historial-estados-gestionarNovedad">Historial Estados</button>
            <button class="btn btn-primary" type="button" data-toggle="collapse" data-target="#seguimiento-gestionarNovedad" aria-expanded="false" aria-controls="seguimiento-gestionarNovedad">Seguimiento</button>
        </div></div>
        `,
      "text/html"
    ).body.firstChild,
    historial_estado = new DOMParser().parseFromString(
      `
        <div class="collapse multi-collapse col-12 col-md mb-4" id="historial-estados-gestionarNovedad">
            <ul class="list-group border-left-primary"></ul>
        </div>
        `,
      "text/html"
    ).body.firstChild,
    seguimiento = new DOMParser().parseFromString(
      `
        <div class="collapse multi-collapse col-12 col-md" id="seguimiento-gestionarNovedad">
            <ul class="list-group border-left-primary"></ul>
        </div>
        `,
      "text/html"
    ).body.firstChild;

  const movTrad = traducirMovimientoGuia(dataN.transportadora);
  const guardarComoNovedad =
    dataG.transportadora === "SERVIENTREGA" && administracion;

  if (dataN.movimientos) {
    for (let i = dataN.movimientos.length - 1; i >= 0; i--) {
      let mov = dataN.movimientos[i];
      let li = document.createElement("li");
      let enNovedad = revisarNovedad(mov, dataN.transportadora);
      const btnGuardarComoNovedad =
        guardarComoNovedad && mov[movTrad.novedad]
          ? `<button class='btn btn-sm ml-2 btn-outline-danger registrar-novedad' data-novedad='${
              mov[movTrad.novedad]
            }'>Registrar novedad</button>`
          : "";

      li.innerHTML = `
                <span class="badge badge-primary badge-pill mr-2 d-flex align-self-start">${
                  i + 1
                }</span>
                <div class="d-flexd-flex flex-column w-100">
                <small class="d-flex justify-content-between">
                    <h6 class="text-danger">${
                      enNovedad
                        ? "<i class='fa fa-exclamation-triangle mr-2'></i>En novedad"
                        : ""
                    }</h6>
                    <h6>${mov[movTrad.fechaMov]}</h6>
                </small>
                <h4>${mov[movTrad.descripcionMov]}</h4>
                <p class="mb-1">
                    <b>${mov[movTrad.observacion]}</b>
                </p>
                <p class="mb-1"><i class="fa fa-map-marker-alt mr-2 text-primary"></i>${
                  mov[movTrad.ubicacion] || "No registra."
                }</p>
                <p>
                    <span class="text-danger">${mov[movTrad.novedad]}</span>
                    ${btnGuardarComoNovedad}
                </p>
                </div>
            `;
      li.setAttribute("class", "list-group-item d-flex");
      historial_estado.children[0].appendChild(li);
    }
  }

  if (dataG.seguimiento) {
    for (let i = dataG.seguimiento.length - 1; i >= 0; i--) {
      let seg = dataG.seguimiento[i];
      let li = document.createElement("li");

      li.innerHTML = `
            <span class="badge badge-primary badge-pill mr-2 d-flex align-self-start">${
              i + 1
            }</span>
            <div class="d-flexd-flex flex-column w-100">
            <small class="d-flex justify-content-between">
                <h6>${genFecha("LR", seg.fecha.toMillis())}</h6>
                <h6>${
                  seg.fecha
                    .toDate()
                    .toString()
                    .match(/\d\d:\d\d/)[0]
                }</h6>
            </small>
            <p>
                ${seg.gestion}
            </p>
            </div>
            `;
      li.setAttribute("class", "list-group-item d-flex");
      seguimiento.children[0].appendChild(li);
    }
  }

  detalles.classList.add("row");
  detalles.append(desplegadores, historial_estado, seguimiento);

  document.getElementById("contenedor-gestionarNovedad").innerHTML = "";
  document
    .getElementById("contenedor-gestionarNovedad")
    .append(info_gen, detalles);

  // Funciones para despues que cargue todo
  if (!administracion) {
    info_gen.innerHTML += gestionar;
    let p = document.createElement("p");
    p.classList.add("text-danger");
    let idSolucion = "#solucion-novedad-" + dataN.numeroGuia;
    let btn_solucionar = $("#solucionar-novedad-" + dataN.numeroGuia);
    btn_solucionar.parent().append(p);

    $(idSolucion).on("input", (e) => {
      if (e.target.value) {
        btn_solucionar.prop("disabled", false);
        btn_solucionar.text("Enviar Solución");
        p.innerHTML = "";
      }
    });

    btn_solucionar.click((e) => {
      e.target.disabled = true;
      e.target.innerHTML = "";
      e.target.innerHTML = `
                <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                Cargando...`;
      if (!$(idSolucion).val()) {
        p.innerText = "Error! No puedes enviar una solución vacía.";
        p.classList.replace("text-success", "text-danger");
      } else {
        console.log($(idSolucion));
        if (dataG.seguimiento) {
          dataG.seguimiento.push({
            gestion: $(idSolucion).val(),
            fecha: new Date(),
          });
        } else {
          dataG.seguimiento = [
            {
              gestion: $(idSolucion).val(),
              fecha: new Date(),
            },
          ];
        }

        // return;
        usuarioDoc
          .collection("guias")
          .doc(dataG.id_heka)
          .update({
            seguimiento: dataG.seguimiento,
            novedad_solucionada: false,
          })
          .then(() => {
            localStorage.setItem("tiempoguia" + noguia, new Date());
            p.innerText = "Sugerencia enviada exitósamente";
            p.classList.replace("text-danger", "text-success");

            btn_solucionar.remove();
            document
              .querySelector("#solucion-novedad-" + dataN.numeroGuia)
              .remove();

            let momento = new Date().getTime();
            let hora =
              new Date().getMinutes() < 10
                ? new Date().getHours() + ":0" + new Date().getMinutes()
                : new Date().getHours() + ":" + new Date().getMinutes();

            // firebase.firestore().collection("notificaciones").doc(dataG.id_heka).set({
            //     fecha: genFecha(),
            //     timeline: momento,
            //     mensaje: datos_usuario.nombre_completo + " (" + datos_usuario.centro_de_costo
            //     + ") Sugirió una solución para la guía "
            //     + dataN.numeroGuia + ": " + $(idSolucion).val(),
            //     hora: hora,
            //     guia: dataN.numeroGuia,
            //     id_heka: dataG.id_heka,
            //     type: "novedad",
            //     user_id: user_id,
            //     seguimiento: dataG.seguimiento,
            //     usuario: datos_usuario.centro_de_costo,
            //     visible_admin: true
            // })
            // btn_solucionar.text("Enviar Solución")
          })
          .catch((e) => {
            console.log(e);
          });
      }
    });
  } else {
    $(".registrar-novedad").click(registrarNovedad);
  }
}
