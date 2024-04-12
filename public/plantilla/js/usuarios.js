let ingreso, seller;
class MensajeError {
  constructor(id) {
    this.id = id;
    this.booleans = new Array();
    this.message = "Valor inválido";
  }

  init(type = "input") {
    $(this.id).on(type, (e) => {
      this.value = e.target.value;

      const index = this.booleans.findIndex((bool) =>
        this.comprobateBoolean(bool)
      );
      const bool = index != -1;

      const boolTaken = this.booleans[index];
      const message = bool && boolTaken[3] ? boolTaken[3] : this.message;
      this.showHideErr(bool, message);
    });

    return this;
  }

  comprobateBoolean(arrBool) {
    const caso = this.viewCase(arrBool[0]);
    const operator = arrBool[1];
    const valor = arrBool[2];
    let bool = false;

    if (!this.value) return false;

    switch (operator) {
      case ">":
        bool = caso > valor;
        break;
      case "<":
        bool = caso < valor;
        break;
      case ">=":
        bool = caso >= valor;
        break;
      case "<=":
        bool = caso <= valor;
        break;
      case "==":
        bool = caso == valor;
        break;
      case "!=":
        bool = caso != valor;
        break;
      case "contains":
        bool = valor.split("|").some((v) => caso.includes(v));
        break;
    }

    return bool;
  }

  viewCase(caso) {
    let respuesta;
    switch (caso) {
      case "length":
        respuesta = this.value.length;
        break;
      case "number":
        respuesta = parseInt(this.value);
        break;
      default:
        respuesta = this.value;
    }
    return respuesta || this.value;
  }

  input(valores, mensaje) {
    $(this.id).on("input", (e) => {
      let mostrar = false;
      valores.forEach((v) => {
        if (e.target.value.indexOf(v) != -1) {
          mostrar = true;
        }
      });

      if (mostrar) {
        if ($(this.id).parent().children(".mensaje-error").length) {
          $(this.id).parent().children(".mensaje-error").text(mensaje);
        } else {
          $(this.id)
            .parent()
            .append(
              '<p class="mensaje-error text-danger mt-2 text-center">' +
              mensaje +
              "</p>"
            );
        }
        $("#registrar-nueva-cuenta").prop("disabled", true);
      } else {
        if ($(this.id).parent().children(".mensaje-error")) {
          $(this.id).parent().children(".mensaje-error").remove();
        }
      }
    });
  }

  set setDefaultMessage(message) {
    this.message = message;
  }

  set insertBoolean(booleans) {
    this.booleans.push(booleans);
  }

  showHideErr(hasErr, message) {
    if (hasErr) {
      if ($(this.id).parent().children(".mensaje-error").length) {
        $(this.id).parent().children(".mensaje-error").text(message);
      } else {
        $(this.id)
          .parent()
          .append(
            '<p class="mensaje-error text-danger mt-2 text-center">' +
            message +
            "</p>"
          );
      }
      $("#registrar-nueva-cuenta").prop("disabled", true);
    } else {
      if ($(this.id).parent().children(".mensaje-error")) {
        $(this.id).parent().children(".mensaje-error").remove();
      }
    }
  }
}

if (administracion) {
  ingreso = "CPNnumero_documento";
  seller = "CPNcentro_costo";
  let documentoNvoUser = new MensajeError("#CPNnumero_documento");
  documentoNvoUser.input(
    ["/", " ", "."],
    'Recuerde que los espacios y los carácteres "/", serán ignorados'
  );
} else {
  ingreso = "CPNcontraseña";
  seller = "CPNnombre_empresa";
}
// Verificar que el docuento de identificacion es unico
document.getElementById(ingreso).addEventListener("blur", () => {
  verificarExistencia(administracion);
});

// Verificar que el centro de costo es unico
document.getElementById(seller).addEventListener("blur", () => {
  verificarExistencia(administracion);
});

function pruebacheck() {
  var id_banco = document.getElementById("mostrar-ocultar-registro-bancario");
  var chekBanco = document.getElementById("checkbox-banco");

  if (chekBanco.checked) {
    id_banco.style.display = "block";
  } else {
    id_banco.style.display = "none";
  }
}

