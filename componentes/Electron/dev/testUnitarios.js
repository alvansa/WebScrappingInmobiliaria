const pie = require('puppeteer-in-electron');
const puppeteer = require('puppeteer-core');
const {app, BrowserWindow, ipcMain, dialog,electron} = require('electron');
const path = require('path');
const os = require('os');

const Caso = require('../../caso/caso.js')
const {downloadPdfFromUrl,checkUserAgent} = require('../../pjud/downloadPDF.js');
const {testTexto,testTextoArgs} = require('../../economico/testEconomico.js');
const PjudPdfData = require('../../pjud/PjudPdfData.js');
const PdfProcess = require('../../pdfProcess/PdfProcess.js');
const ProcesarBoletin = require('../../liquidaciones/procesarBoletin.js');
// const ConsultaCausaPjud = require('../../pjud/ConsultaCausaPjud.js');
const MapasSII = require('../../mapasSII/MapasSII.js');
const MacalService = require('../../macal/macalService.js');
const logger = require('../../../utils/logger.js');
const { fakeDelay } = require('../../../utils/delay.js');
const { createExcel } = require('../../excel/createExcel.js');
const { LIQUIDACIONES } = require('../../../config.js');


class testUnitarios{
    constructor(mainWindow, app,events,args,devMode=false){
        this.mainWindow = mainWindow;
        this.app = app;
        this.events = events;
        this.args = args;
        this.browser = null;
        this.devMode = true; // Cambiar a false para producción
    }

    async mainFunction(){
        await this.launchPuppeteer_inElectron();
        const arg = this.args[0];
        logger.debug("Argumentos recibidos: ", this.args, arg);
        let result;
        if (arg === 'imbeddedText') {
            result = testTexto();
            logger.info("Resultados del texto hardCodded: ",result);

        }else if(arg === 'uploadedText'){
            result = testTextoArgs(this.args[1]);

        }else if(arg === 'downloadPDF'){
            logger.info("Descargando PDF ubicado en: ",this.args[1]);
            result = await downloadPdfFromUrl(this.browser,this.args[1]);

        }else if(arg === 'readPdf'){
            const newExcel = this.args[2];
            const caso = this.crearCasoPrueba();
            const processPDF = new PjudPdfData(caso,this.mainWindow,this.devMode);
            for(let pdf of this.args[1]){
                logger.info("Leyendo PDF ubicado en: ",pdf);
                result = await ProcesarBoletin.convertPdfToText(pdf,1);
                if(this.devMode){
                    console.log(`---------\n${result}\n----------------`);
                }
                processPDF.processInfo(result);
            }
            if(newExcel){
                console.log("Creando excel con los datos del caso de prueba\n------------------------");
                const downloadPath = path.join(os.homedir(), "Documents", "infoRemates");
                const excel = new createExcel(downloadPath,null,null,false,"one");
                await excel.writeData(caso,`PDF-${caso.causa}`);
            }

            console.debug("Resultados del texto introducido: ", caso.toObject());

            // const testCase = this.crearCasoPrueba();
            // for(let pdf of this.args[1]){
            //     const text = await ProcesarBoletin.convertPdfToText(pdf, 1);
            //     PdfProccess.process(testCase, text, pdf);
            // }

            // console.log("Resultados del caso procesado por PdfProccess: ", testCase.toObject());


        }else if(arg === 'testEconomicoPuppeteer'){
            const fechaInicio = new Date("2025/08/09");
            const fechaFin = new Date("2025/08/10");
            // Configuración
        }else if(arg === 'testMapas'){
            const caso1 = this.crearCasoPrueba();
            caso1.comuna = "Renca";
            caso1.rolPropiedad = "1715-20";
            const caso2 = this.crearCasoPrueba();
            caso2.comuna = "Peñaflor";
            caso2.rolPropiedad = null;
            const caso3 = this.crearCasoPrueba();
            caso3.comuna = "Providencia";
            caso3.rolPropiedad = "1342-209";
            const caso4 = this.crearCasoPrueba();
            caso4.comuna = "Curacaví";
            caso4.rolPropiedad = "63-12";
            const caso5 = this.crearCasoPrueba();
            caso5.comuna = 'Talca';
            caso5.rolPropiedad = '757-31'
            const casos = [caso1,caso2,caso3,caso4,caso5];
            // const casos = [caso1]
            let page;
            let mapasSII;
            try{
                
                mapasSII = new MapasSII(page, this.browser);
                await mapasSII.Secondinit();
                for(let caso of casos){
                    await mapasSII.obtainDataOfCause(caso);
                    logger.info(`Caso de comuna ${caso.comuna} y link de mapa ${caso.linkMap}`);
                    await fakeDelay(2,5);
                }
            }catch(error){
                console.error("Error en testMapas: ", error);
            }finally{
                if(mapasSII){
                    await mapasSII.finishPage();
                }
            }
            // for (let caso of casos) {
            //     logger.info("Resultados del caso: ", caso.toObject());
            // }
        }else if(arg === "testMacal"){
            logger.info("Iniciando test de MacalService");
            const result2 = await MacalService.getPropertiesUntilDate("2025/10/29",{});
            logger.info("Resultado de MacalService: ", result2.totalPages);
            //Write to Excel
            const Excel = new createExcel(path.join(os.homedir(), "Documents", "infoRemates"),null,null,false,"macal");
            await Excel.writeData(result2.properties,"Remates_macal");
            console.log("Excel de Macal creado");
        } else { 
            logger.warn("No se ha especificado un test valido");
        }


    }

