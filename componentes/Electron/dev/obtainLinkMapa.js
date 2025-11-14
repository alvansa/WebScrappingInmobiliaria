const config = require('../../../config.js');

const path = require('path');
const os = require('os');
const XLSX = require('xlsx');
const { app, BrowserWindow, ipcMain, dialog, electron } = require('electron');
const pie = require('puppeteer-in-electron');
const puppeteer = require('puppeteer-core');
const { fakeDelay, delay } = require('../../../utils/delay.js');
const logger = require('../../../utils/logger.js');
const MapasSII = require('../../mapasSII/MapasSII.js');

const CasoBuilder = require('../../caso/casoBuilder.js');
// const {stringToDate} = require('../../utils/cleanStrings')
// const {matchJuzgado} = require('../../utils/compareText')

const RANGO_EXCEL = `${config.INICIO}5:${config.COMENTARIOS3}`;

class obtainLinkMapa {
    constructor(event, mainWindow, filePath) {
        this.event = event;
        this.browser = null;
        this.link = 'https://oficinajudicialvirtual.pjud.cl/includes/sesion-consultaunificada.php';
        this.page = null;
        this.window = null;
        this.mainWindow = mainWindow;
        this.filePath = filePath;
        this.wb = null;
        this.ws = null;
        this.casos = []
    }
    async process() {
        this.obtainListOfCauses();

        for (let caso of this.casos) {
            console.log(`Obteniendo link para la causa: ${caso.causa} en la comuna: ${caso.comuna}`);
        }
        console.log(`Cantidad de causas obtenidas desde Excel: ${this.casos.length}`);
        this.browser = await pie.connect(app, puppeteer);
        await this.connectToMapas();
        this.writeChanges();
        console.log("Proceso de obtención de links finalizado.");
    }

    obtainListOfCauses() {
        this.wb = XLSX.readFile(this.filePath, { cellDates: true });
        this.ws = this.wb.Sheets[this.wb.SheetNames[0]];
        const lastWrittenRow = XLSX.utils.decode_range(this.ws['!ref']).e.r + 1;
        let lastRow = 1;
        // console.log(this.ws[`${config.TRIBUNAL}3`].v.toString());
        while (lastRow <= lastWrittenRow) {
            let causa, comuna, rol, fechaDesc, avaluo, mapa;
            let skipRowOutside = false;
            [causa, comuna, rol, avaluo, mapa, skipRowOutside] = this.obtainDataFromRow(lastRow);

            if (skipRowOutside) {
                lastRow++;
                continue;
            }

            const casoExcel = new CasoBuilder(new Date(fechaDesc), "PJUD", config.PJUD)
                .conCausa(causa)
                .conComuna(comuna)
                .conRol(rol)
                .conAvaluoFiscal(avaluo)
                .conMapaSII(mapa)
                .construir();

            this.casos.push(casoExcel)
            lastRow++;
        }
    }


    obtainDataFromRow(lastRow) {
        let skipRow = false;

        const [causa, skip1] = this.obtainCellAndState(config.CAUSA, lastRow, skipRow);
        const [comuna, skip2] = this.obtainCellAndState(config.COMUNA, lastRow, skipRow);
        const [rol, skip3] = this.obtainCellAndState(config.ROL, lastRow, skipRow)
        const [avaluo, skip4] = this.obtainCellAndState(config.AVALUO_FISCAL, lastRow, skipRow)
        const [mapa, skip5] = this.obtainCellAndState(config.OTRA_DEUDA, lastRow, skipRow)
        skipRow = skipRow || skip1 || skip2 || skip3;

        //Normalizar el texto de la causa que puede venir modificado por alguien del excel.
        if (causa && comuna && rol) {
            return [causa, comuna, rol, avaluo, mapa, skipRow];
        } else {
            return [causa, comuna, rol, avaluo, mapa, skipRow];
        }


    }

    obtainCellAndState(cell, lastRow, skipRow) {
        let skip = false;
        let cellValue = this.ws[`${cell}${lastRow}`];
        if (cellValue) {
            cellValue = cellValue.v.toString();
        } else {
            skip = true;
            cellValue = "";
        }
        skip = skip || skipRow;

        return [cellValue, skip];
    }
    async connectToMapas() {
        let mapasSII = null;
        try {
            logger.info("Obteniendo datos de Mapas SII");
            let page;
            mapasSII = new MapasSII(page, this.browser);
            await mapasSII.Secondinit();
            for (let caso of this.casos) {
                if (caso.rolPropiedad !== null && caso.comuna !== null) {
                    try {
                        console.log(`Procesando caso con rol: ${caso.rolPropiedad} en comuna: ${caso.comuna}`);
                        await mapasSII.obtainDataOfCause(caso);
                        await fakeDelay(2, 5);
                        // caso.linkMap = 'a';
                        // await new Promise(resolve => setTimeout(resolve, 1000));
                    } catch (error) {
                        console.error(`Error procesando caso ${caso.rolPropiedad}:`, error.message);
                        continue;
                    }
                }
            }
            // window.destroy();
        } catch (error) {
            // console.error('Error al obtener resultados en Mapas:', error);
            // console.log("valor del mapasSII cuando es error", mapasSII);
            logger.warn('Error al obtener resultados en Mapas:', error);
        } finally {
            if (mapasSII) {
                console.log("Finalizando proceso de Mapas SII");
                mapasSII.finishPage()
            }
        }
        return;
    }
    writeChanges() {
        let lastRow = 5;
        console.log('Escribiendo cambios');

        while (this.ws[`${config.CAUSA}${lastRow}`]) {
            let causa = this.ws[`${config.CAUSA}${lastRow}`].v;
            let isLinkMapEmpty = this.ws[`${config.OTRA_DEUDA}${lastRow}`]? false : true;
            let isAvaluoEmpty = !this.ws[`${config.AVALUO_FISCAL}${lastRow}`];

            for (let caso of this.casos) {
                // console.log("DEL CASO: ",caso.causa,"DEL EXCEL: ", causa);
                if (caso.causa == causa) {
            console.log(`Procesando fila ${lastRow} con causa ${causa}`);
                    if (caso.linkMap && isLinkMapEmpty) {
                        console.log(`Fila ${lastRow}: no tiene mapa y el nuevo es ${caso.linkMap}`);
                        this.ws[`${config.OTRA_DEUDA}${lastRow}`] = { v: caso.linkMap, t: 's' };
                    }else{
                        console.log(`Fila ${lastRow}: ya tiene mapa y es ${this.ws[`${config.OTRA_DEUDA}${lastRow}`]}`);
                    }
                    if (caso.AVALUO_FISCAL && !isAvaluoEmpty) {
                        this.ws[`${config.AVALUO_FISCAL}${lastRow}`] = { v: caso.avaluoPropiedad, t: 's' };
                    }
                }
            }
            lastRow++;
        }
        this.ws[`!ref`] = RANGO_EXCEL + lastRow;
        const fileName = this.filePath.split('.')[0];
        const newFilePath = fileName + 'CambioMapa' + '.xlsx';
        XLSX.writeFile(this.wb, newFilePath, { cellDates: true });
        console.log(`Cambios escritos en el archivo: ${newFilePath} con ultima fila ${lastRow}`);
    }
    openWindow(window) {
        const isVisible = true;
        window = new BrowserWindow({
            show: isVisible,// Ocultar ventana para procesos en background
        });
        return window;
    }
}

module.exports = obtainLinkMapa;