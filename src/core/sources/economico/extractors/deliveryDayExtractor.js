
function extractDeliveryDay(data, isDebug = false) {
    // console.log("Data: ",data);
    const regexDiaEntrega = [
        /vale\s*vista.{1,200}el\s*(d[ií]a\s*\w{1,}\s*\d{1,2}\s*de\s\w{1,}\s*de\s*\d{4},?\s*entre\s*las\s*\d{1,2}:\d{1,2}\s*y\s*las\s*\d{1,2}:\d{1,2}\s*horas)/i,
        // vale vista el dia [numero] de [mes] , entre las [hora] y [hora] horas
        /vale\s*vista.{1,}(a\s*m[aá]s\s*tardar\s*(?:el\s*d[íi]a\s*\w{1,}|a\s*las\s*\d{1,2}:\d{2}\s*horas\s*del\s*d[íi]a\s*h[aá]bil)?\s*anterior\s*a\s*la\s*subasta)/i,
        // vale vista a mas tardar (el dia [dia] | a las [hora] horas del dia habil anterior) anterior a la subasta 
        /vale\s*vista.{1,200}(d[íi]a\s*(?:inmediatamente\s*)?(?:precedente|anterior)\s*.{1,100}\s*(?:subasta|remate)(?:,?\s*entre\s*las\s*\d{1,2}:\d{2}\s*y\s*(?:las\s*)?\d{1,2}:\d{2}\s*horas))/i,
        // vale vista dia inmediateante anterior al remate entre las [hora] y [hora].
        /vale\s*vista.{1,200}(fijado\s*el\s*\d{1,2}\s*(?:de\s*)?\w{1,}\s*(?:de\s*)?\d{2,}(?:,?\s*entre\s*\d{1,2}:\d{2}\s*y\s*\d{1,2}:\d{2}\s*horas))/i,
        // 
        /vale\s*vista.{1,200}(susceptible\s*de\s*ser\s*endosado\s*al\s*momento\s*de\s*la\s*subasta)/i,
        /vale\s*vista.{1,200}entrega\s*material\s*deber[áa]\s*verificarse\s*(el\s*d[ií]a\s*\w{1,}\s*inmediatamente\s*anterior\s*a\s*la\s*fecha\s*de\s*la\s*subasta(?:,?\s*entre\s*las\s*\d{1,2}:\d{2}\s*y\s*(?:las\s*)?\d{1,2}:\d{2}\s*horas)?)/i,
        /vale\s*vista.{1,200}(los\s*d[ií]as\s*martes\s*y\s*jueves,\s*anterior\s*a\s*la\s*realizaci[oó]n\s*de\s*la\s*subasta,\s*seg[uú]n\s*correspondiere,\s*entre\s*las\s*\d{1,2}:\d{2}\s*y\s*las\s*\d{1,2}:\d{2}\s*horas)/i,
        /vale\s*vista.{1,}(con\s*\d{1,2}\s*horas\s*de\s*antelaci[óo]n\s*a\s*la\s*subasta)/i,
        /vale\s*vista.{1,}?(los\s*d[ií]as\s*\w+\s*y\s*\w+.*?entre\s*las\s*\d{1,2}:\d{2}\s*y\s*(?:las\s*)?\d{1,2}:\d{2}\s*horas)/i,
        /(dos|tres|cuatro|cinco|seis|siete)\sdías\shábiles\s(antes)/i,
        /día\s(lunes|martes|miércoles|jueves|viernes)\s(inmediatamente\s)?(anterior\s)(a\sla\sfecha\s)?(de\sla\ssubasta|del\sremate)/i,
        /(?:(?:veinticuatro|cuarenta y ocho|setenta y dos|noventa y seis)\s*horas(\s*[,a-zA-ZáéíóúñÑ-]+){1,8}\s*remate)/i,
        /hasta\s*el\s*día\s*(\w+)\s*de\s*la\s*semana\s*anterior/i,
        /(?<!:|.)\d{2}\s*horas(\s*[,a-zA-ZáéíóúñÑ-]+){1,12}\s*(subasta|remate)/i,
        /((día|dia)\s*(precedente|anterior))\s*(\s*[,a-zA-ZáéíóúñÑ-]+){1,12}\s*(subasta|remate)/i,
        /(?:un|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez)\s*día\s*(hábil(?:es)?\s*)?(?:[,a-zA-ZáéíóúñÑ-]+\s*){1,6}(inmediatamente\s*)?(anteriore?s?)/i,
        /presentar\s*el\s*vale\s*vista\s*el\s*d[ií]a\s*(lunes|martes|miercoles|jueves|viernes|sabado|domingo)\s*\d{1,2}\s*de\s*[a-zA-Záéíóú]{4,10}\s*de\s*\d{4}/gi
    ]
    /*
        /\d\s*días\s*hábiles(\s*[,a-zA-ZáéíóúñÑ-]+){1,12}\s*(subasta|remate)/i,
     */

    for (let regex of regexDiaEntrega) {
        const diaEntrega = data.match(regex);
        if (diaEntrega) {
            if(isDebug) {
                console.log("Econtrado con regex: ",regex,  " y resultado: ", diaEntrega);
                console.log("Dia encontrado: ", diaEntrega[1]);
            }
            
            return diaEntrega[1];
        }
    }
    return null;
}

module.exports = {extractDeliveryDay}