const { getPaginas, getRemates } = require('./getNextPage.js');
const { comunas, tribunales2,BANCOS } = require('../caso/datosLocales.js');
const Caso  = require('../caso/caso.js');

async function getDatosRemate(fechaHoy,fechaInicioStr,fechaFinStr,maxRetries){
    try {
        // Obtiene los casos de la pagina de "economico.cl"
        let caso;
        const casos = await getPaginas(fechaHoy,fechaInicioStr,fechaFinStr);
        for (caso of casos){
            pagina = caso.link;
            const description = await getRemates(pagina,maxRetries);
            caso.darTexto(description);
        }
        // Procesa los remates a partir del texto obtenido.
        for(let caso of casos){
            procesarDatosRemate(caso);
        }
        return casos;
    }
    catch (error) {
        console.error('Error al obtener resultados en el controlador:', error);
    }
}

//Funcion que procesa los datos de un remate y obtiene la informacion necesaria
function procesarDatosRemate(caso){
    texto = caso.texto;
    const causa = getCausa(texto);
    const juzgado = getJuezPartidor(texto) ? "Juez Partidor" : getJuzgado2(texto);
    const porcentaje = getPorcentaje(texto);
    const formatoEntrega = getFormatoEntrega(texto);
    const fechaRemate = getFechaRemate(texto);
    const montoMinimo = getMontoMinimo(texto);
    const multiples = getMultiples(texto);
    const comuna = getComuna(texto);
    const foja = getFoja(texto);
    const numero = getNumero(texto);
    const partes = getPartes(texto);
    const tipoPropiedad = getTipoPropiedad(texto);
    const tipoDerecho = getTipoDerecho(texto);
    const direccion = getDireccion(texto);
    const diaEntrega = getDiaEntrega(texto);
    const anno = getAnno(texto);

    if (causa != null){
        caso.darCausa(causa[0]);
    }else{
        // console.log("Causa no encontrada");
        const causaVoluntaria = getCausaVoluntaria(texto);
        if (causaVoluntaria != null){
            caso.darCausa(causaVoluntaria[0]);
        }
    }

    if (juzgado != null){
        caso.darJuzgado(juzgado);
    }

    if (porcentaje != null){
        caso.darPorcentaje(porcentaje[0]);
        const minimoPorcentaje =porcentaje[0].match(/\d{1,3}\s*%/);
        const minimoPesos = porcentaje[0].match(/(\d{1,3}\.)*\d{1,3}(,\d{1,5})*/);
        if(minimoPorcentaje != null){
            caso.darPorcentaje(minimoPorcentaje[0]);
        }else if(minimoPesos != null){
            caso.darPorcentaje(minimoPesos[0]);
        }

    }
    if (formatoEntrega != null){
        caso.darFormatoEntrega(formatoEntrega[0]);
    }
    if (fechaRemate != null){
        caso.darFechaRemate(fechaRemate[0]);
    }
    if (montoMinimo != null){
        caso.darMontoMinimo(montoMinimo);
    }
    caso.darMultiples(multiples);
    
    if (comuna != null){
        caso.darComuna(comuna);
    }
    if (foja != null){
        caso.darFoja(foja[0]);
    }
    if (anno != null){
        caso.darAnno(anno);
    }
    if (numero != null){
        caso.darNumero(numero[1]);
    }
    if (partes != null){
        caso.darPartes(partes);
    }
    if (tipoPropiedad != null){
        caso.darTipoPropiedad(tipoPropiedad[0]);
    }
    if (tipoDerecho != null){
        caso.darTipoDerecho(tipoDerecho[0]);
    }
    if (direccion != null){
        caso.darDireccion(direccion);
    }
    if (diaEntrega != null){
        caso.darDiaEntrega(diaEntrega[0]);
    }
}

