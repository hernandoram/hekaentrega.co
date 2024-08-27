import ciudades from "../data/ciudades.js";
import { v1 } from "./config/api.js";


//Funcion de autocompletado de las ciudades en los inputs de ciudad (Solo funciona en este Script)
function autocomplete(inp, arr) {
  var currentFocus;
  if(inp) {
    //Agrega el envento escucha al elemento ingresado
    inp.addEventListener("input", function(e) {
      let ciudades1 = []
      var a, b, i, val = this.value;
      closeAllLists();

      if (!val) { return false;}

      currentFocus = -1;
      a = document.createElement("DIV");
      a.setAttribute("id", this.id + "autocomplete-list");
      a.setAttribute("class", "autocomplete-items");
      a.classList.add("m-2", "py-2", "card", "border", "border-info")
      this.parentNode.appendChild(a);

      // Recorre el arreglo introducido
      for (i = 0; i < arr.length; i++) {
        let value = arr[i].ciudad +"("+arr[i].departamento +")";
        if (value.substr(0, val.length).toUpperCase() == val.toUpperCase()) {
          b = document.createElement("DIV");
          b.innerHTML = "<strong class='ml-3'>" + value.substr(0, val.length) + "</strong>";
          b.innerHTML += value.substr(val.length);
          b.innerHTML += "<input type='hidden' value='" + value + 
              "' data-id='" + arr[i].id + "' data-tipo_trayecto='" + arr[i].tipo_trayecto + 
              "' data-ciudad='"+ arr[i].ciudad +"' data-departamento='" + arr[i].departamento +
              "' data-frecuencia='" + arr[i].frecuencia +"' data-tipo_distribucion='" + arr[i].tipo_distribucion + 
              "' data-dane_ciudad='" + arr[i].dane_ciudad + 
              "' data-nombre_aveo='" + arr[i].nombreAveo + "'/>";
          b.addEventListener("click", function(e) {
            const selected = this.getElementsByTagName("input")[0]
            inp.value = selected.value;
            for(let camp in selected.dataset) {
              inp.dataset[camp] = selected.dataset[camp];
            };

            closeAllLists();
          });
          b.addEventListener("mouseenter", (e) => {
            e.target.classList.add("p-1", "mx-2", "bg-info", "bg-gradient", "text-white", "rounded-pill")
            e.target.addEventListener("mouseleave", () =>{
              e.target.classList.remove("p-1", "mx-2", "bg-info", "bg-gradient", "text-white", "rounded-pill")
            })
          })
          a.appendChild(b);
        }
      }
    });
    
    inp.addEventListener("keydown", function(e) {
      var x = document.getElementById(this.id + "autocomplete-list");
      if (x) x = x.getElementsByTagName("div");
      if (e.keyCode == 40) {
        currentFocus++;
        if(typeof x[currentFocus] !== "undefined"){
          x[currentFocus].classList.add("p-1", "mx-2", "bg-info", "bg-gradient", "text-white", "rounded-pill")
        }
        if(typeof x[currentFocus - 1] !== "undefined"){
          x[currentFocus - 1].classList.remove("p-1", "mx-2", "bg-info", "bg-gradient", "text-white", "rounded-pill")
        }
        
        addActive(x);
      } else if (e.keyCode == 38) { 
        currentFocus--;
        if(typeof x[currentFocus] !== "undefined"){
          x[currentFocus].classList.add("p-1", "mx-2", "bg-info", "bg-gradient", "text-white", "rounded-pill")
        }
        if(typeof x[currentFocus + 1] !== "undefined"){
          x[currentFocus + 1].classList.remove("p-1", "mx-2", "bg-info", "bg-gradient", "text-white", "rounded-pill")
        }

        addActive(x);
      } else if (e.keyCode == 13) {
        
        e.preventDefault();
        if (currentFocus > -1) {
          
          if (x) x[currentFocus].click();
        }
      }
    });

    function addActive(x) {
      if (!x) return false;
      removeActive(x);
      if (currentFocus >= x.length) currentFocus = 0;
      if (currentFocus < 0) currentFocus = (x.length - 1);
      
      x[currentFocus].classList.add("autocomplete-active");
    }
    
    function removeActive(x) {
      for (var i = 0; i < x.length; i++) {
        x[i].classList.remove("autocomplete-active");
      }
    }

    function closeAllLists(elmnt) {
      var x = document.getElementsByClassName("autocomplete-items");
      for (var i = 0; i < x.length; i++) {
        if (elmnt != x[i] && elmnt != inp) {
          x[i].parentNode.removeChild(x[i]);
        }
      }
    }
  
    document.addEventListener("click", function (e) {
        closeAllLists(e.target);
    });
  }
}


globalThis.consultarCiudades = (inp, cities = ciudades) => {
  autocomplete(inp, cities)
}