// Luego de la implementación del nuevo registro esta quedará OBSOLETA
// NO FUNCIONAL
function nuevaCuenta() {
  //datos de registro
  let datos_personales = {
    nombres: value("CPNnombres").trim(),
    apellidos: value("CPNapellidos").trim(),
    tipo_documento: value("CPNtipo_documento"),
    numero_documento: value("CPNnumero_documento").trim(),

    celular: value("CPNtelefono"),

    celular2: value("CPNcelular"),
    ciudad: value("CPNciudad"),
    direccion: value("CPNdireccion"),
    barrio: value("CPNbarrio"),

    nombre: value("CPNnombre_empresa").trim(),
    correo: value("CPNcorreo"),
    con: value("CPNcontraseña").replace(/\/|\s/g, ""),
    objetos_envio: value("CPNobjetos_envio")
      .split(",")
      .map((s) => s.trim()),
  };

  let datos_relevantes = {
    nombres: value("CPNnombres").trim(),
    apellidos: value("CPNapellidos").trim(),
    contacto: value("CPNtelefono"),
    direccion: `${value("CPNdireccion")}, ${value("CPNbarrio")}, ${value(
      "CPNciudad"
    )}`,
    objetos_envio: value("CPNobjetos_envio")
      .split(",")
      .map((s) => s.trim()),
    fecha_creacion: new Date(),
  };

  if (administracion) {
    datos_personales.centro_de_costo = value("CPNcentro_costo")
      .trim()
      .replace(/[^A-Za-z1-9\-]/g, "");

    datos_relevantes.ingreso = value("CPNnumero_documento").replace(
      /\/|\s/g,
      ""
    );
    datos_relevantes.centro_de_costo = value("CPNcentro_costo")
      .trim()
      .replace(/[^A-Za-z1-9\-]/g, "");
    datos_personales.usuario_corporativo = document.getElementById(
      "CPNusuario_corporativo"
    ).checked;
    datos_relevantes.usuario_corporativo = datos_personales.usuario_corporativo;
  } else {
    datos_personales.centro_de_costo =
      "Seller" +
      value("CPNnombre_empresa")
        .trim()
        .replace(/[^A-Za-z1-9\-]/g, "");

    datos_relevantes.ingreso = value("CPNcontraseña").replace(/\/|\s/g, "");
    datos_relevantes.centro_de_costo =
      "Seller" +
      value("CPNnombre_empresa")
        .trim()
        .replace(/[^A-Za-z1-9\-]/g, "");
  }

  let datos_bancarios = {
    banco: value("CPNbanco"),
    nombre_banco: value("CPNnombre_representante"),
    tipo_de_cuenta: value("CPNtipo_de_cuenta"),
    numero_cuenta: value("CPNnumero_cuenta"),
    tipo_documento_banco: value("CPNtipo_documento_banco"),
    numero_iden_banco: value("CPNnumero_identificacion_banco"),
  };

  ///div datos bancarios
  var mostrar_ocultar_registro_bancario = document.getElementById(
    "mostrar-ocultar-registro-bancario"
  ).style.display;
  //datos bancarios
  console.log(datos_relevantes.centro_de_costo);
  //retornar si check está activado o desactivado
  var checkTermCond = document.getElementById(
    "CPNcheck_terminos_condiciones"
  ).checked;
  verificarExistencia(administracion).then(() => {
    if (
      (value("CPNnombres") == "") |
      (value("CPNapellidos") == "") |
      (value("CPNnumero_documento") == "") |
      (value("CPNtelefono") == "") |
      (value("CPNcelular") == "") |
      (value("CPNciudad") == "") |
      (value("CPNdireccion") == "") |
      (value("CPNbarrio") == "") |
      (value("CPNnombre_empresa") == "") |
      (value("CPNcorreo") == "") |
      (value("CPNcontraseña") == "") |
      (value("CPNrepetir_contraseña") == "") |
      !value("CPNobjetos_envio") |
      (datos_relevantes.centro_de_costo == "")
    ) {
      //si todos los datos estan vacios
      let id_centro_costo = administracion
        ? "CPNcentro_costo"
        : "CPNobjetos_envio";
      Toast.fire({
        icon: "error",
        text: "Error: Ningún campo debe estar vacío.",
      });
      inHTML(
        "error_crear_cuenta",
        '<h6 class="text-danger">Error: Ningún campo debe estar vacío</h6>'
      );
      verificador(
        [
          "CPNnombres",
          "CPNapellidos",
          "CPNnumero_documento",
          "CPNtelefono",
          "CPNcelular",
          "CPNciudad",
          "CPNdireccion",
          "CPNbarrio",
          "CPNnombre_empresa",
          "CPNcorreo",
          "CPNcontraseña",
          "CPNrepetir_contraseña",
          "CPNobjetos_envio",
          id_centro_costo,
        ],
        false,
        "Este campo no debería estar vacío."
      );
    } else {
      //si todos los datos estan llenos
      let puede_continuar = true;
      if (document.getElementById("registrar-nueva-cuenta").disabled == true) {
        inHTML(
          "error_crear_cuenta",
          '<h6 class="text-danger">Error en registro: el usuario ya existe, o la contraseña es muy débil</h6>'
        );
      } else if (value("CPNcontraseña") != value("CPNrepetir_contraseña")) {
        verificador(["CPNcontraseña", "CPNrepetir_contraseña"], "no-scroll");
        inHTML(
          "error_crear_cuenta",
          `<h6 class="text-danger">Error: Las contraseñas no coinciden</h6>`
        );
      } else if (!checkTermCond) {
        inHTML(
          "error_crear_cuenta",
          `<h6 class="text-danger">Error: Debes aceptar los términos y condiciones para poder seguir</h6>`
        );
      } else if (value("CPNnombre_empresa").length > 25) {
        inHTML(
          "error_crear_cuenta",
          `<h6 class="text-danger">Error: La longitud para el nombre de la empresa no debe exceder los 25 caracteres.</h6>`
        );
      } else {
        if (mostrar_ocultar_registro_bancario == "block") {
          if (
            (value("CPNbanco") == "") |
            (value("CPNnombre_representante") == "") |
            (value("CPNtipo_de_cuenta") == "") |
            (value("CPNnumero_cuenta") == "") |
            (value("CPNconfirmar_numero_cuenta") == "") |
            (value("CPNtipo_documento_banco") == "") |
            (value("CPNnumero_identificacion_banco") == "") |
            (value("CPNconfirmar_numero_identificacion_banco") == "")
          ) {
            puede_continuar = false;
            inHTML(
              "error_crear_cuenta",
              `<h6 class="text-danger">Error: Ningún dato bancario puede estar vacio</h6>`
            );
            verificador(
              [
                "CPNbanco",
                "CPNnombre_representante",
                "CPNtipo_de_cuenta",
                "CPNnumero_cuenta",
                "CPNconfirmar_numero_cuenta",
                "CPNtipo_documento_banco",
                "CPNnumero_identificacion_banco",
                "CPNconfirmar_numero_identificacion_banco",
              ],
              false,
              "Este campo no debe estar vacío."
            );
          } else if (
            value("CPNnumero_cuenta") != value("CPNconfirmar_numero_cuenta")
          ) {
            puede_continuar = false;
            inHTML(
              "error_crear_cuenta",
              `<h6 class="text-danger">Error: Los números de cuenta no coinciden</h6>`
            );
            verificador(
              ["CPNnumero_cuenta", "CPNconfirmar_numero_cuenta"],
              "no-scroll"
            );
          } else if (
            value("CPNnumero_identificacion_banco") !=
            value("CPNconfirmar_numero_identificacion_banco")
          ) {
            puede_continuar = false;
            inHTML(
              "error_crear_cuenta",
              `<h6 class="text-danger">Error: Los número de indentificación en los datos bancarios no coinciden</h6>`
            );
            verificador(
              [
                "CPNnumero_identificacion_banco",
                "CPNconfirmar_numero_identificacion_banco",
              ],
              "no-scroll"
            );
          }
        }

        if (puede_continuar) {
          let boton_crear_usuario = document.getElementById(
            "registrar-nueva-cuenta"
          );
          boton_crear_usuario.setAttribute("onclick", "");
          boton_crear_usuario.disabled = true;
          boton_crear_usuario.textContent = "Cargando...";

          inHTML(
            "error_crear_cuenta",
            `<h6 class="text-danger"> DATOS BANCARIOS: "${value(
              "CPNbanco"
            )}" | "${value("CPNnombre_representante")}" | "${value(
              "CPNtipo_de_cuenta"
            )}" | "${value("CPNnumero_cuenta")}" | "${value(
              "CPNconfirmar_numero_cuenta"
            )}" | 
                    "${value("CPNtipo_documento_banco")}" | "${value(
              "CPNnumero_identificacion_banco"
            )}" | "${value("CPNconfirmar_numero_identificacion_banco")}</"h6>`
          );

          let user = value("CPNnumero_documento").toString().trim();

          firebase
            .firestore()
            .collection("usuarios")
            .doc(user)
            .get()
            .then((doc) => {
              console.log(datos_bancarios);
              console.log(datos_personales);
              console.log(datos_relevantes);
              if (!doc.exists) {
                firebase
                  .firestore()
                  .collection("usuarios")
                  .doc(user)
                  .collection("informacion")
                  .doc("personal")
                  .set(datos_personales)
                  .then(() => {
                    firebase
                      .firestore()
                      .collection("usuarios")
                      .doc(user)
                      .set(datos_relevantes)
                      .catch((err) => {
                        inHTML(
                          "error_crear_cuenta",
                          `<h6 class="text-danger">${err} \n
                                        No se pudo crear el identificador de ingreso</h6>`
                        );
                      });
                  })
                  .then(() => {
                    firebase
                      .firestore()
                      .collection("usuarios")
                      .doc(user)
                      .collection("informacion")
                      .doc("bancaria")
                      .set(datos_bancarios)
                      .catch(function (error) {
                        inHTML(
                          "error_crear_cuenta",
                          `<h6 class="text-danger">Problemas al agregar Datos bancarios</h6>`
                        );
                      });
                  })
                  .then(() => {
                    if (datos_relevantes.usuario_corporativo) {
                      firebase
                        .firestore()
                        .collection("usuarios")
                        .doc(user)
                        .collection("informacion")
                        .doc("heka")
                        .set({
                          activar_saldo: true,
                          fecha: genFecha(),
                          saldo: 0,
                        });
                    }
                  })
                  .then(function () {
                    if (administracion) {
                      avisar(
                        "¡Cuenta creada con éxito!",
                        "User_id = " +
                        user +
                        "\n Puede ingresar con: " +
                        value("CPNnumero_documento"),
                        "",
                        "admin.html"
                      );
                    } else {
                      firebase
                        .firestore()
                        .collection("usuarios")
                        .where(
                          "ingreso",
                          "==",
                          datos_relevantes.ingreso.toString()
                        )
                        .get()
                        .then((querySnapshot) => {
                          localStorage.setItem("user_id", "");
                          querySnapshot.forEach((doc) => {
                            localStorage.setItem("user_id", doc.id);
                            localStorage.setItem(
                              "user_login",
                              doc.data().ingreso
                            );
                            console.log(localStorage);

                            location.href = "plataforma2.html";
                          });
                        })
                        .then((d) => {
                          if (localStorage.user_id == "") {
                            alert("Usuario no encontrado");
                          }
                        })
                        .catch((error) => {
                          console.log("Error getting documents: ", error);
                        });
                    }
                  })
                  .catch(function (error) {
                    boton_crear_usuario.setAttribute(
                      "onclick",
                      "nuevaCuenta()"
                    );
                    boton_crear_usuario.disabled = false;
                    boton_crear_usuario.textContent = "Registrar Cuenta";
                    inHTML(
                      "error_crear_cuenta",
                      `<h6 class="text-danger">${error}</h6>`
                    );
                  });
              } else {
                inHTML(
                  "error_crear_cuenta",
                  `<h6 class="text-danger">No podemos procesar tu solicitud, ya existe un usuario con ese documento de identificación</h6>`
                );
                verificador("CPNnumero_documento", "no-scroll");
                boton_crear_usuario.addEventListener("click", () => {
                  nuevaCuenta(administracion);
                });
                boton_crear_usuario.disabled = false;
                boton_crear_usuario.textContent = "Crear Cuenta";
              }
            });
        }
      }
    }
  });
}

