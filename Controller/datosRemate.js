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
    const juzgado = getJuzgado(texto);
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
    const anno = getAnno(texto);

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
    }
    if (numero != null){
        caso.darNumero(numero[1]);
    }
    if (partes != null){
        caso.darPartes(partes[0]);
    }
    if (tipoPropiedad != null){
        caso.darTipoPropiedad(tipoPropiedad[0]);
    }
    if (tipoDerecho != null){
        caso.darTipoDerecho(tipoDerecho[0]);
    }
    if (anno != null){
        caso.darAnno(anno[0]);
    }
}

//FUNCIONES PARA OBTENER INFORMACION DE LOS REMATES
//crea una funcion que revise en la descripcion a base de regex el juzgado
function getCausa(data) {
    //Anadir C- con 3 a 5 digitos, guion, 4 digitos
    const regex = /C\s*[-]*\s*\d{3,5}\s*-\s*\d{4}|C\s*[-]*\s*\d{1,3}\.\d{3}\s*-\s*\d{4}/i;
    
    const causa = data.match(regex);

    return causa;
}

function getJuzgado(data) {
    
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
        return "N/A";
    }else{
        // console.log(tribunalesAceptados);
        return tribunalesAceptados.at(-1);
    }
}


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

function getFormatoEntrega(data) {
    const regex = /(vale\s+)(vista)|(cupón)|(vale a la vista)/i
    const formatoEntrega = data.match(regex);
    return formatoEntrega;
}

function getFechaRemate(data) {
    const regexFechaRemate = new RegExp(/(\d{1,2})\s*(de\s+)?(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)[\s]*((de|del)\s+)?(año\s+)?(\d{4})/i.source +
        /|(lunes|martes|miércoles|jueves|viernes|sábado|domingo)?\s*([a-zA-Záéíóú]*\s+)(de\s+)?(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)(\s+de)\s+(dos mil (veinticuatro|veinticinco|veintiseis|veintisiete|veintiocho|veintinueve|treinta|treinta y uno)?)?/i.source
    , 'i');
    const fechaRemate = data.match(regexFechaRemate);
    return fechaRemate;
}

function getMontoMinimo(data) {
    const regex = /(subasta|mínimo)\s*([a-zA-ZáéíóúÑñ:\s]*)\s+((\$)\s*(\d{1,3}.)+(\d{1,3})|(\d{1,3}.)+(\d{1,3})(,\d{1,10})?\s*(Unidades de Fomento|UF|U.F.)|(Unidades de Fomento|U\.?F\.?)\s*(\d{1,3}\.)+(\d{1,3})(,\d{1,10})?)/i;
    // (Mínimo\s+)?(subasta\s+)?((\$)\s*(\d{1,3}.)+(\d{1,3})|(\d{1,3}.)*(\d{1,3}),?(\d{1,10})?\s*(?:Unidades de Fomento|U.F.|UF))
    const montoMinimo = data.match(regex);
    return montoMinimo;
}

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

function getComuna(data) {
    
    //let comuna;
    for (let comuna of comunas){
        comunaMinuscula = 'comuna de ' + comuna;
        comunaMayuscula = 'Comuna de ' + comuna;
        if (data.includes(comuna)){
            return comuna;
        }
    }
    return "N/A";
}

function getFoja(data) {
    const regexFoja = /(fojas|fs)(.)?\s+(N°\s+)?((\d{1,3}.)*)(\d{1,3})/ig ;
    const foja = data.match(regexFoja);
    return foja;
}

function getNumero(data) {
    const regexNumero = /fojas\s((?:\d{1,3}.)*\d{1,3}),?\s(?:N(?:°|º)|número)\s*((?:\d{1,3}.)*\d{1,3})[\sdel\saño\s\d{4}]?/i;
    const numero = data.match(regexNumero);
    return numero;
    //fojas\s((?:\d{1,3},)*\d{1,3}),?\sN[°|º]\s*((?:\d{1,3},)*\d{1,3})[\sdel\saño\s\d{4}]?
}

function getPartes(data){
    data = data.replaceAll("'", ""); //Elimina comillas simples
    data = data.replaceAll('"', ""); //Elimina comillas dobles
    const regexPartes = /(?:caratulado?a?s?|expediente)\s*[:]?(?:(?:Rol\s)?\s*C\s*-\s*\d{1,5}\s*-\s*\d{1,5},?)?(\s*[a-zA-ZáéíóúñÑ-]+){1,5}\s*(S\.A\.G\.R\.|S\.A\.G\.R\.|S\.A\.?\/?|con|\/)(\s*[a-zA-ZáéíóúñÑ]+){1,4}/i;
    const partes = data.match(regexPartes);
    return partes;
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
    return anno;
}

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

module.exports = {  getDatosRemate , testUnico };