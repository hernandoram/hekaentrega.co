/** @format */

// import "https://unpkg.com/swiper@7/swiper-bundle.min.js";
import CreateModal from "../utils/modal.js";
import {
  db,
  doc,
  getDoc,
  setDoc,
} from "/js/config/initializeFirebase.js";


const inicio = () => CarrucelVideos();

const userid = localStorage.getItem("user_id");
const encuesta = localStorage.getItem("encuesta");

const CarrucelVideos = () => {
  const registroHeka = document.querySelector("#registroHeka");
  const novedadesEnvios = document.querySelector("#novedadesEnvios");
  const cuentaBancaria = document.querySelector("#registrarCuentaBancaria");
  const cotizacionGuias = document.querySelector("#cotizacionGuias");
  const crearBodegas = document.querySelector("#creacionDeBodegas");
  const revisarPagos = document.querySelector("#revisarPagos");

  datosModal(
    registroHeka,
    "https://www.youtube.com/embed/dLCJCvS7uWg?&autoplay=1",
    "Registro - Heka Entrega",
    "En este vídeo te enseñamos a como realizar el registro en nuestra plataforma de Heka Entrega."
  );
  datosModal(
    novedadesEnvios,
    "https://www.youtube.com/embed/n6RpNdMThic?&autoplay=1",
    "¿Como saber las novedades de tus envíos?",
    "En este vídeo te enseñamos a gestionar tus novedades en nuestra plataforma de Heka Entrega."
  );
  datosModal(
    cuentaBancaria,
    "https://www.youtube.com/embed/518tJQRPlXI?&autoplay=1",
    "Registro de cuenta bancaria",
    "En este vídeo te enseñamos a como registrar tu cuenta bancaria en nuestra plataforma de Heka Entrega."
  );
  datosModal(
    cotizacionGuias,
    "https://www.youtube.com/embed/5tNUhNONIG4?&autoplay=1",
    "Cotización y creación de guías",
    "En este vídeo te enseñamos a generar tus guias en nuestra plataforma de Heka Entrega."
  );
  datosModal(
    crearBodegas,
    "https://www.youtube.com/embed/ht54UmniYk0?&autoplay=1",
    "Registrar una bodega.",
    "En este vídeo te enseñamos a como registrar una bodega en nuestra plataforma de Heka Entrega."
  );
  datosModal(
    revisarPagos,
    "https://www.youtube.com/embed/ACorbrGDJZo?&autoplay=1",
    "Revisar pagos.",
    "En este vídeo te enseñamos a cómo realizar la revisión de tus pagos en la plataforma de Heka entrega."
  );

  new Swiper(".mySwiper", {
    slidesPerView: 2,
    spaceBetween: 10,
    freeMode: true,
    breakpoints: {
      // when window width is >= 480px
      480: {
        slidesPerView: 3,
        spaceBetween: 15,
      },
      // when window width is >= 640px
      640: {
        slidesPerView: 4,
        spaceBetween: 15,
      },
      1024: {
        slidesPerView: 5,
        spaceBetween: 15,
      },
      1300: {
        slidesPerView: 6,
        spaceBetween: 15,
      },
      1440: {
        slidesPerView: 7,
        spaceBetween: 15,
      },
      1900: {
        slidesPerView: 10,
        spaceBetween: 15,
      },
    },
  });
};

