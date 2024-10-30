
export default class {
    constructor(container, opts = {}) {
        this.anotaciones = [];
        this.container = container;
        this.opts = opts;
    }

    /**
     * La función init borra el contenedor, establece el título y establece el contenido.
     */
    init() {
        this.reset();
        this.setTitle();
        this.setContent();
    }

    /**
     * La función `addError` agrega un mensaje de error a una lista y actualiza un contador.
     * @param error - El parámetro de error es una cadena que representa el mensaje de error que se
     * mostrará en el elemento de la lista.
     * @param [config] - El parámetro `config` es un objeto que contiene opciones de configuración para
     * el mensaje de error. Puede tener las siguientes propiedades:
     *  - Color: Representa el naombre del color de bootstrap ej. warning
     * @param btnConfig - El parámetro `btnConfig` es un objeto opcional que contiene opciones de
     * configuración para un botón que se puede agregar al elemento de la lista de errores. Tiene las
     * siguientes propiedades:
     *  - Color: Representa el naombre del color de bootstrap ej. warning
     *  - text: El texto que será mostrado
     *  - onclick: La función que llevará el botón cuando se presione
     */
    addError(error, config = {}, btnConfig) {
        const li = document.createElement("li");
        const {color} = config;
        li.setAttribute("class", `list-group-item list-group-item-${color || "danger"} d-flex align-items-center justify-content-between`);

        li.innerHTML = error;
        this.anotaciones.push(error);
        this.content.appendChild(li);
        
        if(btnConfig) {
            const button = document.createElement("button");
            button.setAttribute("class", "btn btn-"+btnConfig.color);
            button.innerHTML = btnConfig.text;
            button.onclick = btnConfig.onClick;
            li.appendChild(button);
        }

        $(".anotaciones>.counter").text("("+this.anotaciones.length+")")
    }

    setTitle() {
        const header = document.createElement("h3");
        header.innerHTML = (this.opts.title || "Anotaciones") + " <span class='ml-2 counter'></span>";
        header.classList.add("text-center", "anotaciones");

        this.container.append(header);
    }

    setContent() {
        this.content = document.createElement("ul");
        this.content.setAttribute("class", "list-group");

        this.container.append(this.content);
    }

    reset() {
        this.container.html("");
    }

}