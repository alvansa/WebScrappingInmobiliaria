
const PjudPlaywright = require('#sources/pjud/getPjudPlay.js')
const GestorRematesPjud = require('#sources/pjud/GestorRematesPlay.js');

const {obtainCorteJuzgadoNumbers} = require('#utils/corteJuzgado.js');
const logger = require('#utils/logger.js');
const {stringToDate} = require('#utils/cleanStrings.js');

const config = require('#config');
const NORMAL = config.NORMAL;

const PlaywrigthManager = require('#core/scrapeAuction/services/PlaywrightManager.js')

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
        if(emptyMode){
            return [];
        }
        const endDateModified = stringToDate(endDateOrigin, 'YMD');
        endDateModified.setDate(endDateModified.getDate());

        const startDate = dateToPjud(stringToDate(startDateOrigin, 'YMD'));
        const endDate = dateToPjud(endDateModified);
        let casos = [];
        let lastPage = 0;


        // this.browser = await this.manager.getBrowser();
        // this.context = await this.manager.createHumanContext();
        for(let attempt = 1; attempt < MAX_RETRIES; attempt++){
            try{
                const {casos: casosTemp, pageNumber: newPage} = await this.searchCasesByDay(startDate, endDate);
                if(newPage > lastPage  && casosTemp.length > 0){
                    lastPage = newPage;
                    casos = casosTemp;
                }
            }catch(error){
                logger.warn(`Error: ${error.message}`)
            }
        }
        casos.reverse(); // Invertir el orden de los casos para que aparezcan del mas reciente al mas antiguo
        logger.info("Cantidad de casos obtenidos de pjud: ", casos.length);

        if(testMode){
            if(casos.length > 0){
                logger.info(`Modo test activado, se detiene la ejecucion despues de obtener los casos de pjud. Cantidad de casos obtenidos: ${casos.length}`);
                return casos;
            }
        }

        try {
            const gestorRemates = new GestorRematesPjud(casos, event, mainWindow, NORMAL);
            await gestorRemates.getInfoFromAuctions();
            if (casos.length > 0) {
                return casos;
            }
        } catch (error) {
            logger.warn(`Error: ${error.message}`);
            return casos;
        }
    }


    async searchCasesByDay(startDate, endDate) {
        let page = null;
        let context = null;
        try {
            const url = 'https://oficinajudicialvirtual.pjud.cl/remate.php'

            context = await PlaywrigthManager.createHumanContext();
            page = await context.newPage();
            await page.goto(url,{timeout: 160000}); // Página real
            const scraper = new PjudPlaywright(this.browser, page, startDate, endDate);
            const {casos, pageNumber} = await scraper.getPJUD();
            obtainCorteJuzgadoNumbers(casos);
            logger.info(`Cantidad de resultados obtenidos: ${casos.length}`);
            return {'casos': casos, 'pageNumber': pageNumber};
        } catch (error) {
            logger.error(`Error al buscar casos por dia en Pjud: ${error.message}`);
            if (context) {
                await context.close().catch(() => { });
            }
            return {'casos': [], 'pageNumber': 0};

        }finally{
            if(page){
                await page.close().catch(() => { });
            }

            if (context) {
                await context.close().catch(() => { });
            }
        }
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
