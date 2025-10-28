const convertWordToNumbers = require('../../../utils/convertWordToNumbers');

let isDev = false;

const NUMBER_CONFIG = {
    keywords: new Set(['numero', 'número', 'num', 'nro']),
    specialWords: new Set(['y']),
    patterns: new Set([
        'cero','uno','dos','tres','cuatro','cinco','seis','siete','ocho','nueve',
        'diez','once','doce','trece','catorce','quince','veinte','veinti',
        'treinta','cuarenta','cincuenta','sesenta','setenta','ochenta',
        'noventa','cien','cientos','quinientos','mil','miles'
    ])
};

function extractDirection(data) {
    const dataNormalizada = data
        .replace(/(\d+)\.(\d+)/g, '$1$2') // Elimina puntos en números (ej. 1.000 -> 1000)
        // .replace(/registro\s*(?:de\s*)?propiedad\s*/i," ")    
        .toLowerCase();

    const palabrasClave = ['propiedad', 'inmueble', 'departamento', 'casa', 'parcela'];
    const regexComuna = /comuna(?:\s*de)?\s*\w{1,}/i;
    const regexEndByRegion = /regi[oó]n\s*de\s*\w{1,}/i;
    const regexConservador = /del\s*conservador\s*de\s*bienes\s*ra[ií]ces/i
    const regexPunto = /\./i;
    const direcciones = [];
    let direccionFinal;

    const regexFinales = [
        regexEndByRegion,
        regexComuna,
        regexConservador,
        regexPunto
    ]

    for (let palabra of palabrasClave) {
        const regex = new RegExp(`(?<!registro de )${palabra}`, 'g');
        const match = regex.exec(dataNormalizada);

        if (!match) {
            continue;
        }

        const index = match.index;
        const matchedLength = match[0].length
        if (isPrecededByExclusion(dataNormalizada, index, matchedLength)) {
           continue;
        }

        const direccionTemporal = dataNormalizada.substring(index);
        for(let regex of regexFinales){
            direccionFinal = obtainFinalDirection(direccionTemporal, regex)
            if(direccionFinal){
                return direccionFinal
            }
        }


        // direccionFinal = obtainFinalDirection(direccionTemporal, regexEndByRegion);

        // const indexComuna = obtainIndexByRegex(direccionTemporal, comuna)
        // if(indexComuna){
        //    direccionFinal = direccionTemporal.substring(0,indexComuna); 
        //    return adaptDirectionToExcel(direccionFinal);
        // }

        // const indexConservador = obtainIndexByRegex(direccionTemporal,regexConservador);
        // if(indexConservador){
        //    direccionFinal = direccionTemporal.substring(0,indexConservador); 
        //    return adaptDirectionToExcel(direccionFinal);
        // }

        // const indexPunto = obtainIndexByRegex(direccionTemporal, regexPunto);
        // if(indexPunto){
        //    direccionFinal = direccionTemporal.substring(0,indexPunto); 
        //    return adaptDirectionToExcel(direccionFinal);
        // }
    }

    if (direcciones.length > 0) {
        return direcciones.at(-1);
    }

    return null;
}

//Funcion que dado un index del texto revisara que sea valida y si es asi devuelve la direccion a escribir, 
//En caso de que no lo sea devuelve false;
function obtainFinalDirection(text, regex){
    let direccionFinal;
    const index = obtainIndexByRegex(text, regex)
    if (!index) {
        return false
    }
    direccionFinal = text.substring(0, index);
    if(direccionFinal.length < 60){
        return false;
    }
    return adaptDirectionToExcel(direccionFinal);
}

