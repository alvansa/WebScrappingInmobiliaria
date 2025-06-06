const { setDefaultScreenshotOptions } = require('puppeteer-core');
const {getMontoMinimo, getFormatoEntrega, getPorcentaje, getAnno, getComuna, getTipoDerecho} = require('../economico/datosRemateEmol');
const convertWordToNumbers = require('../../utils/convertWordToNumbers');

class PjudPdfData{
    constructor(caso){
        this.caso = caso;
    }

    processInfo(item){
        // console.log("Procesando item: ", item);
        let normalizeInfo = this.normalizeInfo(item);
        if (this.isCaseComplete()) {
            console.log("Caso completo");
            return true;
        }
        const spanishNormalization = item
            .toLowerCase()
            .replace(/[\n\r]/g, " ")
            .replace(/\s+/g, " ");

        this.processCivilStatus(normalizeInfo);
        this.processPropertyRoles(normalizeInfo);
        this.processPropertyInfo(spanishNormalization,normalizeInfo);
        this.processAuctionInfo(item,normalizeInfo);

        return false;
    }

    processCivilStatus(info){
        if(!this.caso.estadoCivil){
            const civilStatus = this.obtainCivilStatus(info);
            this.caso.estadoCivil = civilStatus;
        }
    }

    processPropertyRoles(info){
        // Revision de rol de propiedad
        if(!this.caso.rolPropiedad){
            const rolPropiedad = this.obtainRolPropiedad(info);
            if(rolPropiedad){
                if (!rolPropiedad.tipo.includes("estacionamiento") && !rolPropiedad.tipo.includes("bodega")) {
                    this.caso.rolPropiedad = rolPropiedad.rol;
                }       
            }
        }
        // Revision de rol de estacionamiento
        if(!this.caso.rolEstacionamiento){
            const rolEstacionamiento = this.obtainRolPropiedad(info);
            if (rolEstacionamiento && rolEstacionamiento.tipo.includes("estacionamiento")) {

                this.caso.rolEstacionamiento = rolEstacionamiento.rol;
            }
        }
        if(!this.caso.rolBodega){
            const rolBodega = this.obtainRolPropiedad(info);
            if (rolBodega && rolBodega.tipo.includes("bodega")) {
                this.caso.rolBodega = rolBodega.rol;
            }
        }
    }

    processPropertyInfo(info,normalizedInfo){
        if(!this.caso.avaluoPropiedad){
            const avaluoPropiedad = this.obtainAvaluoPropiedad(normalizedInfo);
            if (avaluoPropiedad && !avaluoPropiedad.tipo.includes("estacionamiento") && !avaluoPropiedad.tipo.includes("bodega")) {
                this.caso.avaluoPropiedad = avaluoPropiedad.avaluo;
            }
        }

        if(!this.caso.avaluoEstacionamiento){
            const avaluoEstacionamiento = this.obtainAvaluoPropiedad(normalizedInfo);
            if (avaluoEstacionamiento && avaluoEstacionamiento.tipo.includes("estacionamiento")) {
                console.log("\n-----------------------------\nLa propiedad tiene estacionamiento\n----------------------------- ");
                this.caso.hasEstacionamiento = true;
                this.caso.avaluoEstacionamiento = avaluoEstacionamiento.avaluo;
            }
        }

        if(!this.caso.avaluoBodega){
            const avaluoBodega = this.obtainAvaluoPropiedad(normalizedInfo);
            if (avaluoBodega && avaluoBodega.tipo.includes("bodega")) {
                this.caso.hasBodega = true;
                this.caso.avaluoBodega = avaluoBodega.avaluo;
            }
        }

        if(!this.caso.comuna){
            let comuna = this.obtainComuna(normalizedInfo,info);
            if(comuna){
                // comuna = getComuna(info)
                this.caso.comuna = comuna ? comuna : this.caso.comuna;
            }
        }

        if(!this.caso.direccion){
            const direccion = this.obtainDireccion(normalizedInfo);
            if (direccion && !direccion.tipo.includes("estacionamiento")) {
                this.caso.direccion = direccion.direccion;
            }
        }

        if(!this.caso.direccionEstacionamiento){
            const direccionEstacionamiento = this.obtainDireccion(normalizedInfo);
            if (direccionEstacionamiento && direccionEstacionamiento.tipo.includes("estacionamiento")) {

                this.caso.direccionEstacionamiento = direccionEstacionamiento.direccion;
            }
        }

        if(!this.caso.anno){
            const GPnormalizedInfo = this.adaptTextIfGP(normalizedInfo);
            const anno = getAnno(GPnormalizedInfo);
            if(anno){
                this.caso.anno = anno ? anno : null;
            }
        }

        this.checkIfIsDerecho(normalizedInfo);

        if(!this.caso.montoCompra){
            const montoCompra = this.obtainMontoCompra(normalizedInfo);
            console.log("-----------------\nmontoCompra: ", montoCompra, "\n-----------------");
            if(montoCompra){
                this.caso.montoCompra = montoCompra;
                console.log("montoCompra: ", montoCompra.monto, "moneda: ", montoCompra.moneda);  
            }
        }

    }

