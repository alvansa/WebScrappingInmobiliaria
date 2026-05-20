const {normalizeText} = require('../../../utils/textNormalizers');

function processPromissoryNoteDebt(text){
    console.log("Procesando deuda pagaré...")
    // console.log(text)

    if(!isDemandaPagare(text)){
        return null;
    }

    const regexInicioBusqueda = /por\s*tanto/i;
    const indexHipoteca = text.search(regexInicioBusqueda);
    if(indexHipoteca === -1){
        return null;
    }
    const textAfterInicio = text.substring(indexHipoteca).replaceAll('.','');

    console.log("Texto después de 'por tanto': ", textAfterInicio);
    const regexNumber = "(\\d{1,}|\\d{1,3}(\\.\\d{1,3})*),?(\\d{1,})?"
    const regexDeuda = new RegExp(`\\$\\s*${regexNumber}`)
    const matchNumero = textAfterInicio.match(regexDeuda);
    if(matchNumero){
        console.log(matchNumero[1]);
        return Number(matchNumero[1]);
    }
    return null;
}

function isDemandaPagare(text){
    const regexForPagare = [
        'materia\\s*:\\s*cobro\\s*de\\s*pagar[e|é]'
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
    processPromissoryNoteDebt
}