const { getMontoMinimo, getFormatoEntrega, getPorcentaje, getAnno, getComuna, getTipoDerecho } = require('../economico/datosRemateEmol');
const convertWordToNumbers = require('../../utils/convertWordToNumbers');

const regexMutuoHipotecario = /mutuo\s*hipotecario/i;

class PjudPdfData {
    constructor(caso) {
        this.caso = caso;
    }

    processInfo(data) {
        if(!data){
            return false;
        }

        if (!this.checkIfValidDoc(data)) {
            return false;
        }
        let normalizeInfo = this.normalizeInfo(data);
        // console.log(normalizeInfo)
        let spanishNormalization = this.normalizeSpanish(data);

        if (this.isCaseComplete()) {
            console.log("Caso completo");
            return true;
        }

        // this.processCivilStatus(normalizeInfo); // No se usara por un rato hasta que se arregle que obtenga el del comprado y no el primero que encuentre.

        this.processPropertyRoles(normalizeInfo); // Rol propiedad, estacionamiento, bodega
        this.processPropertyInfo(spanishNormalization, normalizeInfo); //Avaluos, 
        this.processAuctionInfo(data, normalizeInfo);

        return false;
    }

    checkIfValidDoc(item) {
        const docNotValid = [
            /tabla\s*de\s*contenidos/i,
            /solicitud\s*copias\s*y\s*certificados/i,
        ];
        for (const doc of docNotValid) {
            if (doc.test(item)) {
                console.log("Documento no valido, no contiene informacion relevante");
                return false;
            }
        }
        if(this.checkIfDiario(item)){
            return false;
        }

        return true;
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
        //Revision de rol Bodega
        if (!this.caso.rolBodega) {
            const rolBodega = this.obtainRolPropiedad(info);
            if (rolBodega && rolBodega.tipo.includes("bodega")) {
                console.log(`\n-----------------------------\nRol de la bodega obtenido con ${rolBodega}\n---------------------------- `);
                this.caso.rolBodega = rolBodega.rol;
            }
        }
    }

    processPropertyInfo(info, normalizedInfo) {
        //Obtener avaluo del inmueble
        if (!this.caso.avaluoPropiedad) {
            const avaluoPropiedad = this.obtainAvaluoPropiedad(normalizedInfo);
            if (avaluoPropiedad && !avaluoPropiedad.tipo.includes("estacionamiento") && !avaluoPropiedad.tipo.includes("bodega")) {
                console.log(`\n-----------------------------\nAvaluo propiedad ${avaluoPropiedad.avaluo} y ${avaluoPropiedad.tipo}\n----------------------------- `);
                this.caso.avaluoPropiedad = avaluoPropiedad.avaluo;
            }
        }

        //Obtener avaluo del estacionamiento
        if (!this.caso.avaluoEstacionamiento) {
            const avaluoEstacionamiento = this.obtainAvaluoPropiedad(normalizedInfo);
            if (avaluoEstacionamiento && avaluoEstacionamiento.tipo.includes("estacionamiento")) {
                console.log(`\n-----------------------------\nAvaluo estacionamiento ${avaluoEstacionamiento.avaluo} y ${avaluoEstacionamiento.tipo}\n----------------------------- `);
                this.caso.hasEstacionamiento = true;
                this.caso.avaluoEstacionamiento = avaluoEstacionamiento.avaluo;
            }
        }

        //Obtener avaluo de la bodega
        if (!this.caso.avaluoBodega) {
            const avaluoBodega = this.obtainAvaluoPropiedad(normalizedInfo);
            if (avaluoBodega && avaluoBodega.tipo.includes("bodega")) {
                console.log(`\n-----------------------------\nAvaluo bodega ${avaluoBodega}\n----------------------------- `);
                this.caso.hasBodega = true;
                this.caso.avaluoBodega = avaluoBodega.avaluo;
            }
        }

        //Obtener comuna
        if (!this.caso.comuna) {
            let comuna = this.findValueGeneric(info, normalizedInfo, this.obtainComuna);
            if (comuna) {
                console.log(`\n-----------------------------\nComuna ${comuna}\n----------------------------- `);
                this.caso.comuna = comuna;
            }
        }

        //Obtener direccion del inmueble
        if (!this.caso.direccion) {
            const direccion = this.obtainDireccion(normalizedInfo);
            if (direccion && !direccion.tipo.includes("estacionamiento")) {
                this.caso.direccion = direccion.direccion;
            }
        }

        //Obtner direccion del estacionamiento
        if (!this.caso.direccionEstacionamiento) {
            const direccionEstacionamiento = this.obtainDireccion(normalizedInfo);
            if (direccionEstacionamiento && direccionEstacionamiento.tipo.includes("estacionamiento")) {
                this.caso.direccionEstacionamiento = direccionEstacionamiento.direccion;
            }
        }

        //Obtener anno de compra
        if (!this.caso.anno) {
            const anno = this.obtainAnno(normalizedInfo)
                if (anno) {
                    console.log(`-----------------\nanno: ${anno}\n-----------------`);
                    this.caso.anno = anno;
                }
        }

        // this.checkIfIsDerecho(normalizedInfo);

        // Obtener monto de compra
        if (!this.caso.montoCompra) {
            const montoCompra = this.obtainMontoCompra(normalizedInfo);
            if (montoCompra) {
                console.log("-----------------\nmontoCompra: ", montoCompra, "\n-----------------");
                this.caso.montoCompra = montoCompra;
            }
        }
    }

