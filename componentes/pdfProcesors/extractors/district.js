const extractor = require('../../economico/extractors');

function processDistrict(spanishInfo, infoNormalized, logData = false) {
    const regexDominio = /dominio\s*con\s*vigencia/gi;
    //No se obtiene la comuna de la inscripcion porque en esta aparecen varias comunas
    //Del comprador, vendedor, inmobiliaria, juzgado, etc
    if (regexDominio.test(spanishInfo)) {
        console.log("Incluye dominio con vigencia, no se puede obtener la comuna");
        return null;
    }
    spanishInfo = normalizeInfoForComuna(spanishInfo);
    infoNormalized = normalizeInfoForComuna(infoNormalized)
    if (logData) {
        console.log("normalizada spanish", spanishInfo);
        console.log("normalizada natural ", infoNormalized);
    }

    // console.log("info en comuna: ", info);
    let comuna = obtainComunaByIndex(infoNormalized, logData);
    if (comuna) {
        return comuna;
    }
    comuna = extractor.district(spanishInfo, true, logData);

    if (comuna) {
        return comuna;
    }
    return null;
}

function normalizeInfoForComuna(info) {
    const regexAdquirio = /los\s*adquirio\s*/i;
    const regexAdquirioSpanish = /los\s*adquirió/i;
    const matchNormalizado = regexAdquirio.exec(info);
    const matchSpanish = regexAdquirioSpanish.exec(info);

    if (matchNormalizado) {
        const endIndex = matchNormalizado.index;
        info = info.substring(0, endIndex);
    } else if (matchSpanish) {
        const endIndex = matchSpanish.index;
        info = info.substring(0, endIndex);
    }
    const regexCasoComprador = /Lo\s+adquiri[oó]\s+(.*?)(?=\.\s*\-|\.[\s]*$|$)/i;
    const matchedText = info.match(regexCasoComprador);
    if (matchedText) {
        info = info.replace(matchedText[0], '');
    }
    return info
}
//Obtener la comuna del documento de avaluo fiscal
function obtainComunaByIndex(info, logData = false) {
    const startText = "comuna:";
    const startIndex = info.indexOf(startText);
    if (startIndex === -1) {
        if(logData) console.log('No se encontro inicio')
        // console.log("No se encontro la comuna por index startIndex");
        return null;
    }
    const modifiedInfo = info.substring(startIndex);
    const endText = "numero de rol de avaluo";
    const endIndex = modifiedInfo.indexOf(endText);

    if (endIndex === -1) {
        if(logData) console.log('No se encontro el final')
        // console.log("No se encontro el final de la comuna por index endIndex");
        return null;
    }
    const comuna = modifiedInfo.substring(startText.length, endIndex).trim();
    // console.log("comuna by index: ", comuna);
    return comuna;

}

module.exports = { processDistrict };