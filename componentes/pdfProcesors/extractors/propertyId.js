const config = require('../../../config');
const {obtainType} = require('./utilsPdf');

const PROPIEDAD = config.PROPIEDAD;
const ESTACIONAMIENTO = config.ESTACIONAMIENTO;
const BODEGA = config.BODEGA;
const TODOS = config.TODOS;

function obtainPropertyId(info, type){

    const roles = processPropertyId(info)

    if(!roles) return null;

    switch(type){
        case PROPIEDAD:
            if(roles.type.includes('habitacional')){
                return roles.rol;
            }
            break;
        case ESTACIONAMIENTO:
            if(roles.type.includes('estacionamiento')){
                return roles.rol;
            }
            break;
        case BODEGA:
            if(roles.type.includes('bodega')){
                return roles.rol;
            }
            break;
        default:
            return null;

    }
    return null;
}

//Obtiene el rol del bien raiz del documento de avaluo fiscal
function processPropertyId(info, tipo = TODOS) {
    if (!info) return null;
    if (info.includes('bases generales de remate')) {
        return obtainRolOfActaRemate(info, tipo);
    }
    if (info.includes("inscripcion")) {
        return null;
    }
    let avaluoType = obtainType(info) ? obtainType(info) : '';
    const regexAvaluo = /rol\sde\savaluo\s*(?:numero|:)\s*(\d{1,5}\s*-\s*\d{1,7})/i;
    const match = info.match(regexAvaluo);
    if (match) {
        return {
            "type": avaluoType,
            "rol": match[1],
        };
    }
    return null;
}

function obtainRolOfActaRemate(info, tipo) {
    //Obtener de acta de remate
    let searchRol;
    if (tipo === PROPIEDAD) {
        searchRol = 'departamento';
    } else if (tipo === ESTACIONAMIENTO) {
        searchRol = 'estacionamiento';
    } else if (tipo === BODEGA) {
        searchRol = 'bodega';
    } else {
        searchRol = '';
    }
    const rolAvaluo = `rol\\s*de\\s*avaluo\\s*${searchRol}\\s*:\\s*(\\d{1,}-\\d{1,})`;
    const regexAvaluo = new RegExp(rolAvaluo, 'i')
    const matchAvaluoDepartamento = info.match(regexAvaluo);

    if (matchAvaluoDepartamento) {
        return {
            'type': `${searchRol}`,
            'rol': matchAvaluoDepartamento[1],
        }
    } else {

        const rolAvaluoFinal = `rol\\s*de\\s*avaluo\\s*:\\s*(\\d{1,}-\\d{1,})`;
        const regexAvaluoFinal = new RegExp(rolAvaluoFinal, 'i')
        const matchAvaluo = info.match(regexAvaluoFinal);

        if (matchAvaluo) {
            return {
                'type': `Avaluo`,
                'rol': matchAvaluo[1],
            }
        }
    }
}




module.exports = { processPropertyId, obtainPropertyId };