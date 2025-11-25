// const puppeteer = require('puppeteer-core');
const { ipcRenderer,BrowserWindow } = require('electron');
const config =  require("../../config.js");
const fs = require('fs');
const path = require('path');
const pie = require('puppeteer-in-electron');
const os = require('os');
const https = require('https');
const axios = require('axios');
require('dotenv').config();

const {delay,fakeDelay,fakeDelayms} = require('../../utils/delay.js');
const ProcesarBoletin = require('../liquidaciones/procesarBoletin.js');
const PjudPdfData = require('./PjudPdfData.js');
const PdfProcess = require('../pdfProcess/PdfProcess.js');
const listUserAgents = require('../../utils/userAgents.json');
const { listenerCount } = require('process');

const ERROR = 0;
const EXITO = 1;
const DELAY_RANGE = {"min": 2, "max" : 5}

class ConsultaCausaPjud{
    constructor(browser,window,caso,mainWindow){
        this.browser = browser;
        this.window = window;
        this.caso = caso;
        this.link = 'https://oficinajudicialvirtual.pjud.cl/includes/sesion-consultaunificada.php';
        this.page = null;
        this.downloadPath = path.join(os.homedir(), "Documents", "infoRemates/pdfDownload");
        this.dirPath = '';
        this.pdfPath = '';
        this.PjudData = new PjudPdfData(this.caso,mainWindow);
        this.PAGADO = {daCuenta: false, pagadoCredito: false}
    }

    async getConsulta(){
        let lineaAnterior = '';
        let result = false;

        try{
            console.log('Iniciando la consulta de causa en Pjud...');
            await this.loadConfig()
            await this.loadPageWithRetries();

            result = await this.procesarCaso(lineaAnterior)
            if(result){
                console.log('Caso procesado correctamente');
            }else{
                console.log('No se pudo procesar el caso');
                return false;
            }
            await this.cleanFilesDownloaded();
        }catch(error){
            console.error('Error en la función getEspecificDataFromPjud:', error.message);
            await this.window.close();
            return false;
        }finally{
            if(this.window && !this.window.isDestroyed()){
                console.log("Cerrando ventana del pjud");
                this.window.close();
            }
        }

        return true;
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
        userAgents = listUserAgents ? listUserAgents : defaultUserAgents;
    } catch (error) {
        console.error('Error parsing USER_AGENTS from .env, using default agents:', error);
        userAgents = defaultUserAgents;
    }

    // Selecciona un User-Agent aleatorio
    const randomIndex = Math.floor(Math.random() * userAgents.length);
    