const inpNombreEmpresa = new MensajeError("#CPNnombre_empresa").init("keydown");
inpNombreEmpresa.insertBoolean = [
  "length",
  ">=",
  25,
  "Has llegado al límite de carácteres.",
];

let CpnKey = new MensajeError("#CPNcontraseña");
CpnKey.input(
  ["/", " "],
  'La contraseña no debe tener espacios ni los carácteres "/", si continúa, los carácteres mencionados serán ignorados'
);

//Verifica que el usuario a crear no exista ni el centro de costo que se le quiere asignar
async function verificarExistencia(administracion) {
  await firebase
    .firestore()
    .collection("usuarios")
    .get()
    .then((querySnapshot) => {
      let existe_usuario = false,
        existe_centro_costo = false;
      let identificador = administracion
        ? value("CPNnumero_documento")
        : value("CPNcontraseña");
      let centro_de_costo = administracion
        ? value("CPNcentro_costo")
        : "Seller" + value("CPNnombre_empresa");
      querySnapshot.forEach((doc) => {
        let sellerFb = doc.data().centro_de_costo;
        if (doc.data().ingreso == identificador.replace(/\s/g, "")) {
          document.getElementById("registrar-nueva-cuenta").disabled = true;
          existe_usuario = true;
        }

        if (
          sellerFb &&
          sellerFb.toString().toLowerCase() ==
          centro_de_costo.toLowerCase().replace(/[^A-Za-z1-9\-]/g, "")
        ) {
          document.getElementById("registrar-nueva-cuenta").disabled = true;
          existe_centro_costo = true;
        }
      });
      if (existe_usuario) {
        document.getElementById("usuario-existente").classList.remove("d-none");
      } else {
        document.getElementById("usuario-existente").classList.add("d-none");
      }
      if (existe_centro_costo) {
        document
          .getElementById("centro_costo-existente")
          .classList.remove("d-none");
      } else {
        document
          .getElementById("centro_costo-existente")
          .classList.add("d-none");
      }
      if (!existe_usuario && !existe_centro_costo) {
        document.getElementById("registrar-nueva-cuenta").disabled = false;
      }
    });
}

let idOficina = "";

function mostrarOficina(id) {
  const mostrador = document.getElementById("mostrador-oficinas");
  const botonInforme = document.getElementById("descargar-informe-oficinas");
  const busquedaOficina = document.getElementById("busqueda-oficinas");
  const oficina = document.getElementById("oficina-seleccionada");

  const nombreOficina = document.querySelector("#nombre-oficina");
  const nombresOficina = document.querySelector("#nombres-oficina");
  const apellidosOficina = document.querySelector("#apellidos-oficina");
  const noIdentificacionOficina = document.querySelector(
    "#no-documento-oficina"
  );
  const numero1 = document.querySelector("#numero1");
  const numero2 = document.querySelector("#numero2");
  const correoOficina = document.querySelector("#correo-oficina");
  const nombreEmpresa = document.querySelector("#nombre-empresa-oficina");
  const ciudad = document.querySelector("#ciudad-oficina");
  const direccion = document.querySelector("#dirección-oficina");
  const barrio = document.querySelector("#barrio-oficina");
  const con = document.querySelector("#con-oficina");

  const visible = document.querySelector("#visible-oficina");

  const checkbox1 = document.getElementById("tipo-distribucion-direccion");
  const checkbox2 = document.getElementById("tipo-distribucion-oficina");

  const porcentaje = document.querySelector("#porcentaje-comision-oficina");
  const comisionMinima = document.querySelector("#comision-minima");

  //console.log(id);
  firebase
    .firestore()
    .collection("oficinas")
    .doc(id)
    .get()
    .then((doc) => {
      if (doc.exists) {
        const data = doc.data();
        //console.log(data)
        mostrador.classList.add("d-none");

        busquedaOficina.classList.add("d-none");
        botonInforme.classList.add("d-none");

        oficina.classList.remove("d-none");
        nombreOficina.innerHTML =
          data.nombres.split(" ")[0] + " " + data.apellidos.split(" ")[0];
        nombresOficina.value = data.nombres;
        apellidosOficina.value = data.apellidos;
        noIdentificacionOficina.value = data.numero_documento;
        numero1.value = data.celular;
        numero2.value = data.celular2;
        correoOficina.value = data.correo;
        nombreEmpresa.value = data.nombre_empresa;
        ciudad.value = data.ciudad;
        direccion.value = data.direccion;
        barrio.value = data.barrio;
        con.value = data.con;

        console.log(data.visible);
        data.visible === true
          ? (visible.value = true)
          : (visible.value = false);

        data.configuracion
          ? (porcentaje.value = data.configuracion.porcentaje_comsion)
          : (porcentaje.value = 3.9);
        data.configuracion
          ? (comisionMinima.value = data.configuracion.comision_minima)
          : (comisionMinima.value = 3900);
        data.configuracion && data.configuracion.tipo_distribucion[0] == 1
          ? (checkbox1.checked = true)
          : (checkbox1.checked = false);
        data.configuracion && data.configuracion.tipo_distribucion[1] == 1
          ? (checkbox2.checked = true)
          : (checkbox2.checked = false);

        console.log(data.configuracion);
        idOficina = id;

        //aquí hay que hacer la vuelta de los datos
      } else {
        // Es importante limpiar los check de las transportadoras antes de seleccionar un usuario
        //Hasta que todos los usuario futuramente tengan el doc "heka"
        // $("#habilitar_servientrega").prop("checked", true);
        console.log("No such document!");
      }
    })
    .catch((error) => {
      console.log("Error getting document:", error);
    });
}

const botonBusquedaGeneral = document.getElementById("busquedaGeneral");
const botonBusquedaEspecializada = document.getElementById(
  "busquedaEspecializada"
);

