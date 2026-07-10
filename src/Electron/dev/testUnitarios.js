const pie = require('puppeteer-in-electron');
const puppeteer = require('puppeteer-core');
const path = require('path');
const os = require('os');

const Caso = require('#models/caso/caso.js')
const {downloadPdfFromUrl} = require('#sources/pjud/downloadPDF.js');
const {testTexto,testTextoArgs} = require('#sources/economico/testEconomico.js');
const PjudPdfData = require('#sources/pjud/PjudPdfData.js');
const ProcesarBoletin = require('#sources/liquidaciones/procesarBoletin.js');
// const ConsultaCausaPjud = require('../../pjud/ConsultaCausaPjud.js');
const MapasSII = require('#enrichers/mapasSII/MapasSII.js');
const MacalService = require('#sources/macal/macalService.js');
const logger = require('#utils/logger.js');
const { fakeDelay } = require('#utils/delay.js');
const { createExcel } = require('#exporters/excel/createExcel.js');
const config = require('#config');
const Economico = require('#sources/economico/Economico.js');
const CompleteExcelInfo = require('../main/prod/CompleteExcelInfo.js');

const LIQUIDACIONES = config.LIQUIDACIONES;


class testUnitarios{
    constructor(mainWindow, app,events,args){
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
            console.log(`Resultado de caso test texto args: ${result}`);

        }else if(arg === 'downloadPDF'){
            logger.info("Descargando PDF ubicado en: ",this.args[1]);
            result = await downloadPdfFromUrl(this.browser,this.args[1]);
            if(result){
                console.log(`Resultado de descargar el pdf exitoso`);
            }else{
                console.log(`Resultado fallido de descarga`);
            }


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
            let mapasSII;
            try{
                let page = null;    
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
        }else if(arg === "testMacal"){
            logger.info("Iniciando test de MacalService");
            const result2 = await MacalService.getPropertiesUntilDate("2025/10/29",{});
            logger.info("Resultado de MacalService: ", result2.totalPages);
            //Write to Excel
            const Excel = new createExcel(path.join(os.homedir(), "Documents", "infoRemates"),null,null,false,"macal");
            await Excel.writeData(result2.properties,"Remates_macal");
            console.log("Excel de Macal creado");
        }else if(arg === "testUserAgents"){
            const economico = new Economico(this.browser, '', '', null,null, true);
            await economico.testPage();

        }else if(arg === "testCompleteExcelInfo"){
            const excelBase = this.args[1];
            const excelNuevo = this.args[2];


            const result = await CompleteExcelInfo.searchRepeatedCases(excelBase, excelNuevo, this.devMode);
            console.log("Resultados de la busqueda de casos repetidos:", result);
        }else { 
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

    async launchPuppeteer_inElectron(){
        this.browser = await pie.connect(this.app, puppeteer);
        logger.info("Browser launched");
    }
}

module.exports = testUnitarios;