// const puppeteer = require('puppeteer-core');
const { ipcRenderer,BrowserWindow } = require('electron');
const config =  require("../../config.js");
const fs = require('fs');
const path = require('path');
const pie = require('puppeteer-in-electron');
const os = require('os');
const https = require('https');
require('dotenv').config();

const {delay,fakeDelay,fakeDelayms} = require('../../utils/delay.js');
const ProcesarBoletin = require('../liquidaciones/procesarBoletin.js');
const PjudPdfData = require('./PjudPdfData.js');

const ERROR = 0;
const EXITO = 1;
const DELAY_RANGE = {"min": 2, "max" : 5}

class ConsultaCausaPjud{
    constructor(browser,window,caso){
        this.browser = browser;
        this.window = window;
        this.caso = caso;
        this.link = 'https://oficinajudicialvirtual.pjud.cl/includes/sesion-consultaunificada.php';
        this.page = null;
        this.downloadPath = path.join(os.homedir(), "Documents", "infoRemates/pdfDownload");
        this.dirPath = '';
        this.pdfPath = '';
        this.PjudData = new PjudPdfData(this.caso);
    }

    async getConsulta(){
        let lineaAnterior = '';
        let result = false;

        await this.loadConfig()
        await this.loadPageWithRetries();

        try{
            result = await this.procesarCaso(this.caso, 1 , lineaAnterior)
            if(!result){
                console.log('No se pudo procesar el caso');
                return false;
            }
            await this.window.destroy();
            await this.cleanFilesDownloaded();
        }catch(error){
            console.error('Error en la función getEspecificDataFromPjud:', error.message);
            await this.browser.close();
            return false;
        }finally{
            if(!this.window.isDestroyed()){
                this.window.destroy();
            }
        }

        return true;
    }

