
export default class {
    constructor(container, opts = {}) {
        this.anotaciones = [];
        this.container = container;
        this.opts = opts;
    }

    init() {
        this.container.html("");
        this.setTitle();
        this.setContent();
    }

    addError(error, btnConfig) {
        const li = document.createElement("li");
        li.setAttribute("class", "list-group-item list-group-item-danger d-flex align-items-center justify-content-between");

        li.innerHTML = error;
        this.content.appendChild(li);
        
        if(btnConfig) {
            const button = document.createElement("button");
            button.setAttribute("class", "btn btn-"+btnConfig.color);
            button.innerHTML = btnConfig.text;
            button.onclick = btnConfig.onClick;
            li.appendChild(button);
        }
    }

    setTitle() {
        const header = document.createElement("h3");
        header.innerHTML = this.opts.title || "Anotaciones";
        header.classList.add("text-center");

        this.container.append(header);
    }

    setContent() {
        this.content = document.createElement("ul");
        content.setAttribute("class", "list-group");

        this.container.append(this.content);
    }

}