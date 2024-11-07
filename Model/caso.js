class Caso{
    #fechaPublicacion;
    #fechahoy;
    #texto;
    #link;
    #causa;
    #juzgado;
    #porcentaje;
    #formatoEntrega;
    #fechaRemate;
    #montoMinimo;
    #multiples;
    #comuna;

    constructor(fechaHoy,fechaPublicacion,link){
        this.#fechaPublicacion = fechaPublicacion;
        this.#fechahoy = fechaHoy;
        this.#texto = '';
        this.#link = link
        this.#causa = 'N/A';
        this.#juzgado = '';
        this.#porcentaje = 'N/A';
        this.#formatoEntrega = 'N/A';
        this.#fechaRemate = 'N/A';
        this.#montoMinimo = 'N/A';
        this.#multiples = false;
        this.#comuna = 'N/A';
    }
    darTexto(texto){
        this.#texto = texto;
    }
    darCausa(causa){
        this.#causa = causa;
    }
    darJuzgado(juzgado){
        this.#juzgado = juzgado;
    }
    darPorcentaje(porcentaje){
        this.#porcentaje = porcentaje;
    }
    darFormatoEntrega(formatoEntrega){
        this.#formatoEntrega = formatoEntrega;
    }
    darFechaRemate(fechaRemate){
        this.#fechaRemate = fechaRemate;
    }
    darMontoMinimo(montoMinimo){
        this.#montoMinimo = montoMinimo;
    }
    darMultiples(multiples){
        this.#multiples = multiples;
    }
    darComuna(comuna){
        this.#comuna = comuna;
    }

    getLink(){ 
        return this.#link;
    }
    getTexto(){
        return String(this.#texto);
    }
    getData(){
        return {
            fechaHoy: this.#fechahoy,
            texto: this.#texto,
            link: this.#link,
            causa: this.#causa,
            juzgado: this.#juzgado,
            porcentaje: this.#porcentaje,
            formatoEntrega: this.#formatoEntrega,
            fechaRemate: this.#fechaRemate,
            montoMinimo: this.#montoMinimo,
            multiples: this.#multiples,
            comuna: this.#comuna,
        };
    }

    toObject() {
        return {
            fechaHoy: this.#fechahoy,
            fechaPublicacion: this.#fechaPublicacion,
            link: this.#link,
            causa: this.#causa,
            juzgado: this.#juzgado,
            porcentaje: this.#porcentaje,
            formatoEntrega: this.#formatoEntrega,
            fechaRemate: this.#fechaRemate,
            montoMinimo: this.#montoMinimo,
            multiples: this.#multiples,
            comuna: this.#comuna,
        };
    }
}

module.exports = { Caso }