    crearCasoPrueba() {
        const caso = new Caso("2025/11/30");
        caso.juzgado = "8º JUZGADO CIVIL DE SANTIAGO";
        caso.causa = "C-2484-2023";
        caso.fechaRemate = "02/12/2024 15:30";
        caso.corte = '90';
        caso.numeroJuzgado = '266';


        caso.origen = LIQUIDACIONES;
        return caso;
    }

    static async consultaCausa(caso) {
        const browser = await pie.connect(app, puppeteer);
        let window;
        window = openWindow(window, false);
        const consultaCausa = new ConsultaCausaPjud(browser, window, caso);
        const result = await consultaCausa.getConsulta()

        return result;
    }

    async launchPuppeteer_inElectron(){
        this.browser = await pie.connect(this.app, puppeteer);
        logger.info("Browser launched");
    }
}

function openWindow(window, useProxy){
    const proxyData = JSON.parse(process.env.PROXY_DATA);
    const randomIndex = Math.floor(Math.random() * proxyData.length); 
    const isVisible = true;
    if(useProxy){
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

module.exports = testUnitarios;



        // else if(arg === 'consultaMultipleCases'){
        //     console.log("Consultando multiples casos"); 
        //     const casos = [];
        //     const caso1 = this.createCaso("C-2396-2022","2° JUZGADO DE LETRAS DE OSORNO");
        //     casos.push(caso1);
        //     const caso2 = this.createCaso("C-3541-2024","2° JUZGADO DE LETRAS DE OSORNO");
        //     casos.push(caso2);
        //     const caso3 = this.createCaso("C-417-2025","1° JUZGADO DE LETRAS DE BUIN");
        //     casos.push(caso3);
        //     const caso4 = this.createCaso("C-46-2025","3° JUZGADO DE LETRAS DE COQUIMBO");
        //     casos.push(caso4);
        //     const caso5 = this.createCaso("C-6-2025","3° JUZGADO CIVIL DE SAN MIGUEL");
        //     casos.push(caso5);
        //     const caso6 = this.createCaso("C-373-2025","1° JUZGADO DE LETRAS DE LOS ANDES");
        //     casos.push(caso6);
        //     const caso7 = this.createCaso("C-4829-2025","9° JUZGADO CIVIL DE SANTIAGO");
        //     casos.push(caso7);
        //     const caso8 = this.createCaso("C-5479-2024","1° JUZGADO CIVIL DE PUENTE ALTO");
        //     casos.push(caso8);
        //     const caso9 = this.createCaso("C-572-2025","13° JUZGADO CIVIL DE SANTIAGO");
        //     casos.push(caso9);
        //     const caso10 = this.createCaso("C-7697-2024","12° JUZGADO CIVIL DE SANTIAGO");
        //     casos.push(caso10);
        //     const caso11 = this.createCaso("C-397-2025","4° JUZGADO DE LETRAS DE TALCA");
        //     casos.push(caso11);
        //     const caso12 = this.createCaso("C-4160-2024","1° JUZGADO CIVIL DE SAN MIGUEL");
        //     casos.push(caso12);
        //     const caso13 = this.createCaso("C-6328-2025","21° JUZGADO CIVIL DE SANTIAGO");
        //     casos.push(caso13);
        //     const caso14 = this.createCaso("C-898-2025","2° JUZGADO DE LETRAS DE IQUIQUE");
        //     casos.push(caso14);
        //     const caso15 = this.createCaso("C-96-2025","1° JUZGADO CIVIL DE VALPARAISO");
        //     casos.push(caso15);
        //     obtainCorteJuzgadoNumbers(casos);
        //     const result = await this.obtainDataFromCases(casos,this.events);
        //     console.log("Resultados de los casos en la funcion de llamada: ",casos.length);
        //     const downloadPath = path.join(os.homedir(), "Documents", "infoRemates");
        //     const excel = new createExcel(downloadPath,new Date(),new Date(),false,"oneDay");
        //     await excel.writeData(casos,`${casos[0].causa}`);

        // }