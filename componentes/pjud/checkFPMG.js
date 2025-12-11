/*
El ladrillero
*/
const path = require('path');
const os = require('os');
const XLSX = require('xlsx');
const { app, BrowserWindow, ipcMain, dialog, electron } = require('electron');
const pie = require('puppeteer-in-electron');
const puppeteer = require('puppeteer-core');
const { fakeDelay, delay } = require('../../utils/delay');

const consultaCausaPjud = require("./consultaCausaPjud");
const CasoBuilder = require('../caso/casoBuilder');
const config = require('../../config');
const { obtainCorteJuzgadoNumbers } = require('../../utils/corteJuzgado');
const {stringToDate, convertDate} = require('../../utils/cleanStrings')
const {matchJuzgado} = require('../../utils/compareText')
const {formatDateToDDMMAA} = require('../../utils/cleanStrings');
const { datalabeling } = require('googleapis/build/src/apis/datalabeling');

const DELAY_RANGE = {"min": 2, "max" : 5}

const indexEstado = config.obtenerNumero('ESTADO');
const indexCausa = config.obtenerNumero('CAUSA');
const indexJuzgado = config.obtenerNumero('TRIBUNAL');
const indexComuna = config.obtenerNumero('COMUNA');
const indexRol = config.obtenerNumero('ROL');
const indexNotas = config.obtenerNumero('NOTAS');
const indexFechaRem = config.obtenerNumero('FECHA_REM');

class checkFPMG {
    constructor(event, mainWindow, filePath,data) {
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
        this.data = data;
    }

    async process() {
        //Obtain cause and judge
        // this.obtainListOfCauses();

        this.obtainListSpreadSheet();


        obtainCorteJuzgadoNumbers(this.casos);

        let cont = 0;
        // for(let caso of this.casos){
        //     if(cont % 3 == 0){
        //         caso.hasChanged = true
        //     }
        //     cont++;
        // }

        console.log("casos revisados : ",this.casos.length);
        for(let caso of this.casos){
            console.log(caso.causa, caso.juzgado, caso.numeroJuzgado, caso.corte);
        }

        //Search and process each cause
        // await this.processList();
        // await delay(5000);

        //Write each cause that had changes in the last week
        // this.writeChanges3();

        console.log("Proceso Finalizado")
        return true;
    }

    obtainListOfCauses() {
        this.wb = XLSX.readFile(this.filePath, { cellDates: true });
        this.ws = this.wb.Sheets[this.wb.SheetNames[0]];
        const lastWrittenRow = XLSX.utils.decode_range(this.ws['!ref']).e.r + 1;
        let lastRow = 2;
        // console.log(this.ws[`${config.TRIBUNAL}3`].v.toString());
        while (lastRow <= lastWrittenRow) {
            let causa, juzgado,fechaDesc;
            let skipRowOutside = false;
            [causa, juzgado, fechaDesc,skipRowOutside] = this.obtainDataFromRow(lastRow);

            if(skipRowOutside){
                lastRow++;
                continue;
            }

            const casoExcel = new CasoBuilder(new Date(fechaDesc), "PJUD", config.PJUD)
                .conCausa(causa)
                .conJuzgado(juzgado)
                .construir();

            // console.log(casoExcel.causa, casoExcel.juzgado);
            this.casos.push(casoExcel)
            lastRow++;
        }
    }

    obtainDataFromRow(lastRow) {
        let skipRow = false;
        const [estadoBusqueda, skip0] = this.obtainCellAndState(config.NOTAS, lastRow, skipRow);
        
        if (estadoBusqueda) {
            if (!estadoBusqueda.toLowerCase().includes('fp')) {
                skipRow = true;
            }
        } else {
            skipRow = true;
        }

        const estadoRemate = this.ws[`${config.ESTADO}${lastRow}`] ? true : false;
        if (estadoRemate) {
            skipRow = true;
        }

        const [causa, skip1] = this.obtainCellAndState(config.CAUSA, lastRow, skipRow);
        const [juzgado, skip2] = this.obtainCellAndState(config.TRIBUNAL, lastRow, skipRow)
        const [fechaRem, skip3] = this.obtainCellAndState(config.FECHA_REM, lastRow, skipRow, false);
        let [type, skip4] = this.obtainCellAndState(config.NOTAS, lastRow, skipRow);

        skipRow = skipRow || skip1 || skip2 || skip3 || skip4;

        if(skipRow){
            return [causa, juzgado, fechaRem, skipRow];
        }

        // Hacer que solo busque las causas que sean mayor a la fecha de hoy.
        const dateToday = new Date();
        if(fechaRem < dateToday){
            skipRow = true;
        }
        if(skipRow){
            return [causa, juzgado, fechaRem, skipRow];
        }
        console.log(`fecha remate ${typeof fechaRem} y fecha hoy ${dateToday}`)
        // console.log(this.ws[`${config.FECHA_REM}${lastRow}`])

        // console.log(fechaRem)


        type = type.toLowerCase();
        

        if(!type.includes("fp")){
            skipRow = true;
            return [causaNormalizada, juzgado, fechaRem, skipRow];
        }
        // console.log(`Type : ${type}`)



        //Normalizar el texto de la causa que puede venir modificado por alguien del excel.
        if(causa){
            const causaNormalizada = causa.replace(/\(s\)/i, '').replace(/S\/I/ig, '').trim();
            // console.log(`${causaNormalizada} ${fechaRem} ${type} ${estadoRemate}`);
            return [causaNormalizada, juzgado, fechaRem, skipRow];
        }else{
            return [causa, juzgado, fechaRem, skipRow];
        }


    }

