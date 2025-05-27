const { getPaginas, getRemates } = require('./getNextPage.js');
const { comunas, tribunales2, BANCOS } = require('../caso/datosLocales.js');
const Caso = require('../caso/caso.js');
const { fakeDelay } = require('../../utils/delay.js');
// const CacheTribunales = require('./cacheTribunales.js');


const localTribunales = new Map();
const cacheInitialized = false;
const CACHE_KEY = 'tribunales_cache_v1';

async function getDatosRemate(fechaHoy, fechaInicioStr, fechaFinStr, maxRetries) {
    try {
        // Obtiene los casos de la pagina de "economico.cl"
        let caso;
        const casos = await getPaginas(fechaHoy, fechaInicioStr, fechaFinStr);
        for (caso of casos) {
            pagina = caso.link;
            await fakeDelay(2, 5);
            const description = await getRemates(pagina, maxRetries);
            const normalizedDescription = normalizeDescription(description);
            caso.texto = normalizedDescription;
        }
        // Procesa los remates a partir del texto obtenido.
        for (let caso of casos) {
            procesarDatosRemate(caso);
        }
        return casos;
    }
    catch (error) {
        console.error('Error al obtener resultados en el controlador:', error.message);
    }
}

//Funcion que procesa los datos de un remate y obtiene la informacion necesaria
function procesarDatosRemate(caso) {
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
    const anno = getAnno(texto);
    const rolPropiedad = getRolPropiedad(texto);

    if (causa) {
        caso.causa = causa[0];
    } else {
        const causaVoluntaria = getCausaVoluntaria(texto);
        if (causaVoluntaria) {
            caso.causa = causaVoluntaria[0];
        }
    }

    if (juzgado) {
        caso.juzgado = juzgado;
    }

    if (porcentaje) {
        caso.porcentaje = porcentaje[0];
        const minimoPorcentaje = porcentaje[0].match(/\d{1,3}\s*%/);
        const minimoPesos = porcentaje[0].match(/(\d{1,3}\.)*\d{1,3}(,\d{1,5})*/);
        if (minimoPorcentaje) {
            caso.porcentaje = minimoPorcentaje[0];
        } else if (minimoPesos) {
            caso.porcentaje = minimoPesos[0];
        }

    }

    if (formatoEntrega) {
        caso.formatoEntrega = formatoEntrega[0];
    }

    if (fechaRemate) {
        caso.fechaRemate = fechaRemate[0];
    }

    if (montoMinimo) {
        caso.montoMinimo = montoMinimo;
    }

    // caso.darMultiples(multiples);

    if (comuna) {
        caso.comuna = comuna;
    }

    if (foja) {
        caso.foja = foja[0];
    }

    if (anno) {
        caso.anno = anno;
    }

    if (numero != null) {
        caso.numero = numero[1];
    }

    if (partes) {
        caso.partes = partes;
    }

    if (tipoPropiedad) {
        if (tipoPropiedad === "estacionamiento") {
            caso.tipoPropiedad = "estacionamiento";
        } else {
            caso.tipoPropiedad = tipoPropiedad[0];
        }
    }

    if (tipoDerecho) {
        caso.tipoDerecho = tipoDerecho;
    }

    if (direccion) {
        caso.direccion = direccion;
    }

    if (diaEntrega) {
        caso.diaEntrega = diaEntrega[0];
    }

    if (rolPropiedad) {
        caso.rolPropiedad = rolPropiedad;
    }
}

//FUNCIONES PARA OBTENER INFORMACION DE LOS REMATES
//crea una funcion que revise en la descripcion a base de regex el juzgado
function getCausa(data) {
    //Anadir C- con 3 a 5 digitos, guion, 4 digitos
    const regex = /\bC\s*[-]*\s*\d{1,7}(?:\.\d{3})*\s*[-/]\s*\d{1,4}(?:\.\d{3})*/i;

    const causa = data.match(regex);
    if (causa != null) {
        return causa;
    }
    const causaRegexSinC = /Rol\s*[-]*\s*\d{1,7}(?:\.\d{3})*\s*[-/]\s*\d{1,4}(?:\.\d{3})*/i;
    const causaSinC = data.match(causaRegexSinC);
    if (causaSinC != null) {
        return causaSinC;
    }
    const regexCausaRolN = /rol\s*n\.?(?:º|°)\s*\d{1,7}(?:\.\d{3})*\s*[-/]\s*\d{1,4}(?:\.\d{3})*/i;
    const causaRolN = data.match(regexCausaRolN);
    if (causaRolN != null) {
        return causaRolN;
    }

    return null;
}

