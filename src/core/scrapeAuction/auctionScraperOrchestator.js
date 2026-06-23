const logger = require('#utils/logger.js');

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
        console.log(`Ckecked Boxes en el orchestator : ${JSON.stringify(this.checkedBoxes,null,2)}`);

        let allCases = [];

        logger.info(`Checked Boxes ${this.checkedBoxes}`)
        for (const source of this.sources) {
            const sourceName = source.getName();
            if (this.checkedBoxes.includes(sourceName)) {
                logger.info(`Obteniendo casos de la fuente: ${sourceName}`);
                const cases = await source.fetch(startDate, endDate, { event : this.event, mainWindow : this.mainWindow, emptyMode : this.isEmptyMode, testMode : this.isTestMode });
                if(cases && cases.length > 0){
                    allCases.push(...cases);
                }
            }
        }

        //TODO: Agregar que si los casos economicos son 0 haga una segunda vuelta
        //TODO : Agregar que si hay muchas partes vacias vuelva a buscar en pjud
        //TODO: Tal vez agregar como segundo buscador el playwritgh?
        //TODO:  Agregar busqueda de casos de emol en pjud.

        if(this.isEmptyMode){
            return this.exporter.export(allCases, { saveFile : this.saveFile, startDate, endDate, saveFile : this.saveFile});
        }

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
}

module.exports = auctionScraperOrchestator;