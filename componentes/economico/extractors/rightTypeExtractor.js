
function extractRightType(data, isDebug = false) {
    const normalizedData = data.toLowerCase();
    // Primero revisa si hay una propiedad con derecho de usufructo, nuda propiedad o bien familiar
    // de manera mas simple.
    const derechoMatch = findBasicDerecho(normalizedData)
    if(derechoMatch){
        
        switch(derechoMatch){
            case 'bien_familiar':
                const bienFamiliarStatus = checkBienFamiliar(normalizedData)
                if(bienFamiliarStatus){
                    return 'bien familiar';
                }
                break
            case 'usufructo':
                const usufructoStatus = checkUsufructo(normalizedData)
                if(usufructoStatus){
                    return 'usufructo';
                }
                break
            default:
                return derechoMatch.replace("_",' ');
                break
        }
    }
    const derechoConPorcentaje = findDerechoWithPercentage(normalizedData);
    if (derechoConPorcentaje) {
        return derechoConPorcentaje;
    }
    
    const derechoSimple = findSimpleDerecho(normalizedData);
    if (derechoSimple) {
        return "derecho";
    }
    return null;
}

function findBasicDerecho(text){
    const regex = /(\busufructo\b|nuda\s+propiedad|bien\s*familiar)/i;
    const match = text.match(regex);

    if (!match) return null;

    const tipo = match[0].toLowerCase()
        .replace(/\s+/g, '_')
        .replace('bienfamiliar', 'bien_familiar');

    return tipo;

}

function checkBienFamiliar(text) {
    const normalizedText = text.toLowerCase();

    const exclusionRegexes = [
        /v\.-\s*bien\s*familia.*no\s*registra\s*anotacione?s?/i,
        /no\shay\sconstancia\sde\shaberse\sdeclarado\sbien\sfamiliar/gi,
        /no\s*se\s*encuentran?\s*afectos?\s*a\s(?:la\s*)*declaracion\s*de\s*bien\s*familiar/i,
        /no\s*hay\s*constancia\s*de\s*haberse\s*anotado\s*declaracion\s*de\s*bien\s*familiar/i,
        /a\s*la\s*expedicion\s*del\s*presente\s*certificado\s*no\s*consta\s*marginalmente\s*la\s*declaracion\s*de\s*bien\s*familiar/i,
        /no\s*(?:existe|tiene|consta)\s*anotaci[oó]n.*(?:sobre|de)\s*declaraci[oó]n\s*de\s*bien\s*familiar/i,
        /no\s*registra\s*anotacion.*de\s*bien\s*familiar/i,
        /no\s*existe\s*declaraci[oó]n\s*de\s*bien\s*familiar/i,
        /las\s*partes\s*declaran\s*que\s*a\s*la\s*fecha\s*de\s*esta\s*escritura,\s*no\s*existe\s*ni\s*conocen\s*que\s*actualmente\s*se\s*encuentre\s*entramitacion\s*o\s*en\s*proceso\s*de\s*inscripcion,\s*ningun\s*gravamen\s*o\s*derecho\s*real\s*de\s*usufructo/gi
    ];

    for (const regex of exclusionRegexes) {
        if (regex.test(normalizedText)) {
            return false;
        }
    }

    const inclusionRegexes = [
        /esta\s*declarado\s*bien\s*familiar/gi,
        /declaracion\s*de\s*bien\s*familiar/gi,
        /le\s*afecta\s*bien\s*familiar/gi,
        /bien\s*familiar\s*declarado/gi,
        /bien\s*familiar.*declaracion\s*:\s*definitiva/gi
    ];
    for (const regex of inclusionRegexes) {
        if (regex.test(normalizedText)) {
            return true;
        }
    }
    return false;
}

function checkUsufructo(text){
    const isCancelled = text.toLowerCase().includes('por haberse cancelado el usufructo');
    if(isCancelled){
        return false;
    }else{
        return true;
    }

}

function findDerechoWithPercentage(text) {
    const percentageRegexes = [
        /derechos\s*correspondientes\s*a\s*(\d{1,3}(?:,\d{1,8})?)%/gi,
        /(\d{1,3}(?:,\d{1,8})?)%\s*de\s*los\s*derechos/gi,
        /derechos\s*(?:[a-zñáéíóú,]*\s){1,50}(\d{1,2}(?:,\d{1,8})?)%/gi
    ];
    
    for (const regex of percentageRegexes) {
        const match = text.match(regex);
        if (match) {
            return obtainFinalPercentage(match);
        }
    }
    
    return null;
}

/**
 * Encuentra derechos simples sin porcentaje
 */
function findSimpleDerecho(text) {
    const simpleDerechoRegex = /derechos\s*(:?sobre|en)\s*(:?la|el)?\s*(:?propiedad|departamento|inmueble)/gi;
    return simpleDerechoRegex.test(text);
}

function obtainFinalPercentage(foreclosures) {
    let minPercentage = Infinity;
    let minForeclosure = null;
    const numberRegex = /\d{1,3}(?:,\d{1,8})?/g;
    if (foreclosures.length == 1) {
        return foreclosures[0];
    }

    for (let foreclosure of foreclosures) {
        const foreclosureString = foreclosure[0];
        let percentage = foreclosureString.match(numberRegex);
        if (percentage) {
            const percentageNumber = parseFloat(percentage[0].replace(",", "."));
            if (percentageNumber < minPercentage) {
                minPercentage = percentageNumber;
                minForeclosure = foreclosureString;
            }
        }
    }

    return minForeclosure;
}

module.exports = {extractRightType};