
function extractYear(data, isDebug) {
    // Busca el año con dependencia de las fojas, "fojas xxxx del año xxxx"
    // console.log("Data en getAnno: ", data);
    const regexFojasDependiente = /(?:fojas?|fs\.?|fjs).{1,200}?(?:del?|a[n|ñ]o)\s*(\b\d{1}(?:\.\d{3})?(?:\b|,)|\d{1,4})/i;
    
    const fojasDependiente = data.match(regexFojasDependiente);
    if (fojasDependiente != null) {
        const anno = parseInt(fojasDependiente[1].replaceAll(".",""));
        if(anno > 1700) {
            return anno;
        }
    }
    // Busca el año con dependencia del registro de propiedad con regex "registro de propiedad del? ano? xxxx"
    const registroRegex = /registro\s*(?:de)?\s*propiedad\s*(?:del?\s*)?(?:correspondiente\s*al\s*)(?:a[n|ñ]o\s*)?(\b\d{1}(?:\.\d{3})?(?:\b|,)|\d{1,4})/i;
    let registro = data.match(registroRegex);
    if(isDebug) console.log(`Debio encontrar con registro ${registro}`)
    if (registro != null) {
        return registro[1];
    }
    // Busca el año con dependencia de registro de propiedad hasta encontrar una coma, "registro de propiedad xxxx,", luego devuelve solo el año.
    const dataNormalized = data.toLowerCase();
    let registroFecha = dataNormalized.indexOf('registro de');
    if (registroFecha == -1) {
        registroFecha = dataNormalized.indexOf('reg de propiedad');
    }
    if (registroFecha == -1) {
        registroFecha = dataNormalized.indexOf('registro propiedad');
    }
    if (registroFecha == -1) {
        return null;
    }
    const dataRegistro = dataNormalized.substring(registroFecha);
    let registroFin = dataRegistro.indexOf('.');
    // console.log("Registro fin: ",registroFin);
    if (registroFin == -1) {
        registroFin = dataRegistro.indexOf(',');
    }
    if (registroFin == -1) {
        return null;
    }
    registro = dataRegistro.substring(0, registroFin);
    // console.log("Registro: ",registro);
    const regexAnnoConDecimal = /(\b\d{1}(?:\.\d{3})?\b|\b\d{4}\b)/gi;
    const annoRegistro = registro.match(regexAnnoConDecimal);
    if (annoRegistro != null) {
        return annoRegistro[0];
    }
    console.log("No se encontro el año en el registro de propiedad");
    return null;
}


module.exports = {extractYear};