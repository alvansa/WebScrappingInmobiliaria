const pie = require('puppeteer-in-electron');
const {app, BrowserWindow, ipcMain, dialog,electron} = require('electron');
const puppeteer = require('puppeteer-core');


const Economico = require('../../economico/Economico.js');
const MapasSII = require('../../mapasSII/MapasSII.js');
const ProcesarBoletin = require('../../liquidaciones/procesarBoletin.js');
const PublicosYLegales = require('../../publicosYlegales/publicosYLegales.js');
const Pjud = require('../../pjud/getPjud.js');
const GestorRematesPjud = require('../../pjud/GestorRematesPjud.js')
const SpreadSheetManager = require('../../spreadSheet/SpreadSheetManager.js');
const DataEnricher = require('../../spreadSheet/DataEnricher.js');
const {stringToDate} = require('../../../utils/cleanStrings.js');
const {createExcel} = require('../../excel/createExcel.js');
const {obtainCorteJuzgadoNumbers} = require('../../../utils/corteJuzgado.js');
const { fakeDelay, delay } = require('../../../utils/delay.js');
const {emptyCaseEconomico} = require('../../economico/datosRemateEmol.js');
const {PreRemates} = require('../../preremates/obtenerPublicaciones.js');
const logger = require('../../../utils/logger.js');
const config = require('../../../config.js');

const PJUD = config.PJUD;

class scrapeAuction {
    constructor(startDate,endDate,saveFile, checkedBoxes,event,isEmptyMode,mainWindow,isTestMode = false){
        this.startDate = startDate;
        this.endDate = endDate;
        this.saveFile = saveFile;
        this.checkedBoxes = checkedBoxes;
        this.event = event;
        this.emptyMode = isEmptyMode;
        this.browser = null;
        this.mainWindow = mainWindow; // Guardar la referencia a la ventana principal
        this.isTestMode = isTestMode; // Indica si se está en modo desarrollo
    }

    async startSearch() {
        let casos = [];
        let casosEconomico = [];
        let casosPreremates = [];
        let casosBoletin = [];
        let casosPYL = [];
        let casosPJUD = [];
        let spreadSheetData = null;
        const fechaHoy = new Date();
        await this.launchPuppeteer_inElectron();
        // console.log(`Iniciando la inserción de datos desde ${this.startDate} hasta ${this.endDate} y tipos ${typeof this.startDate} y ${typeof this.endDate}`);
        logger.info(`Iniciando la inserción de datos desde ${this.startDate} hasta ${this.endDate} y tipos ${typeof this.startDate} y ${typeof this.endDate}`);

        if(this.emptyMode){
           casos = emptyCaseEconomico(); 
        }else{

            spreadSheetData =  await SpreadSheetManager.processData();


            casosEconomico = await this.getCasosEconomico(this.startDate, this.endDate, this.checkedBoxes.economico);
            casosPJUD = await this.getCasosPjud(this.startDate, this.endDate, this.checkedBoxes.pjud,this.event)
            // casosPreremates = await this.getCasosPreremates(checkedBoxes.preremates),
            casosBoletin = await this.getCasosBoletin(this.startDate, this.endDate, fechaHoy, this.checkedBoxes.liquidaciones),
            casosPYL = await this.getPublicosYLegales(this.startDate, this.endDate, fechaHoy, this.checkedBoxes.PYL),

            logger.info('Casos obtenidos por fuente');

            if(casosPJUD.length == 0){
                logger.info('Reintentando obtencion de casos PJUD, casos obtenidos: ', casosPJUD.length);
                casosPJUD = await this.getCasosPjud(this.startDate, this.endDate, this.checkedBoxes.pjud,this.event)
            } 

            casos = [...casosPreremates, ...casosBoletin, ...casosPYL, ...casosPJUD];
            
            //Luego de obtener los casos de emol se revisaran los casos obtenidos en pjud
            // casosEconomico = await this.searchEmolAuctionsInPjud(casosEconomico);
            casos = [...casosEconomico, ...casos];
            if(casos.length > 1){
                await this.obtainMapasSIIInfo(casos);
                logger.info('Datos de Mapas SII obtenidos');
            }
        }
        if(!this.isTestMode){
            casos = await this.secondRound(casos);
        }

        if(casos.length === 0){
            // console.log("No se encontraron datos");
            logger.warn("No se encontraron datos");
            return 5;
        }
        const enricher = new DataEnricher();
        enricher.enrichWithSpreadsheetData(casos, spreadSheetData);
        logger.info('Escribiendo casos');
        const createExcelFile = new createExcel(this.saveFile,this.startDate,this.endDate,this.emptyMode,null, this.isTestMode);
        const filePath = createExcelFile.writeData(casos);
        return filePath;
    }

    
    async secondRound(casos){
        let countEmptyParts = 0;
        for(let caso of casos){
            // caso.partes = null;
            if(!caso.partes && caso.origen == PJUD){
                countEmptyParts++;
            }
        }
        //se revisa si de los casos obtenidos 
        if(countEmptyParts <= Math.floor(casos.length/20)){
            logger.info(`No es necesario una segunda vuelta, casos con partes vacias: ${countEmptyParts} de ${casos.length}`);
            return casos;
        }
        const awaitTime = 60 * 60;
        // this.mainWindow.webContents.send('aviso-espera', [awaitTime, countEmptyParts, casos.length]);
        await delay(awaitTime * 1000)
        //Volver a revisar los casos faltantes
        const gestorRemates = new GestorRematesPjud(casos, this.event, this.mainWindow);
        const result = await gestorRemates.getInfoFromAuctions({ skipIfHasPartes: true }); 
        logger.info(`-----------\nSegunda Vuelta \n--------------------------`);
        return casos;
    }

