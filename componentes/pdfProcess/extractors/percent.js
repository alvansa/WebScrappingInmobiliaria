const extractors = require('../../economico/extractors');
const {isLawsuit, consoleDebug} = require('./utilsPdf');

function processPercent(text, debug = false) {
    if(isLawsuit(text)) {
        return null;
    }

    return extractors.percent(text);
}

module.exports = { processPercent }