//FUNCIONES PARA OBTENER INFORMACION DE LOS REMATES
//crea una funcion que revise en la descripcion a base de regex el juzgado
function getCausa(data) {
    //Anadir C- con 3 a 5 digitos, guion, 4 digitos
    const regex = /\bC\s*[-]*\s*\d{1,7}(?:\.\d{3})*\s*[-/]\s*\d{1,4}(?:\.\d{3})*/i;
    
    const causa = data.match(regex);
    if (causa != null){
        return causa;
    }
    const causaRegexSinC = /Rol\s*[-]*\s*\d{1,7}(?:\.\d{3})*\s*[-/]\s*\d{1,4}(?:\.\d{3})*/i;
    const causaSinC = data.match(causaRegexSinC);
    if (causaSinC != null){
        return causaSinC;
    }
    const regexCausaRolN = /rol\s*n(?:º|°)\s*\d{1,7}(?:\.\d{3})*\s*[-/]\s*\d{1,4}(?:\.\d{3})*/i;
    const causaRolN = data.match(regexCausaRolN);
    if(causaRolN != null){
        return causaRolN; 
    } 
}

function getCausaVoluntaria(data){
    const regex = /V\s*[-]*\s*\d{1,7}(?:\.\d{3})*\s*-\s*\d{1,4}(?:\.\d{3})*/i;
    const causa = data.match(regex);
    return causa;
}
//Probando para refactorizar la funcion que busca el juzgado
function getJuzgado2(data) {
    const normalizedData = data.toLowerCase().replaceAll(",",'').replaceAll("de ",'').normalize("NFD").replace(/[\u0300-\u036f]/g, "").replaceAll("stgo","santiago").replaceAll("  "," ").replace(/\n/g," ");
    let tribunalesAceptados = [];
    // console.log("Data normalizada en getJuzgado2: ",normalizedData);
    for (let tribunal of tribunales2){
        const tribunalNormalized = tribunal.toLowerCase().replaceAll("de ","").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const tribunalSinDe = tribunalNormalized.replaceAll("de ",'');
        const numero = tribunal.match(/\d{1,2}/);
        
        if (numero){
            const numeroOrdinal = convertirANombre(parseInt(numero));
            const tribunalVariations = [
                tribunalNormalized,
                tribunalNormalized.replace(/\d{1,2}°/,numeroOrdinal),
                tribunalNormalized.replace('°', 'º'),
                tribunalNormalized.replace("°", ""),
                tribunalNormalized.replace("juzgado", "tribunal"),
                tribunalNormalized.replace(/\d{1,2}°/,numeroOrdinal).replace("juzgado", "tribunal"),
                tribunalNormalized.replace('°', 'º').replace("juzgado", "tribunal"),
                tribunalNormalized.replace("°", "").replace("juzgado", "tribunal"),
                // Variaciones donde el numero del tribunal/juzgado esta pegado a la palabra
                tribunalNormalized.replace(" ",""),
                tribunalNormalized.replace(/\d{1,2}°/,numeroOrdinal).replace(" ",""),
                tribunalNormalized.replace('°', 'º').replace(" ",""),
                tribunalNormalized.replace("°", "").replace(" ",""),
                tribunalNormalized.replace("juzgado", "tribunal").replace(" ",""),
                tribunalNormalized.replace(/\d{1,2}°/,numeroOrdinal).replace("juzgado", "tribunal").replace(" ",""),
                tribunalNormalized.replace('°', 'º').replace("juzgado", "tribunal").replace(" ",""),
                tribunalNormalized.replace("°", "").replace("juzgado", "tribunal").replace(" ",""),
                tribunalNormalized.replace(/\d{1,2}°/,numero+" °"),
                tribunalNormalized.replace(/\d{1,2}°/,numero+" º"),
                tribunalNormalized.replace(/\d{1,2}°\s*/,numero+" °"),
                tribunalNormalized.replace(/\d{1,2}°\s*/,numero+" º"),
            ];
            // if(tribunal.includes("14° JUZGADO CIVIL DE SANTIAGO")){

            //     console.log("Variaciones: ",tribunalVariations);
            // }

            // Verificar si alguna variación coincide
            if (tribunalVariations.some(variation => normalizedData.includes(variation))) {
                tribunalesAceptados.push(tribunal);
                continue;
            }
            if(tribunal.includes("EN LO CIVIL")){
                const tribunalVariationCivil = tribunalVariations.map(variation => variation.replace("en lo civil ",""));
                // if(tribunal.includes("3° JUZGADO DE LETRAS EN LO CIVIL DE ANTOFAGASTA")){
                //     console.log("Variaciones: ",tribunalVariationCivil);
                // }
                if (tribunalVariationCivil.some(variation => normalizedData.includes(variation))) {
                    tribunalesAceptados.push(tribunal);
                    continue;
                }
            }

        }
        // Verificar el tribunal original y sin "de "
        if (normalizedData.includes(tribunalNormalized) || normalizedData.includes(tribunalSinDe)) {
        tribunalesAceptados.push(tribunal);
    }
    }
    // Devolver el último tribunal aceptado o null si no hay coincidencias
    console.log("Tribunales aceptados: ",tribunalesAceptados);
    return tribunalesAceptados.length > 0 ? tribunalesAceptados.at(-1) : null;
        
}


