function areEqualText(texto1, texto2) {
    // Normalización (opcional, dependiendo de tus necesidades)
    const normalizar = (str) => str.toLowerCase().replace(/\s/g, '');
    
    const texto1Normalizado = normalizar(texto1);
    const texto2Normalizado = normalizar(texto2);
    
    // Verificar si tienen la misma longitud (si no, ya no son iguales)
    if (texto1Normalizado.length !== texto2Normalizado.length) {
        return false;
    }
    
    // Ordenar caracteres y comparar
    const ordenarCaracteres = (str) => str.split('').sort().join('');
    
    return ordenarCaracteres(texto1Normalizado) === ordenarCaracteres(texto2Normalizado);
}

module.exports = {
    areEqualText
};