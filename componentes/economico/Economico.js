const pie = require('puppeteer-in-electron');
const Caso = require('../caso/caso')
const {BrowserWindow} = require('electron');
const {delay,fakeDelay} = require('../../utils/delay');
const {procesarDatosRemate} = require('./datosRemateEmol');
const listUserAgents = require('../../utils/userAgents.json');

require('dotenv').config();

const SELECTORS = 
{
    'NEXT_PAGE_SELECTOR': 'span.pag_bt_result_left.pag_bt_resul_green.pag_bt_pad_r.pag_color_bt_green',
    'CASO_BLOQUE_SELECTOR': 'div.result.row-fluid',
}
const EMOL = 1;

class Economico{
    constructor(browser,fechaInicio, fechaFin){
        this.browser = browser;
        this.page = null;
        this.window = null;
        this.casosARevisar = [];
        this.maxRetries = 3; // Número máximo de reintentos
        this.urlBase = "https://www.economicos.cl";
        this.fechaInicio = fechaInicio;
        this.fechaFin = fechaFin;
    }

    async getCases(){
        try{
            console.log("Iniciando la búsqueda de casos en Economicos.cl desde ", this.fechaInicio, " hasta ", this.fechaFin);
            await this.createWindow('https://www.economicos.cl/todo_chile/remates_de_propiedades_el_mercurio');
            const result = await this.extractInfoPage();
            console.log("Casos encontrados: ", this.casosARevisar);
            await delay(2000);
            let counter = 0;
            for(let caso of this.casosARevisar){
                counter++;
                const description = await this.getInfoFromSingularPage(caso);
                console.log(`Obtienedo caso ${counter} de ${this.casosARevisar.length}`);
                await fakeDelay(5,10);
                if(description){
                    caso.texto = description;
                }else{
                    console.log("No se pudo obtener la descripción para el caso: ", caso);
                }
                if(counter % 5 == 0){
                    await fakeDelay(120, 240,true);
                    await this.changeUserAgent();
                }
            }
            for(let caso of this.casosARevisar){
                // console.log("Procesando caso: ", caso.link);
                procesarDatosRemate(caso);
            }


        }catch(e){
            console.log("Error en getCases: ", e);
            return [];
        }finally{
            console.log("Cerrando la ventana de Economicos.cl");
            if(!this.window.isDestroyed()){
                this.window.destroy();
            }
        }

        return this.casosARevisar;
    }

    async changeUserAgent(){
        try{
            const randomIndex = Math.floor(Math.random() * listUserAgents.length);
            const customUA = listUserAgents[randomIndex].userAgent;
            await this.page.setUserAgent(customUA);
        }catch(error){
            console.error('Error cambiando el userAgent', error.message);
        }

    }

    async createWindow(url){
        this.window = new BrowserWindow({ show: true });
        await this.window.loadURL(url);
        this.page = await pie.getPage(this.browser, this.window);
    }

