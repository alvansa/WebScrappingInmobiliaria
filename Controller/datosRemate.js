const { getPaginas, getRemates } = require('../Model/getNextPage.js');
const { comunas, tribunales } = require('../Model/datosLocales.js');
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
    const juzgado = getJuezPartidor(texto) ? "Juez Partidor" : getJuzgado(texto);
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
        // monto = montoMinimo[0].match(/(\d{1,3}\.)*\d{1,3}(,\d{1,5})*/);
        // caso.darMontoMinimo(monto[0]);
        caso.darMontoMinimo(montoMinimo[0]);
        
        montoPesos = montoMinimo[0].match(/(\$)\s*(\d{1,3}\.)*\d{1,3}(,\d{1,5})*/);
        montoUf = montoMinimo[0].match(/(\d{1,3}\.)*\d{1,3}(,\d{1,5})*\s*(Unidades de Fomento|U\.?F\.?)/i);
        if (montoPesos != null){
            caso.darMontoMinimo(montoPesos[0]);
        }else if (montoUf != null){
            caso.darMontoMinimo(montoUf[0]);
        }

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

    return causa;
}

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
    data = data.toLowerCase();
    data = data.replace(",",'');
    //Eliminar todas las palabras "de"
    data = data.replaceAll("de ",'');
    //Eliminamos la el simbolo "°"
    data = data.replace('°', '');
    //Eliminamos la el simbolo "º"
    data = data.replace('º', '');
    // console.log(data);
    for (let tribunal of tribunales){
        const tribunalAux = tribunal.toLowerCase();
        tribunal = tribunal.toLowerCase();
        //Eliminamos la palabra "de"
        const tribunalSinDe = tribunalAux.replaceAll("de ",'');
        
        const numero = tribunalSinDe.match(/\d{1,2}/);
        let tribunalOrdinal = tribunalAux;
    
        if (numero){
            const numeroOrdinal = convertirANombre(parseInt(numero));
            tribunalOrdinal = tribunalSinDe.replace(/\d{1,2}/,numeroOrdinal);
            if(tribunalOrdinal.includes("°")){
                tribunalOrdinal = tribunalOrdinal.replace('°', '');
            }else if(tribunalOrdinal.includes("º")){
                tribunalOrdinal = tribunalOrdinal.replace('º', '');
            }
            
        }
        console.log(tribunal);
        tribunalSinSimbolo = tribunalSinDe.replaceAll("°","");

        
        if(tribunal.includes("18")){
            console.log(tribunalAux);
            console.log(tribunal);
            console.log(tribunalOrdinal);
            console.log(tribunalSinSimbolo);
            console.log(parseInt(numero));
        }
        if (data.includes(tribunal) | data.includes(tribunalOrdinal) | data.includes(tribunalSinSimbolo)){
            return tribunal;
        }
    }
    return "N/A";
}

function getJuezPartidor(data){
    const juezRegex = /partidor|particion|partición|Árbitro|árbitro/i;
    const juez = data.match(juezRegex);
    if (juez != null){
        return true;
    }else{
        return false;
    }
}
// Si no se encuentra el juzgado de la lista, se busca si es un juez partidor
function getPorcentaje(data) {
    const regex = /\d{1,3}\s*%\s*(del\s+)?(mínimo|valor|precio)+|(garantía|Garantía)\s+(suficiente\s+)?(de\s+)?(\$\s*)?(\d{1,3}.)+(\d{1,3})|(caución\s+)+(interesados\s+)+\d{1,3}\s*%|(garantía|Garantía)\s+(suficiente\s+)?(por\s+)?(el\s+)?\d{1,3}%/;

    const porcetajeRegex = new RegExp(/\d{1,3}\s*%\s*(?:del\s+)?(?:mínimo|valor|precio)+/.source +
        /|(garantía|Garantía)\s+(suficiente\s+)?(de\s+)?(\$\s*)?(\d{1,3}.)+(\d{1,3})/.source +
        /|(caución|interesados\s+)([a-zA-ZáéíóúÑñ:\s]*)\d{1,3}\s*%/.source +
        /|(garantía|Garantía)\s+(suficiente\s+)?(por\s+)?(el\s+)?\d{1,3}%/.source );
    
    // const porcetajeRegex = "/\d{1,3}%/"
    const porcentaje = data.match(porcetajeRegex);

    return porcentaje;
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
    const regexFoja = /(fojas|fs)(.)?\s+(N°\s+)?((\d{1,3}.)*)(\d{1,3})/ig ;
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
        // console.log(index,palabra,fin,comuna);
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
    const regexDiaEntregaSingular = /día\s*(hábil)?\s*(anterior)/i;
    const regexDiaEntregaPlural = /(dos|tres|cuatro|cinco|seis|siete)\sdías\shábiles\s(antes)?/i;
    const regexDiaEntregaNombreDia = /día\s(lunes|martes|miércoles|jueves|viernes)\s(inmediatamente\s)?(anterior\s)(a\sla\sfecha\s)?(de\sla\ssubasta|del\sremate)/i;

    const diaEntregaSingular = data.match(regexDiaEntregaSingular);
    if (diaEntregaSingular != null){
        return diaEntregaSingular;
    }
    const diaEntregaPlural = data.match(regexDiaEntregaPlural);
    if (diaEntregaPlural != null){
        return diaEntregaPlural;
    }
    const diaEntregaNombreDia = data.match(regexDiaEntregaNombreDia);
    if (diaEntregaNombreDia != null){
        return diaEntregaNombreDia;
    }
    return null;
}

// Funcion para probar un solo remate
async function testUnico(fecha,link){
    // const link = "https://www.economicos.cl/remates/clasificados-remates-cod7477417.html";
    caso = new Caso(fecha,fecha,link);
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