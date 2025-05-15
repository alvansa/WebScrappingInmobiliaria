
class PjudPdfData{
    constructor(caso){
        this.caso = caso;
    }

    processInfo(item){
        const normalizeInfo = this.normalizeInfo(item);
        console.log(`caso base ${this.caso.toObject()}`);
        // Check if all the posible variables that can be obtain by pdf's is already donde
        if (this.isCaseComplete()) {
            console.log("Caso completo");
            return true;
        }

        console.log("caso estado civil: ", this.caso.estadoCivil , "tipo de :", typeof this.caso.estadoCivil);
        if(!this.caso.estadoCivil){
            const civilStatus = this.obtainCivilStatus(normalizeInfo);
            console.log("Estado civil identificado: ", civilStatus);
            this.caso.estadoCivil = civilStatus;
        }

        if(!this.caso.rolPropiedad){
            const rolPropiedad = this.obtainRolPropiedad(normalizeInfo);
            console.log("Rol propiedad identificado: ", rolPropiedad);
            if(rolPropiedad){
                if (rolPropiedad.tipo.includes("habitacional")) {
                    this.caso.rolPropiedad = rolPropiedad.rol;
                }
            }
        }
        
        if(!this.caso.avaluoPropiedad){
            const rolPropiedad = this.obtainAvaluoPropiedad(normalizeInfo);
            this.caso.avaluoPropiedad = rolPropiedad;
        }

        if(!this.caso.comuna){
            const comuna = this.obtainComuna(normalizeInfo);
            console.log("Comuna identificada: ", comuna);
            this.caso.comuna = comuna ? comuna : this.caso.comuna;
        }

        if(!this.caso.direccion){
            const direccion = this.obtainDireccion(normalizeInfo);
            console.log("Direccion identificada: ", direccion);
            this.caso.direccion = direccion ? direccion : this.caso.direccion;
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
        console.log("Texto obtenido del pdf", processItem);
        return processItem;
    }

    obtainCivilStatus(info){
        const regexDivorced = /divorciad[o|a]/i;
        const regexMarried = /casad[o|a]/i;
        const regexSingle = /solter[o|a]/i;
        const regexWidowed = /viud[o|a]/i;

        if(info.match(regexDivorced)) {
            return "Divorciado";
        }else if(info.match(regexMarried)) {
            return "Casado";
        }else if(info.match(regexSingle)) {
            return "Soltero";
        }else if(info.match(regexWidowed)) {
            return "Viudo";
        }

        return null;
    }

    obtainRolPropiedad(info){
        let avaluoType = '';
        const regexTipo = /destino\sdel\sbien\sraiz:\s(\w{1,20})/g;
        let tipoBien = info.match(regexTipo);
        if(tipoBien){
            avaluoType = tipoBien[0];
        }
        else{
            return null;
        }
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
        const regexAvaluo = /avaluo\stotal\s*:\$(\d{1,3}.?)*/g;
        const avaluoMatch = info.match(regexAvaluo);
        if(avaluoMatch){
            const avaluo = avaluoMatch[0].match(/(\d{1,3}.?)+/);
            const avaluoNumber = avaluo[0].replace(/\./g,'');
            return avaluoNumber;   
        }else{
            return null;
        }
    }

    obtainComuna(info){
        const regexComuna = /comuna\s*:\s*(\w{4,15})/g;
        const matchComuna = info.match(regexComuna);
        if(matchComuna){
            console.log("texto identificado en obtainComuna: ",matchComuna)
            const comuna = matchComuna[0].split(" ")[1];
            return comuna;
        }
        return null;
    }

    obtainDireccion(info){
        const startText = "direccion o nombre del bien raiz:";
        const endText = "destino del bien raiz:";
        let startIndex = info.indexOf(startText);
        const endIndex = info.indexOf(endText);
        if(startIndex === -1 || endIndex === -1) {
            return null;
        }
        startIndex += startText.length;
        return info.substring(startIndex,endIndex)
      }

    //This function will check if the case is complete, if it is the process end
    isCaseComplete(){
        // console.log("Caso completo: ", this.caso.toObject());
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