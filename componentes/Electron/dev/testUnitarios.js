const pie = require('puppeteer-in-electron');
const puppeteer = require('puppeteer-core');

const Caso = require('../../caso/caso.js')
const {downloadPdfFromUrl,checkUserAgent} = require('../../pjud/downloadPDF.js');
const {testTexto,testTextoArgs} = require('../../economico/testEconomico.js');
const PjudPdfData = require('../../pjud/PjudPdfData.js');
const ProcesarBoletin = require('../../liquidaciones/procesarBoletin.js');

class testUnitarios{
    constructor(app,events,args,devMode=false){
        this.app = app;
        this.events = events;
        this.args = args;
        this.browser = null;
        this.devMode = true; // Cambiar a false para producción
        this.devMode = devMode
    }

    async mainFunction(){
        await this.launchPuppeteer_inElectron();
        const arg = this.args[0];
        let result;
        if (arg === 'imbeddedText') {
            result = testTexto();
            console.log("Resultados del texto hardCodded: ",result);

        }else if(arg === 'uploadedText'){
            result = testTextoArgs(this.args[1]);

        }else if(arg === 'downloadPDF'){
            console.log("Descargando PDF ubicado en: ",this.args[1]);  
            result = await downloadPdfFromUrl(this.browser,this.args[1]);

        }else if(arg === 'testConsultaCausa'){
            const caso = this.crearCasoPrueba();
            result = await this.consultaCausa(caso);
            console.log("Resultados del caso de prueba en pjud: ",result.toObject());
            console.log(new Date().toString());

        }else if(arg === 'readPdf'){
            const newExcel = this.args[2];
            console.time("readPdf");
            const caso = this.crearCasoPrueba();
            const processPDF = new PjudPdfData(caso,null,this.devMode);
            for(let pdf of this.args[1]){
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
            const result = await this.obtainDataFromCases(casos,this.events);
            console.log("Resultados de los casos en la funcion de llamada: ",casos.length);
            const downloadPath = path.join(os.homedir(), "Documents", "infoRemates");
            const excel = new createExcel(downloadPath,new Date(),new Date(),false,"oneDay");
            await excel.writeData(casos,`${casos[0].causa}`);

        }else if(arg === 'consultaDia'){
            console.log("Consultando casos por dia 6 de junio");
            const casos = await this.searchCasesByDay();
            console.log("Resultados de los casos en la funcion de llamada: ",casos.length);
            const result = await this.obtainDataFromCases(casos,this.events);
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
            const convertData = await this.processTeseract(this.args[1]);
            console.log("Resultados del texto introducido: ", convertData);
            const caso = this.createCaso("C-321-2024","1º JUZGADO DE LETRAS DE ANGOL");
            const processPDF = new PjudPdfData(caso);
            console.log("Procesnado el caso leido con Tesseract: ");
            processPDF.processInfo(convertData);
            console.log("Resultados del caso procesado: ", caso.toObject());
            console.timeEnd("testPdfTesseract");
        }
    }

    crearCasoPrueba() {
        const caso = new Caso("2025/11/30");
        caso.juzgado = "8º JUZGADO CIVIL DE SANTIAGO";
        caso.causa = "C-2484-2023";
        caso.fechaRemate = "02/12/2024 15:30";

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
        console.log("Browser launched");
    }
}

module.exports = testUnitarios;