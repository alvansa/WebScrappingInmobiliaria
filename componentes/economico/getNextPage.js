const axios = require('axios');
const cheerio = require('cheerio');

const Caso = require('../caso/caso');

let url = 'https://www.economicos.cl/todo_chile/remates_de_propiedades_el_mercurio'
let urlBase = "https://www.economicos.cl"

async function getPaginas(fechaHoy,fechaInicioStr,fechaFinStr) {
    const EMOL = 1;
    fechaInicio = new Date(fechaInicioStr);
    fechaFin = new Date(fechaFinStr);
    
    const maxRetries = 5;  // Número máximo de reintentos
    let attempt = 0;  // Contador de intentos
    let stopFlag = false;
    const casosARevisar = [];

    while (attempt < maxRetries) {
        try {
            const { data } = await axios.get(url);
            const $ = cheerio.load(data);
            const nextPage = $('span.pag_bt_result_left.pag_bt_resul_green.pag_bt_pad_r.pag_color_bt_green');
            var urlNextPage = nextPage.parent('a').attr('href');

            const bloqueCasos = $('div.result.row-fluid');
            bloqueCasos.each((index, element) => {
                const dateTimeStr = $(element).find('time.timeago').attr('datetime');

                if (dateTimeStr) { // Revisa si pudo obtener la fecha de publicación
                    const announcementDate = new Date(dateTimeStr);
                    console.log(announcementDate+" // "+fechaInicio+" // "+fechaFin);
                    
                    if (announcementDate < fechaInicio) {
                        stopFlag = true;
                        return false;
                    }else if (announcementDate >= fechaInicio && announcementDate <= fechaFin) {
                        let announcement = $(element).find('div.col2.span6 a').attr('href');
                        if (announcement)
                            announcement = urlBase + announcement;
                            const fechaPublicacion = announcementDate;
                            const fechaHoyCaso = fechaHoy;
                            const caso = new Caso(fechaHoyCaso,fechaPublicacion,announcement,EMOL);
                            casosARevisar.push(caso);
                    }
                }
            });
            if (stopFlag) {
                console.log("Ya se supero la fecha limite");
                break;
            }

            if (urlNextPage) {
                url = urlBase + urlNextPage;
                // console.log(urlNextPage);
                // console.log(url);
            }else{
                break;
            }
                    
        } catch (error) {
            if (error.response && error.response.status === 503) {
                console.error('Error 503:', error.message);
                await delay(2 ** attempt * 1000);  // Esperar con backoff exponencial
                attempt++;  // Aumentar el contador de intentos
            }
                console.error('Error en el modelo:', error.message);
                return false;  // Si el error no es 503, salir y devolver false
            }
        }
        
        return casosARevisar;
    }

async function getRemates(url,maxRetries){
    let attempt = 0;  // Contador de intentos
    
    while(attempt < maxRetries){
        try {
            console.log("intento: ",attempt, "de ",maxRetries);
            const { data } = await axios.get(url);
            const $ = cheerio.load(data);
            const description = $('div#description p').text();
            console.log("description: ",description);
            return description;
        } catch (error) {
            if (error.response && error.response.status === 503) {
                console.error('Error 503:', error.message);
                await delay(2 ** attempt * 1000);  // Esperar con backoff exponencial
                attempt++;  // Aumentar el contador de intentos
            }else{
                console.error('Error:', error.message);
                return false;  // Si el error no es 503, salir y devolver false
            }
        }
    }
}
 
// Función para manejar reintentos con backoff exponencial
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));


// Funcion de ejemplo para mostrar como se utiliza el getPaginas
async function obtenerPaginas(params) {
    try {
        const resultados = await getPaginas();
        console.log(resultados);
        return resultados;
    } catch (error) {
        console.error('Error:', error.message);
        return false;
    }
    
}

function setStrToDateTime(dateStr){
    const [year, month, day] = dateStr.split('-').map(Number);
    const parsedDate = new Date(Date.UTC(year, month - 1, day));
    return parsedDate.toISOString().split("T")[0];
}

module.exports = { getPaginas, getRemates }