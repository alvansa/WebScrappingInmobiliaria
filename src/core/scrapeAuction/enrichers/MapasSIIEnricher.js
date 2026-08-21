const MapasSII = require('#enrichers/mapasSII/MapasSII.js');

const logger = require('#utils/logger.js');
const {fakeDelay} = require('#utils/delay.js');
const config = require('#config');

const MACAL = config.MACAL

class MapasSIIEnricher {
    constructor(manager) {
        this.manager = manager;

    }

    getName() {return "MapasSII";}


    async enrich(causas) {
        let mapasSII = null;
        // let window = null;
        try {
            let browser = null;
            logger.info("Obteniendo datos de Mapas SII");
            let page = null;
            browser = await this.manager.getBrowser();
            mapasSII = new MapasSII(page, browser);
            await mapasSII.init();
            for (let caso of causas) {
                if ((caso.rolPropiedad !== null && caso.comuna !== null) && caso.origen != MACAL) {
                    try {
                        await mapasSII.obtainDataOfCause(caso);
                        await fakeDelay(2, 5);
                        // await new Promise(resolve => setTimeout(resolve, 1000));
                    } catch (error) {
                        logger.error(`Error procesando caso ${caso.rolPropiedad}: ${error.message}`);
                        continue;
                    }
                }
            }
            // window.destroy();
        } catch (error) {
            logger.warn('Error al obtener resultados en Mapas:', error);
        } finally {
            if (mapasSII) {
                mapasSII.finishPage();
            }
        }
        return;
    }
}

module.exports = MapasSIIEnricher;