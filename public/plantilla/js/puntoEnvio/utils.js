
function geocodeLocation(request) {
    const geocoder = new google.maps.Geocoder();

    return geocoder.geocode(request)
    .then((result) => {
      const { results } = result;

      return results[0].geometry.location;
    })
    .catch((e) => {
      alert("No se ha podido establecer la dirección de : " + request.address + ", Por la siguiente causa: " + e);
    });
}

export {geocodeLocation}
