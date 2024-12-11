const { get } = require("request");

const EMOL = 1;
const PJUD = 2;
const LIQUIDACIONES = 3;
const otros = 4;

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
    #origen;
    #diaEntrega;

    constructor(fechaObtencion,fechaPublicacion='N/A',link='N/A',origen='N/A' ){    
        this.#fechaPublicacion = fechaPublicacion;
        this.#fechaObtencion = fechaObtencion;
        this.#origen = origen;
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
        this.#diaEntrega = 'N/A';
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
    darDiaEntrega(diaEntrega){
        this.#diaEntrega = diaEntrega;
    }
    
    get link(){ 
        return String(this.#link);
    }
    get texto(){
        return String(this.#texto);
    }
  

    toObject() {
        let montominimo;
        let moneda;

        if(this.#origen == LIQUIDACIONES){
            montominimo = this.#montoMinimo;
            moneda = "CLP";
        }else if(this.#montoMinimo !== 'N/A'){
            montominimo = this.getMontoMinimo();
            moneda = this.getTipoMoneda();
        }else{
            montominimo = "No especifica";
            moneda = "No aplica";
        }
        


        return {
            fechaObtencion: this.#fechaObtencion,
            fechaPublicacion: this.#fechaPublicacion,
            link: this.#link,
            causa: this.#causa,
            juzgado: this.#juzgado,
            porcentaje: this.#porcentaje,
            formatoEntrega: this.#formatoEntrega,
            fechaRemate: this.transformarFecha(),
            // montoMinimo: this.#montoMinimo,
            montoMinimo: montominimo,
            moneda : moneda,
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
            diaEntrega: this.#diaEntrega,
        };
    } 
    transformarFecha(){
        // console.log
        if(this.#origen == LIQUIDACIONES){return this.#fechaRemate;}
        if(typeof(this.#fechaRemate) == Date){
            return this.#fechaRemate;
        }
        const dia = this.getDia();
        const mes = this.getMes();
        const anno = this.getAnno();
        // console.log(dia,mes,anno);
        if (dia && mes && anno) {
            const fecha = new Date(anno, mes - 1, dia);
            return new Date(fecha.getTime() + 6 * 60 * 60 * 1000); // Sumar 6 horas
        }
        return null;
    }

    getCorte(){
        const comuna = this.#juzgado.split('de').at(-1).trim();
    }
    getCausa(){
        const causa = this.#causa.split('-');
        return causa[1];
    }

    getAnnoCausa(){
        const causa = this.#causa.split('-');
        return causa[2];
    }
   
    getDia(){
        const dias = ['uno','dos','tres','cuatro','cinco','seis','siete','ocho','nueve','diez','once','doce','trece','catorce','quince','dieciseis','diecisiete','dieciocho','diecinueve','veinte','veintiuno','veintidos','veintitres','veinticuatro','veinticinco','veintiseis','veintisiete','veintiocho','veintinueve','treinta','treinta y uno'];
        const diaRegex = /(\d{1,2})/g;
        const diaRemate = this.#fechaRemate.match(diaRegex);
        if(diaRemate){
            return diaRemate[0];
        }
        for(let dia of dias){
            if(this.#fechaRemate.toLowerCase().includes(dia)){
                return this.palabraADia(dia);
            }
        }
        return null;
    }

    getMes(){
        const meses = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
        for(let mes of meses){
            if(this.#fechaRemate.toLowerCase().includes(mes)){
                
                // console.log("En el get mes: ",this.#fechaRemate.toLowerCase(),mes);
                return this.mesNumero(mes);
            }
        }
        return null;
    }   

    getAnno(){
        const annoRegex = /(\d{4})/g;
        const annoRemate = this.#fechaRemate.match(annoRegex);
        if(annoRemate){
            return annoRemate[0];
        }
        const annoPalabras = /dos\smil\s(veinticuatro|veinticinco|veintiséis|veintisiete|veintiocho|veintinueve|treinta|treinta y uno|treinta y dos|treinta y tres|treinta y cuatro|treinta y cinco)/i;
        const annoRematePalabras = this.#fechaRemate.match(annoPalabras);
        if(annoRematePalabras){
            const anno = this.palabrasANumero(annoRematePalabras[0]);
            return anno;
        }
        return null;
    }
    palabrasANumero(añoEnPalabras) {
        const mapaNumeros = {
            "veinticuatro": 24,
            "veinticinco": 25,
            "veintiséis": 26,
            "veintisiete": 27,
            "veintiocho": 28,
            "veintinueve": 29,
            "treinta": 30,
            "treinta y uno": 31,
            "treinta y dos": 32,
            "treinta y tres": 33,
            "treinta y cuatro": 34,
            "treinta y cinco": 35
        };
    
        const prefijo = "dos mil ";
        if (añoEnPalabras.startsWith(prefijo)) {
            const resto = añoEnPalabras.slice(prefijo.length).trim();
            return 2000 + (mapaNumeros[resto] || 0);
        }
        throw new Error("Formato no reconocido");
    }
    palabraADia(diaEnPalabras) {
        const mapNumeros ={
            "uno": 1,
            "dos": 2,
            "tres": 3,
            "cuatro": 4,
            "cinco": 5,
            "seis": 6,
            "siete": 7,
            "ocho": 8,
            "nueve": 9,
            "diez": 10,
            "once": 11,
            "doce": 12,
            "trece": 13,
            "catorce": 14,
            "quince": 15,
            "dieciseis": 16,
            "diecisiete": 17,
            "dieciocho": 18,
            "diecinueve": 19,
            "veinte": 20,
            "veintiuno": 21,
            "veintidos": 22,
            "veintitres": 23,
            "veinticuatro": 24,
            "veinticinco": 25,
            "veintiséis": 26,
            "veintisiete": 27,
            "veintiocho": 28,
            "veintinueve": 29,
            "treinta": 30,
            "treinta y uno": 31
        };
        return mapNumeros[diaEnPalabras];
    }
    
    mesNumero(mesEnPalabras){
        const mapaNumeros ={
            "enero": 1,
            "febrero": 2,
            "marzo": 3,
            "abril": 4,
            "mayo": 5,
            "junio": 6,
            "julio": 7,
            "agosto": 8,
            "septiembre": 9,
            "octubre": 10,
            "noviembre": 11,
            "diciembre": 12
        };
        return mapaNumeros[mesEnPalabras];
    }
    
    getMontoMinimo(){
       const montoRegex = /\d{1,3}(?:\.\d{3})*(?:,\d+|\.\d+)?/g;
        let monto = this.#montoMinimo.match(montoRegex)[0];
        console.log("Monto en el regex: ",this.#montoMinimo.match(montoRegex));
        const montoNormalizado = monto.replaceAll('.','').replaceAll(',','.');
        console.log("Monto Normalizado :" ,montoNormalizado);
        return montoNormalizado;
    }

    getTipoMoneda(){
        const montoMinimo = this.#montoMinimo.toLowerCase();
        if(this.#montoMinimo.includes("$")){
            return "CLP";
        }else if(montoMinimo.includes("uf")|montoMinimo.includes("unidades de fomento")|montoMinimo.includes("u.f.")|montoMinimo.includes("uf.")){
            return "UF";
        }    
    }

}

module.exports = Caso;