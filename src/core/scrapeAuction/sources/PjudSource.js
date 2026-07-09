const pie = require('puppeteer-in-electron')
const {BrowserWindow} =  require('electron')

const Pjud = require('#sources/pjud/getPjud.js');
const GestorRematesPjud = require('#sources/pjud/GestorRematesPjud.js');

const {obtainCorteJuzgadoNumbers} = require('#utils/corteJuzgado.js');
const logger = require('#utils/logger.js');
const {stringToDate} = require('#utils/cleanStrings.js');
// const {delay} = require('#utils/delay.js');

const config = require('#config');
const NORMAL = config.NORMAL;


class PjudSource{
    constructor(manager,config){
        this.manager = manager;
        this.browser = null;
        this.context = null;
        this.mode = config.mode
    }

    getName(){ return 'pjud'; }


    async fetch(startDateOrigin, endDateOrigin, { event, mainWindow, emptyMode, testMode }) {
        if (emptyMode) return [];

        const endDateModified = stringToDate(endDateOrigin);
        endDateModified.setDate(endDateModified.getDate() + 1); // Aumentar un dia para incluir el ultimo dia
        const startDate = dateToPjud(stringToDate(startDateOrigin));
        const endDate = dateToPjud(endDateModified);

        this.browser = await this.manager.getBrowser();
        let casos = [];

        try {

            casos = await this.searchCasesByDay(startDate, endDate);
            return;
            casos.reverse(); // Invertir el orden de los casos para que aparezcan del mas reciente al mas antiguo

            const gestorRemates = new GestorRematesPjud(casos, event, mainWindow, NORMAL);
            const result = await gestorRemates.getInfoFromAuctions();

            logger.info("Cantidad de casos obtenidos de pjud: ", casos.length);
        } catch (error) {
            logger.error(`Error en el pjud : ${error.message}`);
        }
        return casos;
    }

    async searchCasesByDay(startDate, endDate) {
        let window;
        let casos = [];
        try {
            window = new BrowserWindow({ show: true }); 
            // const url = 'https://oficinajudicialvirtual.pjud.cl/indexN.php';
            const url = 'https://oficinajudicialvirtual.pjud.cl/home/index.php'
            await window.loadURL(url);
            const page = await pie.getPage(this.browser, window);
            await page.setViewport({ width: 1366, height: 768 });
            const pjud = new Pjud(this.browser, page, startDate, endDate);
            casos = await pjud.datosFromPjud();
            obtainCorteJuzgadoNumbers(casos);
            window.destroy();
            return casos;
        } catch (error) {
            logger.error(`Error al buscar casos por dia en Pjud: ${error.message}`);
            if (window && !window.isDestroyed()) {
                window.destroy();
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