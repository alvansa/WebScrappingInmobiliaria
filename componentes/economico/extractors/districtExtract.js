const { comunas} = require('../../caso/datosLocales.js');

// Obtiene la comuna del remate a base de una lista de comunas.
function extractDistrict(data, isPjud = false, isDebug = false) {
    // console.log("Data en getComuna:  :)", data);
    const dataNormalizada = data.toLowerCase();
        
    if(isDebug){
        console.log("Data normalizada en el extract district", dataNormalizada)
        console.log("Esta activo el debug ", isDebug)
    }
    // if(isDebug) console.log("Data normalizada en getComuna: ",dataNormalizada);
    const listaPreFrases = [
        "comuna de ",
        "comuna ",
        "comuna y provincia de ",
        "comuna: ",
        // 'en '
    ];
    // if (!isPjud) {
        const listaExtra = [
            "conservador de bienes raíces de ",
            'conservador de bienes raices de ',
            "conservador bienes raíces ",
            "registro de propiedad de ",
            "registro propiedad ",
            "registro propiedad cbr ",
            "Registro de Propiedad del CBR de ",
        ]
        listaPreFrases.push(...listaExtra);
    // }

    for (let preFrase of listaPreFrases) {

        for (let comuna of comunas) {
            comuna = comuna.toLowerCase()
            const comunaPreFrase = preFrase + comuna;
            const regexComuna = new RegExp(`${preFrase}${comuna}(\\b|,|\\s)`, 'i');
            const comunaSinEspacio = comunaPreFrase.replace(/\s*/g, '');

            const fraseNoValida = new RegExp(`domiciliad[oa]\\s*en\\s*la\\s*comuna\\s*de\\s*${comuna}`, 'i');

            // if(comuna === 'rancagua' && isDebug){
            //     console.log("Comuna encontrada: ",regexComuna, regexComuna.test(dataNormalizada));
            //     console.log(`Probadno con comuna ${comuna} y es ${fraseNoValida.test(dataNormalizada)}`);
            // }
            if ((regexComuna.test(dataNormalizada) || dataNormalizada.includes(comunaSinEspacio)) && !fraseNoValida.test(dataNormalizada)) {

                return comuna;
            }
        }
    }

    for (let comuna of comunas) {
        const regexEntreComas = new RegExp(`,\\s*${comuna}\\s*,`, "i");
        if (regexEntreComas.test(dataNormalizada)) {
            return comuna;
        }
    }
    return null;
}

module.exports = {extractDistrict}