const {app, BrowserWindow, ipcMain, dialog,electron} = require('electron');
const path = require('node:path');
const puppeteer = require('puppeteer-core');
const pie = require('puppeteer-in-electron');
const os = require('os');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs')

// Importar el nuevo WindowManager
const WindowManager = require('./windows/WindowManager.js');

const scrapeAuction = require('./prod/scrapeAuctions.js');
const CompleteExcelInfo = require('./prod/CompleteExcelInfo.js');
const Economico = require('../economico/Economico.js');
const ProcesarBoletin = require('../liquidaciones/procesarBoletin.js');
const Pjud = require('../pjud/getPjud.js');
const {createExcel} = require('../excel/createExcel.js');
const Caso = require('../caso/caso.js')
const config = require('../../config.js');
const ConsultaCausaPjud = require('../pjud/consultaCausaPjud.js');
const { fakeDelay, delay } = require('../../utils/delay.js');
const {tribunalesPorCorte, obtainCorteJuzgadoNumbers} = require('../../utils/corteJuzgado.js');
const {stringToDate} = require('../../utils/cleanStrings.js');
const testUnitarios = require('./dev/testUnitarios.js');
const checkFPMG = require('../pjud/checkFPMG.js');
const obtainLinkMapa = require('./dev/obtainLinkMapa.js');
const SpreadSheetManager = require('../spreadSheet/SpreadSheetManager.js');

const Causas = require('../../model/Causas.js');

const isDevMode = process.argv.includes('--dev');
const isEmptyMode = process.argv.includes('--empty');
const isTestMode = process.argv.includes('--test');

const devMode = true;

let pieInitialized = pie.initialize(app);

const EMOL = 1;
const PJUD = 2;
const LIQUIDACIONES = 3;

console.log('Main loaded succefully')
class MainApp{
    constructor(){
        this.mainWindow = null;
        this.browser = null;
        this.mapasSII = null;

        this.windowManager = new WindowManager();

        // Manejo de crashes
        process.on('uncaughtException', (error) => {
            console.error('Uncaught Exception:', error);
            this.cleanupBeforeExit(true);
        });

        process.on('unhandledRejection', (reason, promise) => {
            console.error('Unhandled Rejection at:', promise, 'reason:', reason);
            this.cleanupBeforeExit(true);
        });

        app.whenReady().then(async ()=>{
            await pieInitialized;
            // this.createMainWindow()

            if(isDevMode){
                this.createMainWindow()
            }else{
                // Crear ventana principal
                this.mainWindow = this.windowManager.createMainWindow();

            }

            // Inicializar Puppeteer browser compartido
            await this.launchPuppeteerInElectron();
            this.windowManager.setBrowser(this.browser);



            // Manejo de crash en el renderer
            // this.mainWindow.webContents.on('render-process-gone', (event, details) => {
            //     console.error('Renderer crashed:', details.reason);
            //     this.cleanupBeforeExit();
            // });

            app.on('activate', () => {
                if (BrowserWindow.getAllWindows().length === 0) {
                    // this.createMainWindow()
                    this.windowManager.createMainWindow();
                }
            })
        })

        app.on('window-all-closed', () => {
            if (process.platform !== 'darwin') {
                app.quit()
            }
        })

        app.on('before-quit', async () => {
            if(this.browser){
                await this.browser.close();
            }
        });
        this.registerIpcHandlers();
    }

    // Funcion para crear la ventana principal
      createMainWindow(){
        this.mainWindow = new BrowserWindow({
            resizable: false,
            width: 700,
            height: 500,
            webPreferences: {
                preload: path.join(__dirname, './prod/preload.js'), // Archivo que se ejecutará antes de cargar el renderer process
                nodeIntegration: true,
                webPreferences : {devTools : isDevMode}
            },
        })

        if(isDevMode){
            this.mainWindow.loadFile('componentes/Electron/dev/index.html')
            // this.mainWindow.webContents.openDevTools();
            console.log("DevTools opened");
        }else{
            this.mainWindow.loadFile('componentes/Electron/prod/index.html')
        }
    }

    //Funcion para lanzar el navegador estandar de electron sin proxy
    async launchPuppeteerInElectron(){
        this.browser = await pie.connect(app, puppeteer);
        console.log("Browser launched");
    }

