
class PjudPdfData{
    constructor(caso){
        this.caso = caso;
    }

    processInfo(item){
        const normalizeInfo = this.normalizeInfo(item);
        // Check if all the posible variables that can be obtain by pdf's is already donde
        if (this.isCaseComplete()) {
            console.log("Caso completo");
            return true;
        }

        if(!this.caso.estadoCivil){
            const civilStatus = this.obtainCivilStatus(normalizeInfo);
            console.log("Estado civil identificado: ", civilStatus);
            this.caso.estadoCivil = civilStatus;
        }

        if(!this.caso.rolPropiedad){
            const rolPropiedad = this.obtainRolPropiedad(normalizeInfo);
            console.log("Rol propiedad identificado: ", rolPropiedad);
            if(rolPropiedad){
                if (!rolPropiedad.tipo.includes("estacionamiento")) {
                    this.caso.rolPropiedad = rolPropiedad.rol;
                }
            }
        }
        
        if(!this.caso.avaluoPropiedad){
            const avaluoPropiedad = this.obtainAvaluoPropiedad(normalizeInfo);
            if(avaluoPropiedad){
                if (!avaluoPropiedad.tipo.includes("estacionamiento")) {
                    this.caso.avaluoPropiedad = avaluoPropiedad.avaluo;
                }
            }
        }

        if(!this.caso.comuna){
            const comuna = this.obtainComuna(normalizeInfo);
            console.log("Comuna identificada: ", comuna);
            this.caso.comuna = comuna ? comuna : this.caso.comuna;
        }

        if(!this.caso.direccion){
            const direccion = this.obtainDireccion(normalizeInfo);
            console.log("Direccion identificada: ", direccion);
            if(direccion){
                if (!direccion.tipo.includes("estacionamiento")) {
                    this.caso.direccion = direccion.direccion;
                }
            }

        }



        return false;
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
        const regexSeparacion = /separacion\sde\sbienes/i;
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

    obtainComuna(info){
        // console.log("info en comuna: ", info);
        let comuna = this.obtainComunaByIndex(info);
        if(comuna){
            return comuna;
        }
        comuna = this.obtainComunaByregex(info);
        if(comuna){
            return comuna;
        }
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

    //This function will check if the case is complete, if it is the process end
    isCaseComplete(){
       if(this.caso.estadoCivil 
            && this.caso.rolPropiedad 
            && this.caso.direccion
            && this.caso.comuna
            && this.caso.avaluoPropiedad
            ){
                return true;
            }
            return false
    }
}

module.exports = PjudPdfData;
// && this.caso.isBienFamiliar
// && this.caso.anno