autocomplete(document.getElementById("ciudadR-flexii"), ciudades);
autocomplete(document.getElementById("ciudadD-flexii"), ciudades);
// autocomplete(document.getElementById("ciudadR"), ciudades);
// autocomplete(document.getElementById("ciudadD"), ciudades);
autocomplete(document.getElementById("actualizar_ciudad"), ciudades);
autocomplete(document.getElementById("CPNciudad"), ciudades);
autocomplete(document.getElementById("CEdireccion"), ciudades);
autocomplete(document.getElementById("ciudad-tienda"), ciudades);
autocomplete(document.getElementById("ciudad-oficina"), ciudades);

// Activando las funciones del Selectize
const optionActivation = {
  options: [],
  optgroups: [],

  load: function(query, callback) {
    const clearCharger = () => $(".selectize-charger", this.$control).remove();

    // El usuario tiene que ingresar al menos dos carácteres, para que comience la busqueda al api
    // y se active este controlador
    if(query.length < 3) {
      clearCharger();
      return;
    }

    const charger = `<small class="ml-3 selectize-charger">
      <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
      Cargando...
    </small>`;

    this.$control.append(charger);
    
    searchAndRenderCitiesOnLoad(this, query, callback)
    .finally(() => clearCharger());

  },
  optgroupField: "departamento", // Para agrupar por departamente
  labelField: "ciudad", // el label de lo que se le muestra al usuario por cada opción
  valueField: "dane", // el valor que será guardado, una vez el lusuario seleccione dicha opción
  searchField: ["ciudad"], // El criterio de filtrado para el input
  sortField: 'ciudad' // Para organizar en orden alfabético por ciudad
};

const $ciudadR = $("#ciudadR");
const $ciudadD = $("#ciudadD");

if($ciudadR.length)
  $ciudadR.selectize(optionActivation);

if($ciudadD.length)
  $ciudadD.selectize(optionActivation);

// Los agrupamos todos en un objeto, para llamarlos individualmente en los módulos
const selectize = {
  ciudadR: $ciudadR.length ? $ciudadR[0].selectize : null,
  ciudadD: $ciudadD.length ? $ciudadD[0].selectize : null
}

/**
 * La función obtiene datos de la ciudad basándose en una consulta, consolidandolas de una forma que pueda
 * ser utilizado fácilmente por la parametrización impuesta en la librería "selectize"
 * @param elSelectize - Tiene que ser un elemento del tipo "selectize" para que pueda efectuar la agrupación
 * por departamentos
 * @param query - El parámetro "query" en la función "searchAndGroupCity" se utiliza para buscar
 * ciudades según la entrada proporcionada por el usuario. La función obtiene datos de la ciudad desde
 * un punto final API específico según la cadena de consulta proporcionada.
 * @returns La función `searchAndGroupCity` devuelve una promesa que se resuelve en una serie de
 * objetos que contienen información de la ciudad, como el nombre de la ciudad, el código dane y el
 * departamento.
*/
async function searchAndGroupCity(elSelectize, query) {
  return fetch(v1.cities + '?label=' + query + "&limit=25")
  .then(res => res.json())
  .then(d => {
    const ciudades = d.response.map(c => {
      const dep = c.state.label;
      if(!elSelectize.optgroups[dep]) {
        elSelectize.addOptionGroup(dep, {label: dep, value: dep});
      }

      const response = {ciudad: c.label, dane: c.dane, departamento: dep};
      return response;
    });

    return ciudades;
  });
}

/**
 * Utiliza la busqueda de ciudades para agrupar y finalmente renderizar las ciudades obtenidas del api 
 * con los parámetros que ingresó el usuario
 */
async function searchAndRenderCitiesOnLoad(elSelectize, query, callback) {
  return searchAndGroupCity(elSelectize, query)
  .then(callback)
  .catch(() => callback());
}

/** Esta función es más sitemática ( no sería activada por los usuarios), que consiste en
 * precargar las ciudades ( por fuera de las configuraciones del selectize ), para que se actualicen desde afuera
 * presenvando la busqueda y la configuración que utiliza el selectize de fondo
 */
async function searchAndRenderCities(elSelectize, query) {
  if(elSelectize.loadedSearches[query])
    return;

  // Se marca lo que se está buscando para evitar que se consulte al api a cada momento
  elSelectize.loadedSearches[query] = true;

  searchAndGroupCity(elSelectize, query)
  .then((cities) => {
    cities.forEach(c => {
      elSelectize.addOption(c);
    });
  })
  .catch(e => {
    console.log("No se han podido cargar las ciudades ", e.message);

    // Si genera error la búsqueda, simplemente se elimina la propiedad
    // para que cuando el cliente vuelva a ingresarla manual, trate de hacer la búsqueda nuevamente
    delete elSelectize.loadedSearches[query];
  });
}

export default autocomplete

export {ciudades, searchAndRenderCities, selectize}