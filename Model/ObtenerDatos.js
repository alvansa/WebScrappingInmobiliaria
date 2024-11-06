const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

const comunas = require('./comunas.js');

class Caso{
    #fechahoy;
    #texto;
    #link;
    #causa;
    #juzgado;
    #porcentaje;
    #formatoEntrega;
    #fechaRemate;
    #montoMinimo;
    #multiples;
    #comuna;

    constructor(fechahoy,link){
        this.#fechahoy = fechahoy;
        this.#texto = '';
        this.#link = link
        this.#causa = 'N/A';
        this.#juzgado = '';
        this.#porcentaje = 'N/A';
        this.#formatoEntrega = 'N/A';
        this.#fechaRemate = 'N/A';
        this.#montoMinimo = 'N/A';
        this.#multiples = false;
        this.#comuna = 'N/A';
    }
    darCausa(causa){
        this.#causa = causa;
    }
    darJuzgado(juzgado){
        this.#juzgado = juzgado;
    }
    darPorcentaje(porcentaje){
        this.#porcentaje = porcentaje;
    }
    darFormatoEntrega(formatoEntrega){
        this.#formatoEntrega = formatoEntrega;
    }
    darFechaRemate(fechaRemate){
        this.#fechaRemate = fechaRemate;
    }
    darMontoMinimo(montoMinimo){
        this.#montoMinimo = montoMinimo;
    }
    darMultiples(multiples){
        this.#multiples = multiples;
    }
    darComuna(comuna){
        this.#comuna = comuna;
    }

    getLink(){ 
        return this.#link;
    }

    toObject() {
        return {
            fechaHoy: this.#fechahoy,
            texto: this.#texto,
            link: this.#link,
            causa: this.#causa,
            juzgado: this.#juzgado,
            porcentaje: this.#porcentaje,
            formatoEntrega: this.#formatoEntrega,
            fechaRemate: this.#fechaRemate,
            montoMinimo: this.#montoMinimo,
            multiples: this.#multiples,
            comuna: this.#comuna,
        };
    }
}

url = 'https://www.economicos.cl/todo_chile/remates_de_propiedades_el_mercurio'

urlBase = "https://www.economicos.cl"

async function getPaginas() {
    let maximo = 50;
    let casos = [];
    const promises = [];
    const fechaHoy = new Date();
    const maxRetries = 5;  // Número máximo de reintentos
    let attempt = 0;  // Contador de intentos

    // Función para manejar reintentos con backoff exponencial
    const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

    while (attempt < maxRetries) {
        try {
            const { data } = await axios.get(url);
            const $ = cheerio.load(data);
            // Seleccionar todos los <a> dentro de los divs con clases 'col2' y 'span6'
            const links = $('div.col2.span6 a');
            for (let i = 0; i < links.length && i < maximo; i++) {
                const href = $(links[i]).attr('href');
                console.log(href,"a");  // Imprimir cada href
                const caso = new Caso(fechaHoy, urlBase + href);
                promises.push(getEconomico(caso.getLink(), caso));
            }
            casos = await Promise.all(promises);

            return casos;  // Si todo funciona, salir del ciclo y devolver los casos
        } catch (error) {
            if (error.response && error.response.status === 503) {
                attempt++;
                console.log(`Error 503: Service unavailable. Attempt ${attempt} of ${maxRetries}. Retrying...`);
                const backoffTime = Math.pow(2, attempt) * 1000;  // Backoff exponencial
                await delay(backoffTime);  // Esperar antes de reintentar
            } else {
                console.error('Error:', error.message);
                return false;  // Si el error no es 503, salir y devolver false
            }
        }
    }
}

