const {stringToDate} = require('../../../../../utils/cleanStrings');
const GestorRematesPjud = require('../../../../pjud/GestorRematesPlay.js');
// const Pjud = require('../../../../pjud/getPjud.js');
const Pjud = require('../../../../pjud/getPjudPlay.js')
const {BrowserWindow} =  require('electron')
const pie = require('puppeteer-in-electron')
const {obtainCorteJuzgadoNumbers} = require('../../../../../utils/corteJuzgado.js');
const logger = require('../../../../../utils/logger.js');

const config = require('../../../../../config.js');
const NORMAL = config.NORMAL;

const { webkit } = require('playwright');

class PjudSource{
    constructor(manager,config){
        this.manager = manager;
        this.browser = null;
        this.context = null;
        this.mode = config.mode
    }

    getName(){ return 'pjud'; }


    async fetch2(startDateOrigin, endDateOrigin, { event, mainWindow, emptyMode, testMode }) {
        if (emptyMode) return [];

        const endDateModified = stringToDate(endDateOrigin);
        endDateModified.setDate(endDateModified.getDate() + 1); // Aumentar un dia para incluir el ultimo dia
        const startDate = dateToPjud(stringToDate(startDateOrigin));
        const endDate = dateToPjud(endDateModified);

        this.browser = await this.manager.getBrowser();
        let casos = [];

        try {

            casos = await this.searchCasesByDay(startDate, endDate);
            casos.reverse(); // Invertir el orden de los casos para que aparezcan del mas reciente al mas antiguo

            const gestorRemates = new GestorRematesPjud(casos, event, mainWindow, NORMAL);
            const result = await gestorRemates.getInfoFromAuctions();

            logger.info("Cantidad de casos obtenidos de pjud: ", casos.length);
        } catch (error) {
            console.error("Error en el pjud :", error.message);
        }
        return casos;

        return [];
    }

    //TODO: el problema es como se llega a la pagian principal de consultar, antes como era con verRemates() lo detectaba como bot, 
    // Lo que hay que hacer es fingir mas desde la pagina principal del pjud y de ahi llegar a donde queremos.
    async fetch(startDateOrigin, endDateOrigin, { event, mainWindow, emptyMode, testMode }){
        const endDateModified = stringToDate(endDateOrigin);
        endDateModified.setDate(endDateModified.getDate() + 1); // Aumentar un dia para incluir el ultimo dia
        const startDate = dateToPjud(stringToDate(startDateOrigin));
        const endDate = dateToPjud(endDateModified);
        let casos = [];

        this.browser = await this.manager.getBrowser();
        this.context = await this.manager.createHumanContext();

        try{
            casos = await this.searchCasesByDay(startDate, endDate);
            casos.reverse(); // Invertir el orden de los casos para que aparezcan del mas reciente al mas antiguo
            const gestorRemates = new GestorRematesPjud(casos, event, mainWindow, NORMAL);
            const result = await gestorRemates.getInfoFromAuctions();

            logger.info("Cantidad de casos obtenidos de pjud: ", casos.length);
            return casos;
        }catch(error){

            logger.warn(`Error: ${error.message}`)
            return casos;
        }

    }

    async searchCasesByDay2(startDate, endDate) {
        let window;
        let casos = [];
        try {
            window = new BrowserWindow({ show: false });
            // const url = 'https://oficinajudicialvirtual.pjud.cl/indexN.php';
            const url = 'https://oficinajudicialvirtual.pjud.cl/home/index.php'
            await window.loadURL(url);
            const page = await pie.getPage(this.browser, window);
            const pjud = new Pjud(this.browser, page, startDate, endDate);
            casos = await pjud.datosFromPjud();
            obtainCorteJuzgadoNumbers(casos);
            window.destroy();
            return casos;
        } catch (error) {
            console.error("Error al buscar casos por dia en Pjud: ", error.message);
            if (window && !window.isDestroyed()) {
                window.destroy();
            }
        }
        return casos;
    }

    async searchCasesByDay(startDate, endDate) {
        let window;
        let casos = [];
        try {
            const url = 'https://www.pjud.cl/';

            const page = await this.context.newPage();
            await page.goto(url,{timeout: 160000}); // Página real
            const scraper = new Pjud(this.browser, page, startDate, endDate);
            casos = await scraper.getPJUD();
            obtainCorteJuzgadoNumbers(casos);
            logger.info(`Cantidad de resultados obtenidos: ${casos.length}`);
            return casos;
        } catch (error) {
            console.error("Error al buscar casos por dia en Pjud: ", error.message);
            if (window && !window.isDestroyed()) {
                window.destroy();
            }

        }finally{
            if(page && !page.isClosed()){
                page.close();
            }
        }
        return casos;
    }

}

function dateToPjud(date) {
    const dia = String(date.getDate()).padStart(2, '0');  // Asegura que el día tenga dos dígitos
    const mes = String(date.getMonth() + 1).padStart(2, '0');  // Meses son 0-indexados, por lo que sumamos 1
    const año = date.getFullYear();

    return `${dia}/${mes}/${año}`;
}

module.exports = PjudSource;