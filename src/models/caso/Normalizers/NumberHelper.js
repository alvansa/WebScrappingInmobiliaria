
class NumberHelper{
    static deudaHipotecaria(deuda){
        if(!deuda){
            return null;
        }
        if(typeof deuda === 'number'){
            return deuda;
        }
        deuda = deuda
            .replace(/unidades\s*de\s*fomento/i,"")
            .replace(/\$/,"")
            .replace(/u\.?f\.?/i,"")
            .replace(/\s*/,"")
            .replace(/-/,"")
            .replace(/\./g,"")
            .replace(",",".");
        const regexNumber = /(\d{1,}(?:\.\d+)?)(\b|,)/;
        const matchedRegex = deuda.match(regexNumber);
        if(matchedRegex){
            return Number(matchedRegex[0]);
        }
    }
}

module.exports = NumberHelper;