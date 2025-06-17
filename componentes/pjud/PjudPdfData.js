const { setDefaultScreenshotOptions } = require('puppeteer-core');
const { getMontoMinimo, getFormatoEntrega, getPorcentaje, getAnno, getComuna, getTipoDerecho } = require('../economico/datosRemateEmol');
const convertWordToNumbers = require('../../utils/convertWordToNumbers');

const regexMutuoHipotecario = /mutuo\s*hipotecario/i;

class PjudPdfData {
    constructor(caso) {
        this.caso = caso;
    }

    processInfo(item) {

        if (this.checkIfValidDoc(item)) {
            return false;
        }
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

        // this.processCivilStatus(normalizeInfo); // No se usara por un rato hasta que se arregle que obtenga el del comprado y no el primero que encuentre.

        this.processPropertyRoles(normalizeInfo);
        this.processPropertyInfo(spanishNormalization, normalizeInfo);
        this.processAuctionInfo(item, normalizeInfo);

        return false;
    }

    checkIfValidDoc(item) {
        const docNotValid = [/tabla\s*de\s*contenidos/i,
            /solicitud\s*copias\s*y\s*certificados/i,
            // /mutuo\s*hipotecario/i
        ];
        for (const doc of docNotValid) {
            if (doc.test(item)) {
                console.log("Documento no valido, no contiene informacion relevante");
                return true;
            }
        }
        return false;
    }

    processCivilStatus(info) {
        if (!this.caso.estadoCivil) {
            const civilStatus = this.obtainCivilStatus(info);
            this.caso.estadoCivil = civilStatus;
        }
    }

    processPropertyRoles(info) {
        // Revision de rol de propiedad
        if (!this.caso.rolPropiedad) {
            const rolPropiedad = this.obtainRolPropiedad(info);
            if (rolPropiedad) {
                if (!rolPropiedad.tipo.includes("estacionamiento") && !rolPropiedad.tipo.includes("bodega")) {
                    console.log(`\n-----------------------------\nRol de la propieadad obtenido con ${rolPropiedad}\n---------------------------- `);
                    this.caso.rolPropiedad = rolPropiedad.rol;
                }
            }
        }
        // Revision de rol de estacionamiento
        if (!this.caso.rolEstacionamiento) {
            const rolEstacionamiento = this.obtainRolPropiedad(info);
            if (rolEstacionamiento && rolEstacionamiento.tipo.includes("estacionamiento")) {
                console.log(`\n-----------------------------\nRol de la estacionamiento obtenido con ${rolEstacionamiento}\n---------------------------- `);
                this.caso.rolEstacionamiento = rolEstacionamiento.rol;
            }
        }
        if (!this.caso.rolBodega) {
            const rolBodega = this.obtainRolPropiedad(info);
            if (rolBodega && rolBodega.tipo.includes("bodega")) {
                console.log(`\n-----------------------------\nRol de la bodega obtenido con ${rolBodega}\n---------------------------- `);
                this.caso.rolBodega = rolBodega.rol;
            }
        }
    }

