const fs = require("fs");

class MaquetadorXML {
    constructor(path) {
        this.path = path;
        this._structure = fs.readFileSync(this.path, {
            encoding: "UTF-8"
        });

        this.lectura = this._structure;
    }

    maqueta(tipo) {
        const regexp = new RegExp(`<!--${tipo}-->(?<${tipo}>[^#]+)<!--#END ${tipo}-->`);
        this.lectura = this._structure.match(regexp).groups[tipo];

        return this;
    }

    fill(info) {
        const regexp = /\{([\w]+)\}/g;
        let respuesta = this.lectura
        // .replaceAll(/>(\n|\r|\t|\s|)+<|<!.+>/g, "")
        .replaceAll(/<!.+>/g, "");

        let exp, c = 0;
        while(exp = regexp.exec(respuesta)) {
            c++;
            if(c >= 100) throw new Error("Alerta de bucle infinito");

            const [expresion, item] = exp;

            const valor = info[item];
            respuesta = respuesta.replace(expresion, valor === undefined ? "" : valor);
            
        }

        return respuesta
    }

    get leer() {
        return this.lectura;
    }
}

module.exports = MaquetadorXML;