const {app, BrowserWindow, ipcMain, dialog,electron} = require('electron');
const path = require('node:path');
const puppeteer = require('puppeteer-core');
const pie = require('puppeteer-in-electron');
const os = require('os');

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
const {tribunalesPorCorte} = require('../../utils/corteJuzgado.js');


const isDevMode = process.argv.includes('--dev');
const emptyMode = process.argv.includes('--empty');

let pieInitialized = pie.initialize(app);

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
    // Funcion para lanzar el navegador con Proxy
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

        ipcMain.handle("start-proccess", async (event,startDate,endDate,saveFile, checkedBoxes) => {
            console.log("handle start-proccess starDate: ", startDate, " endDate: ", endDate, " saveFile: ", saveFile, " checkedBoxes: ", checkedBoxes);
            try{
                const filePath = await this.insertarDatos(startDate,endDate,saveFile, checkedBoxes);
                return filePath;

            }catch(error){
                console.error('Ocurrió un error:', error);
            };
        });

        ipcMain.handle('testEconomico', async (event,args) => {
            try{
                await this.testEconomico(event,args)

            }catch(error){
                console.error('Error al obtener resultados:', error);
            }
        });

        ipcMain.handle('open-dialog-local', async () =>{
            const result = await dialog.showOpenDialog(this.mainWindow, {
                properties: ['openFile'],
                filters: [
                  { name: 'Todos los archivos', extensions: ['*'] }
                ]
            });
            return result.filePaths[0] || null;
        });

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
                const result = await ProcesarBoletin.convertPdfToText2(filePath);
                pdfProcess.obtainDataRematesPdf(result, caso);
                console.log("Caso procesado: ", caso.toObject());
                // await processFile(filePath);
            } catch (error) {
                console.error('Error al procesar el archivo:', error);
            }
        });

        ipcMain.handle('obtainTribunalesJuzgado', async (event) => {
            return tribunalesPorCorte;
        })

        ipcMain.handle('search-case', async (event, corte, tribunal,juzgado, rol, year) => {
            try{
                let filePath = null;
                const caso = new Caso("");
                caso.tribunal = tribunal;
                const causa = `C-${rol}-${year}`;
                caso.causa = causa;
                caso.corte = corte;
                caso.juzgado = juzgado;
                caso.numeroJuzgado = tribunal;
                caso.link = "Lgr";
                console.log("Caso: ",caso.toObject()); 
                const result = await consultaCausa(caso);
                console.log("Resultados del caso de prueba en pjud: ", caso.toObject());
                if(result){
                    // Write the case in excel.
                    const downloadPath = path.join(os.homedir(), "Documents", "infoRemates");
                    const createOneExcelFile = new createExcel(downloadPath,null,null,false,"one");
                    filePath = await createOneExcelFile.writeData(caso);
                    console.log("Caso guardado en: ", filePath);
                    console.log("Retornando Caso: ", filePath);
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

    }

    async insertarDatos(startDate,endDate,saveFile, checkedBoxes) {
        let casos = [];
        const fechaHoy = new Date();
        await this.launchPuppeteer_inElectron();
        if(emptyMode){
           casos = emptyCaseEconomico(); 
        }else{
            const [casosEconomico, casosPreremates, casosBoletin, casosPYL, casosPJUD] = await Promise.all([
                this.getCasosEconomico(fechaHoy, startDate, endDate, 3, checkedBoxes.economico),
                this.getCasosPreremates(checkedBoxes.preremates),
                this.getCasosBoletin(startDate, endDate, fechaHoy, checkedBoxes.liquidaciones),
                this.getPublicosYLegales(startDate, endDate, fechaHoy, checkedBoxes.PYL),
                this.getDatosPjud(startDate, endDate, checkedBoxes.pjud)
            ]);

            casos = [...casosEconomico, ...casosPreremates, ...casosBoletin, ...casosPYL, ...casosPJUD];
            await this.obtainMapasSIIInfo(casos);
        }

        if(casos.length === 0){
            console.log("No se encontraron datos");
            return 5;
        }
        const createExcelFile = new createExcel(saveFile,startDate,endDate,emptyMode);
        const filePath = createExcelFile.writeData(casos);
        return filePath;
        
    }
    
    async getCasosEconomico(fechaHoy, fechaInicioStr, fechaFinStr, maxRetries, economicoChecked) {
        if(emptyMode){
            return emptyCaseEconomico();
        }
    
        if (!economicoChecked) {
            return [];
        }

        let casos = [];
        try {
            casos = await getDatosRemate(fechaHoy, fechaInicioStr, fechaFinStr, maxRetries) || [];
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
        const startDate = stringToDate(fechaInicioStr);
        const endDate = stringToDate(fechaFinStr);
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
        const startDate = stringToDate(fechaInicioStr);
        const endDate = stringToDate(fechaFinStr);
        
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

    async getDatosPjud(fechaInicioStr,fechaFinStr,PJUDChecked){
        if(!PJUDChecked){
            return [];
        }
        let casos = [];
        let startDate;
        let endDate;
        if (isDevMode) {
            startDate = cambiarFechaInicio(fechaInicioStr,0);
            endDate = cambiarFechaInicio(fechaFinStr,0);
        } else {
            const daysDiff = calculateDiffDays(fechaInicioStr, fechaFinStr);
            startDate = cambiarFechaInicio(fechaInicioStr, daysDiff);
            endDate = cambiarFechaFin(fechaFinStr);
        }
        // const endDate = cambiarFechaInicio(fechaFinStr,3);
        try{
            const window = new BrowserWindow({ show: false });
            const url = 'https://oficinajudicialvirtual.pjud.cl/indexN.php';
            await window.loadURL(url);
            const page = await pie.getPage(this.browser, window);
            const pjud = new Pjud(this.browser,page,startDate,endDate);
            casos = await pjud.datosFromPjud();
            window.destroy();
            return casos;
        } catch (error) {
            console.error('Error al obtener resultados en PJUD:', error);
            if(window){
                window.destroy();
            }
            return casos;
        }
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
                if (caso.rolPropiedad !== null && caso.comuna !== null) {
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
            console.log("Resultados del texto introducido: ",result);

        }else if(arg === 'testConsultaCausa'){
            const caso = crearCasoPrueba();
            result = await consultaCausa(caso);
            console.log("Resultados del caso de prueba en pjud: ",result.toObject());

        }else if(arg === 'readPdf'){
            console.log("Leyendo PDF ubicado en: ",args[1]);
            const caso = crearCasoPrueba();
            console.log("Leyendo PDF ubicado en: ",args[1]);
            result = await ProcesarBoletin.convertPdfToText2(args[1]);
            const processPDF = new PjudPdfData(caso);
            processPDF.processInfo(result);
            console.log("Resultados del texto introducido: ",caso.toObject());

        }else if(arg === 'consultaMultipleCases'){
            console.log("Consultando multiples casos"); 
            const casos = [];
            const caso1 = this.createCaso("C-3178-2022","4º JUZGADO DE LETRAS EN LO CIVIL DE ANTOFAGASTA");
            casos.push(caso1);
            const caso2 = this.createCaso("C-126-2025","JUZGADO DE LETRAS DE LOS LAGOS");
            casos.push(caso2);
            // const caso3 = this.createCaso("C-3054-2024","2º JUZGADO DE LETRAS DE OSORNO");
            // casos.push(caso3);
            // const caso4 = this.createCaso("C-72-2025","JUZGADO DE LETRAS Y GARANTIA DE PUERTO AYSEN");
            // casos.push(caso4);
            // const caso5 = this.createCaso("C-4733-2024","3º JUZGADO DE LETRAS DE LA SERENA");
            // casos.push(caso5);
            this.obtainCorteJuzgadoNumbers(casos);
            const result = await this.obtainDataFromCases(casos,event);
            console.log("Resultados de los casos en la funcion de llamada: ",casos.length);
            const downloadPath = path.join(os.homedir(), "Documents", "infoRemates");
            const excel = new createExcel(downloadPath,null,null,false,"oneDay");
            await excel.writeData(casos,`${caso1.causa}-${caso2.causa}`);

        }else if(arg === 'consultaDia'){
            console.log("Consultando casos por dia 30 de mayo");
            const casos = await this.searchCasesByDay();
            console.log("Resultados de los casos en la funcion de llamada: ",casos.length);
            const result = await this.obtainDataFromCases(casos,event);
            console.log("Resultados de los casos en la funcion de llamada: ",casos.length);
            const downloadPath = path.join(os.homedir(), "Documents", "infoRemates");
            const excel = new createExcel(downloadPath,null,null,false,"oneDay");
            await excel.writeData(casos,"Remates-02-junio");

        }else if(arg === 'testEconomicoPuppeteer'){
            const fechaInicio = new Date("2025/05/22");
            const fechaFin = new Date("2025/05/23");
            const economico = new Economico(this.browser, fechaInicio, fechaFin);
            const casos = await economico.getCases();
            console.log(casos)
        }

    }

    createCaso(causa,juzado){
        const caso = new Caso("2025/11/30");
        caso.juzgado = juzado;
        caso.causa = causa;
        caso.origen = 2;
        return caso;
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
            if(counter < casos.length){
                const awaitTime = Math.random() * (90 - 30) + 30; // Genera un número aleatorio entre 5 y 10
                mainWindow.webContents.send('aviso-espera', [awaitTime,counter + 1,casos.length]);
                console.log(`Esperando ${awaitTime} segundos para consulta numero ${counter + 1} de ${casos.length}`);
                await delay(awaitTime * 1000); 
            } 
        }
    }
    
    //Funcion para obtener los casos del pjud por dia.
    async searchCasesByDay(){
        const startDate = "02/06/2025";
        const endDate = "03/06/2025";
        const window = new BrowserWindow({ show: true });
        const url = 'https://oficinajudicialvirtual.pjud.cl/indexN.php';
        await window.loadURL(url);
        const page = await pie.getPage(this.browser, window);
        const pjud = new Pjud(this.browser, page, startDate, endDate);
        const casos = await pjud.datosFromPjud();
        this.obtainCorteJuzgadoNumbers(casos);
        window.destroy();
        return casos;

    }

    obtainCorteJuzgadoNumbers(casos){
        console.log("Obteniendo los numeros de juzgado y corte de ", casos.length, " casos");
        for(let caso of casos){
            const juzgado = caso.juzgado
            .toLowerCase()
            .replace(/3er/,"3º")
            .replace(/en\s+lo/,"")
            .replace(/de\s+\los\s+lagos/ig,"los lagos")
            .replace(/\s+/g," ")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "");
            console.log("Buscando : ",juzgado);
            const result = this.searchTribunalPorNombre(juzgado);
            if(result){
                caso.corte = result.corte;
                caso.numeroJuzgado = result.value;
                console.log("Caso: ", caso.causa, "Juzgado: ", caso.juzgado, "\nResultado: ", result);
            }
        }
        console.log("Finalizado la revision de casos");
    }
    searchTribunalPorNombre(nombreTribunal) {
        const tribunalesPorCorteNormalized = this.normalizeTribunalesPorCorte(tribunalesPorCorte);
        for (const corte in tribunalesPorCorteNormalized) {
          if (tribunalesPorCorteNormalized.hasOwnProperty(corte)) {
            const tribunales = tribunalesPorCorteNormalized[corte];
            for (let i = 0; i < tribunales.length; i++) {
              if (tribunales[i].nombre.toLowerCase() === nombreTribunal) {
                return {
                  corte: corte,
                  value: tribunales[i].value,
                  index: i
                };
              }
            }
          }
        }
        return null; // Si no se encuentra el tribunal
      }

    normalizeTribunalesPorCorte(tribunalesPorCorte) {
        const normalized = {};
        for (const corte in tribunalesPorCorte) {
          if (tribunalesPorCorte.hasOwnProperty(corte)) {
            normalized[corte] = tribunalesPorCorte[corte].map(tribunal => ({
              ...tribunal,
              nombre: tribunal.nombre
              .toLowerCase()
              .normalize("NFD")
              .replace(/[\u0300-\u036f]/g, "")
              .replace(/gar\./i,"garantia ")
              .replace(/pto\./i,"puerto "),
            }));
          }
        }
        return normalized;
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
    caso.causa = "C-2822-2021";
    caso.fechaRemate = "02/12/2024 15:30";

    return caso;
}

function openWindow(window, useProxy){
    const proxyData = JSON.parse(process.env.PROXY_DATA);
    const randomIndex = Math.floor(Math.random() * proxyData.length); 
    if(useProxy){
        console.log("Se lanza el navegador con proxy");
        window = new BrowserWindow({
            show: true,// Ocultar ventana para procesos en background
            proxy :{
                username: proxyData[randomIndex].username,
                password: proxyData[randomIndex].password,
                server: proxyData[randomIndex].server,
            }
        });
    }else{
        window = new BrowserWindow({
            show: true,// Ocultar ventana para procesos en background
        });
    }
    return window;
}

function stringToDate(fecha) {
    const partes = fecha.split("-"); // Dividimos la fecha en partes [año, mes, día]
    const [año, mes, día] = partes; // Desestructuramos las partes
    return new Date(`${año}/${mes}/${día}`);
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