    processPropertyInfo(info, normalizedInfo) {
        if (!this.caso.avaluoPropiedad) {
            const avaluoPropiedad = this.obtainAvaluoPropiedad(normalizedInfo);
            if (avaluoPropiedad && !avaluoPropiedad.tipo.includes("estacionamiento") && !avaluoPropiedad.tipo.includes("bodega")) {
                console.log(`\n-----------------------------\nAvaluo propiedad ${avaluoPropiedad.avaluo} y ${avaluoPropiedad.tipo}\n----------------------------- `);
                this.caso.avaluoPropiedad = avaluoPropiedad.avaluo;
            }
        }

        if (!this.caso.avaluoEstacionamiento) {
            const avaluoEstacionamiento = this.obtainAvaluoPropiedad(normalizedInfo);
            if (avaluoEstacionamiento && avaluoEstacionamiento.tipo.includes("estacionamiento")) {
                console.log(`\n-----------------------------\nAvaluo estacionamiento ${avaluoEstacionamiento.avaluo} y ${avaluoEstacionamiento.tipo}\n----------------------------- `);
                this.caso.hasEstacionamiento = true;
                this.caso.avaluoEstacionamiento = avaluoEstacionamiento.avaluo;
            }
        }

        if (!this.caso.avaluoBodega) {
            const avaluoBodega = this.obtainAvaluoPropiedad(normalizedInfo);
            if (avaluoBodega && avaluoBodega.tipo.includes("bodega")) {
                console.log(`\n-----------------------------\nAvaluo bodega ${avaluoBodega}\n----------------------------- `);
                this.caso.hasBodega = true;
                this.caso.avaluoBodega = avaluoBodega.avaluo;
            }
        }

        if (!this.caso.comuna) {
            let comuna = this.findValue(info, normalizedInfo, this.obtainComuna);
            if (comuna) {
                console.log(`\n-----------------------------\nComuna ${comuna}\n----------------------------- `);
                this.caso.comuna = comuna;
            }
            // let comuna = this.obtainComuna(info,normalizedInfo);
            // if (comuna) {
            //     console.log(`\n-----------------------------\nComuna ${comuna}\n----------------------------- `);
            //     this.caso.comuna = comuna;
            // }
        }

        if (!this.caso.direccion) {
            const direccion = this.obtainDireccion(normalizedInfo);
            if (direccion && !direccion.tipo.includes("estacionamiento")) {
                this.caso.direccion = direccion.direccion;
            }
        }

        if (!this.caso.direccionEstacionamiento) {
            const direccionEstacionamiento = this.obtainDireccion(normalizedInfo);
            if (direccionEstacionamiento && direccionEstacionamiento.tipo.includes("estacionamiento")) {

                this.caso.direccionEstacionamiento = direccionEstacionamiento.direccion;
            }
        }

        if (!this.caso.anno) {
            if(!regexMutuoHipotecario.exec(normalizedInfo)){
                const GPnormalizedInfo = this.adaptTextIfGP(normalizedInfo);
                if (!GPnormalizedInfo) {
                    console.log("No se obtiene el ano del GP");
                    return;
                }
                const anno = this.obtainBuyYear(GPnormalizedInfo);
                if (anno) {
                    console.log(`-----------------\nanno: ${anno}\n-----------------`);
                    this.caso.anno = anno ? anno : null;
                }
            }
        }

        this.checkIfIsDerecho(normalizedInfo);

        if (!this.caso.montoCompra) {
            const montoCompra = this.obtainMontoCompra(normalizedInfo);
            if (montoCompra) {
                console.log("-----------------\nmontoCompra: ", montoCompra, "\n-----------------");
                this.caso.montoCompra = montoCompra;
                console.log("montoCompra: ", montoCompra.monto, "moneda: ", montoCompra.moneda);
            }
        }

    }
    obtainBuyYear(texto) {
        // console.log("Texto para obtener el anno: ", texto);
        let anno = this.obtainYearForm1(texto);
        if(anno) {
            return anno;
        }
        anno = this.obtainYearnForm2(texto);
        if(anno) {
            return anno;
        }
    }

    obtainYearForm1(text) {
        const regexStartBuy = /(adquirio\s*por\s*compra)|(adquiried\s*por\s*compra)/i;
        const startText = regexStartBuy.exec(text);
        if (!startText) {
           return null; 
        }
        let newText = text.substring(startText.index);
        // console.log("Primera busqueda",newText)
        
        const newStart = /del\s*ano/i;
        let startAno = newStart.exec(newText);
        if (!startAno) {
            const newStart2 = /del\s*afio/i;
            startAno = newStart2.exec(newText);
            if (!startAno) {
                console.log("No se encontro el anno");
                return null;
            }
        }
    
        newText = newText.substring(startAno.index);
        // console.log("despues de busqueda el anno",newText)
  
        const regexEndBuy = /,\s*otorgada/i;
        const endText = regexEndBuy.exec(newText);
        if (!endText) {
           return null; 
        }
        const endIndex = endText.index;
        newText = newText.substring(0, endIndex)
        // console.log(newText)
        const anno = convertWordToNumbers(newText);
        console.log("anno: ", anno);
        return anno;
    }

    obtainYearnForm2(text) {
        let newText;
        const startRegex = /con\s*fecha/i;
        const startWord = startRegex.exec(text);
        if (!startWord) {
            return null;
        }
        newText = text.substring(startWord.index);

        const endRegex = /,\s*repertorio/i;
        const endWord = endRegex.exec(newText);
        if (!endWord) {
            return null;
        }
        newText = newText.substring(0, endWord.index);
        // console.log(newText)
        const annoRegex = /\d{4}/i;
        const anno = newText.match(annoRegex);
        if (anno) {
            return anno[0];
        }
    }