function obtainIndexByRegex(text,regex){
    const matchedRegex = text.match(regex);
    if(matchedRegex){
        return (matchedRegex.index + matchedRegex[0].length);
    }else{
        return null;
    }
}
// Funcion para asegurarse que el texto sea valido para buscar direccion
// Devuelve true si encuentra exclusion y el texto no es valido
function isPrecededByExclusion(texto, currentIndex, indexLength) {
    const preExclusiones = ['registro de ', 'conservador de ', 'oficina de', 'cbr de','registro '];
    const postExclusiones = [' será subastado', ' sera subastado', ' a subastarse'];
    const textLength = texto.length;
    for (const exclusion of preExclusiones) {
        const exclusionLength = exclusion.length;
        
        // Verificar si hay suficiente texto antes para contener la exclusión
        if (currentIndex >= exclusionLength) {
            const textoPrevio = texto.substring(currentIndex - exclusionLength, currentIndex);
            if (textoPrevio === exclusion) {
                return true; 
            }
        }
    }
    for (const exclusion of postExclusiones) {
        const exclusionLength = exclusion.length;
        
        // Verificar si hay suficiente texto antes para contener la exclusión
        if ((textLength - currentIndex) >= exclusionLength) {
            const textoPost = texto.substring(currentIndex + indexLength , currentIndex + indexLength + exclusionLength );
            if (textoPost === exclusion) {
                return true; 
            }
        }
    }  
    return false;
}

function adaptDirectionToExcel(direction){
    let finalDirection = direction;
    const regexEstacionamiento = /derecho\s+de\s+(?:uso\s*(?:,\s*|\s+y\s+)?goc[eé]|goc[eé])(?:\s*(?:,|\s+y\s+|\s*)\s*(?:exclusivo|perpetuo|gratuito|cubierto|accesorio))*(?:\s*(?:,|\s+y\s+))?\s+(?:del?\s+)?estacionamiento\s*/i;
    const matchedEstacionamiento = direction.match(regexEstacionamiento);
    if(matchedEstacionamiento){
        finalDirection = direction.replace(matchedEstacionamiento[0],"Est ");
    }
    finalDirection = finalDirection.replace(/estacionamiento\b/i,"Est");
    finalDirection = changeWordsToNumbers(finalDirection);

    return finalDirection
}

function changeWordsToNumbers(phrase,isDevLog = false) {
    isDev = isDevLog;
    if (!phrase) return phrase;

    const spacedPhrase = phrase.split(' ');
    for (let i = 0; i < spacedPhrase.length; i++) {
        if (!isNumberKeyWord(spacedPhrase[i])) {
            continue;
        }
        for (let j = i + 1; j < spacedPhrase.length; j++) {
            const isLiteralNumber = isaNumber(spacedPhrase[j]);
            if(isLiteralNumber){
                break;
            }
            //Si encuentra numero empieza a buscar hasta enonctrar una palabra que no sea numero para delimitar el numero
            let isNumber = isWordANumber(spacedPhrase[j]);
            if (spacedPhrase[j].includes(',')) {
                isNumber = false;
                j++;
            }
            if ((isNumber || j - i <= 1) && j < (spacedPhrase.length - 1)) {
                continue;
            }
            //En caso de que la direccion termine con el numero se toma desde el numero hasta el fin de la frase.
            if(j >= (spacedPhrase.length - 1)){
                j++;
            }
            if(spacedPhrase[(j-1)].toLowerCase() == 'y'){
                j--;
            }
            //Una vez encontrado el fin del numero procesa la frase y cambia las palabras por numeros
            phrase = processAndChangeNumberPhrase(phrase, spacedPhrase, i, j);
            break;
        }
    }
    return phrase;
}

function normalize(word){
    return word
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
}

function isNumberKeyWord(word){
    return NUMBER_CONFIG.keywords.has(normalize(word));
}
function processAndChangeNumberPhrase(phrase, spacedPhrase, i, j){
    const numberArray = spacedPhrase.slice(i + 1, j);
    const phraseToChange = numberArray.join(' ');
    const regexPhrase = new RegExp(`n[uú]mero\\s*${phraseToChange}`, "i");
    const phraseInNumber = convertWordToNumbers(phraseToChange);
    phrase = phrase.replace(regexPhrase, `n° ${phraseInNumber}`);
    if(isDev) console.log("Frase a cambiar: ", phrase,"|", i + 1, j)
    return phrase;
}

function isaNumber(word){
    
    if(word.endsWith(',')){
        word = word.slice(0,-1);
    }
    return !isNaN(word);
}

function isWordANumber(word){
    const normalized = normalize(word);

    if(NUMBER_CONFIG.specialWords.has(normalized)) return true;

    for(const pattern of NUMBER_CONFIG.patterns){
        if(normalized.includes(pattern)) return true;
    }

    return false;
}
module.exports = {extractDirection,changeWordsToNumbers}