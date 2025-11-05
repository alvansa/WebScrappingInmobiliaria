const { isLawsuit, consoleDebug } = require('./utilsPdf');
const convertWordToNumbers = require('../../../utils/convertWordToNumbers');

const regexMutuoHipotecario = /mutuo\s*hipotecario/i;

function processBuyYear(text, debug = false) {
    if (!text) return null;
    if (!regexMutuoHipotecario.exec(text) && !isLawsuit(text)) {
        const GPnormalizedInfo = adaptTextIfGP(text);
        if (!GPnormalizedInfo) {
            // console.log("No se obtiene el ano del GP");
            return null;
        }
        const anno = obtainBuyYear(GPnormalizedInfo, debug);
        if (anno) {
            console.log(`-----------------\nanno: ${anno}\n-----------------`);
            return anno;
        }
    }
    return null;
}

function adaptTextIfGP(texto) {
    const regexGP = /certificado\s*de\s*hipotecas/gi;
    if (regexGP.test(texto)) {
        return null;
    }
    const endIndex = texto.search(/registro\s*de\s*hipotecas/);
    if (endIndex === -1) {
        return texto;
    }
    const newText = texto.substring(0, endIndex);
    return newText;
}
function obtainBuyYear(texto, debug = false) {
    //Busca el anno por "adquirio por compra"
    consoleDebug(debug, texto);
    let anno = obtainYearForm1(texto);
    if (anno) {
        consoleDebug(debug, `anno encontrado por forma 1: ${anno}`);
        return anno;
    }
    //Busca el anno por "con fecha"
    // anno = this.obtainYearForm2(texto);
    // if(anno) {
    //     return anno;
    // }
    //Busca el anno por "registro de propiedad del año".
    anno = obtainFromRegistroPropiedad(texto);
    if (anno) {
        consoleDebug(debug, `anno encontrado por registro de propiedad: ${anno}`);
        return anno;
    }
    //Busca el anno por Conservador
    anno = obtainFromConvervador(texto);
    if (anno) {
        consoleDebug(debug, `anno encontrado por conservador: ${anno}`);
        return anno;
    }
    //Busca el anno por "inscripcion al año"
    anno = obtainYearFromInscripcion(texto);
    if (anno) {
        consoleDebug(debug, `anno encontrado por inscripcion: ${anno}`);
        return anno;
    }
    return null;
}

function obtainYearForm1(text) {
    const regexStartBuy = /(adquirio\s*por\s*compra)|(adquiried\s*por\s*compra)/i;
    const startText = regexStartBuy.exec(text);
    let anno;
    if (!startText) {
        return null;
    }
    let newText = text.substring(startText.index);

    const newStart = /del\s*ano/i;
    let startAno = newStart.exec(newText);
    if (!startAno) {
        const newStart2 = /del\s*afio/i; // Se agrego esta segunda terminacion pensando en variaciones leidas con tesseract
        startAno = newStart2.exec(newText);
        if (!startAno) {
            return null;
        }
    }

    newText = newText.substring(startAno.index);

    const regexEndBuy = /,\s*otorgada/i;
    const endText = regexEndBuy.exec(newText);
    if (!endText) {
        return null;
    }
    const endIndex = endText.index;
    newText = newText.substring(0, endIndex)
    //Existen casos donde en la inscripcion aparecen dos annos, separados por un "y", en ese caso se toma el primero.
    if (newText.includes("y")) {
        const parts = newText.split("y");
        return convertWordToNumbers(parts[0].trim());

    }
    anno = convertWordToNumbers(newText);
    return anno;
}

function obtainYearForm2(text) {
    let newText;
    const startRegex = /con\s*fecha/i;
    const startWord = startRegex.exec(text);
    if (!startWord) {
        return null;
    }
    newText = text.substring(startWord.index);

    const endRegex = /,\s*repertorio/i;
    const endWord = endRegex.exec(newText);
    if (!endWord) {
        return null;
    }
    newText = newText.substring(0, endWord.index);
    const annoRegex = /\b\d{4}\b/i;
    const anno = newText.match(annoRegex);
    if (anno) {
        return anno[0];
    }
}


function obtainFromRegistroPropiedad(texto) {

    const registroRegex = /registro\s*(?:de)?\s*propiedad(?:es)?\s*(?:a\s*mi\s*cargo,?\s*)?(?:del?\s*)?(?:correspondiente\s*al\s*)?(?:a(?:n|ñ|fi)o\s*)?((\d{4}|\d{1,3}(\.\d{3})*)(\b|\s|,))/i;
    let registro = texto.match(registroRegex);

    if (registro != null) {
        return registro[1];
    }
    const regexAnnoParentesis = /registro\s*(?:de)?\s*propiedad(?:es)?\s*(?:del?\s*|a\s*mi\s*cargo,?\s*)?(?:correspondiente\s*al\s*)?(?:a(?:n|ñ|fi)o\s*)?.{1,30}\((\d{1,})\)/i;
    registro = texto.match(regexAnnoParentesis);
    if (registro != null) {
        return registro[1];
    }
    return null;
}

function obtainFromConvervador(texto) {
    const registroRegex = /conservador\s*de\s*bienes\s*raices\s*de(?:\s*la)?(?:\s*\w{1,}\s*,?)?(?:\s*correspondiente\s*al)?(?:\s*del)?(?:\s*ano)\s*((\d{4}|\d{1,3}(\.\d{3})*))/i;
    let registro = texto.match(registroRegex);
    if (registro != null) {
        return registro[1];
    }
    const delAnnoConservador = /del\s*ano\s*(\d{4}|\d{1,3}(\.\d{3})*)\s*,\s*del\s*conservador\s*de\s*bienes\s*raices/i;
    registro = texto.match(delAnnoConservador);
    if (registro != null) {
        return registro[1];
    }

    return null;
}

function obtainYearFromInscripcion(texto) {
    const regexInscripcion = /inscripcion\s*.*al\s*ano\s*(\d{4})/i;
    let registro = texto.match(regexInscripcion);
    if (registro) {
        return registro[1];
    }
    return null;
}

module.exports = { processBuyYear };