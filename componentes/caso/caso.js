const {cleanInitialZeros} = require('../../utils/cleanStrings');
const EMOL = 1;
const PJUD = 2;
const LIQUIDACIONES = 3;
const PREREMATES = 4;
const otros = 0;

const THREE_SAME = 0;
const ONE_TWO = 1;
const ONE_THREE = 2;
const TWO_THREE = 3;
const THREE_DIFF = 4;



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
    #diaEntrega;
    #rolPropiedad;
    #avaluoPropiedad;
    #estadoCivil;
    #corte;
    #numeroJuzgado;
    #rolEstacionamiento;
    #avaluoEstacionamiento;
    #direccionEstacionamiento;
    #hasEstacionamiento;
    #rolBodega;
    #avaluoBodega;
    #hasBodega;
    #owners;
    #montoCompra;
    #isPaid;
    #origen;
    #deudaHipotecaria;
    #alreadyAppear;
    #unitRol;
    #unitAvaluo;
    #unitDireccion;

    constructor(fechaObtencion, fechaPublicacion = 'N/A',link = 'N/A',origen = null ){    
        this.#fechaPublicacion = fechaPublicacion;
        this.#fechaObtencion = fechaObtencion;
        this.#texto = null;
        this.#link = link
        this.#causa = null;
        this.#juzgado = null;
        this.#porcentaje = null;
        this.#formatoEntrega = null;
        this.#fechaRemate = null;
        this.#montoMinimo = null;
        this.#multiples = false;
        this.#comuna = null;
        this.#foja = null;
        this.#multiplesFoja = false;
        this.#numero = null;
        this.#partes = null;
        this.#tipoPropiedad = null;
        this.#tipoDerecho = null;
        this.#anno = null;
        this.#martillero = null;
        this.#direccion = null;
        this.#diaEntrega = null;
        this.#numero = null;
        this.#rolPropiedad = null;
        this.#avaluoPropiedad = null;
        this.#estadoCivil = null;
        this.#corte = null;
        this.#numeroJuzgado = null;
        this.#rolEstacionamiento = null;
        this.#avaluoEstacionamiento = null;
        this.#direccionEstacionamiento = null;
        this.#rolBodega = null;
        this.#avaluoBodega = null;
        this.#hasEstacionamiento = false;
        this.#hasBodega = false;
        this.#owners = [];
        this.#montoCompra = null;   
        this.#isPaid = false;
        this.#deudaHipotecaria = null;
        this.#alreadyAppear = null;

        this.#unitRol = null;
        this.#unitAvaluo = null;
        this.#unitDireccion = null;

        this.#origen = origen;
    }

    darfechaPublicacion(fechaPublicacion){
        this.#fechaPublicacion = fechaPublicacion;
    }

    set fechaPublicacion(fechaPublicacion){
        this.#fechaPublicacion = fechaPublicacion;
    }

    set texto(texto){
        this.#texto = texto;
    }

    set causa(causa){
        this.#causa = causa;
    }
    
    set juzgado(juzgado){
        this.#juzgado = juzgado;
    }

    set porcentaje(porcentaje){
        this.#porcentaje = porcentaje;
    }

    set formatoEntrega(formatoEntrega){
        this.#formatoEntrega = formatoEntrega;
    }

    set fechaRemate(fechaRemate){
        this.#fechaRemate = fechaRemate;
    }

    set montoMinimo(montoMinimo){
        this.#montoMinimo = montoMinimo;
    }

    set multiples(multiples){
        this.#multiples = multiples;
    }

    set comuna(comuna){
        this.#comuna = comuna;
    }

    set foja(foja){
        this.#foja = foja;
    }

    set multiplesFoja(multiplesFoja){
        this.#multiplesFoja = multiplesFoja;
    }

    set numero(numero){
        this.#numero = numero;
    }
    
    set partes(partes){
        this.#partes = partes;
    }

    set tipoPropiedad(tipoPropiedad){
        this.#tipoPropiedad = tipoPropiedad;
    }

    set tipoDerecho(tipoDerecho){
        this.#tipoDerecho = tipoDerecho;
    }

    set anno(anno){
        this.#anno = anno;
    }

    set martillero(martillero){
        this.#martillero = martillero;
    }

    set direccion(direccion){
        this.#direccion = direccion;
    }

    set diaEntrega(diaEntrega){
        this.#diaEntrega = diaEntrega;
    }

    set rolPropiedad(rolPropiedad){
        this.#rolPropiedad = rolPropiedad;
    }

    set avaluoPropiedad(avaluoPropiedad){
        this.#avaluoPropiedad = avaluoPropiedad;
    }

    set estadoCivil(estadoCivil){
        this.#estadoCivil = estadoCivil;
    }
    set origen(origen){
        this.#origen = origen;
    }
    set corte(corte){
        this.#corte = corte;
    }
    set numeroJuzgado(numeroJuzgado){
        this.#numeroJuzgado = numeroJuzgado;
    }
    set link(link){
        this.#link = link;
    }
    set rolEstacionamiento(rolEstacionamiento){
        this.#rolEstacionamiento = rolEstacionamiento;
    }
    set avaluoEstacionamiento(avaluoEstacionamiento){
        this.#avaluoEstacionamiento = avaluoEstacionamiento;
    }
    set direccionEstacionamiento(direccionEstacionamiento){
        this.#direccionEstacionamiento = direccionEstacionamiento;
    }
    set hasEstacionamiento(hasEstacionamiento){
        this.#hasEstacionamiento = hasEstacionamiento;
    }
    set rolBodega(rolBodega){
        this.#rolBodega = rolBodega;
    }
    set avaluoBodega(avaluoBodega){
        this.#avaluoBodega = avaluoBodega;
    }
    set hasBodega(hasBodega){
        this.#hasBodega = hasBodega;
    }
    set owners(owners){
        if(Array.isArray(owners)){
            this.#owners = owners;
        }else{
            throw new Error("Los owners deben ser un array");
        }
    }
    set montoCompra(montoCompra){
        this.#montoCompra = montoCompra;
    }
    set isPaid(isPaid){
        this.#isPaid = isPaid;
    }
    set deudaHipotecaria(deudaHipotecaria){
        this.#deudaHipotecaria = deudaHipotecaria;
    }
    set alreadyAppear(alreadyAppear){
        this.#alreadyAppear = alreadyAppear        
    }
    set unitRol(unitRol){
        this.#unitRol = unitRol;
    }
    set unitDireccion(unitDireccion){
        this.#unitDireccion = unitDireccion;
    }
    set unitAvaluo(unitAvaluo){
        this.#unitAvaluo = unitAvaluo;
    }

    
    get link(){ 
        return String(this.#link);
    }
    get texto(){
        return String(this.#texto);
    }
    get juzgado(){
        if(this.#juzgado == null){
            return null;
        }
        const juzgadoNormalizado = this.normalizarJuzgado();
        return String(juzgadoNormalizado);
    }

    get fechaRemate(){
        if(this.#fechaRemate == "N/A" || this.#fechaRemate == null){
            return null;
        }
        return this.normalizarFechaRemate();
    }
    get fechaRemateSQL(){
        if(!this.#fechaRemate){
            return null;
        }
        return String(this.normalizarFechaRemate());
    }

    get fechaPublicacion(){
        if(this.#fechaPublicacion == null){
            return null;
        }
        return this.#fechaPublicacion;
    }
    get causa(){
        const causaNormalizada = this.normalizarCausa();
        return causaNormalizada;
    }
    get comuna(){
        if(this.#comuna == null){
            return null;
        }
        return this.normalizarComuna();
    }
    get rolPropiedad(){
        if(this.#rolPropiedad == null){
            return null;
        }
        return String(this.#rolPropiedad);
    }
    get avaluoPropiedad(){
        if(this.#avaluoPropiedad == null){
            return null;
        }
        return Number(this.#avaluoPropiedad);
    }
    get estadoCivil(){
        if(this.#estadoCivil === null){
            return null;
        }
        return String(this.#estadoCivil);
    }
    get direccion(){
        if(this.#direccion === null){
            return null;
        }
        return String(this.#direccion);
    }
    get corte(){
        if(this.#corte === null){
            return null;
        }
        return String(this.#corte);
    }
    get numeroJuzgado(){
        if(this.#numeroJuzgado === null){
            return null;
        }
        return String(this.#numeroJuzgado);
    }
    get origen(){
        if(this.#origen === null){
            return null;
        }
        return Number(this.#origen);
    }
    get rolEstacionamiento(){
        if(this.#rolEstacionamiento === null){
            return null;
        }
        return String(this.#rolEstacionamiento);
    }
    get avaluoEstacionamiento(){
        if(this.#avaluoEstacionamiento === null){
            return null;
        }
        return Number(this.#avaluoEstacionamiento);
    }
    get direccionEstacionamiento(){
        if(this.#direccionEstacionamiento === null){
            return null;
        }
        return String(this.#direccionEstacionamiento);
    }
    get rolBodega(){
        if(this.#rolBodega === null){
            return null;
        }
        return String(this.#rolBodega);
    }
    get avaluoBodega(){
        if(this.#avaluoBodega === null){
            return null;
        }
        return Number(this.#avaluoBodega);
    }
    get hasEstacionamiento(){
        return Boolean(this.#hasEstacionamiento);
    }
    get hasBodega(){
        return Boolean(this.#hasBodega);
    }
    get montoMinimo(){
        if(this.#montoMinimo == "N/A" || this.#montoMinimo == null){
            return null;
        }
        return this.normalizarMontoMinimo();
    }
    get owners(){
        return this.#owners;
    }
    get montoCompra(){
        if(this.#montoCompra == "N/A" || this.#montoCompra == null){
            return null;
        }
        return this.#montoCompra;
    }
    get anno(){
        if(this.#anno == null || this.#anno == 0 || this.#anno == "No especifica"){  
            return null;
        }
        return String(this.#anno);
    }
    get isPaid(){
        if(!this.#isPaid){
            return null;
        }
        return Boolean(this.#isPaid);
    }
    get deudaHipotecaria(){
        if(!this.#deudaHipotecaria){
            return null;
        }
        return this.#deudaHipotecaria;
    }
    get formatoEntrega(){
        if(!this.#formatoEntrega){
            return null;
        }
        return this.normalizarFormatoEntrega()
    }
    get partes(){
        if(!this.#partes){
            return null;
        }
        return this.normalizarPartes();
    }
    get alreadyAppear(){
        if(!this.#alreadyAppear){
            return null;
        }
        return new Date(this.#alreadyAppear);
    }
    get porcentaje(){
        if(!this.#porcentaje){
            return null;
        }
        return this.normalizarPorcentaje();
    }
    get unitRol(){
        if(!this.#unitRol){
            return this.adaptRol();
        }
        return this.#unitRol;
    }
    get unitDireccion(){
        if(!this.#unitDireccion){
            return this.checkEstacionamientoBodega();
        }
        return this.#unitDireccion;
    }
    get unitAvaluo(){
        if(!this.#unitAvaluo){
            return this.sumAvaluo();
        }
        return this.#unitAvaluo;
    }


  

    toObject() {
        const fechaObtencionNormalizada = this.normalizarFechaObtencion()
        const montoMoneda = this.normalizarMontoMinimo(); 
        const causaNormalizada = this.normalizarCausa();
        const annoNormalizado = this.normalizarAnno();
        const porcentajeNormalizado = this.normalizarPorcentaje(); 
        const formatoEntregaNormalizado = this.normalizarFormatoEntrega();
        const juzgadoNormalizado = this.normalizarJuzgado();
        const direccionNormalizada = this.normalizarDireccion();
        const partesNormalizadas = this.normalizarPartes();
        const diaEntregaNormalizado = this.normalizarDiaEntrega();
        const comunaNormalizada = this.normalizarComuna();
        const tipoDerechoNormalizado = this.normalizarTipoDerecho();
        const fechaRemateNormalizada = this.normalizarFechaRemate();

        return {
            fechaObtencion: fechaObtencionNormalizada,
            fechaPublicacion: this.#fechaPublicacion,
            link: this.#link,
            causa: causaNormalizada,
            juzgado: juzgadoNormalizado,
            porcentaje: porcentajeNormalizado,
            formatoEntrega: formatoEntregaNormalizado,
            fechaRemate: fechaRemateNormalizada, 
            // montoMinimo: this.#montoMinimo,
            montoMinimo: montoMoneda["monto"],
            moneda : montoMoneda["moneda"],
            multiples: this.#multiples,
            multiplesFoja : this.#multiplesFoja,
            comuna: comunaNormalizada,
            foja: this.#foja,
            numero: this.#numero,
            partes: partesNormalizadas,
            tipoPropiedad: this.#tipoPropiedad,
            tipoDerecho: tipoDerechoNormalizado,
            anno: annoNormalizado,
            martillero: this.#martillero,
            direccion: direccionNormalizada,
            diaEntrega: diaEntregaNormalizado,
            aviso : this.#texto,
            numero : this.#numero,
            rolPropiedad : this.#rolPropiedad,
            avaluoPropiedad : Number(this.#avaluoPropiedad) !=0 ? Number(this.#avaluoPropiedad) : null,
            estadoCivil : this.#estadoCivil,
            corte : this.#corte,
            numeroJuzgado : this.#numeroJuzgado,
            rolEstacionamiento : this.#rolEstacionamiento, 
            avaluoEstacionamiento : Number(this.#avaluoEstacionamiento) !=0 ? Number(this.#avaluoEstacionamiento) : null,
            direccionEstacionamiento : this.#direccionEstacionamiento,
            rolBodega : this.#rolBodega,
            avaluoBodega : Number(this.#avaluoBodega) !=0 ? Number(this.#avaluoBodega) : null,
            hasEstacionamiento : this.#hasEstacionamiento,
            hasBodega : this.#hasBodega,
            montoCompra: this.#montoCompra,
            isPaid: Boolean(this.#isPaid),
            deudaHipotecaria : this.#deudaHipotecaria,
            alreadyAppear: this.#alreadyAppear,
            unitRol: this.adaptRol(),
            unitAvaluo: this.sumAvaluo(),
            unitDireccion : this.mergeDirections()
        };
    } 

    // Transforma la fecha de la publicación de estar escrita en palabras a un objeto Date
    normalizarFechaRemate(){
        if(this.#fechaRemate == "N/A" || this.#fechaRemate == null){ 
            return null;
        }
        if(this.#fechaRemate instanceof Date){
            return this.#fechaRemate;
        }

        // Si el origen es Pjud, viene con formato tipo dd/mm/yyyy HH:mm:ss
        if(this.#origen == PJUD){
            this.#fechaRemate = this.#fechaRemate.split(' ')[0];
            const partes = this.#fechaRemate.split('/');
            let fechaRemate = new Date(partes[2],partes[1]-1,partes[0]);
            fechaRemate.setHours(fechaRemate.getHours() + 6);
            return fechaRemate;
        }

        // Si el origen es Liquidaciones, viene con el formato Date listo
        if(this.#origen == LIQUIDACIONES){
            return new Date(this.#fechaRemate);
        }

        //Del estilo Wed Dec 25 2024 00:00:00 GMT-0300 (Chile Summer Time).
        if(this.#fechaRemate.includes("Chile Summer")){
            return new Date(this.#fechaRemate);
        }
        try {
            //Del estilo 25/12/2025
            if (this.#fechaRemate.includes("/")) {
                const regexFecha = /(\d{1,2})\/(\d{1,2})\/(\d{4})/;
                const partesFecha = this.#fechaRemate.match(regexFecha);
                if (partesFecha) {
                    const dia = parseInt(partesFecha[1], 10);
                    const mes = parseInt(partesFecha[2], 10) - 1; // Los meses en JavaScript son 0-indexados
                    const anno = parseInt(partesFecha[3], 10);
                    return new Date(anno, mes, dia);
                }
            }
            // Del estilo 25-12-2025
            if (this.#fechaRemate.includes("-")) {
                const regexFecha = /(\d{1,2})-(\d{1,2})-(\d{4})/;
                const partesFecha = this.#fechaRemate.match(regexFecha);
                if (partesFecha) {
                    const dia = parseInt(partesFecha[1], 10);
                    const mes = parseInt(partesFecha[2], 10) - 1; // Los meses en JavaScript son 0-indexados
                    const anno = parseInt(partesFecha[3], 10);
                    return new Date(anno, mes, dia);
                }
            }

            // Si el origen es Emol, puede venir con formato de palabras
            const dia = this.getDia();
            const mes = this.getMes();
            const anno = this.getAnno();
            if (dia && mes && anno) {
                const fecha = new Date(anno, mes - 1, dia);
                // Se suma 6 horas ya que la fecha a veces queda si es del 25 de diciembre queda como 
                // 24 de diciembre a las 23:59:59.999, por lo que se suma 6 horas para que quede como 25 de diciembre
                // return new Date(fecha.getTime() + 6 * 60 * 60 * 1000); // Sumar 6 horas
                return fecha;
            }
        } catch (error) {
            console.error("Error normalizando la fecha: ", error.message);
            return null;
        }
        return null;
    }

    // Obtiene el número de la causa para buscar el remate en el pjud
    getCausaPjud(){
        if(this.#causa.includes('N/A') || this.#causa == null){
            return null;
        }
        const causa = this.#causa.split('-');
        return causa[1];
    }

    // Obtiene el año de la causa para buscar el remate en el pjud
    getAnnoPjud(){
        if(this.#causa.includes('N/A') || this.#causa == null){
            return null;
        }
            
        const causa = this.#causa.split('-');
        return causa[2];
    }
   
    // Obtiene el día de la fecha de cuando se realizara el remate.
    getDia(){
        if(this.#fechaRemate == "N/A" || this.#fechaRemate == null){
            return null;
        }
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

    // Obtiene el mes de la fecha de cuando se realizara el remate.
    getMes(){
        if(this.#fechaRemate == "N/A" || this.#fechaRemate == null){return null}
        const meses = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
        for(let mes of meses){
            if(this.#fechaRemate.toLowerCase().includes(mes)){
                
                return this.mesNumero(mes);
            }
        }
        return null;
    }   

    // Obtiene el año de la fecha de cuando se realizara el remate.
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

    // Devuelve el número del año en base a su nombre en palabras para escribir la fecha en tipo Date
    palabrasANumero(añoEnPalabras) {
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

    // Devuele el número del día en base a su nombre en palabras para escribir la fecha en tipo Date
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
    
    // Devuelve el número del mes en base a su nombre en palabras para escribir la fecha en tipo Date
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
    
    // Devuelve el monto numerico mínimo del remate
    getMontoMinimo(){
        this.#montoMinimo = this.#montoMinimo.replaceAll(" ","");
        // Busca un patron numerico en el texto de la forma 1.000.000,00 o 1,000,000.00
        const montoRegex = /\d{1,12}(?:\.\d{3})*(?:,\d+|\.\d+)?/g;
        let monto = this.#montoMinimo.match(montoRegex)[0];
        //Para normalizar el monto se eliminan los puntos y se cambian las comas por puntos
        // asi quedan en formato numero en Excel.
        const montoNormalizado = monto.replaceAll('.','').replaceAll(',','.');
        return montoNormalizado;
    }
    normalizarMontoMinimo(){
        if(this.#montoMinimo == "N/A" || this.#montoMinimo == null){
            return {"monto": null, "moneda": null};
        }
        let montoFinal;
        let moneda;
        
        if(this.#origen == LIQUIDACIONES){ 
            montoFinal = this.#montoMinimo.replaceAll('.','').replaceAll(',','.');
            moneda = "Pesos";
        }else if(this.#montoMinimo !== null){
            if(typeof this.#montoMinimo.monto == "number"){
                return this.#montoMinimo;
            }
            let montominimo = this.#montoMinimo["monto"];
            montoFinal = montominimo.replaceAll('.', '').replaceAll(',', '.').replaceAll(' ', '');
            moneda = this.#montoMinimo["moneda"];
        }
        return {"monto": montoFinal, "moneda" : moneda};
    }

    // Devuelve el tipo de moneda en que se encuentra el monto mínimo
    getTipoMoneda(){
        const montoMinimo = this.#montoMinimo.toLowerCase();
        if(this.#montoMinimo.includes("$")){
            return "CLP";
        }else if(montoMinimo.includes("uf")|montoMinimo.includes("unidadesdefomento")|montoMinimo.includes("u.f.")|montoMinimo.includes("uf.")){
            return "UF";
        }else{
            return null;
        }    
    }

     //Devuelve el indentificador de la corte a la cual pertenece el juzgado del caso
    getCortePjud() {
        if (this.#juzgado === "N/A" | this.#juzgado === "juez partidor" || this.#juzgado == null) {
            return null;
        }
        if(this.#corte){
            return this.#corte;
        }
        const comuna = this.#juzgado.toLowerCase();

        const regiones = {
            ARICA: ["arica"],
            IQUIQUE: ["iquique","almonte"],
            ANTOFAGASTA: ["antofagasta", "tocopilla", "calama", "taltal", "mejillones", "maria elena", "sierra gorda"],
            COPIAPO: ["copiapo", "caldera", "chañaral", "almagro", "vallenar", "freirina", "huasco"],
            LA_SERENA: ["serena", "coquimbo", "andacollo", "vicuña", "ovalle", "combarbala", "illapel", "vilos"],
            VALPARAISO: ["valparaiso", "viña del mar", "quilpue", "villa alemana", "casablanca","ligua","petorca","los andes","san felipe","quillota","calera","san antonio","isla de pascua","putaendo","quintero","limache","casa blanca"],
            RANCAGUA: ["rancagua","rengo","tagua","peumo","san fernando","santa cruz","pichilemu","litueche","peralillo"],
            TALCA: ["talca","constitucion","curepto","curicó","licantén","molina","linares","san javier","cauquenes","parral","chanco"],
            CHILLAN: ["chillan","san carlos","yungay","bulnes","coelemu","quirihue"],
            CONCEPCION: ["los angeles","concepcion","nacimiento","laja","yumbel","talcahuano","tomé","florida","santa juana","lota","coronel","lebu","arauco","curanilahue","cañete","santa bárbara","cabrero"],
            TEMUCO: ["temuco","angol","collipulli","traiguén","victoria","curacautin","loncoche","pitrufquen","villarica","nueva imperial","pucón","lautaro","carahue","temuco","tolten","puren"],
            VALDIVIA: ["valdivia","mariquina","paillaco","los lagos","panguipulli","unión","río bueno","osorno","rio negro"],
            PUERTO_MONTT: ["puerto montt","puerto varas","calbuco","maullin","castro","ancud","achao","chaitén","muermos","quellón","hualaihue"],
            COYHAIQUE: ["coyhaique","aysen","chile chico","cochrane","puerto cisnes"],
            PUNTA_ARENAS: ["punta arenas","puerto natales","porvenir","cabo de hornos"],
            SANTIAGO: ["santiago","colina"],
            SAN_MIGUEL: ["san miguel","puente alto","talagante","melipilla","buin","peñaflor","san bernardo"],
        };

         // Valores predefinidos para cada región
        const valoresRegiones = {
            ARICA: "10",
            IQUIQUE: "11",
            ANTOFAGASTA: "15",
            COPIAPO: "20",
            LA_SERENA: "25",
            VALPARAISO: "30",
            RANCAGUA: "35",
            TALCA: "40",
            CHILLAN: "45",
            CONCEPCION: "46",
            TEMUCO: "50",
            VALDIVIA: "55",
            PUERTO_MONTT: "56",
            COYHAIQUE: "60",
            PUNTA_ARENAS: "61",
            SANTIAGO: "90",
            SAN_MIGUEL: "91",
        };

        for (const [region, comunas] of Object.entries(regiones)) {
            if (comunas.some(c => comuna.includes(c))) {
                return valoresRegiones[region];
            }
        }

    return null; 
    }

    // Separar el rol de la propiedad y lo devuelve
    getRolPropiedad(){
        if(this.#rolPropiedad == "N/A" || this.#rolPropiedad == null){
            return null;
        }
        const rol = this.#rolPropiedad.split("-");
        return rol;
    }

    normalizarPartes(){
        if(this.#partes === "N/A" || this.#partes === null || typeof this.#partes != 'string' || !this.#partes){
            return null;
        }else if(this.#link === "Lgr"){
            return this.#partes;
        }
        let partesNormalizadas = this.#partes.replace(/[\r\n\x0B\x0C\u0085\u2028\u2029]/g, '').trim();
        partesNormalizadas = partesNormalizadas
            .replace(/caratulad[oa]s?:?/gi,'')
            .replace(/causa/gi,'')
            .replace(/\bC\s*[-]*\s*\d{1,7}(?:\.\d{3})*\s*[-/]\s*\d{1,4}(?:\.\d{3})*,?\.?/gi,'')
            .replace(/rol /gi,'')
            .replace(/\s+/g," ")
            .replace(/antecedentes\s*(en\s*)?/gi,"")
            .replace(/expediente\s*/gi,"")
            .replace(/www\.pjud\.cl,?\s*/gi,"")
            .replace(/autos\s*/gi,"")
            .replace(/ejecutivos?\s*,\s*/gi,"")
            .replace(/Nº/gi,"");
            //.replace(/\.\s./g,"");
        if(partesNormalizadas.startsWith(",")){
            partesNormalizadas = partesNormalizadas.substring(1);
        }
        const puntoFinal = partesNormalizadas.indexOf(".");
        if(puntoFinal != -1){
            partesNormalizadas = partesNormalizadas.substring(0,puntoFinal);
        }
        const comaFinal = partesNormalizadas.indexOf(",");
        if(comaFinal != -1 && comaFinal > 10){
            partesNormalizadas = partesNormalizadas.substring(0,comaFinal);
        }
        return partesNormalizadas.trim();
    }

    normalizarAnno(){
        if(this.#anno == 0 || this.#anno == "N/A" || this.#anno == null || this.#anno == "No especifica"){
            return null;
        }
        if(typeof this.#anno === "number"){
            return this.#anno;
        }
        const anno = this.#anno.replaceAll(".","");
        return anno;
    }

    normalizarPorcentaje(){
        if(this.#porcentaje == "N/A" || this.#porcentaje == null){
            return null;
        }
        const porcentaje = this.#porcentaje.replaceAll(" ","");
        return porcentaje;
    }

    normalizarFormatoEntrega(){
        if(this.#formatoEntrega == "N/A" || this.#formatoEntrega == null){
            return null;
        }
        if(this.#formatoEntrega == "vale a la vista"){
            return "vale vista";
        }
        const formato = this.#formatoEntrega
        .toLowerCase()
        .replace(/(\s+)/g, ' ') // Reemplazar espacios y comas por un solo espacio;
        .replace(/\n/g, ' ')
        .trim(); // Reemplazar saltos de línea por espacios
        return formato;
    }
    normalizarCausa() {
        let causa;
        const valorOriginal = this.#causa;
        
        if (valorOriginal === "N/A" || valorOriginal === null) {
            return null;
        }
        if(valorOriginal.includes("causa")){
            causa = valorOriginal
                .replace(/causa/gi, 'C-') // Reemplazar "causa" por "C-"
                .toLowerCase()
                .replace(/[.\n ]/g, '') // Eliminar puntos, newlines y espacios

            return causa.toUpperCase();
        }

        causa = valorOriginal
            .toLowerCase()
            .replace(/[.\n ]/g, '') // Eliminar puntos, newlines y espacios
            .replace("nº", "")  // Eliminar primera ocurrencia de nº
            .replace("n°", "")  // Eliminar primera ocurrencia de n°
            .replace(/c-?/i,"c-")
            .replace("rol", "c-")  // Reemplazar primera ocurrencia de rol
            .replace(/\//g,"-"); // Reemplazar barras por guiones

        // Limpieza final y formato
        return causa
            .toUpperCase();
    } 
    normalizarJuzgado(){
        if(this.#juzgado == "N/A" || this.#juzgado == null){
            return null;
        }
        return this.#juzgado.replace(/[\r\n\x0B\x0C\u0085\u2028\u2029]/g, '').trim();
    }

    normalizarDireccion(){
        if(this.#direccion == "N/A" || this.#direccion == null){
            return null;
        }
        return this.#direccion.replace(/[\r\n\x0B\x0C\u0085\u2028\u2029]/g, '').trim();
    }
    // normalizarDiaEntrega(){
    //     if(this.#diaEntrega == "N/A" || this.#diaEntrega == null){
    //         return "No especifica";
    //     }
    //     return this.#diaEntrega.toLowerCase();
    // }
    normalizarDiaEntrega(){
        if(this.#diaEntrega == "N/A" || this.#diaEntrega == null){
            return null;
        }
        return this.#diaEntrega.replace(/[\r\n\x0B\x0C\u0085\u2028\u2029]/g, '').trim();
    }
    normalizarComuna(){
        if(this.#comuna == "N/A" || this.#comuna == null){
            return null;
        }

        return this.#comuna.replace(/[\r\n\x0B\x0C\u0085\u2028\u2029]/g, '').trim();
    }
    normalizarTipoDerecho(){
        if(this.#tipoDerecho == "N/A" || this.#tipoDerecho == null){
            return null;
        }
        return this.#tipoDerecho.replace(/[\r\n\x0B\x0C\u0085\u2028\u2029]/g, '').trim();
    }
    normalizarFechaObtencion(){
        if(this.#fechaObtencion == "N/A" || this.#fechaObtencion == null || this.#fechaObtencion == "" || this.#fechaObtencion == " "){
            return null;
        }
        return this.#fechaObtencion;
    }

    //Funcion que dado un string con el avaluo de la propiedad, estacionamiento y bodega, los suma
    // Si alguno de los strings es null o undefined, se considera como 0
    sumAvaluo() {
        if (!this.#avaluoPropiedad && !this.#avaluoEstacionamiento && !this.#avaluoBodega ) {
            return null;
        }
        const parsedPropiedad = parseInt(this.#avaluoPropiedad);
        const parsedEstacionamiento = parseInt(this.#avaluoEstacionamiento);
        const parsedBodega = parseInt(this.#avaluoBodega);
        const avaluoPropiedad = (typeof parsedPropiedad === 'number' && !isNaN(parsedPropiedad)) ? parsedPropiedad : 0;
        const avaluoEstacionamiento = (typeof parsedEstacionamiento === 'number' && !isNaN(parsedEstacionamiento)) ? parsedEstacionamiento : 0;
        const avaluoBodega = (typeof parsedBodega === 'number' && !isNaN(parsedBodega)) ? parsedBodega : 0;


        return avaluoPropiedad + avaluoEstacionamiento + avaluoBodega;
    }
    // Adaptador de roles para combinar propiedad, estacionamiento y bodega
    adaptRol() {
        let rol1, rol2, rol3;
        if (!this.#rolPropiedad && !this.#rolEstacionamiento && !this.#rolBodega) {
            return null;
        }
        // Limpiar y validar roles
        const cleanedRoles = [
            this.cleanRol(this.#rolPropiedad),
            this.cleanRol(this.#rolEstacionamiento),
            this.cleanRol(this.#rolBodega)
        ].filter(rol => rol !== null && rol !== undefined);

        // Si solo queda un rol válido, retornarlo directamente
        if (cleanedRoles.length === 1) {
            return cleanedRoles[0];
        }
        [rol1, rol2, rol3] = cleanedRoles;
        const comparisonResult = this.checkFirstHalves(rol1, rol2, rol3);
        const finalRol = this.mergeRol(rol1, rol2, rol3, comparisonResult);
        return finalRol;
    }

    checkFirstHalves(rolOne, rolTwo, rolThree) {
        let result;
        if (rolOne && rolTwo && rolThree) {
            result = this.checkThreeHalfs(rolOne, rolTwo, rolThree);
        } else if (rolOne && rolTwo) {
            result = this.checkTwoHalfs(rolOne, rolTwo) ? ONE_TWO : THREE_DIFF;
        } else if (rolOne && rolThree) {
            result = this.checkTwoHalfs(rolOne, rolThree) ? ONE_THREE : THREE_DIFF;
        } else if (rolTwo && rolThree) {
            result = this.checkTwoHalfs(rolTwo, rolThree) ? TWO_THREE : THREE_DIFF;
        } else {
            return null;
        }
        return result;
    }

    checkThreeHalfs(rolOne, rolTwo, rolThree) {
        const halfOne = rolOne.split("-")[0];
        const halfTwo = rolTwo.split("-")[0];
        const halfThree = rolThree.split("-")[0];
        if (halfOne == halfTwo && halfTwo == halfThree) {
            return THREE_SAME;
        } else if (halfOne == halfTwo) {
            return ONE_TWO;
        } else if (halfOne == halfThree) {
            return ONE_THREE;
        } else if (halfTwo == halfThree) {
            return TWO_THREE;
        } else if (halfOne != halfTwo && halfOne != halfThree && halfTwo != halfThree) {
            return THREE_DIFF;
        } else {
            return null;
        }
    }

    checkTwoHalfs(rolOne, rolTwo) {
        const halfOne = rolOne.split("-")[0];
        const halfTwo = rolTwo.split("-")[0];

        if (halfOne == halfTwo) {
            return true;
        } else if (halfOne != halfTwo) {
            return false;
        } else {
            return null;
        }
    }

    mergeRol(rol1, rol2, rol3, areSame) {
        let final;
        switch (areSame) {
            case THREE_SAME:
                final = this.mergeThreeRoles(rol1, rol2, rol3);
                break;

            case ONE_TWO:
                final = this.mergeDiffRoles(this.mergeTwoRoles(rol1, rol2), rol3);
                break;

            case ONE_THREE:
                final = this.mergeDiffRoles(this.mergeTwoRoles(rol1, rol3), rol2)
                break;

            case TWO_THREE:
                final = this.mergeDiffRoles(this.mergeTwoRoles(rol2, rol3), rol1)
                break;
            case THREE_DIFF:
                final = this.mergeDiffRoles(rol1, rol2, rol3)

                break;
            default:
                final = null;

        }
        return final;
    }

    mergeDiffRoles(rol1 = null, rol2 = null, rol3 = null) {
        if (rol1 && rol2 && rol3) {
            return rol1 + "//" + rol2 + "//" + rol3;
        } else if (rol1 && rol2) {
            return rol1 + "//" + rol2;
        } else if (rol1 && rol3) {
            return rol1 + "//" + rol3;
        } else if (rol2 && rol3) {
            return rol2 + "//" + rol3;
        } else if (rol1) {
            return rol1;
        }
    }

    // Funciones para unir dos roles
    mergeTwoRoles(rolOne, rolTwo) {
        if (!rolOne.includes("-") || !rolTwo.includes("-")) {
            return null;
        }
        const arrayRolOne = rolOne.split("-");
        const arrayRolTwo = rolTwo.split("-");
        if (arrayRolOne[0] === arrayRolTwo[0]) {
            rolOne += "-" + arrayRolTwo[1];
        }
        rolOne = rolOne.replace(/\s*/g, "");
        return rolOne;
    }

    // Función para unir tres roles
    mergeThreeRoles(rolOne, rolTwo, rolThree) {
        let twoRoles = this.mergeTwoRoles(rolOne, rolTwo);
        if (!twoRoles || !twoRoles.includes("-") || !rolThree.includes("-")) {
            if (twoRoles && twoRoles.includes("-")) {
                return twoRoles;
            } else if (rolOne.includes("-") && rolThree.includes("-")) {
                return this.mergeTwoRoles(rolOne, rolThree);
            }
            return null;
        }
        const arrayTwoRoles = twoRoles.split("-");
        const arrayRolThree = rolThree.split("-");
        if (arrayTwoRoles[0] == arrayRolThree[0]) {
            twoRoles += "-" + arrayRolThree[1];
        }
        return twoRoles
    }

    //Función para limpiar los roles de espacios de sobre, guiones largos y ceros iniciales
    cleanRol(rol) {
        if (!rol) {
            return null;
        }
        rol = rol.replace("−", "-");
        if (!rol.includes("-")) {
            return rol;
        }
        const parts = rol.split("-");
        const newFirst = cleanInitialZeros(parts[0]);
        const newSecond = cleanInitialZeros(parts[1]);
        return newFirst + "-" + newSecond;
    }

    checkEstacionamientoBodega() {
        // console.log("Revisando estacionamiento y bodega para el caso: ", caso.hasEstacionamiento, caso.hasBodega, caso.direccionEstacionamiento);
        if (!this.#direccion) {
            return null;
        }
        if (this.#hasEstacionamiento && this.#hasBodega) {
            // console.log("Tiene estacionamiento y bodega");
            const mergeDirections = this.mergeDirections(this.#direccion, this.#direccionEstacionamiento);
            return mergeDirections + " BOD";
        } else if (this.#hasEstacionamiento) {
            // console.log("Tiene estacionamiento");
            return this.mergeDirections(this.#direccion, this.#direccionEstacionamiento);
        } else if (this.#hasBodega) {
            // console.log("Tiene bodega");
            return this.#direccion + " BOD";
        } else {
            // console.log("No tiene estacionamiento ni bodega");
            return this.#direccion;
        }
    }

    //Funcion para unir dos direcciones, una habitacional y la segunda de estacionamiento
    mergeDirections(dir1, dir2) {
        if(!dir1){
            return null;
        }
        if(!dir2){
            return dir1.trim().toLowerCase();
        }
        // Normalizar espacios y convertir a arrays de palabras
        const palabras1 = dir1.trim().toLowerCase().split(/\s+/);
        const palabras2 = dir2.trim().toLowerCase().split(/\s+/);

        // Encontrar el punto donde divergen
        let indiceDivergencia = 0;
        while (indiceDivergencia < palabras1.length &&
            indiceDivergencia < palabras2.length &&
            palabras1[indiceDivergencia] === palabras2[indiceDivergencia]) {
            indiceDivergencia++;
        }

        // Tomar la primera dirección completa y añadir las partes únicas de la segunda
        const direccionCombinada = [
            ...palabras1,
            "Est", // Añadimos "Est" para indicar estacionamiento
            ...palabras2.slice(indiceDivergencia)
        ].join(' ');

        return direccionCombinada;
    }

    static completeInfo(caso1,caso2){
        let casoUnificado;
        if(caso1.origen == PJUD){
            casoUnificado = Caso.fillMissingData(caso1, caso2);
        }else{
            casoUnificado = Caso.fillMissingData(caso2, caso1);
        }
        return casoUnificado
    } 

    static fillMissingData(casoBase, casoRelleno) {
        casoBase.porcentaje = casoBase.porcentaje ?? casoRelleno.porcentaje;
        casoBase.formatoEntrega = casoBase.atoEntrega ?? casoRelleno.formatoEntrega;
        casoBase.fechaRemate = casoBase.fechaRemate ?? casoRelleno.fechaRemate;
        casoBase.montoMinimo = casoBase.montoMinimo ?? casoRelleno.montoMinimo;
        casoBase.comuna = casoBase.comuna ?? casoRelleno.comuna;
        casoBase.foja = casoBase.foja ?? casoRelleno.foja;
        casoBase.numero = casoBase.numero ?? casoRelleno.numero;
        casoBase.partes = casoBase.partes ?? casoRelleno.partes;
        casoBase.tipoPropiedad = casoBase.tipoPropiedad ?? casoRelleno.tipoPropiedad;
        casoBase.tipoDerecho = casoBase.tipoDerecho ?? casoRelleno.tipoDerecho;
        casoBase.anno = casoBase.anno ?? casoRelleno.anno;
        casoBase.martillero = casoBase.martillero ?? casoRelleno.martillero;
        casoBase.direccion = casoBase.direccion ?? casoRelleno.direccion;
        casoBase.diaEntrega = casoBase.diaEntrega ?? casoRelleno.diaEntrega;
        casoBase.rolPropiedad = casoBase.rolPropiedad ?? casoRelleno.rolPropiedad;
        casoBase.avaluoPropiedad = casoBase.avaluoPropiedad ?? casoRelleno.avaluoPropiedad;
        casoBase.estadoCivil = casoBase.estadoCivil ?? casoRelleno.estadoCivil;
        casoBase.corte = casoBase.corte ?? casoRelleno.corte;
        casoBase.numeroJuzgado = casoBase.numeroJuzgado ?? casoRelleno.numeroJuzgado;
        casoBase.rolEstacionamiento = casoBase.rolEstacionamiento ?? casoRelleno.rolEstacionamiento;
        casoBase.avaluoEstacionamiento = casoBase.avaluoEstacionamiento ?? casoRelleno.avaluoEstacionamiento;
        casoBase.direccionEstacionamiento = casoBase.direccionEstacionamiento ?? casoRelleno.direccionEstacionamiento;
        casoBase.rolBodega = casoBase.rolBodega ?? casoRelleno.rolBodega;
        casoBase.avaluoBodega = casoBase.avaluoBodega ?? casoRelleno.avaluoBodega;
        casoBase.hasEstacionamiento = casoBase.hasEstacionamiento ?? casoRelleno.hasEstacionamiento;
        casoBase.hasBodega = casoBase.hasBodega ?? casoRelleno.hasBodega;
        casoBase.owners = casoBase.owners ?? casoRelleno.owners;
        casoBase.montoCompra = casoBase.montoCompra ?? casoRelleno.montoCompra;
        casoBase.isPaid = casoBase.isPaid ?? casoRelleno.isPaid;
        return casoBase;
    }

    static createMockCase() {
        const mockCase = new this(
            '2025/05/19', // fechaObtencion
            '2023-01-15', // fechaPublicacion
            'http://example.com/case/123', // link
            'Supreme Court' // origen
        );

        // Set additional mock properties
        mockCase.causa = "C-746-2024";
        mockCase.juzgado = "1º JUZGADO DE LETRAS DE IQUIQUE";
        mockCase.porcentaje = 100;
        mockCase.comuna = "iquique";
        mockCase.direccion = "rio esena 2370 barcelona";
        mockCase.avaluoPropiedad = 250000;
        mockCase.montoMinimo = {monto : 999999, moneda: "Pesos"};
        mockCase.porcentaje = '10';
        mockCase.formatoEntrega = "vale vista";
        mockCase.tipoDerecho = "nuda propiedad";
        mockCase.anno = 2000;
        mockCase.rolPropiedad = "3795-302";
        mockCase.estadoCivil = "soltero";
        mockCase.corte = 11;
        mockCase.numeroJuzgado = 9; 
        mockCase.montoCompra = {monto: 1000, moneda: "UF"};
        mockCase.deudaHipotecaria = '1200 uf';
        mockCase.origen = '2';
        mockCase.fechaRemate = new Date('2000/05/19');

        return mockCase;
    }

    static bindCaseWithDB(currentCase, dbCase) {
        currentCase.porcentaje = currentCase.porcentaje ?? dbCase.porcentajeIda;
        currentCase.formatoEntrega = currentCase.formatoEntrega ?? dbCase.tipoParticipacion;
        currentCase.fechaRemate = currentCase.fechaRemate ?? dbCase.fechaRemate;
        currentCase.montoMinimo = currentCase.montoMinimo ?? dbCase.minimoParticipacion;
        currentCase.comuna = currentCase.comuna ?? dbCase.nombre_comuna;
        currentCase.partes = currentCase.partes ?? dbCase.partes;
        currentCase.tipoDerecho = currentCase.tipoDerecho ?? dbCase.estado_remate;
        currentCase.anno = currentCase.anno ?? dbCase.ano;
        currentCase.direccion = currentCase.direccion ?? dbCase.direccion;
        currentCase.rol = currentCase.rol ?? dbCase.rol;
        if(dbCase.estado_civil){
            currentCase.estadoCivil = currentCase.estadoCivil ?? dbCase.estado_civil + " " + dbCase.tipo_estado;
        }
        // currentCase.corte = currentCase.corte ?? dbCase.corte;
        currentCase.numeroJuzgado = currentCase.numeroJuzgado ?? dbCase.idJuzgado;
        currentCase.montoCompra = currentCase.montoCompra ?? dbCase.montoCompra;
        if(new Date(dbCase.fechaRemate) < currentCase.fechaRemate){
            currentCase.alreadyAppear = new Date(dbCase.fechaRemate);
        }
        return currentCase;
    }
}

module.exports = Caso;