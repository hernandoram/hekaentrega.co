const hekaBrand = {
  nombre: "HEKA",
  cod: "H001",
  nombre_completo: "Heka Entrega",
  cel_area_comercial: "+57 312 463 8608",
  correo: " atencion@hekaentrega.co",
  hosts: "hekaentrega.co",
  dominios: ["hekaentrega.co", "www.flehekaentregaxi.co"],
  index: "/",
};

const flexxiBrand = {
  nombre: "FLEXII",
  cod: "F001",
  nombre_completo: "Flexii",
  cel_area_comercial: "+57 312 463 8608",
  correo: " atencion@flexii.co",
  hosts: "flexii.co",
  dominios: ["flexii.co", "www.flexi.co"],
  index: "/",
};

const localBrand = {
  nombre: "LOCAL",
  cod: "L001",
  nombre_completo: "Local Host",
  cel_area_comercial: "+57 312 463 8608",
  correo: " atencion@local.co",
  hosts: "localhost:6200",
  dominios: ["localhost:6200"],
  index: "/",
};

const brands = [hekaBrand, flexxiBrand, localBrand];

hostnameReader();
function hostnameReader() {
  const hostname = window.location.host;
  const pageTitle = $("#pageTitle");
  const indexLink = $(".indexLink");
  const element = $(".copyrightWord");
  const brandName = $("#brandName");
  const correoAtencionCliente = $(".correo-atencion");
  // Buscamos el objeto de la empresa que alguno de los dominios coincida con el actual
  // Si no detecta uno, utiliza el de heka por defecto
  const brand = brands.find((b) => b.dominios.includes(hostname)) || hekaBrand;

  // Una vez que se tengan los cambios, se toma en cuenta los valores de la marca obtenida
  pageTitle.text(brand.nombre_completo);
  indexLink.attr("href", brand.index);
  element.text(brand.nombre_completo);
  brandName.text(brand.nombre);
  correoAtencionCliente.text(brand.correo);
  correoAtencionCliente.attr("href", "mailto:" + brand.correo);
}
