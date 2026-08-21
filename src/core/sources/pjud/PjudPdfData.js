const PdfProccess = require('#src/pdfProcess/PdfProcess.js');


class PjudPdfData {
    constructor(caso,mainWindow,isDev=false) {
        this.caso = caso;
        this.mainWindow = mainWindow;
        this.isDev = isDev;
    }

    processInfo(data) {
        this.functionA(data);
        // this.functionB(data);
    }

    functionA(data){
        return PdfProccess.process(this.caso,data,this.isDev, this.mainWindow);
    }
//     functionB(data){
//         if(!data){
//             return false;
//         }
//         if(this.isDev){
//             logger.debug(data);
//         }

//         if (!this.checkIfValidDoc(data)) {
//             logger.info("Documento no valido")
//             return false;
//         }
//         let normalizeInfo = this.normalizeInfo(data);
//         let spanishNormalization = this.normalizeSpanish(data);

//         if (this.isCaseComplete()) {
//             logger.info("Caso completo");
//             return true;
//         }

//         // this.processCivilStatus(normalizeInfo); // No se usara por un rato hasta que se arregle que obtenga el del comprado y no el primero que encuentre.

//         this.processPropertyRoles(normalizeInfo); // Rol propiedad, estacionamiento, bodega
//         this.processPropertyInfo(spanishNormalization, normalizeInfo); //Avaluos, 
//         this.processAuctionInfo(data, normalizeInfo);
//         this.processDemanda(normalizeInfo);


//         return false;
//     }

    obtainDireccion(info) {
        // console.log("info en direccion: ", info);
        if(info.includes('bases generales de remate')){
            return this.obtainDireccionActaRemate(info);
        }
        let avaluoType = this.obtainTipo(info) ? this.obtainTipo(info) : '';
        let startText = "direccion o nombre del bien raiz:";
        let startIndex = info.indexOf(startText);
        if (startIndex === -1) {
            startText = "direccion:";
            startIndex = info.indexOf(startText);
        }
        const endText = "destino del bien raiz:";
        const endIndex = info.indexOf(endText);
        if (startIndex === -1 || endIndex === -1) {
            return null;
        }
        startIndex += startText.length;
        const direccion = info.substring(startIndex, endIndex).trim();
        return {
            "direccion": direccion,
            "tipo": avaluoType
        }
    }
}

module.exports = PjudPdfData;
// && this.caso.isBienFamiliar
// && this.caso.anno