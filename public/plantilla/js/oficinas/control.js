export const inputDoc = $("#buscador_oficinas-documento");
export const mostrario = $("#mostrador-oficinas");



class Oficinas {
 
    set agregarTodas(oficinas) {
        this.oficinas = oficinas;
        this.render();
    }

    render() {
        mostrario.html("");
        this.oficinas.forEach(ofi => {
            const oficina = mostrarOficinas(ofi, ofi.id);
            mostrario.append(oficina);
        });
    }
    
}

export const oficinaController = new Oficinas();