// Si no se encuentra el juzgado de la lista, se busca si es un juez partidor
function getJuezPartidor(data){
    const juezRegex = /partidor|particion|partición|Árbitro|árbitro|judicial preventivo|arbitro|arbitral/i;
    const juez = data.match(juezRegex);
    if (juez != null){
        return true;
    }else{
        return false;
    }
}
function getPorcentaje(data) {
    const regexMinimos = [
        /\d{1,3}\s*%\s*(?:del\s+)?(?:mínimo|valor|precio)+/i,
        /(garantía|Garantía)\s+(suficiente\s+)?(de\s+)?(\$\s*)?(\d{1,3}(?:\.\d{3})*,?\d*)/i,
        /(caución|interesados\s+)[a-zA-ZáéíóúÑñ:\s]*\d{1,3}\s*%/i,
        /(garantía|Garantía)\s+(suficiente\s+)?(por\s+)?(el\s+)?\d{1,3}%/i,
        /(para\s*participar)[\wáéíóúÑñ:\s]{1,200}(mínimo\s*fijado)/i,
        /garantía\s*[\w,áéíóúÑñ0-9%:\s]{1,200}mínimo/i,
    ];
    for(let regex of regexMinimos){
        const porcentaje = data.match(regex);
        if (porcentaje != null){
            return porcentaje;
        }
    }
    
    return null;
}
// Buscar el formato de entrega, ya sea vale vista o cupon
function getFormatoEntrega(data) {
    const regex = /(vale\s+)(vista)|(cupón)|(vale a la vista)/i
    const formatoEntrega = data.match(regex);
    return formatoEntrega;
}

// Obtiene la fecha del remate.
function getFechaRemate(data) {
    const regexs = [
        /(\d{1,2})\s*(de\s+)?(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)[\s]*((de|del)\s+)?(año\s+)?(\d{4})/i,
        /(lunes|martes|miércoles|jueves|viernes|sábado|domingo)?\s*([a-zA-Záéíóú]*\s+)(de\s+)?(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)(\s+de)\s+(dos mil (veinticuatro|veinticinco|veintiseis|veintisiete|veintiocho|veintinueve|treinta|treinta y uno)?)?/i,
    ];
    for(let regex of regexs){
        const fechaRemate = data.match(regex);
        if (fechaRemate != null){
            return fechaRemate;
        }
    }
}

