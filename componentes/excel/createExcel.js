//Necesario si o si
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');
const Causas = require('../../model/Causas.js');
const config = require("../../config.js");
const Caso = require('../caso/caso.js');
const {fixStringDate} = require('../../utils/cleanStrings.js');

const PJUD = config.PJUD;
const EMOL = config.EMOL;
const LIQUIDACIONES = config.LIQUIDACIONES;
const PREREMATES = config.PREREMATES;

const RANGO_EXCEL = 'A5:AQ';

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

    crearBase() {
        // Crea una hoja de cálculo vacía
        const ws = {};

        ws['A5'] = { v: 'vacia', t: 's' };
        ws['B5'] = { v: 'status', t: 's' };
        ws['C5'] = { v: 'F.Desc', t: 's' };
        ws['D5'] = { v: 'origen', t: 's' };
        ws['E5'] = { v: 'notas', t: 's' };
        ws['F5'] = { v: 'F. remate', t: 's' };
        ws['G5'] = { v: 'Ocup', t: 's' };
        ws['H5'] = { v: 'macal', t: 's' };
        ws['I5'] = { v: 'direccion', t: 's' };
        ws['J5'] = { v: 'causa', t: 's' };
        ws['K5'] = { v: 'tribunal', t: 's' };
        ws['L5'] = { v: 'comuna tribunal', t: 's' };
        ws['M5'] = { v: 'comuna propiedad', t: 's' };
        ws['N5'] = { v: 'año inscripcion', t: 's' };
        ws['O5'] = { v: 'partes', t: 's' };
        ws['P5'] = { v: 'dato', t: 's' };
        ws['Q5'] = { v: 'vale vista o cupon', t: 's' };
        ws['R5'] = { v: '%', t: 's' };
        ws['S5'] = { v: 'plazo vv', t: 's' };
        ws['T5'] = { v: 'tipo derecho', t: 's' };
        ws['U5'] = { v: 'deuda 1', t: 's' };
        ws['V5'] = { v: 'deuda 2', t: 's' };
        ws['W5'] = { v: 'deuda 3', t: 's' };
        ws['X5'] = { v: 'rol', t: 's' };
        ws['Y5'] = { v: 'notif', t: 's' };
        ws['Z5'] = { v: 'preciominimo', t: 's' };
        ws['AC5'] = { v: 'UF o $', t: 's' };
        ws['AD5'] = { v: 'avaluo fiscal', t: 's' };
        ws['AF5'] = { v: 'estado civil', t: 's' };
        ws['AG5'] = { v: 'Px $ compra ant', t: 's' };
        ws['AH5'] = { v: 'año compr ant', t: 's' };
        ws['AJ5'] = { v: 'precio venta nos', t: 's' };

        ws['AQ5'] = { v: 'Deuda Hipotecaria', t: 's' };

        // Ajusta el ancho de las columnas
        createExcel.cambiarAnchoColumnas(ws);

        // Define el rango de la hoja para asegurar que incluya todas las celdas especificadas
        ws['!ref'] = 'A5:AQ5';

        // Crea un nuevo libro y agrega la hoja
        const wb = XLSX.utils.book_new();
        wb.Props = {
            Title: 'Remates',
            Subject: 'Remates'
        };
        // Agrega la hoja al libro de trabajo
        XLSX.utils.book_append_sheet(wb, ws, 'Remates');
        // Guarda el archivo
        XLSX.writeFile(wb, path.join(this.saveFile, 'Remates.xlsx'));
    }

    async writeData(casos, name = "") {
        console.log("=====================\nEscibiendo informacion en excel\n==============================");
        let filePath = path.join(this.saveFile, 'Remates.xlsx');
        // Revisa si el archivo base ya existe
        if (!fs.existsSync(path.join(this.saveFile, 'Remates.xlsx'))) {
            this.crearBase(this.saveFile);
            console.log('Archivo creado');
        }
        // Lee el archivo base para poder insertar los datos
        const wb = XLSX.readFile(path.join(this.saveFile, 'Remates.xlsx'));
        const ws = wb.Sheets['Remates'];
        createExcel.cambiarAnchoColumnas(ws);

        try {
            if (this.type === "one") {
                const lastRow = this.fillWithOne(ws, casos);
                ws['!ref'] = RANGO_EXCEL + lastRow;
                filePath = path.join(this.saveFile, 'Caso_' + casos.causa + casos.juzgado + '.xlsx');
            } else if (this.type === "oneDay") {
                let lastRow = this.insertCasos(casos, ws) - 1;
                ws['!ref'] = RANGO_EXCEL + lastRow;
                filePath = path.join(this.saveFile, name + '.xlsx');
            } else {
                let lastRow = await this.insertarCasosExcel(casos, ws) - 1;
                ws['!ref'] = RANGO_EXCEL + lastRow;
                const fechaInicioDMA = cambiarFormatoFecha(this.startDate);
                const fechaFinDMA = cambiarFormatoFecha(this.endDate);
                filePath = path.join(this.saveFile, 'Remates_' + fechaInicioDMA + '_a_' + fechaFinDMA + '.xlsx');
            }
            XLSX.writeFile(wb, filePath, {cellDates: true});
            return filePath;
        } catch (error) {
            console.error('Error al obtener resultados:', error);
            return null;
        }

    }

    insertCasos(casos, ws) {
        let currentRow = 6;
        for (let caso of casos) {
            insertarCasoIntoWorksheet(caso.toObject(), ws, currentRow);
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
        insertarCasoIntoWorksheet(caso, ws, currentRow);
        currentRow = currentRow + 1;
        return currentRow
    }

    async insertarCasosExcel(casos, ws) {
        console.log("Fechas en el exccel: ",fixStringDate(this.startDate),fixStringDate(this.endDate),this.fixedStartDate, this.fixedEndDate)
        let remates = new Map();
        let currentRow = 6;

        if (!Array.isArray(casos) || casos.length === 0) {
            console.log("No se encontraron datos para insertar.");
            return;
        }
        console.log("Los casos recibidos son: ", casos.length);

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
        console.log("Total de casos en remates: ", remates.size);

        // Se escriben todos los casos revisados en la hoja, para eso primero se transforman a
        // objetos para verificar la normalizacion
        for (let caso of remates) {
            console.log("Escribiendo caso :", caso[1].causa);
            const casoObj = caso[1].toObject()

            insertarCasoIntoWorksheet(casoObj, ws, currentRow);
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
            currentCase.juzgado = currentCase.juzgado.replace(/º/g, '°');
        }

        // Si el caso ya existe en la cache, no se guarda
        for (let auction of cacheAuctions) {
            if (auction[1].causa === currentCase.causa && auction[1].juzgado === currentCase.juzgado) {
                // si el caso ya se habia encontrado rellenar la informacion 
                const key = `${auction[1].causa}|${auction[1].juzgado}`;
                let actualCase = cacheAuctions.get(key);
                if(actualCase){
                    // console.log(`El caso con key ${key} ya se encontro rellenado info`)
                    actualCase = Caso.fillMissingData(actualCase,currentCase);
                }
                // console.log("Enviando false por cachedAuctions :",currentCase.causa);
                return false;
            }
        }
        const fechaInicioTest = new Date('2025/09/02');
        // Si la fecha de remate es menor a la fecha de inicio, o mayor a la final
        if (currentCase.fechaRemate && (currentCase.fechaRemate < this.fixedStartDate || currentCase.fechaRemate > this.fixedEndDate )) {
        // if (currentCase.fechaRemate && (currentCase.fechaRemate < fechaInicioTest || currentCase.fechaRemate > fechaInicioTest )) {
            // console.log(`No guardado por fecha remate ${currentCase.causa}`);
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

        // if (currentCase.tipoPropiedad === "Estacionamiento") {
        //     return true;
        // }
        return true;
    }

    isCaseInDB(currentCase){
       const inDB = this.causaDB.searchCausa(currentCase.causa, currentCase.numeroJuzgado); 
       return inDB;
    }

    static cambiarAnchoColumnas(ws) {
        ws['!cols'] = [
            { wch: 15 },  // A
            { wch: 15 },  // B
            { wch: 20 },  // C
            { wch: 70 },  // D
            { wch: 25 },  // E
            { wch: 15 },  // F
            { wch: 15 },  // G
            { wch: 30 },  // H
            { wch: 20 },  // I
            { wch: 15 },  // J
            { wch: 30 },  // K
            { wch: 15 },  // L
            { wch: 20 },  // M
            { wch: 15 },  // N
            { wch: 60 },  // O
            { wch: 15 },  // P
            { wch: 20 },  // Q
            { wch: 15 },  // R
            { wch: 30 },  // S
            { wch: 15 },  // T
            { wch: 30 },  // U
            { wch: 10 },  // V
            { wch: 30 },  // W
            { wch: 15 },  // X
            { wch: 15 },  // Y
            { wch: 15 },  // Z
            { wch: 15 },  // AA
            { wch: 15 },  // AB
            { wch: 15 },  // AC
            { wch: 25 },  // AD
            { wch: 15 },  // AE
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
            { wch: 25 },  // AQ
        ];
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
// Dado un juzgado, obtiene la comuna del juzgado
function getComunaJuzgado(juzgado) {
    if (juzgado == null) {
        return null;
    }
    const juzgadoNormalizado = juzgado.toLowerCase();
    const comunaJuzgado = juzgadoNormalizado.split("de ").at(-1);
    return comunaJuzgado;
}
function formatDateToSQLite(date) {
    // Asegúrate de que el parámetro sea un objeto Date válido
    if (!(date instanceof Date) || isNaN(date)) {
        throw new Error("El parámetro debe ser un objeto Date válido.");
    }

    // Obtener el año, mes y día
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Los meses van de 0 a 11
    const day = String(date.getDate()).padStart(2, '0');

    // Formatear como YYYY-MM-DD
    return `${year}-${month}-${day}`;
}

function fechaMenosUno(fecha) {
    const nuevaFecha = new Date(fecha);
    nuevaFecha.setDate(nuevaFecha.getDate() - 1);
    return nuevaFecha;
}
function writeLine(ws, row, col, value, type) {
    if (value != null) {
        ws[row + col] = { v: value, t: type };
    }
}

function insertarCasoIntoWorksheet(caso, ws, currentRow) {
    let newRol = caso.rolPropiedad;
    if (caso.fechaPublicacion && caso.fechaPublicacion instanceof Date) {
        ws['A' + currentRow] = { v: caso.fechaPublicacion, t: 'd', z: 'dd/mm/yyyy' };
    }
    // console.log("Fecha de obtenion : ", caso.fechaObtencion, "Tipo :", typeof caso.fechaObtencion);
    if (caso.fechaObtencion && caso.fechaObtencion instanceof Date) {
        ws['C' + currentRow] = { v: caso.fechaObtencion, t: 'd', z: 'dd/mm/yyyy' };
    }
    writeLine(ws, 'D', currentRow, caso.link, 's');
    // ws['E'+ currentRow ] = {v: 'notas ', t: 's'};
    if (caso.fechaRemate && caso.fechaRemate instanceof Date) {
        ws['F' + currentRow] = { v: caso.fechaRemate, t: 'd', z: 'DD/MM/YYYY' };
    }
    writeLine(ws, 'H', currentRow, caso.martillero, 's');
    if (caso.tipoDerecho) {
        writeLine(ws, 'H', currentRow, caso.tipoDerecho, 's');
    } else if (caso.isPaid) {
        writeLine(ws, 'H', currentRow, "(Pagado)", 's');
    } else if (caso.isAvenimiento) {
        writeLine(ws, 'H', currentRow, "(Avenimiento)", 's');
    }
    // Revisamos si el caso tiene estacionamiento o bodega, y adaptamos la direccion
    // const newDireccion = this.checkEstacionamientoBodega(caso)
    writeLine(ws, 'I', currentRow, caso.unitDireccion, 's');

    writeLine(ws, 'J', currentRow, caso.causa, 's');
    writeLine(ws, 'K', currentRow, caso.juzgado, 's');
    writeLine(ws, 'L', currentRow, getComunaJuzgado(caso.juzgado), 's');
    writeLine(ws, 'M', currentRow, caso.comuna, 's');
    writeLine(ws, 'N', currentRow, caso.anno, 'n');
    writeLine(ws, 'O', currentRow, caso.partes, 's');
    // ws['O'+ currentRow ] = {v: 'dato ', t: 's'};
    writeLine(ws, 'Q', currentRow, caso.formatoEntrega, 's');
    writeLine(ws, 'R', currentRow, caso.porcentaje, 's');
    writeLine(ws, 'S', currentRow, caso.diaEntrega, 's');
    // ws['T'+ currentRow ] = {v: caso.rolPropiedad, t: 's'};
    // ws['U'+ currentRow ] = {v: 'deuda 2 ', t: 's'};
    // ws['V'+ currentRow ] = {v: 'deuda 3 ', t: 's'};

    // Union de roles de propiedad, estacionamiento y bodega
    // console.log("Rol adaptado: ", newRol);
    writeLine(ws, 'X', currentRow, caso.unitRol, 's');

    // ws['X'+ currentRow ] = {v: 'notif ', t: 's'};
    // Formato de monto minimo segun el tipo de moneda
    if (caso.montoMinimo > 100) {
        if (caso.moneda === 'UF') {
            ws['Z' + currentRow] = { v: parseFloat(caso.montoMinimo), t: 'n', z: '#,##0.0000' };
        }
        else if (caso.moneda == 'Pesos') {
            ws['Z' + currentRow] = { v: parseFloat(caso.montoMinimo), t: 'n', z: '#,##0' };
        }
        writeLine(ws, 'AA', currentRow, caso.moneda, 's');
    }
    if (caso.avaluoPropiedad != null) {
        // const sumAvaluo = this.sumAvaluo(caso.avaluoPropiedad, caso.avaluoEstacionamiento, caso.avaluoBodega);
        ws['AD' + currentRow] = { v: caso.unitAvaluo, t: 'n', z: '#,##0' };
    }
    writeLine(ws, "AF", currentRow, caso.estadoCivil, "s");
    if (caso.montoCompra && caso.montoCompra.monto) {
        ws['AG' + currentRow] = { v: caso.montoCompra.monto, t: 'n' };
    }
    writeLine(ws, "AH", currentRow, caso.anno, "n");
    writeLine(ws, "AQ", currentRow, caso.deudaHipotecaria, "n");
    // ws['AG' + currentRow ] = {v: 'año compr ant ', t: 's'};
    // ws['AH' + currentRow ] = {v: 'precio venta nos ', t: 's'};
}



module.exports = {createExcel, writeLine,insertarCasoIntoWorksheet};