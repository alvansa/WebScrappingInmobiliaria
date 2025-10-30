const {processPropertyId, obtainPropertyId} = require('./propertyId');
const {processPropertyValuation} = require('./propertyValuation');



module.exports = {
    propertyId : obtainPropertyId,
    propertyValuation : processPropertyValuation,
}