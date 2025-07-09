const pie = require('puppeteer-in-electron');
const {app, BrowserWindow, ipcMain, dialog,electron} = require('electron');
const puppeteer = require('puppeteer-core');


const Economico = require('../../economico/Economico.js');
const {getDatosRemate,emptyCaseEconomico} = require('../../economico/datosRemateEmol.js');
const {PreRemates} = require('../../preremates/obtenerPublicaciones.js');
const MapasSII = require('../../mapasSII/MapasSII.js');
const ProcesarBoletin = require('../../liquidaciones/procesarBoletin.js');
const PublicosYLegales = require('../../publicosYlegales/publicosYLegales.js');
const Pjud = require('../../pjud/getPjud.js');
const createExcel = require('../../excel/createExcel.js');
const Caso = require('../../caso/caso.js')
const ConsultaCausaPjud = require('../../pjud/consultaCausaPjud.js');
const PjudPdfData = require('../../pjud/PjudPdfData.js');
const {fixStringDate,stringToDate} = require('../../../utils/cleanStrings.js');
const {tribunalesPorCorte, obtainCorteJuzgadoNumbers} = require('../../../utils/corteJuzgado.js');
const { fakeDelay, delay } = require('../../../utils/delay.js');

class scrapeAuction {

    constructor(startDate,endDate,saveFile, checkedBoxes,event) {
        this.startDate = startDate;
        this.endDate = endDate;
        this.saveFile = saveFile;
        this.checkedBoxes = checkedBoxes;
        this.event = event;
        this.emptyMode = false;
        this.browser = null;
    }

    async startSearch() {
        let casos = [];
        let casosEconomico = [];
        let casosPreremates = [];
        let casosBoletin = [];
        let casosPYL = [];
        let casosPJUD = [];
        const fechaHoy = new Date();
        await this.launchPuppeteer_inElectron();
        console.log(`Iniciando la inserción de datos desde ${this.startDate} hasta ${this.endDate} y tipos ${typeof this.startDate} y ${typeof this.endDate}`);
        if(this.emptyMode){
           casos = emptyCaseEconomico(); 
        }else{
            casosEconomico = await this.getCasosEconomico(fechaHoy, this.startDate, this.endDate, 3, this.checkedBoxes.economico);
            // casosPreremates = await this.getCasosPreremates(checkedBoxes.preremates),
            casosBoletin = await this.getCasosBoletin(this.startDate, this.endDate, fechaHoy, this.checkedBoxes.liquidaciones),
            casosPYL = await this.getPublicosYLegales(this.startDate, this.endDate, fechaHoy, this.checkedBoxes.PYL),
            casosPJUD = await this.getCasosPjud(this.startDate, this.endDate, this.checkedBoxes.pjud,this.event)

            casos = [...casosEconomico, ...casosPreremates, ...casosBoletin, ...casosPYL, ...casosPJUD];
            // await this.obtainMapasSIIInfo(casos);
        }

        if(casos.length === 0){
            console.log("No se encontraron datos");
            return 5;
        }
        const createExcelFile = new createExcel(this.saveFile,this.startDate,this.endDate,this.emptyMode);
        const filePath = createExcelFile.writeData(casos);
        return filePath;
    }

