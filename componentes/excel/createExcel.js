//Necesario si o si
const XLSX = require(`xlsx`);
const fs = require(`fs`);
const path = require(`path`);
const Causas = require(`../../model/Causas.js`);
const config = require("../../config.js");
const Caso = require(`../caso/caso.js`);
const {fixStringDate, transformDateString} = require(`../../utils/cleanStrings.js`);
const excelRowWriter = require(`./excelRowWriter.js`);
const excelTemplateBuilder = require(`./excelTemplateBuilder.js`);

const PJUD = config.PJUD;
const EMOL = config.EMOL;
const LIQUIDACIONES = config.LIQUIDACIONES;
const PREREMATES = config.PREREMATES;
// const config = config.LETRAS;

const MACAL = 0
const ONEDAY = 1
const ONE = 2
const PRELIMINAR = 3;

const RANGO_EXCEL = `${config.INICIO}5:${config.COMENTARIOS3}`;

class createExcel {
    constructor(saveFile, startDate, endDate, emptyMode, type, isTestMode = false) {
        this.saveFile = saveFile;
        this.startDate = startDate;
        this.endDate = endDate;
        this.emptyMode = emptyMode;
        this.type = type;
        this.fixedStartDate = new Date(fixStringDate(startDate));
        this.fixedEndDate = new Date(fixStringDate(endDate));
        this.causaDB = new Causas();
        this.comunas = this.causaDB.obtainComunasFromDB();
        this.isTestMode = isTestMode; // Indica si se está en modo desarrollo

    }


    async writeData(casos, name = "") {
        console.log("=====================\nEscibiendo informacion en excel\n==============================");
        const {wb, ws, filePath} = this.loadFile();
        excelTemplateBuilder.cambiarAnchoColumnas(ws);
        let lastRow = 5; // Comienza después de la fila de encabezado
        let filePathExcel = filePath;
        try {
            if (this.type === "one") {
                lastRow = this.fillWithOne(ws, casos);
                filePathExcel = path.join(this.saveFile, `Caso_` + casos.causa + casos.juzgado + '.xlsx');
            } else if (this.type === "oneDay") {
                lastRow = await this.insertCasos(casos, ws) - 1;
                filePathExcel = path.join(this.saveFile, name + `.xlsx`);
            }else if (this.type === "macal") {
                lastRow = this.insertMacal(casos,ws);
                const dateToday = `1-1-25`
                filePathExcel = path.join(this.saveFile, `Remates_macal_` + dateToday + '.xlsx');
            }else if(this.type == PRELIMINAR){

            }
            else {
                lastRow = await this.insertarCasosExcel(casos, ws) - 1;
                const fechaInicioDMA = cambiarFormatoFecha(this.startDate);
                const fechaFinDMA = cambiarFormatoFecha(this.endDate);
                filePathExcel = path.join(this.saveFile, `Remates_` + fechaInicioDMA + '_a_' + fechaFinDMA + '.xlsx');
            }
            ws[`!ref`] = RANGO_EXCEL + lastRow;
            XLSX.writeFile(wb, filePathExcel, {cellDates: true});
            return filePathExcel;
        } catch (error) {
            console.error(`Error al obtener resultados:`, error);
            return null;
        }
    }

    loadFile(){
        let filePath = path.join(this.saveFile, `Remates.xlsx`);
        // Revisa si el archivo base ya existe
        if (!fs.existsSync(path.join(this.saveFile, `Remates.xlsx`))) {
            excelTemplateBuilder.buildTemplate(this.saveFile);
        }
        // Lee el archivo base para poder insertar los datos
        const wb = XLSX.readFile(path.join(this.saveFile, `Remates.xlsx`));
        const ws = wb.Sheets[`Remates`];

        return {wb, ws, filePath};
    }
    async insertCasos(casos, ws) {
        let currentRow = 6;
        for (let caso of casos) {
            await excelRowWriter.writeCasoRow(ws, currentRow, caso);
            currentRow = currentRow + 1;
        }
        return currentRow;
    }

    async insertMacal(casos, ws) {
        let currentRow = 6;
        for(let caso of casos){
            await excelRowWriter.writeMacalRow(ws,currentRow,caso);
            currentRow = currentRow + 1;
        }
        return currentRow;
    }

    fillWithOne(ws, casos) {
        // Agregar la busqueda de casos en DB y union si existe ya en la DB
        const caseDB = this.isCaseInDB(casos);
        if(caseDB){
            casos = Caso.bindCaseWithDB(casos,caseDB);
        }
        this.causaDB.insertCase(casos,this.comunas); 
        const caso = casos.toObject();
        let currentRow = 6;
        excelRowWriter.writeCasoRow(ws, currentRow, caso);
        currentRow = currentRow + 1;
        return currentRow
    }

