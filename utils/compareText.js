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

function matchJuzgado(str1, str2) {
    if(!str1 && !str2) {
        return true;
    }else if(!str1 || !str2) {
        return false;
    }
    // Normalizar: quitar acentos, símbolos, palabras irrelevantes y convertir a minúsculas
    const normalizar = (str) => {
        return str
            .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Quitar acentos
            .replace(/[º°]/g, '') // Reemplazar º y ° por nada
            // .replace(/[^a-z0-9\s]/g, '') // Quitar otros símbolos
            .replace(/(juzgado|del|letras|de|las|los|civil)/gi, '') // Eliminar palabras comunes
            .replace(/\b(stgo|santiago)\b/gi, 'santiago') // Unificar Santiago
            .replace(/\s+/g, ' ') // Reducir espacios múltiples
            .trim() // Quitar espacios al inicio/fin
            .toLowerCase();
    };

    const normalizado1 = normalizar(str1);
    const normalizado2 = normalizar(str2);
    // console.log(str1, str2, normalizado1 === normalizado2)

    return normalizado1 === normalizado2;
}

function matchRol(baseRol, newRol){
    if(!baseRol || !newRol) return false;
    const listBaseRol = splitPosiblesRol(baseRol);
    const listNewRol = splitPosiblesRol(newRol);
    for(let baseRol of listBaseRol){
        for(let newRol of listNewRol){
            if (baseRol === newRol) {
                return true
            }
        }
    }

    return false;
}

function splitPosiblesRol(rol){
    let listRol = [];
    let finalListRol = [];
    if(rol.includes('//')){
       const splitRol = rol.split('//');
       listRol = [...splitRol];
    }else{
        listRol.push(rol);
    }
    for(let actualRol of listRol){
        const splitedRol = actualRol.split('-');
        splitedRol[0] = splitedRol[0].trim();
        for(let i = 1; i < splitedRol.length; i++){
            splitedRol[i] = splitedRol[i].trim();
            const newRol = splitedRol[0] + '-' + splitedRol[i];
            finalListRol.push(newRol);
        }
    }

    return finalListRol;
}
module.exports = {
    areEqualText,
    matchJuzgado,
    matchRol
};