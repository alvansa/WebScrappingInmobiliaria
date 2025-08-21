
// Buscar el formato de entrega, ya sea vale vista o cupon
function extractDeliveryFormat(data) {
    const regex = /(vale\s+)(vista)|(cupón)|(vale a la vista)/i
    const formatoEntrega = data.match(regex);
    if(formatoEntrega){
        return formatoEntrega[0];
    }
}

module.exports = {extractDeliveryFormat}