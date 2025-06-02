const EMOL = 1;
const PJUD = 2;
const LIQUIDACIONES = 3;
const PREREMATES = 4;
const otros = 0;


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

    constructor(fechaObtencion, fechaPublicacion = 'N/A',link = 'N/A',origen = null ){    
        this.#fechaPublicacion = fechaPublicacion;
        this.#fechaObtencion = fechaObtencion;
        this.#origen = origen;
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

    
    get link(){ 
        return String(this.#link);
    }
    get texto(){
        return String(this.#texto);
    }
    get juzgado(){
        return String(this.#juzgado);
    }
    get fechaRemate(){
        if(this.#fechaRemate == "N/A" || this.#fechaRemate == null){
            return null;
        }
        return this.#fechaRemate;
    }
    get causa(){
        return String(this.#causa);
    }
    get comuna(){
        if(this.#comuna == null){
            return null;
        }
        return String(this.#comuna);
    }
    get rolPropiedad(){
        if(this.#rolPropiedad == null){
            return null;
        }
        return String(this.#rolPropiedad);
    }
    get avaluoPropiedad(){
        if(this.#avaluoPropiedad === null){
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

  

    toObject() {
        const fechaObtencionNormalizada = this.normalizarFechaObtencion()
        const montoMoneda = this.normalizarMonto(); 
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

        return {
            fechaObtencion: fechaObtencionNormalizada,
            fechaPublicacion: this.#fechaPublicacion,
            link: this.#link,
            causa: causaNormalizada,
            juzgado: juzgadoNormalizado,
            porcentaje: porcentajeNormalizado,
            formatoEntrega: formatoEntregaNormalizado,
            fechaRemate: this.transformarFecha(),
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
        };
    } 

    // Transforma la fecha de la publicación de estar escrita en palabras a un objeto Date
    transformarFecha(){
        if(this.#fechaRemate == "N/A" || this.#fechaRemate == null){ 
            return null;
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
        if(typeof(this.#fechaRemate) == Date){
            return this.#fechaRemate;
        }
        // Si el origen es Emol, puede venir con formato de palabras
        const dia = this.getDia();
        const mes = this.getMes();
        const anno = this.getAnno();
        if (dia && mes && anno) {
            const fecha = new Date(anno, mes - 1, dia);
            // Se suma 6 horas ya que la fecha a veces queda si es del 25 de diciembre queda como 
            // 24 de diciembre a las 23:59:59.999, por lo que se suma 6 horas para que quede como 25 de diciembre
            return new Date(fecha.getTime() + 6 * 60 * 60 * 1000); // Sumar 6 horas
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
    normalizarMonto(){
        if(this.#montoMinimo == "N/A" || this.#montoMinimo == null){
            return {"monto": null, "moneda": null};
        }
        let montoFinal;
        let moneda;
        if(this.#origen == LIQUIDACIONES){ 
            montoFinal = this.#montoMinimo.replaceAll('.','').replaceAll(',','.');
            moneda = "Pesos";
        }else if(this.#montoMinimo !== null){
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
        if(this.#partes === "N/A" || this.#partes === null){
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
        return this.#formatoEntrega;
    }
    normalizarCausa() {
        const valorOriginal = this.#causa;
        
        if (valorOriginal === "N/A" || valorOriginal === null) {
            return null;
        }

        let causa = valorOriginal
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
}

module.exports = Caso;