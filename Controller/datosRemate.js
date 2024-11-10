const { getPaginas, getRemates } = require('../Model/getNextPage.js');
const { comunas, tribunales } = require('../Model/datosLocales.js');
const { Caso } = require('../Model/caso.js');

async function getDatosRemate(fechaHoy,maxDiffDate,maxRetries){
    try {
        let caso
        const casos = await getPaginas(fechaHoy,maxDiffDate);
        for (caso of casos){
            pagina = caso.getLink();
            console.log(pagina);
            const description = await getRemates(pagina,maxRetries);
            caso.darTexto(description);
            
            // console.log("Remates ",pagina,":  obtenido");
        }
        for(let caso of casos){
            const causa = getCausa(caso.getTexto());
            const juzgado = getJuzgado(caso.getTexto());
            const porcentaje = getPorcentaje(caso.getTexto());
            const formatoEntrega = getFormatoEntrega(caso.getTexto());
            const fechaRemate = getFechaRemate(caso.getTexto());
            const montoMinimo = getMontoMinimo(caso.getTexto());
            const multiples = getMultiples(caso.getTexto());
            const comuna = getComuna(caso.getTexto());
            const foja = getFoja(caso.getTexto());

            if (causa != null){
                caso.darCausa(causa[0]);
            }
            if (juzgado != null){
                caso.darJuzgado(juzgado);
            }
            if (porcentaje != null){
                caso.darPorcentaje(porcentaje[0]);
            }
            if (formatoEntrega != null){
                caso.darFormatoEntrega(formatoEntrega[0]);
            }
            if (fechaRemate != null){
                caso.darFechaRemate(fechaRemate[0]);
            }
            if (montoMinimo != null){
                caso.darMontoMinimo(montoMinimo[0]);
            }
            caso.darMultiples(multiples);
            if (comuna != null){
                caso.darComuna(comuna);
            }
            if (foja != null){
                caso.darFoja(foja[0]);
            }
        }
        return casos;
    }
    catch (error) {
        console.error('Error al obtener resultados:', error);
    }
}

//FUNCIONES PARA OBTENER INFORMACION DE LOS REMATES
//crea una funcion que revise en la descripcion a base de regex el juzgado
function getCausa(data) {
    //Anadir C- con 3 a 5 digitos, guion, 4 digitos
    const regex = /C\s*[-]*\s*\d{3,5}\s*-\s*\d{4}|C\s*[-]*\s*\d{1,3}\.\d{3}\s*-\s*\d{4}/i;
    
    const causa = data.match(regex);

    return causa;
}

function getJuzgado(data) {
    
    data = data.toLowerCase();
    for (let tribunal of tribunales){
        tribunal = tribunal.toLowerCase();
        const numero = tribunal.match(/\d{1,2}/);
        let tribunalOrdinal = tribunal;
        let tribunalBolita1 = tribunal;
        if (numero){
            const numeroOrdinal = convertirANombre(parseInt(numero));
            tribunalOrdinal = tribunal.replace(/\d{1,2}°/,numeroOrdinal);
            tribunalOrdinalSinDe = tribunalOrdinal.replace(/de\s+/,'');
            //º
            tribunalBolita1 = tribunal.replace('°', 'º');
        }
        const tribunalSinDe = tribunal.replaceAll("de ",'');
        // const tribunalSinDe = tribunal.replaceAll(/de\s+/,'');
        tribunalBolita1SinDe = tribunalBolita1.replace(/de\s+/,'');
        if (data.includes(tribunal) | data.includes(tribunalOrdinal) | data.includes(tribunalSinDe) | data.includes(tribunalBolita1) | data.includes(tribunalBolita1SinDe) | data.includes(tribunalOrdinalSinDe)){
            // juzgado = tribunal;
            return tribunal;
        } 
    }
    return "N/A";
}

function getPorcentaje(data) {
    //const regex = /\d{1,3}\s*%\s*(del\s+)?(mínimo|valor|precio)+|(garantía|Garantía)\s+(suficiente\s+)?(de\s+)?(\$\s*)?(\d{1,3}.)+(\d{1,3})|(caución\s+)+(interesados\s+)+\d{1,3}\s*%|(garantía|Garantía)\s+(suficiente\s+)?(por\s+)?(el\s+)?\d{1,3}%/;

    // const porcetajeRegex = new RegExp(/\d{1,3}\s*%\s*(?:del\s+)?(?:mínimo|valor|precio)+/.source +
    //     /|(garantía|Garantía)\s+(suficiente\s+)?(de\s+)?(\$\s*)?(\d{1,3}.)+(\d{1,3})/.source +
    //     /|(caución|interesados\s+)([a-zA-ZáéíóúÑñ:\s]*)\d{1,3}\s*%/.source +
    //     /|(garantía|Garantía)\s+(suficiente\s+)?(por\s+)?(el\s+)?\d{1,3}%/.source );
    
    const porcetajeRegex = "/\d{1,3}%/"
    const porcentaje = data.match(porcetajeRegex);

    return porcentaje;
}

