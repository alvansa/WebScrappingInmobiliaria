
function extractDirection(data) {
    const dataNormalizada = data
        .replace(/(\d+)\.(\d+)/g, '$1$2')
        // .replace(/registro\s*(?:de\s*)?propiedad\s*/i," ")    
        .toLowerCase();
    // console.log("Data minuscula: ", dataMinuscula);

    const palabrasClave = ['propiedad', 'inmueble', 'departamento', 'casa', 'parcela'];
    const regexComuna = /comuna(?:\s*de)?\s*\w{1,}/i;
    const regexEndByRegion = /regi[oó]n\s*de\s*\w{1,}/i;
    const regexConservador = /del\s*conservador\s*de\s*bienes\s*ra[ií]ces/i
    const regexPunto = /\./i;
    const direcciones = [];
    let direccionFinal;

    const regexFinales = [
        regexEndByRegion,
        regexComuna,
        regexConservador,
        regexPunto
    ]

    for (let palabra of palabrasClave) {
        const regex = new RegExp(`(?<!registro de )${palabra}`, 'g');
        const match = regex.exec(dataNormalizada);

        if (!match) {
            continue;
        }

        const index = match.index;
        const matchedLength = match[0].length
        if (isPrecededByExclusion(dataNormalizada, index, matchedLength)) {
           continue;
        }

        const direccionTemporal = dataNormalizada.substring(index);
        for(let regex of regexFinales){
            direccionFinal = obtainFinalDirection(direccionTemporal, regex)
            if(direccionFinal){
                return direccionFinal
            }
        }


        // direccionFinal = obtainFinalDirection(direccionTemporal, regexEndByRegion);

        // const indexComuna = obtainIndexByRegex(direccionTemporal, comuna)
        // if(indexComuna){
        //    direccionFinal = direccionTemporal.substring(0,indexComuna); 
        //    return adaptDirectionToExcel(direccionFinal);
        // }

        // const indexConservador = obtainIndexByRegex(direccionTemporal,regexConservador);
        // if(indexConservador){
        //    direccionFinal = direccionTemporal.substring(0,indexConservador); 
        //    return adaptDirectionToExcel(direccionFinal);
        // }

        // const indexPunto = obtainIndexByRegex(direccionTemporal, regexPunto);
        // if(indexPunto){
        //    direccionFinal = direccionTemporal.substring(0,indexPunto); 
        //    return adaptDirectionToExcel(direccionFinal);
        // }
    }

    if (direcciones.length > 0) {
        return direcciones.at(-1);
    }

    return null;
}

//Funcion que dado un index del texto revisara que sea valida y si es asi devuelve la direccion a escribir, 
//En caso de que no lo sea devuelve false;
function obtainFinalDirection(text, regex){
    let direccionFinal;
    const index = obtainIndexByRegex(text, regex)
    if (!index) {
        return false
    }
    direccionFinal = text.substring(0, index);
    if(direccionFinal.length < 60){
        return false;
    }
    return adaptDirectionToExcel(direccionFinal);
}

function obtainIndexByRegex(text,regex){
    const matchedRegex = text.match(regex);
    if(matchedRegex){
        return (matchedRegex.index + matchedRegex[0].length);
    }else{
        return null;
    }
}
// Funcion para asegurarse que el texto sea valido para buscar direccion
// Devuelve true si encuentra exclusion y el texto no es valido
function isPrecededByExclusion(texto, currentIndex, indexLength) {
    const preExclusiones = ['registro de ', 'conservador de ', 'oficina de', 'cbr de','registro '];
    const postExclusiones = [' será subastado', ' sera subastado', ' a subastarse'];
    const textLength = texto.length;
    for (const exclusion of preExclusiones) {
        const exclusionLength = exclusion.length;
        
        // Verificar si hay suficiente texto antes para contener la exclusión
        if (currentIndex >= exclusionLength) {
            const textoPrevio = texto.substring(currentIndex - exclusionLength, currentIndex);
            if (textoPrevio === exclusion) {
                return true; 
            }
        }
    }
    for (const exclusion of postExclusiones) {
        const exclusionLength = exclusion.length;
        
        // Verificar si hay suficiente texto antes para contener la exclusión
        if ((textLength - currentIndex) >= exclusionLength) {
            const textoPost = texto.substring(currentIndex + indexLength , currentIndex + indexLength + exclusionLength );
            if (textoPost === exclusion) {
              console.log("texto post: ", textoPost,exclusion)
                return true; 
            }
        }
    }  
    return false;
}

function adaptDirectionToExcel(direction){
    let finalDirection = direction;
    const regexEstacionamiento = /derecho\s+de\s+(?:uso\s*(?:,\s*|\s+y\s+)?goc[eé]|goc[eé])(?:\s*(?:,|\s+y\s+|\s*)\s*(?:exclusivo|perpetuo|gratuito|cubierto|accesorio))*(?:\s*(?:,|\s+y\s+))?\s+(?:del?\s+)?estacionamiento\s*/i;
    const matchedEstacionamiento = direction.match(regexEstacionamiento);
    if(matchedEstacionamiento){
        finalDirection = direction.replace(matchedEstacionamiento[0],"Est ");
    }

    return finalDirection
}
module.exports = {extractDirection}