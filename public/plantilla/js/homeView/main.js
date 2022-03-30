
import "https://unpkg.com/swiper@7/swiper-bundle.min.js";
import CreateModal from "../utils/modal.js";
const inicio = () => CarrucelVideos();

const CarrucelVideos = () => {
  const registroHeka = document.querySelector("#registroHeka")
  const novedadesEnvios = document.querySelector("#novedadesEnvios")
  const cuentaBancaria = document.querySelector("#registrarCuentaBancaria")
  const cotizacionGuias = document.querySelector("#cotizacionGuias")
  const crearBodegas = document.querySelector("#creacionDeBodegas")

  datosModal(registroHeka, "https://www.youtube.com/embed/dLCJCvS7uWg?&autoplay=1", "Registro - Heka Entrega", "En este vídeo te enseñamos a como realizar el registro en nuestra plataforma de Heka Entrega.");
  datosModal(novedadesEnvios, "https://www.youtube.com/embed/n6RpNdMThic?&autoplay=1", "¿Como saber las novedades de tus envíos?", "En este vídeo te enseñamos a gestionar tus novedades en nuestra plataforma de Heka Entrega.");
  datosModal(cuentaBancaria, "https://www.youtube.com/embed/518tJQRPlXI?&autoplay=1", "Registro de cuenta bancaria", "En este vídeo te enseñamos a como registrar tu cuenta bancaria en nuestra plataforma de Heka Entrega.");
  datosModal(cotizacionGuias, "https://www.youtube.com/embed/5tNUhNONIG4?&autoplay=1", "Cotización y creación de guías", "En este vídeo te enseñamos a generar tus guias en nuestra plataforma de Heka Entrega.");
  datosModal(crearBodegas, "https://www.youtube.com/embed/ht54UmniYk0?&autoplay=1", "Registrar una bodega.", "En este vídeo te enseñamos a como registrar una bodega en nuestra plataforma de Heka Entrega.");
  
  new Swiper(".mySwiper", {
    slidesPerView: 2,
    spaceBetween: 10,
    freeMode: true,
    breakpoints: {
      // when window width is >= 480px
      480: {
        slidesPerView: 3,
        spaceBetween: 15
      },
      // when window width is >= 640px
      640: {
        slidesPerView: 4,
        spaceBetween: 15
      },
      1024: {
        slidesPerView: 5,
        spaceBetween: 15
      },
      1300: {
        slidesPerView: 6,
        spaceBetween: 15
      },
      1440: {
        slidesPerView: 7,
        spaceBetween: 15
      },
      1900: {
        slidesPerView: 10,
        spaceBetween: 15
      }
    }
  });
}

const datosModal = (video, link, titulo, decripcion) => { 
  const modal = new CreateModal({
    title: "<h4>"+titulo+"</h4>",
    modalSize: "modal-xl",
  }); 
  const videoId = link.match(/(\/)([^#&\/]+)(\?)/)[2] || link;

//   video.querySelector("img").setAttribute("src", `http://img.youtube.com/vi/${videoId}/0.jpg`);
  video.addEventListener("click", (e) => {
    e.preventDefault();
    modal.init = `
      <div class="d-flex justify-content-center">
      <iframe class="videoYoutube w-100" src=${link} title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
      </div>
    `;
  })
}
export default inicio;