    try {
        // await this.window.loadURL(this.link);
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

    async procesarCaso(lineaAnterior) {
        let cambioPagina = false;
        try {
            const valorInicial = await this.setValoresIncialesBusquedaCausa();
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
            await this.getPartesCaso();
        } catch (error) {
            console.error('Error al obtener la primera línea del caso:', error.message);
            return lineaAnterior; // Salta al siguiente caso
        }

        const isValid = await this.searchAuctionInfo();
        if(isValid){
            console.log("Datos posibles del caso obtenidos correctamente");
            return true;
        }else{
            console.log('Fallo al buscar la informacion');
            return false;
        }
    }

    // Obtiene las partes del remate.
    async getPartesCaso(){
        let partes = null;
        try{
            partes = await this.page.$eval('#dtaTableDetalle tbody tr:first-child', (row) => {
                const cells = row.querySelectorAll('td');
                const caratulado= cells[3] ? cells[3].innerText.trim() : '';
                return caratulado; 
            });
        }catch(error){
            console.error('Error al obtener las partes :', error.message);
            return false;
        }
        console.log('Partes del caso:', partes);
        this.caso.partes = partes;
        return true;
    }

    async revisarPrimeraLinea(lineaAnterior){
        try {
            await this.page.waitForSelector('#btnConConsulta');
            await this.page.click('#btnConConsulta');
            await fakeDelay(DELAY_RANGE.min, DELAY_RANGE.max);
            await this.page.waitForSelector('#dtaTableDetalle tbody tr:first-child', { timeout: 30000 });
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

    async getPrimeraLinea(){
        const primeraLinea = await this.page.$eval('#dtaTableDetalle tbody tr:first-child', (row) => {
            const cells = row.querySelectorAll('td');
            return Array.from(cells).map(cell => cell.innerText.trim()).join(' ');
        });

        return primeraLinea;
    }

    // Función para decretar los valores iniciales de la búsqueda de la causa.
    async setValoresIncialesBusquedaCausa() {
        // Primero se revisa que el caso tenga los valores necesarios para la búsqueda
        const valores = this.validateInitialValues();
        if(!valores){ return false;}
        console.log('Valores precargados : Listo');

        if(!await this.configurateCompetencia()){ return false; }

        if(!await this.configurateCorte(valores.corte)){ return false; }

        if(!await this.configurateTribunal2(valores.juzgado)){ return false; }

        if(!await this.configurateCausa(valores.causa)){ return false; }

        if(!await this.configurateAnno(valores.anno)){ return false; }

        return true;
    }

    async seleccionarTribunal(nombreTribunal) {
        try{
            // Obtenemos el valor del tribunal correspondiente por su nombre
            const value = await this.page.evaluate((nombreTribunal) => {
                // Obtenemos todas las opciones del select
                const options = Array.from(document.querySelectorAll('#conTribunal option'));

                // Encontramos la opción que contiene el nombre del tribunal
                const option = options.find(opt => {
                    const texto = opt.textContent.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
                    return texto.includes(nombreTribunal.toLowerCase());
                });

                // Si la opción se encuentra, retornamos su value, si no, retornamos null
                return option ? option.value : null;
            }, nombreTribunal);

            // Si se encuentra un valor, lo retornamos; si no, retornamos null
            return value;
        }catch(error){
            console.error("Error al seleccionar el tribunal")
            return null;
        }
    }

    async searchAuctionInfo(){
        console.log('Se esta buscando los datos del cuaderno');
        let caseIsFinished = false;
        // Busca y presiona el boton que muestra la tabla principal del caso.
        const findLink = await this.searchButtonAuction();

        if(!findLink){
            console.error("No se pudo encontrar el enlace del caso"); 
            return false;
        }

        const estadoCaso = await this.checkIfCaseIsConcluded();
        console.log("Estado actual del caso: ", estadoCaso)

        //Se selecciona el cuaderno de apremio o en caso de que no este el principal.
        const selectedCuaderno = await this.selectCuaderno();

        if(!selectedCuaderno){ 
            console.log("no se encontro el cuaderno");
            return false; 
        }

        caseIsFinished = await this.searchInMainTable();
        // Descargar el texto de la demanda.
        console.log('Descargando demanda');
        await this.downloadDemanda();
        return true;
    }

    async downloadDemanda() {
        const linkBaseDemanda = 'https://oficinajudicialvirtual.pjud.cl/ADIR_871/civil/documentos/docu.php?valorEncTxtDmda=';
        try {
            // Espera a que el modal y el input estén presentes
            await this.page.waitForSelector('#modalDetalleCivil > div > div > div.modal-body > div > div:nth-child(1) > table:nth-child(2) > tbody > tr > td:nth-child(1) > form > input[type="hidden"]');

            // Obtén el valor del input
            const value = await this.page.$eval(
                '#modalDetalleCivil > div > div > div.modal-body > div > div:nth-child(1) > table:nth-child(2) > tbody > tr > td:nth-child(1) > form > input[type="hidden"]',
                (input) => input.value
            );

            const linkToDownload = linkBaseDemanda + value;
            const isDone = await this.downloadPdfFromUrl(linkToDownload);
            console.log('Valor obtenido:', value);
        }catch (error) {
            console.error('Error al descargar la demanda:', error.message);
            return false;
        }
    }

    async checkIfCaseIsConcluded() {
        try {
            await this.page.waitForSelector('.table-titulos', { timeout: 5000 });
            const estado = await this.extractCaseStatus();
            return estado;
        } catch (error) {
            console.error('Error al verificar si el caso está concluido:', error.message);
            return false; // Si ocurre un error, asumimos que el caso no está concluido
        }

    }

    async extractCaseStatus() {
        return await this.page.evaluate(() => {
            const statusRow = Array.from(document.querySelectorAll('.table-titulos tr'))
                .find(row => row.textContent.includes('Estado Proc.:'));

            if (!statusRow) return null;

            const statusCell = Array.from(statusRow.querySelectorAll('td'))
                .find(cell => cell.textContent.includes('Estado Proc.:'));

            return statusCell ? statusCell.textContent.split('Estado Proc.:')[1].trim() : null;
        });
    }

    async searchButtonAuction(){
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

    async selectCuaderno() {
        const selectorCuaderno = '#selCuaderno';
        const targetOptionText = 'Apremio';
        const targetOptionConcursal = 'Concursal'
        let secondOption = null;
        // Espera a que se carguen las opciones de Historia Causa Cuaderno
        try{
            await this.page.waitForSelector(selectorCuaderno);

            // Obtener todas las opciones del <select>
            const options = await this.page.$$eval('#selCuaderno option', (opts) => {
                return opts.map(option => ({
                    text: option.textContent.trim(),
                    value: option.value
                }));
            });

            // Buscar la opción que contiene "Apremio"
            const optionToSelect = options.find(option => option.text.includes(targetOptionText));

            if (optionToSelect) {
                await fakeDelay(DELAY_RANGE.min, DELAY_RANGE.max);
                // Seleccionar la opción encontrada
                await this.page.select('#selCuaderno', optionToSelect.value);
            } else {
                console.log('La opción deseada no se encuentra en el select.');
                secondOption = options.find(option => option.text.includes(targetOptionConcursal));
                if (secondOption) {
                    console.log('La opción "Administracion concursal" se seleccionará en su lugar.', secondOption);
                    console.log(secondOption.text, secondOption.value);
                    await fakeDelay(DELAY_RANGE.min, DELAY_RANGE.max);
                    // Seleccionar la segunda opción si "Apremio" no está disponible
                    await this.page.select('#selCuaderno', secondOption.value);
                }else{
                    console.log('La opción deseada no se encuentra en el select.');
                    secondOption = options.find(option => option.text.includes('Principal'));
                    if (secondOption) {
                        console.log('La opción "Principal" se seleccionará en su lugar.', secondOption);
                        console.log(secondOption.text, secondOption.value);
                        await fakeDelay(DELAY_RANGE.min, DELAY_RANGE.max);
                        // Seleccionar la segunda opción si "Apremio" no está disponible
                        await this.page.select('#selCuaderno', secondOption.value);
                    } else {
                        return false
                    }
                }
            }

            //Revisar que se haya seleccionado correctamente el cuaderno
            const cuadernoValue = await this.page.$eval('#selCuaderno', el => el.value);
            if(optionToSelect){
                if (cuadernoValue !== optionToSelect.value) {
                    console.log('No se seleccionó el cuaderno:', optionToSelect.text);
                }
            }else if(secondOption){
                if (cuadernoValue !== secondOption.value) {
                    console.log('Tampoco se selecciono la opcion de Principal', secondOption.text);
                    return false;
                }
            }
            return true;
        } catch (error) {
            console.error('Error al esperar el selector de cuaderno:', error.message);
            return false;
        }

    }

    async searchInMainTable() {
        let caseIsFinished = false;
        let isDone;
        try {
            await this.page.waitForSelector("#historiaCiv", { timeout: 10000 });
            // Get all rows from the table
            const rows = await this.page.$$('#historiaCiv .table tbody tr');
            for (const row of rows) {
                // Track if the row is processed successfull
                try {
                    if (caseIsFinished) {
                        return true; // Si ya se obtuvo todo lo necesario del caso, salimos del bucle
                    }
                    caseIsFinished = await this.searchForDirectory(row);
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

    async searchForDirectory(row){
        try{
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
            if (dirHasLink) {
                console.log(`El numero ${number} tiene directorio se hace click`);
                await fakeDelay(DELAY_RANGE.min, DELAY_RANGE.max);
                const linkToDir = await row.$('td:nth-child(3) a');
                linkToDir.click();
                await fakeDelay(DELAY_RANGE.min, DELAY_RANGE.max);

                const caseIsFinished = await this.obtainLinkOfPdf();
                if (caseIsFinished) {
                    return true;
                }
                const xSelector = '#modalAnexoSolicitudCivil > div > div > div.modal-header > button';
                const xButton = await this.page.$(xSelector);
                if (xButton) {
                    await fakeDelay(DELAY_RANGE.min, DELAY_RANGE.max);
                    await this.page.waitForSelector(xSelector, { visible: true });
                    await this.page.click(xSelector);
                    return false;
                }
            }
            console.log('Fila:', number, uselessFile, directory, stage, tramite, descripcion, fecha);
            this.checkDescription(descripcion);

            return false;
        } catch (error) {
            console.error('Error al obtener los datos de la fila:', error.message);
            return false;
        }
    }

    checkDescription(descripcion){
        const lowerCaseDesc = descripcion.toLowerCase();
        if (lowerCaseDesc.includes("da cuenta de pago")) {
            console.log("******************\nel caso tiene pago, se procede a marcarlo como pagado con: ", descripcion, "\n******************");
            this.PAGADO.daCuenta = true;
        }
        if (lowerCaseDesc.includes("tiene por pagado el crédito") || lowerCaseDesc.includes("término por avenimiento")) {
            console.log("******************\nel caso tiene por pagado el credito con: ", descripcion, "\n******************");
            this.PAGADO.pagadoCredito = true;
        }
        if (this.PAGADO.daCuenta && this.PAGADO.pagadoCredito) {
            this.caso.isPaid = true;
        }
        if (lowerCaseDesc.includes("avenimiento")) {
            console.log("******************\nel caso tiene avenimiento, se procede a marcarlo como avenimiento con: ", descripcion, "\n******************");
            this.caso.isAvenimiento = true;
        }

    }

    async obtainLinkOfPdf(){
        let isDone = false
        try{
            const tableOfPdf = '#modalAnexoSolicitudCivil > div > div > div.modal-body > div > div > div > table > tbody tr';
            const rows = await this.page.$$(tableOfPdf);
            for (let row of rows) {
                const [doc, fecha, reference, valuePdf] = await Promise.all([
                    row.$eval('td:nth-child(1)', el => el.textContent.trim()),
                    row.$eval('td:nth-child(2)', el => el.textContent.trim()),
                    row.$eval('td:nth-child(3)', el => el.textContent.trim()),
                    row.$eval('td:nth-child(1) form input[name="dtaDoc"', input => input.value),
                ]);
                //Donwload pdf and save it in a specific folder
                console.log("**********************************************************");
                // console.log("Trabajando en el documento: ",doc," referencia :", reference);
                if(this.isTPDocument(reference)){
                    this.caso.tp = true;
                }
                if(this.shouldSkipDoc(reference)){
                    console.log("Saltando el documento: ", reference);
                    continue; // Salta la revision de documento si es un documento que no intersa por ahora.
                }
                // console.log("revisando si crashea aca con el valuePdf: ", valuePdf);
                await fakeDelay(DELAY_RANGE.min, DELAY_RANGE.max);
                console.log("Procesando el documento: ", reference);
                if(valuePdf && valuePdf !== ''){
                    const linkToPdf = "https://oficinajudicialvirtual.pjud.cl/ADIR_871/civil/documentos/anexoDocCivil.php?dtaDoc=" + valuePdf
                    isDone = await this.downloadPdfFromUrl(linkToPdf);
                    if (isDone) {
                        return true;
                    }
                    // // Ahora se enviara true solo para probar con un puro pdf, elimianr esta linea para produccion
                    // return true;
                }
            }
            return false;
        }catch(error){
            console.error('Error al obtener el link del PDF:', error.message);
            return false;
        }
    }

    shouldSkipDoc(reference) {
        const normalizedReference = reference.toLowerCase().trim();
        // Lista de referencias que se deben omitir
        const skipReferences = [
            'factura',
            'consignac',
            'vv',
            'ci',
            'mercurio',
            'hipotecario',
            'liquidac',
            'desarrollo',
            'identidad',
            'vale',
            'gastos',
            'correo',
            'publicac',
            'diario',
            'tasaci',
            'comprobante',
            'timbrado',
            'pagar',
            'ebook',
            'arancel',
            'garantia',
            'rut',
            'v.v.',
            'cedula',
            'mostrador',
            'declaraci',
            'boleta',
            'deposito',
            'cupon',
            'imagen',
            'c.i',
            'tgr',
            'personer',
            'pg',
            'sentencia',
            'mandato',
            'cartola',
            'cronograma',
            'contribuciones',
            'contrato',
            'medica',
            'policia',
            'transferencia',
            'acta',
            'pericial',
            'minuta',
            'cheque',
            'd.g.a',
            'dga',
            'dga.',
            'lq',
            'portada',
            'estatuto'
        ];

        // Dividir el texto en palabras individuales
        const words = normalizedReference.split(/\s+/);

        // Verificar si alguna palabra comienza con alguno de los términos
        return skipReferences.some(ref =>
            words.some(word => word.startsWith(ref))
        );
    }

    isTPDocument(reference) {
        const normalizedReference = reference.toLowerCase().trim();
        // Lista de referencias que indican que es un documento TP
        const tpReferences = [
            new RegExp('informe\\s*de\\s*tasacion', 'i'),
            new RegExp('informe\\s*tasacion', 'i'),
            new RegExp('informe\\s*pericial', 'i'),
            new RegExp('Evacúa\\s*informe', 'i'),
            new RegExp('Acompaña\\s*informe', 'i'),
            new RegExp('informe\\s*peritaje', 'i'),
            new RegExp('Tiene\\s*por\\s*evacuado\\s*el\\s*peritaje', 'i'),
        ];
        for(let tp of tpReferences){
            if (tp.test(normalizedReference)) {
                return true;
            }
        }
        return false;
    }

    async downloadPdfFromUrl(url) {
        let resultado = '';
        let resultOfProcess = false;
        let pdfWindow = null;
        try{
            console.log("O si crashea por aca");
            pdfWindow = new BrowserWindow({ show: true });
            await pdfWindow.loadURL(url, {timeout: 120000}); // Aumentar el tiempo de espera a 120 segundos
            const pdfPage = await pie.getPage(this.browser, pdfWindow);

            const nameDir = `${this.caso.causa}_${this.caso.juzgado}`;
            const pdfName = `boletin_${Date.now()}.pdf`;
            this.dirPath = path.join(this.downloadPath, nameDir);
            this.pdfPath = path.join(this.dirPath, pdfName);
     
            if(!fs.existsSync(this.dirPath)){
                fs.mkdirSync(this.dirPath, { recursive: true });
            }

            
            pdfPage.on('request', req => {
                if (req.url() === url) {
                    const file = fs.createWriteStream(this.pdfPath);
                    https.get(req.url(), response => {
                        response.pipe(file)
                            //Manejo de error en la descarga del PDF
                            .on('error', (err) => {
                                console.error('Error al descargar el PDF:', err);
                                file.destroy(); // Cierra el stream si hay error
                            });
                    //Manejo de error en la peticion HTTPS
                    }).on('error', (err) => {
                        console.error('Error en la petición HTTPS:', err);
                    });
                }
            });
    
            await pdfPage.goto(url,{
                timeout: 120000, // Aumentar el tiempo de espera a 120 segundos
                waitUntil: 'domcontentloaded' // Espera a que la red esté inactiva
                // waitUntil: 'networkidle'
            });


            await fakeDelay(DELAY_RANGE.min, DELAY_RANGE.max);
            //Leer el pdf descargado
            // Aca es donde se deberia realizar el cambio para leer con tesseract
            resultado = await ProcesarBoletin.convertPdfToText(this.pdfPath);
            await delay(1000);
            if(resultado){
                resultOfProcess = this.PjudData.processInfo(resultado);
                // resultOfProcess = PdfProccess.process(this.caso, resultado)
            }else{
                return false;
            }
            pdfWindow.destroy();
            if(resultOfProcess){
                console.log('Caso completo');
                return true;
            }
            return false
        }catch(error){
            console.error('Error al hacer la petición:', error.message);
            return false;
        }finally{
            if(pdfWindow && !pdfWindow.isDestroyed()){
                console.log("Cerrando ventana del pdf");
                pdfWindow.destroy();
            }
        }
    }

    async downloadPdfFromUrl2(url) {
        let resultado = '';
        let resultOfProcess = false;
        let pdfWindow = null;
        try{
            console.log("O si crashea por aca");
            pdfWindow = new BrowserWindow({ show: true });
            

            const nameDir = `${this.caso.causa}_${this.caso.juzgado}`;
            const pdfName = `boletin_${Date.now()}.pdf`;
            this.dirPath = path.join(this.downloadPath, nameDir);
            this.pdfPath = path.join(this.dirPath, pdfName);
     
            if(!fs.existsSync(this.dirPath)){
                fs.mkdirSync(this.dirPath, { recursive: true });
            }

            await pdfWindow.loadURL(url);
            const pdfPage = await pie.getPage(this.browser, pdfWindow);;

            pdfPage.on('request', req => {
                if (req.url() === url) {
                    const file = fs.createWriteStream(this.pdfPath);
                    https.get(req.url(), response => response.pipe(file));
                }
            })

    
            await pdfPage.goto(url,{
                timeout: 120000, // Aumentar el tiempo de espera a 120 segundos
                // waitUntil: 'domcontentloaded'
            });


            await fakeDelay(DELAY_RANGE.min, DELAY_RANGE.max);
            //Leer el pdf descargado
            // Aca es donde se deberia realizar el cambio para leer con tesseract
            resultado = await ProcesarBoletin.convertPdfToText2(this.pdfPath);
            await delay(2000);
            if(resultado){
                resultOfProcess = this.PjudData.processInfo(resultado);
                return resultOfProcess;
            }else{
                return false;
            }
            pdfWindow.destroy();
            if(resultOfProcess){
                console.log('Caso completo');
                return true;
            }
            return false
        }catch(error){
            console.error('Error al hacer la petición:', error.message);
            return false;
        }finally{
            if(pdfWindow && !pdfWindow.isDestroyed()){
                pdfWindow.destroy();
            }
        }
    }

    async downloadPdfFromUrl3(url) {
        let resultado = '';
        let resultOfProcess = false;
        let pdfWindow = null;
        let pdfPage = null;

        try {
            console.log("Iniciando descarga de PDF desde URL");
            pdfWindow = new BrowserWindow({
                show: true,
                webPreferences: {
                    plugins: true // Habilitar plugins para PDF
                }
            });

            // Configurar tiempo de espera más largo
            await pdfWindow.loadURL(url, {
                timeout: 120000, // 3 minutos
                waitUntil: 'networkidle2' // Esperar a que la red esté inactiva
            });

            pdfPage = await pie.getPage(this.browser, pdfWindow);

            // Configurar directorio y nombre del archivo
            const nameDir = `${this.caso.causa}_${this.caso.juzgado}`;
            const pdfName = `boletin_${Date.now()}.pdf`;
            this.dirPath = path.join(this.downloadPath, nameDir);
            this.pdfPath = path.join(this.dirPath, pdfName);

            if (!fs.existsSync(this.dirPath)) {
                fs.mkdirSync(this.dirPath, { recursive: true });
            }

            // Esperar a que el contenido del PDF esté completamente cargado
            await pdfPage.waitForFunction(() => {
                // Verificar si hay algún elemento que indique que el PDF está cargando
                const loadingElements = document.querySelectorAll('.loading, .progress, [aria-busy="true"]');
                return loadingElements.length === 0;
            }, {
                timeout: 180000, // 3 minutos
                polling: 1000 // Verificar cada segundo
            });

            // Esperar adicionalmente para contenido complejo
            await delay(1000);

            // // Descargar el PDF
            // const file = fs.createWriteStream(this.pdfPath);
            // const response = await new Promise((resolve, reject) => {
            //     https.get(url, res => {
            //         let data = [];
            //         res.on('data', chunk => data.push(chunk));
            //         res.on('end', () => resolve(Buffer.concat(data)));
            //         res.on('error', reject);
            //     }).on('error', reject);
            // });

            //Descargar el Pdf con sistema de fallo
            const pdfBuffer = await this.downloadWithFallback(url, pdfPage);
            fs.writeFileSync(this.pdfPath, pdfBuffer);

            // Verificar que el PDF se descargó correctamente
            await this.verifyPdfIntegrity(this.pdfPath);

            // Procesar el PDF
            resultado = await ProcesarBoletin.convertPdfToText2(this.pdfPath);

            if (resultado) {
                resultOfProcess = this.PjudData.processInfo(resultado);
                return resultOfProcess;
            } else {
                return false;
            }
        } catch (error) {
            console.error('Error al descargar el PDF:', error.message);
            return false;
        } finally {
            if (pdfPage) {
                pdfPage.close();
            }
            if (pdfWindow && !pdfWindow.isDestroyed()) {
                console.log("Cerrando ventana del PDF");
                pdfWindow.destroy();
            }
        }
    }
    async downloadWithFallback(url, page) {
        try {
            // Intento 1: Descarga directa
            const directDownload = await new Promise((resolve, reject) => {
                https.get(url, res => {
                    let data = [];
                    res.on('data', chunk => data.push(chunk));
                    res.on('end', () => resolve(Buffer.concat(data)));
                    res.on('error', reject);
                }).on('error', reject);
            });
            return directDownload;
        } catch (error) {
            console.log('Fallando a estrategia de captura de página...');

            // Intento 2: Capturar como PDF desde la página renderizada
            const pdf = await page.pdf({
                format: 'A4',
                printBackground: true,
                margin: { top: '1cm', right: '1cm', bottom: '1cm', left: '1cm' }
            });
            return pdf;
        }
    }
    // Función auxiliar para verificar la integridad del PDF
    async verifyPdfIntegrity(filePath) {
        return new Promise((resolve, reject) => {
            try {
                const stats = fs.statSync(filePath);
                if (stats.size < 1024) { // PDF muy pequeño probablemente está corrupto
                    throw new Error('El archivo PDF es demasiado pequeño y probablemente está incompleto');
                }

                // Verificar que el PDF termine con el footer %%EOF
                const fileContent = fs.readFileSync(filePath, 'utf8');
                if (!fileContent.includes('%%EOF')) {
                    throw new Error('El archivo PDF no termina correctamente (falta %%EOF)');
                }

                resolve(true);
            } catch (error) {
                reject(error);
            }
        });
    }

    // Función para verificar que el PDF sea válido
    isValidPdf(buffer) {
        // Los PDFs válidos comienzan con "%PDF" y terminan con "%%EOF"
        const start = buffer.slice(0, 4).toString();
        const end = buffer.slice(-5).toString();

        return start === '%PDF' && end.includes('%%EOF');
    }

    validateInitialValues(){
        const caso = this.caso;
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

    async cleanFilesDownloaded(){
        console.log("Iniciando eliminacion de archivos.");
        try {
            await this.deleteFilesDownloaded();
            await this.deleteDirectory();
        } catch (error) {
            console.error('Error al eliminar archivos:', error.message);
        }
    }

    async deleteFilesDownloaded() {
        try {
            if (fs.existsSync(this.dirPath)) {
                const files = await fs.promises.readdir(this.dirPath);
                const unlinkPromises = files.map(async file => {
                    const filePath = path.join(this.dirPath, file);
                    await fs.promises.unlink(filePath);
                    console.log(`Archivo ${file} eliminado`);
                });
                await Promise.all(unlinkPromises); // Espera a que todas las promesas de eliminación se completen
            }
        } catch (error) {
            console.error('Error al eliminar archivos:', error.message);
            throw error; // Re-lanza el error para que la función que llama sepa que algo falló
        }
    }
    
    async deleteDirectory() {
        try {
            if (fs.existsSync(this.dirPath)) {
                const files = await fs.promises.readdir(this.dirPath);
                if (files.length > 0) {
                    throw new Error('El directorio no está vacío');
                }
                await fs.promises.rmdir(this.dirPath);
                console.log(`Directorio eliminado: ${this.dirPath}`);
            }
        } catch (error) {
            console.error(`No se pudo eliminar el directorio ${this.dirPath}:`, error.message);
            throw error;
        }
    }
}

module.exports = ConsultaCausaPjud;
 