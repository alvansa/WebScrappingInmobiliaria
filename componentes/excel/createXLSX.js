//Necesario si o si
const config  =  require("../../config.js");
const XLSX = require('xlsx');

const fs = require('fs');

const path = require('path');

const {getDatosRemate} = require('../economico/datosRemateEmol.js'); 
const {getPJUD,datosFromPjud} = require('../pjud/getPjud.js');
const {getPdfData} = require('../liquidaciones/procesarBoletin.js');
const {PreRemates} = require('../preremates/obtenerPublicaciones.js');
const { get } = require("http");


function crearBase(saveFile) {
    // Crea una hoja de cálculo vacía
    const ws = {};

    // Define cada celda con el valor y el tipo
    ws['B5'] = { v: 'Link', t: 's' };
    ws['C5'] = { v: 'Fecha Obtención', t: 's' };
    ws['D5'] = { v: 'Fecha Publicación', t: 's' };
    ws['E5'] = { v: 'Fecha Remate', t: 's' };
    ws['F5'] = { v: 'Causa', t: 's' };
    ws['G5'] = { v: 'Juzgado', t: 's' };
    ws['H5'] = { v: 'Comuna del juzgado', t: 's' };
    ws['I5'] = { v: 'Partes', t: 's' };
    ws['J5'] = { v: 'Tipo propiedad', t: 's' };
    ws['K5'] = { v: 'Dirección', t: 's' };
    ws['L5'] = { v: 'Tipo derecho', t: 's' };
    ws['M5'] = { v: 'Comuna', t: 's' };
    ws['N5'] = { v: 'Foja', t: 's' };
    ws['O5'] = { v: 'Numero', t: 's' };
    ws['P5'] = { v: 'Año', t: 's' };
    ws['Q5'] = { v: 'VV o Cupón', t: 's' };
    ws['R5'] = { v: 'Porcentaje', t: 's' };
    ws['S5'] = { v: 'Día entrega', t: 's' };
    ws['T5'] = { v: 'Monto Mínimo', t: 's' };
    ws['U5'] = { v: 'Moneda', t: 's' };
    ws['V5'] = { v: 'Martillero', t: 's' };

    // Ajusta el ancho de las columnas
    cambiarAnchoColumnas(ws);

    // Define el rango de la hoja para asegurar que incluya todas las celdas especificadas
    ws['!ref'] = 'B5:V5';

    // Crea un nuevo libro y agrega la hoja
    const wb = XLSX.utils.book_new();
    wb.Props = {
        Title: 'Remates',
        Subject: 'Remates'
    };

    // Agrega la hoja al libro de trabajo
    XLSX.utils.book_append_sheet(wb, ws, 'Remates');
    
    // Guarda el archivo
    XLSX.writeFile(wb, path.join(saveFile, 'Remates.xlsx'));
}


async function insertarDatos(fechaHoy,fechaInicioStr,fechaFinStr,maxRetries,saveFile) {
    const fechaLimite = stringToDate(fechaFinStr);
    var filePath = path.join(saveFile, 'Remates.xlsx');
    if(!fs.existsSync(path.join(saveFile, 'Remates.xlsx'))){
        crearBase(saveFile);
        console.log('Archivo creado');
    }
    const wb = XLSX.readFile(path.join(saveFile, 'Remates.xlsx'));
    const ws = wb.Sheets['Remates'];
    cambiarAnchoColumnas(ws);
    const [casosEconomico,casosLiquidaciones,casosPreremates,casosPjud] = await Promise.all([
        getCasosEconomico(fechaHoy,fechaInicioStr,fechaFinStr,maxRetries),
        getCasosLiquidaciones(fechaHoy,fechaInicioStr,fechaFinStr),
        getCasosPreremates(),
        // getDatosPjud(fechaInicioStr,fechaFinStr)
        Promise.resolve([])
    ]);
    const casos = [...casosEconomico,...casosLiquidaciones,...casosPreremates,...casosPjud];
    try{
        let lastRow = insertarCasosExcel(casos,ws,fechaLimite) - 1;
        // lastRow--;
        ws['!ref'] = 'B5:V'+lastRow;
        const fechaInicioDMA = cambiarFormatoFecha(fechaInicioStr);
        const fechaFinDMA = cambiarFormatoFecha(fechaFinStr);
        filePath = path.join(saveFile, 'Remates_'+fechaInicioDMA+'_a_'+fechaFinDMA+'.xlsx');
        XLSX.writeFile(wb, filePath);
        console.log(filePath);
        return filePath;
    }catch(error){
        console.error('Error al obtener resultados:', error);
        return null;
    }
    
}


