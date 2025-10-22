const {extractCausa, extractCausaVoluntaria} = require('./causaExtractor');
const {extractPercent} = require('./percentExtractor');
const {extractDeliveryFormat} = require('./deliveryFormatExtractor');
const {extractAuctionDate} = require('./auctionDateExtractor');
const {extractMinAmount} = require('./minAmountExtractor');
const {extractDistrict} = require('./districtExtract');
const {extractParties} = require('./partiesExtractor');
const {extractRightType} = require('./rightTypeExtractor');
const {extractDirection} = require('./directionExtractor');
const {extractDeliveryDay} = require('./deliveryDayExtractor');
const {extractYear} = require('./yearExtractor');
const {extractPropertyId} = require('./propertyIdExtractor');
const {extractCourt, extractPartitionJudge} = require('./courtExtractor');
const {extractBankMortage} = require('./mortageBankExtractor');


module.exports = {
    causa : extractCausa,
    causaVoluntaria : extractCausaVoluntaria,
    percent : extractPercent,
    deliveryFormat : extractDeliveryFormat,
    auctionDate : extractAuctionDate,
    minAmount : extractMinAmount,
    district : extractDistrict,
    parties : extractParties,
    rightType : extractRightType,
    direction : extractDirection,
    deliveryDay : extractDeliveryDay,
    year : extractYear,
    propertyId : extractPropertyId,
    court : extractCourt,
    partitionJudge : extractPartitionJudge,
    mortageBank : extractBankMortage,
}