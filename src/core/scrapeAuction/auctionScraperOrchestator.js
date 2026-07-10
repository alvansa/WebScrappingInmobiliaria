const logger = require('#utils/logger.js');
const {delay} = require('#utils/delay.js');

const NOT_AUCTIONS_FOUND = 5;
class auctionScraperOrchestator{
    constructor(sources, enrichers, exporter, config){
        this.sources = sources;
        this.enrichers = enrichers;
        this.exporter = exporter;
        this.config = config.config;
        this.isEmptyMode = config.isEmptyMode;
        this.isTestMode = config.isTestMode;
        this.checkedBoxes = config.checkedBoxes;
        this.saveFile = config.saveFile;
        this.mainWindow = config.mainWindow;
        this.event = config.event;
    }

    async run(startDate, endDate){
        const startTime = new Date();
        console.log(`Ckecked Boxes en el orchestator : ${JSON.stringify(this.checkedBoxes,null,2)}`);

        let allCases = [];
        const spreadSheet = this.enrichers[0];

        logger.info(`Obteniendo la informacion de excel base`);
        await spreadSheet.obtain();

        logger.info(`Checked Boxes ${this.checkedBoxes}`)
        let pjudNeedsSecondSearch = false;
        let emolHasCases = true;

        for (const source of this.sources) {
            const sourceName = source.getName();
            if (this.checkedBoxes.includes(sourceName)) {
                logger.info(`Obteniendo casos de la fuente: ${sourceName}`);
                // if(sourceName === "pjud" ){
                //     await delay(60000 * 90); // Espera 5 minutos antes de la búsqueda en Pjud    
                // }
                const cases = await source.fetch(startDate, endDate, { event : this.event, mainWindow : this.mainWindow, emptyMode : this.isEmptyMode, testMode : this.isTestMode });
                if(sourceName === "pjud") {
                    pjudNeedsSecondSearch = this.shouldFetchAgainPjud(cases);
                }
                if(cases && cases.length > 0){
                    allCases.push(...cases);
                    //Agregarar que si es pjud, busque el porcentaje de casos que no tienen partes y si es mayor a 20% vuelva a buscar en pjud
                }
                if(cases && cases.length === 0 && sourceName === "emol"){
                    emolHasCases = false;
                }
            }
        }

        //TODO: Tal vez agregar como segundo buscador el playwritgh?

        if(this.isEmptyMode){
            return this.exporter.export(allCases, { saveFile : this.saveFile, startDate, endDate});
        }

        

        if(pjudNeedsSecondSearch){
            logger.debug(`Se realizará una segunda búsqueda en Pjud`);
            await delay(60000 * 5); // Espera 5 minutos antes de la segunda búsqueda
            const pjudSource = this.sources.find(source => source.getName() === "pjud");
            const cases = await pjudSource.fetch(startDate, endDate, { event : this.event, mainWindow : this.mainWindow, emptyMode : this.isEmptyMode, testMode : this.isTestMode });
            if(cases && cases.length > 0){
                allCases.push(...cases);
            }else{
                logger.info(`Realizando 3era busqueda de Pjud ahora con playwright`);
                const pjudPlaywrightSource = this.sources.find(source => source.getName() === "pjudPlaywright");
                const casesPjud = await pjudPlaywrightSource.fetch(startDate, endDate, { event : this.event, mainWindow : this.mainWindow, emptyMode : this.isEmptyMode, testMode : this.isTestMode });
                if(casesPjud && casesPjud.length > 0){
                    allCases.push(...casesPjud);
                }
            }

        }

        if(!emolHasCases){
            await delay(60000 * 5); // Espera 5 minutos antes de la segunda búsqueda
            const emolSource = this.sources.find(source => source.getName() === "emol");
            const cases = await emolSource.fetch(startDate, endDate, { event : this.event, mainWindow : this.mainWindow, emptyMode : this.isEmptyMode, testMode : this.isTestMode });
            allCases.push(...cases);
        }

        const endTime = new Date();
        const duration = (endTime - startTime) / 1000;
        logger.info(`Tiempo total de ejecución: ${duration} segundos`);
        logger.info(`Hora de cominenzo: ${startTime.toLocaleString()}`);
        logger.info(`Hora de finalización: ${endTime.toLocaleString()}`);


        if(allCases.length === 0){
            logger.warn("No se obtuvieron casos de ninguna fuente. El proceso se detendrá.");
            return NOT_AUCTIONS_FOUND;
        }

        for (const enricher of this.enrichers) {
            logger.info(`Enriqueciendo casos con: ${enricher.getName()}`);
            await enricher.enrich(allCases);
        }

        const filePath = await this.exporter.export(allCases, { saveFile : this.saveFile, startDate, endDate });
        logger.info(`Proceso completado. Archivo guardado en: ${filePath}`);
        return filePath;
    }

    shouldFetchAgainPjud(cases) {
        let countEmptyParts = 0;
        if(!cases || cases.length === 0){
            return true;
        }
        for (let caso of cases) {
            // caso.partes = null;
            if (!caso.partes) {
                countEmptyParts++;
            }
        }
        //se revisa si de los casos obtenidos 
        if (countEmptyParts <= Math.floor(cases.length / 20)) {
            logger.info(`No es necesario una segunda vuelta, casos con partes vacias: ${countEmptyParts} de ${cases.length}`);
            return false;
        }else{
            return true;
        }
    }
}

module.exports = auctionScraperOrchestator;