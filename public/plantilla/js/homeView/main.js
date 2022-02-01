
import "https://unpkg.com/swiper@7/swiper-bundle.min.js";
import CreateModal from "../utils/modal.js";
const inicio = () => CarrucelVideos();

const CarrucelVideos = () => {
  const registroHeka = document.querySelector("#registroHeka")
  const novedadesEnvios = document.querySelector("#novedadesEnvios")
  const pagosHeka = document.querySelector("#pagosHeka")
  const empaqueEmbalaje = document.querySelector("#empaqueEmbalaje")
  const cotizacionGuias = document.querySelector("#cotizacionGuias")

  datosModal(registroHeka, "https://www.youtube.com/embed/PZkQsL-XfL8?&autoplay=1", "Registro - Heka Entrega")
  datosModal(novedadesEnvios, "https://www.youtube.com/embed/ojf486HjICs?&autoplay=1", "¿Como saber las novedades de tus envíos?")
  datosModal(pagosHeka, "https://www.youtube.com/embed/ia8jx5DXKmE?&autoplay=1", "Tiempo de Pago en Heka Entrega")
  datosModal(empaqueEmbalaje, "https://www.youtube.com/embed/RHmt7uQ1gCc?&autoplay=1", "Empaque y embalaje de Mercancía")
  datosModal(cotizacionGuias, "https://www.youtube.com/embed/76x2qj-l5-Y?&autoplay=1", "Cotización, creación de guías y descarga de documentos")
  
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

const datosModal = (video, link, titulo) => { 
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