    processAuctionInfo(info, normalizedInfo) {
        //Obtener el monto minimo de la postura
        if (!this.caso.montoMinimo) {
            const montoMinimo = this.obtainMontoMinimo(normalizedInfo);
            if (montoMinimo) {
                console.log(`-----------------\nPrecio minimo de subasta: ${montoMinimo}\n-----------------`);
                this.caso.montoMinimo = montoMinimo;
            }
        }

        //Obtener el tipo de participacion para la subasta (VV o cupon).
        if (!this.caso.formatoEntrega) {
            const formatoEntrega = getFormatoEntrega(info);
            if (formatoEntrega) {
                this.caso.formatoEntrega = formatoEntrega ? formatoEntrega[0] : null;
            }
        }

        //Obtener el porcentaje de participacion
        if (!this.caso.porcentaje) {
            const percentage = this.getAndProcessPercentage(info);
            if (percentage) {
                console.log(`-----------------\nporcentaje: ${percentage}\n-----------------`);
                this.caso.porcentaje = percentage ? percentage : null;
            }
        }

        //Obtener si el inmueble rematado es un tipo de derecho.
        if (!this.caso.tipoDerecho) {
            const resultadoDerecho = this.obtainTipoDerecho(normalizedInfo);
            if(resultadoDerecho){
                    console.log(`-----------------\ntipoDerecho: ${resultadoDerecho}\n-----------------`);
                    this.caso.tipoDerecho = resultadoDerecho;
            }
        }

        //Obtener la deuda hipotecaria si se encuentra
        if(!this.caso.deudaHipotecaria){
            if(this.checkIfTextHasHipoteca(normalizedInfo)){
                const deuda = this.obtainDeudaHipotecaria(normalizedInfo);
                if(deuda){
                    console.log(`-----------------\nDeuda : ${deuda}\n-----------------`);
                    this.caso.deudaHipotecaria = deuda;
                }
            }
        }
    }

    obtainTipoDerecho(normalizedInfo){
        if (regexMutuoHipotecario.exec(normalizedInfo)) {
            // Si el texto es un mutuo hipotecario no se puede obtener claramente si es un derecho o no
            return;
        }
        // En caso de que el texto leido sea un diario primero se debe individualizar cada publicacion
        const textoRemate = this.splitTextFromPaper(normalizedInfo);
        for (const text of textoRemate) {
            if (textoRemate.length > 1) {
                if (!text.includes(this.caso.causa.toLowerCase())) {
                    continue;
                }
            }
            const tipoDerecho = getTipoDerecho(text);

            if (tipoDerecho) {
                return tipoDerecho;
            }
        }

        return null;
    }

    //Busca el anno de compra del inmueble
    obtainBuyYear(texto){
        //Busca el anno por "adquirio por compra"
        let anno = this.obtainYearForm1(texto);
        if(anno) {
            return anno;
        }
        //Busca el anno por "con fecha"
        anno = this.obtainYearnForm2(texto);
        if(anno) {
            return anno;
        }
        //Busca el anno por "registro de propiedad del año", osea por el conservador.
        anno = this.obtainFromConservador(texto);
        if(anno){
            return anno;
        }
        //Busca el anno por "inscripcion al año"
        anno = this.obtainYearFromInscripcion(texto);
        if(anno){
            return anno;
        }
        return null;
    }

    obtainYearForm1(text) {
        const regexStartBuy = /(adquirio\s*por\s*compra)|(adquiried\s*por\s*compra)/i;
        const startText = regexStartBuy.exec(text);
        let anno;
        if (!startText) {
           return null; 
        }
        let newText = text.substring(startText.index);
        
        const newStart = /del\s*ano/i;
        let startAno = newStart.exec(newText);
        if (!startAno) {
            const newStart2 = /del\s*afio/i; // Se agrego esta segunda terminacion pensando en variaciones leidas con tesseract
            startAno = newStart2.exec(newText);
            if (!startAno) {
                return null;
            }
        }
    
        newText = newText.substring(startAno.index);
  
        const regexEndBuy = /,\s*otorgada/i;
        const endText = regexEndBuy.exec(newText);
        if (!endText) {
           return null; 
        }
        const endIndex = endText.index;
        newText = newText.substring(0, endIndex)
        anno = convertWordToNumbers(newText);
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
        const annoRegex = /\d{4}/i;
        const anno = newText.match(annoRegex);
        if (anno) {
            return anno[0];
        }
    }