//Obtiene el monto minimo por el cual iniciara el remate.
function getMontoMinimo(data) {
    // console.log(data);
    const regexPatronBase = "(?:subasta|m[íi]nim[oa]|rematar|propiedad)\\s*[.,a-zA-ZáéíóúÑñ:º0-9\\s]*\\s+";
    
    const regexMontoMinimo = [
        `${regexPatronBase}(\\d{1,12}(?:\\.\\d{1,3})*(?:,\\d{1,10})?)\\s*\\.?-?\\s*(?:Unidades de Fomento|UF|U\\.F\\.)`, 
        `${regexPatronBase}(?:Unidades de Fomento|U\\.?F\\.?)\\s*(\\d{1,12}\\s*(?:\\.\\d{1,3})*\\s*(?:,\\d{1,10})?)`,
        `${regexPatronBase}\\$\\s*(\\d{1,3}(?:\\.\\d{3})+)`
    ];
    const dataNormalizada = data.replace(/(\d)\s(?=\d{1,3}(?:\.\d{3})+)/g, '$1').replace(/\n/g," ");
    const regexList = buscarOpcionesMontoMinimo(dataNormalizada,regexMontoMinimo);
    console.log("RegexList: ",regexList);
    let montoFinal = buscarMontosFinal(regexList,regexMontoMinimo);
    if (montoFinal){
        return montoFinal;
    }
    return null;
}

function buscarOpcionesMontoMinimo(data,regexMontoMinimo){
    let regexList = [];
    const regexBuscarOpciones = [
        new RegExp(regexMontoMinimo[0],"gi"),
        new RegExp(regexMontoMinimo[1],"gi"),
        new RegExp(regexMontoMinimo[2],"gi"),
    ];
    console.log("RegexBuscarOpciones: ",regexBuscarOpciones);
    console.log(data);
    for(let regex of regexBuscarOpciones){
        const posibleMonto = data.match(regex);
        if (posibleMonto){
            regexList.push(...posibleMonto);
        }
    }
    return regexList;
}

function buscarMontosFinal(regexList,regexMontoMinimo){
    const regexBuscarMontos = [
       { regex: new RegExp(regexMontoMinimo[0],"i"), moneda: "UF"},
       { regex: new RegExp(regexMontoMinimo[1],"i"), moneda: "UF"},
       { regex: new RegExp(regexMontoMinimo[2],"i"), moneda: "Pesos"},
    ];
    for(let posibleMonto of regexList){
        if(!esMontoValido(posibleMonto)){
            continue;
        }
        for(let {regex,moneda} of regexBuscarMontos){
            const montoMinimo = posibleMonto.match(regex);
            if (montoMinimo){
                montoFinal = {monto: montoMinimo[1], moneda: moneda};
                return montoFinal;
            }
        }
    }
}


function esMontoValido(monto){
    if(monto.includes("no inferior")){
        return false;
    }
    return true;
}

//Funcion para buscar si hay multiples propiedades en la publicacion del remate
function getMultiples(data) {
    const regex = /([a-zA-ZáéíóúñÑ])*(propiedades|inmuebles)/;
    const regexFojas = /(fojas|fs)(.)?\s+(N°\s+)?((\d{1,3}.)*)(\d{1,3})/ig ;
    const multiples = data.match(regex);
    if (multiples != null) {
        return true;
    }else{
        return false
    }
}

// Obtiene la comuna del remate a base de una lista de comunas.
function getComuna(data) {
    let comunaMinuscula;
    const dataNormalizada = data.toLowerCase();
    for (let comuna of comunas){
        comuna = comuna.toLowerCase();
        const listaPreFrases = ["comuna de ","comuna ","comuna y provincia de ","conservador de bienes raíces de ","conservador bienes raíces "];
        for(let preFrase of listaPreFrases){
            const comunaPreFrase = preFrase + comuna;
            if (dataNormalizada.includes(comunaPreFrase)){
                return comuna;
            }
        }
    }
    return null;
}

// Obtiene la foja del remate.
function getFoja(data) {
    const regexFoja = /(fojas|fs|fjs)(.)?\s*(N°\s+)?((\d{1,3}.)*)(\d{1,3})/ig ;
    const foja = data.match(regexFoja);
    return foja;
}

