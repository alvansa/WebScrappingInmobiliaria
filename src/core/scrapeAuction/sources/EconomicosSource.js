const Economico = require('#sources/economico/Economico.js')
const { stringToDate } = require('#utils/cleanStrings.js');

class EconomicosSource {
    constructor(PuppeteerManager, config,logger,testMode) {
        this.puppeteerManager = PuppeteerManager;
        this.browser = null;
        this.logger = logger;
        this.isTestMode = testMode;
        this.showWindow = config.show;

    }

    getName() {return "economicos";}

    async fetch(startDate, endDate, options) {
        if (this.emptyMode) {
            return emptyCaseEconomico();
        }

        console.log(`Fetching data from Economicos with start date: ${startDate} and end date: ${endDate}`);
        this.browser = await this.puppeteerManager.getBrowser();

        const fixStartDate = stringToDate(startDate)
        const fixEndDate = stringToDate(endDate);

        let fechaInicio = new Date();
        let fechaFin = new Date();

        fechaInicio.setDate(fechaInicio.getDate() - 40);


        if (this.isTestMode) {
            fechaInicio = stringToDate(startDate);
            fechaFin = stringToDate(endDate);
        }

        this.logger.info(`Fechas para Economicos - Fecha Inicio: ${fechaInicio}, Fecha Fin: ${fechaFin} is test mode: ${this.isTestMode}`);

        // return [];
        let casos = [];
        try {
            const economico = new Economico(this.browser, fechaInicio, fechaFin, fixStartDate, fixEndDate, this.isTestMode, this.showWindow);
            casos = await economico.getCases() || [];

        } catch (error) {
            this.logger.error(`Error al obtener resultados en emol: ${error.message}`);
        }
        return casos
    }
}

module.exports = EconomicosSource;