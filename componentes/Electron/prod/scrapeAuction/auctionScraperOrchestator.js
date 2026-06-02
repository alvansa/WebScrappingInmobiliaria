const logger = require('../../../../utils/logger.js');


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
    }

    async run(startDate, endDate){
        console.log(`Ckecked Boxes en el orchestator : ${JSON.stringify(this.checkedBoxes,null,2)}`);

        let allCases = [];

        for (const source of this.sources) {
            const sourceName = source.getName();
            if (this.checkedBoxes.includes(sourceName)) {
                logger.info(`Obteniendo casos de la fuente: ${sourceName}`);
                const cases = await source.fetch(startDate, endDate, { event : this.event, mainWindow : this.mainWindow, emptyMode : this.isEmptyMode, testMode : this.isTestMode });
                allCases.push(...cases);
            }
        }

        if(this.isEmptyMode){
            return this.exporter.export(allCases, { saveFile : this.saveFile, startDate, endDate, saveFile : this.saveFile});
        }

        for (const enricher of this.enrichers) {
            logger.info(`Enriqueciendo casos con: ${enricher.getName()}`);
            await enricher.enrich(allCases);
        }

        const filePath = this.exporter.export(allCases, { saveFile : this.saveFile, startDate, endDate });
        logger.info(`Proceso completado. Archivo guardado en: ${filePath}`);
        return filePath;
    }
}

module.exports = auctionScraperOrchestator;