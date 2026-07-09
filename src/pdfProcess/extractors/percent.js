const extractors = require('#sources/economico/extractors/index.js');
const {isLawsuit} = require('./utilsPdf');

function processPercent(text) {
    if(isLawsuit(text)) {
        return null;
    }

    return extractors.percent(text);
}

module.exports = { processPercent }