
const DOMINIO = 0;
const AVALUO = 1;
const GP = 2;

class PjudPdfData{
    constructor(caso){
        this.caso = caso;
    }

    processInfo(item){
        const normalizeInfo = this.normalizeInfo(item);
        console.log(`caso base ${this.caso}`);
        if (this.isCaseComplete()) {
            console.log("Caso completo");
            return true;
        }
        const civilStatus = this.obtainCivilStatus(normalizeInfo);
        const rolPropiedad = this.obtainRolPropiedad(normalizeInfo);

        console.log(`Estado ${civilStatus} Avaluo ${rolPropiedad}`);
        this.caso.estadoCivil = civilStatus ? civilStatus : this.caso.estadoCivil;
        if(rolPropiedad.tipo == "habitacional"){
            this.caso.rolPropiedad = rolPropiedad.rol;
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
            avaluoType = tipoBien;
        }
        else{
            this.caso.tipoBien = null;
        }
        const regexAvaluo = /rol\sde\savaluo\s*(?:numero|:)\s*(\d{1,5}\s*-\s*\d{1,7})/i;
        if(info.match(regexAvaluo)){
            const match = info.match(regexAvaluo);
            if(match && match[1]){
                return {
                    "tipo" : avaluoType,
                    "rol" : match[1],
                };
            }
        }
        else{
            return null;
        }
    }

    //This function will check if the case is complete, if it is the process end
    isCaseComplete(){
       if(this.caso.estadoCivil 
            && this.caso.rolAvaluo 
            && this.caso.direccion
            && this.caso.isBienFamiliar
            && this.caso.comuna
            && this.caso.anno){
                return true;
            }
            return false
    }
}

module.exports = PjudPdfData;