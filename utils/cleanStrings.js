
function cleanInitialZeros(cadena) {
    // Encuentra el primer índice donde el carácter no es '0'
    let indice = 0;
    cadena = cadena.replace(/\s*/g,"")
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

function fixStringDate(string){
    if(!string){
        return null;
    }
    if(string.includes('-')){
        const parts = string.split('-');
        if(parts.length === 3){
            return string.replace(/-/g, '/');
        }
    }

    return string;
}

module.exports = {
    cleanInitialZeros,
    fixStringDate
};