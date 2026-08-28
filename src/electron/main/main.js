const {app, BrowserWindow, ipcMain, dialog} = require('electron');

const EnvLoader = require('#utils/EnvLoader.js');
EnvLoader.load();

const path = require('node:path');
const puppeteer = require('puppeteer-core');
const pie = require('puppeteer-in-electron');
const os = require('os');

const logger = require('#utils/logger.js');

// Importar el nuevo WindowManager
const WindowManager = require('./windows/WindowManager.js');

const CompleteExcelInfo = require('./prod/CompleteExcelInfo.js');
const ProcesarBoletin = require('#sources/liquidaciones/procesarBoletin.js');
const {createExcel} = require('#exporters/excel/createExcel.js');
const Caso = require('#models/caso/caso.js')
const config = require('#config');
const ConsultaCausaPjud = require('#sources/pjud/consultaCausaPlay.js'); // Versión Playwright
const {tribunalesPorCorte} = require('#utils/corteJuzgado.js');
const {fixStringDate} = require('#utils/cleanStrings.js');
const testUnitarios = require('../dev/testUnitarios.js');
const checkFPMG = require('#sources/pjud/checkFPMG.js');
const obtainLinkMapa = require('../dev/obtainLinkMapa.js');
const SpreadSheetManager = require('#enrichers/spreadSheet/SpreadSheetManager.js');

const PuppeteerManager = require('#core/scrapeAuction/services/PuppeteerManager.js');
const PlaywrightManager = require('#core/scrapeAuction/services/PlaywrightManager.js');

const EconomicosSource = require('#core/scrapeAuction/sources/EconomicosSource.js');
const PjudSource = require('#core/scrapeAuction/sources/PjudSource.js');
const LiquidacionesSource = require('#core/scrapeAuction/sources/LiquidacionesSource.js');
const MacalSource = require('#core/scrapeAuction/sources/MacalSource.js');
const CapitalRematesSource = require('#core/scrapeAuction/sources/CapitalRematesSource.js');
const PjudPlaywrightSource = require('#core/scrapeAuction/sources/PjudPlaywrightSource.js');

const DataInmobiliariaEnricher = require('#core/scrapeAuction/enrichers/DataInmobiliariaEnricher.js');
const MapasSIIEnricher = require('#core/scrapeAuction/enrichers/MapasSIIEnricher.js');
const SpreadSheetEnricher = require('#core/scrapeAuction/enrichers/SpreadSheetEnricher.js');

const ExcelExporter = require('#core/scrapeAuction/exporters/ExcelExporter.js');

const auctionScraperOrchestator = require('#core/scrapeAuction/auctionScraperOrchestator.js');


const isDevMode = process.argv.includes('--dev');
const isEmptyMode = process.argv.includes('--empty');
const isTestMode = process.argv.includes('--test');


let pieInitialized = pie.initialize(app);

