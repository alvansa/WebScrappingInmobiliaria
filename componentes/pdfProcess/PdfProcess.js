const extractors = require('./extractors');
const config = require('../../config');
const {normalizeText, normalizeTextSpanish} = require('../../utils/textNormalizers');
const { extractRightType } = require('../economico/extractors/rightTypeExtractor');
const logger = require('../../utils/logger');
const { Logform } = require('winston');

const PROPIEDAD = config.PROPIEDAD;
const ESTACIONAMIENTO = config.ESTACIONAMIENTO;
const BODEGA = config.BODEGA;


class PdfProccess{

    static process(caso,text, debug = false, mainWindow){
        // if(debug){
        //     console.log("Texto a procesar: \n", text);
        // }
        if(!this.validate(text,mainWindow,debug)){
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
        const docType = extractors.documentType(text);
        if(!caso.rolPropiedad){
            const rolPropiedad = extractors.propertyId(text, PROPIEDAD);
            this.logNewInfo('Rol propiedad',rolPropiedad)
            caso.rolPropiedad =   rolPropiedad      
        }
        if(!caso.rolEstacionamiento){
            caso.rolEstacionamiento = extractors.propertyId(text, ESTACIONAMIENTO);
        }
        if(!caso.rolBodega){
            caso.rolBodega = extractors.propertyId(text, BODEGA);
        }
        if(!caso.avaluoPropiedad){
            const avaluoPropiedad = extractors.propertyValuation(text, PROPIEDAD);
            this.logNewInfo('Avaluo Propiedad', avaluoPropiedad);
            caso.avaluoPropiedad = avaluoPropiedad;
        }
        if(!caso.avaluoEstacionamiento){
            caso.avaluoEstacionamiento = extractors.propertyValuation(text, ESTACIONAMIENTO);
        }
        if(!caso.avaluoBodega){
            caso.avaluoBodega = extractors.propertyValuation(text, BODEGA);
        }
        if(!caso.direccion){
            const direccion = extractors.address(text,PROPIEDAD);
            this.logNewInfo('Direccion', direccion);
            caso.direccion = direccion;
        }
        if(!caso.direccionEstacionamiento){
            caso.direccionEstacionamiento = extractors.address(text,ESTACIONAMIENTO);
        }
        if(!caso.comuna || docType == 'AF'){
            const comuna = extractors.district(spanishText, text);
            this.logNewInfo('Comuna', comuna);
            caso.comuna = comuna;
        }

    }

    static validate(text,mainWindow, debug){
        if(!text || text.length < 100){
            if(!debug) mainWindow.webContents.send('show-alert','El documento es inválido: Texto insuficiente o vacío');
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
            if(!debug) mainWindow.webContents.send('show-alert','El documento es inválido: Bases Generales de Remate');
            return true;
        }
        for (const doc of docNotValid) {
            if (doc.test(text)) {
             if(!debug)   mainWindow.webContents.send('show-alert',`El documento es inválido: ${doc}`);
                return false;
            }
        }
        if(this.checkIfDiario(text)){
            if(!debug) mainWindow.webContents.send('show-alert','El documento es inválido: Diario Oficial');
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
            const anno = extractors.buyYear(text);
            this.logNewInfo('Anno compra', anno);
            caso.anno = anno;
        }

        // if(!caso.montoCompra){
        const montoCompra = extractors.housePrice(text);
        if(montoCompra && caso.montoCompra){
            this.logNewInfo('Monto compra propiedad', montoCompra.monto);
            if(montoCompra.monto > caso.montoCompra.monto){
                caso.montoCompra = montoCompra;
            }
        }else if(montoCompra){
            this.logNewInfo('Monto compra propiedad', montoCompra.monto);
            caso.montoCompra = montoCompra;
        }
        // }

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
            const mortageBank = extractors.mortageBank(text);
            this.logNewInfo('Banco hipotecario', mortageBank);
            caso.mortageBank = mortageBank;
        }
        if(!caso.tipoDerecho){
            const tipoDerecho = extractors.rightType(text);
            this.logNewInfo('Tipo derecho', tipoDerecho);
            caso.tipoDerecho = tipoDerecho;
        }

    }

    static processLawsuit(caso, text){
        // if(!caso.deudaHipotecaria){
        const deudaHipotecaria = extractors.mortageDebt(text);
        this.logNewInfo(`Deuda hipotecaria`, deudaHipotecaria)
        if(deudaHipotecaria && caso.deudaHipotecaria){
            if(deudaHipotecaria > caso.deudaHipotecaria){
                caso.deudaHipotecaria = deudaHipotecaria;
            }
        }else{
            caso.deudaHipotecaria = deudaHipotecaria;
        }
        // }
    }

    static logNewInfo(tipe, info){
        if(info){
            logger.info(`${tipe} obtenido: ${info}`);
        }
    }
}


module.exports = PdfProccess;