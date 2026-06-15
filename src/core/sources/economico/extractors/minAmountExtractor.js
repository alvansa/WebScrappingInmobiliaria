
//Obtiene el monto minimo por el cual iniciara el remate.
function extractMinAmount(data, isDebug = false) {
    // const regexPatronBase = "(?:subasta|m[íi]nim[oa]|rematar|propiedad)\\s*[,a-zA-ZáéíóúÑñ:º0-9\\s]*\\s+";
    const regexPatronBase = "(?:subasta|m[íi]nim[oa]|rematar|propiedad\\b)(?:,\\s)?(?!más)\\s*[,a-zA-ZáéíóúÑñ:º0-9\\s]*\\s+";

    const regexMontoMinimo = [
        `${regexPatronBase}(\\d{1,12}\\s*(?:\\.\\d{1,3})*(?:,\\d{1,10})?)\\s*\\.?-?\\s*(?:Unidades de Fomento|UF|U\\.F\\.)`,
        `${regexPatronBase}(?:Unidades de Fomento|U\\.?F\\.?)\\s*(\\d{1,12}\\s*(?:\\.\\d{1,3})*\\s*(?:,\\d{1,10})?)`,
        `${regexPatronBase}\\$\\s*(\\d{1,3}(?:\\.\\d{3})+)`
    ];
    const dataNormalizada = data.replace(/(\d)\s(?=\d{1,3}(?:\.\d{3})+)/g, '$1').replace(/\n/g, " ");
    const regexList = buscarOpcionesMontoMinimo(dataNormalizada, regexMontoMinimo, isDebug);
    // console.log("RegexList: ",regexList);
    let montoFinal = buscarMontosFinal(regexList, regexMontoMinimo);
    // console.log(`1 mas arriba Monto minimo valido: ${montoFinal.monto} y moneda ${montoFinal.moneda}`);
    if (montoFinal) {
        return montoFinal;
    }
    return null;
}

function buscarOpcionesMontoMinimo(data, regexMontoMinimo, isDebug) {
    let regexList = [];
    const regexBuscarOpciones = [
        new RegExp(regexMontoMinimo[0], "gi"),
        new RegExp(regexMontoMinimo[1], "gi"),
        new RegExp(regexMontoMinimo[2], "gi"),
    ];
    for (let regex of regexBuscarOpciones) {
        const posibleMonto = data.match(regex);
        if (posibleMonto) {
            if(isDebug){
                console.log('Encontrado monto minimo : ', regex)
            }
            regexList.push(...posibleMonto);
        }
    }
    return regexList;
}

function buscarMontosFinal(regexList, regexMontoMinimo) {
    if(regexList.length == 0) return null;
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

    return null;
}

function esMontoValido(monto) {
    // El 'derechos' es para evitar que obtenga el minimo del costo del GP.
    if (monto.includes("no inferior") || monto.includes('derechos')) {
        return false;
    }
    return true;
}

module.exports = {extractMinAmount}