const datosModal = (video, link, titulo, descripcion) => {
  const modal = new CreateModal({
    title: "<h4>" + titulo + "</h4>",
    modalSize: "modal-xl",
  });
  const videoId = link.match(/(\/)([^#&\/]+)(\?)/)[2] || link;

  video
    .querySelector("img")
    .setAttribute("src", `http://img.youtube.com/vi/${videoId}/0.jpg`);
  video.addEventListener("click", (e) => {
    e.preventDefault();
    modal.init = `
      <h5>${descripcion}</h5>
      <div class="d-flex justify-content-center">
      <iframe class="videoYoutube w-100" src=${link} title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
      </div>
    `;

    modal.onSubmit = () => modal.close();
  });
};

// modalInicial();

function modalInicial() {
  const m = new CreateModal({
    title: "<h3>AVISO IMPORTANTE</h3>",
    modalSize: "modal-lg",
  });

  // <img src="./img/notificacionseptiembre.jpeg" style="height: 50vh"/>
  // <img src="./img/aumentoprecioservi.jpeg" style="height: 50vh"/>
  // <img src="./img/aumentoprecioservi.jpeg" style="height: 50vh"/>
  //    <img src="./img/Error-inter.jpg" style="height: 50vh"/>

  m.init = `
  <div class="text-center d-flex justify-content-around">

 
<h4>
Mientras se soluciona la creación de guías con Api de Interrapidisimo, <b> utilizaremos nuestro sistema POS para crear guías manuales </b>, por favor comunicarse al número <a target="_blank" href="https://wa.link/0f6bn8">3112350856 </a>   Para solicitar usuario manual y poder crear guías pos para despachar con Interrapidisimo
</h4>

    </div>
  `;
  m.onSubmit = () => {
    if (encuesta == "true") {
      m.close();
    } else {
      getDoc(doc(db, "encuestaCoordi", userid)).then((doc) => {
        if (doc.exists()) {
          m.close();
        } else {
          m.close();
          // modalInicial2();
        }
      });
    }
  };
}

function modalInicial2() {
  const m = new CreateModal({
    title: "<h3>Encuesta</h3>",
    modalSize: "modal-md",
  });

  m.init = `
  <div class="">
  <p>¿Actualmente utilizas Coordinadora? <br/>

  <p/>
  <form method="post">
    <p>
      <input type="radio" id="si" name="opciones" value="si">
      <label for="si">Si</label>
    </p>
    <p>
      <input type="radio" id="no" name="opciones" value="no">
      <label for="no">No</label>
    </p>


  <p class="p-si d-none">
  ¿Qué te ha gustado de la transportadora?
  </p>

  <p class="p-no d-none">
  ¿Por qué no has enviado con la transportadora? ¿Qué te detiene a implementarla?
  </p>

  <input type="text" class="d-none respuesta form-control"
  name="respuesta" id="respuesta">

  </form>

  <p class="text-danger d-none seleccion">Debes seleccionar una opción </p>
  <p class="text-danger d-none seleccion2">Debes responder la pregunta </p>

  </div>
  `;

  const si = document.getElementById("si");
  const no = document.getElementById("no");

  si.addEventListener("click", () => {
    document.querySelector(".p-si").classList.remove("d-none");
    document.querySelector(".p-no").classList.add("d-none");
    document.querySelector(".respuesta").classList.remove("d-none");
    document.querySelector(".respuesta").value = "";
    document.querySelector(".seleccion2").classList.add("d-none");
    document.querySelector(".seleccion").classList.add("d-none");
  });

  no.addEventListener("click", () => {
    document.querySelector(".p-si").classList.add("d-none");
    document.querySelector(".p-no").classList.remove("d-none");
    document.querySelector(".respuesta").classList.remove("d-none");
    document.querySelector(".respuesta").value = "";
    document.querySelector(".seleccion2").classList.add("d-none");
    document.querySelector(".seleccion").classList.add("d-none");
  });

  m.onSubmit = () => {
    let opciones = document.getElementsByName("opciones");
    let respuesta = "";
    for (var i = 0; i < opciones.length; i++) {
      if (opciones[i].checked) {
        respuesta = opciones[i].value;
        break;
      }
    }
    let respuesta2 = document.getElementById("respuesta").value;
    if (respuesta == "") {
      document.querySelector(".seleccion").classList.remove("d-none");
    } else if (respuesta2 == "") {
      document.querySelector(".seleccion").classList.add("d-none");
      document.querySelector(".seleccion2").classList.remove("d-none");
    } else {
      console.log(respuesta, respuesta2);
      setDoc(doc(db, "encuestaCoordi", userid), { respuesta, respuesta2 }).then(
        () => {
          localStorage.setItem("encuesta", true);
          avisar(
            "Gracias por tu respuesta!",
            "Nos ayudas a brindarte un mejor servicio"
          );
          m.close();
        }
      );
    }
  };
}

function cambiarTema() {
  // Obtiene el elemento :root del documento
  console.log("hola");
  var root = document.documentElement;

  // Cambia el valor de la variable --primary
  root.style.setProperty("--primary", "red");

  let navvar = document.getElementById("accordionSidebar");
  let buttons = document.querySelectorAll(".btn-primary");
  let texts = document.querySelectorAll(".text-primary");
  let brandName = document.getElementById("brandName");

  brandName.innerText = "flexii.co";

  buttons.forEach(function (button) {
    button.style.backgroundColor = "purple";
    button.style.color = "white";
  });

  texts.forEach(function (text) {
    text.style.setProperty("color", "purple", "important");
  });

  navvar.style.setProperty(
    "background-image",
    "linear-gradient(180deg, #800080 10%, #800080 100%)",
    "important"
  );
  navvar.style.setProperty("background-image", "#800080", "important");
}

if (window.location.href.includes("flexii.co", "localhost:6200")) {
  cambiarTema();
}

export default inicio;
