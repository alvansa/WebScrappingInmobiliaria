const axios = require('axios');
const cheerio = require('cheerio');

const {Caso} = require('./caso.js');

let url = 'https://www.economicos.cl/todo_chile/remates_de_propiedades_el_mercurio'
let urlBase = "https://www.economicos.cl"

async function getPaginas(fechaHoy,maxDiffDate) {
    // const maxDiffDate = 7; 
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
                // console.log(dateTimeStr);

                if (dateTimeStr) { // Check if datetime attribute exists
                    const announcementDate = new Date(dateTimeStr);
                    const diff = Math.abs(fechaHoy - announcementDate)/ (1000 * 60 * 60 * 24);
                    if (diff > maxDiffDate) {
                        stopFlag = true;
                        return false;
                    }else{
                        let announcement = $(element).find('div.col2.span6 a').attr('href');
                        if (announcement)
                            announcement = urlBase + announcement;
                            const fechaPublicacion = announcementDate.toLocaleDateString("es-CL");
                            const fechaHoyCaso = fechaHoy.toLocaleDateString("es-CL");
                            const caso = new Caso(fechaHoyCaso,fechaPublicacion,announcement);
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
                console.error('Error:', error.message);
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

module.exports = { getPaginas, getRemates }