    async getCasosEconomico(fechaInicioStr, fechaFinStr, economicoChecked) {
        if(this.emptyMode){
            return emptyCaseEconomico();
        }
    
        if (!economicoChecked) {
            return [];
        }

        const fixStartDate = stringToDate(fechaInicioStr)
        const fixEndDate = stringToDate(fechaFinStr);

        let fechaInicio = new Date();
        let fechaFin = new Date(); 

        fechaInicio.setDate(fechaInicio.getDate() - 30);

        if(this.isTestMode){
            fechaInicio = stringToDate(fechaInicioStr);
            fechaFin = stringToDate(fechaFinStr); 
        }

        let casos = [];
        try {
            const economico = new Economico(this.browser, fechaInicio, fechaFin, fixStartDate, fixEndDate, this.isTestMode);
            casos = await economico.getCases() || [];
            
        } catch (error) {
            console.error('Error al obtener resultados en emol:', error);
        }
        return casos
    }

    async getCasosPreremates(prerematesChecked) {
        if (!prerematesChecked) {
            return [];
        }
        let casos = [];
        const EMAIL = config.EMAIL;
        const PASSWORD = config.PASSWORD;
        try {
            const window = new BrowserWindow({ show: true });
            const url = 'https://preremates.cl/content/proximos-remates';
            await window.loadURL(url);
            const page = await pie.getPage(this.browser, window);
            const preRemates = new PreRemates(EMAIL, PASSWORD,this.browser,page);
            casos = await preRemates.getRemates();
            window.destroy();
            return casos;
        } catch (error) {
            console.error('Error al obtener resultados en preremates:', error);
            if(window){
                window.destroy();
            }
            return casos;
        }
    }