    obtainFromConservador(texto){
        const registroRegex = /registro\s*(?:de)?\s*propiedad\s*(?:del?\s*)?(?:a(?:n|ñ|fi)o\s*)?(\d{4})/i;
        let registro = texto.match(registroRegex);
        if (registro != null) {
            return registro[1];
        }
        return null;
    }

    obtainYearFromInscripcion(texto){
        const regexInscripcion = /inscripcion\s*.*al\s*ano\s*(\d{4})/i;
        let registro = texto.match(regexInscripcion);
        if(registro){
            return registro[1];
        }
        return null;
    }

    
    obtainMontoCompra(text) {
        if (!text.includes("inscripci")) {
            // Solo se obtiene el monto de compra de la inscripcion
            return null;
        }
        //Preprocesar el texto para eliminar cosas que no son necesarias
        text = this.preProcessText(text);
        // Funcion que busca: por el precio de
        let monto = this.searchByPorCompra(text);
        if (monto) {
            return this.processMonto(monto);
        }
        // Funcion que busca: precio de compraventa
        monto = this.searchByCompraVenta(text)
        if (monto) {
            return this.processMonto(monto);
        }
        // Funcion que busca por: Adquirio la propiedad
        monto = this.searchByAdquirio(text);
        if(monto){
            return this.processMonto(monto);
        }
        // Funcion que busca por: por la suma
        monto = this.searchByPorLaSuma(text);
        if(monto){
            return this.processMonto(monto);
        }
        // Este hay que siempre dejarlo al final, ya que es el "peor" porque es un aporte de una sociedad
        monto = this.searchByEstimacion(text);
        if (monto) {
            return this.processMonto(monto);
        }
        return null;
    }