// Obtiene el numero del remate.
function getNumero(data) {
    const regexNumero = /fojas\s((?:\d{1,3}.)*\d{1,3}),?\s(?:N(?:°|º)|número)\s*((?:\d{1,3}.)*\d{1,3})[\sdel\saño\s\d{4}]?/i;
    const numero = data.match(regexNumero);
    return numero;
}

// Obtiene las partes del remate.
function getPartes(data){
    data = data.replaceAll("'", ""); //Elimina comillas simples
    data = data.replaceAll('"', ""); //Elimina comillas dobles
    data = data.replaceAll('´', ""); //Elimina comillas dobles
    // regex para partes: busca la palabra caratulado o expediente seguido de un rol, y 
    //luego busca 1 a 6 palabras seguidas de S.A., S.A.G.R., S.A.G.R., S.A. o con y otra seguida de 1 a cuatro palabras.
    const regexPartes = /(?:caratulado?a?s?|expediente)\s*[:]?(?:(?:Rol\s)?\s*C\s*-\s*\d{1,5}\s*-\s*\d{1,5},?)?(\s*[,a-zA-ZáéíóúñÑ-]+){1,6}\s*(S\.A\.G\.R\.|S\.A\.G\.R\.|S\.A\.?\/?|con|\/|-)(\s*[a-zA-ZáéíóúñÑ]+){1,4}/i;
    let partes = data.match(regexPartes);
    if (partes != null){
        return partes[0];
    }
    // Si no lo encuentra con la palabra caratulado/expediente, busca con la palabra banco
    const banco = "Banco";
    const indexBanco = data.indexOf(banco);
    if (indexBanco != -1){
        const bancoPartes = obtenerFrasesConBanco(data);
        for(let parte of bancoPartes){
            let partesModificadas = eliminarHastaDelimitador(parte,".");
            partesModificadas = eliminarHastaDelimitador(partesModificadas,",");
            partesModificadas = eliminarHastaDelimitador(partesModificadas,"Rol");
            if (incluyeParte(partesModificadas)){
                return partesModificadas;
            }
        }
    }
    // Si no lo encuentra con la palabra banco, busca con una lista de nombres propios de bancos y cooperativas. 
    const partesNombreBanco = buscarPartesNombreBanco(data);
    if (partesNombreBanco != null){
        return partesNombreBanco;
    }
    return null;
}

function buscarPartesNombreBanco(data){
    const dataNormalized = data.toLowerCase();
    for(let banco of BANCOS){
        // Revisa si el banco de la lista esta en el texto
        const indexBanco = dataNormalized.indexOf(banco);
        if (indexBanco == -1){
            continue;
        }
        // Si esta, busca la palabra rol
        const dataBanco = dataNormalized.substring(indexBanco);
        if (!dataBanco.includes("rol")){
            continue;
        }
        const finPartesConRol = dataBanco.indexOf('rol');
        if (finPartesConRol == -1){
            continue;
        }
        let partes = dataBanco.substring(0,finPartesConRol);
        if (incluyeParte(partes)){
            return partes;
        }
        //Busca un punto que finalize las partes 
        const finPartesConPunto = dataBanco.indexOf('.');
        if (finPartesConPunto == -1){
            continue;
        }
        partes = dataBanco.substring(0,finPartesConPunto);
        if (incluyeParte(partes)){
            return partes;
        }
        
    }
}

function getTipoPropiedad(data){
    const regexPropiedad = /(?:casa|departamento|terreno|parcela|sitio|local|bodega|oficina(?!\s+judicial)|vivienda)/i;
    const tipoPropiedad = data.match(regexPropiedad);
    return tipoPropiedad;
}

function getTipoDerecho(data){
    const regexDerecho = /(?:posesión|usufructo|nuda propiedad|bien familiar)/i;
    const tipoDerecho = data.match(regexDerecho);
    return tipoDerecho;
}