    // Manejar solicitud para abrir el selector de carpetas
    registerIpcHandlers(){
        ipcMain.handle('open-window', (event, windowType, options = {}) => {
            console.log(`Solicitando abrir ventana: ${windowType}`);
            
            switch (windowType) {
                case 'main':
                    this.mainWindow = this.windowManager.createMainWindow();
                    console.log("Main window created", this.mainWindow);
                    // return 1;
                case 'search':
                    return this.windowManager.createSearchWindow(options);
                case 'singleCase':
                    return this.windowManager.createSingleCaseWindow();
                case 'excel':
                    // return this.windowManager.createExcelWindow();
                    this.mainWindow.webContents.send('aviso-espera', [5,0,0]);
                    return 1;
                case 'ladrillero':
                    return this.windowManager.createLadrilleroWindow();
                case 'settings':
                    return this.windowManager.createSettingsWindow();
                default:
                    console.error(`Tipo de ventana desconocido: ${windowType}`);
                    return null;
            }
        });
         // Handler para cerrar ventana actual
        ipcMain.handle('close-window', (event) => {
            const window = BrowserWindow.fromWebContents(event.sender);
            if (window && !window.isDestroyed()) {
                window.close();
            }
        });

        // Handler para obtener el browser de Puppeteer (compartido entre ventanas)
        ipcMain.handle('get-puppeteer-browser', () => {
            return this.browser;
        });


        ipcMain.handle('select-folder-btn', async () => {
            const result = await dialog.showOpenDialog(this.mainWindow, {
                properties: ['openDirectory'] // Permite seleccionar carpetas
            });

            // Retornar la ruta seleccionada o null si el usuario cancela
            return result.canceled ? null : result.filePaths[0];
        });

        // Funcion para iniciar el proceso principal de busqueda
        ipcMain.handle("start-proccess", async (event,startDate,endDate,saveFile, checkedBoxes) => {
            console.log("handle start-proccess starDate: ", startDate, " endDate: ", endDate, " saveFile: ", saveFile, " checkedBoxes: ", checkedBoxes);
            try{
                console.time("scrapeAuction");
                const mainProcess = new scrapeAuction(startDate,endDate,saveFile, checkedBoxes,event,isEmptyMode,this.mainWindow,isTestMode)
                const filePath = await mainProcess.startSearch();
                console.timeEnd("scrapeAuction");
                console.log(new Date());
                return filePath;

            }catch(error){
                console.error('Ocurrió un error:', error);
            };
        });

        ipcMain.handle('complete-info-excel', async (event, filePath) => {
            try{
                const FillExcel = new CompleteExcelInfo(filePath,event,this.mainWindow);
                await FillExcel.fillData();
                this.mainWindow.send("electron-log","En la funcion de completar excel")

                return true;

            }catch(error){
                console.error('Error al completar la informacion del excel:', error);
                return null;
            }
        });

        // Funcion para buscar la informacion del pjud en pdf en base a una fecha de inicio y final.
        ipcMain.handle('process-FPMG', async (event, filePath) => {
            try{
                const data = await SpreadSheetManager.processData();
                // let data = null;
                const check = new checkFPMG(event, this.mainWindow, filePath, data);
                await check.process();
                // this.mainWindow.send("electron-log","En la funcion de completar excel")

                return true;

            }catch(error){
                console.error('Error al completar la informacion del excel:', error);
                return null;
            }
        });

        ipcMain.handle('process-Mapa', async (event, filePath) => {
            try{
                const check = new obtainLinkMapa(event, this.mainWindow, filePath);
                await check.process();
                this.mainWindow.send("electron-log","En la funcion de completar excel")

                return true;

            }catch(error){
                console.error('Error al completar la informacion del excel:', error);
                return null;
            }
        });

        // Funcion utilizada para crear varias pruebas.
        ipcMain.handle('testEconomico', async (event,args) => {
            try{
                const test = new testUnitarios(this.mainWindow,app,event,args);
                await test.mainFunction();
            }catch(error){
                console.error('Error al obtener resultados:', error);
            }
        });

        // Funcion que habre una ventana para seleccionar un archivo pdf
        ipcMain.handle('open-dialog-local', async () =>{
            const result = await dialog.showOpenDialog(this.mainWindow, {
                properties: ['openFile'],
                filters: [
                  { name: 'Todos los archivos', extensions: ['*'] }
                ]
            });
            return result.filePaths[0] || null;
        });

        // Funcion que abre la ventana que permite seleccionar varios archivos pdf para su procesamiento
        ipcMain.handle('open-dialog-local-multiple', async () => {

            const { canceled, filePaths } = await dialog.showOpenDialog({
                properties: ['openFile', 'multiSelections'],
                filters: [
                    { name: 'PDF Files', extensions: ['pdf'] },
                    { name: 'All Files', extensions: ['*'] }
                ]
            });

            return canceled ? [] : filePaths;
        });

        ipcMain.handle('select-excel-path', async ()=>{
            const result = await dialog.showOpenDialog(this.mainWindow, {
                properties: ['openFile'],
                filters: [
                  { name: 'Todos los archivos', extensions: ['xlsx']},
                //   { name: 'Todos los archivos', extensions: ['*'] }
                ]
            });
            return result.filePaths[0] || null;

        });

        // funcion que dado un archivo pdf lo procesa con la funcion del boletin.
        ipcMain.handle('process-file', async (event, filePath) => {
            try {
                // Aquí puedes procesar el archivo seleccionado
                console.log('Archivo seleccionado:', filePath);
                // Llama a tu función que procesa el archivo
                const caso = crearCasoPrueba();
                caso.origen = LIQUIDACIONES;
                caso.causa = null;
                caso.juzgado = null;
                const pdfProcess = new ProcesarBoletin(null,null);
                const result = await ProcesarBoletin.convertPdfToText(filePath);
                pdfProcess.obtainDataRematesPdf(result, caso);
                console.log("Caso procesado: ", caso.toObject());
            } catch (error) {
                console.error('Error al procesar el archivo:', error);
            }
        });

        // Funcion para obtener todos los tribunales, cortes y sus respectivos numeros para su busqueda en pjud.
        ipcMain.handle('obtainTribunalesJuzgado', async (event) => {
            return tribunalesPorCorte;
        })

        // Funcion para buscar un caso de pjud especificamente dada su causa y tribunal
        ipcMain.handle('search-case', async (event, corte, tribunal,juzgado, rol, year) => {
            try{
                let filePath = null;
                const caso = new Caso(new Date(),new Date(),"lgr",2);
                caso.tribunal = tribunal;
                const causa = `C-${rol}-${year}`;
                caso.causa = causa;
                caso.corte = corte;
                caso.juzgado = juzgado;
                caso.numeroJuzgado = tribunal;
                caso.origen = PJUD;
                caso.fechaRemate = new Date();
                caso.link = "Lgr";
                console.log("Buscando caso: ",caso.toObject()); 
                console.time("casoUnico");
                
                const result = await consultaCausa(caso);
                // const result = true
                console.timeEnd("casoUnico");
                
                console.log("Resultados del caso de prueba en pjud: ", caso.toObject());
                console.log("Termino a las :", new Date().toString());
                if(result){
                    // Escribe los casos en excel.
                    const downloadPath = path.join(os.homedir(), "Documents", "infoRemates");
                    const createOneExcelFile = new createExcel(downloadPath,null,null,false,"one");
                    filePath = await createOneExcelFile.writeData(caso);
                    console.log("Caso guardado en: ", filePath);
                    return filePath;
                }else{
                    console.log("No se logro procesar el caso");
                    return false;
                }
            }catch(error){
                console.error('Error al buscar el caso:', error.message);
                return null;
            }
        })

        // Funcion para buscar una causa en la BD
        ipcMain.handle('consultaDB', async (event, args) => {
           const resultado = await this.testDB(args);
           return resultado;
        });

        //Obtener todos los casos de la tabla causa
        ipcMain.handle('getAllCausas', async (event, args) => {
            const dbcausa = new Causas();
            const resultados = dbcausa.getAllCausas();
            console.log('Resultados de las causas en la DB: ',resultados);
            console.log("Cantidad de resultados: ", resultados.length);
            console.log("Buscando si hay un resultado en especifico: ",dbcausa.searchCausa('C-746-2024',9))
            return resultados;
        });

        ipcMain.handle('search-repeated-cases', async (event, excelBase, excelNuevo) => {
            try {
                const result = await CompleteExcelInfo.searchRepeatedCases(excelBase, excelNuevo,isDevMode);
                // const result = await CompleteExcelInfo.newSearchRepeatedCases(excelNuevo,isDevMode);
                console.log("Resultados de la busqueda de casos repetidos:", result);
                return result;
            } catch (error) {
                console.error('Error al buscar casos repetidos:', error);
                throw error; // Re-lanzar el error para manejarlo en el lugar donde se llama
            }
        });

    }

