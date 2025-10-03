const { tribunales2} = require('../../caso/datosLocales.js');

function extractCourt(data) {
    const normalizedData = data
        .toLowerCase()
        .replace(/J\.L\.C/i,"juzgado civil")
        .replace(/jugado/i,"juzgado")
        .replace(/[.\n]/g, ' ')
        .replace(/,/g,'')
        .replace(/de\s+/g, '')
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/'/g,"")
        .replace(/\bstgo\b/g, "santiago")
        .replace(/letras\s+santiago/i, 'civil santiago')
        .replace(/\s+/, ' ');


    let tribunalAceptado = null;

    for (let tribunal of tribunales2) {
        const tribunalNormalized = tribunal
            .toLowerCase()
            .replace(/de\s*/g, '')
            .normalize("NFD")
            .replace(/,/g,"")
            .replace(/[\u0300-\u036f]/g, "");

        const tribunalSinDe = tribunalNormalized.replaceAll("de", '');
        let variaciones = [tribunalNormalized, tribunalSinDe];

        const numeroMatch = tribunal.match(/\d{1,2}/);
        if (numeroMatch) {
            const numero = parseInt(numeroMatch[0]);
            const ordinalForm = convertirANombre(numero);

            const simbolosOrdinales = ['°', 'º', ''];

            const bases = [
                tribunalNormalized,
                tribunalNormalized.replace('juzgado', 'tribunal')
            ]

            ordinalForm.push(numero.toString());
            for (const base of bases) {
                ordinalForm.forEach((form) => {
                    simbolosOrdinales.forEach((simbolo) => {
                        variaciones.push(base.replace(/\d{1,2}°/, `${form}${simbolo}`)); // 3°
                        variaciones.push(base.replace(/\d{1,2}°/, `${form}`)); // tercero
                        variaciones.push(base.replace(/\d{1,2}°/, `${form} ${simbolo}`)); // 3 °
                        variaciones.push(base.replace(/\d{1,2}°\s*/, `${form}${simbolo}`)); // 3°juzgado
                    });
                    variaciones.push(base.replace(/\s+/g, '')); // 3°juzgado
                });
            }

            // Incluye variaciones donde en un juzgado de letras no se haya escrito la palabra "letras"
            variaciones = variaciones.flatMap(variation => {
                if(variation.includes("letras ")) {
                    return [variation,variation.replace("letras ", "").trim()];
                }
                return variation;
            })

            // if(tribunal.includes("14° JUZGADO CIVIL DE SANTIAGO")) {
            //     console.log("Tribunal encontrado: ", variaciones);
            // }

            if (tribunalNormalized.includes("en lo civil")) {
                variaciones.push(...variaciones.map(variation => variation.replace("en lo civil ", "")));
            }
        }
        if(variaciones.some(variation => normalizedData.includes(variation))) {
            tribunalAceptado = tribunal;
        }

    }
    return tribunalAceptado;
}

function convertirANombre(number) {
    const ordinalForm = {
        1: ["primer"],
        2: ["segundo"],
        3: ["tercer"],
        4: ["cuarto"],
        5: ["quinto"],
        6: ["sexto"],
        7: ["septimo"],
        8: ["octavo"],
        9: ["noveno"],
        10: ["decimo"],
        11: ["undecimo", "decimoprimero", "decimo primero"],
        12: ["duodecimo", "decimosegundo", "decimo segundo"],
        13: ["decimotercero", "decimo tercero", "decimotercer", "decimo tercer"],
        14: ["decimocuarto", "decimo cuarto"],
        15: ["decimoquinto", "decimo quinto"],
        16: ["decimosexto", "decimo sexto"],
        17: ["decimoseptimo", "decimo septimo"],
        18: ["decimoctavo", "decimo octavo"],
        19: ["decimonoveno", "decimo noveno"],
        20: ["vigesimo"],
        21: ["vigesimoprimero", "vigesimo primero", "vigesimo primer"],
        22: ["vigesimosegundo", "vigesimo segundo"],
        23: ["vigesimotercero", "vigesimo tercero", "vigesimo tercer", "vigesimotercer"],
        24: ["vigesimocuarto", "vigesimo cuarto"],
        25: ["vigesimoquinto", "vigesimo quinto"],
        26: ["vigesimosexto", "vigesimo sexto"],
        27: ["vigesimoseptimo", "vigesimo septimo"],
        28: ["vigesimoctavo", "vigesimo octavo"],
        29: ["vigesimonoveno", "vigesimo noveno"],
        30: ["trigesimo"],
        31: ["trigesimoprimero", "trigesimo primero"],
        32: ["trigesimosegundo", "trigesimo segundo"],
        33: ["trigesimotercero", "trigesimo tercero"],
        34: ["trigesimocuarto", "trigesimo cuarto"],
        35: ["trigesimoquinto", "trigesimo quinto"],
        36: ["trigesimosexto", "trigesimo sexto"],
        37: ["trigesimoseptimo", "trigesimo septimo"],
        38: ["trigesimoctavo", "trigesimo octavo"],
    }

    // Verificar que el número está dentro del rango válido
    if (number >= 1 && number <= 38) {
        return ordinalForm[number]; // Ajuste para que el índice coincida con el número
    } else {
        return null; // Si el número está fuera del rango de 1 a 40
    }
}


// Si no se encuentra el juzgado de la lista, se busca si es un juez partidor
function extractPartitionJudge(data) {
    const juezRegex = /partidor|particion|partición|Árbitro|árbitro|judicial preventivo|arbitro|arbitral/i;
    const juez = data.match(juezRegex);
    if (juez != null) {
        return true;
    } else {
        return false;
    }
}

module.exports = {extractCourt, extractPartitionJudge}