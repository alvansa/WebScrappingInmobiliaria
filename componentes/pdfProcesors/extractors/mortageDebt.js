const regexMutuoHipotecario = /mutuo\s*hipotecario/i;

function processMortageDebt(text, debug = false) {

    if (!isHipotecario(text)) {
        return;
    }

    return obtainMortageDebt(text);


}

function isHipotecario(text) {
    if (regexMutuoHipotecario.exec(text) || text.includes('mutuo')) {
        return true;
    }
    if (text.includes("prestamo")) {
        // console.log("No valido para deuda por prestamo");
        return false;
    }
    if (text.includes("hipoteca")) {
        return true;
    }
    if (text.includes("pagare")) {
        // console.log("no valido para deuda por pagare");
        return false;
    }
    const regexMeses = /\d{2,}\s*(meses|cuotas\s*mensual)/;
    const matchRegexMeses = text.match(regexMeses);
    if (matchRegexMeses) {
        const numMeses = parseInt(matchRegexMeses[0].match(/\d{1,}/)[0]);
        if (numMeses > 60) {
            return true;
        }
    }
    return false;
}
function obtainMortageDebt(text) {
    let deuda;
    // console.log("------------\nBuscando deuda hipotecaria");
    let newText = trimTextHipotecario(text);
    if (!newText) {
        return null;
    }
    const regexNumber = "(\\d{1,}|\\d{1,3}(\\.\\d{1,3})*),?(\\d{1,})?"
    const regexUF = "(u\\.?[fe]\\.?|unidades?\\s*de\\s*fomento)"
    const regexDeudaUF = new RegExp(`(${regexNumber}\\s*(-\\s*)?${regexUF}|${regexUF}\\s*${regexNumber})`, "gi")
    const matchNumero = newText.match(regexDeudaUF);
    if (matchNumero) {
        deuda = this.checkBiggerDebt(matchNumero)
        if (deuda.includes("ue")) {
            deuda = deuda.replace("ue", "uf");
        }
        return deuda;
    }

    const regexDeudaPesos = new RegExp(`(\\$\\s*${regexNumber}|${regexNumber}\\s*(?:de\\s*)?pesos)`)
    const matchMontoPesos = regexDeudaPesos.exec(newText);
    if (matchMontoPesos) {
        return matchMontoPesos[0];
    }
    return null;
}

    function trimTextHipotecario(text){
        const regexPorTanto = /por\s*tanto/i;
        const match = regexPorTanto.exec(text);
        if(!match){
            return null
        }
        let newText = text.substring(match.index)
        const endRegexOtrosi = /primer\s*otrosi\s*:/i;
        const endMatch = endRegexOtrosi.exec(newText);
        if(!endMatch){
            return null;
        }
        return newText.substring(0,endMatch.index)
            .replace(/\./g,"")
            .replace(/(\d)\s*(\d)/g,'$1$2')
    }

module.exports = { processMortageDebt };