botonBusquedaGeneral.onclick = function (e) {
  // Aquí va el código que quieres que se ejecute cuando se haga clic en el botón de búsqueda general
  console.log("Botón de búsqueda general clickeado");

  buscarUsuarios(e, true);
};

botonBusquedaEspecializada.onclick = function (e) {
  // Aquí va el código que quieres que se ejecute cuando se haga clic en el botón de búsqueda especializada
  console.log("Botón de búsqueda especializada clickeado");
  buscarUsuarios(e, false);
};

//esta funcion utilizara a otra para retornarme informacion basica del usuario
async function buscarUsuarios(e, esGeneral) {
  console.log("buscando usuarios");

  e.preventDefault();

  const mostrador = document.getElementById("mostrador-usuarios");
  mostrador.innerHTML = "";
  document.getElementById("cargador-usuarios").classList.remove("d-none");

  let nombreInpOriginal = value("buscador_usuarios-nombre").trim();
  if (esGeneral) {
    nombreInpOriginal = nombreInpOriginal.toLowerCase();
  }

  const nombreInp = value("buscador_usuarios-nombre").toLowerCase().trim();

  const reference = firebase.firestore().collection("usuarios");

  const casesToSearch = [
    "centro_de_costo",
    "numero_documento",
    "celular",
    "celular2",
    "correo",
    "direccion_completa",
  ];
  let especifico;

  for await (let caso of casesToSearch) {
    especifico =
      nombreInpOriginal &&
      (await reference
        .where(caso, "==", nombreInpOriginal)
        .get()
        .then((querySnapshot) => {
          let bool;
          if (!querySnapshot.size) return false;
          querySnapshot.forEach((doc) => {
            if (doc.exists) {
              seleccionarUsuario(doc.id);

              document
                .getElementById("cargador-usuarios")
                .classList.add("d-none");

              bool = true;
            }
          });
          return bool;
        }));

    if (especifico) break;
  }

  if (especifico) return;
  const mostradorUsuarios = document.getElementById("mostrador-usuarios");

  reference
    .get()
    .then((querySnapshot) => {
      inHTML("mostrador-usuarios", "");
      const size = querySnapshot.size;
      querySnapshot.forEach((doc) => {
        //Luego de la consulta se realizan tres filtros

        const nombre = doc.data().nombres.trim().toLowerCase();
        const apellido = doc.data().apellidos.trim().toLowerCase();
        const nombre_completo = nombre + " " + apellido;
        const nombre_apellido =
          nombre.split(" ")[0] + " " + apellido.split(" ")[0];
        const centro_de_costo = doc.data().centro_de_costo || "SCC";
        const direcciones = doc.data().bodegas || [];

        const toDom = (str) =>
          new DOMParser().parseFromString(str, "text/html").body.firstChild;

        //Primer filtro para buscar por nombre de usuario
        if (nombreInp) {
          if (
            centro_de_costo.toLowerCase().includes(nombreInp) ||
            nombre.includes(nombreInp) ||
            apellido.includes(nombreInp) ||
            nombre_completo.includes(nombreInp) ||
            nombre_apellido.includes(nombreInp)
          ) {
            mostradorUsuarios.appendChild(
              toDom(mostrarUsuarios(doc.data(), doc.id))
            );
          }
        }

        if (nombreInp) {
          if (
            direcciones.some((dir) =>
              dir.direccion_completa.includes(nombreInp)
            ) ||
            direcciones.some(
              (dir) => dir.codigo_sucursal_inter == nombreInp.trim()
            )
          ) {
            mostradorUsuarios.appendChild(
              toDom(mostrarUsuarios(doc.data(), doc.id))
            );
          }
        }

        if (!nombreInp) {
          mostradorUsuarios.appendChild(
            toDom(mostrarUsuarios(doc.data(), doc.id))
          );
        }
      });

      if (mostradorUsuarios.children.length === 1) {
        const uniqueChild = mostradorUsuarios.children[0].children[0];
        seleccionarUsuario(uniqueChild.getAttribute("id"));
      }
    })
    .then(() => {
      if (document.getElementById("mostrador-usuarios").innerHTML == "") {
        inHTML(
          "mostrador-usuarios",
          "<div class='w-100 text-center'><h5 class='m-3'>No hubo un resultado para tu busqueda, prueba con otro criterio!</h5></div>"
        );
      } else {
        let botones_ver = document.querySelectorAll(
          '[data-funcion="ver-eliminar"]'
        );
        let botones_movimientos = document.querySelectorAll(
          '[data-funcion="movimientos"]'
        );
        let boton_filtrador_movs = document.getElementById(
          "filtrador-movimientos"
        );
        const activador_automaticas = document.querySelectorAll(
          ".activador_automaticas"
        );
        for (let boton of botones_ver) {
          boton.addEventListener("click", (e) => {
            let identificador =
              e.target.parentNode.getAttribute("data-buscador");
            seleccionarUsuario(identificador);
          });
        }

        for (let boton of botones_movimientos) {
          boton.addEventListener("click", (e) => {
            let identificador =
              e.target.parentNode.getAttribute("data-buscador");
            let fechaI = genFecha().split("-");
            fechaI[1] -= 1;
            fechaI = new Date(fechaI.join("-") + "::").getTime();
            let fechaF = new Date(genFecha() + "::").getTime();
            console.log(fechaI, fechaF);
            verMovimientos(identificador, fechaI, fechaF + 8.64e7);
            boton_filtrador_movs.setAttribute("data-usuario", identificador);
            document.getElementById("nombre-usuario-movs").textContent =
              e.target.parentNode.getAttribute("data-nombre");
            location.href = "#movimientos";
          });
        }
        boton_filtrador_movs.addEventListener("click", (e) => {
          let identificador = e.target.getAttribute("data-usuario");
          fechaI = new Date(
            document.getElementById("movs-fecha-inicio").value + "::"
          ).getTime();
          fechaF = new Date(
            document.getElementById("movs-fecha-final").value + "::"
          ).getTime();
          verMovimientos(identificador, fechaI, fechaF + 8.64e7);
        });

        activador_automaticas.forEach(activadorGuiasAutomaticasDesdeAdmin);
      }
      document.getElementById("cargador-usuarios").classList.add("d-none");
    });
}

function activadorGuiasAutomaticasDesdeAdmin(el) {
  const id = el.getAttribute("data-id");

  el.addEventListener("click", () => {
    console.log("actualizando para => ", id, el.checked);
    db.collection("usuarios")
      .doc(id)
      .update({
        generacion_automatizada: el.checked,
      })
      .then(
        Toast.fire({
          icon: "success",
          text: "Usuario actualizado",
        })
      );
  });
}

//Funcion que filtrará a los usuarios luego de realizar que el dom esté lleno
function filtrarBusquedaUsuarios(e) {
  let input = e.target.value.toLowerCase();
  let children = $("#mostrador-usuarios").children();
  children.each((i, child) => {
    const data = Object.values(child.dataset);
    let filt = data.some((value) => value.toLowerCase().includes(input));

    filt ? $(child).removeClass("d-none") : $(child).addClass("d-none");
  });
}

$("#buscador_usuarios-nombre, #buscador_usuarios-direccion").keyup((e) => {
  if (e.keyCode === 13) buscarUsuarios();
  filtrarBusquedaUsuarios(e);
});

