const pie = require('puppeteer-in-electron');
const Caso = require('../caso/caso')
const {BrowserWindow} = require('electron');
const {delay,fakeDelay} = require('../../utils/delay');
const { log } = require('electron-builder');

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
        this.maxRetries = 5; // Número máximo de reintentos
        this.attempt = 0; // Contador de intentos
        this.urlBase = "https://www.economicos.cl";
        this.fechaInicio = fechaInicio;
        this.fechaFin = fechaFin;
    }

    async getCases(){
        try{
            console.log("Iniciando la búsqueda de casos en Economicos.cl desde ", this.fechaInicio, " hasta ", this.fechaFin);
            await this.createWindow('https://www.economicos.cl/todo_chile/remates_de_propiedades_el_mercurio');
            // await this.page.goto('https://www.economicos.cl/remates/clasificados-remates-cod48015209.html', { waitUntil: 'networkidle2', timeout: 30000 });
            const result = await this.extractInfoPage();
            console.log("Casos encontrados: ", this.casosARevisar);
            await delay(2000);


        }catch(e){
            console.log("Error en getCases: ", e);
            this.attempt++;
            if (this.attempt < this.maxRetries) {
                console.log(`Reintentando (${this.attempt}/${this.maxRetries})...`);
                await delay(2000);
                return this.getCases();
            } else {
                console.log("Número máximo de reintentos alcanzado.");
            }
        }finally{
            if(!this.window.isDestroyed()){
                this.window.destroy();
            }
        }

        return this.casosARevisar;

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
    let attempt = 0;
    const maxRetries = 3;
    let stopFlag = false;
    let url = 'https://www.economicos.cl/todo_chile/remates_de_propiedades_el_mercurio';
    const fechaHoy = new Date();

    while (attempt < maxRetries) {
        try {
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
            await fakeDelay(2, 5);

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