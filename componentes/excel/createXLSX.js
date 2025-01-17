//Necesario si o si
const config  =  require("../../config.js");
const XLSX = require('xlsx');

const fs = require('fs');

const path = require('path');

const {getDatosRemate} = require('../economico/datosRemateEmol.js'); 
const {getPJUD,datosFromPjud} = require('../pjud/getPjud.js');
const {getPdfData} = require('../liquidaciones/procesarBoletin.js');
const {PreRemates} = require('../preremates/obtenerPublicaciones.js');


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

async function insertarDatos2(fechaHoy,fechaInicioStr,fechaFinStr,maxRetries,saveFile) {
    let casos = [];
    const fechaFinDate = formatoFechaBoletin(fechaFinStr);
    var filePath = path.join(saveFile, 'Remates.xlsx');
    if(!fs.existsSync(path.join(saveFile, 'Remates.xlsx'))){
        crearBase(saveFile);
        console.log('Archivo creado');
    }
    const wb = XLSX.readFile(path.join(saveFile, 'Remates.xlsx'));
    const ws = wb.Sheets['Remates'];
    cambiarAnchoColumnas(ws);
    let remates = new Set();
    try{
        let i = 6;
        i = await getDatosEconomicos(fechaHoy,fechaInicioStr,fechaFinStr,maxRetries,ws,i,remates,fechaFinDate);
        console.log(`i despues de economicos: ${i}`);
        i = await getDatosBoletin(fechaHoy,fechaInicioStr,fechaFinStr,ws,i,remates,fechaFinDate);
        console.log(`i despues de boletin: ${i}`);
        i--;
        ws['!ref'] = 'B5:V'+i;
        fechaInicioDMA = cambiarFormatoFecha(fechaInicioStr);
        fechaFinDMA = cambiarFormatoFecha(fechaFinStr);
        filePath = path.join(saveFile, 'Remates_'+fechaInicioDMA+'_a_'+fechaFinDMA+'.xlsx');
        XLSX.writeFile(wb, filePath);
        console.log(filePath);
        return filePath;
    }catch(error){
        console.error('Error al obtener resultados:', error);
        return null;
    }
    
}

