const extractors = require('#sources/economico/extractors/index.js');

function processDeliveryFormat(info) {
    return extractors.deliveryFormat(info);
}


module.exports = { processDeliveryFormat }