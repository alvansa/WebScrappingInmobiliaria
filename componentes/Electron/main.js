const {app, BrowserWindow, ipcMain, dialog,electron} = require('electron');
const path = require('node:path');
const puppeteer = require('puppeteer-core');
const pie = require('puppeteer-in-electron');
const os = require('os');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs')

const scrapeAuction = require('./prod/scrapeAuctions.js');
const Economico = require('../economico/Economico.js');
const {getDatosRemate,emptyCaseEconomico} = require('../economico/datosRemateEmol.js');
const {PreRemates} = require('../preremates/obtenerPublicaciones.js');
const MapasSII = require('../mapasSII/MapasSII.js');
const ProcesarBoletin = require('../liquidaciones/procesarBoletin.js');
const PublicosYLegales = require('../publicosYlegales/publicosYLegales.js');
const Pjud = require('../pjud/getPjud.js');
const createExcel = require('../excel/createExcel.js');
const Caso = require('../caso/caso.js')
const ConsultaCausaPjud = require('../pjud/consultaCausaPjud.js');
const PjudPdfData = require('../pjud/PjudPdfData.js');
const config = require('../../config.js');
const {testTexto,testTextoArgs} = require('../economico/testEconomico.js');
const {downloadPdfFromUrl,checkUserAgent} = require('../pjud/downloadPDF.js');
const { fakeDelay, delay } = require('../../utils/delay.js');
const {tribunalesPorCorte, obtainCorteJuzgadoNumbers} = require('../../utils/corteJuzgado.js');
const {stringToDate} = require('../../utils/cleanStrings.js');


const Causas = require('../../model/Causas.js');


const isDevMode = process.argv.includes('--dev');
const emptyMode = process.argv.includes('--empty');

const devMode = true;

let pieInitialized = pie.initialize(app);

const EMOL = 1;
const PJUD = 2;
const LIQUIDACIONES = 3;

