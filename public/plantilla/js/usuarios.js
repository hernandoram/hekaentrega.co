let ingreso, seller;
import {
  db,
  doc,
  getDoc,
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  collectionGroup,
  startAt,
  endAt,
  updateDoc,
  addDoc
} from "/js/config/initializeFirebase.js";
import { inHTML } from '/js/main.js';
import { recursividadPorReferencia } from '/js/manejadorGuias.js';
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

          getDoc(doc(db, "usuarios", user)).then((docSnapshot) => {
            console.log(datos_bancarios);
            console.log(datos_personales);
            console.log(datos_relevantes);
          
            if (!docSnapshot.exists()) {
              setDoc(doc(collection(db, "usuarios", user, "informacion"), "personal"), datos_personales).then(() => {
                setDoc(doc(db, "usuarios", user), datos_relevantes).catch((err) => {
                  inHTML(
                    "error_crear_cuenta",
                    `<h6 class="text-danger">${err} \n
                                  No se pudo crear el identificador de ingreso</h6>`
                  );
                });
              }).then(() => {
                setDoc(doc(collection(db, "usuarios", user, "informacion"), "bancaria"), datos_bancarios).catch(function (error) {
                  inHTML(
                    "error_crear_cuenta",
                    `<h6 class="text-danger">Problemas al agregar Datos bancarios</h6>`
                  );
                });
              }).then(() => {
                if (datos_relevantes.usuario_corporativo) {
                  setDoc(doc(collection(db, "usuarios", user, "informacion"), "heka"), {
                    activar_saldo: true,
                    fecha: genFecha(),
                    saldo: 0,
                  });
                }
              }).then(function () {
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
                  getDocs(query(collection(db, "usuarios"), where("ingreso", "==", datos_relevantes.ingreso.toString()))).then((querySnapshot) => {
                    localStorage.setItem("user_id", "");
                    querySnapshot.forEach((doc) => {
                      localStorage.setItem("user_id", doc.id);
                      localStorage.setItem("user_login", doc.data().ingreso);
                      console.log(localStorage);
          
                      location.href = "plataforma2.html";
                    });
                  }).then(() => {
                    if (localStorage.user_id === "") {
                      alert("Usuario no encontrado");
                    }
                  }).catch((error) => {
                    console.log("Error getting documents: ", error);
                  });
                }
              }).catch(function (error) {
                boton_crear_usuario.setAttribute("onclick", "nuevaCuenta()");
                boton_crear_usuario.disabled = false;
                boton_crear_usuario.textContent = "Registrar Cuenta";
                inHTML("error_crear_cuenta", `<h6 class="text-danger">${error}</h6>`);
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
export async function verificarExistencia(administracion) {
  await getDocs(collection(db, "usuarios")).then((querySnapshot) => {
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
  getDoc(doc(db, "oficinas", id))
  .then((doc) => {
    if (doc.exists()) {
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

// const botonBusquedaGeneral = document.getElementById("busquedaGeneral");
// const botonBusquedaEspecializada = document.getElementById(
//   "busquedaEspecializada"
// );

// botonBusquedaGeneral.onclick = function (e) {
//   // Aquí va el código que quieres que se ejecute cuando se haga clic en el botón de búsqueda general
//   console.log("Botón de búsqueda general clickeado");
//   e.preventDefault();

//   searchUsers(e, true);
// };

// botonBusquedaEspecializada.onclick = function (e) {
//   // Aquí va el código que quieres que se ejecute cuando se haga clic en el botón de búsqueda especializada
//   console.log("Botón de búsqueda especializada clickeado");
//   e.preventDefault();

//   searchUsers(e, false);
// };

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

  const mayusNombreInp = nombreInp.toUpperCase();

  const reference = collection(db, "usuarios");

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
      nombreInp &&
      (await reference
        .where(caso, "==", nombreInp)
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

    if (!especifico && caso === "correo") {
      especifico =
        mayusNombreInp &&
        (await reference
          .where(caso, "==", mayusNombreInp)
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
    }

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
    updateDoc(doc(db, "usuarios", id), {
      generacion_automatizada: el.checked,
    }).then(() => {
      Toast.fire({
        icon: "success",
        text: "Usuario actualizado",
      });
    });
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

let userBodegas = [];
let idUsuario = "";
// esta funcion me busca el usuario seleccionado con informacion un poco mas detallada
export async function seleccionarUsuario(id) {
  let idUsuario = id;
  const contenedor = document.getElementById("usuario-seleccionado");
  const mostrador = document.getElementById("tablaUsers");
  const wrapper = document.getElementById("tablaUsers_wrapper");

  if (wrapper) {
    wrapper.classList.add("d-none");
  }

  contenedor.setAttribute("data-id", id);
  mostrador.classList.add("d-none");
  $("#control-buttons").addClass("d-none");

  try {
    const userDocRef = doc(db, "usuarios", id);
    const docSnap = await getDoc(userDocRef);

    if (docSnap.exists()) {
      contenedor.classList.remove("d-none");
      const data = docSnap.data();
      const datos_bancarios = data.datos_bancarios;
      const datos_personalizados = data.datos_personalizados ?? {};
      const bodegas = data.bodegas;

      console.log("Acciones pendientes:", bodegas);

      mostrarDatosPersonales(data, "personal");

      const referidosQuery = query(
        collection(db, "referidos"),
        where("sellerReferido", "==", data.centro_de_costo)
      );

      const referidosSnapshot = await getDocs(referidosQuery);

      referidosSnapshot.forEach((doc) => {
        console.warn(doc.data());
        const referidoDE = document.getElementById("referidoDe");
        referidoDE.value = doc.data().sellerReferente;
      });

      mostrarReferidosUsuarioAdm(data.centro_de_costo);

      mostrarDatosPersonales(datos_bancarios, "bancaria");

      const fechaRegistroUsuario = document.getElementById(
        "fecha_registro_usuario"
      );
      const fechaCreacion = data.fecha_creacion;

      if (fechaCreacion && fechaCreacion.seconds !== undefined) {
        const fecha = new Date(fechaCreacion.seconds * 1000);
        const opciones = {
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "numeric",
          minute: "numeric",
          second: "numeric",
          hour12: true,
        };
        fechaRegistroUsuario.value = fecha.toLocaleDateString("es-CO", opciones);
      } else {
        fechaRegistroUsuario.value = "Seller Antiguo";
      }

      mostrarObjetosFrecuentesAdm(docSnap.id);

      try {
        const dataApi = await getDataUserFromMongoByIdAdm(id);
        datos_personalizados.user_type = dataApi.response.user_type;

        mostrarDatosPersonales(datos_personalizados, "heka");
      } catch {
        mostrarDatosPersonales(datos_personalizados, "heka");
        mostrarReferidosUsuarioAdm(data.centro_de_costo);
      }
    } else {
      avisar(
        "Usuario no encontrado",
        `El seller con el ID ${id} no existe en la base de datos`,
        "alerta"
      );
      contenedor.classList.add("d-none");
    }
  } catch (error) {
    console.log("Error obteniendo documento:", error);
  }

  try {
    const accionesQuery = query(
      collection(db, "usuarios", id, "acciones"),
      orderBy("Fecha", "desc"),
      limit(30)
    );
    const accionesSnapshot = await getDocs(accionesQuery);

    let acciones = [];
    accionesSnapshot.forEach((doc) => {
      acciones.push(doc.data());
    });

    acciones.forEach((accion) => {
      const fecha = new Date(accion.Fecha.seconds * 1000);
      accion.timeline = fecha.getTime();

      const opciones = {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      };
      accion.Fecha = fecha.toLocaleString("es-CO", opciones);

      accion["Valor del pago"] = accion["Valor del pago"].toLocaleString(
        "es-CO",
        { style: "currency", currency: "COP" }
      );
    });

    const table = $("#tabla-acciones").DataTable({
      destroy: true,
      data: acciones,
      order: [[1]],
      columns: [
        { data: "timeline", title: "Orden", defaultContent: "", visible: false },
        { data: "Estado", title: "Estado", defaultContent: "" },
        { data: "Fecha", title: "Fecha", defaultContent: "" },
        { data: "Valor del pago", title: "Valor del pago", defaultContent: "" },
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

    if (!acciones.length) table.clear();
  } catch (error) {
    console.log("Error obteniendo acciones:", error);
  }
}

// esta funcion solo llena los datos solicitados en los inputs
function mostrarDatosPersonales(data, info) {
  limpiarFormulario("#informacion-" + info, "input,select");

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
    if (data.blockedWallet === true) {
      document.querySelector("#actualizar_bloqueo_billetera").value = true;
    } else {
      document.querySelector("#actualizar_bloqueo_billetera").value = false;
    }
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

let selectControl = document.getElementById("selectControl");

let objetosFrecuentes2 = [];

function mostrarObjetosFrecuentesAdm(id) {
  const objetosFrecuentes2 = [];
  const userRef = doc(db, "usuarios", id); // Obtén la referencia al documento del usuario
  const plantillasRef = collection(userRef, "plantillasObjetosFrecuentes"); // Obtén la referencia a la subcolección "plantillasObjetosFrecuentes"

  getDocs(plantillasRef)
    .then((querySnapshot) => {
      querySnapshot.forEach((doc) => {
        const objeto = { id: doc.id, ...doc.data() };
        objetosFrecuentes2.push(objeto);
      });
    })
    .then(() => {
      renderObjetosFrecuentes();
    });
}

selectControl.addEventListener("change", (e) => {
  const value = e.target.value;

  const objeto = objetosFrecuentes2.find((objeto) => objeto.id === value);

  let nombreInput = document.getElementById("nombreInput");
  let referenciaInput = document.getElementById("referenciaInput");
  let descripcionEmpaqueInput = document.getElementById(
    "descripcionEmpaqueInput"
  );

  nombreInput.value = objeto.nombre;
  referenciaInput.value = objeto.referencia;
  descripcionEmpaqueInput.value = objeto.paquete;
});

function renderObjetosFrecuentes() {
  let selectControl = document.getElementById("selectControl");
  selectControl.innerHTML = ""; // Limpiar las opciones existentes

  objetosFrecuentes2.forEach((objeto) => {
    let option = document.createElement("option");
    option.value = objeto.id;
    option.text = objeto.nombre;
    selectControl.appendChild(option);
  });
  const objeto = objetosFrecuentes2[0] || {};

  let nombreInput = document.getElementById("nombreInput");
  let referenciaInput = document.getElementById("referenciaInput");
  let descripcionEmpaqueInput = document.getElementById(
    "descripcionEmpaqueInput"
  );

  nombreInput.value = objeto.nombre || "aún no hay objetos frecuentes";
  referenciaInput.value = objeto.referencia || "";
  descripcionEmpaqueInput.value = objeto.paquete || "";
}

let referidos = [];

function mostrarReferidosUsuarioAdm(centro_costo) {
  const referidos = [];
  const referidosRef = collection(db, "referidos"); // Obtén la referencia a la colección "referidos"
  const q = query(referidosRef, where("sellerReferente", "==", centro_costo)); // Crea la consulta

  getDocs(q)
    .then((querySnapshot) => {
      querySnapshot.forEach((doc) => {
        referidos.push(doc.data());
      });
    })
    .finally(() => {
      const table = $(document).ready(function () {
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
            {
              data: "enviosPorReclamar",
              title: "Envios por Reclamar",
              defaultContent: "0",
            },
            {
              data: "enviosReclamados",
              title: "Envios Reclamados",
              defaultContent: "0",
            },
            {
              data: "cantidadReclamos",
              title: "Cantidad Reclamos",
              defaultContent: "0",
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
          columnDefs: [
            {
              targets: [6], // Índice de la columna "Cantidad Reclamos"
              createdCell: function (td, cellData, rowData, row, col) {
                $(td).addClass("clickable-cantidad-reclamos"); // Añade una clase para identificar las celdas
              },
            },
          ],
          drawCallback: function (settings) {
            // Añade el manejador de eventos cada vez que se dibuja la tabla
            $(".clickable-cantidad-reclamos")
              .off("click")
              .on("click", function () {
                // Accede a la fila (tr) que contiene la celda clickeada
                const row = $(this).closest("tr");
                // Encuentra el contenido de la celda "Seller Referido" en la misma fila
                let sellerReferido = row.find("td:eq(0)").text(); // Asumiendo que "Seller Referido" es la primera columna

                let transacciones = referidos.find(
                  (referido) => referido.sellerReferido === sellerReferido
                ).historialGuias;

                // Actualiza el título del modal con el nombre del "Seller Referido"
                $("#modalReferidos .modal-title").text(
                  "Historial de Reclamos - " + sellerReferido
                );

                // Muestra el modal
                $("#modalReferidos").modal("show");

                if (
                  !transacciones ||
                  !transacciones.length ||
                  transacciones === undefined
                ) {
                  $("#tabla-reclamos").DataTable().clear();
                  $( "#modalHistorialReferidos-mensajeNoHayReferidos" ).removeClass("d-none");
                  $("#modalHistorialPagoRef").addClass("d-none");
                } else {
                  $("#modalHistorialReferidos-mensajeNoHayReferidos").addClass(
                    "d-none"
                  );

                  $("#modalHistorialPagoRef").removeClass("d-none");

                  // Limpiar el cuerpo de la tabla antes de agregar nuevos datos
                  $("#mostrador-pagos-referidos").empty();

                  // Iterar sobre el arreglo historialGuias
                  transacciones.forEach((guia) => {
                    // Convertir las guiasEntregadas de un arreglo a una cadena de texto
                    let guiasEntregadasTexto = guia.guiasEntregadas.join(", ");

                    // Convertir timestamp a una fecha legible
                    let fecha = new Date(guia.timestamp.seconds * 1000); // Asumiendo que timestamp.seconds es en segundos
                    let fechaReclamo = fecha.toLocaleDateString("es-ES"); // Formatear la fecha

                    // Construir la fila de la tabla
                    let fila = `<tr>
                                <td>${guia.saldoReclamado}</td>
                                <td>${guiasEntregadasTexto}</td>
                                <td>${fechaReclamo}</td>
                              </tr>`;

                    // Agregar la fila al cuerpo de la tabla
                    $("#mostrador-pagos-referidos").append(fila);
                  });
                }
              });
          },
        });
      });
    });
}

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
        <input type="text" value="${
          data.ciudad
        }" class="form-control" id="ciudad-bodega" name="ciudad">
        </div>
        
        <div class="form-group">
        <label for="barrio-bodega">Barrio de la bodega</label>
        <input type="text" value="${
          data.barrio
        }" class="form-control" id="barrio-bodega" name="barrio">
        </div>
    
        <div class="form-group">
        <label for="direccion-bodega">Dirección de la bodega</label>
        <input type="text" value="${
          data.direccion
        }" class="form-control" id="direccion-bodega" name="direccion">
        </div>
        
        <div class="form-group">
        <label for="cod_suc_inter-bodega">Código sucursal para inter</label>
        <input type="text" value="${
          data.codigo_sucursal_inter || ""
        }" class="form-control" id="cod_suc_inter-bodega" name="codigo_sucursal_inter">
        </div>

        <div class="custom-control custom-switch">
            <input type="checkbox" class="custom-control-input" id="inactiva-bodega" ${
              data.inactiva ? "checked" : ""
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

    let textoACopiar = `${datos.centro} \t ${datos.numero_documento} \t ${
      datos.nombres
    } ${datos.apellidos} \t ${datos.celular || datos.celular2} \t ${
      data.direccion
    } ${data.barrio} \t ${data.ciudad} \t ${datos.correo} \t  ${
      datos.nombres
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

function compareCodigoSucursalInter(arr1, arr2) {
  const differences = [];
  for (let i = 0; i < arr1.length; i++) {
    const codigo1 = arr1[i].codigo_sucursal_inter;
    const codigo2 = arr2[i].codigo_sucursal_inter;
    if (codigo1 !== codigo2) {
      differences.push({
        index: i,
        codigo_sucursal_inter_1: codigo1,
        codigo_sucursal_inter_2: codigo2,
      });
    }
  }
  return differences;
}

async function notificacionBodegas(bodegasInfo) {
  bodegasInfo.forEach(async (bodega) => {
    try {
      await addDoc(collection(db, "notificaciones"), {
        icon: ["map-marker-alt", "primary"],
        fecha: genFecha(),
        mensaje: `Tu bodega de Interrapidisimo con dirección ${bodega.direccion_completa} ha sido activada correctamente`,
        user_id: idUsuario,
        visible_user: true,
        timeline: new Date().getTime(),
      });
      console.log(
        `Notificación creada para la bodega en ${bodega.ciudad} con dirección ${bodega.direccion_completa} ${idUsuario}`
      );
    } catch (error) {
      console.error(
        `Error al crear la notificación para la bodega en ${bodega.ciudad} con dirección ${bodega.direccion_completa}:`,
        error
      );
    }
  });

  return "todo right";
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
  const tipoUsuario = document.querySelector("#actualizar_tipo_user").value;

  const type = tipoUsuario === "" ? "NATURAL" : tipoUsuario;

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
    type: type,

    blockWallet: value("actualizar_bloqueo_billetera"),

    con: value("actualizar_repetir_contraseña"),
    ingreso: value("actualizar_contraseña"),
  };

  let billetera = value("actualizar_bloqueo_billetera");

  if (billetera === "true") {
    billetera = true;
  } else {
    billetera = false;
  }

  const token = localStorage.getItem("token");

  let id_usuario = document
    .getElementById("usuario-seleccionado")
    .getAttribute("data-id");

  const myHeaders = new Headers();
  myHeaders.append("Authorization", "Bearer " + token);

  const userData = fetch(
    PROD_API_URL + "/api/v1/user?idFirebase=" + id_usuario + "&limit=1",
    {
      method: "GET",
      headers: myHeaders,
      redirect: "follow",
    }
  ).then(async (response) => {
    const data = await response.json();
    console.log(data);

    const mongoId = data.response._id;

    function mapTipoDocumento(tipo) {
      const mapping = {
        CC: "CC",
        PASAPORTE: "PS",
        "NIT(RUT)": "NIT",
        CE: "CE",
        PPT: "PPT",
        PEP: "PEP",
      };
      return mapping[tipo] || tipo;
    }

    const doc = value("actualizar_tipo_documento");

    const mappedDoc = mapTipoDocumento(doc);

    let type_account = "natural";
    switch (type) {
      case "NATURAL":
        type_account = "natural";
        break;
      case "USUARIO-PUNTO":
        type_account = "point";
        break;
      case "NATURAL-FLEXII":
        type_account = "natural_flexii";
        break;
    }

    const updateBody = JSON.stringify({
      name: value("actualizar_nombres"),
      last_name: value("actualizar_apellidos"),
      phone: Number(value("actualizar_telefono")),
      alternative_phone: Number(value("actualizar_celular")),
      email: value("actualizar_correo"),
      type_document: mappedDoc,
      document: value("actualizar_numero_documento"),
      type_account: type_account,
      blockedWallet: billetera,
      channel: "hekaentrega",
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
  });
}

async function getDataUserFromMongoByIdAdm(id_usuario) {
  const myHeaders = new Headers();
  const token = localStorage.getItem("token");

  myHeaders.append("Authorization", "Bearer " + token);

  const userData = await fetch(
    PROD_API_URL + "/api/v1/user?idFirebase=" + id_usuario + "&limit=1",
    {
      method: "GET",
      headers: myHeaders,
      redirect: "follow",
    }
  ).then(async (response) => {
    const data = await response.json();
    return data;
  });

  return userData;
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

  const oficinaRef = doc(db, "oficinas", ofi);
updateDoc(oficinaRef, datos).then(() => {
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

  const oficinaRef = doc(db, "oficinas", idOficina);
  updateDoc(oficinaRef, { configuracion: datos }).then(() => {
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

    const usuarioRef = doc(db, "usuarios", id_usuario);
    updateDoc(usuarioRef, { datos_bancarios: datos }).then(() => {
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

  let momento = new Date().getTime();
  let id_usuario = document
    .getElementById("usuario-seleccionado")
    .getAttribute("data-id");

    const reference = doc(db, "usuarios", id_usuario);

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

    if (!doc.exists) {
      const message =
        "El usuario " +
        id_usuario +
        " no ha sido encontrado en la base de datos";
      Toast.fire("Error", message, "error");
      throw new Error(message);
    }

    const datos_personalizados = doc.data().datos_personalizados;
    if (datos_personalizados) {
      exists = true;
      const saldoOriginalEncontrado = parseInt(datos_personalizados.saldo || 0);
      const afirmar_saldo_anterior = detalles.saldo_anterior;
      detalles.saldo_anterior = saldoOriginalEncontrado;
      detalles.saldo = saldoOriginalEncontrado + detalles.diferencia;
      datos.saldo = saldoOriginalEncontrado + detalles.diferencia;

      if (afirmar_saldo_anterior !== saldoOriginalEncontrado) {
        // Se muestra este mensaje porque se denotó que el saldo que se mostraba en la ventana adminitrativa
        // por alguna causa ha cambiado, por lo que se toma el original que se encuentre en la base de datos
        detalles.mensaje =
          "Cambio administrativo, discrepancia, saldo mostrado: $" +
          convertirMiles(afirmar_saldo_anterior) +
          " - saldo real que prevalece: $" +
          convertirMiles(saldoOriginalEncontrado);
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

  await updateDoc(reference, { datos_personalizados: datos }).then(() => {
    if (saldo.saldo_anterior === saldo.saldo) return;
    const pruebaCollection = collection(db, "prueba");
    addDoc(pruebaCollection, saldo).then((docRef1) => {
      console.log(docRef1.id);
      const movimientosCollection = collection(
        doc(db, "usuarios", id_usuario),
        "movimientos"
      );
      addDoc(movimientosCollection, saldo).then((docRef2) => {
        const movimientosAdminCollection = collection(
          doc(db, "usuarios", "22032021"),
          "movimientos"
        );
        addDoc(movimientosAdminCollection, {
          id1: docRef1.id,
          id2: docRef2.id,
          user: saldo.user_id,
          medio: "Administrador: " + localStorage.user_id,
          momento: momento,
        });
      });
    });
  }).then(() => {
    mostrarDatosPersonales(datos, "heka");
    document.querySelector('[onclick="actualizarInformacionHeka()"]').value =
      "Actualizar Costos de Envío";
    avisar(
      "Actualización de Datos exitosa",
      "Se han registrado cambios en los costos de envíos para id: " +
        value("actualizar_numero_documento") +
        ". " +
        saldo.mensaje
    );
  });
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

export async function verMovimientos(usuario, fechaI, fechaF) {
  document.getElementById("card-movimientos").innerHTML = "";
  document.getElementById("card-movimientos").innerHTML =
    "<div class='d-flex justify-content-center'><div class='lds-ellipsis'><div></div><div></div><div></div><div></div></div>";
  
  try {
    // Obtener movimientos del usuario
    const movimientosRef = collection(db, "usuarios", "22032021", "movimientos");
    const querySnapshot = await getDocs(movimientosRef);
    let buscador = [];
    querySnapshot.forEach((doc) => {
      let pago = doc.data();
      if (pago.user === usuario && fechaI <= pago.momento && fechaF >= pago.momento) {
        buscador.push(pago);
      }
    });
    
    console.log(buscador);

    async function miradorUsuario(usuario) {
      let res = [];
      const usuarioRef = collection(db, "usuarios", usuario, "movimientos");
      const q = query(usuarioRef, orderBy("momento"), startAt(fechaI), endAt(fechaF));
      const querySnapshot = await getDocs(q);
      querySnapshot.forEach((doc) => {
        res.push(doc.data());
      });
      return res;
    }

    async function miradorPrueba(usuario) {
      let res = [];
      const pruebaRef = collection(db, "prueba");
      const q = query(pruebaRef, where("user_id", "==", usuario));
      const querySnapshot = await getDocs(q);
      querySnapshot.forEach((doc) => {
        res.push(doc.data());
      });
      return res;
    }

    let data1, data2;
    data2 = await miradorUsuario(usuario);
    data1 = await miradorPrueba(usuario);

    document.getElementById("card-movimientos").innerHTML = "";
    let detalles = document.createElement("ul");
    let lista_detalles = [];
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
      buscador.length === data2.length &&
      buscador.length === data1.length
    ) {
      lista_detalles.push(
        "La cantidad de movimientos coinciden en todos los documentos"
      );
    } else if (buscador.length === data2.length) {
      lista_detalles.push(
        "La cantidad de movimientos coincide solo con los movimientos del usuario"
      );
    } else if (buscador.length === data1.length) {
      lista_detalles.push(
        "La cantidad de movimientos coincide solo con los movimientos secundarios, si no estás filtrando datos es posible que sea un error"
      );
    }

    lista_detalles.push(
      "El saldo del cliente a la fecha era de: $" +
        convertirMiles(saldo_momento) +
        " Y debió haber sido de: $" +
        convertirMiles(saldo_momento_legal)
    );

    tablaMovimientos(data2);

    const usuarioDocRef = doc(db, "usuarios", usuario);
    const usuarioDoc = await getDoc(usuarioDocRef);
    if (usuarioDoc.exists() && usuarioDoc.data().datos_personalizados) {
      const datos = usuarioDoc.data().datos_personalizados;
      lista_detalles.push(
        "El saldo Actual del cliente es: $" +
          convertirMiles(datos.saldo) +
          " Y debería ser de: $" +
          convertirMiles(saldo_legal)
      );
      console.log(
        "Saldos coinciden? => ",
        parseInt(datos.saldo) === saldo_legal
      );
    }

    for (let d of lista_detalles) {
      detalles.innerHTML += `<li>${d}</li>`;
    }

    document.getElementById("card-movimientos").appendChild(detalles);

  } catch (error) {
    console.log(error);
  }
}

export const loadStats = document.getElementById("load-stats");
const statsGlobales = document.getElementById("stats-globales");
const loader = document.getElementById("loading-s");
let guiasStats = [];

loadStats.addEventListener("click", async () => {
  if (guiasStats.length < 1) {
    loader.classList.remove("d-none");
    try {
      const guiasCollection = collection(doc(db, "usuarios", idUsuario), "guias");
      const querySnapshot = await getDocs(guiasCollection);

      querySnapshot.forEach((doc) => {
        guiasStats.push(doc.data());
      });

      loader.classList.add("d-none");
      displayStats();
    } catch (error) {
      console.error("Error obteniendo las guías:", error);
    }
  } else {
    console.warn("usuarios ya cargados");
  }
});

const estadosEntregados = [
  "ENTREGADO",
  "Entregado",
  "Entrega Exitosa",
  "Entrega exitosa",
  "Entregada",
  "ENTREGADA DIGITALIZADA",
  "ENTREGADA",
];

const estadosDevueltas = [
  "ENTREGADO A REMITENTE",
  "Devuelto al Remitente",
  "DEVOLUCION",
  "CERRADO POR INCIDENCIA, VER CAUSA",
];

const estadoAnuladas = ["Documento Anulado"];

function displayStats() {
  statsGlobales.classList.remove("d-none");
  const noGlobal = document.querySelector("#noGuiasGoblales");
  const noGuiasGoblalesEntregadas = document.getElementById(
    "noGuiasGoblalesEntregadas"
  );
  const noGuiasGoblalesDevueltas = document.getElementById(
    "noGuiasGoblalesDevueltas"
  );

  console.warn(guiasStats);

  const guiasAnuladas =
    guiasStats.filter((guia) => estadoAnuladas.includes(guia.estado)) || [];

  const guiasEntregas = guiasStats.filter(
    (guia) =>
      guia.estado &&
      (estadosEntregados.includes(guia.estado) ||
        guia.estado.startsWith("ENTREGADA DIGITALIZADA"))
  );

  console.warn(guiasEntregas);

  const guiasDevueltas = guiasStats.filter(
    (guia) =>
      guia.estado &&
      (estadosDevueltas.includes(guia.estado) ||
        guia.estado.startsWith("CERRADO POR INCIDENCIA"))
  );

  const guiasEnProceso =
    guiasStats.length -
    guiasEntregas.length -
    guiasDevueltas.length -
    guiasAnuladas.length;

  noGuiasGoblalesEntregadas.textContent = guiasEntregas.length;
  noGuiasGoblalesDevueltas.textContent = guiasDevueltas.length;

  noGlobal.textContent = guiasStats.length;

  const chartGlobal = document.getElementById("chart-guias-globales");

  var options = {
    title: {
      text: "Estadisticas globales",
    },
    data: [
      {
        type: "pie",
        startAngle: 45,
        showInLegend: true,
        legendText: "{label}",
        indexLabel: "{label} ({y})",
        yValueFormatString: "#,##0.#",
        dataPoints: [
          { label: "Entregadas", y: guiasEntregas.length },
          { label: "Devueltas", y: guiasDevueltas.length },
          { label: "Anuladas", y: guiasAnuladas.length || 0 },
          { label: "En Proceso", y: guiasEnProceso },
        ],
      },
    ],
  };

  var chart = new CanvasJS.Chart(chartGlobal, options);
  chart.render();

  setWeekInputs();
}

const startWeek = document.getElementById("startWeek");
const endWeek = document.getElementById("endWeek");
function loadWeek1() {
  const { startDate, endDate } = getWeekDates(startWeek.value);

  const filteredGuiasStats = guiasStats.filter((guia) => {
    const guiaDate = new Date(guia.fecha);
    return guiaDate >= startDate && guiaDate <= endDate;
  });

  const noGuiasGoblales1 = document.getElementById("noGuiasGoblales1");
  const noGuiasGoblalesEntregadas1 = document.getElementById(
    "noGuiasGoblalesEntregadas1"
  );
  const noGuiasGoblalesDevueltas1 = document.getElementById(
    "noGuiasGoblalesDevueltas1"
  );

  const totalGuias = filteredGuiasStats.length;
  const totalGuiasEntregadas = filteredGuiasStats.filter(
    (guia) =>
      guia.estado &&
      (estadosEntregados.includes(guia.estado) ||
        guia.estado.startsWith("ENTREGADA DIGITALIZADA"))
  ).length;

  const totalGuiasDevueltas = filteredGuiasStats.filter(
    (guia) =>
      guia.estado &&
      (estadosDevueltas.includes(guia.estado) ||
        guia.estado.startsWith("CERRADO POR INCIDENCIA"))
  ).length;

  const guiasAnuladas =
    filteredGuiasStats.filter(
      (guia) => guia.estado && estadoAnuladas.includes(guia.estado)
    ).length || 0;

  const guiasEnProceso =
    filteredGuiasStats.length -
    totalGuiasEntregadas -
    totalGuiasDevueltas -
    guiasAnuladas;

  noGuiasGoblales1.textContent = totalGuias;

  noGuiasGoblalesEntregadas1.textContent = totalGuiasEntregadas;

  noGuiasGoblalesDevueltas1.textContent = totalGuiasDevueltas;

  const chartLocal1 = document.getElementById("chart-guias-locales-1");

  var options;

  if (
    totalGuiasEntregadas === 0 &&
    totalGuiasDevueltas === 0 &&
    guiasAnuladas === 0
  ) {
    options = {
      title: {
        text: "No hay guías entregadas ni devueltas",
      },
      data: [
        {
          type: "pie",
          startAngle: 45,
          showInLegend: true,
          legendText: "{label}",
          indexLabel: "{label} ({y})",
          yValueFormatString: "#,##0.#",
          dataPoints: [{ label: "En Proceso", y: guiasEnProceso }],
        },
      ],
    };
  } else {
    options = {
      title: {
        text: "Estadísticas semana 1",
      },
      data: [
        {
          type: "pie",
          startAngle: 45,
          showInLegend: true,
          legendText: "{label}",
          indexLabel: "{label} ({y})",
          yValueFormatString: "#,##0.#",
          dataPoints: [
            { label: "Entregadas", y: totalGuiasEntregadas },
            { label: "Devueltas", y: totalGuiasDevueltas },
            { label: "Anuladas", y: guiasAnuladas || 0 },
            { label: "En proceso", y: guiasEnProceso },
          ],
        },
      ],
    };
  }

  // Asumiendo que ya tienes el elemento del gráfico y CanvasJS incluido
  var chart = new CanvasJS.Chart(chartLocal1, options);
  chart.render();
}
function loadWeek2() {
  const { startDate, endDate } = getWeekDates(endWeek.value);
  const filteredGuiasStats = guiasStats.filter((guia) => {
    const guiaDate = new Date(guia.fecha);
    return guiaDate >= startDate && guiaDate <= endDate;
  });

  const noGuiasGoblales1 = document.getElementById("noGuiasGoblales2");
  const noGuiasGoblalesEntregadas1 = document.getElementById(
    "noGuiasGoblalesEntregadas2"
  );
  const noGuiasGoblalesDevueltas1 = document.getElementById(
    "noGuiasGoblalesDevueltas2"
  );

  const totalGuias = filteredGuiasStats.length;
  const totalGuiasEntregadas = filteredGuiasStats.filter(
    (guia) =>
      guia.estado &&
      (estadosEntregados.includes(guia.estado) ||
        guia.estado.startsWith("ENTREGADA DIGITALIZADA"))
  ).length;

  const totalGuiasDevueltas = filteredGuiasStats.filter(
    (guia) =>
      guia.estado &&
      (estadosDevueltas.includes(guia.estado) ||
        guia.estado.startsWith("CERRADO POR INCIDENCIA"))
  ).length;

  const totalAnuladas =
    filteredGuiasStats.filter(
      (guia) => guia.estado && estadoAnuladas.includes(guia.estado)
    ).length || 0;

  const guiasEnProceso =
    filteredGuiasStats.length -
    totalGuiasEntregadas -
    totalGuiasDevueltas -
    totalAnuladas;

  noGuiasGoblales1.textContent = totalGuias;

  noGuiasGoblalesEntregadas1.textContent = totalGuiasEntregadas;

  noGuiasGoblalesDevueltas1.textContent = totalGuiasDevueltas;

  const chartLocal1 = document.getElementById("chart-guias-locales-2");

  var options;

  if (
    totalGuiasEntregadas === 0 &&
    totalGuiasDevueltas === 0 &&
    totalAnuladas === 0
  ) {
    options = {
      title: {
        text: "No hay guías entregadas ni devueltas",
      },
      data: [
        {
          type: "pie",
          startAngle: 45,
          showInLegend: true,
          legendText: "{label}",
          indexLabel: "{label} ({y})",
          yValueFormatString: "#,##0.#",
          dataPoints: [{ label: "En Proceso", y: guiasEnProceso }],
        },
      ],
    };
  } else {
    options = {
      title: {
        text: "Estadísticas semana 2",
      },
      data: [
        {
          type: "pie",
          startAngle: 45,
          showInLegend: true,
          legendText: "{label}",
          indexLabel: "{label} ({y})",
          yValueFormatString: "#,##0.#",
          dataPoints: [
            { label: "Entregadas", y: totalGuiasEntregadas },
            { label: "Devueltas", y: totalGuiasDevueltas },
            { label: "Anuladas", y: totalAnuladas },
            { label: "En proceso", y: guiasEnProceso },
          ],
        },
      ],
    };
  }

  // Asumiendo que ya tienes el elemento del gráfico y CanvasJS incluido
  var chart = new CanvasJS.Chart(chartLocal1, options);
  chart.render();
}
startWeek.addEventListener("change", () => loadWeek1());

endWeek.addEventListener("change", () => loadWeek2());

function getWeekDates(weekString) {
  const [year, week] = weekString.split("-W").map(Number);
  const firstDayOfYear = new Date(year, 0, 1);
  const daysOffset = (week - 1) * 7;
  const startDate = new Date(
    firstDayOfYear.setDate(firstDayOfYear.getDate() + daysOffset)
  );
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 6);
  return { startDate, endDate };
}

function getWeekNumber(d) {
  d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  var yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  var weekNo = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
  return [d.getUTCFullYear(), weekNo];
}

function setWeekInputs() {
  const currentDate = new Date();
  const [currentYear, currentWeek] = getWeekNumber(currentDate);

  const previousDate = new Date(currentDate);
  previousDate.setDate(currentDate.getDate() - 7);
  const [previousYear, previousWeek] = getWeekNumber(previousDate);

  const formatWeek = (year, week) =>
    `${year}-W${week.toString().padStart(2, "0")}`;

  document.getElementById("startWeek").value = formatWeek(
    currentYear,
    previousWeek
  );
  document.getElementById("endWeek").value = formatWeek(
    previousYear,
    currentWeek
  );
  const maxWeek = formatWeek(currentYear, currentWeek);

  document.getElementById("endWeek").setAttribute("max", maxWeek);
  document.getElementById("startWeek").setAttribute("max", maxWeek);

  loadWeek1();
  loadWeek2();
}
let weeklyStats = [];

const startWeekInputGlobal = document.getElementById("startWeekGlobalStats");

window.addEventListener("hashchange", async () => {
  if (window.location.hash === "#stats") {
    await loadGlobalStats();
  }
});

document.addEventListener("DOMContentLoaded", async () => {
  if (window.location.hash === "#stats") {
    await loadGlobalStats();
  }
});

function setMaxDate() {
  const currentDate = new Date();
  const [currentYear, currentWeek] = getWeekNumber(currentDate);

  const previousDate = new Date(currentDate);
  previousDate.setDate(currentDate.getDate() - 7);

  const formatWeek = (year, week) =>
    `${year}-W${week.toString().padStart(2, "0")}`;

  startWeekInputGlobal.value = formatWeek(currentYear, currentWeek);
  const maxWeek = formatWeek(currentYear, currentWeek);

  startWeekInputGlobal.setAttribute("max", maxWeek);
}

startWeekInputGlobal.addEventListener("change", async () => {
  await historialGuiasAdmin2();

  renderWeeklyStats();
});

// const week = startWeekInputGlobal.value;
// const { startDate, endDate } = getWeekDates(week);

const globalGuidesStats = document.getElementById("display-global-stats");

async function loadGlobalStats() {
  setMaxDate();
  console.log(weeklyStats.length);
  if (weeklyStats.length === 0) {
    await historialGuiasAdmin2();
    console.warn(weeklyStats);

    renderWeeklyStats();
  } else {
    console.warn("Ya se cargaron las guías de la semana");
  }
}

async function historialGuiasAdmin2() {
  console.warn("buscando guias");
  const referencia = doc(db, "infoHeka", "novedadesMensajeria");
  const limiteConsulta = 10e3;

  const { lista: listacategorias } = await getDoc(referencia).then((d) => {
    if (d.exists()) return d.data();
  });
  let categorias = listacategorias || [];

  const week = startWeekInputGlobal.value;
  const { startDate, endDate } = getWeekDates(week);

  const fecha_inicio = new Date(startDate).setHours(0);
  const fecha_final = new Date(endDate).setHours(0);
  const filtroActual = null;
  const tipoFiltro = "--Seleccione tipo de filtro --";
  console.warn(fecha_inicio, fecha_final);

  globalGuidesStats.classList.add("d-none");
  $("#loading-global-stats").removeClass("d-none");
  let data = [];
  const manejarInformacion = (querySnapshot) => {
    const s = querySnapshot.size;
    console.warn("numero de guias generadas encontrados ", s);

    querySnapshot.forEach((doc) => {
      const guia = doc.data();

      guia.transpToShow = doc.data().oficina
        ? guia.transportadora + "-Flexii"
        : guia.transportadora;

      let tituloEncontrado = null;

      tituloEncontrado = categorias.find(
        (categoria) => categoria.novedad == guia.estado
      )?.categoria;

      if (tituloEncontrado !== null) {
        guia.categoria = tituloEncontrado;
      }

      let condicion = true;

      switch (tipoFiltro) {
        case "filt_3":
        case "filt_4":
          condicion = guia.centro_de_costo
            .toUpperCase()
            .includes(filtroActual.toUpperCase());
          break;

        case "filt_5":
          condicion =
            !guia.deleted && // Se captura entre las que no fueron eliminadas
            guia.deuda != 0 && // Solamente se va a tomar aquellas que no tengan deuda
            guia.numeroGuia && // Debe también tener número de guía
            guia.estado; // Debe tener un estado presente
          break;

        default:
          condicion = true;
      }

      if (condicion) data.push(guia);
    });
  };

  let reference = collectionGroup(db, "guias");

  reference = query(
    reference,
    orderBy("timeline"),
    startAt(fecha_inicio),
    endAt(fecha_final)
  );

  const referenceAlt = collectionGroup(db, "guias");

  if (tipoFiltro === "filt_1") {
    const segementado = segmentarArreglo(filtroPagoSeleccionado, 10);
    for await (const paquete of segementado) {
      await getDocs(query(reference, where("centro_de_costo", "in", paquete)))
        .then(manejarInformacion);
    }
  } else if (tipoFiltro === "filt_2") {
    await getDocs(query(reference, where("transportadora", "==", filtroTransp)))
      .then(manejarInformacion);
  } else if (tipoFiltro === "filt_3") {
    await getDocs(query(reference, where("centro_de_costo", "==", filtroActual)))
      .then(manejarInformacion);
  } else if (tipoFiltro === "filt_4") {
    await getDocs(query(reference, where("type", "==", filtroActual)))
      .then(manejarInformacion);
  } else if (tipoFiltro === "filt_5") {
    await getDocs(query(referenceAlt, where("debe", "<", 0)))
      .then(manejarInformacion);
  } else {
    await recursividadPorReferencia(reference, manejarInformacion, limiteConsulta);
  }

  weeklyStats = data;
}

function renderWeeklyStats() {
  const nombresEmpresas = weeklyStats.map((stat) => stat.nombre_empresa);

  const conteoEmpresas = nombresEmpresas.reduce((acc, nombre) => {
    acc[nombre] = (acc[nombre] || 0) + 1;
    return acc;
  }, {});

  // Convertir el objeto en un array de objetos con las propiedades nombre_empresa y no_envios
  const standing = Object.entries(conteoEmpresas).map(
    ([nombre_empresa, no_envios]) => ({
      nombre_empresa,
      no_envios,
    })
  );
  standing.sort((a, b) => b.no_envios - a.no_envios);

  console.log(standing);

  globalGuidesStats.classList.remove("d-none");
  $("#loading-global-stats").addClass("d-none");
  const tablaGlobalStats = document.getElementById("tabla-global-stats");

  const spanElement = document.querySelector(".total-guias-globales");

  spanElement.textContent = weeklyStats.length;

  if (tablaGlobalStats) {
    // Agregar la posición (standing) a cada objeto en el array standing
    standing.forEach((item, index) => {
      item.standing = index + 1;
    });

    const table = $("#tabla-global-stats").DataTable({
      destroy: true,
      data: standing,
      columns: [
        {
          data: "standing",
          title: "Posición",
          defaultContent: "N/A",
        },
        {
          data: "nombre_empresa",
          title: "Seller",
          defaultContent: "Indeterminado",
        },
        {
          data: "no_envios",
          title: "Número de Envios esta Semana",
          defaultContent: "Sin Envios",
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
      pageLength: 30,
      order: [[2, "desc"]], // Ordenar por la tercera columna (no_envios) de mayor a menor
    });
  } else {
    console.error(
      "El elemento con el ID 'tabla-global-stats' no existe en el DOM."
    );
  }
}
