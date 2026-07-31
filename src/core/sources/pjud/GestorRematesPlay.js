const { chromium } = require('playwright');

const { delay } = require('#utils/delay.js');
const ConsultaCausaPjud = require('./consultaCausaPlay.js'); // Versión Playwright
const { logger } = require('#utils/logger.js');

const MAX_RETRIES = 10;

class GestorRematesPjud {
    constructor(casos, event, mainWindow, type) {
        this.casos = casos;
        this.event = event;      // Se mantiene por si se necesita para comunicar con el frontend
        this.mainWindow = mainWindow;
        this.browser = null;     // Navegador Playwright reutilizable
        this.type = type;
    }

    async getInfoFromAuctions(options = {}) {
        const { skipIfHasPartes = false } = options;
        const secondLapMsg = skipIfHasPartes ? 'en segunda vuelta' : '';
        let counter = 0;

        try {
            // 1. Lanzar el navegador Playwright una sola vez
            logger.debug(`Lanzando navegador Playwright para las consultas...`);
            this.browser = await chromium.launch({ headless: false }); // Cambiar a true si se desea sin interfaz

            for (let caso of this.casos) {
                counter++;
                logger.debug(`Caso a investigar: ${caso.causa} - ${caso.juzgado} - ${caso.partes} (${counter} de ${this.casos.length})`);

                if (skipIfHasPartes && caso.partes) {
                    logger.debug(`Caso ${caso.causa} ya tiene partes, se omite`);
                    continue;
                }

                if (!caso.numeroJuzgado || !caso.corte) {
                    logger.debug(`Caso ${caso.causa} no tiene número de juzgado ni corte, se omite`);
                    continue;
                }

                for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
                    try {
                        const result = await this.consultaCausa(caso);
                        if (result) {
                            logger.debug(`Caso obtenido correctamente, pasando al siguient: ${caso.causa}`);
                            break;
                        }
                    } catch (error) {
                        logger.error(`Error en el scraper: ${error.message}`);
                    }
                }

                // Control de esperas entre casos
                if ((counter + 1) < this.casos.length) {
                    const awaitTime = Math.random() * (60 - 30) + 30;
                    logger.info(`Esperando ${awaitTime.toFixed(2)} segundos antes del caso ${counter + 1} de ${this.casos.length} ${secondLapMsg}`);
                    await delay(awaitTime * 1000);
                }

                // Límite de prueba (opcional, original tenía counter > 3)
                // if (counter > 3) break;
            }
        } catch (error) {
            logger.error(`Error al obtener datos de los casos gestorRematesPlay:  ${error.message}`);
        } finally {
            // Cerrar el navegador al terminar
            if (this.browser) {
                await this.browser.close();
                logger.debug('Navegador cerrado.');
            }
        }
    }

    async consultaCausa(caso) {
        // Usar el navegador ya lanzado (this.browser debe existir)
        if (!this.browser) {
            throw new Error('El navegador no ha sido inicializado. Llama a getInfoFromAuctions primero.');
        }
        const consultaCausa = new ConsultaCausaPjud(this.browser, caso, this.mainWindow, this.type);
        const result = await consultaCausa.getConsulta();
        return result;
    }
}

module.exports = GestorRematesPjud;