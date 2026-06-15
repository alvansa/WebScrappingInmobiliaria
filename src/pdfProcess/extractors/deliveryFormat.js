const extractors = require('#sources/economico/extractors/index.js');

function processDeliveryFormat(info, logData = false) {
    return extractors.deliveryFormat(info);
}


module.exports = { processDeliveryFormat }