    async loadConfig(){
        const userAgents = JSON.parse(process.env.USER_AGENTS);
        const randomIndex = Math.floor(Math.random() * userAgents.length);
        await this.window.loadURL(this.link);
        this.page = await pie.getPage(this.browser, this.window);
        await this.page.setUserAgent(userAgents[randomIndex].userAgent);
        await this.page.goto(this.link);

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

        console.log('Test Pjud activado');
        const isValid = await this.buscarGP();
        if(!isValid){
            console.log('Fallo al buscar GP');
            return false;
        }
        

        const lineaActual = this.getPrimeraLinea();
        return lineaActual;
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
            await this.page.waitForSelector('#dtaTableDetalle tbody tr:first-child', { timeout: 1000 });
            // el waitForFunction espera a que la tabla se actualice
            // sus parametros son una función que se ejecuta en el contexto de la página
            // un objeto con las opciones de timeout
            // variables adicionales que se quieran utilizar en la funcion de pagina.
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


    async seleccionarTribunal(nombreTribunal) {
        // Obtenemos el valor del tribunal correspondiente por su nombre
        const value = await this.page.evaluate((nombreTribunal) => {
            // Obtenemos todas las opciones del select
            const options = Array.from(document.querySelectorAll('#conTribunal option'));
            
            // Encontramos la opción que contiene el nombre del tribunal
            const option = options.find(opt =>{
                const texto = opt.textContent.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
                return texto.includes(nombreTribunal.toLowerCase());
            });
                
            
            // Si la opción se encuentra, retornamos su value, si no, retornamos null
            return option ? option.value : null;
        }, nombreTribunal);

        // Si se encuentra un valor, lo retornamos; si no, retornamos null
        return value;
    }

    async buscarGP(){
        const findLink = await this.findAndProcessLinkGP();

        if(!findLink){ return false;}

        const selectedCuaderno = await this.selectCuaderno();

        if(!selectedCuaderno){ 
            console.log("no se encontro el cuaderno");
            return false; }

        // await fakeDelay(4, 10);

        await this.getAvaluoTablaCausa();
        return true;
    }

    async findAndProcessLinkGP(){
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
        // Espera a que se carguen las opciones de Historia Causa Cuaderno
        await this.page.waitForSelector(selectorCuaderno);

        // const options = await this.page

        // Obtener todas las opciones del <select>
        const options = await this.page.$$eval('#selCuaderno option', (opts) => {
            return opts.map(option => ({
                text: option.textContent.trim(),
                value: option.value
            }));
        });

        // Buscar la opción que contiene "2 - Apremio Ejecutivo Obligación de Dar"
        const optionToSelect = options.find(option => option.text.includes(targetOptionText));

        if (optionToSelect) {
            await fakeDelay(DELAY_RANGE.min, DELAY_RANGE.max);
            // Seleccionar la opción encontrada
            await this.page.select('#selCuaderno', optionToSelect.value);
        } else {
            console.log('La opción deseada no se encuentra en el select.');
            return false
            
        }
        const cuadernoValue = await this.page.$eval('#selCuaderno', el => el.value);
        if(cuadernoValue !== optionToSelect.value){
            console.log('No se seleccionó el cuaderno:',optionToSelect.text);
            return false;
        }
        return true;

    }

    async getAvaluoTablaCausa() {
        let isDone = false;
        try {
            await this.page.waitForSelector("#historiaCiv", { timeout: 10000 });
            // Get all rows from the table
            const rows = await this.page.$$('#historiaCiv .table tbody tr');
            for (const row of rows) {
                // Track if the row is processed successfull
                try {
                    if (isDone === true) {
                        break;
                    }
                    isDone = await this.searchForDirectory(row);
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
        const [number,uselessFile,directory,dirHasLink,stage, tramite, descripcion, fecha] = await Promise.all([
            row.$eval('td:nth-child(1)', el => el.textContent.trim()),
            row.$eval('td:nth-child(2)', el => el.textContent.trim()),
            row.$eval('td:nth-child(3)', el => el.textContent.trim()),
            row.$eval('td:nth-child(3)', el => el.querySelector('a') !== null),
            row.$eval('td:nth-child(4)', el => el.textContent.trim()),
            row.$eval('td:nth-child(5)', el => el.textContent.trim()),
            row.$eval('td:nth-child(6)', el => el.textContent.trim()),
            row.$eval('td:nth-child(7)', el => el.textContent.trim()),
        ]);
        try{
            if (dirHasLink) {
                console.log(`El numero ${number} tiene directorio se hace click`);
                await fakeDelay(DELAY_RANGE.min, DELAY_RANGE.max);
                const linkToDir = await row.$('td:nth-child(3) a');
                linkToDir.click();
                await fakeDelay(DELAY_RANGE.min, DELAY_RANGE.max);

                const downloaded = await this.obtainLinkOfPdf();
                if (downloaded) {
                    return true;
                }

                const xSelector = '#modalAnexoSolicitudCivil > div > div > div.modal-header > button';
                await fakeDelay(DELAY_RANGE.min, DELAY_RANGE.max);
                await this.page.waitForSelector(xSelector, { visible: true });
                await this.page.click(xSelector);
                return false;
            }
            console.log('Fila:', number, uselessFile, directory, stage, tramite, descripcion, fecha);
            return ERROR;
        } catch (error) {
            console.error('Error al obtener los datos de la fila:', error.message);
            return ERROR;
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
                const linkToPdf = "https://oficinajudicialvirtual.pjud.cl/ADIR_871/civil/documentos/anexoDocCivil.php?dtaDoc=" + valuePdf
                await fakeDelay(DELAY_RANGE.min, DELAY_RANGE.max);
                isDone = await this.downloadPdfFromUrl(linkToPdf);
                if(isDone){
                    return true;
                }
            }
            return false;
        }catch(error){
            console.error('Error al obtener el link del PDF:', error.message);
            return false;
        }
    }

    async downloadPdfFromUrl(url) {
        let resultado = '';
        let resultOfProcess = false;
        const pdfWindow = new BrowserWindow({ show: true });
        await pdfWindow.loadURL(url);
        const pdfPage = await pie.getPage(this.browser, pdfWindow);
        
        const nameDir = `${this.caso.causa}_${this.caso.juzgado}`;
        const pdfName = `boletin_${Date.now()}.pdf`;
        this.dirPath = path.join(this.downloadPath, nameDir);
        this.pdfPath = path.join(this.dirPath, pdfName);
     
        try{
            if(!fs.existsSync(this.dirPath)){
                fs.mkdirSync(this.dirPath, { recursive: true });
            }

            pdfPage.on('request', req => {
                if (req.url() === url) {
                    const file = fs.createWriteStream(this.pdfPath);
                    https.get(req.url(), response => response.pipe(file));
                }
            });
    
            await pdfPage.goto(url);
            await fakeDelay(DELAY_RANGE.min, DELAY_RANGE.max);
            //Leer el pdf descargado
            resultado = await ProcesarBoletin.convertPdfToText2(this.pdfPath);
            if(resultado){
                resultOfProcess = this.PjudData.processInfo(resultado);
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
            if(!pdfWindow.isDestroyed()){
                pdfWindow.destroy();
            }
        }

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
