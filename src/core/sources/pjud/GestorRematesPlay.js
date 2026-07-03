const { chromium } = require('playwright');

const { fakeDelay, delay } = require('#utils/delay.js');
const config = require('#config');
const ConsultaCausaPjud = require('./consultaCausaPlay.js'); // Versión Playwright

const NORMAL = config.NORMAL;

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
            console.log('Lanzando navegador Playwright para las consultas...');
            this.browser = await chromium.launch({ headless: false }); // Cambiar a true si se desea sin interfaz

            for (let caso of this.casos) {
                counter++;
                console.log(`Caso a investigar: ${caso.causa} - ${caso.juzgado} (${counter} de ${this.casos.length})`);

                if (skipIfHasPartes && caso.partes) {
                    console.log(`Caso ${caso.causa} ya tiene partes, se omite`);
                    continue;
                }

                if (!caso.numeroJuzgado || !caso.corte) {
                    console.log(`Caso ${caso.causa} no tiene número de juzgado ni corte, se omite`);
                    continue;
                }

                const result = await this.consultaCausa(caso);
                if (result) {
                    console.log("Resultado del caso:", caso.toObject());
                }

                // Control de esperas entre casos
                if ((counter + 1) % 5 === 0) {
                    const awaitTime = Math.random() * (180 - 45) + 45;
                    console.log(`Esperando ${awaitTime.toFixed(2)} segundos antes del caso ${counter + 1} de ${this.casos.length} ${secondLapMsg}`);
                    await delay(awaitTime * 1000);
                } else if ((counter + 1) < this.casos.length) {
                    const awaitTime = Math.random() * (60 - 30) + 30;
                    console.log(`Esperando ${awaitTime.toFixed(2)} segundos antes del caso ${counter + 1} de ${this.casos.length} ${secondLapMsg}`);
                    await delay(awaitTime * 1000);
                }

                // Límite de prueba (opcional, original tenía counter > 3)
                if (counter > 3) break;
            }
        } catch (error) {
            console.error("Error al obtener datos de los casos:", error.message);
        } finally {
            // Cerrar el navegador al terminar
            if (this.browser) {
                await this.browser.close();
                console.log('Navegador cerrado.');
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