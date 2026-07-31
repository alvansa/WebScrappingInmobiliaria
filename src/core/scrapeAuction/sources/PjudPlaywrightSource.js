
const pie = require('puppeteer-in-electron')
const {BrowserWindow} =  require('electron')

const PjudPlaywright = require('#sources/pjud/getPjudPlay.js')
const GestorRematesPjud = require('#sources/pjud/GestorRematesPlay.js');

const {obtainCorteJuzgadoNumbers} = require('#utils/corteJuzgado.js');
const logger = require('#utils/logger.js');
const {stringToDate} = require('#utils/cleanStrings.js');

const config = require('#config');
const NORMAL = config.NORMAL;

const PlaywrigthManager = require('#src/core/scrapeAuction/services/PlaywrigthManager.js')

const { webkit } = require('playwright');
const { PlaywrightManager } = require('../services/PlaywrigthManager');
const MAX_RETRIES = 10;

require('dotenv').config();

class PjudPlaywrightSource{
    constructor(manager,config){
        this.manager = manager;
        this.browser = null;
        this.context = null;
        this.mode = config.mode
    }

    getName(){ return 'pjud'; }

    async fetch(startDateOrigin, endDateOrigin, { event, mainWindow, emptyMode, testMode }){
        const endDateModified = stringToDate(endDateOrigin, 'YMD');
        endDateModified.setDate(endDateModified.getDate() + 1); // Aumentar un dia para incluir el ultimo dia
        const startDate = dateToPjud(stringToDate(startDateOrigin, 'YMD'));
        const endDate = dateToPjud(endDateModified);
        let casos = [];


        this.browser = await this.manager.getBrowser();
        this.context = await this.manager.createHumanContext();
        for(let attempt = 1; attempt < MAX_RETRIES; attempt++){
            try{
                casos = await this.searchCasesByDay(startDate, endDate);
                casos.reverse(); // Invertir el orden de los casos para que aparezcan del mas reciente al mas antiguo

                logger.info("Cantidad de casos obtenidos de pjud: ", casos.length);
                const gestorRemates = new GestorRematesPjud(casos, event, mainWindow, NORMAL);
                await gestorRemates.getInfoFromAuctions();
                if(casos.length > 0){
                    return casos;
                }
            }catch(error){

                logger.warn(`Error: ${error.message}`)
                return casos;
            }
        }
        return casos;

    }


    async searchCasesByDay(startDate, endDate) {
        let window;
        let casos = [];
        let page = null;
        try {
            // const url = 'https://www.pjud.cl/';
            const url = 'https://oficinajudicialvirtual.pjud.cl/remate.php'

            this.context = await PlaywrigthManager.createHumanContext();
            page = await this.context.newPage();
            await page.goto(url,{timeout: 160000}); // Página real
            const scraper = new PjudPlaywright(this.browser, page, startDate, endDate);
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
            if (this.context) {
                await this.context.close().catch(() => { });
                this.context = null;
                page = null;
            }
        }
        return casos;
    }

    async completeInfo(cases){
        const gestorRemates = new GestorRematesPjud(cases, this.event, this.mainWindow);
        await gestorRemates.getInfoFromAuctions({ skipIfHasPartes: true });
    }
}

function dateToPjud(date) {
    const dia = String(date.getDate()).padStart(2, '0');  // Asegura que el día tenga dos dígitos
    const mes = String(date.getMonth() + 1).padStart(2, '0');  // Meses son 0-indexados, por lo que sumamos 1
    const año = date.getFullYear();

    return `${dia}/${mes}/${año}`;
}

module.exports = PjudPlaywrightSource;