function getAnno(data){
    // Busca el año de la manera mas simple con "año xxxx"
    // let regexAnno = /(año)\s*(\d{4})/i;
    // const anno = data.match(regexAnno);
    // if (anno != null){
    //     return anno[2];
    // }
    // Busca el año con dependencia de las fojas, "fojas xxxx del año xxxx"
    const regexFojasDependiente =/(?:fojas|fs\.?|fjs)(\s*[°º0-9a-zA-ZáéíóúñÑ,.-]+){1,12}\s*(?:del?|año)\s*(\b\d{1}(?:\.\d{3})?\b|\d{1,4})/i;
    const fojasDependiente = data.match(regexFojasDependiente);
    if (fojasDependiente != null){
        return fojasDependiente[2];
    }
    // Busca el año con dependencia del registro de propiedad con regex "registro de propiedad xxxx"
    const registroRegex = /registro\s*(?:de)?\s*propiedad\s*(?:de\s*)?(\d{4})/i;
    let registro = data.match(registroRegex);
    if (registro != null){
        return registro[1];
    }
    // Busca el año con dependencia de registro de propiedad hasta encontrar una coma, "registro de propiedad xxxx,", luego devuelve solo el año.
    const dataNormalized = data.toLowerCase();
    let registroFecha = dataNormalized.indexOf('registro de');
    if (registroFecha == -1){
        registroFecha = dataNormalized.indexOf('reg de propiedad');
    }
    if (registroFecha == -1){
        registroFecha = dataNormalized.indexOf('registro propiedad');
    }
    if (registroFecha == -1){
        return null;
    }
    const dataRegistro = dataNormalized.substring(registroFecha);
    let registroFin = dataRegistro.indexOf('.');
    // console.log("Registro fin: ",registroFin);
    if (registroFin == -1){
        registroFin = dataRegistro.indexOf(',');
    }
    if (registroFin == -1){
        return null;
    }
    registro = dataRegistro.substring(0,registroFin);
    // console.log("Registro: ",registro);
    const regexAnnoConDecimal = /(\b\d{1}(?:\.\d{3})?\b|\b\d{4}\b)/gi;
    const annoRegistro = registro.match(regexAnnoConDecimal);
    if (annoRegistro!= null){
        return annoRegistro[0];       
    }
    return null;
}

function getDireccion(data) {
    const dataNormalizada = data.replace(/(\d+)\.(\d+)/g, '$1$2');
    const dataMinuscula = dataNormalizada.toLowerCase();
    // console.log("Data minuscula: ", dataMinuscula);

    const palabrasClave = ['propiedad', 'inmueble', 'departamento', 'casa'];
    const comuna = 'comuna';
    const direcciones = [];

    for (let palabra of palabrasClave) {
        const regex = new RegExp(`(?<!registro de )${palabra}`, 'g');
        const match = regex.exec(dataMinuscula);

        if (!match) {
            continue;
        }

        const index = match.index;
        let fin = dataMinuscula.indexOf(comuna);
        const direccionTemporal = dataMinuscula.substring(index);
        fin = direccionTemporal.indexOf('.');

        if (fin !== -1) {
            const direccion = direccionTemporal.substring(0, fin);
            direcciones.push(direccion);
            return direccion; // Devuelve la primera dirección encontrada
        }
    }

    if (direcciones.length > 0) {
        return direcciones.at(-1);
    }

    return null;
}