    obtainMontoCompra(text) {
        if (!text.includes("inscripci")) {
            console.log("No se puede obtener el monto de compra, no contiene inscripcion");
            return null;
        }
        // console.log("Texto en general: ", text)
        text = this.preProcessText(text);
        let monto = this.searchByPorCompra(text);
        if (monto) {
            
            return this.processMonto(monto);
        }
        monto = this.searchByCompraVenta(text)
        if (monto) {
            return this.processMonto(monto);
        }
        // Este hay que siempre dejarlo al final, ya que es el "peor" porque es un aporte de una sociedad
        monto = this.searchByEstimacion(text);
        if (monto) {
            return this.processMonto(monto);
        }

        return null;
    }

    preProcessText(text){
        const regexFirma = /documento\s*incorpora\s*firma\s*electronica\s*avanzada\s*codigo\s*de\s*verificacion\s*:?\s*\w{1,}-\w/g; 
        return text
            .replace(/fojas\s*\d{1,5}/gi," ")
            .replace(/pagina\s*\d{1,2}\s*de\s*\d{1,2}/gi, " ")
            .replace(regexFirma, " ")
            .replace(/[\n]/g," ")
            .replace(/\s+/g," ");
    }

    processMonto(monto) {
        // console.log("Buscando con monto: ", monto);
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

        const matchUF = ufRegex.exec(monto)
        if (matchUF) {
            const montoWithoutType = monto.substring(0, matchUF.index);
            if (montoWithoutType.includes("coma")) {
                const parts = montoWithoutType.split("coma");
                const intPart = convertWordToNumbers(parts[0]);
                let decimalPart = convertWordToNumbers(parts[1]);
                if (decimalPart === 1) {
                    decimalPart = 0.1;
                } else {
                    decimalPart *= 1 / 10 ** Math.ceil(Math.log10(decimalPart))
                }
                // console.log("intPart: ", intPart, "decimalPart: ", decimalPart);
                total = intPart + decimalPart;
                return {
                    monto: total,
                    moneda: "UF"
                }
            }
            const matchedNumber = regexNumber.exec(montoWithoutType);
            // console.log(`Buscando en el texto tal que: ${montoWithoutType}`)
            if (matchedNumber) {
                // console.log("Se encontro el numero asi: ",matchedNumber)
                return {
                    monto: parseInt(matchedNumber[0]),
                    moneda: "UF"
                }
            } else {
                // console.log(montoWithoutType)
                total = convertWordToNumbers(montoWithoutType);
                // console.log(montoWithoutType)
                return {
                    monto: total,
                    moneda: "UF"
                }
            }
        } else if (pesosRegex.exec(monto)) {
            const pesosMatch = pesosRegex.exec(monto);
            const montoWithoutType = monto.substring(0, pesosMatch.index);
            const matchedNumber = regexNumber.exec(montoWithoutType);
            if (matchedNumber) {
                return {
                    monto: parseInt(matchedNumber[0]),
                    moneda: "Pesos"
                }
            } else {
                total = convertWordToNumbers(montoWithoutType);
                return {
                    monto: total,
                    moneda: "Pesos"
                }
            }
        }
    }

    searchByPorCompra(text) {
        //   const startIndexRegex = /por\s*compra\s*a\s*/i;
        //   const startMatch = startIndexRegex.exec(text);
        //   if(!startMatch){
        //     return null;  
        //   }
        //   const startIndex = startMatch.index
        //   const newText = text.substring(startIndex);
        //   console.log(newText)
        const indexPrice = /por\s*el\s*precio\s*de/i;
        const priceMatch = indexPrice.exec(text);
        if (!priceMatch) {
            return null;
        }

        let priceText = text.substring(priceMatch.index + priceMatch[0].length + 1);
        const end1 = priceText.indexOf(",");
        priceText = priceText.substring(0, end1);


        return priceText;
    }

    searchByCompraVenta(text) {
        const startRegex = /precio\s*de\s*compraventa/i;
        const startMatch = startRegex.exec(text);
        if (!startMatch) {
            return null;
        }
        let newText = text.substring(startMatch.index);

        let endFomentoRegex = /fomento/i;
        let endMatch = endFomentoRegex.exec(newText);
        if (!endMatch) {
            return null;
        }
        newText = newText.substring(0, endMatch.index + endMatch[0].length);
        return newText;

    }