    obtainMontoCompra(text) {
        let monto = this.searchByPorCompra(text);
        if (monto) {
            return this.processMonto(monto);
        }
        monto = this.searchByCompraVenta(text)
        if (monto) {
            return this.processMonto(monto);
        }

        return null;
    }

    processMonto(monto) {
        let total;
        const regexNumber = /\d{1,}(?:[\.|,]\d{1,3})*/;
        const ufRegex = /(unidades\s*de\s*fomento|u\.?f\.?)/i;
        const pesosRegex = /(\$|pesos)/i;

        if (!monto) {
            return {
                monto: null,
                moneda: null
            }
        }

        const match = ufRegex.exec(monto)
        if (match) {
            const montoWithoutType = monto.substring(0, match.index);
            if (montoWithoutType.includes("coma")) {
                const parts = montoWithoutType.split("coma");
                const intPart = convertWordToNumbers(parts[0]);
                let decimalPart = convertWordToNumbers(parts[1]);
                if(decimalPart === 1){
                    decimalPart = 0.1;
                }else{
                    decimalPart *= 1 / 10 ** Math.ceil(Math.log10(decimalPart))
                }
                console.log("intPart: ", intPart, "decimalPart: ", decimalPart);
                total = intPart + decimalPart;
                return {
                    monto: total,
                    moneda: "UF"
                }
            }
            const matchedNumber = regexNumber.exec(montoWithoutType);
            if (matchedNumber) {
                console.log(matchedNumber)
                return {
                    monto: parseInt(matchedNumber[0]),
                    moneda: "UF"
                }
            }else {
                total = convertWordToNumbers(montoWithoutType);
                console.log(montoWithoutType)
                return {
                    monto: total,
                    moneda: "UF"
                }
            }
        }else if (pesosRegex.exec(monto)) {
            const matchedNumber = regexNumber.exec(monto);
            const pesosMatch = pesosRegex.exec(monto);
            const montoWithoutType = monto.substring(0, pesosMatch.index);
            if (matchedNumber) {
                return {
                    monto: parseInt(matchedNumber[0]),
                    moneda: "Pesos"
                }
            }else {
                total = convertWordToNumbers(montoWithoutType);
                return {
                    monto: total,
                    moneda: "Pesos"
                }
            }
        }
    }

searchByPorCompra(text){
  const startIndexRegex = /por\s*compra\s*a\s*/i;
  const startMatch = startIndexRegex.exec(text);
  if(!startMatch){
    return null;  
  }
  const startIndex = startMatch.index
  const newText = text.substring(startIndex);
  console.log(newText)
  const indexPrice = /por\s*el\s*precio\s*de/i;
  const priceMatch = indexPrice.exec(newText);
  if(!priceMatch){
    return null;
  }

  let priceText = newText.substring(priceMatch.index + priceMatch[0].length + 1);
  const end1 = priceText.indexOf(",");
  priceText = priceText.substring(0,end1);
  
  
  return priceText;
}

searchByCompraVenta(text){
  const startRegex = /precio\s*de\s*compraventa/i;
  const startMatch = startRegex.exec(text);
  if(!startMatch){
    return null;
  }
  let newText = text.substring(startMatch.index);
  
  let endFomentoRegex = /fomento/i;
  let endMatch = endFomentoRegex.exec(newText);
  if(!endMatch){
    return null;
  }
  newText = newText.substring(0,endMatch.index + endMatch[0].length);
  return newText;
}


    checkIfIsDerecho(info){
        const buyers = this.obtainBuyers(info);
        console.log("------------\nbuyers: ", buyers, "\n------------");
    }

