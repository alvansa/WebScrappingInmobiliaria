const extractor = require('../../economico/extractors');
function processMinAmount(text){    
    return extractor.minAmount(text);
}

module.exports = { processMinAmount }