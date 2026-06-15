const extractor = require('#sources/economico/extractors/index.js');
function processMinAmount(text){    
    return extractor.minAmount(text);
}

module.exports = { processMinAmount }