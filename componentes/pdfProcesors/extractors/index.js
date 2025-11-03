const {processPropertyId, obtainPropertyId} = require('./propertyId');
const {processPropertyValuation} = require('./propertyValuation');
const {processDistrict} = require('./district');
const {processAddress} = require('./address');



module.exports = {
    propertyId : obtainPropertyId,
    propertyValuation : processPropertyValuation,
    district : processDistrict,
    address : processAddress,
}