// esta funcion me busca el usuario seleccionado con informacion un poco mas detallada
function seleccionarUsuario(id) {
  let contenedor = document.getElementById("usuario-seleccionado");
  let mostrador = document.getElementById("mostrador-usuarios");
  contenedor.setAttribute("data-id", id);
  mostrador.classList.add("d-none");

  firebase
    .firestore()
    .collection("usuarios")
    .doc(id)
    .get()
    .then((doc) => {
      console.log(doc.exists)
      if (doc.exists === true) {
        contenedor.classList.remove("d-none");
        const data = doc.data();
        const datos_bancarios = data.datos_bancarios;
        const datos_personalizados = data.datos_personalizados;
        const bodegas = data.bodegas;

        console.log(acciones);

        console.log(doc.data());
        // if (doc.data().ingreso === doc.data().con) {
        //   document.getElementById("actualizar_correo").readOnly = false;
        // } else {
        //   document.getElementById("actualizar_correo").readOnly = true;
        // }

        mostrarDatosPersonales(doc.data(), "personal");

        mostrarDatosPersonales(datos_bancarios, "bancaria");
        mostrarDatosPersonales(datos_personalizados, "heka");

        mostrarReferidosUsuarioAdm(data.centro_de_costo);
        mostrarBodegasUsuarioAdm(bodegas);
      } else {
        // Es importante limpiar los check de las transportadoras antes de seleccionar un usuario
        //Hasta que todos los usuario futuramente tengan el doc "heka"
        // $("#habilitar_servientrega").prop("checked", true);
        avisar(
          "Usuario no encontrado",
          "El seller con el ID " + id + " no existe en la base de datos",
          "alerta"
        );
        contenedor.classList.add("d-none");
        console.log("No such document!");
      }
    })
    .catch((error) => {
      console.log("Error getting document:", error);
    });

  const ref2 = firebase
    .firestore()
    .collection("usuarios")
    .doc(id)
    .collection("acciones")
    .orderBy("Fecha", "desc")
    .limit(30)
    .get();

  let acciones = [];

  ref2
    .then((querySnapshot) => {
      querySnapshot.forEach((doc) => {
        acciones.push(doc.data());
      });
    })
    .then(() => {
      acciones.forEach((accion) => {
        // Convertir el Timestamp a un objeto Date
        const fecha = new Date(accion.Fecha.seconds * 1000);
        accion.timeline = fecha.getTime(); // Para que la tabla me muestre por orden de fecha

        // Formatear la fecha
        const opciones = {
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        };
        const fechaFormateada = fecha.toLocaleString("es-CO", opciones);

        const valorPagoFormateado = accion["Valor del pago"].toLocaleString(
          "es-CO",
          { style: "currency", currency: "COP" }
        );

        accion["Valor del pago"] = valorPagoFormateado;

        // Reemplazar la fecha en la acción
        accion.Fecha = fechaFormateada;
      });

      console.log(acciones);
      const table = $("#tabla-acciones").DataTable({
        destroy: true,
        data: acciones,
        order: [[1]],
        columns: [
          {
            data: "timeline",
            title: "Orden",
            defaultContent: "",
            visible: false
          },
          {
            data: "Estado",
            title: "Estado",
            defaultContent: "",
          },
          {
            data: "Fecha",
            title: "Fecha",
            defaultContent: "",
          },
          {
            data: "Valor del pago",
            title: "Valor del pago",
            defaultContent: "",
          }
        ],
        language: {
          url: "https://cdn.datatables.net/plug-ins/1.10.24/i18n/Spanish.json",
        },
        scrollX: true,
        scrollCollapse: true,
        lengthMenu: [
          [5, 10, 25, 30],
          [5, 10, 25, 30],
        ],
      });

      if (!acciones || !acciones.length) table.clear();
    });
}

// esta funcion solo llena los datos solicitados en los inputs
function mostrarDatosPersonales(data, info) {
  limpiarFormulario("#informacion-" + info, "input,select");
  console.log(data);

  if (!data) return;

  $("#aumentar_saldo").val("");
  asignarValores(data, "#usuario-seleccionado");
  let mostrador_saldo = document.getElementById("actualizar_saldo");
  mostrador_saldo.textContent = "$" + convertirMiles(0);
  mostrador_saldo.setAttribute("data-saldo", 0);
  mostrador_saldo.setAttribute("data-saldo_anterior", 0);

  if (info == "personal") {
    // Datos personales
    inHTML(
      "nombre-usuario",
      data.nombres.split(" ")[0] + " " + data.apellidos.split(" ")[0]
    );
  } else if (info == "heka") {
    $("#aumentar_saldo").val("");
    $("#informacion-heka")
      .find("[type=checkbox]")
      .each((i, el) => {
        const id = $(el).attr("id");
        $(el).prop("checked", data[id]);
      });
    mostrador_saldo.textContent = "$" + convertirMiles(data.saldo || 0);
    mostrador_saldo.setAttribute("data-saldo", data.saldo || 0);
    mostrador_saldo.setAttribute("data-saldo_anterior", data.saldo || 0);
    document.getElementById("actv_credit").checked = data.actv_credit;
  }

  $("#aumentar_saldo").keyup((e) => {
    let saldo_nuevo = parseInt(data.saldo || 0) + parseInt(e.target.value);
    if (e.target.value && typeof saldo_nuevo == "number") {
      $("#actualizar_saldo")
        .attr("data-saldo", saldo_nuevo)
        .text("$" + convertirMiles(saldo_nuevo))
        .addClass("text-success");
    } else {
      $("#actualizar_saldo")
        .attr("data-saldo", data.saldo || 0)
        .text("$" + convertirMiles(data.saldo || 0))
        .removeClass("text-success");
    }
  });

  activarDesactivarCredito(data.actv_credit);
  $("#actv_credit").change((e) => {
    activarDesactivarCredito(e.target.checked);
  });

  function activarDesactivarCredito(boolean) {
    if (boolean) {
      $("#mostrador-credito").removeClass("d-none");
      $("#mostrador-credito")
        .children("p")
        .first()
        .text((i, t) => {
          return t.replace("[limite]", convertirMiles(value("limit_credit")));
        });
      $("#actv_credit").prop("checked");
    } else {
      $("#mostrador-credito").addClass("d-none");
      $("#actv_credit").prop("checked", false);
    }
  }
}

function mostrarReferidosUsuarioAdm(centro_costo) {
  console.log(centro_costo);
  const referidos = [];

  firebase
    .firestore()
    .collection("referidos")
    .where("sellerReferente", "==", centro_costo)
    .get()
    .then((querySnapshot) => {
      querySnapshot.forEach((doc) => {
        referidos.push(doc.data());
        console.log(referidos);
      });
    })
    .finally(() => {
      const table = $("#tabla-referidos").DataTable({
        destroy: true,
        data: referidos,
        columns: [
          {
            data: "sellerReferido",
            title: "Seller Referido",
            defaultContent: "",
          },
          {
            data: "nombreApellido",
            title: "Nombre Referido",
            defaultContent: "",
          },
          { data: "celularReferido", title: "Celular", defaultContent: "" },
          {
            data: "cantidadEnvios",
            title: "Cantidad Envios",
            defaultContent: "",
          },
        ],
        language: {
          url: "https://cdn.datatables.net/plug-ins/1.10.24/i18n/Spanish.json",
        },
        scrollX: true,
        scrollCollapse: true,
        lengthMenu: [
          [5, 10, 25, 30],
          [5, 10, 25, 30],
        ],
      });

      if (!referidos || !referidos.length) table.clear();
    });
}

