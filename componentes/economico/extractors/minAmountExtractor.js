
//Obtiene el monto minimo por el cual iniciara el remate.
function extractMinAmount(data) {
    // console.log(data);
    const regexPatronBase = "(?:subasta|m[íi]nim[oa]|rematar|propiedad)\\s*[,a-zA-ZáéíóúÑñ:º0-9\\s]*\\s+";

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

module.exports = {extractMinAmount}