    searchByEstimacion(text) {

        const indexPrice = /se\s*estiman(?:\s*en)/i;
        const priceMatch = indexPrice.exec(text);
        if (!priceMatch) {
            return null;
        }

        let priceText = text.substring(priceMatch.index + priceMatch[0].length + 1);
        const end1 = priceText.indexOf(",");
        priceText = priceText.substring(0, end1);


        return priceText;
    }


    checkIfIsDerecho(info) {
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


    processAuctionInfo(info, normalizedInfo) {
        // console.log("info en processAuctionInfo: ", normalizedInfo);
        if (!this.caso.montoMinimo) {
            // console.log("info en monto minimo: ", normalizedInfo);
            const textoRemate = this.getTextRemate(normalizedInfo);
            for (const text of textoRemate) {
                if(!text.includes(this.caso.causa)) {
                    continue;
                }
                const montoMinimo = getMontoMinimo(text);
                if (montoMinimo) {
                    console.log(`-----------------\nmontoMinimo: ${montoMinimo}\n-----------------`);
                    this.caso.montoMinimo = montoMinimo ? montoMinimo : null;
                    break; // Salir del bucle si se encuentra un monto mínimo
                }
            }
        }

        if (!this.caso.formatoEntrega) {
            const formatoEntrega = getFormatoEntrega(info);
            if (formatoEntrega) {
                this.caso.formatoEntrega = formatoEntrega ? formatoEntrega[0] : null;
            }
        }

        if (!this.caso.porcentaje) {
            const percentage = this.getAndProcessPercentage(info);
            if (percentage) {
                this.caso.porcentaje = percentage ? percentage : null;
            }
        }

        if (!this.caso.tipoDerecho) {
            
            if(!regexMutuoHipotecario.exec(normalizedInfo)){
                console.log("info en tipoDerecho: ", normalizedInfo.includes("diario"));
                const textoRemate = this.getTextRemate(normalizedInfo);
                for (const text of textoRemate) {
                    if (!text.includes(this.caso.causa.toLowerCase())) {
                        continue;
                    }
                    console.log("Buscando el tipo de derecho");
                    const tipoDerecho = getTipoDerecho(text);

                    if (tipoDerecho) {
                        console.log(`-----------------\ntipoDerecho: ${tipoDerecho}\n-----------------`);
                        this.caso.tipoDerecho = tipoDerecho ? tipoDerecho : null;
                    }
                }
            }
        }

        if(!this.caso.deudaHipotecaria){
            if(this.checkIfTextHasHipoteca(normalizedInfo)){
                const deuda = this.obtainDeudaHipotecaria(normalizedInfo);
                if(deuda){
                    console.log("Deuda encontrada: ", deuda)
                    this.caso.deudaHipotecaria = deuda;
                }
            }
        }
    }

    checkIfTextHasHipoteca(info){
        // console.log(`Buscando si en el texto esta como deuda hipotecaria: ${info}`);
        if(regexMutuoHipotecario.exec(info)){
            return true;
        }
        const regexMeses = /\d{2,}\s*(meses|cuotas\s*mensual)/;
        const matchRegexMeses = info.match(regexMeses);
        if(matchRegexMeses){
            const numMeses = parseInt(matchRegexMeses[0].match(/\d{1,}/)[0]);
            if(numMeses > 60){
                return true;
            }
        }
        console.log("El texto no puede ser utilizado para obtener la deuda hipotecaria");
        return false;
    }

    obtainDeudaHipotecaria(info){
        let deuda;
        console.log("------------\nBuscando deuda hipotecaria");
        let newText = this.trimTextHipotecario(info);
        if(!newText){
            return null;
        }
        console.log(newText);
        const regexNumber = "(\\d{1,}|\\d{1,3}(\\.\\d{1,3})*),?(\\d{1,})?"
        const regexUF = "(u\\.?f\\.?|unidades?\\s*de\\s*fomento)"
        const regexDeudaUF = new RegExp(`(${regexNumber}\\s*${regexUF}|${regexUF}\\s*${regexNumber})`, "gi")
        const matchNumero = newText.match(regexDeudaUF);
        if(matchNumero){
            deuda = this.checkBiggerDebt(matchNumero)
            console.log(matchNumero);
            return deuda;
        }

        const regexDeudaPesos = new RegExp(`(\\$\\s*${regexNumber}|${regexNumber}\\s*(?:de\\s*)?pesos)`)
        const matchMontoPesos = regexDeudaPesos.exec(newText);
        if(matchMontoPesos){
            console.log(matchMontoPesos)
            return matchMontoPesos[0];
        }
        return null;
    }

    checkBiggerDebt(debts){
        if(debts.size == 1){
            return debts[0];
        }
        let biggerDebt = 0;
        let indexBiggerDebt = 0;
        const regexNumber = /(\d{1,}|\d{1,3}(\.\d{1,3})*),?(\d{1,})?/;
        debts.forEach((debt, index) => {
            let stringActualDebt = debt.match(regexNumber)[0].replace(/,/g, ".")
            console.log(debt, stringActualDebt)
            const actualDebt = Number(stringActualDebt);
            if (actualDebt > biggerDebt) {
                biggerDebt = actualDebt;
                indexBiggerDebt = index;
            } 
        });
        return debts[indexBiggerDebt];
    }


    trimTextHipotecario(info){
        const regexPorTanto = /por\s*tanto/i;
        const match = regexPorTanto.exec(info);
        if(!match){
            return null
        }
        let newText = info.substring(match.index)
        const endRegexOtrosi = /primer\s*otrosi\s*:/i;
        const endMatch = endRegexOtrosi.exec(newText);
        if(!endMatch){
            return null;
        }
        return newText.substring(0,endMatch.index).replace(/\./g,"")
    }

    

    findValue(info, normalizedInfo, lambda){
        const textRemate = this.getTextRemate(normalizedInfo);
        if (textRemate.length === 0) {
            console.log("Buscando en singular")
            const value = lambda(info,normalizedInfo);
            if (value) {
                return value;
            }
        }else{
            console.log("Buscando en plural")
            for (const text of textRemate) {
                if (!text.includes(this.caso.causa.toLowerCase()) && this.caso.causa) {
                    continue;
                }
                const value = lambda(text, text);
                if (value) {
                    return value;
                }
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

    getTextRemate(info) {
        const regexMonto = /remate\s*judicial/gi;
        let matchedRemate;
        let lastStart = 0;
        const textoFinal = [];
        if(!regexMonto.test(info)) {
            // console.log("No se encontro remate judicial en el texto: ", info);
            return [];
        }
        while ((matchedRemate = regexMonto.exec(info)) != null) {
            // console.log(matchedRemate, matchedRemate.index)
            const textoRemate = info.substring(lastStart, matchedRemate.index)
            textoFinal.push(textoRemate);
            lastStart = matchedRemate.index;
        }
        const lastText = info.substring(lastStart);
        textoFinal.push(lastText);
        return textoFinal;
    }

    getAndProcessPercentage(info) {
        const percentage = getPorcentaje(info);
        // console.log("Porcentaje identificado: ", percentage);
        if (!percentage) {
            return null;
        }
        const numericPercentage = percentage[0].match(/\d{1,2}/g);
        if (!numericPercentage) {
            return null
        }
        return numericPercentage[0];
    }


    obtainCivilStatus(info) {
        const validInfo = info;
        // console.log("info en estado civil: ", validInfo);
        if (!info.includes("conservador") && !info.includes("dominio")) {
            return null;

        }
        const regexDivorced = /divorciad[o|a]/i;
        const regexMarried = /casad[o|a]/i;
        const regexSingle = /solter[o|a]/i;
        const regexWidowed = /viud[o|a]/i;

        if (validInfo.match(regexDivorced)) {
            return "Divorciado";
        } else if (validInfo.match(regexMarried)) {
            const tipo = this.findTipeMarriage(validInfo);
            return "Casado " + tipo;
        } else if (validInfo.match(regexSingle)) {
            return "Soltero";
        } else if (validInfo.match(regexWidowed)) {
            return "Viudo";
        }

        return null;
    }

    findTipeMarriage(info) {
        const regexSeparacion = /(separacion\sde\sbienes|separado\s*totalmente\s*de\s*bienes)/i;
        const regexConyugal = /matrimonio\s(?:conyugal|por\sregimen\spatrimonial\sdiferente\sa\slos\sgenerales)/i;
        const regexComunidad = /matrimonio\s(?:comunidad|por\sregimen\scomun)/i;

        if (info.match(regexSeparacion)) {
            return "separacion de bienes";
        } else if (info.match(regexConyugal)) {
            this.caso.tipoMatrimonio = "Conyugal";
        } else if (info.match(regexComunidad)) {
            this.caso.tipoMatrimonio = "Comunidad";
        }
        return '';
    }

    obtainRolPropiedad(info) {
        if (info.includes("inscripcion")) {
            return null;
        }
        let avaluoType = this.obtainTipo(info) ? this.obtainTipo(info) : '';
        const regexAvaluo = /rol\sde\savaluo\s*(?:numero|:)\s*(\d{1,5}\s*-\s*\d{1,7})/i;
        const match = info.match(regexAvaluo);
        if (match) {
            return {
                "tipo": avaluoType,
                "rol": match[1],
            };
        }
        else {
            return null;
        }
    }

    obtainAvaluoPropiedad(info) {
        let avaluoType = this.obtainTipo(info) ? this.obtainTipo(info) : '';
        const regexAvaluo = /avaluo\stotal\s*:\$(\d{1,3}.?)*/g;
        const avaluoMatch = info.match(regexAvaluo);
        if (avaluoMatch) {
            const avaluo = avaluoMatch[0].match(/(\d{1,3}.?)+/);
            const avaluoNumber = avaluo[0].replace(/\./g, '');
            return {
                "tipo": avaluoType,
                "avaluo": avaluoNumber
            };
        } else {
            return null;
        }
    }

    obtainTipo(info) {
        const regexTipo = /destino\sdel\sbien\sraiz:\s(\w{1,20})/g;
        let tipoBien = info.match(regexTipo);
        if (tipoBien) {
            return tipoBien[0];
        }
        else {
            return null;
        }

    }

    obtainComuna(info, infoNormalized) {
        const regexRegistro = /dominio\s*con\s*vigencia/gi;
        if (regexRegistro.test(info)) {
            console.log("Incluye registro de propiedad, no se puede obtener la comuna");
            return null;
        }
        // console.log("info en comuna: ", info);
        let comuna = obtainComunaByIndex(infoNormalized);
        // console.log("comuna by index: ", comuna);
        if (comuna) {
            return comuna;
        }
        comuna = getComuna(info, true);

        if (comuna) {
            return comuna;
        }
        return null;
    }

    obtainDireccion(info) {
        // console.log("info en direccion: ", info);
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
    adaptTextIfGP(texto) {
        const regexGP = /certificado\s*de\s*hipotecas/gi;
        if (regexGP.test(texto)) {
            return null;
        }
        const endIndex = texto.search(/registro\s*de\s*hipotecas/);
        if (endIndex === -1) {
            return texto;
        }
        const newText = texto.substring(0, endIndex);
        return newText;
    }

    //This function will check if the case is complete, if it is the process end
    isCaseComplete() {
        if (this.caso.estadoCivil
            && this.caso.rolPropiedad
            && this.caso.direccion
            && this.caso.comuna
            && this.caso.avaluoPropiedad
            && this.caso.rolEstacionamiento
            && this.caso.anno

        ) {
            return true;
        }
        return false
    }
}

    function obtainComunaByIndex(info) {
        console.log("info) en obtainComunaByIndex :) ");
        const startText = "comuna:";
        const startIndex = info.indexOf(startText);
        if (startIndex === -1) {
            // console.log("No se encontro la comuna por index startIndex");
            return null;
        }
        const modifiedInfo = info.substring(startIndex);
        const endText = "numero de rol de avaluo";
        const endIndex = modifiedInfo.indexOf(endText);

        if (endIndex === -1) {
            // console.log("No se encontro el final de la comuna por index endIndex");
            return null;
        }
        const comuna = modifiedInfo.substring(startText.length, endIndex).trim();
        // console.log("comuna by index: ", comuna);
        return comuna;

    }

    function obtainComunaByregex(info) {
        const regexComuna = /comuna\s*:\s*(\w{4,15})/g;
        const matchComuna = info.match(regexComuna);
        if (matchComuna) {
            const comuna = matchComuna[0].split(" ")[1];
            return comuna;
        }
        return null;
    }
module.exports = PjudPdfData;
// && this.caso.isBienFamiliar
// && this.caso.anno