function mostrarBodegasUsuarioAdm(bodegas) {
  const table = $("#tabla-bodegas").DataTable({
    destroy: true,
    data: bodegas,
    columns: [
      { data: "id", title: "Nº", defaultContent: "" },
      { data: "nombre", title: "Nombre", defaultContent: "" },
      { data: "ciudad", title: "Ciudad", defaultContent: "" },
      { data: "barrio", title: "Barrio", defaultContent: "" },
      { data: "direccion", title: "Dirección", defaultContent: "" },
      {
        data: "inactiva",
        title: "Estado",
        defaultContent: "Activa",
        render: function (content, type, data) {
          if (type === "display" || type === "filter") {
            return content ? "Inactiva" : "Activada";
          }
          return content;
        },
      },
    ],
    language: {
      url: "https://cdn.datatables.net/plug-ins/1.10.24/i18n/Spanish.json",
    },
    scrollX: true,
    scrollCollapse: true,
    lengthMenu: [
      [5, 10, 25, 30],
      [5, 10, 25, 30],
    ],
  });

  if (!bodegas || !bodegas.length) table.clear();
}

$("#tabla-bodegas").on("click", "tbody tr", editarBodegaUsuarioAdm);
$("#actualizar-bodegas").click(actualizarBodegasAdm);

function editarBodegaUsuarioAdm(e) {
  console.log(e);
  console.log(e.timeStamp);
  console.log(this);
  const id = $(this).parents("table").attr("id");
  const api = $("#" + id).DataTable();
  const row = api.row(this);
  const data = row.data();

  if (!data) return;
  const html = `
    <form action="#" id="editar-bodega-${data.id}" class="m-2 text-left">
        <div class="form-group">
        <label for="ciudad-bodega">Ciudad</label>
        <input type="text" value="${data.ciudad
    }" class="form-control" id="ciudad-bodega" name="ciudad">
        </div>
        
        <div class="form-group">
        <label for="barrio-bodega">Barrio de la bodega</label>
        <input type="text" value="${data.barrio
    }" class="form-control" id="barrio-bodega" name="barrio">
        </div>
    
        <div class="form-group">
        <label for="direccion-bodega">Dirección de la bodega</label>
        <input type="text" value="${data.direccion
    }" class="form-control" id="direccion-bodega" name="direccion">
        </div>
        
        <div class="form-group">
        <label for="cod_suc_inter-bodega">Código sucursal para inter</label>
        <input type="text" value="${data.codigo_sucursal_inter || ""
    }" class="form-control" id="cod_suc_inter-bodega" name="codigo_sucursal_inter">
        </div>

        <div class="custom-control custom-switch">
            <input type="checkbox" class="custom-control-input" id="inactiva-bodega" ${data.inactiva ? "checked" : ""
    } name="inactiva">
            <label class="custom-control-label" for="inactiva-bodega">Desactivar bodega.</label>
        </div>

        <small>${data.direccion_completa}</small>
    </form>
    <button id="copiarInfoBodega" class="btn btn-outline-primary btn-block">Copiar información bodega</button>
    `;

  Swal.fire({
    titleText: data.nombre + " - " + data.ciudad.toLowerCase(),
    html,
    showCancelButton: true,
  }).then((res) => {
    if (res.isConfirmed) {
      const form = document.getElementById("editar-bodega-" + data.id);
      const formData = new FormData(form);

      for (let entrie of formData) {
        data[entrie[0]] = entrie[1].trim();
      }

      data.direccion_completa =
        data.direccion + ", " + data.barrio + ", " + data.ciudad;
      data.ult_edicion = new Date();
      data.inactiva = $("#inactiva-bodega", form).is(":checked");
      console.log(data);
    }
  });

  consultarCiudades(document.getElementById("ciudad-bodega"));

  $("#copiarInfoBodega").click(() => {
    let datos = {
      nombres: value("actualizar_nombres"),
      apellidos: value("actualizar_apellidos"),
      celular: value("actualizar_telefono"),
      celular2: value("actualizar_celular"),
      nombre_empresa: value("actualizar_nombre_empresa"),
      correo: value("actualizar_correo"),
      numero_documento: value("actualizar_numero_documento"),
      centro: value("actualizar_centro_costo"),
    };

    let textoACopiar = `${datos.centro} \t ${datos.numero_documento} \t ${datos.nombres
      } ${datos.apellidos} \t ${datos.celular || datos.celular2} \t ${data.direccion
      } ${data.barrio} \t ${data.ciudad} \t ${datos.correo} \t  ${datos.nombres
      } ${datos.apellidos}`;

    console.log(textoACopiar);

    navigator.clipboard.writeText(textoACopiar).then(() => {
      avisar(
        "Información copiada con éxito",
        "Se ha copiado la información de la bodega a cargo de " +
        datos.nombres +
        " " +
        datos.apellidos
      );
    });
  });
}

function actualizarBodegasAdm() {
  let id_usuario = document
    .getElementById("usuario-seleccionado")
    .getAttribute("data-id");
  const bodegas = $("#tabla-bodegas").DataTable().data().toArray();

  firebase
    .firestore()
    .collection("usuarios")
    .doc(id_usuario)
    .update({ bodegas })
    .then(() => {
      mostrarBodegasUsuarioAdm(bodegas);
      Toast.fire({
        icon: "success",
        text: "Bodegas actualizadas correctamente.",
      });
    });
}

function asignarValores(data, query) {
  for (let value in data) {
    const input = $(query).find(`[name="${value}"]`);
    if (input.hasClass("no-updte")) continue;
    input.val(data[value]);
  }
}

function limpiarFormulario(parent, query) {
  $(parent)
    .find(query)
    .each((i, el) => {
      if (el.classList.contains("no-updte")) return;
      if ($(el).attr("type") === "checkbox") {
        return $(el).prop("checked", false);
      }

      $(el).val("");
    });
}

async function actualizarInformacionPersonal() {
  let datos = {
    nombres: value("actualizar_nombres"),
    apellidos: value("actualizar_apellidos"),
    celular: value("actualizar_telefono"),
    celular2: value("actualizar_celular"),
    nombre_empresa: value("actualizar_nombre_empresa"),
    correo: value("actualizar_correo"),
    objetos_envio: value("actualizar_objetos_envio").split(","),
    numero_documento: value("actualizar_numero_documento"),
    contacto: value("actualizar_contacto"),
    type: value("actualizar_tipo_user"),
    con: value("actualizar_repetir_contraseña"),
    ingreso: value("actualizar_contraseña"),
  };
  const token = localStorage.getItem("token");

  let id_usuario = document
    .getElementById("usuario-seleccionado")
    .getAttribute("data-id");
  console.log(id_usuario);
  console.log(token);

  const myHeaders = new Headers();
  myHeaders.append("Authorization", "Bearer " + token);
  const userData = fetch(
    PROD_API_URL + "/api/v1/user?idFirebase=" + id_usuario,
    {
      method: "GET",
      headers: myHeaders,
      redirect: "follow",
    }
  ).then(async (response) => {
    const data = await response.json();
    const mongoId = data.response._id;
    const updateBody = JSON.stringify({
      name: value("actualizar_nombres"),
      last_name: value("actualizar_apellidos"),
      phone: value("actualizar_telefono"),
      alternative_phone: value("actualizar_celular"),
      email: value("actualizar_correo"),
      type_document: value("actualizar_tipo_documento"),
      document: value("actualizar_numero_documento"),
      password: value("actualizar_repetir_contraseña"),
    });
    myHeaders.append("Content-type", "application/json");
    fetch(PROD_API_URL + "/api/v1/user/" + mongoId, {
      method: "PATCH",
      headers: myHeaders,
      redirect: "follow",
      body: updateBody,
    }).then(() => {
      avisar(
        "Actualización de Datos exitosa",
        "Se han registrado cambios en información personal para: " +
        datos.nombres.split(" ")[0] +
        " " +
        datos.apellidos.split(" ")[0]
      );
    });
  })

}

