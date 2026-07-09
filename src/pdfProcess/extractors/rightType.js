const extractors = require('#sources/economico/extractors/index.js');

const regexMutuoHipotecario = /mutuo\s*hipotecario/i;

function processRightType(text){
    if(regexMutuoHipotecario.exec(text)){
        return;
    }
    return extractors.rightType(text);
}

module.exports = { processRightType };
