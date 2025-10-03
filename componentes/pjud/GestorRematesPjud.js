const {app, BrowserWindow, ipcMain, dialog,electron} = require('electron');
const pie = require('puppeteer-in-electron');
const puppeteer = require('puppeteer-core');
const { fakeDelay, delay } = require('../../utils/delay');
// const StealthPlugin = require('puppeteer-extra-plugin-stealth');
// const puppeteerExtra = require('puppeteer-extra');

const ConsultaCausaPjud = require('./consultaCausaPjud');

// puppeteerExtra.use(StealthPlugin());

class GestorRematesPjud{
    constructor(casos,event,mainWindow){
        this.casos = casos;
        this.event = event;
        this.mainWindow = mainWindow;
        this.browser = null;
        this.activeWindows = new Set();
    }

    async getInfoFromAuctions(options = {}){
        let secondlap = ''
        const { skipIfHasPartes = false } = options;
        if(skipIfHasPartes){
            secondlap = 'en segunda vuelta';
        }
        const mainWindow = BrowserWindow.fromWebContents(this.event.sender);
        let counter = 0;
        try{
            for (let caso of this.casos) {
                counter++;
                // console.log(`Caso a investigar ${caso.causa} ${caso.juzgado} caso numero ${counter} de ${this.casos.length}`);
                if (skipIfHasPartes && caso.partes) {

                    console.log(`Caso ${caso.causa} ya tiene partes, se omite`);
                    continue;
                }

                if(!caso.numeroJuzgado || !caso.corte ){
                    console.log(`Caso ${caso.causa} no tiene numero de juzgado ni corte, se omite`);
                    continue;
                }
                const result = await this.consultaCausa(caso);
                if (result) {
                    console.log("Resultados del caso de prueba en pjud: ", caso.toObject());
                }

                if ((counter + 1) < this.casos.length) {
                    const awaitTime = Math.random() * (90 - 30) + 30; // Genera un número aleatorio entre 30 y 90
                    mainWindow.webContents.send('aviso-espera', [awaitTime, counter + 1, this.casos.length]);
                    console.log(`Esperando ${awaitTime} segundos para consulta numero ${counter + 1} de ${this.casos.length} ${secondlap}`);
                    await delay(awaitTime * 1000);
                }
            }
        }catch (error) {
            console.error("Error al obtener datos de los casos: ", error.message);
        }
    }

    async consultaCausa(caso) {
        const browser = await pie.connect(app, puppeteer);
        let window;
        window = this.openWindow(window, false);
        const consultaCausa = new ConsultaCausaPjud(browser, window, caso, this.mainWindow);
        const result = await consultaCausa.getConsulta()

        return result;
    }

    openWindow(window) {
        const isVisible = true;
        window = new BrowserWindow({
            show: isVisible,// Ocultar ventana para procesos en background
        });
        return window;
    }
}

module.exports = GestorRematesPjud;