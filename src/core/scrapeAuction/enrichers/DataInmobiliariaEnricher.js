const dataInmobiliaria = require('#enrichers/dataInmobiliaria/obtainDataInmobilaria.js')
const {fakeDelay} = require('#utils/delay.js');
const logger = require('#utils/logger.js');
class DataInmobiliariaEnricher {
    constructor() {

    }

    getName() {return "DataInmobiliaria";}

    async enrich(causas) {
        logger.info(`Obtiendo informacion de data`);
        for (let caso of causas) {
            // logger.info(`Obteniendo metros para caso ${caso.causa} con rol ${caso.rolPropiedad} y comuna ${caso.comuna}`);
            if (!caso.rolPropiedad || !caso.comuna) {
                continue;
            }
            try {
                const data = await dataInmobiliaria.obtainData(caso.comuna, caso.rolPropiedad);
                if (!data) {
                    continue;
                }
                caso.metros = data.metros;
                caso.linkData = data.linkData;
                if (data.linkMap) {
                    caso.linkMap = data.linkMap;
                }
                await fakeDelay(1, 3);
            } catch (error) {
                logger.error(`Error obteniendo metros para caso ${caso.rolPropiedad}: ${error.message}`);
                continue;
            }
        }
        logger.info(`Data terminado`);
    }
}

module.exports = DataInmobiliariaEnricher;