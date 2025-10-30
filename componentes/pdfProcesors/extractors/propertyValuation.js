const config = require('../../../config');
const {obtainType} = require('./utilsPdf');

const PROPIEDAD = config.PROPIEDAD;
const ESTACIONAMIENTO = config.ESTACIONAMIENTO;
const BODEGA = config.BODEGA;
const TODOS = config.TODOS;

function processPropertyValuation(text, type){
    const roles = obtainPropertyValuation(text)

    if(!roles) return null;

    switch(type){
        case PROPIEDAD:
            if(roles.type.includes('habitacional')){
                return roles.avaluo;
            }
            break;
        case ESTACIONAMIENTO:
            if(roles.type.includes('estacionamiento')){
                return roles.avaluo;
            }
            break;
        case BODEGA:
            if(roles.type.includes('bodega')){
                return roles.avaluo;
            }
            break;
        default:
            return null;
    }

    return null
}

function obtainPropertyValuation(info) {
    let avaluoType = obtainType(info) ? obtainType(info) : '';
    const regexAvaluo = /avaluo\stotal\s*:\$(\d{1,3}.?)*/g;
    const avaluoMatch = info.match(regexAvaluo);
    if (avaluoMatch) {
        const avaluo = avaluoMatch[0].match(/(\d{1,3}.?)+/);
        const avaluoNumber = avaluo[0].replace(/\./g, '');
        return {
            "type": avaluoType,
            "avaluo": avaluoNumber.trim()
        };
    } else {
        return null;
    }
}

module.exports = {processPropertyValuation}