function getFormatoEntrega(data) {
    const regex = /(vale\s+)(vista)|(cupón)|(vale a la vista)/i
    const formatoEntrega = data.match(regex);
    return formatoEntrega;
}

function getFechaRemate(data) {
    const regexFechaRemate = new RegExp(/(\d{1,2})\s*(de\s+)?(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)[\s]*((de|del)\s+)?(año\s+)?(\d{4})/i.source +
        /|(lunes|martes|miércoles|jueves|viernes|sábado|domingo)?\s*([a-zA-Záéíóú]*\s+)(de\s+)?(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)(\s+de)\s+(dos mil (veinticuatro|veinticinco|veintiseis|veintisiete|veintiocho|veintinueve|treinta|treinta y uno)?)?/i.source
    , 'i');
    const fechaRemate = data.match(regexFechaRemate);
    return fechaRemate;
}

function getMontoMinimo(data) {
    const regex = /(subasta|mínimo)\s*([a-zA-ZáéíóúÑñ:\s]*)\s+((\$)\s*(\d{1,3}.)+(\d{1,3})|(\d{1,3}.)+(\d{1,3})(,\d{1,10})?\s*(Unidades de Fomento|UF|U.F.)|(Unidades de Fomento|UF|U.F.)\s+(\d{1,3}.)+(\d{1,3})(,\d{1,10})?)/i;
    // (Mínimo\s+)?(subasta\s+)?((\$)\s*(\d{1,3}.)+(\d{1,3})|(\d{1,3}.)*(\d{1,3}),?(\d{1,10})?\s*(?:Unidades de Fomento|U.F.|UF))
    const montoMinimo = data.match(regex);
    return montoMinimo;
}

function getMultiples(data) {
    const regex = /([a-zA-ZáéíóúñÑ])*(propiedades|inmuebles)/;

    const multiples = data.match(regex);
    if (multiples != null) {
        return true;
    }else{
        return false
    }
}

function getComuna(data) {
    
    //let comuna;
    for (let comuna of comunas){
        comunaMinuscula = 'comuna de ' + comuna;
        comunaMayuscula = 'Comuna de ' + comuna;
        if (data.includes(comuna)){
            return comuna;
        }
    }
    return "N/A";
}

function getFoja(data) {
    const regexFoja = /(fojas|fs)(.)?\s+(N°\s+)?((\d{1,3}.)*)(\d{1,3})/i ;
    const foja = data.match(regexFoja);
    return foja;
}

async function testUnico(fecha,link){
    // const link = "https://www.economicos.cl/remates/clasificados-remates-cod7477417.html";
    caso = new Caso(fecha,link);
    const maxRetries = 2;
    description =  await getRemates(link,maxRetries,caso);
    caso.darTexto(description);

    causa = getCausa(caso.getTexto());
    juzgado = getJuzgado(caso.getTexto());
    porcentaje = getPorcentaje(caso.getTexto());
    formatoEntrega = getFormatoEntrega(caso.getTexto());
    fechaRemate = getFechaRemate(caso.getTexto());
    montoMinimo = getMontoMinimo(caso.getTexto());
    multiples = getMultiples(caso.getTexto());
    comuna = getComuna(caso.getTexto())
    if (causa != null){
        caso.darCausa(causa[0]);
    }
    if (juzgado != null){
        caso.darJuzgado(juzgado[0]);
    }
    if (porcentaje != null){
        caso.darPorcentaje(porcentaje[0]);
    }
    if (formatoEntrega != null){
        caso.darFormatoEntrega(formatoEntrega[0]);
    }
    if (fechaRemate != null){
        caso.darFechaRemate(fechaRemate[0]);
    }
    if (montoMinimo != null){
        caso.darMontoMinimo(montoMinimo[0]);
    }
    caso.darMultiples(multiples);
    if (comuna != null){
        caso.darComuna(comuna);
    }

    console.log(caso.toObject());
}

function convertirANombre(numero) {
    const nombres = [
        "primero", "segundo", "tercero", "cuarto", "quinto", "sexto", "séptimo", "octavo", "noveno", "décimo",
        "undécimo", "duodécimo", "decimotercero", "decimocuarto", "decimoquinto", "decimosexto", "decimoséptimo", "decimoctavo", "decimonoveno", "vigésimo",
        "vigésimo primero", "vigésimo segundo", "vigésimo tercero", "vigésimo cuarto", "vigésimo quinto", "vigésimo sexto", "vigésimo séptimo", "vigésimo octavo", "vigésimo noveno", "trigésimo",
        "trigésimo primero", "trigésimo segundo", "trigésimo tercero", "trigésimo cuarto", "trigésimo quinto", "trigésimo sexto", "trigésimo séptimo", "trigésimo octavo", "trigésimo noveno", "cuadragésimo"
    ];

    // Verificar que el número está dentro del rango válido
    if (numero >= 1 && numero <= 40) {
        return nombres[numero - 1]; // Ajuste para que el índice coincida con el número
    } else {
        return "Número fuera de rango"; // Si el número está fuera del rango de 1 a 40
    }
}

module.exports = {  getDatosRemate , testUnico };