const config = require('../../../config');

const {obtainType} = require('./utilsPdf');

const PROPIEDAD = config.PROPIEDAD;
const ESTACIONAMIENTO = config.ESTACIONAMIENTO;

function processAddress(text, type) {
    const direccion = obtainDireccion(text);
    console.log(direccion)
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
    let avaluoType = obtainType(info) ? obtainType(info) : '';
    let startText = "direccion o nombre del bien raiz:";
    let startIndex = info.indexOf(startText);
    if (startIndex === -1) {
        startText = "direccion:";
        startIndex = info.indexOf(startText);
    }
    const endText = "destino del bien raiz:";
    const endIndex = info.indexOf(endText);
    if (startIndex === -1 || endIndex === -1) {
        return null;
    }
    startIndex += startText.length;
    const direccion = info.substring(startIndex, endIndex).trim();
    return {
        "direccion": direccion,
        "type": avaluoType
    }
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