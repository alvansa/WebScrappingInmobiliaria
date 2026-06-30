class DialogHandlers{

    constructor(ipcMain, services){
        this.ipcMain = ipcMain;
        this.windowManager = services.windowManager;

        this.registerIpcHandlers();

    }

    registerIpcHandlers(){
        this.ipcMain.handle('open-window', (event, windowType, options = {}) => {
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
                    return this.windowManager.createExcelWindow();
                    return 1;
                case 'ladrillero':
                    return this.windowManager.createLadrilleroWindow();
                case 'deuda':
                    return this.windowManager.createDeudaWindow();
                case 'settings':
                    // return this.windowManager.createSettingsWindow();
                    this.logToRenderer('Creando ventana de settings')
                default:
                    console.error(`Tipo de ventana desconocido: ${windowType}`);
                    return null;
            }
        });
         // Handler para cerrar ventana actual
        this.ipcMain.handle('close-window', (event) => {
            const window = BrowserWindow.fromWebContents(event.sender);
            if (window && !window.isDestroyed()) {
                window.close();
            }
        });

        // Handler para obtener el browser de Puppeteer (compartido entre ventanas)
        this.ipcMain.handle('get-puppeteer-browser', () => {
            return this.browser;
        });


        this.ipcMain.handle('select-folder-btn', async () => {
            const result = await dialog.showOpenDialog(this.mainWindow, {
                properties: ['openDirectory'] // Permite seleccionar carpetas
            });

            // Retornar la ruta seleccionada o null si el usuario cancela
            return result.canceled ? null : result.filePaths[0];
        });

        this.ipcMain.handle('start-proccess' , async (event, startDate, endDate, saveFile, checkedBoxes) => {
            
            const sources = [
                new EconomicosSource(PuppeteerManager,{'mode': config.NORMAL, 'show': true }, logger, isTestMode ),
                new PjudSource(PuppeteerManager,{'mode': config.NORMAL} ),
                new LiquidacionesSource(PuppeteerManager, {mode: 0, logger: logger, isTestMode: isTestMode }),
                new MacalSource(),
                new CapitalRematesSource(PuppeteerManager, logger, isTestMode), 
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

            const orchestator = new auctionScraperOrchestator(sources, enrichers, exporter, configOrquester);
            const filePath = await orchestator.run(startDate, endDate);
            return filePath;

        });


        this.ipcMain.handle('complete-info-excel', async (event, filePath) => {
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
        this.ipcMain.handle('process-FPMG', async (event) => {
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
                // this.logToRenderer(`Data : ${data}`);
                const check = new checkFPMG(event, this.mainWindow, filePath, data);
                await check.process();
                // this.mainWindow.send("electron-log","En la funcion de completar excel")

                this.logToRenderer(`Ladrillos obtenidos`)
                return true;

            }catch(error){
                console.error('Error al completar la informacion del excel:', error);
                return null;
            }
        });

        this.ipcMain.handle('process-DEUDA', async (event, filePath, fechaLimite) => {
            try{
                fechaLimite = null;
                const data = await SpreadSheetManager.processData();
                if(data){
                    let parsedData = data.data;
                    const check = new checkFPMG(event, this.mainWindow, filePath, parsedData);
                    const result = await check.proccesDeudaSeguir(fechaLimite);
                    return result;
                }
                // let data = null;
                // this.mainWindow.send("electron-log","En la funcion de completar excel")

                return true;

            }catch(error){
                console.error('Error al completar la informacion del excel:', error);
                return null;
            }
        });

        this.ipcMain.handle('process-Mapa', async (event, filePath) => {
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
        this.ipcMain.handle('testEconomico', async (event,args) => {
            try{
                const test = new testUnitarios(this.mainWindow,app,event,args);
                await test.mainFunction();
            }catch(error){
                console.error('Error al obtener resultados:', error);
            }
        });

        // Funcion que habre una ventana para seleccionar un archivo pdf
        this.ipcMain.handle('open-dialog-local', async () =>{
            const result = await dialog.showOpenDialog(this.mainWindow, {
                properties: ['openFile'],
                filters: [
                  { name: 'Todos los archivos', extensions: ['*'] }
                ]
            });
            return result.filePaths[0] || null;
        });

        // Funcion que abre la ventana que permite seleccionar varios archivos pdf para su procesamiento
        this.ipcMain.handle('open-dialog-local-multiple', async () => {

            const { canceled, filePaths } = await dialog.showOpenDialog({
                properties: ['openFile', 'multiSelections'],
                filters: [
                    { name: 'PDF Files', extensions: ['pdf'] },
                    { name: 'All Files', extensions: ['*'] }
                ]
            });

            return canceled ? [] : filePaths;
        });

        this.ipcMain.handle('select-excel-path', async ()=>{
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
        this.ipcMain.handle('process-file', async (event, filePath) => {
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
        this.ipcMain.handle('obtainTribunalesJuzgado', async (event) => {
            return tribunalesPorCorte;
        })

        // Funcion para buscar un caso de pjud especificamente dada su causa y tribunal
        this.ipcMain.handle('search-case', async (event, corte, tribunal,juzgado, rol, year) => {
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
        this.ipcMain.handle('consultaDB', async (event, args) => {
           const resultado = await this.testDB(args);
           return resultado;
        });

        //Obtener todos los casos de la tabla causa
        this.ipcMain.handle('getAllCausas', async (event, args) => {
            const dbcausa = new Causas();
            const resultados = dbcausa.getAllCausas();
            console.log('Resultados de las causas en la DB: ',resultados);
            console.log("Cantidad de resultados: ", resultados.length);
            console.log("Buscando si hay un resultado en especifico: ",dbcausa.searchCausa('C-746-2024',9))
            return resultados;
        });
    }
}


module.exports = DialogHandlers;