    obtainCellAndState(cell,lastRow,skipRow,convertToString = true){
        let skip = false;
        let cellValue = this.ws[`${cell}${lastRow}`];
        // console.log(`Cell value: ${cellValue} cell ${cell} ${lastRow}`)
        if(cellValue && cellValue.v) {
            if(convertToString){
                cellValue = cellValue.v.toString();
            }else{
                cellValue = cellValue.v;
            }
        }else{
            skip = true;
            cellValue = "";
        }
        skip = skip || skipRow;
        const result = [cellValue, skip];

        return [cellValue, skip];
    }

    obtainListSpreadSheet(){
        if(!this.data){
            return [];
        }
        const headers = this.data[0];
        const realData = this.data.slice(1);
        console.log("Header ", headers)
        let count = 0;
        for (let line of this.data) {
            count++;
            const dataLine = this.processNewRow(line);
            // 0. revisar que estado no sea no
            if(dataLine.estado){
                if(dataLine.estado.toLowerCase() !== ''){
                    continue;
                }
            }

            // 1. revisar que ni causa ni juzgado sean nulos
            if(!dataLine.causa || !dataLine.juzgado){ 
                continue;
            }
            // 2. revisar que la fecha de remate sea mayor a la fecha actual
            const dateToday = new Date();
            const fechaRemateDate = convertDate(dataLine.fechaRem);
            // console.log(dataLine.fechaRem, fechaRemateDate , dateToday);
            if(fechaRemateDate <= dateToday){
                continue;
            }
            // 3. revisar que las notas contengan "fp"
            if(!dataLine.notas || !dataLine.notas.toLowerCase().includes('fp')){    
                continue; 
            }
            
            const causaNormalizada = dataLine.causa.replace(/\(s\)/i, '').replace(/S\/I/ig, '').trim();

            const casoExcel = new CasoBuilder(new Date(dataLine.fechaRem), "PJUD", config.PJUD)
                .conCausa(causaNormalizada)
                .conJuzgado(dataLine.juzgado)
                .construir();

            this.casos.push(casoExcel);
            // console.log(causa, juzgado, comuna, rol);
            // processNewRow(line);
        }
    }



    processNewRow(line){

        const causa = line[indexCausa];
        const juzgado = line[indexJuzgado];
        const comuna = line[indexComuna];
        const rol = line[indexRol];
        const notas = line[indexNotas];
        const fechaRem = line[indexFechaRem];
        const estado = line[indexEstado];


        return {
            'estado' : estado, 
            'causa': causa,
            'juzgado' :  juzgado,
            'comuna' : comuna,
            'rol' : rol, 
            'notas' : notas, 
           'fechaRem' : fechaRem 
        }
    }
    

    async processList() {
        const mainWindow = BrowserWindow.fromWebContents(this.event.sender);
        let counter = 0;
        try {
            for (let caso of this.casos) {
                counter++;
                // console.log(`Caso a investigar ${caso.causa} ${caso.juzgado} caso numero ${counter} de ${this.casos.length}`);
                if (!caso.numeroJuzgado || !caso.corte) {
                    // console.log(`Caso ${caso.causa} no tiene numero de juzgado ni corte, se omite`);
                    continue;
                }
                const result = await this.consultaCausa(caso);
                if (result) {
                    // console.log("Resultados del caso de prueba en pjud: ", caso.toObject());
                }

                if ((counter + 1) < this.casos.length) {
                    const awaitTime = Math.random() * (90 - 30) + 30; // Genera un número aleatorio entre 30 y 90
                    mainWindow.webContents.send('aviso-espera', [awaitTime, counter + 1, this.casos.length]);
                    // console.log(`Esperando ${awaitTime} segundos para consulta numero ${counter + 1} de ${this.casos.length}`);
                    await delay(awaitTime * 1000);
                }
            }
        } catch (error) {
            console.error("Error al obtener datos de los casos: ", error.message);
        }
    }

    async consultaCausa(caso) {
        this.browser = await pie.connect(app, puppeteer);
        this.window = this.openWindow(this.window, false);
        let result = await this.processCausa(caso);

        return result;
    }

