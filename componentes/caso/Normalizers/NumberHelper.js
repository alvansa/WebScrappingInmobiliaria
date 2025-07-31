
class NumberHelper{
    deudaHipotecaria(deuda){
        deuda = deuda
            .replace(/unidades\s*de\s*fomento/i,"")
            .replace(/\$/,"")
            .replace(/u\.?f\.?/i,"")
            .replace(/\s*/,"")
            .replace(/-/,"");
        
        const regexNumber = /(\d{1,}(?:\.\d{1,3})*(?:,\d+)?)(\b|,)/;
        const matchedRegex = deuda.match(regexNumber);
        if(matchedRegex){
            return matchedRegex[0];
        }
    }
}