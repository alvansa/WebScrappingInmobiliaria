const { extractRightType } = require("./rightTypeExtractor");

function extractDeliveryDay(data) {
    // console.log("Data: ",data);
    const regexDiaEntrega = [
        /día\s*(hábil\s*)?(?:[,a-zA-ZáéíóúñÑ-]+\s*){1,6}(inmediatamente\s*)?(anterior\b)/i,
        /(dos|tres|cuatro|cinco|seis|siete)\sdías\shábiles\s(antes)?/i,
        /día\s(lunes|martes|miércoles|jueves|viernes)\s(inmediatamente\s)?(anterior\s)(a\sla\sfecha\s)?(de\sla\ssubasta|del\sremate)/i,
        /(?:(?:veinticuatro|cuarenta y ocho|setenta y dos|noventa y seis)\s*horas(\s*[,a-zA-ZáéíóúñÑ-]+){1,8}\s*remate)/i,
        /hasta\s*el\s*día\s*(\w+)\s*de\s*la\s*semana\s*anterior/i,
        /(?<!:|.)\d{2}\s*horas(\s*[,a-zA-ZáéíóúñÑ-]+){1,12}\s*(subasta|remate)/i,
        /(el\s*día\s*(precedente|anterior))\s*(\s*[,a-zA-ZáéíóúñÑ-]+){1,12}\s*(subasta|remate)/i,
        /((día|dia)\s*(precedente|anterior))\s*(\s*[,a-zA-ZáéíóúñÑ-]+){1,12}\s*(subasta|remate)/i,
        /\d\s*días\s*hábiles(\s*[,a-zA-ZáéíóúñÑ-]+){1,12}\s*(subasta|remate)/i,
        /(?:un|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez)\s*día\s*(hábil(?:es)?\s*)?(?:[,a-zA-ZáéíóúñÑ-]+\s*){1,6}(inmediatamente\s*)?(anteriore?s?)/i,
        /presentar\s*el\s*vale\s*vista\s*el\s*d[ií]a\s*(lunes|martes|miercoles|jueves|viernes|sabado|domingo)\s*\d{1,2}\s*de\s*[a-zA-Záéíóú]{4,10}\s*de\s*\d{4}/gi
    ]

    for (let regex of regexDiaEntrega) {
        const diaEntrega = data.match(regex);
        if (diaEntrega) {
            return diaEntrega[0];
        }
    }
    return null;
}

module.exports = {extractDeliveryDay}