class Caso{
    #fechaPublicacion;
    #fechaObtencion;
    #texto;
    #link;
    #causa;
    #juzgado;
    #porcentaje;
    #formatoEntrega;
    #fechaRemate;
    #montoMinimo;
    #multiples;
    #multiplesFoja;
    #comuna;
    #foja;
    #numero;
    #anno;
    #partes;
    #tipoPropiedad;
    #tipoDerecho;

    constructor(fechaObtencion,fechaPublicacion='N/A',link='N/A'){    
        this.#fechaPublicacion = fechaPublicacion;
        this.#fechaObtencion = fechaObtencion;
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
        this.#foja = 'N/A';
        this.#multiplesFoja = false;
        this.#numero = 'N/A';
        this.#partes = "N/A";
        this.#tipoPropiedad = 'N/A';
        this.#tipoDerecho = 'N/A';
        this.#anno = 'N/A';
    }
    darfechaPublicacion(fechaPublicacion){
        this.#fechaPublicacion = fechaPublicacion;
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
    darFoja(foja){
        this.#foja = foja;
    }
    darMultiplesFoja(multiplesFoja){
        this.#multiplesFoja = multiplesFoja;
    }
    darNumero(numero){
        this.#numero = numero;
    }
    darPartes(partes){
        this.#partes = partes;
    }
    darTipoPropiedad(tipoPropiedad){
        this.#tipoPropiedad = tipoPropiedad;
    }
    darTipoDerecho(tipoDerecho){
        this.#tipoDerecho = tipoDerecho;
    }
    darAnno(anno){
        this.#anno = anno;
    }

    getLink(){ 
        return this.#link;
    }
    get texto(){
        return String(this.#texto);
    }
  

    toObject() {
        return {
            fechaObtencion: this.#fechaObtencion,
            fechaPublicacion: this.#fechaPublicacion,
            link: this.#link,
            causa: this.#causa,
            juzgado: this.#juzgado,
            porcentaje: this.#porcentaje,
            formatoEntrega: this.#formatoEntrega,
            fechaRemate: this.#fechaRemate,
            montoMinimo: this.#montoMinimo,
            multiples: this.#multiples,
            multiplesFoja : this.#multiplesFoja,
            comuna: this.#comuna,
            foja: this.#foja,
            numero: this.#numero,
            partes: this.#partes,
            tipoPropiedad: this.#tipoPropiedad,
            tipoDerecho: this.#tipoDerecho,
            año: this.#anno,
        };
    }
}

module.exports = { Caso }