const  convertWordToNumbers  = require('../../../utils/convertWordToNumbers');

function processHousePrice(text) {
    // console.log(text)
    if (!text.includes("inscripci")) {
        // Solo se obtiene el monto de compra de la inscripcion
        return null;
    }
    //Preprocesar el texto para eliminar cosas que no son necesarias
    text = preProcessText(text);
    // Funcion que busca: por el precio de
    let monto = searchByPorCompra(text);
    if (monto) {
        return processMonto(monto);
    }
    // Funcion que busca: precio de compraventa
    monto = searchByCompraVenta(text)
    if (monto) {
        return processMonto(monto);
    }
    // Funcion que busca por: Adquirio la propiedad
    monto = searchByAdquirio(text);
    if (monto) {
        return processMonto(monto);
    }
    // Funcion que busca por: por la suma
    monto = searchByPorLaSuma(text);
    if (monto) {
        return processMonto(monto);
    }
    // Este hay que siempre dejarlo al final, ya que es el "peor" porque es un aporte de una sociedad
    monto = searchByEstimacion(text);
    if (monto) {
        return processMonto(monto);
    }
    return null;
}

function preProcessText(text) {
    const regexFirma = /documento\s*incorpora\s*firma\s*electronica\s*avanzada\s*codigo\s*de\s*verificacion\s*:?\s*\w{1,}-\w/g;
    return text
        .replace(/fojas\s*\d{1,5}/gi, " ")
        .replace(/pagina\s*\d{1,2}\s*de\s*\d{1,2}/gi, " ")
        .replace(regexFirma, " ")
        .replace(/[\n]/g, " ")
        .replace(/\s+/g, " ");
}

//Procesa el monto cuando viene en formato de texto y devuelve un numero con su tipo de moneda.
function processMonto(monto) {
    let total;
    const regexNumber = /\d{1,}(?:[\.|,]\d{1,3})*/;
    const ufRegex = /(unidades\s*de\s*fomento|u\.?f\.?)/i;
    const pesosRegex = /(\$|pesos)/i;

    if (!monto) {
        return {
            monto: null,
            moneda: null
        }
    }

    const matchUF = ufRegex.exec(monto)
    if (matchUF) {
        const montoWithoutType = monto.substring(0, matchUF.index);
        if (montoWithoutType.includes("coma")) {
            const parts = montoWithoutType.split("coma");
            const intPart = convertWordToNumbers(parts[0]);
            let decimalPart = convertWordToNumbers(parts[1]);
            if (decimalPart === 1) {
                decimalPart = 0.1;
            } else {
                decimalPart *= 1 / 10 ** Math.ceil(Math.log10(decimalPart))
            }
            // console.log("intPart: ", intPart, "decimalPart: ", decimalPart);
            total = intPart + decimalPart;
            return {
                monto: total,
                moneda: "UF"
            }
        }
        const matchedNumber = regexNumber.exec(montoWithoutType);
        if (matchedNumber) {
            return {
                monto: parseInt(matchedNumber[0]),
                moneda: "UF"
            }
        } else {
            // console.log(montoWithoutType)
            total = convertWordToNumbers(montoWithoutType);
            // console.log(montoWithoutType)
            return {
                monto: total,
                moneda: "UF"
            }
        }
    } else if (pesosRegex.exec(monto)) {
        const pesosMatch = pesosRegex.exec(monto);
        const montoWithoutType = monto.substring(0, pesosMatch.index);
        const matchedNumber = regexNumber.exec(montoWithoutType);
        if (matchedNumber) {
            return {
                monto: parseInt(matchedNumber[0]),
                moneda: "Pesos"
            }
        } else {
            total = convertWordToNumbers(montoWithoutType);
            return {
                monto: total,
                moneda: "Pesos"
            }
        }
    }
}

function searchByPorCompra(text) {
    //   const startIndexRegex = /por\s*compra\s*a\s*/i;
    //   const startMatch = startIndexRegex.exec(text);
    //   if(!startMatch){
    //     return null;  
    //   }
    //   const startIndex = startMatch.index
    //   const newText = text.substring(startIndex);
    //   console.log(newText)
    const indexPrice = /por\s*el\s*precio\s*de/i;
    const priceMatch = indexPrice.exec(text);
    if (!priceMatch) {
        return null;
    }

    let priceText = text.substring(priceMatch.index + priceMatch[0].length + 1);
    const end1 = priceText.indexOf(",");
    priceText = priceText.substring(0, end1);


    return priceText;
}

function searchByCompraVenta(text) {
    const startRegex = /precio\s*de(\s*la)?\s*compraventa/i;
    const startMatch = startRegex.exec(text);
    if (!startMatch) {
        return null;
    }
    let newText = text.substring(startMatch.index);
    // console.log(`---------------\n${newText}\n--------------------`)

    let endFomentoRegex = /fomento/i;
    let endMatch = endFomentoRegex.exec(newText);
    if (!endMatch) {
        return null;
    }
    newText = newText.substring(0, endMatch.index + endMatch[0].length);
    return newText;
}

function searchByAdquirio(text) {
    const regexAdquirio = /adquirio\s*la\s*propiedad/i;
    const matchedAdquirio = regexAdquirio.exec(text);
    if (!matchedAdquirio) {
        return null;
    }
    let newText = text.substring(matchedAdquirio.index);
    const regexCompraventa = /compraventa/i;
    const matchedEnd = regexCompraventa.exec(newText);
    if (!matchedEnd) {
        return null;
    }
    newText = newText.substring(0, matchedEnd.index);
    return newText;
}

function searchByPorLaSuma(text) {
    const regexSuma = /(por|en)\s*la\s*suma/i;
    const matchedAdquirio = regexSuma.exec(text);
    if (!matchedAdquirio) {
        return null;
    }
    let newText = text.substring(matchedAdquirio.index);
    const regexCompraventa = /,/i;
    const matchedEnd = regexCompraventa.exec(newText);
    if (!matchedEnd) {
        return null;
    }
    newText = newText.substring(0, matchedEnd.index);
    return newText;
}

function searchByEstimacion(text) {

    const indexPrice = /se\s*estiman?(?:\s*en)/i;
    const priceMatch = indexPrice.exec(text);
    if (!priceMatch) {
        return null;
    }

    let priceText = text.substring(priceMatch.index + priceMatch[0].length + 1);
    const end1 = priceText.indexOf(",");
    priceText = priceText.substring(0, end1);


    return priceText;
}

module.exports = { processHousePrice };