const {normalizeText} = require('../../../utils/textNormalizers');

function processPromissoryNoteDebt(text){
    if(!isDemandaPagare(text)){
        return null;
    }

    const regexInicioBusqueda = /por\s*tanto/i;
    const indexHipoteca = text.search(regexInicioBusqueda);
    if(indexHipoteca === -1){
        return null;
    }
    const textAfterInicio = text.substring(indexHipoteca).replaceAll('.','');

    const regexNumber = "(\\d{1,}|\\d{1,3}(\\.\\d{1,3})*),?(\\d{1,})?"

    const regexUF = "(u\\.?[fe]\\.?|unidades?\\s*de\\s*fomento)"
    const regexDeudaUF = new RegExp(`(${regexNumber}\\s*(-\\s*)?${regexUF}|${regexUF}\\s*${regexNumber})`, "gi")
    const matchDeudaUF = textAfterInicio.match(regexDeudaUF)
    if(matchDeudaUF){
        const regexComa = new RegExp(',\\d{1,}')
        let deuda = matchDeudaUF[0].replace(/unidades?\s*de\s*fomento/i,'uf')
        if(regexComa.test(deuda)){
            deuda = deuda.replace(regexComa,'');
        }
        return deuda
    }

    const regexDeuda = new RegExp(`\\$\\s*${regexNumber}`)

    const matchNumero = textAfterInicio.match(regexDeuda);
    if(matchNumero){
        return Number(matchNumero[1]);
    }
    return null;
}

function isDemandaPagare(text){
    const regexForPagare = [
        'materia\\s*:\\s*cobro\\s*(de)?\\s*pagar[e|é]',
        'pagar[eé]\\s*n[uú]mero\\s*'
    ]

    for(let posibleRegex of regexForPagare){
        const regex = new RegExp(posibleRegex, 'i');
        if(regex.test(text)){
            return true;
        }
    }

    return false;
}




module.exports = {
    processPromissoryNoteDebt,
    isDemandaPagare
}