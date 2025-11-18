const {processPropertyId, obtainPropertyId} = require('./propertyId');
const {processPropertyValuation} = require('./propertyValuation');
const {processDistrict} = require('./district');
const {processAddress} = require('./address');
const {processBuyYear} = require('./buyYear');
const {processHousePrice} = require('./housePrice');
const {processMinAmount} = require('./minAmount');
const {processDeliveryFormat} = require('./deliveryFormat');
const {processPercent} = require('./percent');
const {processRightType} = require('./rightType');
const {processMortageDebt} = require('./mortageDebt');
const {processMortageBank} = require('./mortageBank')
const {processPdfType} = require('./pdfType');




module.exports = {
    propertyId : obtainPropertyId,
    propertyValuation : processPropertyValuation,
    district : processDistrict,
    address : processAddress,
    buyYear : processBuyYear,
    housePrice : processHousePrice,
    minAmount : processMinAmount,
    deliveryFormat  : processDeliveryFormat,
    percent : processPercent,
    rightType : processRightType,
    mortageDebt : processMortageDebt,
    mortageBank : processMortageBank,
    documentType : processPdfType,
}