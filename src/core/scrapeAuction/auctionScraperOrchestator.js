const logger = require('#utils/logger.js');
const {delay} = require('#utils/delay.js');

const NOT_AUCTIONS_FOUND = 5;
const EXITO = 0
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

    async run(startDate, endDate) {
        const startTime = new Date();
        console.log(`Ckecked Boxes en el orchestator : ${JSON.stringify(this.checkedBoxes, null, 2)}`);

        let allCases = [];
        const spreadSheet = this.enrichers[0];

        logger.info(`Obteniendo la informacion de excel base`);
        await spreadSheet.obtain();

        logger.info(`Checked Boxes ${this.checkedBoxes}`);
        let pjudNeedCompleteSearch = false;
        let pjudNeedsSecondSearch = false;
        let emolNeedsSecondSearch = false;

        for (const source of this.sources) {
            try {
                const sourceName = source.getName();
                if (this.checkedBoxes.includes(sourceName)) {
                    logger.info(`Obteniendo casos de la fuente: ${sourceName}`);
                    const cases = await source.fetch(startDate, endDate, { event: this.event, mainWindow: this.mainWindow, emptyMode: this.isEmptyMode, testMode: this.isTestMode });
                    if(sourceName === "pjud") {
                        pjudNeedsSecondSearch = this.shouldFetchAgainPjud(cases);
                        pjudNeedCompleteSearch = this.pjudNeedSearchAgain(cases);
                    }
                    if (cases && cases.length > 0) {
                        allCases.push(...cases);
                        //Agregarar que si es pjud, busque el porcentaje de casos que no tienen partes y si es mayor a 20% vuelva a buscar en pjud
                    }
                    if (sourceName === "emol") {
                        emolNeedsSecondSearch = this.shouldFetchEmolAgain(cases);
                    }
                }
            } catch (error) {
                logger.error(`Error al obtener source en ${source.getName()}, error: ${error.message}`);
            }
        }

        if (this.isEmptyMode) {
            return this.exporter.export(allCases, { saveFile: this.saveFile, startDate, endDate });
        }

        if(pjudNeedCompleteSearch){
            logger.info(`No se pudieron obtener los casos del pjud, se buscaran de 0 nuevamente`);
            const pjudPlaywrightSource = this.sources.find(source => source.getName() === "pjud");
            const casesPjud = await pjudPlaywrightSource.fetch(startDate, endDate, { event: this.event, mainWindow: this.mainWindow, emptyMode: this.isEmptyMode, testMode: this.isTestMode });
            if (casesPjud && casesPjud.length > 0) {
                allCases.push(...casesPjud);
            }

        }


        if (pjudNeedsSecondSearch) {
            logger.info(`Se encontraron los casos de pjud pero hay muchos casos sin partes, se raliza segunda busqueda`);
            const pjudPlaywrightSource = this.sources.find(source => source.getName() === "pjud");
            logger.info(`Realizando segunda busqueda`);
            await pjudPlaywrightSource.completeInfo(allCases);
        }


        if (emolNeedsSecondSearch) {
            await delay(60000 * 5); // Espera 5 minutos antes de la segunda búsqueda
            const emolSource = this.sources.find(source => source.getName() === "emol");
            const cases = await emolSource.fetch(startDate, endDate, { event: this.event, mainWindow: this.mainWindow, emptyMode: this.isEmptyMode, testMode: this.isTestMode });
            allCases.push(...cases);
        }

        const endTime = new Date();
        const duration = (endTime - startTime) / 1000;
        logger.info(`Tiempo total de ejecución: ${duration} segundos`);
        logger.info(`Hora de cominenzo: ${startTime.toLocaleString()}`);
        logger.info(`Hora de finalización: ${endTime.toLocaleString()}`);


        if (allCases.length === 0) {
            logger.warn("No se obtuvieron casos de ninguna fuente. El proceso se detendrá.");
            return {
                filePath: null,
                status: NOT_AUCTIONS_FOUND
            };
        }

        for (const enricher of this.enrichers) {
            try {
                logger.info(`Enriqueciendo casos con: ${enricher.getName()}`);
                await enricher.enrich(allCases);
            } catch (error) {
                logger.error(`Error al enriquecer la informacion con ${enricher.getName()} ${error.message} `);
            }
        }

        try {
            const filePath = await this.exporter.export(allCases, { saveFile: this.saveFile, startDate, endDate });
            logger.info(`Proceso completado. Archivo guardado en: ${filePath}`);
            return {
                filePath: filePath,
                status: EXITO,
                isStopped: false
            };
        } catch (error) {
            logger.error(`Error al escribir la informacion en excel error: ${error.message}`);
        }
    }

    pjudNeedSearchAgain(cases){
        if(!cases || cases.length === 0){
            return true;
        }
        return false;
    }
    shouldFetchAgainPjud(cases) {
        let countEmptyParts = 0;
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

    shouldFetchEmolAgain(cases){
        if(!cases || cases.length === 0){
            return true;
        }
        return false;
    }
}

module.exports = auctionScraperOrchestator;