    async getCasosBoletin(fechaInicioStr,fechaFinStr,fechaHoy,BoletinChecked){

        if(!BoletinChecked){
            return [];
        }
        let casos = [];

        let startDate = new Date();
        let endDate = new Date(); 

        startDate.setMonth(startDate.getMonth() - 1);
        if(this.isTestMode){
            startDate = stringToDate(fechaInicioStr);
            endDate = stringToDate(fechaFinStr);
        }
        // console.log("Obteniendo casos de boletin desde: ", startDate, " hasta: ", endDate);
        logger.info("Obteniendo casos de boletin desde: ", startDate, " hasta: ", endDate);
       try{
            const window = new BrowserWindow({ show: false });
            const url = 'https://www.boletinconcursal.cl/boletin/remates';
            await window.loadURL(url);
            const page = await pie.getPage(this.browser, window);
            const boletinConcursal = new ProcesarBoletin(this.browser,page);
            casos = await boletinConcursal.getPdfData(startDate,endDate,fechaHoy);  
            window.destroy();

        }catch(error){
            console.error('Error al obtener resultados en boletin:', error);
            if(window){
                window.destroy();
            }
        }
        return casos;
    }

    async getPublicosYLegales(fechaInicioStr,fechaFinStr,fechaHoy,PYLChecked){
        if(!PYLChecked){
            return [];
        }
        let casos = [];
        // const startDate = stringToDate(fechaInicioStr);
        // const endDate = stringToDate(fechaFinStr);
        let startDate = stringToDate(fechaInicioStr);
        let endDate = stringToDate(fechaInicioStr); 

        startDate.setMonth(startDate.getMonth() - 1);
        
        try{
            const window = new BrowserWindow({ show: false });
            const url = 'https://www.publicosylegales.cl/';
            await window.loadURL(url);
            const page = await pie.getPage(this.browser, window);
            const publicosYLegales = new PublicosYLegales(startDate,endDate,fechaHoy,this.browser,page,window);
            casos = await publicosYLegales.scrapePage();
            window.destroy();
            return casos;
        } catch (error) {
            console.error('Error al obtener resultados en publicos y legales:', error);
            if(window){
                window.destroy();
            }
            return casos;
        }
    }

    async getCasosPjud(startDateOrigin,endDateOrigin,PJUDChecked, event){
        if(!PJUDChecked){
            return [];
        }
        let casos = [];
        try{
            await this.launchPuppeteer_inElectron();
            const endDateModified = stringToDate(endDateOrigin)
            endDateModified.setDate(endDateModified.getDate() + 1); // Aumentar un dia para incluir el ultimo dia
            const startDate = dateToPjud(stringToDate(startDateOrigin));
            const endDate = dateToPjud(endDateModified);

            casos = await this.searchCasesByDay(startDate, endDate);
            casos.reverse(); // Invertir el orden de los casos para que aparezcan del mas reciente al mas antiguo
            
            const gestorRemates = new GestorRematesPjud(casos,event,this.mainWindow);
            const result = await gestorRemates.getInfoFromAuctions();
            
            // console.log("Cantidad de casos obtenidos de pjud: ", casos.length);
            logger.info("Cantidad de casos obtenidos de pjud: ", casos.length);
        } catch (error) {
            console.error("Error en el pjud :", error.message);
        }

        return casos;

    }

