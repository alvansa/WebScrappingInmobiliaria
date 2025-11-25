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
const {stringToDate} = require('../../utils/cleanStrings')
const {matchJuzgado} = require('../../utils/compareText')

const DELAY_RANGE = {"min": 2, "max" : 5}

class checkFPMG {
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
        //Obtain cause and judge
        this.obtainListOfCauses();
        console.log("casos revisados : ",this.casos.length);

        //Search and process each cause
        await this.processList();

        //Write each cause that had changes in the last week
        this.writeChanges();

        console.log("Proceso Finalizado")
        return true;
    }

    obtainListOfCauses() {
        this.wb = XLSX.readFile(this.filePath, { cellDates: true });
        this.ws = this.wb.Sheets[this.wb.SheetNames[0]];
        const lastWrittenRow = XLSX.utils.decode_range(this.ws['!ref']).e.r + 1;
        let lastRow = 1;
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

            console.log(casoExcel.causa, casoExcel.juzgado);
            this.casos.push(casoExcel)
            lastRow++;
        }
        obtainCorteJuzgadoNumbers(this.casos);
    }

    obtainDataFromRow(lastRow) {
        let skipRow = false;
        // const [estadoBusqueda, skip0] = this.obtainCellAndState(config.NOTAS, lastRow, skipRow);
        
        // if (estadoBusqueda) {
        //     if (!estadoBusqueda.toLowerCase().includes('fp')) {
        //         skipRow = true;
        //     }
        // } else {
        //     skipRow = true;
        // }

        // const estadoRemate = this.ws[`${config.ESTADO}${lastRow}`] ? true : false;
        // if (estadoRemate) {
        //     skipRow = true;
        // }

        const [causa, skip1] = this.obtainCellAndState(config.CAUSA, lastRow, skipRow);
        const [juzgado, skip2] = this.obtainCellAndState(config.TRIBUNAL, lastRow, skipRow)
        const [fechaDesc, skip3] = this.obtainCellAndState(config.FECHA_DESC, lastRow, skipRow);
        skipRow = skipRow || skip1 || skip2 || skip3;

        //Normalizar el texto de la causa que puede venir modificado por alguien del excel.
        if(causa){
            const causaNormalizada = causa.replace(/\(s\)/i, '').replace(/S\/I/ig, '').trim();
            return [causaNormalizada, juzgado, fechaDesc, skipRow];
        }else{
            return [causa, juzgado, fechaDesc, skipRow];
        }


    }

    obtainCellAndState(cell,lastRow,skipRow){
        let skip = false;
        let cellValue = this.ws[`${cell}${lastRow}`];
        if(cellValue) {
            cellValue = cellValue.v.toString();
        }else{
            skip = true;
            cellValue = "";
        }
        skip = skip || skipRow;
        const result = [cellValue, skip];

        return [cellValue, skip];
    }


    async processList() {
        const mainWindow = BrowserWindow.fromWebContents(this.event.sender);
        let counter = 0;
        try {
            for (let caso of this.casos) {
                counter++;
                console.log(`Caso a investigar ${caso.causa} ${caso.juzgado} caso numero ${counter} de ${this.casos.length}`);
                if (!caso.numeroJuzgado || !caso.corte) {
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
                    console.log(`Esperando ${awaitTime} segundos para consulta numero ${counter + 1} de ${this.casos.length}`);
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
        let lastRow  = 1;
        console.log('Escribiendo cambios');

        while (this.ws[`${config.CAUSA}${lastRow}`]) {
            let causa = this.ws[`${config.CAUSA}${lastRow}`].v;
            const juzgado = this.ws[`${config.TRIBUNAL}${lastRow}`].v
            // const fechaDesc = this.ws[`${config.FECHA_DESC}${lastRow}`].v;
            // console.log(`fechaRem type: ${JSON.stringify(fechaRem,null,4)}`);
            // console.log(`cont = ${lastRow} Causa: ${causa} y juzgado: ${juzgado} `);
            causa = causa.replace(/\(s\)/i,'').replace(/S\/I/ig, '').trim();

           for(let caso of this.casos){
            // console.log("DEL CASO: ",caso.causa, caso.juzgado,"DEL EXCEL: ", causa, juzgado);
                if(caso.hasChanged){
                    if (caso.causa == causa) {
                        // console.log("ESCRIBIENDO CAMBIO EN EXCEL: ",caso.causa, caso.juzgado);
                        this.ws[`A${lastRow}`]= { v: 'CAMBIO', t: 's' };
                    }
                }
           } 
            lastRow++;
        }
        for(let caso of this.casos){
            console.log("Revision de casos: ",caso.causa, caso.juzgado, caso.hasChanged);
        }
        const fileName = this.filePath.split('.')[0];
        const newFilePath = fileName+'Completo'+'.xlsx';
        XLSX.writeFile(this.wb,newFilePath, { cellDates: true });

    }
}

module.exports = checkFPMG;