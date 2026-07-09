
function cleanInitialZeros(cadena) {
    // Encuentra el primer índice donde el carácter no es '0'
    let indice = 0;
    cadena = cadena.replace(/\s*/g, "")
    while (indice < cadena.length && cadena[indice] === '0') {
        indice++;
    }
    // Si todos los caracteres son '0', devuelve '0' (o cadena vacía si prefieres)
    if (indice === cadena.length) {
        return '0'; // o return ''; según lo que necesites
    }

    // Devuelve la subcadena desde el primer carácter no cero
    return cadena.substring(indice);
}

function fixStringDate(string) {
    if (!string) {
        return null;
    }
    if (string instanceof Date) {
        return string;
    }
    if (string.includes('-')) {
        const parts = string.split('-');
        if (parts.length === 3) {
            return string.replace(/-/g, '/');
        }
    }

    return string;
}

function stringToDate(fecha, formato = 'DMY') { // formato puede ser 'DMY' o 'YMD'
    if (!fecha) {
        return null;
    }
    if (fecha instanceof Date) {
        return fecha;
    }

    let dia, mes, ano;

    // El formato ISO con 'T' siempre es Año-Mes-Día, lo dejamos fijo
    if (fecha.includes('T')) {
        [ano, mes, dia] = fecha.split('T')[0].split('-');
    } else {
        // Detectamos si usa '/' o '-' de forma dinámica
        const separador = fecha.includes('/') ? '/' : (fecha.includes('-') ? '-' : null);
        
        if (!separador) return null; // Si no tiene un separador válido, salimos

        const partes = fecha.split(separador);

        // Aquí es donde la magia del parámetro decide el orden
        if (formato.toUpperCase() === 'YMD') {
            [ano, mes, dia] = partes;
        } else {
            [dia, mes, ano] = partes; // Por defecto entra aquí (DMY)
        }
    }

    // Corrección segura para años de 2 dígitos (ej: "26" -> "2026")
    if (ano && ano.length === 2) {
        ano = '20' + ano;
    }

    const fechaFinal = new Date(`${ano}/${mes}/${dia}`);
    return isValidDate(fechaFinal) ? fechaFinal : null;
}


function formatDateToDDMMAA(date) {
    if (date instanceof Date == false) {
        return null
    }
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear()).slice(-2);

    return `${day}-${month}-${year}`;
}




function convertDate(dateString, isDev = false) {
    if(!dateString){
        return null;
    }
    let date = stringToDate(dateString);
    if(isDev) console.log("Date after parseSpreadSheeToDate: ",date);   
    if (isValidDate(date)) {
        return date;
    } else {
        date = parseSpanishDate(dateString);
        if (isDev) console.log("Date after parseSpanishDate: ", date);   
        return date;
    }


}

function parseSpanishDate(dateString) {
    if (!dateString || typeof dateString !== 'string') {
        return null;
    }

    // Diccionario de meses en español
    const meses = {
        'ene': 0, 'enero': 0,
        'feb': 1, 'febrero': 1,
        'mar': 2, 'marzo': 2,
        'abr': 3, 'abril': 3,
        'may': 4, 'mayo': 4,
        'jun': 5, 'junio': 5,
        'jul': 6, 'julio': 6,
        'ago': 7, 'agosto': 7,
        'sep': 8, 'septiembre': 8, 'set': 8,
        'oct': 9, 'octubre': 9,
        'nov': 10, 'noviembre': 10,
        'dic': 11, 'diciembre': 11
    };

    // Limpiar y normalizar el string
    const limpio = dateString.toLowerCase().trim();

    // Buscar coincidencias con diferentes formatos
    const formatos = [
        /^(\d{1,2})[-/.](\w{3,})[-/.](\d{4})$/,      // 12-ene-2026, 12/ene/2026
        /^(\d{1,2})\s+de\s+(\w+)\s+del?\s+(\d{4})$/,     // 12 de enero de 2026
        /^(\d{1,2})\s+(\w+)\s+(\d{4})$/,               // 12 enero 2026
    ];

    let dia, mesTexto, año;

    for (const regex of formatos) {
        const match = limpio.match(regex);
        if (match) {
            dia = parseInt(match[1], 10);
            mesTexto = match[2];
            año = parseInt(match[3], 10);
            break;
        }
    }

    if (!dia || !mesTexto || !año) {
        return null;
    }

    // Convertir mes texto a número
    const mesNumero = meses[mesTexto];
    if (mesNumero === undefined) {
        return null;
    }

    // Crear y validar fecha
    const fecha = new Date(año, mesNumero, dia);

    // Validar que la fecha sea válida
    if (isNaN(fecha.getTime()) ||
        fecha.getDate() !== dia ||
        fecha.getMonth() !== mesNumero ||
        fecha.getFullYear() !== año) {
        return null;
    }

    return fecha;
}

function isValidDate(d) {
    return d instanceof Date && !isNaN(d);
}


module.exports = {
    cleanInitialZeros,
    fixStringDate,
    stringToDate,
    formatDateToDDMMAA,
    parseSpanishDate,
    isValidDate,
    convertDate,
};