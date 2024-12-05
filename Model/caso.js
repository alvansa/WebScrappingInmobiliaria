const ARICA = "10";
const IQUIQUE = "11";
const ANTOFAGASTA = "15";
const COPIAPO = "20";
const LA_SERENA = "25";
const VALPARAISO = "30";
const RANCAGUA = "35";
const TALCA = "40";
const CHILLAN = "45";
const CONCEPCION = "46";
const TEMUCO = "50";
const VALDIVIA = "55";
const PUERTO_MONTT = "56";
const COYHAIQUE = "60";
const PUNTA_ARENAS = "61";
const SANTIAGO = "90";
const SAN_MIGUEL = "91";


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
    #martillero;
    #direccion;

    constructor(fechaObtencion,fechaPublicacion='N/A',link='N/A'){    
        this.#fechaPublicacion = fechaPublicacion;
        this.#fechaObtencion = fechaObtencion;
        this.#texto = '';
        this.#link = link
        this.#causa = 'N/A';
        this.#juzgado = 'N/A';
        this.#porcentaje = 'N/A';
        this.#formatoEntrega = 'N/A';
        this.#fechaRemate = 'N/A';
        this.#montoMinimo = 'N/A';
        this.#multiples = false;
        this.#comuna = 'N/A';
        this.#foja = 'No especifica';
        this.#multiplesFoja = false;
        this.#numero = 'N/A';
        this.#partes = "N/A";
        this.#tipoPropiedad = 'No especifica';
        this.#tipoDerecho = 'No especifica';
        this.#anno = 'No especifica';
        this.#martillero = 'N/A';
        this.#direccion = 'N/A';
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
    darMartillero(martillero){
        this.#martillero = martillero;
    }
    darDireccion(direccion){
        this.#direccion = direccion;
    }

    get link(){ 
        return String(this.#link);
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
            martillero: this.#martillero,
            direccion: this.#direccion,
        };
    }

    getCorte(){
        const comuna = this.#juzgado.split('de').at(-1).trim();
    }
    getCausa(){
        const causa = this.#causa.split('-');
        return causa[1];
    }
    getAnno(){
        const causa = this.#causa.split('-');
        return causa[2];
    }
}

module.exports = Caso;