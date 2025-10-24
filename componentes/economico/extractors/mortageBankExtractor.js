const {BANCOS} = require('../../caso/datosLocales');

function extractBankMortage(text,demandPart = null, logData = false){
    let banco;
    let alterText, startText;
    let normalizeText = text
        // .replace(/\.(?!\n|-)/g, '')
        .replace(/\d\.\d/g,'')
        .replace(/\.([\n-\s{2,}])/g, '++')
        .replace(/\n/g, ' ')
        .replace(/\s+/g," ")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\./g, '')
        .toLowerCase();

    let indexHipoteca;

    const listadoInicios = [
        'hipotecas?\\s*:',
        'hipoteca\\s*inscrita',
        'clase\\s*inscripcion\\s*:(\\s*primera)?\\s*hipoteca',
        'hipoteca\\s*constituida\\s*en\\s*favor',
        'hipoteca\\s*en\\s*favor',
        'hipoteca\\s*de\\s*(primer|segundo)\\s*grado'
    ]

    if(logData) console.log("Texto normalizado: ",normalizeText)

    for (let inicio of listadoInicios) {
        const regex = new RegExp(inicio, 'i'); // 'i' para case insensitive
        if (regex.test(normalizeText)) {
            indexHipoteca = normalizeText.search(regex); // search() devuelve el índice
            break;
        }
    }
    if (!indexHipoteca) {
        if (logData) console.log("no se encontro texto inicial")
        return null;
    }

    startText = normalizeText.substring(indexHipoteca)
    if (logData) {
        console.log("valor ",startText)
    } 

    if(demandPart){
        BANCOS.push(demandPart.toLowerCase());
    }

    banco = findBankWithPoint(startText, BANCOS,logData);

    if(banco){
        return banco
    }

    banco = findBankWithAcreedor(startText, BANCOS);

    if(banco){
        return banco
    }
    return null;
}

function findBankWithPoint(text, BANCOS,logData){
    const endIndex = text.indexOf('++');
    if(!endIndex){
        return null;
    }

    const alterText = text.substring(0,endIndex);
    if(logData) console.log(`Texto a buscar el banco: ${alterText}`)
    const banco = searchBank(alterText, BANCOS);
    return banco;

}

function findBankWithAcreedor(text, BANCOS){
    const endRegex = new RegExp('registro\\s*de\\s*interdicciones','i')
    if(!endRegex.test(text)){
        return null;
    }

    const endIndex = text.search(endRegex);
    const alterText = text.substring(0,endIndex);
    const banco = searchBank(alterText, BANCOS);
    return banco;
}

function searchBank(text,BANCOS){
    for(let banco of BANCOS){
        if(text.includes(banco)){
            banco = standarizeName(banco);
            return banco;
        }
    }
}

function standarizeName(name){
    name = name
        .replace('credito e inversiones','BCI')
        .replace('bilbao vizcaya argentaria','BBVA')


    const words = name.split(' ');
    return words.map(word => {
        // Capitalizar primera letra
        return word.charAt(0).toUpperCase() + word.slice(1);
    }).join(' ');
}



module.exports = {extractBankMortage};