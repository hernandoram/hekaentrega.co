// import "https://unpkg.com/swiper@7/swiper-bundle.min.js";
import CreateModal from "../utils/modal.js";
const inicio = () => CarrucelVideos();

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

modalInicial();

function modalInicial() {
  const m = new CreateModal({
    title: "<h3>Información importante!</h3>",
    modalSize: "modal-md",
  });

  m.init = `
  <div class="text-center">
    <img src="./img/aviso_inter_1.jpeg" style="height: 56vh"/>
    <br/>
    </div>
    </br> 
    <div class="text-center">
      <h4><b>Agradecemos tu comprensión.<b></h4>
      <br/>
    </div>
  `;

  m.onSubmit = () => {
    m.close()
    modalInicial2()
  } ;

}

function modalInicial2() {
  const m = new CreateModal({
    title: "<h3>Encuesta</h3>",
    modalSize: "modal-md",
  });

  m.init = `
  <div class="">
  <p>Heka desea implementar un sistema de solución de novedades, en el cual tenemos dos posibilidades: <br/>

  <ul>
  <li> <b> Notificaciones de WhatsApp</b>, por cada novedad producida se enviaría una notificación al destinatario con un link donde podría acceder y solucionar la novedad del envío. Siendo así un proceso automático. 
  </li>
  <br/>
  <li>
  <b> Call center</b>, para llamar a destinarlo en caso de novedad y solucionarla. 
  </li>
  <br/>
  </ul>
  ¿Cuál de las dos soluciones te gustaría que implementemos? 


  <p/>  
  <form action="procesar_formulario.php" method="post">
    <p>
      <input type="radio" id="whatsapp" name="opciones" value="whatsapp">
      <label for="whatsapp">Notificaciones de novedades por WhatsApp</label>
    </p>
    <p>
      <input type="radio" id="callcenter" name="opciones" value="callcenter">
      <label for="callcenter">CALL Center de novedades</label>
    </p>
    <input type="submit" value="Enviar">
  </form>


  </div>
  `;

  m.onSubmit = () => m.close();

}


export default inicio;

