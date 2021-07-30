import ciudades from "./ciudades.js";


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
        a.classList.add("m-2", "card", "border", "border-info")
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
                "' data-frecuencia='" + arr[i].frecuencia +"' data-tipo_distribucion='" + arr[i].tipo_distribucion + "'/>";
            b.addEventListener("click", function(e) {
                inp.value = this.getElementsByTagName("input")[0].value;
                inp.dataset.id = this.getElementsByTagName("input")[0].getAttribute("data-id");
                inp.dataset.tipo_trayecto = this.getElementsByTagName("input")[0].dataset.tipo_trayecto;
                inp.dataset.ciudad = this.getElementsByTagName("input")[0].getAttribute("data-ciudad");
                inp.dataset.departamento = this.getElementsByTagName("input")[0].getAttribute("data-departamento");
                inp.dataset.frecuencia = this.getElementsByTagName("input")[0].getAttribute("data-frecuencia");
                inp.dataset.tipo_distribucion = this.getElementsByTagName("input")[0].getAttribute("data-tipo_distribucion");
                closeAllLists();
            });
            b.addEventListener("mouseenter", (e) => {
              e.target.classList.add("p-1", "m-2", "bg-info", "bg-gradient", "text-white", "rounded-pill")
              e.target.addEventListener("mouseleave", () =>{
                e.target.classList.remove("p-1", "m-2", "bg-info", "bg-gradient", "text-white", "rounded-pill")
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
            x[currentFocus].classList.add("p-1", "m-2", "bg-info", "bg-gradient", "text-white", "rounded-pill")
          }
          if(typeof x[currentFocus - 1] !== "undefined"){
            x[currentFocus - 1].classList.remove("p-1", "m-2", "bg-info", "bg-gradient", "text-white", "rounded-pill")
          }
          
          addActive(x);
        } else if (e.keyCode == 38) { 
          currentFocus--;
          if(typeof x[currentFocus] !== "undefined"){
            x[currentFocus].classList.add("p-1", "m-2", "bg-info", "bg-gradient", "text-white", "rounded-pill")
          }
          if(typeof x[currentFocus + 1] !== "undefined"){
            x[currentFocus + 1].classList.remove("p-1", "m-2", "bg-info", "bg-gradient", "text-white", "rounded-pill")
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


globalThis.consultarCiudades = (inp, ciudades) => {
  autocomplete(inp, ciudades)
}
autocomplete(document.getElementById("ciudadR"), ciudades);
autocomplete(document.getElementById("ciudadD"), ciudades);
autocomplete(document.getElementById("actualizar_ciudad"), ciudades);
autocomplete(document.getElementById("CPNciudad"), ciudades);
autocomplete(document.getElementById("CEdireccion"), ciudades);
autocomplete(document.getElementById("ciudad-tienda"), ciudades);