    obtainMontoMinimo(info){
        const textoRemate = this.splitTextFromPaper(info);
        for (const text of textoRemate) {
            if (textoRemate.length > 1) {
                if (!text.includes(this.caso.causa.toLowerCase())) {
                    continue;
                }
            }
            const montoMinimo = getMontoMinimo(text);
            if (montoMinimo) {
                console.log(`-----------------\nmontoMinimo: ${montoMinimo}\n-----------------`);
                return montoMinimo;
            }
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

    //Procesa el monto cuando viene en formato de texto y devuelve un numero con su tipo de moneda.
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
            if (matchedNumber) {
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
        const startRegex = /precio\s*de(\s*la)?\s*compraventa/i;
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

    searchByAdquirio(text){
        const regexAdquirio = /adquirio\s*la\s*propiedad/i;
        const matchedAdquirio = regexAdquirio.exec(text);
        if (!matchedAdquirio) {
            return null;
        }
        let newText = text.substring(matchedAdquirio.index);
        const regexCompraventa = /compraventa/i;
        const matchedEnd = regexCompraventa.exec(newText);
        if (!matchedEnd) {
            return null;
        }
        newText = newText.substring(0, matchedEnd.index);
        return newText;
    }

    searchByPorLaSuma(text){
        const regexSuma = /por\s*la\s*suma/i;
        const matchedAdquirio = regexSuma.exec(text);
        if (!matchedAdquirio) {
            return null;
        }
        let newText = text.substring(matchedAdquirio.index);
        const regexCompraventa = /,/i;
        const matchedEnd = regexCompraventa.exec(newText);
        if (!matchedEnd) {
            return null;
        }
        newText = newText.substring(0, matchedEnd.index);
        return newText;
    }

    searchByEstimacion(text) {

        const indexPrice = /se\s*estiman?(?:\s*en)/i;
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
        // console.log("------------\nbuyers: ", buyers, "\n------------");
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



    // Funcion para revisar si el texto actual hara referencia a una deuda hipotecaria o no.
    checkIfTextHasHipoteca(info){
        // console.log(`Buscando si en el texto esta como deuda hipotecaria: ${info}`);
        if(regexMutuoHipotecario.exec(info) || info.includes('mutuo')){
            return true;
        }
        if(info.includes("prestamo")){
            // console.log("No valido para deuda por prestamo");
            return false;
        }
        if(info.includes("hipoteca")){
            return true;
        }
        if(info.includes("pagare")){
            // console.log("no valido para deuda por pagare");
            return false;
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
        // console.log("------------\nBuscando deuda hipotecaria");
        let newText = this.trimTextHipotecario(info);
        if(!newText){
            return null;
        }
        const regexNumber = "(\\d{1,}|\\d{1,3}(\\.\\d{1,3})*),?(\\d{1,})?"
        const regexUF = "(u\\.?[fe]\\.?|unidades?\\s*de\\s*fomento)"
        const regexDeudaUF = new RegExp(`(${regexNumber}\\s*(-\\s*)?${regexUF}|${regexUF}\\s*${regexNumber})`, "gi")
        const matchNumero = newText.match(regexDeudaUF);
        if(matchNumero){
            deuda = this.checkBiggerDebt(matchNumero)
            if(deuda.includes("ue")){
                deuda = deuda.replace("ue","uf");
            }
            return deuda;
        }

        const regexDeudaPesos = new RegExp(`(\\$\\s*${regexNumber}|${regexNumber}\\s*(?:de\\s*)?pesos)`)
        const matchMontoPesos = regexDeudaPesos.exec(newText);
        if(matchMontoPesos){
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

    

    findValueGeneric(info, normalizedInfo, lambda){
        const textRemate = this.splitTextFromPaper(normalizedInfo);
        if (textRemate.length === 1) {
            // console.log("Buscando en singular")
            const value = lambda(info,normalizedInfo);
            if (value) {
                return value;
            }
        }else{
            // console.log("Buscando en plural")
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

    normalizeSpanish(info){
        return info
            .toLowerCase()
            .replace(/[\n\r]/g, " ")
            .replace(/\s+/g, " ")
            .replace(/−/g, "-");
    }

    splitTextFromPaper(info) {
        const regexMonto = /remate\s*judicial/gi;
        let matchedRemate;
        let lastStart = 0;
        const textoFinal = [];
        if(info.includes("economicos") || info.includes("económicos")){
            return [];
        }
        if(!regexMonto.test(info)) {
            // Si no se encuentra remate judicial se asume que es solo un texto
            // return [];
            return [info];
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
        if(info.includes('demanda')){
            return null;        
        }
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

    //Busca el estado civil
    //TODO: aun no esta funcionando porque es necesario averiguar bien el comprador
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

    //Busca si el matrimonio encontrado tiene un explicito
    //separacion de bienes, conyugal, regimen comuna
    //TODO: agregar mujer casada con el articulo 150
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

    //Obtiene el rol del bien raiz del documento de avaluo fiscal
    obtainRolPropiedad(info) {
        if(!info) return null;
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

    //Obtiene el avaluo fiscal del documento avaluo fiscal
    // se ocupa para obtener el avaluo de habitacion, estacionamineto, bodega
    obtainAvaluoPropiedad(info) {
        let avaluoType = this.obtainTipo(info) ? this.obtainTipo(info) : '';
        const regexAvaluo = /avaluo\stotal\s*:\$(\d{1,3}.?)*/g;
        const avaluoMatch = info.match(regexAvaluo);
        if (avaluoMatch) {
            const avaluo = avaluoMatch[0].match(/(\d{1,3}.?)+/);
            const avaluoNumber = avaluo[0].replace(/\./g, '');
            return {
                "tipo": avaluoType,
                "avaluo": avaluoNumber.trim()
            };
        } else {
            return null;
        }
    }

    //Obtiene el tipo de bien raiz del documento de avaluo fiscal
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
        //No se obtiene la comuna de la inscripcion porque en esta aparecen varias comunas
        //Del comprador, vendedor, inmobiliaria, juzgado, etc
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

    //Funcion para obtener la direccion
    //Esta funcion esta pensada para funcionar con textos de avaluo fiscal
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

    obtainAnno(info){
        if(!info) return null;
        if (!regexMutuoHipotecario.exec(info) ) {
            const GPnormalizedInfo = this.adaptTextIfGP(info);
            if (!GPnormalizedInfo) {
                // console.log("No se obtiene el ano del GP");
                return null;
            }
            const anno = this.obtainBuyYear(GPnormalizedInfo);
            if (anno) {
                console.log(`-----------------\nanno: ${anno}\n-----------------`);
                return anno;
            }
        }
        return null;
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

    //Revisa si el texto leido es un diario, esto lo realiza buscando si son publicaciones
    //de remate y para eso busca si la palabra remate aparece mas de 6 veces.
    checkIfDiario(info){
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

    //This function will check if the case is complete, if it is the process end
    isCaseComplete() {
        if (
            this.caso.estadoCivil
            && this.caso.direccion
            && this.caso.comuna
            && this.caso.rolPropiedad
            && this.caso.avaluoPropiedad
            && this.caso.rolEstacionamiento
            && this.caso.avaluoEstacionamiento
            && this.caso.rolBodega
            && this.caso.avaluoBodega
            && this.caso.anno
            && this.caso.actualDebt
            && this.caso.montoCompra
        ) {
            return true;
        }
        return false
    }
}

    function obtainComunaByIndex(info) {
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