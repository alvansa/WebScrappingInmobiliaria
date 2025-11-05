const {processPropertyId, obtainPropertyId} = require('./propertyId');
const {processPropertyValuation} = require('./propertyValuation');
const {processDistrict} = require('./district');
const {processAddress} = require('./address');
const {processBuyYear} = require('./buyYear');
const { processHousePrice } = require('./housePrice');



module.exports = {
    propertyId : obtainPropertyId,
    propertyValuation : processPropertyValuation,
    district : processDistrict,
    address : processAddress,
    buyYear : processBuyYear,
    housePrice : processHousePrice,

}