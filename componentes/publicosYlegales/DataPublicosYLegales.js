const {procesarDatosRemate} = require('../economico/datosRemateEmol.js');

class DataPublicosYLegales{
    constructor(caso){
        this.caso = caso;
    }

    proccessAuction(){
        procesarDatosRemate(this.caso);
    }
}


module.exports = DataPublicosYLegales;