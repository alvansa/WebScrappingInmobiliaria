const {cleanInitialZeros} = require('../../utils/cleanStrings');
const config = require('../../config');
const DateHelper = require('./Normalizers/DateHelper');
const RolHelper = require('./Normalizers/RolHelper');
const StringHelper = require('./Normalizers/StringHelper');
const NumberHelper = require('./Normalizers/NumberHelper');

const EMOL = config.EMOL;
const PJUD = config.PJUD;
const LIQUIDACIONES = config.LIQUIDACIONES;
const PREREMATES = config.PREREMATES;
const otros = config.OTROS;

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
    #isAvenimiento;
    #hasChanged
    #coordenadas;
    #linkMap;
    #mortageBank;

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
        this.#isAvenimiento = false;
        this.#coordenadas = null;
        this.#mortageBank = null;

        this.#unitRol = null;
        this.#unitAvaluo = null;
        this.#unitDireccion = null;
        this.#hasChanged = false;

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
    set isAvenimiento(isAvenimiento){
        this.#isAvenimiento = isAvenimiento;
    }
    set hasChanged(changed){
        this.#hasChanged = changed;
    }
    set coordenadas(coordenadas){
        this.#coordenadas = coordenadas;
    }
    set linkMap(linkMap){
        this.#linkMap = linkMap;
    }
    set mortageBank(mortageBank){
        this.#mortageBank = mortageBank;
    }

   get hasChanged(){
        return this.#hasChanged;
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
        return StringHelper.juzgado(this.#juzgado);
    }

    get fechaRemate(){
        if(this.#fechaRemate == "N/A" || this.#fechaRemate == null){
            return null;
        }
        return DateHelper.normalize(this.#fechaRemate, this.#origen);
    }
    get fechaRemateSQL(){
        if(!this.#fechaRemate){
            return null;
        }
        return DateHelper.formatearParaSQL(this.fechaRemate);
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
        return StringHelper.comuna(this.#comuna);
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
        return StringHelper.direccion(this.#direccion);
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
        if(this.#montoMinimo == "N/A" || !this.#montoMinimo){
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
        return this.normalizarAnno();
    }
    get isPaid(){
        return this.#isPaid;
    }
    get deudaHipotecaria(){
        if(!this.#deudaHipotecaria){
            return null;
        }
        return NumberHelper.deudaHipotecaria(this.#deudaHipotecaria);
    }
    get formatoEntrega(){
        if(!this.#formatoEntrega){
            return null;
        }
        return StringHelper.formatoEntrega(this.#formatoEntrega);
    }
    get partes(){
        if(!this.#partes){
            return null;
        }
        return StringHelper.partes(this.#partes, this.#origen);
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
            return RolHelper.normalizeRol(this.#rolPropiedad, this.#rolEstacionamiento, this.#rolBodega);
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
    get diaEntrega(){
        if(!this.#diaEntrega){
            return null;
        }
        return this.normalizarDiaEntrega();
    }
    get moneda(){
        const monto =  this.normalizarMontoMinimo()
        return monto["moneda"];
    }
    get foja(){
        if(!this.#foja){
            return null;
        }
        return String(this.#foja);
    }
    get numero(){
        if(!this.#numero){
            return null;
        }
        return String(this.#numero);
    }
    get tipoPropiedad(){
        return this.#tipoPropiedad ?? null ;
    }
    get tipoDerecho(){
        return this.#tipoDerecho ?? null ;
    }
    get martillero(){
        return this.#martillero ?? null ;
    }
    get aviso(){
        return this.#texto ?? null ;
    }
    get isAvenimiento(){
        return Boolean(this.#isAvenimiento);
    }
    get coordenadas(){
        return this.#coordenadas;
    }
    get linkMap(){
        return this.#linkMap;
    }
    get mortageBank(){
        return this.#mortageBank;
    }


  

    toObject() {
        const montoMoneda = this.normalizarMontoMinimo(); 
        const causaNormalizada = this.normalizarCausa();
        const annoNormalizado = this.normalizarAnno();
        const porcentajeNormalizado = this.normalizarPorcentaje(); 
        const diaEntregaNormalizado = this.normalizarDiaEntrega();
        const comunaNormalizada = this.normalizarComuna();
        const tipoDerechoNormalizado = this.normalizarTipoDerecho();
        

        return {
            fechaObtencion: DateHelper.normalize(this.#fechaObtencion, this.#origen),
            fechaPublicacion: this.#fechaPublicacion,
            link: this.#link,
            causa: causaNormalizada,
            juzgado: StringHelper.juzgado(this.#juzgado),
            porcentaje: porcentajeNormalizado,
            formatoEntrega: StringHelper.formatoEntrega(this.#formatoEntrega),
            fechaRemate: DateHelper.normalize(this.#fechaRemate, this.#origen), 
            // montoMinimo: this.#montoMinimo,
            montoMinimo: montoMoneda["monto"],
            moneda : montoMoneda["moneda"],
            multiples: this.#multiples,
            multiplesFoja : this.#multiplesFoja,
            comuna: StringHelper.comuna(this.#comuna),
            foja: this.#foja,
            partes: StringHelper.partes(this.#partes, this.#origen),
            tipoPropiedad: this.#tipoPropiedad,
            tipoDerecho: tipoDerechoNormalizado,
            anno: annoNormalizado,
            martillero: this.#martillero,
            direccion: StringHelper.direccion(this.#direccion),
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
            isPaid: this.#isPaid,
            deudaHipotecaria : NumberHelper.deudaHipotecaria(this.#deudaHipotecaria),
            alreadyAppear: this.#alreadyAppear,
            unitRol: RolHelper.normalizeRol(this.#rolPropiedad, this.#rolEstacionamiento, this.#rolBodega) ,
            unitAvaluo: this.sumAvaluo(),
            unitDireccion : this.checkEstacionamientoBodega(),
            isAvenimiento : Boolean(this.#isAvenimiento),
            hasChanged : this.#hasChanged,
            coordenadas : this.#coordenadas,
            linkMap : this.#linkMap,
            mortageBank : this.#mortageBank,
        };
    } 

    // Obtiene el número de la causa para buscar el remate en el pjud
    getCausaPjud(){
        if(this.#causa.includes('N/A') || this.#causa == null){
            return null;
        }
        const causa = this.normalizarCausa(this.#causa).split('-');
        return causa[1];
    }

    // Obtiene el año de la causa para buscar el remate en el pjud
    getAnnoPjud(){
        if(this.#causa.includes('N/A') || this.#causa == null){
            return null;
        }
            
        const causa = this.normalizarCausa(this.#causa).split('-');
        return causa[2];
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
        try{

        if(this.#montoMinimo == "N/A" || !this.#montoMinimo){
            return {"monto": null, "moneda": null};
        }
        let montoFinal;
        let moneda;
        
        if(this.#origen == LIQUIDACIONES){ 
            // if ((typeof this.#montoMinimo) == 'object') {
            //     return this.#montoMinimo;
            // }
            if(typeof this.#montoMinimo.monto == "number"){
                return this.#montoMinimo;
            }
            console.log(this.#montoMinimo, typeof this.#montoMinimo, this.#link)
            montoFinal = this.#montoMinimo.replaceAll('.','').replaceAll(',','.');
            moneda = "Pesos";
        }else if(this.#montoMinimo !== null){
            if(typeof this.#montoMinimo.monto == "number"){
                return this.#montoMinimo;
            }
            let montominimo = this.#montoMinimo["monto"];
            if(!montominimo) return {"monto": null, "moneda" : null};
            montoFinal = montominimo.replaceAll('.', '').replaceAll(',', '.').replaceAll(' ', '');
            moneda = this.#montoMinimo["moneda"];
        }
        return {"monto": parseFloat(montoFinal), "moneda" : moneda};
        }catch(error){
            console.error(error.message, this.#causa);
            console.error(error);
        }
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
        }else if(this.#origen == PJUD){
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
        return partesNormalizadas.trim().toLocaleLowerCase();
    }

    normalizarAnno(){
        if(this.#anno == 0 || this.#anno == "N/A" || this.#anno == null || this.#anno == "No especifica"){
            return null;
        }
        if(typeof this.#anno === "number"){
            return this.#anno;
        }
        const anno = this.#anno.replaceAll(".","");
        return Number(anno);
    }

    normalizarPorcentaje(){
        if(this.#porcentaje == "N/A" || this.#porcentaje == null){
            return null;
        }
        if(typeof(this.#porcentaje) === "number"){
            return this.#porcentaje;
        }
        const porcentaje = this.#porcentaje
            .replaceAll(" ","")
            .replaceAll("%","");
        return parseInt(porcentaje);
    }

    // normalizarFormatoEntrega()new {
    //     if(this.#formatoEntrega == "N/A" || this.#formatoEntrega == null){
    //         return null;
    //     }
    //     if(this.#formatoEntrega == "vale a la vista"){
    //         return "vale vista";
    //     }
    //     const formato = this.#formatoEntrega
    //     .toLowerCase()
    //     .replace(/(\s+)/g, ' ') // Reemplazar espacios y comas por un solo espacio;
    //     .replace(/\n/g, ' ')
    //     .trim(); // Reemplazar saltos de línea por espacios
    //     return formato;
    // }
    normalizarCausa() {
        let causa;
        const valorOriginal = this.#causa;
        
        if (valorOriginal === "N/A" || valorOriginal === null || !valorOriginal) {
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

    // normalizarDireccion(){
    //     if(this.#direccion == "N/A" || this.#direccion == null){
    //         return null;
    //     }
    //     return this.#direccion.replace(/[\r\n\x0B\x0C\u0085\u2028\u2029]/g, '').trim();
    // }
    // normalizarDiaEntrega(){
    //     if(this.#diaEntrega == "N/A" || this.#diaEntrega == null){
    //         return "No especifica";
    //     }
    //     return this.#diaEntrega.toLowerCase();
    // }
    normalizarDiaEntrega(){
        if(this.#diaEntrega == "N/A" || !this.#diaEntrega){
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