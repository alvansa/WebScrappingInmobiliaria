//Necesario si o si
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');
const Causas = require('../../model/Causas.js');
const config = require("../../config.js");
const { create } = require('domain');

const PJUD = 2;


class createExcel {
    constructor(saveFile, startDate, endDate,emptyMode,type) {
        this.saveFile = saveFile;
        this.startDate = startDate;
        this.endDate = endDate;
        this.emptyMode = emptyMode;
        this.type = type;

    }
    crearBase() {
        // Crea una hoja de cálculo vacía
        const ws = {};

        ws['A5'] = { v: 'vacia ', t: 's' };
        ws['B5'] = { v: 'status ', t: 's' };
        ws['C5'] = { v: 'F.Desc ', t: 's' };
        ws['D5'] = { v: 'origen ', t: 's' };
        ws['E5'] = { v: 'notas ', t: 's' };
        ws['F5'] = { v: 'F. remate ', t: 's' };
        ws['G5'] = { v: 'macal ', t: 's' };
        ws['H5'] = { v: 'direccion ', t: 's' };
        ws['I5'] = { v: 'causa ', t: 's' };
        ws['J5'] = { v: 'tribunal ', t: 's' };
        ws['K5'] = { v: 'comuna tribunal ', t: 's' };
        ws['L5'] = { v: 'comuna propiedad ', t: 's' };
        ws['M5'] = { v: 'año inscripcion ', t: 's' };
        ws['N5'] = { v: 'partes ', t: 's' };
        ws['O5'] = { v: 'dato ', t: 's' };
        ws['P5'] = { v: 'vale vista o cupon ', t: 's' };
        ws['Q5'] = { v: '% ', t: 's' };
        ws['R5'] = { v: 'plazo vv ', t: 's' };
        ws['S5'] = { v: 'tipo derecho ', t: 's' };
        ws['T5'] = { v: 'deuda 1 ', t: 's' };
        ws['U5'] = { v: 'deuda 2 ', t: 's' };
        ws['V5'] = { v: 'deuda 3 ', t: 's' };
        ws['W5'] = { v: 'rol ', t: 's' };
        ws['X5'] = { v: 'notif ', t: 's' };
        ws['Y5'] = { v: 'preciominimo ', t: 's' };
        ws['Z5'] = { v: 'UF o $ ', t: 's' };
        ws['AC5'] = { v: 'avaluo fiscal ', t: 's' };
        ws['AE5'] = { v: 'estado civil ', t: 's' };
        ws['AF5'] = { v: 'Px $ compra ant ', t: 's' };
        ws['AG5'] = { v: 'año compr ant ', t: 's' };
        ws['AH5'] = { v: 'precio venta nos ', t: 's' };
        ws['AE5'] = { v: 'estado civil ', t: 's' };

        // Ajusta el ancho de las columnas
        this.cambiarAnchoColumnas(ws);

        // Define el rango de la hoja para asegurar que incluya todas las celdas especificadas
        ws['!ref'] = 'A5:AH5';

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


    async writeData(casos,name="") {
        let filePath = path.join(this.saveFile, 'Remates.xlsx');
        // Revisa si el archivo base ya existe
        if (!fs.existsSync(path.join(this.saveFile, 'Remates.xlsx'))) {
            this.crearBase(this.saveFile);
            console.log('Archivo creado');
        }
        // Lee el archivo base para poder insertar los datos
        const wb = XLSX.readFile(path.join(this.saveFile, 'Remates.xlsx'));
        const ws = wb.Sheets['Remates'];
        this.cambiarAnchoColumnas(ws);
        
        try {
            if(this.type === "one"){
                const lastRow = this.fillWithOne(ws,casos);
                ws['!ref'] = 'A5:AH' + lastRow;
                filePath = path.join(this.saveFile, 'Caso_'+casos.causa+casos.juzgado+'.xlsx');
            }else if(this.type === "oneDay"){
                let lastRow = this.insertCasos(casos,ws) - 1;
                ws['!ref'] = 'A5:AH' + lastRow;
                filePath = path.join(this.saveFile,name+'.xlsx');
            }else{
                let lastRow = await this.insertarCasosExcel(casos, ws) - 1;
                ws['!ref'] = 'A5:AH' + lastRow;
                const fechaInicioDMA = cambiarFormatoFecha(this.startDate);
                const fechaFinDMA = cambiarFormatoFecha(this.endDate);
                filePath = path.join(this.saveFile, 'Remates_' + fechaInicioDMA + '_a_' + fechaFinDMA + '.xlsx');
            }
            XLSX.writeFile(wb, filePath);
            return filePath;
        } catch (error) {
            console.error('Error al obtener resultados:', error);
            return null;
        }

    }

    insertCasos(casos,ws){
        let currentRow = 6;
        for(let caso of casos){
            this.insertarCasoIntoWorksheet(caso,ws,currentRow);
            currentRow = currentRow + 1;
        }
        return currentRow;
    }


    fillWithOne(ws, casos){
        const caso = casos.toObject();

        let currentRow = 6;
        this.insertarCasoIntoWorksheet(caso, ws, currentRow);
        currentRow = currentRow + 1;
        return currentRow
    }

    async insertarCasosExcel(casos, ws) {
        const startDateSQL = stringToDate(this.startDate); 
        let remates = new Set();
        let currentRow = 6;
        const causaDB = new Causas();
        const rematesDB = causaDB.getCausas(formatDateToSQLite(startDateSQL));
        for(let remateDB of rematesDB){
            if(remateDB.juzgado){
                remateDB.juzgado = remateDB.juzgado.replace(/º/g, '°');
            }
        }
        if (!Array.isArray(casos) || casos.length === 0) {
            console.log("No se encontraron datos para insertar.");
            return;
        }
        const casosObj = casos.map(caso => caso.toObject());

        for (let caso of casosObj) {
            if (caso.fechaPublicacion === "N/A" || caso.fechaPublicacion == null) {
                caso.fechaPublicacion = fechaMenosUno(this.endDate);
            }
            if(this.shouldSkip(caso,remates,rematesDB,startDateSQL)){
                continue;
            }

            if(!this.emptyMode){
                remates.add({ causa: caso.causa, juzgado: caso.juzgado, fecha: formatDateToSQLite(caso.fechaPublicacion) });
            }
            this.insertarCasoIntoWorksheet(caso, ws, currentRow);
            currentRow++;
        }
        // Agrega los remates a la base de datos
        if (!this.emptyMode) {
            causaDB.insertCaso(remates);
        }
        return currentRow;
    }

    shouldSkip(currentCase, cacheAuctions, auctionsDB,startDateSQL) {
        if(currentCase.juzgado){
            currentCase.juzgado = currentCase.juzgado.replace(/º/g,'°');
        }
        
        // Si el caso ya existe en la cache, no se guarda
        for (let auction of cacheAuctions) {
            if (auction.causa === currentCase.causa && auction.juzgado === currentCase.juzgado) {
                return true;
            }
        }
        // Si la fecha de remate es menor a la fecha de inicio, no se guarda
        if (currentCase.fechaRemate < this.endDate) {
            return true;
        }
        // No se escriben casos de juez partidor
        if (currentCase.juzgado === "Juez Partidor") {
            return true;
        }
        if(currentCase.origen === PJUD){ // Solo si es caso es del pjud revisamos si ya existe en la base de datos
            // Si el caso ya existe en la base de datos, no se guarda
            for (let savedAuction of auctionsDB) {
                if (savedAuction.causa === currentCase.causa && savedAuction.juzgado === currentCase.juzgado && savedAuction.fecha < formatDateToSQLite(startDateSQL)) {
                    return true;
                }
            }
        }
        // if (currentCase.tipoPropiedad === "Estacionamiento") {
        //     return true;
        // }
        return false;
    }


    insertarCasoIntoWorksheet(caso, ws, currentRow) {
        console.log("Fecha de obtenion : ", caso.fechaObtencion, "Tipo :", typeof caso.fechaObtencion);
        this.writeLine(ws,'C',currentRow, caso.fechaObtencion, 'd');
        this.writeLine(ws,'D',currentRow, caso.link, 's');
        // ws['E'+ currentRow ] = {v: 'notas ', t: 's'};
        if (caso.fechaRemate !== null) {
            const adjustedAuctionDate = new Date(caso.fechaRemate);
            adjustedAuctionDate.setHours(adjustedAuctionDate.getHours() + 6);
            this.writeLine(ws, 'F', currentRow,adjustedAuctionDate, 'd');
        }
        this.writeLine(ws,'G',currentRow, caso.martillero, 's');
        this.writeLine(ws,'H',currentRow, caso.direccion, 's');
        this.writeLine(ws,'I',currentRow, caso.causa, 's');
        this.writeLine(ws,'J',currentRow, caso.juzgado, 's');
        this.writeLine(ws,'K',currentRow, getComunaJuzgado(caso.juzgado), 's');
        this.writeLine(ws,'L',currentRow, caso.comuna, 's');
        this.writeLine(ws,'M',currentRow, caso.anno, 's');
        this.writeLine(ws,'N',currentRow, caso.partes, 's');
        // ws['O'+ currentRow ] = {v: 'dato ', t: 's'};
        this.writeLine(ws,'P',currentRow, caso.formatoEntrega, 's');
        this.writeLine(ws,'Q',currentRow, caso.porcentaje, 's');
        this.writeLine(ws,'R',currentRow, caso.diaEntrega, 's');
        this.writeLine(ws,'S',currentRow, caso.tipoDerecho, 's');
        // ws['T'+ currentRow ] = {v: caso.rolPropiedad, t: 's'};
        // ws['U'+ currentRow ] = {v: 'deuda 2 ', t: 's'};
        // ws['V'+ currentRow ] = {v: 'deuda 3 ', t: 's'};
        this.writeLine(ws, "W",currentRow, caso.rolPropiedad,"s");
        // ws['X'+ currentRow ] = {v: 'notif ', t: 's'};
        // Formato de monto minimo segun el tipo de moneda
        if (caso.moneda === 'UF') {
            ws['Y' + currentRow] = { v: parseFloat(caso.montoMinimo), t: 'n', z: '#,##0.0000' };
        }
        else if (caso.moneda == 'Pesos') {
            ws['Y' + currentRow] = { v: parseFloat(caso.montoMinimo), t: 'n', z: '#,##0' };
        }
        this.writeLine(ws,'Z',currentRow, caso.moneda, 's');
        if(caso.avaluoPropiedad != null){
            ws['AC' + currentRow] = { v: caso.avaluoPropiedad, t: 'n', z: '#,##0' };
        }
        this.writeLine(ws, "AE",currentRow, caso.estadoCivil,"s");
        // ws['AF' + currentRow ] = {v: 'Px $ compra ant ', t: 's'};
        // ws['AG' + currentRow ] = {v: 'año compr ant ', t: 's'};
        // ws['AH' + currentRow ] = {v: 'precio venta nos ', t: 's'};
    }

    writeLine(ws,row,col,value,type){
        if(value != null){
            ws[row + col] = { v: value, t: type };
        }
    }


    cambiarAnchoColumnas(ws) {
        ws['!cols'] = [
            { wch: 15 },  // A
            { wch: 15 },  // B
            { wch: 20 },  // C
            { wch: 70 },  // D
            { wch: 25 },  // E
            { wch: 15 },  // F
            { wch: 30 },  // G
            { wch: 20 },  // H
            { wch: 15 },  // I
            { wch: 30 },  // J
            { wch: 15 },  // K
            { wch: 20 },  // L
            { wch: 15 },  // M
            { wch: 60 },  // N
            { wch: 15 },  // O
            { wch: 20 },  // P
            { wch: 15 },  // Q
            { wch: 30 },  // R
            { wch: 15 },  // S
            { wch: 30 },  // T
            { wch: 10 }, // U
            { wch: 30 },  // V
            { wch: 15 },  // W
            { wch: 15 },  // X
            { wch: 15 },  // Y
            { wch: 15 },  // Z
            { wch: 15 },  // AA
            { wch: 15 },  // AB
            { wch: 25 },  // AC
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

// Dado un objeto Date, devuelve un string con el formato dd/mm/yyyy
function dateToPjud(date) {
    const dia = String(date.getDate()).padStart(2, '0');  // Asegura que el día tenga dos dígitos
    const mes = String(date.getMonth() + 1).padStart(2, '0');  // Meses son 0-indexados, por lo que sumamos 1
    const año = date.getFullYear();

    return `${dia}/${mes}/${año}`;
}

// Dado la fecha y la cantidad de dias a sumar, cambia la fecha de inicio para el pjud
function cambiarFechaInicio(fecha, dias) {
    const partes = fecha.split("-"); // Dividimos la fecha en partes [año, mes, día]
    const [año, mes, día] = partes; // Desestructuramos las partes
    let fechaFinal = new Date(`${año}/${mes}/${día}`);
    fechaFinal.setDate(fechaFinal.getDate() + dias);
    const fechaFinalPjud = dateToPjud(fechaFinal);
    return fechaFinalPjud;
}

// Cambia la fecha final de obtencion de datos para el pjud
function cambiarFechaFin(fecha) {
    const partes = fecha.split("-"); // Dividimos la fecha en partes [año, mes, día]
    const [año, mes, día] = partes; // Desestructuramos las partes
    let fechaFinal = new Date(`${año}/${mes}/${día}`);
    fechaFinal.setMonth(fechaFinal.getMonth() + 1);
    const fechaFinalPjud = dateToPjud(fechaFinal);
    return fechaFinalPjud;
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



module.exports = createExcel;