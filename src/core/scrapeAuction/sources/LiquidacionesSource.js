const {BrowserWindow} = require('electron');
const pie = require('puppeteer-in-electron');

const {stringToDate} = require('#utils/cleanStrings.js');
const ProcesarBoletin = require('#sources/liquidaciones/procesarBoletin.js')

class LiquidacionesSource {
    constructor(manager,{mode, logger, isTestMode}) {
        this.manager = manager;
        this.mode = mode;
        this.logger = logger;
        this.isTestMode = isTestMode;
    }
    
    getName() {return "liquidaciones";}

    //TODO: Agregar cuadro de eliminar remates no borrados
    async fetch(startDate, endDate, options) {
        let casos = [];
        console.log(`startDate ${startDate} y endDate ${endDate}`);
        let startDateLiquidaciones = stringToDate(startDate, 'YMD');
        let endDateLiquidaciones = stringToDate(endDate, 'YMD');
        const fechaHoy = new Date();


        this.browser = await this.manager.getBrowser();
        if(!this.isTestMode){
            startDateLiquidaciones.setMonth(startDateLiquidaciones.getMonth() - 1);
        }
        console.log(`startDate ${startDateLiquidaciones} y endDate ${endDateLiquidaciones}`);


        let window = new BrowserWindow({ show: false });
        const url = 'https://www.boletinconcursal.cl/boletin/remates';
        await window.loadURL(url);
        const page = await pie.getPage(this.browser, window);
        const boletinConcursal = new ProcesarBoletin(this.browser, page);
        casos = await boletinConcursal.getPdfData(startDateLiquidaciones, endDateLiquidaciones, fechaHoy);
        window.destroy();
        return  casos;
    }
}

module.exports = LiquidacionesSource;