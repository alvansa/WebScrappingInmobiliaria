const extractors = require('./extractors');
const config = require('../../config');
const {normalizeText, normalizeTextSpanish} = require('../../utils/textNormalizers');
const { extractRightType } = require('../economico/extractors/rightTypeExtractor');

const PROPIEDAD = config.PROPIEDAD;
const ESTACIONAMIENTO = config.ESTACIONAMIENTO;
const BODEGA = config.BODEGA;


class PdfProccess{

    static process(caso,text, debug = false){
        if(!this.validate(text)){
            return false
        }
        if(debug){
            console.log("Texto a procesar: \n", text);
        }

        const normText = normalizeText(text);
        const spanishText = normalizeTextSpanish(text);

        this.obtainPropertyIds(caso,normText, spanishText);
        this.obtainPropertyInfo(caso,normText);
        this.obtainAuctionInfo(caso,normText);
        this.processLawsuit(caso,normText);


        return true;
    }

    static obtainPropertyIds(caso,text, spanishText){
        if(!caso.rolPropiedad){
            console.log("Obteniendo rol propiedad");

            caso.rolPropiedad = extractors.propertyId(text, PROPIEDAD);
        }
        if(!caso.rolEstacionamiento){
            caso.rolEstacionamiento = extractors.propertyId(text, ESTACIONAMIENTO);
        }
        if(!caso.rolBodega){
            caso.rolBodega = extractors.propertyId(text, BODEGA);
        }
        if(!caso.avaluoPropiedad){
            caso.avaluoPropiedad = extractors.propertyValuation(text, PROPIEDAD);
        }
        if(!caso.avaluoEstacionamineto){
            caso.avaluoEstacionamineto = extractors.propertyValuation(text, ESTACIONAMIENTO);
        }
        if(!caso.avaluoBodega){
            caso.avaluoBodega = extractors.propertyValuation(text, BODEGA);
        }
        if(!caso.direccion){
            caso.direccion = extractors.address(text,PROPIEDAD);
        }
        if(!caso.direccionEstacionamiento){
            caso.direccionEstacionamiento = extractors.address(text,ESTACIONAMIENTO);
        }
        if(!caso.comuna){
            caso.comuna = extractors.district(text,spanishText)
        }

    }

    static validate(text){
        if(!text || text.length < 100){
            return false;
        }
        const docNotValid = [
            /tabla\s*de\s*contenidos/i,
            /solicitud\s*copias\s*y\s*certificados/i,
            /clasificado/i,
            /tasador/i,
            /d\.?g\.?a\.?/i
        ];

        if(text.toLowerCase().includes('bases generales de remate')){
            return true;
        }
        for (const doc of docNotValid) {
            if (doc.test(text)) {
                return false;
            }
        }
        if(this.checkIfDiario(text)){
            return false;
        }

        return true;

    }

    static checkIfDiario(info){
        const regexRemate = /remate/gi;
        const countRemate = info.match(regexRemate);
        if(!countRemate){
            return false;
        }
        if(countRemate.length > 6){
            return true;
        }
        return false;

    }

    static obtainPropertyInfo(caso, text){
        if(!caso.anno){
            caso.anno = extractors.buyYear(text)
        }

        if(!caso.montoCompra){
           caso.montoCompra = extractors.housePrice(text); 
        }

    }

    static obtainAuctionInfo(){
        // if(!caso.montoMinimo){
        //     caso.montoMinimo = extractors.minAmount(text);
        // }
        // if(!caso.formatoEntrega){
        //     caso.formatoEntrega = extractors.deliveryFormat(text)
        // }
        // if(!caso.porcentaje){
        //     caso.porcentaje = extractors.percetange(text);
        // }
        // if(!caso.mortageBank){
        //     caso.mortageBank = extractors.mortageBank(text);
        // }

    }

    static processLawsuit(){
        // if(!caso.deudaHipotecaria){
        //     caso.deudaHipotecaria = extractors.mortageDebt(text);
        // }
    }
}


module.exports = PdfProccess;