

class auctionScraperOrchestator{
    constructor(sources, enrichers, exporter, config){
        this.sources = sources;
        this.enrichers = enrichers;
        this.exporter = exporter;
        this.config = config;
    }

    async run(startDate, endDate, options){
       const { checkedBoxes, emptyMode, testMode, saveFile, event, mainWindow } = options;

        let allCases = [];

        for (const source of this.sources) {
            const sourceName = source.getName();
            if (checkedBoxes.includes(sourceName)) {
                logger.info(`Obteniendo casos de la fuente: ${sourceName}`);
                const cases = await source.fetch(startDate, endDate, { event , mainWindow, emptyMode, testMode });
                allCases.push(...cases);
            }
        }

        if(emptyMode){
            return this.exporter.export(allCases, { saveFile, startDate, endDate, saveFile});
        }

        for (const enricher of this.enrichers) {
            logger.info(`Enriqueciendo casos con: ${enricher.getName()}`);
            await enricher.enrich(allCases);
        }

        const filePath = this.exporter.export(allCases, { saveFile, startDate, endDate });
        logger.info(`Proceso completado. Archivo guardado en: ${filePath}`);
        return filePath;
    }
}