    obtainBuyers(texto) {
        // Normalizar el texto para búsqueda insensible a mayúsculas
        const textoNormalizado = texto.toLowerCase();
        const regex = /de\s*propiedad\s*de/gi;
        let matches;
        let lastIndex = 0
        const indicesValidos = [];

        // Buscar todas las coincidencias de "de propiedad de"
        while ((matches = regex.exec(textoNormalizado)) !== null) {
            const startIndex = matches.index;
            const textoPrevio = texto.slice(lastIndex, startIndex).toLowerCase();
            // Verificar que no tenga "registro" antes
            if (!textoPrevio.includes("registro")) {
                indicesValidos.push(startIndex);
            }
            lastIndex = startIndex;
        }
        // Si no hay coincidencias válidas, retornar null
        if (indicesValidos.length === 0) {
            return null;
        }
        // Usar el ÚLTIMO índice válido (para el segundo "de propiedad de")
        const startIndexText = indicesValidos[indicesValidos.length - 1];

        // Extraer el texto después de "de propiedad de"
        const textoPosterior = texto.slice(startIndexText);
        const matchPropietario = textoPosterior.match(regex);
        if (!matchPropietario) {
            return null;
        }

        const updatedText = textoPosterior.substring(matchPropietario[0].length);
        const endText = updatedText.indexOf(".");
        if (endText === -1) {
            return null;
        }

        const propietarioText = updatedText.substring(0, endText).trim();

        // Dividir por comas si es necesario
        if (propietarioText.includes(",")) {
            return propietarioText.split(",").map(part => part.trim());
        }

        return [propietarioText];
    }
 
    
    processAuctionInfo(info,normalizedInfo){

        // console.log("info en processAuctionInfo: ", normalizedInfo);
        if(!this.caso.montoMinimo){
            const montoMinimo = getMontoMinimo(normalizedInfo);
            if(montoMinimo){
                this.caso.montoMinimo = montoMinimo ? montoMinimo : null;
            }
        }

        if(!this.caso.formatoEntrega){
            const formatoEntrega = getFormatoEntrega(info);
            if(formatoEntrega){
                this.caso.formatoEntrega = formatoEntrega ? formatoEntrega[0] : null;
            }
        }

        if(!this.caso.porcentaje){
            const percentage = this.getAndProcessPercentage(info);
            if(percentage){
                this.caso.porcentaje = percentage ? percentage : null;
            }
        }

        if(!this.caso.tipoDerecho){
            const tipoDerecho = getTipoDerecho(normalizedInfo);
            if(tipoDerecho){
                this.caso.tipoDerecho = tipoDerecho ? tipoDerecho : null;
            }
        }
    }