async function getEconomico(urlEspecifica, caso) {
    const maxRetries = 10;  // Número máximo de reintentos
    let attempt = 0;  // Contador de intentos

    // Función para manejar reintentos con backoff exponencial
    const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

    while (attempt < maxRetries) {
        try {
            const { data } = await axios.get(urlEspecifica);
            const $ = cheerio.load(data);
            const description = $('div#description p').text();

            const causa = getCausa(description);
            const juzgado = getJuzgado(description);
            const porcentaje = getPorcentaje(description);
            const formatoEntrega = getFormatoEntrega(description);
            const fechaRemate = getFechaRemate(description);
            const montoMinimo = getMontoMinimo(description);
            const multiples = getMultiples(description);
            const comuna = getComuna(description);

            if (causa) {
                caso.darCausa(causa[0]); // Asigna causa al caso
                //console.log("causa: ", causa[0]);
            }
            if (juzgado) {
                caso.darJuzgado(juzgado[0]); // Asigna juzgado al caso
                //console.log("juzgado: ", juzgado[0]);
            }
            if (porcentaje) {
                caso.darPorcentaje(porcentaje[0]); // Asigna porcentaje al caso
                //console.log("porcentaje: ", porcentaje[0]);
            }
            if (formatoEntrega) {
                caso.darFormatoEntrega(formatoEntrega[0]); // Asigna formato de entrega al caso
                //console.log("formato de entrega: ", formatoEntrega[0]);
            }
            if (fechaRemate) {
                caso.darFechaRemate(fechaRemate[0]); // Asigna fecha de remate al caso
                //console.log("fecha de remate: ", fechaRemate[0]);
            }
            if (montoMinimo) {
                caso.darMontoMinimo(montoMinimo[0]); // Asigna monto mínimo al caso
                //console.log("monto minimo: ", montoMinimo[0]);
            }
            if (multiples) {
                caso.darMultiples(multiples); // Asigna multiples al caso
                //console.log("multiples: ", multiples);
            }
            if (comuna) {
                caso.darComuna(comuna); // Asigna comuna al caso
                //console.log("comuna: ", comuna[0]);
            }

            return caso; // Retorna el caso actualizado
        } catch (error) {
            if (error.response && error.response.status === 503) {
                attempt++;
                console.log(`Error 503: Service unavailable. Attempt ${attempt} of ${maxRetries}. Retrying...`);
                const backoffTime = Math.pow(2, attempt) * 1000;  // Backoff exponencial
                await delay(backoffTime);  // Esperar antes de reintentar
            } else {
                console.error('Error al obtener la información del caso:', error.message);
                return caso;  // Si no es un error 503, retornar el caso sin modificar
            }
        }
    }

    console.log('Max retries reached. Could not fetch economic information.');
    return caso;  // Si se alcanzó el número máximo de reintentos, retornar el caso sin modificar
}

//crea una funcion que revise en la descripcion a base de regex el juzgado
function getCausa(data) {
    //Anadir C- con 3 a 5 digitos, guion, 4 digitos
    const regex = /C\s*[-]*\s*\d{3,5}\s*-\s*\d{4}|C\s*[-]*\s*\d{1,3}\.\d{3}\s*-\s*\d{4}/;
    
    const causa = data.match(regex);

    return causa;
}

function getJuzgado(data) {
    const regex = /\b\w+\s+juzgado(\s+\w+){3}/i;
    
    const juzgado = data.match(regex);

    return juzgado;
}

function getPorcentaje(data) {
    //const regex = /\d{1,3}\s*%\s*(del\s+)?(mínimo|valor|precio)+|(garantía|Garantía)\s+(suficiente\s+)?(de\s+)?(\$\s*)?(\d{1,3}.)+(\d{1,3})|(caución\s+)+(interesados\s+)+\d{1,3}\s*%|(garantía|Garantía)\s+(suficiente\s+)?(por\s+)?(el\s+)?\d{1,3}%/;

    const porcetajeRegex = new RegExp(/\d{1,3}\s*%\s*(?:del\s+)?(?:mínimo|valor|precio)+/.source +
        /|(garantía|Garantía)\s+(suficiente\s+)?(de\s+)?(\$\s*)?(\d{1,3}.)+(\d{1,3})/.source +
        /|(caución\s+)+(interesados\s+)+\d{1,3}\s*%/.source +
        /|(garantía|Garantía)\s+(suficiente\s+)?(por\s+)?(el\s+)?\d{1,3}%/.source );
    
    const porcentaje = data.match(porcetajeRegex);

    return porcentaje;
}

function getFormatoEntrega(data) {
    const regex = /(vale\s+)(vista)|(cupón)/
    const formatoEntrega = data.match(regex);
    return formatoEntrega;
}

function getFechaRemate(data) {
    const regexFechaRemate = new RegExp(/(\d{1,2})\s*(de\s+)?(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)[\s*](de\s+)?(\d{4})/i.source +
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
        comuna = 'Comuna de ' + comuna;
        
        if (data.includes(comuna)){
            return comuna;
        }
    }
    return "N/A";
}


function testCausasIguales(casos) {
    for (let i = 0; i < casos.length; i++) {
        for (let j = i + 1; j < casos.length; j++) {
            if (casos[i].causa === casos[j].causa) {
                console.log(`Causa repetida: ${casos[i].causa}`);
            }
        }
    }
}

function escribirEnArchivo(casos) {
    casoObj = casos.map(caso => caso.toObject());
    const jsonData = JSON.stringify(casoObj, null, 2);
        filePath = 'casos.json';
        fs.writeFile(filePath, jsonData, (err) => {
            if (err) {
                console.error("An error occurred while writing the file:", err);
            } else {
                console.log("Data saved successfully to", filePath);
            }
        });
}


async function main() {
    try {
        
        var start = new Date().getTime();
        const casos = await getPaginas();
        //console.log(casos);
        var end = new Date().getTime();
        var time = (end - start)/1000;
        console.log("Tiempo de ejecución: ", time);
        console.log("Cantidad de casos: ", casos.length);
        //testCausasIguales(casos);
        escribirEnArchivo(casos);
    } catch (error) {
        console.error('Error al obtener los casos:', error);
    }
}

// Ejecutar la función principal
main();

module.exports = {getEconomico, getPaginas};