async function insertarDatos(fechaHoy,fechaInicioStr,fechaFinStr,maxRetries,saveFile) {
    const fechaFinDate = formatoFechaBoletin(fechaFinStr);
    var filePath = path.join(saveFile, 'Remates.xlsx');
    if(!fs.existsSync(path.join(saveFile, 'Remates.xlsx'))){
        crearBase(saveFile);
        console.log('Archivo creado');
    }
    const wb = XLSX.readFile(path.join(saveFile, 'Remates.xlsx'));
    const ws = wb.Sheets['Remates'];
    cambiarAnchoColumnas(ws);
    const casosEconomico = await getCasosEconomico(fechaHoy,fechaInicioStr,fechaFinStr,maxRetries);
    const casosLiquidaciones = await getCasosLiquidaciones(fechaHoy,fechaInicioStr,fechaFinStr);
    // const casosLiquidaciones = [];
    const casosPreremates = await getCasosPreremates();
    // const casosPreremates = [];
    const casos = [...casosEconomico,...casosLiquidaciones,...casosPreremates];
    try{
        let i = insertarCasosExcel(casos,ws,fechaFinDate);
        i--;
        ws['!ref'] = 'B5:V'+i;
        fechaInicioDMA = cambiarFormatoFecha(fechaInicioStr);
        fechaFinDMA = cambiarFormatoFecha(fechaFinStr);
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
    const startDate = formatoFechaBoletin(fechaInicioStr);
    const endDate = formatoFechaBoletin(fechaFinStr);

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

function insertarCasosExcel(casos,ws,fechaFinDate){
    let remates = new Set();
    let i = 6;
    if (!Array.isArray(casos) || casos.length === 0) {
        console.log("No se encontraron datos para insertar.");
        return;
    }
    const casosObj = casos.map(caso => caso.toObject());
    console.log("Cantidad de casos obtenidos en total: ",casosObj.length);
    
    for(let caso of casosObj){
        if(caso.juzgado == 'Juez Partidor'){
            continue;
        }
        if(remates.has(caso.causa)){
            continue;
        }
        remates.add(caso.causa);
        ws['B' + i] = { v: caso.link, t: 's' };
        ws['C' + i] = { v: caso.fechaObtencion, t: 'd' };
        if(caso.fechaPublicacion !== "N/A"){
            caso.fechaPublicacion.setHours( caso.fechaPublicacion.getHours() + 6);
            ws['D' + i] = { v: caso.fechaPublicacion, t: 'd' };
        }        
        if(caso.fechaRemate < fechaFinDate){
            continue;
        }
        ws['E' + i] = { v: caso.fechaRemate, t: 'd' };
        ws['F' + i] = { v: caso.causa, t: 's' };
        const cleanJuzgado = cleanText(caso.juzgado);  
        ws['G' + i] = { v: cleanJuzgado, t: 's' };
        const comunaJuzgado = getComunaJuzgado(cleanJuzgado);
        ws['H' + i] = { v: comunaJuzgado, t: 's' };
        ws['I' + i] = { v: caso.partes, t: 's' };
        ws['J' + i] = { v: caso.tipoPropiedad, t: 's' };
        ws['K' + i] = { v: caso.direccion, t: 's' };
        ws['L' + i] = { v: caso.tipoDerecho, t: 's' };
        ws['M' + i] = { v: caso.comuna, t: 's' };
        ws['N' + i] = { v: caso.foja, t: 's' };
        // ws['O' + i] = { v: caso.numero, t: 's' };
        ws['P' + i] = { v: caso.año, t: 's' };
        ws['Q' + i] = { v: caso.formatoEntrega, t: 's' };
        ws['R' + i] = { v: caso.porcentaje, t: 's' };
        ws['S' + i] = { v: caso.diaEntrega, t: 's' };
        // Formato de monto minimo segun el tipo de moneda
        if(caso.moneda == 'UF'){
            ws['T' + i] = { v:parseFloat(caso.montoMinimo), t: 'n', z: '#,##0.0000' };
        }else{
            ws['T' + i] = { v:parseFloat(caso.montoMinimo), t: 'n', z: '#,##0' };
        }
        ws['U' + i] = { v: caso.moneda, t: 's' };                
        i++;
    }
    return i;
}


async function getDatosPjud(fechaHoy,fechaInicioStr,fechaFinStr,ws,i,remates,fechaFinDate){
    let casoPjud = [];
    i_aux = i;
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
        casoPjud = await datosFromPjud(fechaInicioPjud,fechaFinPjud) || [];
    }catch(error){
        console.error('Error al obtener resultados en el pjud:', error);
        i = i_aux;
        return i;
    }

    const casosObj = casoPjud.map(caso => caso.toObject());
    console.log("Cantidad de casos obtenidos: ",casosObj.length);
    for (let caso of casosObj){
        if(caso.partes.includes('TESORERÍA') | caso.partes.includes('TGR')| caso.partes.includes("TESORERIA")){
            continue;
        }
        if(remates.has(caso.causa)){
            continue;
        }
        if(caso.fechaRemate < fechaFinDate){
            continue;
        }
        remates.add(caso.causa);
        ws['B' + i] = { v:"Letra grande/ Pjud", t: 's' };
        ws['C' + i] = { v:caso.fechaObtencion, t: 'd' };
        ws['E' + i] = { v: caso.fechaRemate, t: 'd' };
        ws['F' + i] = { v: caso.causa, t: 's' };
        caso.juzgado = caso.juzgado.toLowerCase();
        ws['G' + i] = { v: caso.juzgado, t: 's' };
        const comunaJuzgado = getComunaJuzgado(caso.juzgado);
        ws['H' + i] = { v: comunaJuzgado, t: 's' };
        ws['I' + i] = { v: caso.partes, t: 's' };
        i++;
    }
    return i;
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

function cambiarFormatoFecha(fecha) {
    const partes = fecha.split("-"); // Dividimos la fecha en partes [año, mes, día]
    const [año, mes, día] = partes; // Desestructuramos las partes
    return `${día}-${mes}-${año}`;  // Construimos el nuevo formato
}

function formatoFechaPjud(fecha,desfaseHoras = 4) {
    const partes = fecha.split("-"); // Dividimos la fecha en partes [año, mes, día]
    const [año, mes, día] = partes; // Desestructuramos las partes
    return `${día}/${mes}/${año}`;
}
function formatoFechaBoletin(fecha) {
    const partes = fecha.split("-"); // Dividimos la fecha en partes [año, mes, día]
    const [año, mes, día] = partes; // Desestructuramos las partes
    return new Date(`${año}/${mes}/${día}`);
}

function dateToPjud(date) {
    const dia = String(date.getDate()).padStart(2, '0');  // Asegura que el día tenga dos dígitos
    const mes = String(date.getMonth() + 1).padStart(2, '0');  // Meses son 0-indexados, por lo que sumamos 1
    const año = date.getFullYear();
    
    return `${dia}/${mes}/${año}`;
}

function cambiarFechaInicio(fecha,dias){
    const partes = fecha.split("-"); // Dividimos la fecha en partes [año, mes, día]
    const [año, mes, día] = partes; // Desestructuramos las partes
    let fechaFinal =  new Date(`${año}/${mes}/${día}`);
    fechaFinal.setDate(fechaFinal.getDate() + dias);
    // fechaFinal.setDate(fechaFinal.getDate() );
    const fechaFinalPjud = dateToPjud(fechaFinal);
    return fechaFinalPjud;
}

function cambiarFechaFin(fecha){
    const partes = fecha.split("-"); // Dividimos la fecha en partes [año, mes, día]
    const [año, mes, día] = partes; // Desestructuramos las partes
    let fechaFinal =  new Date(`${año}/${mes}/${día}`);
    fechaFinal.setMonth(fechaFinal.getMonth() + 1);
    // fechaFinal.setDate(fechaFinal.getDate() );
    const fechaFinalPjud = dateToPjud(fechaFinal);
    return fechaFinalPjud;
}
function transformarFechaPjud(fechaHora) {
    // Separar la fecha y la hora
   console.log("Fecha a transformar: ",fechaHora); 
    const [fecha, hora] = fechaHora.split(" ");
    
    // Separar día, mes y año
    const [dia,mes, año] = fecha.split("/");
    
    // Formatear la fecha en "dd-mm-yyyy"
    const fechaFormateada = new Date(`${año}/${mes}/${dia}`);
    
    return fechaFormateada;
  }

// Función para limpiar caracteres no deseados del texto
function cleanText(text) {
    return text.replace(/[\r\n\x0B\x0C\u0085\u2028\u2029]/g, '').trim();
}
function getComunaJuzgado(juzgado){
    const juzgadoNormalizado = juzgado.toLowerCase();
    const comunaJuzgado = juzgadoNormalizado.split("de ").at(-1);
    return comunaJuzgado;
}
//crearExcel();
// modificarExcel('personasModificado');

module.exports = { crearBase,insertarDatos};