    async obtainMapasSIIInfo(casos) {
        let mapasSII = null;
        // let window = null;
        try {
            // console.log("Obteniendo datos de Mapas SII");
            logger.info("Obteniendo datos de Mapas SII");
            let page;
            mapasSII = new MapasSII(page, this.browser);
            await mapasSII.Secondinit();
            for (let caso of casos) {
                if (caso.rolPropiedad !== null && caso.comuna !== null) {
                    try {
                        await mapasSII.obtainDataOfCause(caso);
                        await fakeDelay(2,5);
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
                mapasSII.finishPage()
            }
        }
        return;
    }

    async searchEmolAuctionsInPjud(casos){
        const fixedStartDate = this.startDate.replace(/-/g,'/');
        const fixedEndDate = this.endDate.replace(/-/g,'/');
        // console.log("Fechas para descartar casos economico: ",fixedStartDate, fixedEndDate, new Date(fixedStartDate), new Date(fixedEndDate));
        logger.info("Fechas para descartar casos economico: ",fixedStartDate, fixedEndDate, new Date(fixedStartDate), new Date(fixedEndDate));

        if (!casos || casos.length === 0) {
            // console.log("No hay casos para buscar en Pjud");
            logger.warn("No hay casos para buscar en Pjud");
            return [];
        }

        obtainCorteJuzgadoNumbers(casos);

        // console.log(`fecha inicio : ${fixedStartDate}, fecha fin: ${fixedEndDate} en Date format: ${new Date(fixedStartDate)}, ${new Date(fixedEndDate)}`);
        
        // const fechaTest = new Date('2025/09/02');
        // console.log('------------------------------------------')
        // console.log("Cantidad de casos pre filtro: ", casos.length);
        // casos.forEach(caso => {
        //     console.log("PRE FILTER",caso.fechaRemate, caso.causa, caso.juzgado);
        // });
        // console.log('------------------------------------------')

        // casos = casos.filter(caso => caso.fechaRemate >= fechaTest && caso.fechaRemate <=  fechaTest );

        // console.log('------------------------------------------')
        // console.log("Cantidad de casos post filtro: ", casos.length);
        // casos.forEach(caso => {
        //     console.log("POST FILTER",caso.fechaRemate, caso.causa, caso.juzgado);
        // });
        // console.log('------------------------------------------')
        if(!this.isTestMode){
            casos = casos.filter(caso => caso.fechaRemate >= new Date(fixedStartDate) && caso.fechaRemate <= new Date(fixedEndDate));
            const gestorRemates = new GestorRematesPjud(casos, this.event, this.mainWindow);
            const result = await gestorRemates.getInfoFromAuctions();
        }
        return casos;
        
    }

    async searchCasesByDay(startDate, endDate) {
        let window;
        let casos = [];
        try{
            window = new BrowserWindow({ show: false });
            const url = 'https://oficinajudicialvirtual.pjud.cl/indexN.php';
            await window.loadURL(url);
            const page = await pie.getPage(this.browser, window);
            const pjud = new Pjud(this.browser, page, startDate, endDate);
            casos = await pjud.datosFromPjud();
            obtainCorteJuzgadoNumbers(casos);
            window.destroy();
            return casos;
        }catch(error){
            console.error("Error al buscar casos por dia en Pjud: ", error.message);
            if (window && !window.isDestroyed()) {
                window.destroy();
            }
        }
        return casos;

    }

    //Funcion para lanzar el navegador estandar de electron sin proxy
    async launchPuppeteer_inElectron(){
        this.browser = await pie.connect(app, puppeteer);
        // console.log("Browser launched");
        logger.info("Browser launched");
    }
}

function openWindow(window, useProxy){
    const isVisible = true;
    if(useProxy){
        const proxyData = JSON.parse(process.env.PROXY_DATA);
        const randomIndex = Math.floor(Math.random() * proxyData.length); 
        window = new BrowserWindow({
            show: isVisible,// Ocultar ventana para procesos en background
            proxy :{
                username: proxyData[randomIndex].username,
                password: proxyData[randomIndex].password,
                server: proxyData[randomIndex].server,
            }
        });
    }else{
        window = new BrowserWindow({
            show: isVisible,// Ocultar ventana para procesos en background
        });
    }
    return window;
}


// Dado un objeto Date, devuelve un string con el formato dd/mm/yyyy
function dateToPjud(date) {
    const dia = String(date.getDate()).padStart(2, '0');  // Asegura que el día tenga dos dígitos
    const mes = String(date.getMonth() + 1).padStart(2, '0');  // Meses son 0-indexados, por lo que sumamos 1
    const año = date.getFullYear();
    
    return `${dia}/${mes}/${año}`;
}

module.exports = scrapeAuction;