function actualizarInformacionOficina() {
  let aux = false;

  if (value("visible-oficina") == "true") {
    aux = true;
  }

  let datos = {
    nombres: value("nombres-oficina"),
    apellidos: value("apellidos-oficina"),
    celular: value("numero1"),
    celular2: value("numero2"),
    correo: value("correo-oficina"),
    nombre_empresa: value("nombre-empresa-oficina"),
    ciudad: value("ciudad-oficina"),
    direccion: value("dirección-oficina"),
    barrio: value("barrio-oficina"),
    con: value("con-oficina"),
    visible: aux,
    direccion_completa:
      value("dirección-oficina") +
      ", " +
      value("barrio-oficina") +
      ", " +
      value("ciudad-oficina"),
  };
  console.log(aux);
  console.log(datos);

  let ofi = idOficina;

  console.log(ofi);

  firebase
    .firestore()
    .collection("oficinas")
    .doc(ofi)
    .update(datos)
    .then(() => {
      avisar(
        "Actualización de Datos exitosa",
        "Se han registrado cambios en la oficina para: " +
        datos.nombres.split(" ")[0] +
        " " +
        datos.apellidos.split(" ")[0]
      );
    });
}
async function actualizarInformacionHekaOficina() {
  let checkbox1val = 0;
  let checkbox2val = 0;
  let checkbox1 = document.getElementById("tipo-distribucion-direccion");
  let checkbox2 = document.getElementById("tipo-distribucion-oficina");

  if (checkbox1.checked) {
    checkbox1val = 1;
  }

  if (checkbox2.checked) {
    checkbox2val = 1;
  }

  let datos = {
    porcentaje_comsion: value("porcentaje-comision-oficina"),
    tipo_distribucion: [checkbox1val, checkbox2val],
    comision_minima: value("comision-minima"),
  };
  console.log(datos);

  console.log(idOficina);

  firebase
    .firestore()
    .collection("oficinas")
    .doc(idOficina)
    .update({ configuracion: datos })
    .then(() => {
      avisar(
        "Actualización de Datos exitosa",
        "Se han registrado de información Heka en la oficina para " +
        value("nombres-oficina") +
        " " +
        value("apellidos-oficina")
      );
    });
}

function actualizarInformacionBancaria() {
  // Datos bancarios
  let datos = {
    banco: value("actualizar_banco"),
    nombre_banco: value("actualizar_nombre_representante"),
    tipo_de_cuenta: value("actualizar_tipo_de_cuenta"),
    numero_cuenta: value("actualizar_numero_cuenta"),
    tipo_documento_banco: value("actualizar_tipo_documento_banco"),
    numero_iden_banco: value("actualizar_numero_identificacion_banco"),
  };

  let id_usuario = document
    .getElementById("usuario-seleccionado")
    .getAttribute("data-id");

  firebase
    .firestore()
    .collection("usuarios")
    .doc(id_usuario)
    .update({ datos_bancarios: datos })
    .then(() => {
      avisar(
        "Actualización de Datos exitosa",
        "Se han registrado cambios en información Bancaria para id: " +
        value("actualizar_numero_documento")
      );
    });
}

async function actualizarInformacionHeka() {
  const inpIdAgente = $("#id_agente_aveo").val();
  const inpCodSucursal = $("#actualizar_codigo_sucursal_inter").val();
  const activadorEnvia = $("#sistema_envia").val();
  const activadorTcc = $("#sitema_tcc").val();
  const activadorInter = $("#sistema_interrapidisimo").val();
  const actEnvia = activadorEnvia === "automatico";
  const actTcc = activadorTcc === "automatico";
  const actInter = activadorInter && activadorInter !== "inhabilitado";

  let mensajeCuidado;
  if (actTcc && !inpIdAgente)
    mensajeCuidado = "Recuerda agregar un id cliente antes de activar TCC";

  if (mensajeCuidado) {
    return Toast.fire({
      icon: "error",
      title: "Algo Falta 😓",
      text: mensajeCuidado,
    });
  }
  // Datos contabilidad
  document.querySelector('[onclick="actualizarInformacionHeka()"]').value =
    "cargando";

  let datos = {
    saldo: parseInt($("#actualizar_saldo").attr("data-saldo")),
    fecha: genFecha(),
  };

  $("#informacion-heka")
    .find("[type=checkbox]")
    .each((i, el) => {
      const value = $(el).attr("id");
      datos[value] = $(el).prop("checked");
    });

  $("#informacion-heka")
    .find("[name]")
    .each((i, el) => {
      const campo = $(el).attr("name");
      const value = $(el).val();

      datos[campo] = value;
    });

  console.log(datos);

  let momento = new Date().getTime();
  let id_usuario = document
    .getElementById("usuario-seleccionado")
    .getAttribute("data-id");

  let reference = firebase.firestore().collection("usuarios").doc(id_usuario);

  let mensaje = "";

  let exists = false;
  let saldo = await reference.get().then((doc) => {
    detalles = {
      saldo: parseInt($("#actualizar_saldo").attr("data-saldo")),
      saldo_anterior: parseInt(
        $("#actualizar_saldo").attr("data-saldo_anterior")
      ),
      actv_credit: document.getElementById("actv_credit").checked,
      limit_credit: parseInt(value("limit_credit")),
      fecha: genFecha(),
      diferencia: parseInt($("#aumentar_saldo").val()) || 0,
      mensaje: "Hubo algún cambio por parte del administrador",
      guia: "",
      momento: momento,
      user_id: id_usuario,
      medio: "Administrador: " + localStorage.user_id,
      type: "GENERAL",
    };
    if (doc.exists && doc.data().datos_personalizados) {
      const datos = doc.data().datos_personalizados;
      exists = true;
      let s = parseInt(datos.saldo || 0);
      const afirmar_saldo_anterior = detalles.saldo_anterior;
      detalles.saldo_anterior = s;
      detalles.saldo = s + detalles.diferencia;
      datos.saldo = s + detalles.diferencia;

      if (afirmar_saldo_anterior != s) {
        mensaje =
          ". Se notó una discrepancia entre el saldo mostrado ($" +
          convertirMiles(afirmar_saldo_anterior) +
          ") y el encontrado en la base de datos, se modificó en base a: <b>$" +
          convertirMiles(s) +
          "</b>";
      }
    }

    return detalles;
  });

  // console.log(saldo);
  // console.log(datos);
  // // mostrarDatosPersonales(datos, "heka");
  // return;

  if (saldo.saldo_anterior < 0 && saldo.saldo != saldo.saldo_anterior) {
    document.querySelector('[onclick="actualizarInformacionHeka()"]').value =
      "Actualizar Costos de Envío";
    return avisar(
      "No permitido",
      "Se detecta un saldo negativo, por favor justifica el saldo canjeado en deudas, o contace al desarrollador para agregar una excepción.",
      "advertencia"
    );
  }
  // return console.log(datos, saldo)

  reference
    .update({ datos_personalizados: datos })
    .then(() => {
      if (saldo.saldo_anterior === saldo.saldo) return;
      firebase
        .firestore()
        .collection("prueba")
        .add(saldo)
        .then((docRef1) => {
          console.log(docRef1.id);
          firebase
            .firestore()
            .collection("usuarios")
            .doc(id_usuario)
            .collection("movimientos")
            .add(saldo)
            .then((docRef2) => {
              firebase
                .firestore()
                .collection("usuarios")
                .doc("22032021")
                .collection("movimientos")
                .add({
                  id1: docRef1.id,
                  id2: docRef2.id,
                  user: saldo.user_id,
                  medio: "Administrador: " + localStorage.user_id,
                  momento: momento,
                });
            });
        });
    })
    .then(() => {
      mostrarDatosPersonales(datos, "heka");
      document.querySelector('[onclick="actualizarInformacionHeka()"]').value =
        "Actualizar Costos de Envío";
      avisar(
        "Actualización de Datos exitosa",
        "Se han registrado cambios en los costos de envíos para id: " +
        value("actualizar_numero_documento") +
        mensaje
      );
    });
}

