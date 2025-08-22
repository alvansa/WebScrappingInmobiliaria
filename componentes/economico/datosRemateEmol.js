// const { getPaginas, getRemates } = require('./getNextPage.js');
// const CacheTribunales = require('./cacheTribunales.js');

const {tribunales2} = require('../caso/datosLocales.js');
const Caso = require('../caso/caso.js');
const { fakeDelay } = require('../../utils/delay.js');

const extractor = require('./extractors');

//Funcion que procesa los datos de un remate y obtiene la informacion necesaria
function procesarDatosRemate(caso, isDebug = false) {
    texto = caso.texto;
    if(isDebug) console.log(texto);
    caso.causa = extractor.causa(texto) ? extractor.causa(texto) : extractor.causaVoluntaria(texto);
    caso.juzgado = extractor.partitionJudge(texto) ? "Juez Partidor" : extractor.court(texto);
    caso.porcentaje = extractor.percent(texto);
    caso.formatoEntrega = extractor.deliveryFormat(texto);
    caso.fechaRemate = extractor.auctionDate(texto);
    caso.montoMinimo = extractor.minAmount(texto);
    caso.comuna = extractor.district(texto, false,isDebug);
    caso.tipoDerecho = extractor.rightType(texto);
    caso.direccion = extractor.direction(texto);
    caso.diaEntrega = extractor.deliveryDay(texto, isDebug);
    caso.anno = extractor.year(texto, isDebug);
    caso.rolPropiedad = extractor.propertyId(texto);
    caso.partes = extractor.parties(texto);
    caso.foja = getFoja(texto);
    const multiples = getMultiples(texto);
    const numero = getNumero(texto);
    const tipoPropiedad = getTipoPropiedad(texto);

    if (numero != null) {
        caso.numero = numero[1];
    }
    if (tipoPropiedad) {
        if (tipoPropiedad === "estacionamiento") {
            caso.tipoPropiedad = "estacionamiento";
        } else {
            caso.tipoPropiedad = tipoPropiedad[0];
        }
    }
}

//FUNCIONES PARA OBTENER INFORMACION DE LOS REMATES
//crea una funcion que revise en la descripcion a base de regex el juzgado

//Funcion para buscar si hay multiples propiedades en la publicacion del remate
function getMultiples(data) {
    const regex = /([a-zA-ZáéíóúñÑ])*(propiedades|inmuebles)/;
    const regexFojas = /(fojas|fs)(.)?\s+(N°\s+)?((\d{1,3}.)*)(\d{1,3})/ig;
    const multiples = data.match(regex);
    if (multiples != null) {
        return true;
    } else {
        return false
    }
}

// Obtiene la foja del remate.
function getFoja(data) {
    const regexFoja = /(fojas|fs|fjs)(.)?\s*(N°\s+)?((\d{1,3}.)*)(\d{1,3})/ig;
    const foja = data.match(regexFoja);
    if(foja){ 
        return foja[0]
    }
    return null;
}

// Obtiene el numero del remate.
function getNumero(data) {
    const regexNumero = /fojas\s((?:\d{1,3}.)*\d{1,3}),?\s(?:N(?:°|º)|número)\s*((?:\d{1,3}.)*\d{1,3})[\sdel\saño\s\d{4}]?/i;
    const numero = data.match(regexNumero);
    return numero;
}

function getTipoPropiedad(data) {
    const regexCheckParking = /la\s*propiedad\s*que\s*corresponde\s*al\s*estacionamiento/gi;
    const parking = data.match(regexCheckParking);
    if (parking) {
        return "estacionamiento";
    }
    const regexProperty = /(?:casa|departamento|terreno|parcela|sitio|local|bodega|oficina(?!\s+judicial)|vivienda)/i;
    const propertyType = data.match(regexProperty);
    return propertyType;
}

// Funcion para probar un solo remate
async function testUnico(fecha, link) {
    const caso = new Caso(fecha, fecha, link, 0);
    const maxRetries = 2;
    description = await getRemates(link, maxRetries, caso);
    const normalizedDescription = normalizeDescription(description);
    caso.texto = normalizedDescription;
    procesarDatosRemate(caso);
    console.log(caso.toObject());
    return caso;
}

function emptyCaseEconomico() {
    const caso = new Caso("", "", "", 0);
    return [caso];
}

function normalizeDescription(description) {
    if(!description){
        return null;
    }
    description = description
        .replace(/[\r\n\x0B\x0C\u0085\u2028\u2029]/g, ' ')
        .replace(/\s+/g,' ')
        .trim();
    return description
}

module.exports = {
    testUnico, procesarDatosRemate,
    getFoja,
    getMultiples,
    getNumero,
    getTipoPropiedad,
    emptyCaseEconomico,
    normalizeDescription
};