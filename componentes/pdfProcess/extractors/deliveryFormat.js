const extractors = require('../../economico/extractors');

function processDeliveryFormat(info, logData = false) {
    return extractors.deliveryFormat(info);
}


module.exports = { processDeliveryFormat }