    async processCausa(caso) {
        let lineaAnterior = '';
        try {
            await this.loadConfig();
            await this.loadPageWithRetries();

            let result = await this.procesarCaso(lineaAnterior,caso)
            return result;
        } catch (error) {
            console.error(error.message);
        }finally{
            if(this.window && !this.window.isDestroyed()){
                console.log("Cerrando ventana del pjud");
                this.window.close();
            }}
    }
    async loadConfig() {
        // User-Agents por defecto en caso de que .env no esté disponible
        const defaultUserAgents = [
            { userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' },
            { userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' }
        ];

        let userAgents;

        try {
            // Intenta cargar USER_AGENTS desde .env, si no existe usa los valores por defecto
            userAgents = process.env.USER_AGENTS ? JSON.parse(process.env.USER_AGENTS) : defaultUserAgents;
        } catch (error) {
            console.error('Error parsing USER_AGENTS from .env, using default agents:', error);
            userAgents = defaultUserAgents;
        }

        // Selecciona un User-Agent aleatorio
        const randomIndex = Math.floor(Math.random() * userAgents.length);

        try {
            await this.window.loadURL(this.link);
            this.page = await pie.getPage(this.browser, this.window);
            await this.page.setUserAgent(userAgents[randomIndex].userAgent);
            await this.page.goto(this.link);
        } catch (error) {
            console.error('Error during page navigation:', error);
            throw error; // Opcional: relanzar el error si quieres manejarlo fuera
        }
    }

    async loadPageWithRetries(maxRetries = 3) {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                console.log(`Intento ${attempt} de carga de página...`);
                await this.page.goto(this.link, { waitUntil: 'networkidle2' });
                await this.page.waitForSelector('#competencia');
                console.log(`Página cargada exitosamente en el intento ${attempt}`);
                return; // Salir de la función si se carga correctamente
            } catch (error) {
                console.error(`Error al cargar la página (intento ${attempt}):`, error.message);
                if (attempt === maxRetries) {
                    throw new Error(`No se pudo cargar la página después de ${maxRetries} intentos`);
                }
            }
            await fakeDelay(DELAY_RANGE.min, DELAY_RANGE.max);
        }
    }
    async procesarCaso(lineaAnterior,caso) {
        let cambioPagina = false;
        try {
            const valorInicial = await this.setValoresIncialesBusquedaCausa(caso);
            if (!valorInicial) {
                console.log('No se pudieron setear los valores iniciales');
                return false; // Salta al siguiente caso
            }
        } catch (error) {
            console.error('Error al setear los valores iniciales:', error.message);
            return false; // Salta al siguiente caso
        }

        try {
            cambioPagina = await this.revisarPrimeraLinea(lineaAnterior);
        } catch (error) {
            console.error('Error al verificar o procesar la primera línea del caso:', error.message);
            return lineaAnterior; // Salta al siguiente caso
        }

        try {
            if (!cambioPagina) {
                console.log('No se cambio el resultado. Saltando caso.');
                return false // Salta al siguiente caso
            }
        } catch (error) {
            console.error('Error al obtener la primera línea del caso:', error.message);
            return lineaAnterior; // Salta al siguiente caso
        }

        const isValid = await this.searchAuctionInfo(caso);
        if (isValid) {
            console.log("Datos posibles del caso obtenidos correctamente");
            return true;
        } else {
            console.log('Fallo al buscar la informacion');
            return false;
        }
    }
    async searchAuctionInfo(caso) {
        let changedCuaderno = false;
        console.log('Se esta buscando los datos del cuaderno');
        let caseIsFinished = false;
        // Busca y presiona el boton que muestra la tabla principal del caso.
        const findLink = await this.searchButtonAuction();

        if (!findLink) {
            console.error("No se pudo encontrar el enlace del caso");
            return false;
        }
        // --------------------------------------------------------
        
        //Se buscan los cuadernos posibles para averiguar si hay algun cambio en alguno
        // let selectedCuadernos = await this.selectCuaderno();
        // const nombresCuadernos = selectedCuadernos.map(obj => ({nombre: obj.text ,buscado: false }));
        
        // for(let cuaderno of nombresCuadernos){
        //     if(cuaderno.buscado){
        //         continue;
        //     }
        //     // selectedCuadernos = await this.selectCuaderno();
        //     const cuadernoToSearch = selectedCuadernos.find(option => option.text === cuaderno.nombre);
        //     changedCuaderno = await this.pressCuaderno(cuadernoToSearch.value);
        //     if (changedCuaderno == false) {
        //         changedCuaderno = await this.pressCuaderno(cuadernoToSearch.value);
        //     }
        //     if(!changedCuaderno){
        //         console.log('No se cambio el cuaderno');
        //         return false;
        //     }
        //     cuaderno.buscado = true;
        //     console.log('cuaderno cambiado exitosamente')
        //     caseIsFinished = await this.searchInMainTable(caso);
        // }
        // ---------------------------------------------------------
        await this.newPressNotebook(caso);
        return true;
    }

