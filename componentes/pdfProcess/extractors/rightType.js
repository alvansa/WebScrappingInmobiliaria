const extractors = require('../../economico/extractors');

const regexMutuoHipotecario = /mutuo\s*hipotecario/i;

function processRightType(text, debug = false){
    if(regexMutuoHipotecario.exec(text)){
        return;
    }
    return extractors.rightType(text);
}

module.exports = { processRightType };
