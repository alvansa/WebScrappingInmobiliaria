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
    get juzgado(){
        return String(this.#juzgado);
    }
    get causa(){
        return String(this.#causa);
    }
  

    toObject() {
        let montominimo;
        let moneda;

        if(this.#origen == LIQUIDACIONES){
            montominimo = this.#montoMinimo.replaceAll('.','').replaceAll(',','.');
            moneda = "CLP";
        }else if(this.#montoMinimo !== 'N/A'){
            montominimo = this.getMontoMinimo();
            moneda = this.getTipoMoneda();
        }else{
            montominimo = "No especifica";
            moneda = "No aplica";
        }
        const annoNormalizado = this.normalizarAnno();
        const porcentajeNormalizado = this.normalizarPorcentaje(); 
        const formatoEntregaNormalizado = this.normalizarFormatoEntrega();


        return {
            fechaObtencion: this.#fechaObtencion,
            fechaPublicacion: this.#fechaPublicacion,
            link: this.#link,
            causa: this.#causa.replace("\n",""),
            juzgado: this.#juzgado,
            porcentaje: porcentajeNormalizado,
            formatoEntrega: formatoEntregaNormalizado,
            fechaRemate: this.transformarFecha(),
            // montoMinimo: this.#montoMinimo,
            montoMinimo: montominimo,
            moneda : moneda,
            multiples: this.#multiples,
            multiplesFoja : this.#multiplesFoja,
            comuna: this.#comuna,
            foja: this.#foja,
            numero: this.#numero,
            partes: this.normalizarPartes(),
            tipoPropiedad: this.#tipoPropiedad,
            tipoDerecho: this.#tipoDerecho,
            anno: annoNormalizado,
            martillero: this.#martillero,
            direccion: this.#direccion,
            diaEntrega: this.#diaEntrega,
            aviso : this.#texto,
        };
    } 

    // Transforma la fecha de la publicación de estar escrita en palabras a un objeto Date
    transformarFecha(){
        // Si el origen es Pjud, viene con formato tipo dd/mm/yyyy HH:mm:ss
        if(this.#origen == PJUD){
            this.#fechaRemate = this.#fechaRemate.split(' ')[0];
            const partes = this.#fechaRemate.split('/');
            let fechaRemate = new Date(partes[2],partes[1]-1,partes[0]);
            fechaRemate.setHours(fechaRemate.getHours() + 6);
            console.log(fechaRemate);
            return fechaRemate;
        }

        // Si el origen es Liquidaciones, viene con el formato Date listo
        if(this.#origen == LIQUIDACIONES){return this.#fechaRemate;}
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

    getCorte(){
        const comuna = this.#juzgado.split('de').at(-1).trim();
    }
    // Obtiene el número de la causa para buscar el remate en el pjud
    getCausaPjud(){
        if(this.#causa.includes('N/A')){
            return null;
        }
        const causa = this.#causa.split('-');
        return causa[1];
    }

    // Obtiene el año de la causa para buscar el remate en el pjud
    getAnnoPjud(){
        if(this.#causa.includes('N/A')){
            return null;
        }
            
        const causa = this.#causa.split('-');
        return causa[2];
    }
   
    // Obtiene el día de la fecha de cuando se realizara el remate.
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

    // Obtiene el mes de la fecha de cuando se realizara el remate.
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
        console.log("Año en palabras: ",añoEnPalabras);
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

    // Devuelve el tipo de moneda en que se encuentra el monto mínimo
    getTipoMoneda(){
        const montoMinimo = this.#montoMinimo.toLowerCase();
        if(this.#montoMinimo.includes("$")){
            return "CLP";
        }else if(montoMinimo.includes("uf")|montoMinimo.includes("unidadesdefomento")|montoMinimo.includes("u.f.")|montoMinimo.includes("uf.")){
            console.log("UF");
            return "UF";
        }    
    }

     //Devuelve el indentificador de la corte a la cual pertenece el juzgado del caso
    getCortePjud() {
        if (this.#juzgado === "N/A" | this.#juzgado === "juez partidor") {
            return null;
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

    return null; // Retorna `null` si no encuentra ninguna coincidencia
}

    normalizarPartes(){
        console.log("Partes: ",this.#partes);
        if(this.#partes == "N/A"){
            return "No especifica";
        }
        const partesNormalizadas = this.#partes.toLowerCase();
        const palabrasClave = ["caratulados:","caratulados","caratulado:","caratulado","caratuladas:","caratuladas","caratulada:","caratulada"];
        for(let palabra of palabrasClave){
            if(partesNormalizadas.includes(palabra)){
                const index = partesNormalizadas.indexOf(palabra);
                const inicio = index + palabra.length + 1 ;
                const partes = partesNormalizadas.slice(inicio);
                console.log("Partes: ",partes);
                return partes;
            }
        }
        const regexExpediente = /^expediente C-\d{1,7}-\d{4} (.+)$/i;
        const expediente = partesNormalizadas.match(regexExpediente);
        if(expediente){
            return expediente[1];
        }

        return this.#partes;
    }

    normalizarAnno(){
        if(this.#anno == 0){
            return "No especifica";
        }
        const anno = this.#anno.replaceAll(".","");
        return anno;
    }

    normalizarPorcentaje(){
        if(this.#porcentaje == "N/A"){
            return "No especifica";
        }
        const porcentaje = this.#porcentaje.replaceAll(" ","");
        return porcentaje;
    }

    normalizarFormatoEntrega(){
        if(this.#formatoEntrega == "N/A"){
            return "No especifica";
        }
        if(this.#formatoEntrega == "vale a la vista"){
            return "vale vista";
        }
        return this.#formatoEntrega;
    }

}

module.exports = Caso;