$("#crear_agente_aveo").click(crearAgenteAveonline);
async function crearAgenteAveonline() {
  const emiter = new ChangeElementContenWhileLoading(this);
  const bodegas = $("#tabla-bodegas").DataTable().data().toArray();
  const inputOptions = new Object();
  emiter.init();

  if (!bodegas.length) {
    emiter.end();
    return Toast.fire({
      icon: "warning",
      title: "No permitido",
      text: "el usuario no tiene bodega para crear el agente de aveonline",
    });
  }

  bodegas.forEach((b) => {
    inputOptions[b.id] = b.nombre;
  });

  const { value: idSeleccionada } = await Swal.fire({
    title: "Seleccione ciudad",
    input: "select",
    inputOptions,
    showCancelButton: true,
    confirmButtonText: "Crear agente",
  });

  if (!idSeleccionada) return emiter.end();

  const { direccion, barrio, ciudad } = bodegas.filter(
    (b) => b.id == idSeleccionada
  )[0];

  console.log(direccion, barrio, ciudad);
  let queries = $("#informacion-personal form").serialize();
  // Se codifica para que no se pierdan algunos valores como carácteres especiales
  queries += `&barrio=${encodeURIComponent(barrio)}&ciudad=${encodeURIComponent(
    ciudad
  )}&direccion=${encodeURIComponent(direccion)}`;

  const res = await fetch("/aveo/crearAgente?" + queries).then((d) => d.json());
  console.log(res);
  Toast.fire({
    icon: res.status === "error" ? "error" : "success",
    title: res.status,
    text: res.message,
  });

  $("#listar_agentes_aveo").click();
  emiter.end();
}

async function consultarAgentesAveonline() {
  const res = await fetch("/aveo/listarAgentes").then((d) => d.json());

  return res;
}

$("#listar_agentes_aveo").click(listarAgentesAveonline);
async function listarAgentesAveonline(e) {
  const emiter = new ChangeElementContenWhileLoading(this);
  emiter.init();
  const consulta = await consultarAgentesAveonline();
  const agentes = consulta.agentes;
  const lister = "#" + e.target.getAttribute("data-list");

  $(lister).html("");

  agentes.forEach((agente) => {
    $(lister).append(
      `<option value="${agente.id}">${agente.id} - ${agente.nombre}</option>`
    );
  });
  emiter.end();
}

/* Para ver los movimientos en efectivo de los usuarios */

async function verMovimientos(usuario, fechaI, fechaF) {
  document.getElementById("card-movimientos").innerHTML = "";
  document.getElementById("card-movimientos").innerHTML =
    "<div class='d-flex justify-content-center'><div class='lds-ellipsis'><div></div><div></div><div></div><div></div></div>";
  try {
    let buscador = await firebase
      .firestore()
      .collection("usuarios")
      .doc("22032021")
      .collection("movimientos")
      .get()
      .then((querySnapshot) => {
        let pagos = new Array();
        querySnapshot.forEach((doc) => {
          let pago = doc.data();
          if (
            pago.user == usuario &&
            fechaI <= pago.momento &&
            fechaF >= pago.momento
          )
            pagos.push(pago);
        });
        return pagos;
      });

    console.log(buscador);
    async function miradorUsuario(usuario) {
      let res = [];
      await firebase
        .firestore()
        .collection("usuarios")
        .doc(usuario)
        .collection("movimientos")
        .orderBy("momento")
        .startAt(fechaI)
        .endAt(fechaF)
        .get()
        .then((querySnapshot) => {
          querySnapshot.forEach((doc) => {
            res.push(doc.data());
          });
        });
      return res;
    }

    async function miradorPrueba(usuario) {
      let res = [];
      await firebase
        .firestore()
        .collection("prueba")
        .where("user_id", "==", usuario)
        .get()
        .then((querySnapshot) => {
          querySnapshot.forEach((doc) => {
            res.push(doc.data());
          });
        });
      return res;
    }

    let data1, data2;
    miradorUsuario(usuario).then((data) => {
      data2 = data;
      miradorPrueba(usuario)
        .then((d2) => (data1 = d2))
        .then(() => {
          document.getElementById("card-movimientos").innerHTML = "";
          let detalles = document.createElement("ul");
          lista_detalles = [];
          console.log(data2);
          console.log(data1);

          if (!data2.length) return;
          let saldo_momento = data2.reduce((a, b) => {
            return parseInt(a) + parseInt(b.diferencia);
          }, parseInt(data2[0].saldo_anterior));
          let saldo_momento_legal = data1.reduce((a, b) => {
            if (b.momento >= fechaI && b.momento <= fechaF) {
              return parseInt(a) + parseInt(b.diferencia);
            } else {
              return a;
            }
          }, parseInt(data2[0].saldo_anterior));
          let saldo_legal = data1.reduce((a, b) => {
            return parseInt(a) + parseInt(b.diferencia);
          }, 0);

          if (
            buscador.length == data2.length &&
            buscador.length == data1.length
          ) {
            lista_detalles.push(
              "La cantidad de movimientos coinciden en todos los documentos"
            );
          } else if (buscador.length == data2.length) {
            lista_detalles.push(
              "La cantidad de movimientos coincide solo con los movimientos del usuario"
            );
          } else if (buscador.length == data1.length) {
            lista_detalles.push(
              "La cantidad de movimientos coincide solo con los movimientos secundarios, si no estás filtrando datos es posible qeu sea un error"
            );
          }

          lista_detalles.push(
            "El saldo del cliente a la fecha era de: $" +
            convertirMiles(saldo_momento) +
            " Y debió haber sido de: $" +
            convertirMiles(saldo_momento_legal)
          );
          tablaMovimientos(data2);
          firebase
            .firestore()
            .collection("usuarios")
            .doc(usuario)
            .get()
            .then((doc) => {
              if (doc.exists && doc.data().datos_personalizados) {
                const datos = doc.data().datos_personalizados;
                lista_detalles.push(
                  "El saldo Actual del cliente es: $" +
                  convertirMiles(datos.saldo) +
                  " Y debería ser de: $" +
                  convertirMiles(saldo_legal)
                );
                console.log(
                  "Saldos coinciden? => ",
                  parseInt(datos.saldo) == saldo_legal
                );
              }
            })
            .then(() => {
              for (let d of lista_detalles) {
                detalles.innerHTML += `<li>${d}</li>`;
              }
              document.getElementById("card-movimientos").appendChild(detalles);
            });
        });
    });
  } catch (error) {
    console.log(error);
  }
}
