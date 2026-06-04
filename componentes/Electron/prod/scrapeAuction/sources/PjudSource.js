const {stringToDate} = require('../../../../../utils/cleanStrings');
const GestorRematesPjud = require('../../../../pjud/GestorRematesPjud.js');
const Pjud = require('../../../../pjud/getPjud.js');
const {BrowserWindow} =  require('electron')
const pie = require('puppeteer-in-electron')
const {obtainCorteJuzgadoNumbers} = require('../../../../../utils/corteJuzgado.js');
const logger = require('../../../../../utils/logger.js');


class PjudSource{
    constructor(puppeteerManager,config){
        this.puppeteerManager = puppeteerManager;
        this.browser = null;
        this.mode = config.mode
    }

    getName(){ return 'pjud'; }


    async fetch(startDateOrigin, endDateOrigin, { event, mainWindow, emptyMode, testMode }) {
        if (emptyMode) return [];

        const endDateModified = stringToDate(endDateOrigin);
        endDateModified.setDate(endDateModified.getDate() + 1); // Aumentar un dia para incluir el ultimo dia
        const startDate = dateToPjud(stringToDate(startDateOrigin));
        const endDate = dateToPjud(endDateModified);

        this.browser = await this.puppeteerManager.getBrowser();
        let casos = [];

        try {

            casos = await this.searchCasesByDay(startDate, endDate);
            casos.reverse(); // Invertir el orden de los casos para que aparezcan del mas reciente al mas antiguo

            // const gestorRemates = new GestorRematesPjud(casos, event, this.mainWindow, NORMAL);
            // const result = await gestorRemates.getInfoFromAuctions();

            logger.info("Cantidad de casos obtenidos de pjud: ", casos.length);
        } catch (error) {
            console.error("Error en el pjud :", error.message);
        }
        return casos;

        return [];
    }

    async searchCasesByDay(startDate, endDate) {
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


    async examplefetch(startDate, endDate, { event, mainWindow, emptyMode, isTestMode }) {
        if (emptyMode) return [];

        // Ajuste de fecha: incluir el día final
        const endDateModified = new Date(endDate);
        endDateModified.setDate(endDateModified.getDate() + 1);
        const startStr = dateToPjud(startDate);
        const endStr = dateToPjud(endDateModified);

        const browser = await this.puppeteerManager.getBrowser();
        let window = null;
        let casos = [];

        try {
            window = new BrowserWindow({ show: false });
            const url = 'https://oficinajudicialvirtual.pjud.cl/home/index.php';
            await window.loadURL(url);
            const page = await pie.getPage(browser, window);
            const pjud = new Pjud(browser, page, startStr, endStr);
            casos = await pjud.datosFromPjud();
            obtainCorteJuzgadoNumbers(casos);
            window.destroy();

            // Obtener información completa de remates
            const gestor = new GestorRematesPjud(casos, event, mainWindow, NORMAL);
            const updatedCasos = await gestor.getInfoFromAuctions();
            casos = updatedCasos; // o merge según lógica

            // Segunda vuelta si muchas partes vacías
            const emptyParts = casos.filter(c => !c.partes).length;
            if (emptyParts > casos.length / 20) {
                const gestor2 = new GestorRematesPjud(casos, event, mainWindow, NORMAL);
                const secondPass = await gestor2.getInfoFromAuctions({ skipIfHasPartes: true });
                casos = secondPass;
            }
        } catch (error) {
            console.error('Error en PjudSource:', error);
            if (window) window.destroy();
            return [];
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