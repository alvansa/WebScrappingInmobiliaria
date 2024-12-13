const { getPaginas, getRemates } = require('../Model/getNextPage.js');
const { comunas, tribunales2 } = require('../Model/datosLocales.js');
const Caso  = require('../Model/caso.js');

async function getDatosRemate(fechaHoy,fechaInicioStr,fechaFinStr,maxRetries){
    try {
        let caso;
        const casos = await getPaginas(fechaHoy,fechaInicioStr,fechaFinStr);
        for (caso of casos){
            pagina = caso.link;
            console.log(pagina);
            const description = await getRemates(pagina,maxRetries);
            caso.darTexto(description);
        }
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

    if (causa != null){
        caso.darCausa(causa[0]);
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
        console.log("Monto Minimo que se da: ",montoMinimo[0]);
        caso.darMontoMinimo(montoMinimo[0]);
    }
    caso.darMultiples(multiples);
    
    if (comuna != null){
        caso.darComuna(comuna);
    }
    if (foja != null){
        caso.darFoja(foja[0]);
        const anno = getAnno(texto);
        if (anno != null){
            annoNumero = anno[0].match(/\d{4}/);
            caso.darAnno(annoNumero[0]);
        }
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
    const regex = /C\s*[-]*\s*\d{1,7}\s*-\s*\d{4}|C\s*[-]*\s*\d{1,3}\.\d{3}\s*-\s*\d{4}/i;
    
    const causa = data.match(regex);
    if (causa != null){
        return causa;
    }
    const causaRegexSinC = /Rol\s*\d{1,7}\s*-\s*\d{4}|Rol\s*[-]*\s*\d{1,3}\.\d{3}\s*-\s*\d{4}/i;
    const causaSinC = data.match(causaRegexSinC);
    if (causaSinC != null){
        return causaSinC;
    }
}

//Primer intento de obtnener el juzgado
function getJuzgado(data) {
    // TODO: Hacer que acepte variaciones cuando se escribe tribunal en vez de juzgado.
    data = data.toLowerCase();
    data = data.replace(",",'');
    const dataSinDe = data.replaceAll("de ",'');
    
    // console.log(dataSinDe);
    let tribunalesAceptados = [];
    for (let tribunal of tribunales){
        tribunal = tribunal.toLowerCase();
        const numero = tribunal.match(/\d{1,2}/);    
        let tribunalOrdinal = tribunal;
        let tribunalBolita1 = tribunal;
        if (numero){
            const numeroOrdinal = convertirANombre(parseInt(numero));
            tribunalOrdinal = tribunal.replace(/\d{1,2}°/,numeroOrdinal);
            tribunalOrdinalSinDe = tribunalOrdinal.replace(/de\s+/,'');
            //º
            tribunalBolita1 = tribunal.replace('°', 'º');
            tribunalBolita1SinDe = tribunalBolita1.replace(/de\s+/,'');
            if(dataSinDe.includes(tribunalBolita1) | data.includes(tribunalOrdinal) | dataSinDe.includes(tribunalOrdinalSinDe) | dataSinDe.includes(tribunalBolita1SinDe)){
                
                tribunalesAceptados.push(tribunal);
            }
        }
        
        const tribunalSinDe = tribunal.replaceAll("de ",'');
        // const tribunalSinDe = tribunal.replaceAll(/de\s+/,'');
        if (data.includes(tribunal) | data.includes(tribunalSinDe)|  dataSinDe.includes(tribunalSinDe)){
            
            tribunalesAceptados.push(tribunal);
        } 
    }
    if (tribunalesAceptados.length == 0){
        return null;
    }else{
        // console.log(tribunalesAceptados);
        return tribunalesAceptados.at(-1);
    }
}

//Probando para refactorizar la funcion que busca el juzgado
function getJuzgado2(data) {
    const normalizedData = data.toLowerCase().replaceAll(",",'').replaceAll("de ",'');
    let tribunalesAceptados = [];
    console.log("Data normalizada: ",normalizedData);
    for (let tribunal of tribunales2){
        const tribunalNormalized = tribunal.toLowerCase();
        const tribunalSinDe = tribunalNormalized.replaceAll("de ",'');
        const numero = tribunal.match(/\d{1,2}/);
        
        if (numero){
            // console.log("Numero: ",numero);
            const numeroOrdinal = convertirANombre(parseInt(numero));
            const tribunalVariations = [
                tribunalNormalized,
                tribunalNormalized.replace(/\d{1,2}°/,numeroOrdinal),
                tribunalNormalized.replace('°', 'º'),
                tribunalNormalized.replace(/\d{1,2}°/, numeroOrdinal).replaceAll("de ", ""),
                tribunalNormalized.replace("°", "º").replaceAll("de ", ""),
                tribunalNormalized.replace("°", ""),
                tribunalNormalized.replace("°", "").replaceAll("de ", ""),
                tribunalNormalized.replace("juzgado", "tribunal"),
                tribunalNormalized.replace("juzgado", "tribunal").replace("de ",""),
                tribunalNormalized.replace(/\d{1,2}°/,numeroOrdinal).replace("juzgado", "tribunal"),
                tribunalNormalized.replace('°', 'º').replace("juzgado", "tribunal"),
                tribunalNormalized.replace(/\d{1,2}°/, numeroOrdinal).replaceAll("de ", "").replace("juzgado", "tribunal"),
                tribunalNormalized.replace("°", "º").replaceAll("de ", "").replace("juzgado", "tribunal"),
                tribunalNormalized.replace("°", "").replace("juzgado", "tribunal"),
                tribunalNormalized.replace("°", "").replaceAll("de ", "").replace("juzgado", "tribunal"),
            ];

            // Verificar si alguna variación coincide
            if (tribunalVariations.some(variation => normalizedData.includes(variation))) {
                tribunalesAceptados.push(tribunal);
                continue;
            }
        }
        // Verificar el tribunal original y sin "de "
        if (normalizedData.includes(tribunalNormalized) || normalizedData.includes(tribunalSinDe)) {
        tribunalesAceptados.push(tribunal);
    }
    }
    
    // Devolver el último tribunal aceptado o null si no hay coincidencias
    return tribunalesAceptados.length > 0 ? tribunalesAceptados.at(-1) : null;
        
}


// Si no se encuentra el juzgado de la lista, se busca si es un juez partidor
function getJuezPartidor(data){
    const juezRegex = /partidor|particion|partición|Árbitro|árbitro|judicial preventivo/i;
    const juez = data.match(juezRegex);
    if (juez != null){
        return true;
    }else{
        return false;
    }
}
function getPorcentaje(data) {

    const porcentajeBasico = /\d{1,3}\s*%\s*(?:del\s+)?(?:mínimo|valor|precio)+/i;
    const garantiaConMonto = /(garantía|Garantía)\s+(suficiente\s+)?(de\s+)?(\$\s*)?(\d{1,3}(?:\.\d{3})*,?\d*)/i;
    const caucionInteresados = /(caución|interesados\s+)[a-zA-ZáéíóúÑñ:\s]*\d{1,3}\s*%/i;
    const garantiaConPorcentaje = /(garantía|Garantía)\s+(suficiente\s+)?(por\s+)?(el\s+)?\d{1,3}%/i;
    
    let porcentaje = data.match(porcentajeBasico);
    if (porcentaje != null){
        return porcentaje;
    }
    porcentaje = data.match(garantiaConMonto);
    if (porcentaje != null){
        return porcentaje;
    }
    porcentaje = data.match(caucionInteresados);
    if (porcentaje != null){
        return porcentaje;
    }
    porcentaje = data.match(garantiaConPorcentaje);
    if (porcentaje != null){
        return porcentaje;
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
    const regexFechaRemate = new RegExp(/(\d{1,2})\s*(de\s+)?(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)[\s]*((de|del)\s+)?(año\s+)?(\d{4})/i.source +
        /|(lunes|martes|miércoles|jueves|viernes|sábado|domingo)?\s*([a-zA-Záéíóú]*\s+)(de\s+)?(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)(\s+de)\s+(dos mil (veinticuatro|veinticinco|veintiseis|veintisiete|veintiocho|veintinueve|treinta|treinta y uno)?)?/i.source
    , 'i');
    const fechaRemate = data.match(regexFechaRemate);
    return fechaRemate;
}

//Obtiene el monto minimo por el cual iniciara el remate.
function getMontoMinimo(data) {
    const regex = /(subasta|mínimo)\s*([a-zA-ZáéíóúÑñ:\s]*)\s+((\$)\s*(\d{1,3}.)+(\d{1,3})|(\d{1,3}.)+(\d{1,3})(,\d{1,10})?\s*(Unidades de Fomento|UF|U.F.)|(Unidades de Fomento|U\.?F\.?)\s*(\d{1,3}\.)+(\d{1,3})(,\d{1,10})?)/i;
    // (Mínimo\s+)?(subasta\s+)?((\$)\s*(\d{1,3}.)+(\d{1,3})|(\d{1,3}.)*(\d{1,3}),?(\d{1,10})?\s*(?:Unidades de Fomento|U.F.|UF))
    const montoMinimo = data.match(regex);
    return montoMinimo;
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
    //let comuna;
    for (let comuna of comunas){
        comunaMinuscula = 'comuna de ' + comuna;
        if (data.includes(comuna)){
            return comuna;
        }
    }
    return "N/A";
}

// Obtiene la foja del remate.
function getFoja(data) {
    const regexFoja = /(fojas|fs)(.)?\s*(N°\s+)?((\d{1,3}.)*)(\d{1,3})/ig ;
    const foja = data.match(regexFoja);
    return foja;
}

// Obtiene el numero del remate.
function getNumero(data) {
    const regexNumero = /fojas\s((?:\d{1,3}.)*\d{1,3}),?\s(?:N(?:°|º)|número)\s*((?:\d{1,3}.)*\d{1,3})[\sdel\saño\s\d{4}]?/i;
    const numero = data.match(regexNumero);
    return numero;
    //fojas\s((?:\d{1,3},)*\d{1,3}),?\sN[°|º]\s*((?:\d{1,3},)*\d{1,3})[\sdel\saño\s\d{4}]?
}

// Obtiene las partes del remate.
function getPartes(data){
    data = data.replaceAll("'", ""); //Elimina comillas simples
    data = data.replaceAll('"', ""); //Elimina comillas dobles
    data = data.replaceAll("'", ""); //Elimina comillas simples
    const regexPartes = /(?:caratulado?a?s?|expediente)\s*[:]?(?:(?:Rol\s)?\s*C\s*-\s*\d{1,5}\s*-\s*\d{1,5},?)?(\s*[a-zA-ZáéíóúñÑ-]+){1,6}\s*(S\.A\.G\.R\.|S\.A\.G\.R\.|S\.A\.?\/?|con|\/)(\s*[a-zA-ZáéíóúñÑ]+){1,4}/i;
    let partes = data.match(regexPartes);
    if (partes != null){
        return partes[0];
    }else{
        //buscar de otra manera
        const banco = "Banco";
        const index = data.indexOf(banco);
        if (index != -1){
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
        return 'N/A';
    }
}


function getTipoPropiedad(data){
    const regexPropiedad = /(?:casa|departamento|terreno|parcela|sitio|local|bodega|oficina|vivienda)/i;
    const tipoPropiedad = data.match(regexPropiedad);
    return tipoPropiedad;
}

function getTipoDerecho(data){
    const regexDerecho = /(?:posesión|usufructo|nuda propiedad|bien familiar)/i;
    const tipoDerecho = data.match(regexDerecho);
    return tipoDerecho;
}

function getAnno(data){
    const regexAnno = /(año)\s*(\d{4})/i;
    const anno = data.match(regexAnno);
    if (anno != null){
        return anno;
    }
    const registroRegex = /registro\s*(?:de)?\s*propiedad\s*(\d{4})/i;
    const registro = data.match(registroRegex);
    if (registro != null){
        return registro;
    }
    return null;
}

function getDireccion(data){
    const dataMinuscula = data.toLowerCase();
    const palabrasClave = ['propiedad','inmueble','departamento','casa'];
    const comuna = 'comuna';
    const direcciones = [];
    for(let palabra of palabrasClave){
        const index = dataMinuscula.indexOf(palabra);
        let fin = dataMinuscula.indexOf(comuna);
        if(index == -1){continue;}
        // revisar si hay una palabra comuna para finalizar la direccion
        if(fin > index){
            const direccion = data.substring(index,fin);
            return direccion;
        }
        const direccionTemporal = data.substring(index);
        fin = direccionTemporal.indexOf('.');
        if(fin != -1){
            const direccion = direccionTemporal.substring(0,fin);
            direcciones.push(direccion);
        }
    }
    if(direcciones.length > 0){
        return direcciones.at(-1);
    }
    return 'N/A';

}

function getDiaEntrega(data){
    const regexDiaEntregaSingular = /día\s*(hábil\s*)?(inmediatamente\s*)?(anterior)/i;
    const regexDiaEntregaPlural = /(dos|tres|cuatro|cinco|seis|siete)\sdías\shábiles\s(antes)?/i;
    const regexDiaEntregaNombreDia = /día\s(lunes|martes|miércoles|jueves|viernes)\s(inmediatamente\s)?(anterior\s)(a\sla\sfecha\s)?(de\sla\ssubasta|del\sremate)/i;
    const regexHorasAntes = /(?:(?:veinticuatro|cuarenta y ocho|setenta y dos|noventa y seis)\s*horas(\s*de\s*antelación\s*al\s*día\s*y\s*hora\s*del)?\s*remate)/i;
    const hastaElDiaX = /hasta\s*el\s*día\s*(\w+)\s*de\s*la\s*semana\s*anterior/i;
    
    const regexDiaEntrega = [
        /día\s*(hábil\s*)?(inmediatamente\s*)?(anterior)/i,
        /(dos|tres|cuatro|cinco|seis|siete)\sdías\shábiles\s(antes)?/i,
        /día\s(lunes|martes|miércoles|jueves|viernes)\s(inmediatamente\s)?(anterior\s)(a\sla\sfecha\s)?(de\sla\ssubasta|del\sremate)/i,
        /(?:(?:veinticuatro|cuarenta y ocho|setenta y dos|noventa y seis)\s*horas(\s*de\s*antelación\s*al\s*día\s*y\s*hora\s*del)?\s*remate)/i,
        /hasta\s*el\s*día\s*(\w+)\s*de\s*la\s*semana\s*anterior/i,
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
    // const link = "https://www.economicos.cl/remates/clasificados-remates-cod7477417.html";
    const caso = new Caso(fecha,fecha,link,0);
    const maxRetries = 2;
    description =  await getRemates(link,maxRetries,caso);
    caso.darTexto(description);
    procesarDatosRemate(caso);
    console.log(caso.toObject());
}

function convertirANombre(numero) {
    const nombres = [
        "primer", "segundo", "tercer", "cuarto", "quinto", "sexto", "séptimo", "octavo", "noveno", "décimo",
        "undécimo", "duodécimo", "decimotercero", "decimocuarto", "decimoquinto", "decimosexto", "decimoséptimo", "decimoctavo", "decimonoveno", "vigésimo",
        "vigésimo primero", "vigésimo segundo", "vigésimo tercero", "vigésimo cuarto", "vigésimo quinto", "vigésimo sexto", "vigésimo séptimo", "vigésimo octavo", "vigésimo noveno", "trigésimo",
        "trigésimo primero", "trigésimo segundo", "trigésimo tercero", "trigésimo cuarto", "trigésimo quinto", "trigésimo sexto", "trigésimo séptimo", "trigésimo octavo", "trigésimo noveno", "cuadragésimo"
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

module.exports = {  getDatosRemate , testUnico };