function getCausaVoluntaria(data) {
    const regex = /V\s*[-]*\s*\d{1,7}(?:\.\d{3})*\s*-\s*\d{1,4}(?:\.\d{3})*/i;
    const causa = data.match(regex);
    return causa;
}

//Probando para refactorizar la funcion que busca el juzgado
function getJuzgado(data) {
    const normalizedData = data
        .toLowerCase()
        .replace(/[,.\n]/g, ' ')
        .replace(/de\s*/g, '')
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\bstgo\b/g, "santiago")
        .replace(/\s+/, ' ')

    let tribunalAceptado = null;
    // console.log("Data normalizada en getJuzgado: ", normalizedData);

    for (let tribunal of tribunales2) {
        const tribunalNormalized = tribunal
            .toLowerCase()
            .replace(/de\s+/, '')
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "");

        const tribunalSinDe = tribunalNormalized.replaceAll("de ", '');
        const variaciones = [tribunalNormalized, tribunalSinDe];

        const numeroMatch = tribunal.match(/\d{1,2}/);
        if (numeroMatch) {
            const numero = parseInt(numeroMatch[0]);
            const ordinalForm = convertirANombre(numero);

            // if(tribunal.includes("")){
            //     console.log("Variaciones: ",ordinalForm, "Tipo : ",typeof ordinalForm);   
            // }

            const simbolosOrdinales = ['°', 'º', ''];

            const bases = [
                tribunalNormalized,
                tribunalNormalized.replace('juzgado', 'tribunal')
            ]

            ordinalForm.push(numero.toString());
            for (const base of bases) {
                ordinalForm.forEach((form) => {
                    simbolosOrdinales.forEach((simbolo) => {
                        variaciones.push(base.replace(/\d{1,2}°/, `${form}${simbolo}`)); // 3°
                        variaciones.push(base.replace(/\d{1,2}°/, `${form}`)); // tercero
                        variaciones.push(base.replace(/\d{1,2}°/, `${form} ${simbolo}`)); // 3 °
                    });
                    variaciones.push(base.replace(/\s+/g, '')); // 3°juzgado
                });
            }

            if (tribunalNormalized.includes("en lo civil")) {
                variaciones.push(...variaciones.map(variation => variation.replace("en lo civil ", "")));
            }
        }
        if(variaciones.some(variation => normalizedData.includes(variation))) {
            tribunalAceptado = tribunal;
        }

    }
    // Devolver el último tribunal aceptado o null si no hay coincidencias
    // console.log("Tribunales aceptados: ", tribunalAceptado);
    return tribunalAceptado;

}

function getJuzgado2(data) {
    console.time("getJuzgado2");
    let cacheTribunales = null;
    const normalizedData = data
        .toLowerCase()
        .replace(/[,.\n]/g, ' ')
        .replace(/de\s*/g, '')
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\bstgo\b/g, "santiago")
        .replace(/\s+/, ' ')

    let tribunaleAceptado = null;
    // console.log("Data normalizada en getJuzgado: ", normalizedData);
    if (!cacheInitialized) {
        cacheTribunales = new CacheTribunales();
        cacheTribunales.initializePersistentCache();
        cacheInitialized = true;
    }

    for (const [tribunal, variations] of cacheTribubales.cacheTribunales.entries()) {
        if (variations.some(variation => normalizedData.includes(variation))) {
            tribunaleAceptado = tribunal;
            continue;
        }
    }

    console.log("Tribunales aceptados: ", tribunaleAceptado);
    console.timeEnd("getJuzgado2");
    return tribunaleAceptado;

}

