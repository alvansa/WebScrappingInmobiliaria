const extractors = require('./extractors');
const config = require('../../config');
const { extractRightType } = require('../economico/extractors/rightTypeExtractor');

const PROPIEDAD = config.PROPIEDAD;
const ESTACIONAMIENTO = config.ESTACIONAMIENTO;
const BODEGA = config.BODEGA;


class PdfProccess{
    constructor(){
        this.caso = caso;
        this.isDev = isDev;
    }

    static process(text){
        if(!validate(text)){
            return false
        }

        const normText = normalizeText(text);
        const spanishText = normalizeTextSpanish(text);

        this.obtainPropertyIds(normText, spanishText);
        this.obtainPropertyInfo();
        this.obtainAuctionInfo();
        this.processLawsuit();


        return true;
    }

    static obtainPropertyIds(text, spanishText){
        if(!this.caso.rolPropiedad){
            this.caso.rolPropiedad = extractors.propertyId(text, PROPIEDAD);
        }
        if(!this.caso.rolEstacionamiento){
            this.caso.rolEstacionamiento = extractors.propertyId(text, ESTACIONAMIENTO);
        }
        if(!this.caso.rolBodega){
            this.caso.rolBodega = extractors.propertyId(text, BODEGA);
        }
        if(!this.caso.avaluoPropiedad){
            this.caso.avaluoPropiedad = extractors.propertyValuation(text, PROPIEDAD);
        }
        if(!this.caso.avaluoEstacionamineto){
            this.caso.avaluoEstacionamineto = extractors.propertyValuation(text, ESTACIONAMIENTO);
        }
        if(!this.caso.avaluoBodega){
            this.caso.avaluoBodega = extractors.propertyValuation(text, BODEGA);
        }
        if(!this.caso.direccion){
            this.caso.direccion = extractors.address(text,PROPIEDAD);
        }
        if(!this.caso.direccionEstacionamiento){
            this.caso.direccionEstacionamiento = extractors.address(text,ESTACIONAMIENTO);
        }
        if(!this.caso.comuna){
            this.caso.comuna = extractors.district(text,spanishText)
        }

    }

    static obtainPropertyInfo(){

    }

    static obtainAuctionInfo(){

    }

    static processLawsuit(){

    }

}


module.exports = PdfProccess;