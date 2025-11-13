const extractors = require('./extractors');
const config = require('../../config');
const {normalizeText, normalizeTextSpanish} = require('../../utils/textNormalizers');
const { extractRightType } = require('../economico/extractors/rightTypeExtractor');
const logger = require('../../utils/logger');

const PROPIEDAD = config.PROPIEDAD;
const ESTACIONAMIENTO = config.ESTACIONAMIENTO;
const BODEGA = config.BODEGA;


class PdfProccess{

    static process(caso,text, debug = false, mainWindow){
        // if(debug){
        //     console.log("Texto a procesar: \n", text);
        // }
        if(!this.validate(text,mainWindow)){
            return false
        }

        const normText = normalizeText(text);
        const spanishText = normalizeTextSpanish(text);

        this.obtainPropertyIds(caso,normText, spanishText);
        this.obtainPropertyInfo(caso,normText);
        this.obtainAuctionInfo(caso,normText);
        this.processLawsuit(caso,normText);

        // console.log(`Probando si existe la ventana principal en PDF PROCESS: ${mainWindow ? 'Sí' : 'No'}`);

        // console.log("El pdf es un: ", extractors.documentType(normText,true));
        // alert("El pdf es un: "+ extractors.documentType(normText,true));
        // mainWindow.webContents.send('show-alert',`El pdf es un: ${extractors.documentType(normText,true)}`)


        return true;
    }

    static obtainPropertyIds(caso,text, spanishText){
        const updates = {};
        const docType = extractors.documentType(text);
        if(!caso.rolPropiedad){
            // console.log("Obteniendo rol propiedad");

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
        if(!caso.avaluoEstacionamiento){
            caso.avaluoEstacionamiento = extractors.propertyValuation(text, ESTACIONAMIENTO);
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
        if(!caso.comuna || docType == 'AF'){
            const comuna = extractors.district(spanishText, text);
            logger.info(`Comuna obtenida ${comuna}`);
            caso.comuna = comuna;
        }

    }

    static validate(text,mainWindow){
        if(!text || text.length < 100){
            mainWindow.webContents.send('show-alert','El documento es inválido: Texto insuficiente o vacío');
            return false;
        }
        const docNotValid = [
            /tabla\s*de\s*contenidos/i,
            /solicitud\s*copias\s*y\s*certificados/i,
            /clasificado/i,
            // /tasador/i,
            /(?:d\.g\.a|d\.ga|dg\.a)/i,
        ];

        if(text.toLowerCase().includes('bases generales de remate')){
            mainWindow.webContents.send('show-alert','El documento es inválido: Bases Generales de Remate');
            return true;
        }
        for (const doc of docNotValid) {
            if (doc.test(text)) {
                mainWindow.webContents.send('show-alert',`El documento es inválido: ${doc}`);
                return false;
            }
        }
        if(this.checkIfDiario(text)){
            mainWindow.webContents.send('show-alert','El documento es inválido: Diario Oficial');
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

    static obtainAuctionInfo(caso, text){
        if(!caso.montoMinimo){
            caso.montoMinimo = extractors.minAmount(text);
        }
        if(!caso.formatoEntrega){
            caso.formatoEntrega = extractors.deliveryFormat(text)
        }
        if(!caso.porcentaje){
            caso.porcentaje = extractors.percent(text);
        }
        if(!caso.mortageBank){
            caso.mortageBank = extractors.mortageBank(text);
        }
        if(!caso.tipoDerecho){
            caso.tipoDerecho = extractors.rightType(text);
        }

    }

    static processLawsuit(caso, text){
        if(!caso.deudaHipotecaria){
            caso.deudaHipotecaria = extractors.mortageDebt(text);
        }
    }
}


module.exports = PdfProccess;