    async selectCuaderno() {
        const selectorCuaderno = '#selCuaderno';
        // Espera a que se carguen las opciones de Historia Causa Cuaderno
        try {
            await this.page.waitForSelector(selectorCuaderno);

            // Obtener todas las opciones del <select>
            const options = await this.page.$$eval('#selCuaderno option', (opts) => {
                return opts.map(option => ({
                    text: option.textContent.trim(),
                    value: option.value
                }));
            });
            // console.log('********************************');
            // for(let i of options){
            //     console.log(i.text, i.value);
            // }
            // console.log('********************************');
            return options;

        } catch (error) {
            console.error('Error al esperar el selector de cuaderno:', error.message);
            return false;
        }
    }

    async pressCuaderno(cuaderno){
        const selectorCuaderno = '#selCuaderno'
        await this.page.waitForSelector(selectorCuaderno);
        // ✅ Verificar que el select tenga opciones
        const optionsLoaded = await this.page.waitForFunction(
            selector => document.querySelector(selector).options.length > 0,
            { timeout: 10000 },
            selectorCuaderno
        );
        if(!optionsLoaded){
            console.log(`No se cargaron las opciones en ${selectorCuaderno}`);
            return false;
        }
        
         // Log detallado opcional
        const optionsDetails = await this.page.$$eval(`${selectorCuaderno} option`, options =>
            options.map(opt => ({
                text: opt.textContent.trim(),
                value: opt.value
            }))
        );

        await this.page.select(selectorCuaderno, cuaderno);
        await fakeDelay(DELAY_RANGE.min, DELAY_RANGE.max);
        const cuadernoValue = await this.page.$eval(selectorCuaderno, el => el.value);
        return true;
    }

    async newPressNotebook(caso){
        const selectorCuaderno = '#selCuaderno';
        await this.page.waitForSelector(selectorCuaderno);
        const notebooks = await this.page.evaluate(() => {
            const selectElement = document.querySelector('#selCuaderno');
            return Array.from(selectElement.options).map(option => option.value);
        });
        if(!notebooks || notebooks.length < 1){
            console.log("No hay cuadernos para seleccionar");
            return false;
        }
        const countNotebooks = notebooks.length;
        for(let i = 0; i < countNotebooks; i++){    
            await this.page.evaluate((counter) => {
                const selectElement = document.querySelector('#selCuaderno');
                if (selectElement && selectElement.options.length > 1) {
                    selectElement.selectedIndex = counter; // Selecciona la segunda opción (índice 1)
                    const event = new Event('change', { bubbles: true });
                    selectElement.dispatchEvent(event); // Dispara el evento 'change'
                }
            }, i);

            await this.searchInMainTable(caso);
            await fakeDelay(DELAY_RANGE.min, DELAY_RANGE.max);

            console.log("Buscando en no resueltos");
            await this.searchInMainTable(caso, 'notResolved');
            await fakeDelay(DELAY_RANGE.min, DELAY_RANGE.max);
        }

    }

    async searchButtonAuction() {
        try{
            // Espera a que la tabla esté presente en la página
            await this.page.waitForSelector('#verDetalle a');

            // Selecciona el enlace dentro del tbody con id "verDetalle"
            const link = await this.page.$('#verDetalle a');
            if(!link){
                console.log("Enlace no econtrado");
                return false
            }
            await fakeDelay(DELAY_RANGE.min, DELAY_RANGE.max);
            await link.click(); // Simula un clic en el enlace
            return true;
        }catch(error){
            console.error('Enlace al buscar y presionar el enlace: ',error.message)
            return false;
        }
    }
    async searchInMainTable(caso, table = 'main') {
        let caseIsFinished = false;
        let isDone;
        let selector;
        if(table == 'main'){
            selector = '#historiaCiv';
        }else{
            selector = '#EscritosCiv';
        }
        try {
            await this.page.waitForSelector(selector, { timeout: 10000 });
            // Get all rows from the table
            const rows = await this.page.$$(`${selector} .table tbody tr`);
            
            for (const row of rows) {
                // Track if the row is processed successfull
                try {
                    if (caseIsFinished) {
                        return true; // Si ya se obtuvo todo lo necesario del caso, salimos del bucle
                    }
                    if(table == 'main'){
                        caseIsFinished = await this.searchForDirectory(row, caso);
                    }else{
                        caseIsFinished = await this.searchForDirectoryNotResolved(row, caso);
                    }
                    return false;
                } catch (error) {
                    console.error(`Error processing row on attempt : ${error.message}`);
                    isDone = false;
                }
            }
        } catch (error) {
            console.error('Error en la función getDatosTablaRemate:', error.message);
            return false;
        }
    }