// Si no se encuentra el juzgado de la lista, se busca si es un juez partidor
function getJuezPartidor(data) {
    const juezRegex = /partidor|particion|partición|Árbitro|árbitro|judicial preventivo|arbitro|arbitral/i;
    const juez = data.match(juezRegex);
    if (juez != null) {
        return true;
    } else {
        return false;
    }
}
function getPorcentaje(data) {
    // console.log("Data en getPorcentaje: ", data);
    const regexMinimos = [
        /\d{1,3}\s*%\s*(?:del\s+)?(?:mínimo|valor|precio)+/i,
        /(garantía|Garantía)\s+(suficiente\s+)?(de\s+)?(\$\s*)?(\d{1,3}(?:\.\d{3})*,?\d*)/i,
        /(caución|interesados\s+)[a-zA-ZáéíóúÑñ:\s]*\d{1,3}\s*%/i,
        /(garantía|Garantía)\s+(suficiente\s+)?(por\s+)?(el\s+)?\d{1,3}%/i,
        /(para\s*participar)[\wáéíóúÑñ:\s]{1,200}(mínimo\s*fijado)/i,
        /garantía\s*[\w,áéíóúÑñ0-9%:\s]{1,200}mínimo/i,
    ];
    for (let regex of regexMinimos) {
        const porcentaje = data.match(regex);
        if (porcentaje != null) {
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
    for (let regex of regexs) {
        const fechaRemate = data.match(regex);
        if (fechaRemate) {
            return fechaRemate;
        }
    }
    return null;
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
    const dataNormalizada = data.replace(/(\d)\s(?=\d{1,3}(?:\.\d{3})+)/g, '$1').replace(/\n/g, " ");
    const regexList = buscarOpcionesMontoMinimo(dataNormalizada, regexMontoMinimo);
    // console.log("RegexList: ",regexList);
    let montoFinal = buscarMontosFinal(regexList, regexMontoMinimo);
    if (montoFinal) {
        // console.log("Monto final: ",montoFinal);
        return montoFinal;
    }
    return null;
}

function buscarOpcionesMontoMinimo(data, regexMontoMinimo) {
    let regexList = [];
    const regexBuscarOpciones = [
        new RegExp(regexMontoMinimo[0], "gi"),
        new RegExp(regexMontoMinimo[1], "gi"),
        new RegExp(regexMontoMinimo[2], "gi"),
    ];
    for (let regex of regexBuscarOpciones) {
        const posibleMonto = data.match(regex);
        if (posibleMonto) {
            regexList.push(...posibleMonto);
        }
    }
    return regexList;
}

function buscarMontosFinal(regexList, regexMontoMinimo) {
    const regexBuscarMontos = [
        { regex: new RegExp(regexMontoMinimo[0], "i"), moneda: "UF" },
        { regex: new RegExp(regexMontoMinimo[1], "i"), moneda: "UF" },
        { regex: new RegExp(regexMontoMinimo[2], "i"), moneda: "Pesos" },
    ];
    for (let posibleMonto of regexList) {
        if (!esMontoValido(posibleMonto)) {
            continue;
        }
        for (let { regex, moneda } of regexBuscarMontos) {
            const montoMinimo = posibleMonto.match(regex);
            if (montoMinimo) {
                montoFinal = { monto: montoMinimo[1], moneda: moneda };
                return montoFinal;
            }
        }
    }
}


function esMontoValido(monto) {
    if (monto.includes("no inferior")) {
        return false;
    }
    return true;
}

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

// Obtiene la comuna del remate a base de una lista de comunas.
function getComuna(data) {
    const dataNormalizada = data.toLowerCase();
    // console.log("Data normalizada: ",dataNormalizada);
    for (let comuna of comunas) {
        comuna = comuna.toLowerCase();
        const listaPreFrases = ["comuna de ", "comuna ", "comuna y provincia de ", "conservador de bienes raíces de ", "conservador bienes raíces ", "registro de propiedad de ", "registro propiedad ", "registro propiedad cbr "];
        for (let preFrase of listaPreFrases) {
            const comunaPreFrase = preFrase + comuna;
            const comunaSinEspacio = comunaPreFrase.replace(/\s*/g, '');
            if (dataNormalizada.includes(comunaPreFrase) || dataNormalizada.includes(comunaSinEspacio)) {
                return comuna;
            }
        }
    }
    return null;
}

// Obtiene la foja del remate.
function getFoja(data) {
    const regexFoja = /(fojas|fs|fjs)(.)?\s*(N°\s+)?((\d{1,3}.)*)(\d{1,3})/ig;
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
function getPartes(data) {
    const regexSAGR = /S\.\s*A\.?\s*(G\.\s*)?(R\.\s*)?/gi
    let dataNormalized = data.replace(/'/g, '').replace(/"/g, '').replace(/`/g, '');
    dataNormalized = dataNormalized.replace(regexSAGR, (match) => match.replace(/\./g, ''));
    // regex para partes: busca la palabra caratulado o expediente seguido de un rol, y 
    //luego busca 1 a 6 palabras seguidas de S.A., S.A.G.R., S.A.G.R., S.A. o con y otra seguida de 1 a cuatro palabras.
    // Si no lo encuentra con la palabra caratulado/expediente, busca con la palabra banco
    const banco = "Banco";
    const indexBanco = dataNormalized.indexOf(banco);
    if (indexBanco != -1) {
        const bancoPartes = obtenerFrasesConBanco(dataNormalized);
        for (let parte of bancoPartes) {
            let partesModificadas = eliminarHastaDelimitador(parte, ".");
            partesModificadas = eliminarHastaDelimitador(partesModificadas, ",");
            partesModificadas = eliminarHastaDelimitador(partesModificadas, "Rol");
            if (incluyeParte(partesModificadas)) {
                return partesModificadas;
            }
        }
    }
    // Si no lo encuentra con la palabra banco, busca con una lista de nombres propios de bancos y cooperativas. 
    const partesNombreBanco = buscarPartesNombreBanco(dataNormalized);
    if (partesNombreBanco != null) {
        return partesNombreBanco;
    }
    const regexPartes = /(?:caratulado?a?s?|expediente|antecedentes?|autos|causa),?\s*[:]?(?:(?:Rol\s)?N?º?\s*C\s*-?\s*(\d{1,5}|\d{1,3}\.\d{1,3})\s*-\s*(\d{1,5}|\d{1,3}\.\d{1,3}),?)?(\s*[\.,a-zA-ZáéíóúñÑ-]+){1,12}\s*(con\s+|\/|-)(\s*[a-zA-ZáéíóúñÑ\/\.]+){1,4}/ig;
    // const regexPartes = /(?:caratulado?a?s?|expediente|antecedentes?)\s*[:]?(?:(?:Rol\s)?\s*C\s*-\s*\d{1,5}\s*-\s*\d{1,5},?)?(\s*[,a-zA-ZáéíóúñÑ-]+){1,10}\s*(S\.A\.G\.R\.|S\.A\.G\.R\.|S\.A\.?\/?|con|\/|-)(\s*[a-zA-ZáéíóúñÑ\/\.]+){1,4}/i;
    let partes = dataNormalized.match(regexPartes);
    if (partes != null) {
        if (partes.length > 1) {
            const partesValidadas = partes.filter(parte => incluyeParte(parte));
            if (partesValidadas.length > 0) {
                return partesValidadas[0];
            }
        }
        if (incluyeParte(partes[0])) {
            return partes[0];
        }
        return partes[0];
    }

    return null;
}

function buscarPartesNombreBanco(data) {
    const normalizedData = data.toLowerCase();
    // console.log("Data banco: ",dataNormalized);
    for (let bank of BANCOS) {
        // Revisa si el banco de la lista esta en el texto
        const bankIndex = normalizedData.indexOf(bank);
        if (bankIndex == -1) {
            continue;
        }
        //Aqui tiene dos opciones para busar delimitador,rol o un punto.
        // Si esta, busca la palabra rol
        const bankData = normalizedData.substring(bankIndex);
        if (bankData.includes("rol")) {
            const rolIndex = bankData.indexOf('rol');
            if (rolIndex == -1) {
                continue;
            }
            let parties = bankData.substring(0, rolIndex);
            if (incluyeParte(parties)) {
                return parties;
            }
        }

        //Busca un punto que finalize las partes 
        const endOfPartiesWithPeriod = bankData.indexOf('.');
        if (endOfPartiesWithPeriod == -1) {
            continue;
        }
        parties = bankData.substring(0, endOfPartiesWithPeriod);
        if (incluyeParte(parties)) {
            return parties;
        }

    }
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

function getTipoDerecho(data) {
    const normalizedData = data.toLowerCase();
    // Primero revisa si hay una propiedad con derecho de usufructo, nuda propiedad o bien familiar
    // de manera mas simple.
    const regexForeclosure = /(?:posesión|usufructo|nuda propiedad|bien familiar)/i;
    const tipoDerecho = normalizedData.match(regexForeclosure);
    if (tipoDerecho) {
        return tipoDerecho[0];
    }
    // Si no encuentra nada, busca con una lista de posibles maneras de escribir derecho.
    const multipleRegexForeclosures = [
        /derechos\s*correspondientes\s*a\s*(\d{1,3}(?:,\d{1,8})?)%/gi,
        /(\d{1,3}(?:,\d{1,8})?)%\sde\slos\sderechos/gi,
        /derechos\s*(?:[a-zA-Zñáéíóú,]*\s){1,50}(\d{1,2}(?:,\d{1,8})?)%/gi,
    ];
    let foreclosure = [];
    for (let regex of multipleRegexForeclosures) {
        const foreclosure = normalizedData.match(regex);
        if (foreclosure) {
            foreclosure.push(foreclosure);
        }
    }
    // Luego de agregar todos los posibles derechos, revisa si hay alguno que tenga un porcentaje.
    // Si hay uno, lo devuleve.
    if (foreclosure.length > 0) {
        const foreclosurePercentage = obtainFinalPercentage(derechos);
        return foreclosurePercentage;
    }
    const regexDerechoSinPorcentaje = [
        /derechos\s*(:?sobre|en)\s*(:?la|el)?\s*(:?propiedad|departamento|inmueble)/gi
    ]
    for (let regex of regexDerechoSinPorcentaje) {
        const derechoSinPorcentaje = normalizedData.match(regex);
        if (derechoSinPorcentaje) {
            return "derecho";
        }
    }
    return null;
}

function obtainFinalPercentage(foreclosures) {
    let minPercentage = Infinity;
    let minForeclosure = null;
    const numberRegex = /\d{1,3}(?:,\d{1,8})?/g;
    if (foreclosures.length == 1) {
        return foreclosures[0][0];
    }

    for (let foreclosure of foreclosures) {
        const foreclosureString = foreclosure[0];
        let percentage = foreclosureString.match(numberRegex);
        if (percentage) {
            const percentageNumber = parseFloat(percentage[0].replace(",", "."));
            if (percentageNumber < minPercentage) {
                minPercentage = percentageNumber;
                minForeclosure = foreclosureString;
            }
        }
    }

    return minForeclosure;
}
function getAnno(data) {
    // Busca el año con dependencia de las fojas, "fojas xxxx del año xxxx"
    const regexFojasDependiente = /(?:fojas|fs\.?|fjs).*?(?:del?|a[n|ñ]o)\s*(\b\d{1}(?:\.\d{3})?\b|\d{1,4})/i;
    const fojasDependiente = data.match(regexFojasDependiente);
    if (fojasDependiente != null) {
        return fojasDependiente[1];
    }
    // Busca el año con dependencia del registro de propiedad con regex "registro de propiedad del? ano? xxxx"
    const registroRegex = /registro\s*(?:de)?\s*propiedad\s*(?:del?\s*)?(?:a[n|ñ]o\s*)?(\d{4})/i;
    let registro = data.match(registroRegex);
    if (registro != null) {
        return registro[1];
    }
    // Busca el año con dependencia de registro de propiedad hasta encontrar una coma, "registro de propiedad xxxx,", luego devuelve solo el año.
    const dataNormalized = data.toLowerCase();
    let registroFecha = dataNormalized.indexOf('registro de');
    if (registroFecha == -1) {
        registroFecha = dataNormalized.indexOf('reg de propiedad');
    }
    if (registroFecha == -1) {
        registroFecha = dataNormalized.indexOf('registro propiedad');
    }
    if (registroFecha == -1) {
        return null;
    }
    const dataRegistro = dataNormalized.substring(registroFecha);
    let registroFin = dataRegistro.indexOf('.');
    console.log("Registro fin: ",registroFin);
    if (registroFin == -1) {
        registroFin = dataRegistro.indexOf(',');
    }
    if (registroFin == -1) {
        return null;
    }
    registro = dataRegistro.substring(0, registroFin);
    // console.log("Registro: ",registro);
    const regexAnnoConDecimal = /(\b\d{1}(?:\.\d{3})?\b|\b\d{4}\b)/gi;
    const annoRegistro = registro.match(regexAnnoConDecimal);
    if (annoRegistro != null) {
        return annoRegistro[0];
    }
    console.log("No se encontro el año en el registro de propiedad");
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

function getDiaEntrega(data) {
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
        /presentar\s*el\s*vale\s*vista\s*el\s*d[ií]a\s*(lunes|martes|miercoles|jueves|viernes|sabado|domingo)\s*\d{1,2}\s*de\s*[a-zA-Záéíóú]{4,10}\s*de\s*\d{4}/gi
    ]

    for (let regex of regexDiaEntrega) {

        const diaEntrega = data.match(regex);
        if (diaEntrega != null) {
            return diaEntrega;
        }
    }
    return null;
}

function getRolPropiedad(data) {
    const regexRolAvaluo = /rol\s*(?:de\s*)?aval[uú]o\s*(?:es\s*)?(?:el\s*)?(?:Nº?°?\s*)?(\d{1,5}\s*-\s*\d{1,5})/i;
    const rolAvaluo = data.match(regexRolAvaluo);

    if (rolAvaluo) {
        return rolAvaluo[1];
    }

    return null;

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


function eliminarHastaDelimitador(texto, delimitador) {
    const limite = texto.indexOf(delimitador);
    if (limite == -1) {
        return texto;
    }
    return texto.substring(0, limite);
}

function obtenerFrasesConBanco(texto) {
    const regex = /banco.*?\./gi; // Busca "banco" seguido de cualquier cosa hasta el primer punto
    const coincidencias = texto.match(regex);
    return coincidencias || []; // Devuelve las frases encontradas o un array vacío
}

function incluyeParte(texto) {
    const incluyecon = texto.includes("con");
    const incluyeContra = texto.includes("contra");
    const incluyeCon = texto.includes("Con");
    const incluyeBarra = texto.includes("/");
    const opcionesInvalidas = verificarOpcionesInvalidas(texto);
    if ((incluyecon || incluyeContra || incluyeCon || incluyeBarra) && !opcionesInvalidas) {
        return true;
    }
    return false;
}

function emptyCaseEconomico() {
    const caso = new Caso("", "", "", 0);
    return [caso];
}

function verificarOpcionesInvalidas(texto) {
    const textoNormalizado = texto.toLowerCase();
    const includeEntregaVale = textoNormalizado.includes("entrega del vale");
    const includeordenDelTribunal = textoNormalizado.includes("orden del tribunal");
    if (includeEntregaVale || includeordenDelTribunal) {
        return true;
    }
    return false;
}
function normalizeDescription(description) {
    return description.replace(/[\r\n\x0B\x0C\u0085\u2028\u2029]/g, ' ').trim();
}
function generateVariations(tribunal) {
    const tribunalNormalized = tribunal
        .toLowerCase()
        .replace(/de\s+/, '')
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

    const tribunalSinDe = tribunalNormalized.replaceAll("de ", '');
    const variaciones = [tribunalNormalized, tribunalSinDe];

    const numeroMatch = tribunal.match(/\d{1,2}/);
    if (numeroMatch) {
        const numero = parseInt(numeroMatch[0]);
        const ordinalForm = convertirANombre(numero);

        // if(tribunal.includes("7° JUZGADO CIVIL DE SANTIAGO")){
        //     console.log("Variaciones: ",ordinalForm, "Tipo : ",typeof ordinalForm);   
        // }

        const simbolosOrdinales = ['°', 'º', ''];

        const bases = [
            tribunalNormalized,
            tribunalNormalized.replace('juzgado', 'tribunal')
        ]

        ordinalForm.push(numero.toString());
        for (const base of bases) {
            ordinalForm.forEach((form) => {
                simbolosOrdinales.forEach((simbolo) => {
                    variaciones.push(base.replace(/\d{1,2}°/, `${form}${simbolo}`)); // 3°
                    variaciones.push(base.replace(/\d{1,2}°/, `${form}`)); // tercero
                    variaciones.push(base.replace(/\d{1,2}°/, `${form} ${simbolo}`)); // 3 °
                });
                variaciones.push(base.replace(/\s+/g, '')); // 3°juzgado
            });
        }

        if (tribunalNormalized.includes("en lo civil")) {
            variaciones.push(...variaciones.map(variation => variation.replace("en lo civil ", "")));
        }
    }
    return variaciones;
}

function convertirANombre(number) {
    const ordinalForm = {
        1: ["primer"],
        2: ["segundo"],
        3: ["tercer"],
        4: ["cuarto"],
        5: ["quinto"],
        6: ["sexto"],
        7: ["septimo"],
        8: ["octavo"],
        9: ["noveno"],
        10: ["decimo"],
        11: ["undecimo", "decimoprimero", "decimo primero"],
        12: ["duodecimo", "decimosegundo", "decimo segundo"],
        13: ["decimotercero", "decimo tercero", "decimotercer", "decimo tercer"],
        14: ["decimocuarto", "decimo cuarto"],
        15: ["decimoquinto", "decimo quinto"],
        16: ["decimosexto", "decimo sexto"],
        17: ["decimoseptimo", "decimo septimo"],
        18: ["decimoctavo", "decimo octavo"],
        19: ["decimonoveno", "decimo noveno"],
        20: ["vigesimo"],
        21: ["vigesimoprimero", "vigesimo primero"],
        22: ["vigesimosegundo", "vigesimo segundo"],
        23: ["vigesimotercero", "vigesimo tercero", "vigesimo tercer", "vigesimotercer"],
        24: ["vigesimocuarto", "vigesimo cuarto"],
        25: ["vigesimoquinto", "vigesimo quinto"],
        26: ["vigesimosexto", "vigesimo sexto"],
        27: ["vigesimoseptimo", "vigesimo septimo"],
        28: ["vigesimoctavo", "vigesimo octavo"],
        29: ["vigesimonoveno", "vigesimo noveno"],
        30: ["trigesimo"],
        31: ["trigesimoprimero", "trigesimo primero"],
        32: ["trigesimosegundo", "trigesimo segundo"],
        33: ["trigesimotercero", "trigesimo tercero"],
        34: ["trigesimocuarto", "trigesimo cuarto"],
        35: ["trigesimoquinto", "trigesimo quinto"],
        36: ["trigesimosexto", "trigesimo sexto"],
        37: ["trigesimoseptimo", "trigesimo septimo"],
        38: ["trigesimoctavo", "trigesimo octavo"],
    }

    // Verificar que el número está dentro del rango válido
    if (number >= 1 && number <= 38) {
        return ordinalForm[number]; // Ajuste para que el índice coincida con el número
    } else {
        return null; // Si el número está fuera del rango de 1 a 40
    }
}
module.exports = {
    getDatosRemate, testUnico, procesarDatosRemate,
    getAnno,
    getCausa,
    getCausaVoluntaria,
    getJuzgado,
    getJuezPartidor,
    getComuna,
    getDiaEntrega,
    getDireccion,
    getFoja,
    getFormatoEntrega,
    getJuezPartidor,
    getMontoMinimo,
    getMultiples,
    getNumero,
    getPartes,
    getPorcentaje,
    getRolPropiedad,
    getTipoDerecho,
    getTipoPropiedad,
    getFechaRemate,
    emptyCaseEconomico
};