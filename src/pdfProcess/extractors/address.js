const config = require('#config');

const {obtainType} = require('./utilsPdf');

const PROPIEDAD = config.PROPIEDAD;
const ESTACIONAMIENTO = config.ESTACIONAMIENTO;

const DIRECCION_ESPECIFICA_REGEX = /direccion\s+o\s+nombre\s+del\s+bien\s+raiz\s*:\s*([\s\S]*?)\s*destino\s+del\s+bien\s+raiz\s*:/;
const DIRECCION_GENERICA_REGEX = /direccion\s*:\s*([\s\S]*?)\s*destino\s+del\s+bien\s+raiz\s*:/;

function processAddress(text, type) {
    const direccion = obtainDireccion(text);
    // console.log(direccion)
    if(!direccion) return null;

    if (type == PROPIEDAD) {
        if(!direccion.type.includes('estacionamiento') && !direccion.type.includes('bodega')){
            return direccion.direccion;
        }
    }
    if (type == ESTACIONAMIENTO) {
        if(direccion.type.includes('estacionamiento')){
            return direccion.direccion;
        }
    }

    return null;
}

function obtainDireccion(info) {
    if (info.includes('bases generales de remate')) {
        return obtainDireccionActaRemate(info);
    }

    const avaluoType = obtainType(info) ?? '';

    const match = info.match(DIRECCION_ESPECIFICA_REGEX) || info.match(DIRECCION_GENERICA_REGEX);
    if (!match) {
        return null;
    }

    const direccion = match[1].trim();
    return {
        direccion,
        type: avaluoType
    };
}
function obtainDireccionActaRemate(info) {
    let startText = "ubicados en:";
    let startIndex = info.indexOf(startText);
    if (startIndex === -1) {
        startText = "ubicado en:";
        startIndex = info.indexOf(startText);
        if (startIndex === -1) {
            return null;
        }
    }
    const endText = "comuna";
    const endIndex = info.indexOf(endText);
    if (endIndex === -1) {
        return null;
    }
    const direccion = info.substring(startIndex + startText.length, endIndex).trim();
    return {
        "direccion": direccion,
        "type": "Remate"
    };
}

module.exports = { processAddress };