    async obtainDescription(){
        const description = await this.page.evaluate(() => {
            const element = document.querySelector('div#description p');
            return element ? element.textContent : null;
        }); 
        return description;
    }

async extractInfoPage() {
    const defaultUserAgents = [
        { userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' },
        { userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' }
    ];

    let userAgents;
    
    try {
        // Intenta cargar USER_AGENTS desde .env, si no existe usa los valores por defecto
        userAgents = process.env.USER_AGENTS ? JSON.parse(process.env.USER_AGENTS) : defaultUserAgents;
    } catch (error) {
        console.error('Error parsing USER_AGENTS from .env, using default agents:', error);
        userAgents = defaultUserAgents;
    }
    const randomIndex = Math.floor(Math.random() * userAgents.length);
    let customUA;
    let attempt = 0;
    let stopFlag = false;
    let url = 'https://www.economicos.cl/todo_chile/remates_de_propiedades_el_mercurio';
    const fechaHoy = new Date();

    while (attempt < this.maxRetries) {
        try {
            customUA  = userAgents[randomIndex].userAgent;
            await this.page.setUserAgent(customUA);
            await this.navigateToPage(url);

            if (await this.check503()) {
                throw new Error('Error 503: Service Unavailable');
            }
            // Obtener enlace a la siguiente página
            const urlNextPage = await this.page.evaluate((NEXT_PAGE_SELECTOR) => {
                const nextPage = document.querySelector(NEXT_PAGE_SELECTOR);
                return nextPage ? nextPage.parentElement.getAttribute('href') : null;
            }, SELECTORS.NEXT_PAGE_SELECTOR);


            const processCases = await this.processPage(this.fechaInicio, this.fechaFin, SELECTORS);

            this.addFoundCases(processCases.casos,fechaHoy);

            if (processCases.stop) {
                console.log("Ya se superó la fecha límite");
                stopFlag = true;
                break;
            }
            if (stopFlag || !urlNextPage) {
                break;
            }
            // Preparar siguiente página
            url = this.urlBase + urlNextPage;
            attempt = 0; // Resetear intentos si la página cargó correctamente
            await fakeDelay(4, 7);

        } catch (error) {
            if (error.message.includes('503') || error.message.includes('Service Unavailable')) {
                console.error('Error 503:', error.message);
                const delayTime = 2 ** attempt * 1000;
                console.log(`Esperando ${delayTime / 1000} segundos antes de reintentar...`);
                await delay(delayTime);
                attempt++;
            } else {
                console.error('Error en el modelo:', error.message);
                throw error; // Relanzar error para manejarlo fuera
            }
        }
    }
}


async getInfoFromSingularPage(caso){
    let attemp = 1;
    while (attemp < this.maxRetries) {
        try {
            // Navegar a la página
            await this.page.goto(caso.link, {
                waitUntil: 'networkidle2',
                timeout: 30000
            });

            // Esperar a que el elemento esté disponible
            await this.page.waitForSelector('div#description p', { timeout: 5000 });

            // Extraer el texto
            const description = await this.page.$eval('div#description p', el => el.textContent);
            // console.log("Description: ", description);
            // caso.description = description;

            return description;
        } catch (error) {
            if(error.response && error.response.status === 503){
                console.error('Error 503:', error.message);
                const delayTime = 2 ** attemp * 1000; // Backoff exponencial
                console.log(`Esperando ${delayTime / 1000} segundos antes de reintentar...`);
                await delay(delayTime);
                attemp++; // Incrementar el contador de intentos
            } else {
                console.error('Error al obtener información de la página:', error.message);
                return null;
            }
        }
    }
}

async navigateToPage(url){
    try {
        await this.page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    } catch (error) {
        console.error('Error al navegar a la página:', error.message);
        throw error;
    }
}

async check503(){
    const is503 = await this.page.evaluate(() => {
        return document.title.includes('503') ||
            document.body.textContent.includes('Service Unavailable');
    });
    return is503;
}

async processPage(startDate,endDate,SELECTORS){
    const casosPagina = await this.page.evaluate(async (fechaInicio, fechaFin,SELECTORS ) => {
        const fechaInicioDate = new Date(fechaInicio);
        const casos = [];
        const bloqueCasos = document.querySelectorAll(SELECTORS.CASO_BLOQUE_SELECTOR)


        for (let element of bloqueCasos) {
            const timeElement = element.querySelector('time.timeago');
            const dateTimeStr = timeElement ? timeElement.getAttribute('datetime') : null;

            if (dateTimeStr) {
                let announcementDate = new Date(dateTimeStr);

                // await logDesdePagina(`fecha actual ${announcementDate} fecha inicio ${fechaInicioDate} y deberia parar ${announcementDate < fechaInicioDate} `);
                if (announcementDate < fechaInicioDate) {
                    return { casos, stop: true };
                } else if (announcementDate >= new Date(fechaInicio) && announcementDate <= new Date(fechaFin)) {
                    const linkElement = element.querySelector('div.col2.span6 a');
                    const announcement = linkElement ? linkElement.getAttribute('href') : null;
                    casos.push({
                        fechaPublicacion: announcementDate.toISOString(),
                        announcement: announcement
                    });
                }
            }
        }

        return { casos, stop: false, bloqueCasos };
    }, startDate.toISOString(), endDate.toISOString(), SELECTORS);
    return casosPagina;
}

addFoundCases(cases,fechaHoy){
    for(let currentCase of cases){
        const announcement = currentCase.announcement ? this.urlBase + currentCase.announcement : null;
        const fechaPublicacion = new Date(currentCase.fechaPublicacion);
        const fechaHoyCaso = fechaHoy;
        const casoObj = new Caso(fechaHoyCaso, fechaPublicacion, announcement, EMOL);
        
        this.casosARevisar.push(casoObj);
    }
}



}

module.exports = Economico;