function getDiaEntrega(data){
    // console.log("Data: ",data);
    const regexDiaEntrega = [
        /día\s*(hábil\s*)?(?:[,a-zA-ZáéíóúñÑ-]+\s*){1,6}(inmediatamente\s*)?(anterior\b)/i,
        /(dos|tres|cuatro|cinco|seis|siete)\sdías\shábiles\s(antes)?/i,
        /día\s(lunes|martes|miércoles|jueves|viernes)\s(inmediatamente\s)?(anterior\s)(a\sla\sfecha\s)?(de\sla\ssubasta|del\sremate)/i,
        /(?:(?:veinticuatro|cuarenta y ocho|setenta y dos|noventa y seis)\s*horas(\s*[,a-zA-ZáéíóúñÑ-]+){1,8}\s*remate)/i,
        /hasta\s*el\s*día\s*(\w+)\s*de\s*la\s*semana\s*anterior/i,
        /(?<!:|.)\d{2}\s*horas(\s*[,a-zA-ZáéíóúñÑ-]+){1,12}\s*(subasta|remate)/i,
        /(el\s*día\s*(precedente|anterior))\s*(\s*[,a-zA-ZáéíóúñÑ-]+){1,12}\s*(subasta|remate)/i,
        /((día|dia)\s*(precedente|anterior))\s*(\s*[,a-zA-ZáéíóúñÑ-]+){1,12}\s*(subasta|remate)/i,
        /\d\s*días\s*hábiles(\s*[,a-zA-ZáéíóúñÑ-]+){1,12}\s*(subasta|remate)/i,
        /(?:un|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez)\s*día\s*(hábil(?:es)?\s*)?(?:[,a-zA-ZáéíóúñÑ-]+\s*){1,6}(inmediatamente\s*)?(anteriore?s?)/i,
    ]

    for(let regex of regexDiaEntrega){
        const diaEntrega = data.match(regex);
        if (diaEntrega != null){
            return diaEntrega;
        }
    }
    return null;
}

// Funcion para probar un solo remate
async function testUnico(fecha,link){
    const caso = new Caso(fecha,fecha,link,0);
    const maxRetries = 2;
    description =  await getRemates(link,maxRetries,caso);
    caso.darTexto(description);
    procesarDatosRemate(caso);
    console.log(caso.toObject());
}

function convertirANombre(numero) {
    const nombres = [
        "primer", "segundo", "tercer", "cuarto", "quinto", "sexto", "septimo", "octavo", "noveno", "decimo",
        "undecimo", "duodecimo", "decimotercero", "decimocuarto", "decimoquinto", "decimosexto", "decimoseptimo", "decimoctavo", "decimonoveno", "vigesimo",
        "vigesimo primero", "vigesimo segundo", "vigesimo tercero", "vigesimo cuarto", "vigesimo quinto", "vigesimo sexto", "vigesimo septimo", "vigesimo octavo", "vigesimo noveno", "trigesimo",
        "trigesimo primero", "trigesimo segundo", "trigesimo tercero", "trigesimo cuarto", "trigesimo quinto", "trigesimo sexto", "trigesimo septimo", "trigesimo octavo", "trigesimo noveno", "cuadragesimo"
    ];

    // Verificar que el número está dentro del rango válido
    if (numero >= 1 && numero <= 40) {
        return nombres[numero - 1]; // Ajuste para que el índice coincida con el número
    } else {
        return "Número fuera de rango"; // Si el número está fuera del rango de 1 a 40
    }
}

function eliminarHastaDelimitador(texto,delimitador){
    const limite = texto.indexOf(delimitador);
    if (limite == -1){
        return texto;
    }
    return texto.substring(0,limite);
}

function obtenerFrasesConBanco(texto) {
    const regex = /banco.*?\./gi; // Busca "banco" seguido de cualquier cosa hasta el primer punto
    const coincidencias = texto.match(regex);
    return coincidencias || []; // Devuelve las frases encontradas o un array vacío
}

function incluyeParte(texto){
    const incluyecon = texto.includes("con");
    const incluyeContra = texto.includes("contra");
    const incluyeCon = texto.includes("Con");
    const incluyeBarra = texto.includes("/");
    if (incluyecon || incluyeContra || incluyeCon || incluyeBarra){
        return true;
    }
    return false;
}

module.exports = {  getDatosRemate , testUnico, procesarDatosRemate };