    async searchForDirectory(row,caso) {
        const dateToday = new Date();
        dateToday.setDate(dateToday.getDate() - 7);
        try {
            const [number, uselessFile, directory, dirHasLink, stage, tramite, descripcion, fecha] = await Promise.all([
                row.$eval('td:nth-child(1)', el => el.textContent.trim()),
                row.$eval('td:nth-child(2)', el => el.textContent.trim()),
                row.$eval('td:nth-child(3)', el => el.textContent.trim()),
                row.$eval('td:nth-child(3)', el => el.querySelector('a') !== null),
                row.$eval('td:nth-child(4)', el => el.textContent.trim()),
                row.$eval('td:nth-child(5)', el => el.textContent.trim()),
                row.$eval('td:nth-child(6)', el => el.textContent.trim()),
                row.$eval('td:nth-child(7)', el => el.textContent.trim()),
            ]);
            console.log(stringToDate(fecha), fecha, dateToday);
            if(stringToDate(fecha) >= dateToday){
                caso.hasChanged = true;
                
                console.log("EXITO")
            }

            console.log('Fila:', number, uselessFile, directory, stage, tramite, descripcion, fecha);
            console.log('---------------------------------------------------------');

            return false;
        } catch (error) {
            console.error('Error al obtener los datos de la fila:', error.message);
            return false;
        }
    }

    async searchForDirectoryNotResolved(row,caso) {
        const dateToday = new Date();
        dateToday.setDate(dateToday.getDate() - 7);
        try {
            const [number, uselessFile, date,type,lawyer] = await Promise.all([
                row.$eval('td:nth-child(1)', el => el.textContent.trim()),
                row.$eval('td:nth-child(2)', el => el.textContent.trim()),
                row.$eval('td:nth-child(3)', el => el.textContent.trim()),
                row.$eval('td:nth-child(4)', el => el.textContent.trim()),
                row.$eval('td:nth-child(5)', el => el.textContent.trim()),
            ]);
            console.log(stringToDate(date), date, dateToday);
            if(stringToDate(date) >= dateToday){
                caso.hasChanged = true;
                console.log("EXITO")
            }

            console.log('Fila:', number, uselessFile, date, type, lawyer);
            console.log('---------------------------------------------------------');

            return false;
        } catch (error) {
            console.error('Error al obtener los datos de la fila:', error.message);
            return false;
        }
    }
    openWindow(window) {
        const isVisible = false;
        window = new BrowserWindow({
            show: isVisible,// Ocultar ventana para procesos en background
        });
        return window;
    }


    async setValoresIncialesBusquedaCausa(caso) {
        // Primero se revisa que el caso tenga los valores necesarios para la búsqueda
        const valores = this.validateInitialValues(caso);
        if(!valores){ return false;}
        console.log('Valores precargados : Listo');

        if(!await this.configurateCompetencia()){ return false; }
        console.log('Competencia : Listo');

        if(!await this.configurateCorte(valores.corte)){ return false; }
        console.log('Corte : Listo');

        if(!await this.configurateTribunal2(valores.juzgado)){ return false; }
        console.log('Tribunal : Listo');

        if(!await this.configurateCausa(valores.causa)){ return false; }
        console.log('Causa : Listo');

        if(!await this.configurateAnno(valores.anno)){ return false; }
        console.log('Año : Listo');

        return true;
    }
    validateInitialValues(caso){
        const valores = {
            corte: caso.corte,
            juzgado: caso.numeroJuzgado,
            causa: caso.getCausaPjud(),
            anno: caso.getAnnoPjud()
        };
        for (const [clave,valor] of Object.entries(valores)){
            if(valor === null){
                console.log('Falta valor:',clave);
                return false;
            }
        }
        return valores;
    }

    async configurateCompetencia(){
        const valorCompetencia = "3";
        
        try{
            // Seleccionar competencia
            await this.page.waitForSelector('#competencia');
            await this.page.select('#competencia', valorCompetencia);

            // Esperar a que el siguiente selector se actualice
            await this.page.waitForFunction(() => {
                const conCorte = document.querySelector('#conCorte');
                return conCorte && conCorte.options.length > 1; // Verifica que haya más de una opción disponible
            });
            await fakeDelay(DELAY_RANGE.min, DELAY_RANGE.max);
            return true;
        }catch(error){
            console.error('Error al configurar la competencia:', error.message);
            return false;
        }
    }

    async configurateCorte(valorCorte){
        try{
            // Seleccionar corte
            await this.page.select('#conCorte', valorCorte);

            // Opcional: Verifica que el valor fue seleccionado correctamente
            const valorCortePage = await this.page.$eval('#conCorte', el => el.value);
            if (valorCortePage !== valorCorte) {
                console.log('No se seleccionó el corte:', valorCorte);
                return false;
            }
            // Esperar actualización del selector dependiente
            await this.page.waitForFunction(() => {
                const conTribunal = document.querySelector('#conTribunal');
                return conTribunal && conTribunal.options.length > 1;
            });
            await fakeDelay(DELAY_RANGE.min, DELAY_RANGE.max);
            return true;
        }catch(error){
            console.error('Error al configurar la corte:', error.message);
            return false;
        }
    }