    async insertarCasosExcel(casos, ws) {
        //TODO: Cambiar esto para que quede claro que es un map
        let remates = new Map();
        let currentRow = 6;

        if (!Array.isArray(casos) || casos.length === 0) {
            return;
        }
        console.log('Casos a procesar:', casos.length);

        // Primero se leen todos los casos obtenidos y se verifican para agregarlos,
        // en caso de que ya hayan sido agregados se une la informacion 
        for(let caso of casos){
            if (caso.fechaPublicacion === "N/A" || caso.fechaPublicacion == null) {
                caso.fechaPublicacion = fechaMenosUno(this.endDate);
            }
            if(this.getValidAuctions(caso, remates) || this.isTestMode){
                this.addObjectToSet(remates,caso);
            }
        }

        // Se escriben todos los casos revisados en la hoja, para eso primero se transforman a
        // objetos para verificar la normalizacion
        for (let caso of remates) {
            const casoObj = caso[1].toObject()
            // await insertarCasoIntoWorksheet(casoObj, ws, currentRow);
            await excelRowWriter.writeRow(ws, currentRow, casoObj);  
            currentRow++;
        }
        // Agrega los remates a la base de datos
        if (!this.emptyMode) {
            this.causaDB.insertMultipleCases(remates,this.comunas);
        }
        return currentRow;
    }

    addObjectToSet(remates,caso){
        const key = `${caso.causa}|${caso.juzgado}`;
        if(!remates.has(key)){
            remates.set(key, caso);
        }
    }

    getValidAuctions(currentCase, cacheAuctions) {
        if (currentCase.juzgado) {
            currentCase.juzgado = currentCase.juzgado.replace(/º/g, `°`);
        }

        // Si el caso ya existe en la cache, no se guarda
        for (let auction of cacheAuctions) {
            if (auction[1].causa === currentCase.causa && auction[1].juzgado === currentCase.juzgado) {
                // si el caso ya se habia encontrado rellenar la informacion 
                const key = `${auction[1].causa}|${auction[1].juzgado}`;
                let actualCase = cacheAuctions.get(key);
                if(actualCase){
                    actualCase = Caso.fillMissingData(actualCase,currentCase);
                }
                return false;
            }
        }
        const fechaInicioTest = new Date(`2025/09/02`);
        // Si la fecha de remate es menor a la fecha de inicio, o mayor a la final
        if (currentCase.fechaRemate && (currentCase.fechaRemate < this.fixedStartDate || currentCase.fechaRemate > this.fixedEndDate )) {
        // if (currentCase.fechaRemate && (currentCase.fechaRemate < fechaInicioTest || currentCase.fechaRemate > fechaInicioTest )) {
            return false;
        }
        // No se escriben casos de juez partidor
        if (currentCase.juzgado === "Juez Partidor") {
            return false;
        }

        // Agregar la busqueda de casos en DB y union si existe ya en la DB
        const caseDB = this.isCaseInDB(currentCase);
        if(caseDB){
            currentCase = Caso.bindCaseWithDB(currentCase,caseDB);
        }
        return true;
    }

    isCaseInDB(currentCase){
       const inDB = this.causaDB.searchCausa(currentCase.causa, currentCase.numeroJuzgado); 
       return inDB;
    }

}

// Dado un string con el formato yyyy-mm-dd, devuelve un string con el formato dd-mm-yyyy
function cambiarFormatoFecha(fecha) {
    const partes = fecha.split("-"); // Dividimos la fecha en partes [año, mes, día]
    const [año, mes, día] = partes; // Desestructuramos las partes
    return `${día}-${mes}-${año}`;  // Construimos el nuevo formato
}

// Dado un string con el formato yyyy-mm-dd, devuelve un objeto Date
function stringToDate(fecha) {
    const partes = fecha.split("-"); // Dividimos la fecha en partes [año, mes, día]
    const [año, mes, día] = partes; // Desestructuramos las partes
    return new Date(`${año}/${mes}/${día}`);
}
function formatDateToSQLite(date) {
    // Asegúrate de que el parámetro sea un objeto Date válido
    if (!(date instanceof Date) || isNaN(date)) {
        throw new Error("El parámetro debe ser un objeto Date válido.");
    }

    // Obtener el año, mes y día
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, `0`); // Los meses van de 0 a 11
    const day = String(date.getDate()).padStart(2, `0`);

    // Formatear como YYYY-MM-DD
    return `${year}-${month}-${day}`;
}

function fechaMenosUno(fecha) {
    const nuevaFecha = new Date(fecha);
    nuevaFecha.setDate(nuevaFecha.getDate() - 1);
    return nuevaFecha;
}


module.exports = {createExcel};