class MainApp{
    constructor(){
        this.mainWindow = null;
        this.browser = null;
        this.mapasSII = null;

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
            this.createMainWindow()
            // Manejo de crash en el renderer
            this.mainWindow.webContents.on('render-process-gone', (event, details) => {
                console.error('Renderer crashed:', details.reason);
                this.cleanupBeforeExit();
            });
            app.on('activate', () => {
                if (BrowserWindow.getAllWindows().length === 0) {
                    this.createMainWindow()
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

    //Funcion para crear la ventana principal
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
    async launchPuppeteer_inElectron(){
        this.browser = await pie.connect(app, puppeteer);
        console.log("Browser launched");
    }

    // Manejar solicitud para abrir el selector de carpetas
    registerIpcHandlers(){
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
                const mainProcess = new scrapeAuction(startDate,endDate,saveFile, checkedBoxes,event,this.mainWindow)
                const filePath = await mainProcess.startSearch();
                console.timeEnd("scrapeAuction");
                return filePath;

            }catch(error){
                console.error('Ocurrió un error:', error);
            };
        });

        // Funcion para buscar la informacion del pjud en pdf en base a una fecha de inicio y final.
        ipcMain.handle('getInfoFromPdfPjud', async (event, filePath,startDate, endDate) => {
            try{
                const filePathPdf = await this.obtainDataPdfPjud(event,filePath,startDate,endDate);
                return filePathPdf;

            }catch(error){
                console.error('Error al obtener información del PDF:', error);
                return null;
            }
        });

        // Funcion utilizada para crear varias pruebas.
        ipcMain.handle('testEconomico', async (event,args) => {
            try{
                await this.testEconomico(event,args)

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

        // funcion que dado un archivo pdf lo procesa con la funcion del boletin.
        ipcMain.handle('process-file', async (event, filePath) => {
            try {
                // Aquí puedes procesar el archivo seleccionado
                console.log('Archivo seleccionado:', filePath);
                // Llama a tu función que procesa el archivo
                const caso = crearCasoPrueba();
                caso.origen = "3";
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

    async testEconomico(event,args){
        await this.launchPuppeteer_inElectron();
        const arg = args[0];
        let result;
        if (arg === 'imbeddedText') {
            result = testTexto();
            console.log("Resultados del texto hardCodded: ",result);

        }else if(arg === 'uploadedText'){
            result = testTextoArgs(args[1]);

        }else if(arg === 'downloadPDF'){
            console.log("Descargando PDF ubicado en: ",args[1]);  
            result = await downloadPdfFromUrl(this.browser,args[1]);

        }else if(arg === 'testConsultaCausa'){
            const caso = crearCasoPrueba();
            result = await consultaCausa(caso);
            console.log("Resultados del caso de prueba en pjud: ",result.toObject());
            console.log(new Date().toString());

        }else if(arg === 'readPdf'){
            const newExcel = args[2];
            console.time("readPdf");
            const caso = crearCasoPrueba();
            const processPDF = new PjudPdfData(caso,null,devMode);
            for(let pdf of args[1]){
                console.log("Leyendo PDF ubicado en: ",pdf);
                result = await ProcesarBoletin.convertPdfToText(pdf,1);
                // console.log("Resultados del texto introducido: ",result);
                processPDF.processInfo(result);
            }
            if(newExcel){
                const downloadPath = path.join(os.homedir(), "Documents", "infoRemates");
                const excel = new createExcel(downloadPath,null,null,false,"one");
                await excel.writeData(caso,`PDF-${caso.causa}`);
            }

            console.debug("Resultados del texto introducido: ", caso.toObject());
                console.timeEnd("readPdf"); 

        }else if(arg === 'consultaMultipleCases'){
            console.log("Consultando multiples casos"); 
            const casos = [];
            const caso1 = this.createCaso("C-2396-2022","2° JUZGADO DE LETRAS DE OSORNO");
            casos.push(caso1);
            const caso2 = this.createCaso("C-3541-2024","2° JUZGADO DE LETRAS DE OSORNO");
            casos.push(caso2);
            const caso3 = this.createCaso("C-417-2025","1° JUZGADO DE LETRAS DE BUIN");
            casos.push(caso3);
            const caso4 = this.createCaso("C-46-2025","3° JUZGADO DE LETRAS DE COQUIMBO");
            casos.push(caso4);
            const caso5 = this.createCaso("C-6-2025","3° JUZGADO CIVIL DE SAN MIGUEL");
            casos.push(caso5);
            const caso6 = this.createCaso("C-373-2025","1° JUZGADO DE LETRAS DE LOS ANDES");
            casos.push(caso6);
            const caso7 = this.createCaso("C-4829-2025","9° JUZGADO CIVIL DE SANTIAGO");
            casos.push(caso7);
            const caso8 = this.createCaso("C-5479-2024","1° JUZGADO CIVIL DE PUENTE ALTO");
            casos.push(caso8);
            const caso9 = this.createCaso("C-572-2025","13° JUZGADO CIVIL DE SANTIAGO");
            casos.push(caso9);
            const caso10 = this.createCaso("C-7697-2024","12° JUZGADO CIVIL DE SANTIAGO");
            casos.push(caso10);
            const caso11 = this.createCaso("C-397-2025","4° JUZGADO DE LETRAS DE TALCA");
            casos.push(caso11);
            const caso12 = this.createCaso("C-4160-2024","1° JUZGADO CIVIL DE SAN MIGUEL");
            casos.push(caso12);
            const caso13 = this.createCaso("C-6328-2025","21° JUZGADO CIVIL DE SANTIAGO");
            casos.push(caso13);
            const caso14 = this.createCaso("C-898-2025","2° JUZGADO DE LETRAS DE IQUIQUE");
            casos.push(caso14);
            const caso15 = this.createCaso("C-96-2025","1° JUZGADO CIVIL DE VALPARAISO");
            casos.push(caso15);
            obtainCorteJuzgadoNumbers(casos);
            const result = await this.obtainDataFromCases(casos,event);
            console.log("Resultados de los casos en la funcion de llamada: ",casos.length);
            const downloadPath = path.join(os.homedir(), "Documents", "infoRemates");
            const excel = new createExcel(downloadPath,new Date(),new Date(),false,"oneDay");
            await excel.writeData(casos,`${casos[0].causa}`);

        }else if(arg === 'consultaDia'){
            console.log("Consultando casos por dia 6 de junio");
            const casos = await this.searchCasesByDay();
            console.log("Resultados de los casos en la funcion de llamada: ",casos.length);
            const result = await this.obtainDataFromCases(casos,event);
            console.log("Resultados de los casos en la funcion de llamada: ",casos.length);
            const downloadPath = path.join(os.homedir(), "Documents", "infoRemates");
            const excel = new createExcel(downloadPath,new Date(),new Date(),false,"oneDay");
            await excel.writeData(casos,"Remates-6-junio");

        }else if(arg === 'testEconomicoPuppeteer'){
            const fechaInicio = new Date("2025/05/22");
            const fechaFin = new Date("2025/05/23");
            const economico = new Economico(this.browser, fechaInicio, fechaFin);
            const casos = await economico.getCases();
            console.log(casos.map(caso => caso.toObject()));
        }else if(arg === 'testPdfTesseract'){
            console.time("testPdfTesseract");
            const convertData = await this.processTeseract(args[1]);
            console.log("Resultados del texto introducido: ", convertData);
            const caso = this.createCaso("C-321-2024","1º JUZGADO DE LETRAS DE ANGOL");
            const processPDF = new PjudPdfData(caso);
            console.log("Procesnado el caso leido con Tesseract: ");
            processPDF.processInfo(convertData);
            console.log("Resultados del caso procesado: ", caso.toObject());
            console.timeEnd("testPdfTesseract");
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

    async obtainDataPdfPjud(event,filePath,startDateOrigin,endDateOrigin){
        console.time("obtainDataPdfPjud");
        await this.launchPuppeteer_inElectron();
        const startDate = dateToPjud(stringToDate(startDateOrigin));
        const endDate = dateToPjud(stringToDate(endDateOrigin));
        console.log("Consultando casos desde ",startDate, " hasta ", endDate);

        const casos = await this.searchCasesByDay(startDate,endDate);
        console.log("Resultados de los casos en la funcion de llamada: ", casos.length);
        const result = await this.obtainDataFromCases(casos, event);
        console.log("Resultados de los casos en la funcion de llamada: ", casos.length);
        // const downloadPath = path.join(os.homedir(), "Documents", "infoRemates");
        const excel = new createExcel(filePath, null, null, false, "oneDay");
        const nombre = `Remates-${startDateOrigin}-${endDateOrigin}`;
        const finalPath = await excel.writeData(casos, nombre);
        console.timeEnd("obtainDataPdfPjud");
        return finalPath;

    }

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
    async searchCasesByDay(startDate, endDate) {
        // const startDate = "06/06/2025";
        // const endDate = "07/06/2025";
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


// Cambia la fecha final de obtencion de datos para el pjud
function cambiarFechaFin(fecha){
    const partes = fecha.split("-"); // Dividimos la fecha en partes [año, mes, día]
    const [año, mes, día] = partes; // Desestructuramos las partes
    let fechaFinal =  new Date(`${año}/${mes}/${día}`);
    fechaFinal.setMonth(fechaFinal.getMonth() + 1);
    const fechaFinalPjud = dateToPjud(fechaFinal);
    return fechaFinalPjud;
}

// Dado la fecha y la cantidad de dias a sumar, cambia la fecha de inicio para el pjud
function cambiarFechaInicio(fecha,dias){
    const partes = fecha.split("-"); // Dividimos la fecha en partes [año, mes, día]
    const [año, mes, día] = partes; // Desestructuramos las partes
    let fechaFinal =  new Date(`${año}/${mes}/${día}`);
    fechaFinal.setDate(fechaFinal.getDate() + dias);
    const fechaFinalPjud = dateToPjud(fechaFinal);
    return fechaFinalPjud;
}

function calculateDiffDays(fechaInicio,fechaFin){
    const fechaInicioDate = stringToDate(fechaInicio);
    const fechaFinDate = stringToDate(fechaFin);
    const diffTime = fechaFinDate - fechaInicioDate;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
}
// Dado un objeto Date, devuelve un string con el formato dd/mm/yyyy
function dateToPjud(date) {
    const dia = String(date.getDate()).padStart(2, '0');  // Asegura que el día tenga dos dígitos
    const mes = String(date.getMonth() + 1).padStart(2, '0');  // Meses son 0-indexados, por lo que sumamos 1
    const año = date.getFullYear();
    
    return `${dia}/${mes}/${año}`;
}


new MainApp();