    // Seleccionar el tribunal y verificar que se haya seleccionado correctamente
    async configurateTribunal(valorJuzgado){
        try{
            // Selecciona el valor del tribunal entre las opciones disponibles segun el juzgado
            const valorTribunal = await this.seleccionarTribunal(valorJuzgado);
            if (valorTribunal === null) {
                console.log('No se encontró el tribunal:', valorJuzgado);
                return false;
            }

            await this.page.select('#conTribunal', valorTribunal);
            const tribunalValue = await this.page.$eval('#conTribunal', el => el.value);
            if (tribunalValue !== valorTribunal) {
                console.log('No se seleccionó el tribunal:', valorJuzgado);
                return false;
            }

            // Esperar a que se actualize el selector de tipo de causa
            await this.page.waitForFunction(() => {
                const conTipoCausa = document.querySelector('#conTipoCausa');
                return conTipoCausa && conTipoCausa.options.length > 1;
            });
            await fakeDelay(DELAY_RANGE.min, DELAY_RANGE.max);
            return true;
        }catch(error){
            console.error('Error al configurar el tribunal:', error.message);
            return false;
        }
    }

    async configurateTribunal2(valorTribunal){
        try{
            // Seleccionar corte
            await this.page.select('#conTribunal', valorTribunal);

            // Opcional: Verifica que el valor fue seleccionado correctamente
            const valorCortePage = await this.page.$eval('#conTribunal', el => el.value);
            if (valorCortePage !== valorTribunal) {
                console.log('No se seleccionó el corte:', valorTribunal);
                return false;
            }
            // Esperar actualización del selector dependiente
            await this.page.waitForFunction(() => {
                const conTribunal = document.querySelector('#conTribunal');
                return conTribunal && conTribunal.options.length > 1;
            });
            await fakeDelay(DELAY_RANGE.min, DELAY_RANGE.max);
            return true;
        }catch(error){
            console.error('Error al configurar la corte:', error.message);
            return false;
        }
    }

    async configurateCausa(valorCausa){
        try{
            // Seleccionar tipo de causa
            await this.page.select('#conTipoCausa', 'C');

            // Rol de la causa
            await this.page.waitForSelector('#conRolCausa');
            await this.page.type('#conRolCausa', valorCausa, { delay: Math.random() * 45 });
            const rolValue = await this.page.$eval('#conRolCausa', el => el.value);
            if (rolValue !== valorCausa) {
                console.log('No se seleccionó el rol:', valorCausa);
                return false;
            }
            await fakeDelay(DELAY_RANGE.min, DELAY_RANGE.max);
            return true;
        }catch(error){
            console.error('Error al configurar la causa:', error.message);
            return false;
        }
    }

    async configurateAnno(valorAnno){
        try{
            // Año de la causa
            await this.page.waitForSelector('#conEraCausa');
            await this.page.type('#conEraCausa', valorAnno,{ delay: Math.random() * 45 });
            const annoValue = await this.page.$eval('#conEraCausa', el => el.value);
            if (annoValue !== valorAnno) {
                console.log('No se seleccionó el año:', valorAnno);
                return false;
            }
            await fakeDelay(DELAY_RANGE.min, DELAY_RANGE.max);
            return true;
        }catch(error){
            console.error('Error al configurar el año:', error.message);
            return false;
        }

    }
     async revisarPrimeraLinea(lineaAnterior){
        try {
            await this.page.waitForSelector('#btnConConsulta');
            await this.page.click('#btnConConsulta');
            await fakeDelay(DELAY_RANGE.min, DELAY_RANGE.max);
            await this.page.waitForSelector('#dtaTableDetalle tbody tr:first-child', { timeout: 1000 });
            await this.page.waitForFunction(
                async (lineaAnterior) => {
                    //Selecciona la primera fila de la tabla
                    const lineaActual = document.querySelector('#dtaTableDetalle tbody tr:first-child'); 
                    if(lineaActual){
                        const cells = lineaActual.querySelectorAll('td');
                        const newContent = Array.from(cells).map(cell => cell.innerText.trim()).join(' ');
                        // Verifica la tabla contiene parte del texto que indica que no se encontró el caso
                        if(newContent.includes('No se han encontrado')){
                            console.log('La tabla presenta que no se encontro el caso.',cells[0].innerText);
                            return false;
                        }
                        return newContent && newContent !== lineaAnterior;
                    }
                    return false;
                },
                {timeout:5000}, // Opciones para waitForFunction
                lineaAnterior // Pasar la línea anterior como argumento
            );
            return true;
        } catch (error) {
            return false; // Salta al siguiente caso
        }
    }

