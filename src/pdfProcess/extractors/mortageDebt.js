const {isDemandaPagare} = require('./promissoryNoteDebt');

function processMortageDebt(text) {

    if (!isHipotecario(text)) {
        return null;
    }

    return obtainMortageDebt(text);
}

function isHipotecario(text) {

    const posibleRegexHipotecario = [
        'mutuo\\s*hipotecario',
        'obligaci[oó]n\\s*de\\s*dar',
        'mutuo',
    ]

    if(isDemandaPagare(text)){
        return false;
    }
    for(let posibleRegex of posibleRegexHipotecario){
        const regex = new RegExp(posibleRegex, 'i');
        if(regex.test(text)){
            return true;
        }
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
    // const regexMeses = /\d{2,}\s*(meses|cuotas\s*mensual)/;
    // const matchRegexMeses = text.match(regexMeses);
    // if (matchRegexMeses) {
    //     const numMeses = parseInt(matchRegexMeses[0].match(/\d{1,}/)[0]);
    //     if (numMeses > 60) {
    //         return true;
    //     }
    // }
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
        deuda = checkBiggerDebt(matchNumero)
        if (deuda.includes("ue")) {
            deuda = deuda.replace("ue", "uf");
        }
        const regexComa = new RegExp(',\\d{1,}')
        deuda = deuda.replace(/unidades?\s*de\s*fomento/i,'uf')
        if(regexComa.test(deuda)){
            deuda = deuda.replace(regexComa,'');
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
    function checkBiggerDebt(debts){
        if(debts.size == 1){
            return debts[0];
        }
        let biggerDebt = 0;
        let indexBiggerDebt = 0;
        const regexNumber = /(\d{1,}|\d{1,3}(\.\d{1,3})*),?(\d{1,})?/;
        debts.forEach((debt, index) => {
            let stringActualDebt = debt.match(regexNumber)[0].replace(/,/g, ".")
            const actualDebt = Number(stringActualDebt);
            if (actualDebt > biggerDebt) {
                biggerDebt = actualDebt;
                indexBiggerDebt = index;
            } 
        });
        return debts[indexBiggerDebt];
    }

module.exports = { processMortageDebt };