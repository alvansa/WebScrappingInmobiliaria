
// Obtiene la fecha del remate.
function extractAuctionDate(data) {
    if(!data) return null;
    
    const regexs = [
        /(\d{1,2})º?\s*(de\s+)?(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\s*(del?\s+)?(año\s+)?(\d{4}|\d{1,3}(\.\d{1,3}))/i,
        /(lunes|martes|miércoles|jueves|viernes|sábado|domingo)?\s*([a-zA-Záéíóú]*\s+)(de\s+)?(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)(\s+de)\s+(dos mil (veinticuatro|veinticinco|veintiseis|veintisiete|veintiocho|veintinueve|treinta|treinta y uno)?)?/i,
        /(?:rematar[a|á])?\s*el\s*(?:d[i|í]a\s*)?(\d{1,2}\/\d{1,2}\/\d{4})/i,
        /(\d{1,2}-\d{1,2}-\d{4})\s*a\s*las\s*\d{1,2}:\d{1,2}/i,
    ];
    for (let regex of regexs) {
        const fechaRemate = data.match(regex);
        if (fechaRemate) {
            return fechaRemate[0];
        }
    }

    const regexFechaSinAnno = /rematar[a|á]\s*(\d{1,2}\s*de\s*(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre))/i;
    const fechaRemate = data.match(regexFechaSinAnno);  
    if (fechaRemate) {
        const anno = new Date().getFullYear().toString();
        const fechaConAnno = fechaRemate[1] + ' de ' + anno;
        return fechaConAnno;
    }
    return null;
}

module.exports = {extractAuctionDate}