    writeChanges() {
        const wb = XLSX.utils.book_new();
        wb.Props = {
            Title: `Ladrillos`,
            Subject: `Remates`
        };
        const newWs = wb.Sheets[this.wb.SheetNames[0]];

        let lastRow  = 1;
        let newRow = 1;
        console.log('Escribiendo cambios');

        while (this.ws[`${config.CAUSA}${lastRow}`]) {
            let causa = this.ws[`${config.CAUSA}${lastRow}`].v;
            const juzgado = this.ws[`${config.TRIBUNAL}${lastRow}`].v
            causa = causa.replace(/\(s\)/i,'').replace(/S\/I/ig, '').trim();

           for(let caso of this.casos){
            // console.log("DEL CASO: ",caso.causa, caso.juzgado,"DEL EXCEL: ", causa, juzgado);
                if(caso.hasChanged){
                    //TODO: Escribir los casos en un excel nuevo llamado Ladrillero_Fecha.xlsx

                    copyRowBetweenFiles(this.ws, newWs , lastRow -1, newRow -1);
                    newRow++;

                    // if (caso.causa == causa) {
                    //     // console.log("ESCRIBIENDO CAMBIO EN EXCEL: ",caso.causa, caso.juzgado);
                    //     this.ws[`A${lastRow}`]= { v: 'CAMBIO', t: 's' };
                    // }
                }
           } 
            lastRow++;
        }
        const desktopPath = getDesktopPath();
        const fecha = formatDateToDDMMAA(new Date());
        const newFilePath = path.join(desktopPath, 'Ladrillero_'+fecha+'.xlsx');
        console.log("Escribiendo archivo en: ",newFilePath);
        XLSX.writeFile(wb,newFilePath, { cellDates: true });

    }

    writeChanges2() {
        console.log('📝 Escribiendo cambios...');

        // 1. Verificar si hay casos cambiados
        const casosCambiados = this.casos.filter(caso => caso.hasChanged);

        if (casosCambiados.length === 0) {
            console.log('⚠️ No hay casos con cambios para guardar');
            // return;
        }

        console.log(`📊 Total casos cambiados: ${casosCambiados.length}`);

        // 2. Obtener el rango completo del Excel original
        const range = XLSX.utils.decode_range(this.ws['!ref']);
        const totalColumnas = range.e.c + 1;

        // 3. Preparar array para el nuevo Excel
        const nuevosDatos = [];

        // 4. Obtener los HEADERS (primera fila)
        const headers = [];
        for (let col = 0; col < totalColumnas; col++) {
            const celda = XLSX.utils.encode_cell({ r: 0, c: col });
            headers.push(this.ws[celda]?.v || '');
        }
        nuevosDatos.push(headers);

        // 5. Crear un MAP para búsqueda rápida de casos cambiados
        const mapaCambios = new Map();
        casosCambiados.forEach(caso => {
            const clave = `${caso.causa.trim()}_${caso.juzgado.trim()}`;
            mapaCambios.set(clave, caso);
        });

        // 6. Recorrer todas las filas del Excel original (empezando desde fila 2)
        // let filaIndex = 1; // Fila 2 en Excel (índice 1 porque fila 0 es headers)
        let filasCopiadas = 0;
        console.log(mapaCambios)
        let filaIndex = XLSX.utils.decode_range(this.ws['!ref']).e.r + 1;

        let casosEscritos = new Set();
        while (filaIndex > 1) {

            // Obtener datos de la fila actual
            let causa = this.ws[`${config.CAUSA}${filaIndex + 1}`]?.v || '';
            const juzgado = this.ws[`${config.TRIBUNAL}${filaIndex + 1}`]?.v || '';

            // Limpiar la causa para comparación
            causa = causa.toString().replace(/\(s\)/gi, '').replace(/S\/I/gi, '').trim();

            // Crear clave para búsqueda
            const claveBusqueda = `${causa}_${juzgado}`;

            console.log(`🔍 Encontrado cambio para: ${claveBusqueda}`);
            // Verificar si esta fila tiene cambios
            if (mapaCambios.has(claveBusqueda) && !casosEscritos.has(claveBusqueda)) {
                // 7. COPIAR TODA LA FILA
                const filaData = [];


                for (let col = 0; col < totalColumnas; col++) {
                    if(col === 0){
                        filaData.push('CAMBIO');
                        continue;
                    }
                    const celda = XLSX.utils.encode_cell({ r: filaIndex, c: col });
                    const celdaOriginal = this.ws[celda];

                    if (celdaOriginal) {
                        // Copiar el valor exacto
                        filaData.push(celdaOriginal.v);
                    } else {
                        filaData.push('');
                    }
                }

                // Agregar la fila a los nuevos datos
                casosEscritos.add(claveBusqueda);
                nuevosDatos.push(filaData);
                filasCopiadas++;

                console.log(`✅ Copiada fila ${filaIndex + 1}: ${causa} - ${juzgado}`);
            }

            filaIndex--;
        }

        // 8. Crear el nuevo Worksheet solo con filas cambiadas
        const nuevoWs = XLSX.utils.aoa_to_sheet(nuevosDatos);

        // 9. Crear nuevo Workbook
        const nuevoWb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(nuevoWb, nuevoWs, 'Casos Modificados');
        this.cambiarAnchoColumnas(nuevoWs);

        // 10. Guardar en el escritorio
        const desktopPath = getDesktopPath();
        const fecha = formatDateToDDMMAA(new Date());
        const nombreArchivo = `Ladrillero_${fecha}.xlsx`;
        const rutaCompleta = path.join(desktopPath, nombreArchivo);

        XLSX.writeFile(nuevoWb, rutaCompleta);

        console.log('\n========================================');
        console.log(`✅ ARCHIVO CREADO EXITOSAMENTE`);
        console.log(`📁 Ubicación: ${rutaCompleta}`);
        console.log(`📋 Total filas guardadas: ${filasCopiadas}`);
        console.log('========================================\n');
    }

