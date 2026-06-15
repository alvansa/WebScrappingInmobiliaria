
//Este orden de busqueda es intencional, de mayor a menor prioridad
// La demanda es lo primero porque en la demanda puede pedir GP y DV, entonces encuentra primero la demanda
// La TP puede incluir AF y DV también, entonces se busca antes la TP
function processPdfType(pdfType, logData=false) {
    // if(logData) console.log("Procesando tipo de PDF: ", pdfType);
    if(checkDemanda(pdfType)){
        const tipoDemanda = checkDemandaType(pdfType)
        if(tipoDemanda){
            return `Demanda ${tipoDemanda}`;
        }else{
            return 'Demanda';
        }
    }
    if(checkTP(pdfType)){
        return 'TP';
    }
    if(checkAF(pdfType)){
        return 'AF';
    }
    if(checkDV(pdfType)){
        return 'DV';
    }
    if(checkGP(pdfType)){
        return 'GP';
    }
    return null;

}

function checkAF(text){
    const avaluoFiscalKeywords = [
        new RegExp('certificado\\s*de\\s*avaluo\\s*fiscal', 'i'),
    ] 
    for (const keyword of avaluoFiscalKeywords) {
        if (keyword.test(text)) {
            return true;
        }
    }
    return false;
}

function checkDV(text){
    const dominioVigenteKeywords = [
        new RegExp('dominio\\s*vigente', 'i'),
        new RegExp('certificado\\s*de\\s*dominio', 'i'),
        new RegExp('certificado\\s*dominio', 'i'),
    ];
    for (const keyword of dominioVigenteKeywords) {
        if (keyword.test(text)) {
            return true;
        }
    }
    return false;
}

function checkGP(text){
    const GPKeywords = [
        new RegExp('certificado\\s*de\\s*hipotecas\\s*y\\s*gravamenes', 'i'),
        new RegExp('registro\\s*de\\s*hipotecas\\s*y\\s*gravamenes', 'i'),
        new RegExp('libros\\s*de\\s*hipotecas\\s*y\\s*gravamenes', 'i'),
    ];
    for (const keyword of GPKeywords) {
        if (keyword.test(text)) {
            return true;
        }
    }
    return false;
}

function checkDemanda(text){
    const demandaKeywords = [
        new RegExp('demanda\\s*ejecutiva', 'i'),
        new RegExp('demanda\\s*en\\s*juicio', 'i'),
        new RegExp('solicita\\s*la\\s*medida\\s*prejudicial', 'i'),
        new RegExp('juicio\\s*ejecutivo', 'i'),
        new RegExp('se\\s*requiere\\s*judicialmente', 'i'),
    ]
    for (const keyword of demandaKeywords) {
        if (keyword.test(text)) {
            return true;
        }
    }
    return false;
}

function checkDemandaType(text){
    const hipotecarioKeywords = [
        new RegExp('hipotecario', 'i'),
        new RegExp('hipoteca', 'i'),
        new RegExp('cobro\\s*de\\s*mutuo', 'i'),
    ];
    const pagareKeywords = [
        new RegExp('pagar[eé]re', 'i'),
        new RegExp('cobro\\s*de\\s*pagare', 'i'),
    ];
    for (const keyword of hipotecarioKeywords) {
        if (keyword.test(text)) {
            return 'Hipotecario';
        }
    }
    for (const keyword of pagareKeywords) {
        if (keyword.test(text)) {
            return 'Pagare';
        }
    }
}

function checkTP(text){
    const TPKeywords = [
        new RegExp('informe\\s*de\\s*tasacion', 'i'),
        new RegExp('informe\\s*tasacion', 'i'),
        new RegExp('informe\\s*pericial', 'i'),
    ];
    for (const keyword of TPKeywords) {
        if (keyword.test(text)) {
            return true;
        }
    }
    return false;

}

/*
Listado de formas que especfican una TP
    - Evacúa informe
    - Acompaña informe
    - informe peritaje
    - Tiene por evacuado el peritaje	

*/

module.exports = {processPdfType};