    cleanupBeforeExit(isCrash = false) {
        try{
            console.log('Limpieza antes de salir...');
            if (this.browser) {
                this.browser.close();
                this.browser = null;
            }
            BrowserWindow.getAllWindows().forEach((window) => {
                if (!window.isDestroyed()) {
                    window.destroy();
                }
            });
            if(isCrash){
                app.quit(1);
            }else if(process.platform !== 'darwin'){
                app.quit();
            }


        }catch(error){
            console.error('Error al limpiar antes de salir:', error);
        }
    }

    async processTeseract(filePath) {
        try{
            console.log("Procesando archivo con Tesseract:", filePath[0]);
            const form = new FormData();

            form.append('file', fs.createReadStream(filePath[0]));

            // configurate Headers
            const headers = {
                ...form.getHeaders(),
            };

            const respone = await axios.post('http://localhost:8000/processPDF', form, {
                headers: headers,
                responseType: 'json',
            });

            const normalizedData = this.normalizeData(respone.data);
            return normalizedData;

        }catch(error){
            console.error('Error al procesar el archivo con Tesseract:', error);
            return null;
        }
    }

    normalizeData(data) {
        let finalText = "";
        for(let page of data['pages']){
            const text = page.text
            .replace(/(\r\n|\n|\r)/gm, " ")
            .replace(/\s+/g, " ")
            .trim();

            finalText += text + " ";
        }
        return finalText.trim();
    }