    writeChanges3(){
        let filasCopiadas = 0;
        const casosCambiados = this.casos.filter(caso => caso.hasChanged);

        if (casosCambiados.length === 0) {
            console.log('⚠️ No hay casos con cambios para guardar');
            // return;
        }
        console.log(`📊 Total casos cambiados: ${casosCambiados.length}`);

        // 3. Preparar array para el nuevo Excel
        const nuevosDatos = [];

        nuevosDatos.push(this.data[0]);

        for(let caso of casosCambiados){

            const filaData = [];

            filaData.push('CAMBIO'); // Columna A
            filaData.push(caso.causa); 
            filaData.push(caso.juzgado);

            // Agregar la fila a los nuevos datos
            nuevosDatos.push(filaData);
            filasCopiadas++;

            console.log(`✅ Copiada fila ${filasCopiadas}: ${caso.causa} - ${caso.juzgado}`);
        }

        // 8. Crear el nuevo Worksheet solo con filas cambiadas
        const nuevoWs = XLSX.utils.aoa_to_sheet(nuevosDatos);
        // 9. Crear nuevo Workbook
        const nuevoWb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(nuevoWb, nuevoWs, 'Casos Modificados');
        this.cambiarAnchoColumnas(nuevoWs);

        // 10. Guardar en el escritorio
        const desktopPath = getDesktopPath();
        const fecha = formatDateToDDMMAA(new Date());
        const nombreArchivo = `Ladrillero_${fecha}.xlsx`;
        const rutaCompleta = path.join(desktopPath, nombreArchivo);

        XLSX.writeFile(nuevoWb, rutaCompleta);

        console.log('\n========================================');
        console.log(`✅ ARCHIVO CREADO EXITOSAMENTE`);
        console.log(`📁 Ubicación: ${rutaCompleta}`);
        console.log(`📋 Total filas guardadas: ${filasCopiadas}`);
        console.log('========================================\n');

    }

    cambiarAnchoColumnas(ws) {
        ws[`!cols`] = [
            { wch: 15 },  // A
            { wch: 15 },  // B
            { wch: 20 },  // C
            { wch: 70 },  // D
            { wch: 25 },  // E
            { wch: 15 },  // F
            { wch: 15 },  // G
            { wch: 15 },  // H
            { wch: 30 },  // I
            { wch: 20 },  // J
            { wch: 15 },  // K
            { wch: 30 },  // L
            { wch: 15 },  // M
            { wch: 20 },  // N
            { wch: 15 },  // O
            { wch: 60 },  // P
            { wch: 15 },  // Q
            { wch: 20 },  // R
            { wch: 15 },  // S
            { wch: 30 },  // T
            { wch: 15 },  // U
            { wch: 30 },  // V
            { wch: 10 },  // W
            { wch: 30 },  // X
            { wch: 15 },  // Y
            { wch: 15 },  // Z
            { wch: 15 },  // AA
            { wch: 15 },  // AB
            { wch: 15 },  // AC
            { wch: 15 },  // AD
            { wch: 25 },  // AE
            { wch: 15 },  // AF
            { wch: 15 },  // AG
            { wch: 15 },  // AH
            { wch: 15 },  // AI
            { wch: 15 },  // AJ
            { wch: 15 },  // AK
            { wch: 15 },  // AL
            { wch: 15 },  // AM
            { wch: 15 },  // AN
            { wch: 15 },  // AO
            { wch: 15 },  // AP
            { wch: 15 },  // AQ
            { wch: 25 },  // AR
        ];
    }
}

function copyRowBetweenFiles(sourceSheet, targetSheet, sourceRowIndex, targetRowIndex) {
    
    // 3. Convertir la hoja de origen a JSON para obtener la fila
    const sourceData = XLSX.utils.sheet_to_json(sourceSheet, { header: 1 });
    
    // 4. Obtener la fila específica (index basado en 0)
    const rowToCopy = sourceData[sourceRowIndex];
    
    // 5. Escribir la fila en la posición destino
    for (let col = 0; col < rowToCopy.length; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: targetRowIndex, c: col });
        targetSheet[cellAddress] = { v: rowToCopy[col], t: typeof rowToCopy[col] };
    }
    
    console.log(`✅ Fila ${sourceRowIndex + 1} copiada a fila ${targetRowIndex + 1}`);
}

function getDesktopPath(){
    // Para diferentes sistemas operativos
    const homeDir = os.homedir();
    
    // Windows
    if (process.platform === 'win32') {
        return path.join(homeDir, 'Desktop');
    }
    // macOS
    else if (process.platform === 'darwin') {
        return path.join(homeDir, 'Desktop');
    }
    // Linux/Unix
    else {
        return path.join(homeDir, 'Desktop');
    }
}

module.exports = checkFPMG;