    normalizeInfo(item) {
        const processItem = item
            .toLowerCase()
            .replace(/[\n\r]/g, " ")
            .replace(/\s+/g, " ")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/−/g, "-");
        return processItem;
    }

    getAndProcessPercentage(info){
        const percentage = getPorcentaje(info);
        console.log("Porcentaje identificado: ", percentage);
        if (!percentage) {
            return null;
        }
        const numericPercentage = percentage[0].match(/\d{1,2}/g);
        if (!numericPercentage) {
            return null
        }
        return numericPercentage[0];
    }

    
    obtainCivilStatus(info){
        const validInfo = info;
        // console.log("info en estado civil: ", validInfo);
        if(!info.includes("conservador") && !info.includes("dominio")){
            return null;

        }
        const regexDivorced = /divorciad[o|a]/i;
        const regexMarried = /casad[o|a]/i;
        const regexSingle = /solter[o|a]/i;
        const regexWidowed = /viud[o|a]/i;

        if(validInfo.match(regexDivorced)) {
            return "Divorciado";
        }else if(validInfo.match(regexMarried)) {
            const tipo = this.findTipeMarriage(validInfo);
            return "Casado " + tipo;
        }else if(validInfo.match(regexSingle)) {
            return "Soltero";
        }else if(validInfo.match(regexWidowed)) {
            return "Viudo";
        }

        return null;
    }

    findTipeMarriage(info){
        const regexSeparacion = /(separacion\sde\sbienes|separado\s*totalmente\s*de\s*bienes)/i;
        const regexConyugal = /matrimonio\s(?:conyugal|por\sregimen\spatrimonial\sdiferente\sa\slos\sgenerales)/i;
        const regexComunidad = /matrimonio\s(?:comunidad|por\sregimen\scomun)/i;

        if(info.match(regexSeparacion)) {
            return "separacion de bienes";
        }else if(info.match(regexConyugal)) {
            this.caso.tipoMatrimonio = "Conyugal";
        }else if(info.match(regexComunidad)) {
            this.caso.tipoMatrimonio = "Comunidad";
        }
        return '';
    }

    obtainRolPropiedad(info){
        let avaluoType = this.obtainTipo(info) ? this.obtainTipo(info) : '';
        const regexAvaluo = /rol\sde\savaluo\s*(?:numero|:)\s*(\d{1,5}\s*-\s*\d{1,7})/i;
        const match = info.match(regexAvaluo);
        if (match) {
            return {
                "tipo": avaluoType,
                "rol": match[1],
            };
        }
        else{
            return null;
        }
    }

    obtainAvaluoPropiedad(info){
        let avaluoType = this.obtainTipo(info) ? this.obtainTipo(info) : '';
        const regexAvaluo = /avaluo\stotal\s*:\$(\d{1,3}.?)*/g;
        const avaluoMatch = info.match(regexAvaluo);
        if(avaluoMatch){
            const avaluo = avaluoMatch[0].match(/(\d{1,3}.?)+/);
            const avaluoNumber = avaluo[0].replace(/\./g,'');
            return {
                "tipo": avaluoType,
                "avaluo": avaluoNumber
            };   
        }else{
            return null;
        }
    }

    obtainTipo(info){
        const regexTipo = /destino\sdel\sbien\sraiz:\s(\w{1,20})/g;
        let tipoBien = info.match(regexTipo);
        if(tipoBien){
            return tipoBien[0];
        }
        else{
            return null;
        }

    }

    obtainComuna(infoNormalized,info){

        if(infoNormalized.includes("inscripcion")){
            return null;
        }
        // console.log("info en comuna: ", info);
        let comuna = this.obtainComunaByIndex(infoNormalized);
        // console.log("comuna by index: ", comuna);
        if(comuna){
            return comuna;
        }
        comuna = getComuna(info);
        if(comuna){
            return comuna;
        }
        return null;
    }

    obtainComunaByIndex(info){
        const startText = "comuna:";
        const startIndex = info.indexOf(startText);
        if (startIndex === -1) {
            return null;
        }
        const modifiedInfo = info.substring(startIndex);   
        const endText = "numero de rol de avaluo";
        const endIndex = modifiedInfo.indexOf(endText);

        if (endIndex === -1) {
            return null;
        }
        const comuna = modifiedInfo.substring(startText.length, endIndex).trim();
        // console.log("comuna by index: ", comuna);
        return comuna;

    }

    obtainComunaByregex(info){
        const regexComuna = /comuna\s*:\s*(\w{4,15})/g;
        const matchComuna = info.match(regexComuna);
        if(matchComuna){
            const comuna = matchComuna[0].split(" ")[1];
            return comuna;
        }
        return null;
    }
    obtainDireccion(info){
        // console.log("info en direccion: ", info);
        let avaluoType = this.obtainTipo(info) ? this.obtainTipo(info) : '';
        let startText = "direccion o nombre del bien raiz:";
        let startIndex = info.indexOf(startText);
        if(startIndex === -1) {
            startText = "direccion:";
            startIndex = info.indexOf(startText);
        }
        const endText = "destino del bien raiz:";
        const endIndex = info.indexOf(endText);
        if(startIndex === -1 || endIndex === -1) {
            return null;
        }
        startIndex += startText.length;
        const direccion = info.substring(startIndex, endIndex).trim();
        return {
            "direccion": direccion,
            "tipo": avaluoType
        }
      }
    adaptTextIfGP(texto) {
        const endIndex = texto.search(/registro\s*de\s*hipotecas/);
        if (endIndex === -1) {
            return texto;
        }
        const newText = texto.substring(0, endIndex);
        return newText;
    }

    //This function will check if the case is complete, if it is the process end
    isCaseComplete(){
       if(this.caso.estadoCivil 
            && this.caso.rolPropiedad 
            && this.caso.direccion
            && this.caso.comuna
            && this.caso.avaluoPropiedad
            && this.caso.rolEstacionamiento
            && this.caso.anno
        
            ){
                return true;
            }
            return false
    }
}

module.exports = PjudPdfData;
// && this.caso.isBienFamiliar
// && this.caso.anno