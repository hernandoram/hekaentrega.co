function mostrar(id) {
    let content = document.getElementById("viewer").children;

    if(id == "" || !window.top[id]){
        dNone(content);
        content[0].style.display = "block"
        let firstItem = $(".nav-item:first").addClass("active");
    } else {
        if(window.top[id].classList[0] == "view") {
            dNone(content);
            content[id].style.display = "block"
            $(".nav-item, .collapse-item").removeClass("active");
            
            let item = $("[href='#"+id+"']");
            item.parents(".nav-item").addClass("active");
            if(item.hasClass("collapse-item")) item.addClass("active");
        } else if (window.top[id].classList[0] == "container" || 
        window.top[id].nodeName == "BODY") {

        } else {
            mostrar(window.top[id].parentNode.getAttribute("id"))
        }
    }

}

//Función invocada desde mostrar() para ocultar todos los elementos principales
function dNone(content) {
    for(let i = 0; i < content.length; i++){
        content[i].style.display = "none";
    }
}

// revisar este evento onhaschange
window.onload = mostrar(window.location.hash.replace(/#/, ""));
window.addEventListener("hashchange", () => {
    mostrar(window.location.hash.replace(/#/, ""));
})