async function getCasosEconomico(fechaHoy,fechaInicioStr,fechaFinStr,maxRetries){
    let casos = [];
    try{
        casos = await getDatosRemate(fechaHoy,fechaInicioStr,fechaFinStr,maxRetries) || [];
    }catch(error){
        console.error('Error al obtener resultados en emol:', error);
    }
    return casos
}

async function getCasosLiquidaciones(fechaHoy,fechaInicioStr,fechaFinStr){
    let casos = [];
    const startDate = stringToDate(fechaInicioStr);
    const endDate = stringToDate(fechaFinStr);

    try{
        casos = await getPdfData(startDate,endDate,fechaHoy) || [];
    }catch(error){
        console.error('Error al obtener resultados en el boletin:', error);
    }
    return casos;
}

async function getCasosPreremates(){
    let casos = [];
    const EMAIL = config.EMAIL;
    const PASSWORD = config.PASSWORD;
    try{
        const preRemates = new PreRemates(EMAIL,PASSWORD);
        casos = await preRemates.getRemates();
    }catch(error){
        console.error('Error al obtener resultados:', error);
    }
    return casos;
}
async function getDatosPjud(fechaInicioStr,fechaFinStr){
    console.log("Fechas: ",fechaInicioStr,fechaFinStr);
    let casosPjud = [];
    let fechaInicioPjud = '';
    let fechaFinPjud = '';
    if(config.cambiarDias == false){
        fechaInicioPjud = cambiarFechaInicio(fechaInicioStr,0);
        fechaFinPjud = cambiarFechaInicio(fechaFinStr,0);
    }else{
        fechaInicioPjud = cambiarFechaInicio(fechaFinStr,8);
        // cambiar la fecha del pjud final a 14 dias mas.
        fechaFinPjud = cambiarFechaFin(fechaFinStr);
    }
    console.log("Fechas: ",fechaInicioPjud,fechaFinPjud);

    try{
        casosPjud = await datosFromPjud(fechaInicioPjud,fechaFinPjud) || [];
    }catch(error){
        console.log('Error al obtener resultados en el pjud:', error);
        return casosPjud;
    }
    return casosPjud;;
}

function insertarCasosExcel(casos,ws,fechaLimite){
    let remates = new Set();
    let currentRow = 6;
    if (!Array.isArray(casos) || casos.length === 0) {
        console.log("No se encontraron datos para insertar.");
        return;
    }
    const casosObj = casos.map(caso => caso.toObject());
    
    for(let caso of casosObj){
        if(shouldSkip(caso,remates,fechaLimite)){
            continue;
        }
        remates.add(caso.causa);
        insertarCasoIntoWorksheet(caso,ws,currentRow);
        currentRow++;
    }
    return currentRow;
}

function shouldSkip(caso,remates,fechaLimite){
    if(remates.has(caso.causa)){
        return true;
    }
    if(caso.fechaRemate < fechaLimite){
        return true;
    }
    if(caso.juzgado === "Juez Partidor"){
        return true;
    }
    return false;
}