const PJUD = 2;
const LIQUIDACIONES = 3;
const SHOW_MODE = false;

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

            if(isDevMode){
                this.createMainWindow()
            }else{
                this.mainWindow = this.windowManager.createMainWindow();
            }

            // Inicializar Puppeteer browser compartido
            await this.launchPuppeteerInElectron();
            this.windowManager.setBrowser(this.browser);

            app.on('activate', () => {
                if (BrowserWindow.getAllWindows().length === 0) {
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
            width: 900,
            height: 900,
            webPreferences: {
                preload: path.join(__dirname, './preload/mainPreload.js'), // Archivo que se ejecutará antes de cargar el renderer process
                nodeIntegration: true,
                webPreferences : {devTools : isDevMode},
                devTools : isDevMode
            },
        })

        if(isDevMode){
            this.mainWindow.loadFile(path.join(__dirname, 'windows/dev.html'));
            this.mainWindow.webContents.openDevTools({mode:'right'});
            console.log("DevTools opened", isDevMode);
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
                    break;
                    // return 1;
                case 'search':
                    return this.windowManager.createSearchWindow(options);
                case 'singleCase':
                    return this.windowManager.createSingleCaseWindow();
                case 'excel':
                    return this.windowManager.createExcelWindow();
                case 'ladrillero':
                    return this.windowManager.createLadrilleroWindow();
                case 'deuda':
                    return this.windowManager.createDeudaWindow();
                case 'settings':
                    // return this.windowManager.createSettingsWindow();
                    //TODO: Agregar una ventana de configuraciones basicas.
                    this.logToRenderer('Creando ventana de settings')
                    break;
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


        ipcMain.handle('start-proccess' , async (event, startDate, endDate, saveFile, checkedBoxes) => {
            PlaywrightManager.createHumanContext();
            
            const sources = [
                new EconomicosSource(PuppeteerManager,{'mode': config.NORMAL, 'show': SHOW_MODE }, logger, isTestMode ),
                new PjudSource(PuppeteerManager,{'mode': config.NORMAL} ),
                new LiquidacionesSource(PuppeteerManager, {mode: 0, logger: logger, isTestMode: isTestMode }),
                new MacalSource(),
                new CapitalRematesSource(PuppeteerManager, logger, isTestMode), 
                new PjudPlaywrightSource(PlaywrightManager, {mode: config.NORMAL, logger: logger, isTestMode: isTestMode})
            ]

            const enrichers = [
                new SpreadSheetEnricher(),
                new MapasSIIEnricher(PuppeteerManager),
                new DataInmobiliariaEnricher(),
            ]

            const exporter = new ExcelExporter(startDate, endDate, saveFile, { emptyMode : isEmptyMode, type : config.NORMAL, isTestMode : isTestMode });

            const configOrquester = {
                isEmptyMode: isEmptyMode,
                isTestMode: isTestMode,
                config : config,
                checkedBoxes: checkedBoxes,
                saveFile : saveFile,
                mainWindow : this.mainWindow,
                event : event,
            }

            this.currentOrchestator = new auctionScraperOrchestator(sources, enrichers, exporter, configOrquester);
            try {
                const result = await this.currentOrchestator.run(startDate, endDate);
                return result;
            } finally {
                this.currentOrchestator = null;
            }
        });

        ipcMain.handle('stop-proccess', async () => {
            if (this.currentOrchestator) {
                logger.info('Solicitud de detención recibida vía IPC stop-proccess');
                this.currentOrchestator.stop();
                return true;
            }
            return false;
        });


        ipcMain.handle('complete-info-excel', async (event, filePath) => {
            try{
                const FillExcel = new CompleteExcelInfo(filePath,event,this.mainWindow);
                await FillExcel.fillData();
                this.mainWindow.send("electron-log","En la funcion de completar excel")
                return true;

            }catch(error){
                console.error('Error al completar la informacion del excel completInfoExcel:', error);
                return null;
            }
        });

        // Funcion para buscar la informacion del pjud en pdf en base a una fecha de inicio y final.
        ipcMain.handle('process-FPMG', async (event) => {
            try{
                const filePath = null;
                this.logToRenderer(`Obtenienido ladrillos`)
                const result = await SpreadSheetManager.processData();
                if(result.result == false){
                    this.logToRenderer(`Error con ${result.data}`)
                    return false;
                }
                let data  = result.data;
                this.logToRenderer(`Cantidad de filas obtenidad ${data.length}`)
                const check = new checkFPMG(event, this.mainWindow, filePath, data);
                await check.process();
                this.logToRenderer(`Ladrillos obtenidos`)
                return true;
            }catch(error){
                console.error('Error al completar la informacion del excel processFPMG:', error);
                return null;
            }
        });

        ipcMain.handle('process-DEUDA', async (event, filePath, fechaLimite) => {
            try{
                // fechaLimite llega como string "YYYY-MM-DD" desde el <input type="date">
                // del renderer. fixStringDate la deja en "YYYY/MM/DD" para que new Date(...)
                // la interprete en hora local (evita el corrimiento de un dia de parsear ISO
                // con 'Z'). Si no llega fecha, se deja null y checkFPMG usa su default interno.
                fechaLimite = fechaLimite ? new Date(fixStringDate(fechaLimite)) : null;
                const data = await SpreadSheetManager.processData();
                if(data){
                    let parsedData = data.data;
                    const check = new checkFPMG(event, this.mainWindow, filePath, parsedData);
                    const result = await check.proccesDeudaSeguir(fechaLimite);
                    return result;
                }
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
                ]
            });
            return result.filePaths[0] || null;
        });

        // funcion que dado un archivo pdf lo procesa con la funcion del boletin.
        ipcMain.handle('process-file', async (event, filePath) => {
            try {
                // Aquí puedes procesar el archivo seleccionado
                console.log('Archivo seleccionado:', filePath);
                const caso = crearCasoPrueba();
                caso.origen = LIQUIDACIONES;
                caso.causa = null;
                caso.juzgado = null;
                const pdfProcess = new ProcesarBoletin(null,null);
                const result = await ProcesarBoletin.convertPdfToText(filePath);
                pdfProcess.obtainDataRematesPdf(result, caso);
                const newExcel = true;  
                if (newExcel) {
                    console.log("Creando excel con los datos del caso de prueba\n------------------------");
                    const downloadPath = path.join(os.homedir(), "Documents", "infoRemates");
                    const excel = new createExcel(downloadPath, null, null, false, "one");
                    await excel.writeData(caso, `PDF-${caso.causa}`);
                }
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

        ipcMain.handle('countLadrillos', async (event, filePath) => {
            console.log(`Count Ladrillos en el main archivo recibido ${filePath}`);
                const data = await SpreadSheetManager.processData();
                // const data = true;
                if(data){
                    let parsedData = data.data;
                    // let parsedData = true;
                    const check = new checkFPMG(event, this.mainWindow, filePath, parsedData);
                    check.obtainNumberOfLadrillosFromExcel(filePath);
                }
        })
    }

    logToRenderer(msg){
        this.mainWindow.webContents.send('message-renderer', msg)
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
}

async function consultaCausa(caso){
    const consultaCausa = new ConsultaCausaPjud(PlaywrightManager, caso, this.mainWindow, this.type);
    const result = await consultaCausa.getConsulta();
    return result;
}

function crearCasoPrueba(){
    const caso = new Caso("2025/11/30");
    caso.juzgado = "8º JUZGADO CIVIL DE SANTIAGO";
    caso.causa = "C-2484-2023";
    caso.fechaRemate = "02/12/2024 15:30";

    return caso;
}

new MainApp();