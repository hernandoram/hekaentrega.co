const botonIninicarSesionUsarioToken = document.getElementById(
  "boton-iniciar-sesion-usuario-token"
);

botonIninicarSesionUsarioToken.addEventListener("click", async function () {
  // Mostrar animación de carga
  botonIninicarSesionUsarioToken.innerHTML = "Cargando...";

  const tokenAdmin = localStorage.getItem("token");

  let tokenUser;
  const data = {
    email: value("actualizar_correo"),
    channel: 'hekaentrega',
  };

  fetch(PROD_API_URL + "/api/v1/user/login/uli", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${tokenAdmin}`,
    },
    body: JSON.stringify(data),
  })
    .then((response) => response.json())
    .then((data) => {
      console.log(data);
      tokenUser = data.response.token;

      if (data.statusCode === 403) {
        throw new Error("Invalid API response");
      }

      let urlBase;

      let textToCopy;
      if (window.location.hostname === "localhost") {
        urlBase = "http://localhost:6200";
        textToCopy = `${urlBase}/plataforma2.html?token=${tokenUser}`;
      } else {
        urlBase = "https://prod.hekaentrega.co";
        textToCopy = `${urlBase}/ingreso?token=${tokenUser}`;
      }
      // Copiar la URL al portapapeles
      navigator.clipboard.writeText(textToCopy).then(function () {
        // Cambiar el texto del botón a 'URL copiada correctamente'
        botonIninicarSesionUsarioToken.innerHTML = "URL copiada correctamente";

        setTimeout(() => {
          botonIninicarSesionUsarioToken.innerHTML = "Ingresar al usuario";
        }, 5000);
      });
    })
    .catch((error) => {
      botonIninicarSesionUsarioToken.innerHTML =
        "Error de credenciales, cierra sesión e intenta de nuevo";
      console.error("Error:", error);
    });
});
