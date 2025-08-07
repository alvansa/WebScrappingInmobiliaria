
const config = require('../../../config');

const PJUD = config.PJUD;
const EMOL = config.EMOL;
const LIQUIDACIONES = config.LIQUIDACIONES;
const PREREMATES = config.PREREMATES;

class DateHelper{
    // Normalización principal
    static normalize(fecha, origen) {
        if (!fecha || fecha === 'N/A') return null;

        if( fecha instanceof Date) {
            return fecha;
        }

        switch (origen) {
            case PJUD:
                return this.normalizarPJUD(fecha);
            case LIQUIDACIONES:
                return this.normalizarLiquidaciones(fecha);
            default:
                return this.inteligentParse(fecha);
        }
    }

    static formatearParaSQL(fecha) {
        if (!this.isDateValid(fecha)) return null;
        return fecha.toISOString().split('T')[0]; // YYYY-MM-DD
    }

    static normalizarPJUD(fecha) {
        fecha = fecha.split(' ')[0];
        const partes = fecha.split('/');
        let fechaRemate = new Date(partes[2], partes[1] - 1, partes[0]);
        // fechaRemate.setHours(fechaRemate.getHours() + 6);
        return fechaRemate;
    }

    static normalizarLiquidaciones(fecha) {
        return new Date(fecha);
    }

    static inteligentParse(fecha) {
        if(fecha.includes("Chile Summer")){
            return new Date(fecha);
        }
        //Del estilo 25/12/2025
        if (fecha.includes("/")) {
            const regexFecha = /(\d{1,2})\/(\d{1,2})\/(\d{4})/;
            const partesFecha = fecha.match(regexFecha);
            if (partesFecha) {
                const dia = parseInt(partesFecha[1], 10);
                const mes = parseInt(partesFecha[2], 10) - 1; // Los meses en JavaScript son 0-indexados
                const anno = parseInt(partesFecha[3], 10);
                return new Date(anno, mes, dia);
            }
        }
        // Del estilo 25-12-2025
        if (fecha.includes("-")) {
            const regexFecha = /(\d{1,2})-(\d{1,2})-(\d{4})/;
            const partesFecha = fecha.match(regexFecha);
            if (partesFecha) {
                const dia = parseInt(partesFecha[1], 10);
                const mes = parseInt(partesFecha[2], 10) - 1; // Los meses en JavaScript son 0-indexados
                const anno = parseInt(partesFecha[3], 10);
                return new Date(anno, mes, dia);
            }
        }

        // Si el origen es Emol, puede venir con formato de palabras
        let splitDate = fecha.split("de");
        if(splitDate.length < 3 && splitDate.length > 1) {
            return null;
        }else if (splitDate.length !== 3) {
            splitDate = fecha.split(" ");
            if(splitDate.length !== 3) {
                return null;
            }
        }

        const dia = this.getDia(splitDate[0]);
        const mes = this.getMes(splitDate[1]);
        const anno = this.getAnno(splitDate[2]);
        if (dia && mes && anno) {
            const newFecha = new Date(anno, mes - 1, dia);
            return newFecha;
        }
        return null;
    }

    static isDateValid(date) {
        return date instanceof Date && !isNaN(date.getTime());
    }

    // Obtiene el día de la fecha de cuando se realizara el remate.
    static getDia(fecha){
        if(fecha == "N/A" || fecha == null){
            return null;
        }
        fecha = fecha.toLowerCase().trim();
        const dias = ['uno','dos','tres','cuatro','cinco','seis','siete','ocho','nueve','diez','once','doce','trece','catorce','quince','dieciseis','diecisiete','dieciocho','diecinueve','veinte','veintiuno','veintidos','veintitres','veinticuatro','veinticinco','veintiseis','veintisiete','veintiocho','veintinueve','treinta','treinta y uno'];
        const diaRegex = /(\d{1,2})/g;
        const diaRemate = fecha.match(diaRegex);
        if(diaRemate){
            return diaRemate[0];
        }
        for(let dia of dias){
            if(fecha.toLowerCase() == dia){
                return this.palabraADia(dia);
            }
        }
        return null;
    }

    // Obtiene el mes de la fecha de cuando se realizara el remate.
    static getMes(fecha){
        if(fecha == "N/A" || fecha == null){return null}
        const meses = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
        for(let mes of meses){
            if(fecha.toLowerCase().includes(mes)){
                
                return this.mesNumero(mes);
            }
        }
        return null;
    }   

    // Obtiene el año de la fecha de cuando se realizara el remate.
    static getAnno(fecha){
        const annoRegex = /(\d{4})/g;
        const annoRemate = fecha.match(annoRegex);
        if(annoRemate){
            return annoRemate[0];
        }
        const annoPalabras = /dos\smil\s(veinticuatro|veinticinco|veintiséis|veintisiete|veintiocho|veintinueve|treinta|treinta y uno|treinta y dos|treinta y tres|treinta y cuatro|treinta y cinco)/i;
        const annoRematePalabras = fecha.match(annoPalabras);
        if(annoRematePalabras){
            const anno = this.palabrasANumero(annoRematePalabras[0]);
            return anno;
        }
        return null;
    }
    // Devuele el número del día en base a su nombre en palabras para escribir la fecha en tipo Date
    static palabraADia(diaEnPalabras) {
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
            "veintiseis" : 26,
            "veintisiete": 27,
            "veintiocho": 28,
            "veintinueve": 29,
            "treinta": 30,
            "treinta y uno": 31
        };
        return mapNumeros[diaEnPalabras];
    }
    
    // Devuelve el número del mes en base a su nombre en palabras para escribir la fecha en tipo Date
    static mesNumero(mesEnPalabras){
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

    // Devuelve el número del año en base a su nombre en palabras para escribir la fecha en tipo Date
    static palabrasANumero(añoEnPalabras) {
        añoEnPalabras = añoEnPalabras.toLowerCase();
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
    
}


module.exports = DateHelper;