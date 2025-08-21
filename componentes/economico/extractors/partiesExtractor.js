const { BANCOS} = require('../../caso/datosLocales.js');

// Obtiene las partes del remate.
function extractParties(data) {
    const regexSAGR = /S\.\s*A\.?\s*(G\.\s*)?(R\.\s*)?/gi
    let dataNormalized = data.replace(/'/g, '').replace(/"/g, '').replace(/`/g, '').replace(/“/g,'');
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

function verificarOpcionesInvalidas(texto) {
    const textoNormalizado = texto.toLowerCase();
    const includeEntregaVale = textoNormalizado.includes("entrega del vale");
    const includeordenDelTribunal = textoNormalizado.includes("orden del tribunal");
    if (includeEntregaVale || includeordenDelTribunal) {
        return true;
    }
    return false;
}

function obtenerFrasesConBanco(texto) {
    const regex = /banco.*?\./gi; // Busca "banco" seguido de cualquier cosa hasta el primer punto
    const coincidencias = texto.match(regex);
    return coincidencias || []; // Devuelve las frases encontradas o un array vacío
}

function eliminarHastaDelimitador(texto, delimitador) {
    const limite = texto.indexOf(delimitador);
    if (limite == -1) {
        return texto;
    }
    return texto.substring(0, limite);
}

module.exports = {extractParties};