    async getCasosEconomico(fechaHoy, fechaInicioStr, fechaFinStr, maxRetries, economicoChecked) {
        if(this.emptyMode){
            return emptyCaseEconomico();
        }
    
        if (!economicoChecked) {
            return [];
        }

        const fixStartDate = fixStringDate(fechaInicioStr)
        const fixEndDate = fixStringDate(fechaFinStr);
        let fechaInicio = new Date(fixStartDate);
        let fechaFin = new Date(fixEndDate); 

        // fechaInicio.setMonth(fechaInicio.getMonth() - 1);

        // fechaInicio = stringToDate(fechaInicioStr);
        // fechaFin = stringToDate(fechaFinStr); 

        let casos = [];
        try {
            // Funcion antigua para obtener los datos de emol que funciona con axios y cheerio
            // casos = await getDatosRemate(fechaHoy, fechaInicioStr, fechaFinStr, maxRetries) || [];
            // Funcion nueva para obtener los datos de emol que funciona con puppeteer
            console.log("Obteniendo casos de economico desde: ", fechaInicio, " hasta: ", fechaFin);
            const economico = new Economico(this.browser, fechaInicio, fechaFin);
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
        console.log("Obteniendo casos de preremates");
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
            console.error('Error al obtener resultados:', error);
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
        // const startDate = stringToDate(fechaInicioStr);
        // const endDate = stringToDate(fechaFinStr);
        // let endDate = stringToDate(fechaInicioStr); 
        let startDate = stringToDate(fechaInicioStr);
        let endDate = stringToDate(fechaFinStr); 

        // startDate.setMonth(startDate.getMonth() - 1);
       try{
            const window = new BrowserWindow({ show: true });
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
            
            const result = await this.obtainDataFromCases(casos, event);
            console.log("Cantidad de casos obtenidos de pjud: ", casos.length);
        }catch(error){
            console.error("Error :", error.message);
        }

        return casos;

    }

    async obtainMapasSIIInfo(casos) {
        let mapasSII = null;
        let window = null;
        try {
            const window = new BrowserWindow({ show: true });
            const url = 'https://www4.sii.cl/mapasui/internet/#/contenido/index.html';
            await window.loadURL(url);
            const page = await pie.getPage(this.browser, window);
            const mapasSII = new MapasSII(this.browser, page);
            await mapasSII.init();
            for (let caso of casos) {
                if (caso.rolPropiedad !== null && caso.comuna !== null && caso.avaluoPropiedad) {
                    console.log(caso.causa, caso.rolPropiedad, caso.comuna, caso.link);
                    await fakeDelay(1, 3);
                    await mapasSII.obtainDataOfCause(caso);
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }
            window.destroy();
        } catch (error) {
            console.error('Error al obtener resultados:', error);
            console.log("valor del mapasSII cuando es error", mapasSII);
        } finally {
            if (window && !window.isDestroyed()) {
                window.destroy();
            }
        }
        return;
    }

    async searchCasesByDay(startDate, endDate) {
        const window = new BrowserWindow({ show: true });
        const url = 'https://oficinajudicialvirtual.pjud.cl/indexN.php';
        await window.loadURL(url);
        const page = await pie.getPage(this.browser, window);
        const pjud = new Pjud(this.browser, page, startDate, endDate);
        const casos = await pjud.datosFromPjud();
        obtainCorteJuzgadoNumbers(casos);
        window.destroy();
        return casos;

    }

    async obtainDataFromCases(casos,event){
        const mainWindow = BrowserWindow.fromWebContents(event.sender);
        let counter = 0;
        for(let caso of casos){
            counter++;
            console.log(`Caso a investigar ${caso.causa} ${caso.juzgado} caso numero ${counter} de ${casos.length}`);
            const result = await consultaCausa(caso);
            if(result){
                console.log("Resultados del caso de prueba en pjud: ",caso.toObject());
            }
            
            if((counter + 1)  < casos.length){
                const awaitTime = Math.random() * (90 - 30) + 30; // Genera un número aleatorio entre 5 y 10
                mainWindow.webContents.send('aviso-espera', [awaitTime,counter + 1,casos.length]);
                console.log(`Esperando ${awaitTime} segundos para consulta numero ${counter + 1} de ${casos.length}`);
                await delay(awaitTime * 1000); 
            } 
        }
    }

    //Funcion para lanzar el navegador estandar de electron sin proxy
    async launchPuppeteer_inElectron(){
        this.browser = await pie.connect(app, puppeteer);
        console.log("Browser launched");
    }
}

function openWindow(window, useProxy){
    const proxyData = JSON.parse(process.env.PROXY_DATA);
    const randomIndex = Math.floor(Math.random() * proxyData.length); 
    const isVisible = true;
    if(useProxy){
        console.log("Se lanza el navegador con proxy");
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

async function consultaCausa(caso){
    const browser = await pie.connect(app, puppeteer);
    let window;
    window = openWindow(window,false);
    const consultaCausa = new ConsultaCausaPjud(browser,window,caso);
    const result = await consultaCausa.getConsulta()

    return result;
}

// Dado un objeto Date, devuelve un string con el formato dd/mm/yyyy
function dateToPjud(date) {
    const dia = String(date.getDate()).padStart(2, '0');  // Asegura que el día tenga dos dígitos
    const mes = String(date.getMonth() + 1).padStart(2, '0');  // Meses son 0-indexados, por lo que sumamos 1
    const año = date.getFullYear();
    
    return `${dia}/${mes}/${año}`;
}

module.exports = scrapeAuction;