function insertarCasoIntoWorksheet(caso,ws,currentRow){
    ws['B' + currentRow] = { v: caso.link, t: 's' };
    ws['C' + currentRow] = { v: caso.fechaObtencion, t: 'd' };
    
    if(caso.fechaPublicacion !== "N/A"){
        const adjustedDate = new Date(caso.fechaPublicacion);
        adjustedDate.setHours(adjustedDate.getHours() + 6);
        ws['D' + currentRow] = { v: adjustedDate, t: 'd' };
    }
    if(caso.fechaRemate !== "N/A"){
        const adjustedAuctionDate = new Date(caso.fechaRemate);
        adjustedAuctionDate.setHours(adjustedAuctionDate.getHours() + 6);
        ws['E' + currentRow] = { v: adjustedAuctionDate , t: 'd' };
    }
    ws['F' + currentRow] = { v: caso.causa, t: 's' };
    ws['G' + currentRow] = { v: caso.juzgado, t: 's' };
    ws['H' + currentRow] = { v: getComunaJuzgado(caso.juzgado), t: 's' };
    ws['I' + currentRow] = { v: caso.partes, t: 's' };
    ws['J' + currentRow] = { v: caso.tipoPropiedad, t: 's' };
    ws['K' + currentRow] = { v: caso.direccion, t: 's' };
    ws['L' + currentRow] = { v: caso.tipoDerecho, t: 's' };
    ws['M' + currentRow] = { v: caso.comuna, t: 's' };
    ws['N' + currentRow] = { v: caso.foja, t: 's' };
    ws['O' + currentRow] = { v: caso.numero, t: 's' };

    if(caso.anno == 'No especifica'){
        ws['P' + currentRow] = { v: caso.anno, t: 's' };
    }else{
        ws['P' + currentRow] = { v: caso.anno, t: 'n' };
    }

    ws['Q' + currentRow] = { v: caso.formatoEntrega, t: 's' };
    ws['R' + currentRow] = { v: caso.porcentaje, t: 's' };
    ws['S' + currentRow] = { v: caso.diaEntrega, t: 's' };

    // Formato de monto minimo segun el tipo de moneda
    if(caso.moneda === 'No aplica'){
        ws['T' + currentRow] = { v: caso.montoMinimo, t: 's' };
        ws["U" + currentRow] = { v: caso.moneda, t: 's' };
    }
    else if(caso.moneda == 'UF'){
        ws['T' + currentRow] = { v:parseFloat(caso.montoMinimo), t: 'n', z: '#,##0.0000' };
    }else{
        ws['T' + currentRow] = { v:parseFloat(caso.montoMinimo), t: 'n', z: '#,##0' };
    }
    ws['U' + currentRow] = { v: caso.moneda, t: 's' };                
    ws['V' + currentRow] = { v: caso.martillero, t: 's' }; 
}

function cambiarAnchoColumnas(ws){
    ws['!cols'] = [
        { wch: 15 },  // A
        { wch: 60 },  // B
        { wch: 20 },  // C
        { wch: 20 },  // D
        { wch: 25 },  // E
        { wch: 15 },  // F
        { wch: 50 },  // G
        { wch: 20 },  // H
        { wch: 30 },  // I
        { wch: 15 },  // J
        { wch: 15 },  // K
        { wch: 15 },  // L
        { wch: 15 },  // M
        { wch: 15 },  // N
        { wch: 15 },  // O
        { wch: 15 },  // P
        { wch: 15 },  // Q
        { wch: 15 },  // R
        { wch: 15 },  // S
        { wch: 30 },  // T
        { wch: 10 }, // U
        { wch: 30 },  // V
        { wch: 15 },  // W
        { wch: 15 },  // X
        { wch: 15 },  // Y
        { wch: 15 },  // Z
    ];
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
function cambiarFechaInicio(fecha,dias){
    const partes = fecha.split("-"); // Dividimos la fecha en partes [año, mes, día]
    const [año, mes, día] = partes; // Desestructuramos las partes
    let fechaFinal =  new Date(`${año}/${mes}/${día}`);
    fechaFinal.setDate(fechaFinal.getDate() + dias);
    const fechaFinalPjud = dateToPjud(fechaFinal);
    return fechaFinalPjud;
}

// Cambia la fecha final de obtencion de datos para el pjud
function cambiarFechaFin(fecha){
    const partes = fecha.split("-"); // Dividimos la fecha en partes [año, mes, día]
    const [año, mes, día] = partes; // Desestructuramos las partes
    let fechaFinal =  new Date(`${año}/${mes}/${día}`);
    fechaFinal.setMonth(fechaFinal.getMonth() + 1);
    const fechaFinalPjud = dateToPjud(fechaFinal);
    return fechaFinalPjud;
}

// Dado un juzgado, obtiene la comuna del juzgado
function getComunaJuzgado(juzgado){
    const juzgadoNormalizado = juzgado.toLowerCase();
    const comunaJuzgado = juzgadoNormalizado.split("de ").at(-1);
    return comunaJuzgado;
}

module.exports = { crearBase,insertarDatos};