    // async obtainDataPdfPjud(event,filePath,startDateOrigin,endDateOrigin){
    //     console.time("obtainDataPdfPjud");
    //     await this.launchPuppeteer_inElectron();
    //     const startDate = dateToPjud(stringToDate(startDateOrigin));
    //     const endDate = dateToPjud(stringToDate(endDateOrigin));
    //     console.log("Consultando casos desde ",startDate, " hasta ", endDate);

    //     const casos = await this.searchCasesByDay(startDate,endDate);
    //     console.log("Resultados de los casos en la funcion de llamada: ", casos.length);
    //     const result = await this.obtainDataFromCases(casos, event);
    //     console.log("Resultados de los casos en la funcion de llamada: ", casos.length);
    //     // const downloadPath = path.join(os.homedir(), "Documents", "infoRemates");
    //     const excel = new createExcel(filePath, null, null, false, "oneDay");
    //     const nombre = `Remates-${startDateOrigin}-${endDateOrigin}`;
    //     const finalPath = await excel.writeData(casos, nombre);
    //     console.timeEnd("obtainDataPdfPjud");
    //     return finalPath;

    // }

    async testDB(causa){
        const db = new Causas();
        const resultados = await  db.getByCausa(causa);
        console.log("Buscando: ",causa ,"\nResultados de la consulta a la base de datos: ",resultados);
        const jsonString = JSON.stringify(resultados, null, 2);
        return JSON.parse(JSON.stringify(resultados));;
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
    
    //Funcion para obtener los casos del pjud por dia.
    // async searchCasesByDay(startDate, endDate) {
    //     // const startDate = "06/06/2025";
    //     // const endDate = "07/06/2025";
    //     const window = new BrowserWindow({ show: true });
    //     const url = 'https://oficinajudicialvirtual.pjud.cl/indexN.php';
    //     await window.loadURL(url);
    //     const page = await pie.getPage(this.browser, window);
    //     const pjud = new Pjud(this.browser, page, startDate, endDate);
    //     const casos = await pjud.datosFromPjud();
    //     obtainCorteJuzgadoNumbers(casos);
    //     window.destroy();
    //     return casos;
    // }



    createCaso(causa,juzado){
        const caso = new Caso("2025/11/30");
        caso.juzgado = juzado;
        caso.causa = causa;
        caso.origen = 2;
        return caso;
    }
}

async function consultaCausa(caso){
    const browser = await pie.connect(app, puppeteer);
    let window;
    window = openWindow(window,false);
    const consultaCausa = new ConsultaCausaPjud(browser,window,caso);
    const result = await consultaCausa.getConsulta()

    return result;
}

function crearCasoPrueba(){
    const caso = new Caso("2025/11/30");
    caso.juzgado = "8º JUZGADO CIVIL DE SANTIAGO";
    caso.causa = "C-2484-2023";
    caso.fechaRemate = "02/12/2024 15:30";

    return caso;
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



new MainApp();


