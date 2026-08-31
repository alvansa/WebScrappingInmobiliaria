const MESES = 'enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre';
const DIAS_SEMANA = 'lunes|martes|mi[eé]rcoles|jueves|viernes|s[aá]bado|domingo';
const ANNO_PALABRAS = 'dos mil (?:veinti(?:cuatro|cinco|s[eé]is|siete|ocho|nueve)|treinta(?: y (?:uno|dos|tres|cuatro|cinco))?)';

// group: de qué grupo sale la fecha (0 = match completo)
const PATTERNS = [
    // "Fecha del remate: 15/09/2026"  |  "fecha de remate 15-09-2026"
    { re: /fecha\s+(?:d[eé]l?\s+)?remate\s*[:.-]?\s*(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/i, group: 1 },

    // "se rematará el día 15/09/2026"  |  "el 15/09/2026"
    { re: /\bel\s+(?:d[ií]a\s+)?(\d{1,2}\/\d{1,2}\/\d{4})\b/i, group: 1 },

    // "15-09-2026 a las 12:00"
    { re: /(\d{1,2}-\d{1,2}-\d{4})\s*a\s*las\s*\d{1,2}[:.]\d{2}/i, group: 1 },

    // "...15/09/2026 ... rematará"
    { re: /(\d{1,2}\/\d{1,2}\/\d{4})[a-zñ,:\s\d]{1,20}rematar[aá]/i, group: 1 },

    // "remate día 15/09/2026"
    { re: /remate\s*d[ií]a\s*(\d{1,2}\/\d{1,2}\/\d{4})/i, group: 1 },

    // "remate 15/09/2026"
    { re: /remate\s*(\d{1,2}\/\d{1,2}\/\d{4})/i, group: 1 },

    // "14 octubre 2025" | "21 de octubre de 2025" | "21 de octubre del año 2025"
    { re: new RegExp(`\\d{1,2}º?\\s*(?:de\\s+)?(?:${MESES})\\s*(?:del?\\s+)?(?:año\\s+)?\\d{4}`, 'i'), group: 0 },

    // "14 octubre 2025" | "21 de octubre de 2025" | "21 de octubre del año 2025"
    { re: new RegExp(`\\d{1,2}º?\\s*(?:de\\s+)?(?:${MESES})`, 'i'), group: 0 },

    // "veinticinco de septiembre de dos mil veinticinco"
    { re: new RegExp(`(?:(?:${DIAS_SEMANA})\\s+)?[a-zñáéíóú]+\\s+de\\s+(?:${MESES})\\s+de\\s+${ANNO_PALABRAS}`, 'i'), group: 0 },

    // [DIA] DD/MM/YYYY
    { re: new RegExp(`\\b(?:${DIAS_SEMANA})\\s*,?\\s*(\\d{1,2}\\/\\d{1,2}\\/\\d{4})`, 'i'), group: 1 },

    // "rematara 15/09/2026"
    { re: /rematar[aá]\s*(\d{1,2}\/\d{1,2}\/\d{4})/i, group: 1 },

    // subastara 15/09/2026 | subastara 15-09-2026 
    { re: /subastar?[aá]?\s*(\d{1,2}[/-]\d{1,2}[/-]\d{4})/i, group: 1 },
];

// Solo día y mes (sin año) -> se asume el año en curso
const PATTERN_SIN_ANNO = new RegExp(`rematar[aá]\\s*(\\d{1,2}\\s*de\\s*(?:${MESES}))`, 'i');

function limpiar(html) {
    return String(html)
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/gi, ' ')
        .replace(/&deg;|&ordm;/gi, 'º')
        .replace(/\s+/g, ' ')
        .replace(/\b(\d{1,3})\.(\d{3})\b/g, '$1$2')
        .trim();
}

function fechaNumericaValida(txt) {
    const matched = txt.match(/(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})/);
    if (!matched) return true; // fechas en palabras no se validan aquí
    let [, dia, mes, anno] = matched.map(Number);
    anno = anno < 100 ? 2000 + anno : anno;
    const dt = new Date(anno, mes - 1, dia);
    return dt.getFullYear() === anno && dt.getMonth() === mes - 1 && dt.getDate() === dia;
}

/**
 * Extrae la fecha del remate desde texto/HTML libre.
 * @returns {string|null} la expresión de fecha encontrada (sin normalizar)
 */
function extractAuctionDate(data) {
    if (!data || typeof data !== 'string') return null;
    const texto = limpiar(data);

    for (const { re, group } of PATTERNS) {
        const matched = texto.match(re);
        if (matched && matched[group] && fechaNumericaValida(matched[group])) {
            return matched[group].replace(/\s+/g, ' ').trim();
        }
    }

    const matched = texto.match(PATTERN_SIN_ANNO);
    if (matched) return `${matched[1].replace(/\s+/g, ' ').trim()} de ${new Date().getFullYear()}`;

    return null;
}

module.exports = { extractAuctionDate };
