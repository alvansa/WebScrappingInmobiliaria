

function extractCausa(data) {
    //Anadir C- con 3 a 5 digitos, guion, 4 digitos
    const regex = /\bC\s*[-]*\s*\d{1,7}(?:\.\d{3})*\s*[-/]\s*\d{1,4}(?:\.\d{3})*/i;

    const causa = data.match(regex);
    if (causa) {
        return causa[0];
    }
    // causa con "Rol" y sin "C"
    const causaRegexSinC = /Rol\s*[-]*\s*\d{1,7}(?:\.\d{3})*\s*[-/]\s*\d{1,4}(?:\.\d{3})*/i;
    const causaSinC = data.match(causaRegexSinC);
    if (causaSinC) {
        return causaSinC[0];
    }
    // causa con "rol"
    const regexCausaRolN = /rol\s*n?\.?(?:ºº||°)?\s*\d{1,7}(?:\.\d{3})*\s*[-/]\s*\d{1,4}(?:\.\d{3})*/i;
    const causaRolN = data.match(regexCausaRolN);
    if (causaRolN) {
        return causaRolN[0];
    }

    //causa sin rol ni C pero que dice causa
    const regexConCausa = /\bcausa\s*\d{1,7}(?:\.\d{3})*\s*[-/]\s*\d{1,4}(?:\.\d{3})*/i;

    const causaConCausa = data.match(regexConCausa);
    if (causaConCausa) {
        return causaConCausa[0];
    }

    return null;
}

function extractCausaVoluntaria(data) {
    const regex = /V\s*[-]*\s*\d{1,7}(?:\.\d{3})*\s*-\s*\d{1,4}(?:\.\d{3})*/i;
    const causa = data.match(regex);
    if(causa){
        return causa[0];
    }
}

module.exports = {extractCausa, extractCausaVoluntaria};