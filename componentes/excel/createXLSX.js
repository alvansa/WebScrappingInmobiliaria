//Necesario si o si
const config  =  require("../../config.js");
const XLSX = require('xlsx');

const fs = require('fs');

const path = require('path');

const Causas = require('../../model/Causas.js');
const {getDatosRemate} = require('../economico/datosRemateEmol.js'); 
const {getPJUD,datosFromPjud} = require('../pjud/getPjud.js');
const {getPdfData} = require('../liquidaciones/procesarBoletin.js');
const {PreRemates} = require('../preremates/obtenerPublicaciones.js');
const PublicosYLegales = require('../publicosYlegales/publicosYLegales.js');
const DataPublicosYLegales = require("../publicosYlegales/DataPublicosYLegales.js");
const MapasSII = require('../mapasSII/MapasSII.js');

function crearBase(saveFile) {
    // Crea una hoja de cálculo vacía
    const ws = {};

    // Define cada celda con el valor y el tipo
    // ws['B5'] = { v: 'Link', t: 's' };
    // ws['C5'] = { v: 'Fecha Obtención', t: 's' };
    // ws['D5'] = { v: 'Fecha Publicación', t: 's' };
    // ws['E5'] = { v: 'Fecha Remate', t: 's' };
    // ws['F5'] = { v: 'Causa', t: 's' };
    // ws['G5'] = { v: 'Juzgado', t: 's' };
    // ws['H5'] = { v: 'Comuna del juzgado', t: 's' };
    // ws['I5'] = { v: 'Partes', t: 's' };
    // ws['J5'] = { v: 'Tipo propiedad', t: 's' };
    // ws['K5'] = { v: 'Dirección', t: 's' };
    // ws['L5'] = { v: 'Tipo derecho', t: 's' };
    // ws['M5'] = { v: 'Comuna', t: 's' };
    // ws['N5'] = { v: 'Foja', t: 's' };
    // ws['O5'] = { v: 'Numero', t: 's' };
    // ws['P5'] = { v: 'Año', t: 's' };
    // ws['Q5'] = { v: 'VV o Cupón', t: 's' };
    // ws['R5'] = { v: 'Porcentaje', t: 's' };
    // ws['S5'] = { v: 'Día entrega', t: 's' };
    // ws['T5'] = { v: 'Monto Mínimo', t: 's' };
    // ws['U5'] = { v: 'Moneda', t: 's' };
    // ws['V5'] = { v: 'Martillero', t: 's' };

    ws['A5'] = {v: 'vacia ', t: 's'};
    ws['B5'] = {v: 'status ', t: 's'};
    ws['C5'] = {v: 'F.Desc ', t: 's'};
    ws['D5'] = {v: 'origen ', t: 's'};
    ws['E5'] = {v: 'notas ', t: 's'};
    ws['F5'] = {v: 'F. remate ', t: 's'};
    ws['G5'] = {v: 'macal ', t: 's'};
    ws['H5'] = {v: 'direccion ', t: 's'};
    ws['I5'] = {v: 'causa ', t: 's'};
    ws['J5'] = {v: 'tribunal ', t: 's'};
    ws['K5'] = {v: 'comuna tribunal ', t: 's'};
    ws['L5'] = {v: 'comuna propiedad ', t: 's'};
    ws['M5'] = {v: 'año inscripcion ', t: 's'};
    ws['N5'] = {v: 'partes ', t: 's'};
    ws['O5'] = {v: 'dato ', t: 's'};
    ws['P5'] = {v: 'vale vista o cupon ', t: 's'};
    ws['Q5'] = {v: '% ', t: 's'};
    ws['R5'] = {v: 'plazo vv ', t: 's'};
    ws['S5'] = {v: 'tipo derecho ', t: 's'};
    ws['T5'] = {v: 'deuda 1 ', t: 's'};
    ws['U5'] = {v: 'deuda 2 ', t: 's'};
    ws['V5'] = {v: 'deuda 3 ', t: 's'};
    ws['W5'] = {v: 'rol ', t: 's'};
    ws['X5'] = {v: 'notif ', t: 's'};
    ws['Y5'] = {v: 'preciominimo ', t: 's'};
    ws['Z5'] = {v: 'UF o $ ', t: 's'};
    ws['AC5'] = {v: 'avaluo fiscal ', t: 's'};
    ws['AE5'] = {v: 'estado civil ', t: 's'};
    ws['AF5'] = {v: 'Px $ compra ant ', t: 's'};
    ws['AG5'] = {v: 'año compr ant ', t: 's'};
    ws['AH5'] = {v: 'precio venta nos ', t: 's'};


    // Ajusta el ancho de las columnas
    cambiarAnchoColumnas(ws);

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
    XLSX.writeFile(wb, path.join(saveFile, 'Remates.xlsx'));
}


async function insertarDatos(fechaHoy,fechaInicioStr,fechaFinStr,maxRetries,saveFile,checkedBoxes) {
    const fechaLimite = stringToDate(fechaFinStr);
    const fechaInicio = stringToDate(fechaInicioStr);
    var filePath = path.join(saveFile, 'Remates.xlsx');
    // Revisa si el archivo base ya existe
    if(!fs.existsSync(path.join(saveFile, 'Remates.xlsx'))){
        crearBase(saveFile);
        console.log('Archivo creado');
    }
    // Lee el archivo base para poder insertar los datos
    const wb = XLSX.readFile(path.join(saveFile, 'Remates.xlsx'));
    const ws = wb.Sheets['Remates'];
    cambiarAnchoColumnas(ws);
    // Obtiene los datos de los remates de las distintas fuentes.
    const [casosEconomico,casosLiquidaciones,casosPreremates,casosPjud,casosPYL] = await Promise.all([
        getCasosEconomico(fechaHoy,fechaInicioStr,fechaFinStr,maxRetries,checkedBoxes.economico),
        // Promise.resolve([]),
        getCasosLiquidaciones(fechaHoy,fechaInicioStr,fechaFinStr,checkedBoxes.liquidaciones),
        // Promise.resolve([]),
        getCasosPreremates(checkedBoxes.preremates),
        // Promise.resolve([]),
        getDatosPjud(fechaInicioStr,fechaFinStr,checkedBoxes.pjud),
        // Promise.resolve([]),
        getCasosPublicosYLegales(fechaInicioStr,fechaFinStr,checkedBoxes.PYL)
    ]);
    const casos = [...casosEconomico,...casosLiquidaciones,...casosPreremates,...casosPYL,...casosPjud];
    if(casos.length === 0){
        console.log('No se encontraron datos para insertar.');
        return null;
    }
    await obtainValueInformation(casos);
    try{
        let lastRow = await insertarCasosExcel(casos,ws,fechaLimite,fechaInicio) - 1;
        ws['!ref'] = 'A5:AH'+lastRow;
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


async function getCasosEconomico(fechaHoy,fechaInicioStr,fechaFinStr,maxRetries,economicoChecked){
    if(!economicoChecked){
        return [];
    }
    let casos = [];
    try{
        casos = await getDatosRemate(fechaHoy,fechaInicioStr,fechaFinStr,maxRetries) || [];
    }catch(error){
        console.error('Error al obtener resultados en emol:', error);
    }
    return casos
}

async function getCasosLiquidaciones(fechaHoy,fechaInicioStr,fechaFinStr,liquidacionesChecked){
    if(!liquidacionesChecked){
        return [];
    }
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

async function getCasosPreremates(prerematesChecked){
    if(!prerematesChecked){
        return [];
    }
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
async function getDatosPjud(fechaInicioStr,fechaFinStr,pjudChecked){
    if(!pjudChecked){
        return [];
    }
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

async function getCasosPublicosYLegales(fechaInicioStr,fechaFinStr,PYLChecked){
    if(!PYLChecked){
        return [];
    }

    let casos = [];
    const startDate = stringToDate(fechaInicioStr);
    const endDate = stringToDate(fechaFinStr);
    const queryDate = new Date();
    console.log("Fechas: ",startDate,endDate,queryDate);
    try{
        const publicosYLegales = new PublicosYLegales(startDate,endDate,queryDate);
        casos = await publicosYLegales.scrapePage();
        for(let caso of casos){
            const data = new DataPublicosYLegales(caso);
            data.proccessAuction();
        }
    }catch(error){
        console.error('Error al obtener resultados en publicos y legales:', error);
    }
    return casos;
}

async function insertarCasosExcel(casos,ws,fechaLimite,fechaInicio){
    let remates = new Set();
    let currentRow = 6;
    const causa = new Causas();
    const rematesDB = causa.getCausas(formatDateToSQLite(fechaInicio));
    if (!Array.isArray(casos) || casos.length === 0) {
        console.log("No se encontraron datos para insertar.");
        return;
    }
    const casosObj = casos.map(caso => caso.toObject());
    
    for(let caso of casosObj){
        if(caso.fechaPublicacion === "N/A" || caso.fechaPublicacion == null){
            caso.fechaPublicacion = fechaMenosUno(fechaLimite);
        }
        // if(shouldSkip(caso,remates,fechaLimite,rematesDB,fechaInicio)){
        //     continue;
        // }
        remates.add({causa: caso.causa, juzgado: caso.juzgado,fecha: formatDateToSQLite(caso.fechaPublicacion)});
        insertarCasoIntoWorksheet(caso,ws,currentRow);
        currentRow++;
    }
    console.log("Casos insertados: ",remates);
    causa.insertCaso(remates);
    return currentRow;
}

function shouldSkip(caso,remates,fechaLimite,rematesDB,fechaInicio){
    for(let remate of remates){
        if(remate.causa === caso.causa && remate.juzgado === caso.juzgado){
            return true;
        }
    }
    if(caso.fechaRemate < fechaLimite){
        return true;
    }
    if(caso.juzgado === "Juez Partidor"){
        return true;
    }
    for(let remate of rematesDB){
        if(remate.causa === caso.causa && remate.juzgado === caso.juzgado && remate.fecha < formatDateToSQLite(fechaInicio)){
            return true;
        }
    }
    return false;
}


function insertarCasoIntoWorksheet(caso,ws,currentRow){
    // if(caso.fechaPublicacion !== "N/A"){
    //     const adjustedDate = new Date(caso.fechaPublicacion);
    //     adjustedDate.setHours(adjustedDate.getHours() + 6);
    //     ws['D' + currentRow] = { v: adjustedDate, t: 'd' };
    // }
    // ws['J' + currentRow] = { v: caso.tipoPropiedad, t: 's' };

    // ws['A'+ currentRow ] = {v: 'vacia ', t: 's'};
    // ws['B'+ currentRow ] = {v: 'status ', t: 's'};
    ws['C'+ currentRow ] = {v: caso.fechaObtencion, t: 'd'};
    ws['D'+ currentRow ] = {v: caso.link , t: 's'};
    // ws['E'+ currentRow ] = {v: 'notas ', t: 's'};
    if(caso.fechaRemate !== "N/A"){
        const adjustedAuctionDate = new Date(caso.fechaRemate);
        adjustedAuctionDate.setHours(adjustedAuctionDate.getHours() + 6);
        ws['F' + currentRow] = { v: adjustedAuctionDate , t: 'd' };
    }
    ws['G'+ currentRow ] = {v: caso.martillero, t: 's'};
    ws['H'+ currentRow ] = {v: caso.direccion, t: 's'};
    ws['I'+ currentRow ] = {v: caso.causa , t: 's'};
    ws['J'+ currentRow ] = {v: caso.juzgado, t: 's'};
    ws['K'+ currentRow ] = {v: getComunaJuzgado(caso.juzgado), t: 's'};
    ws['L'+ currentRow ] = {v: caso.comuna , t: 's'};
    if(caso.anno == 'No especifica'){
        ws['M' + currentRow] = { v: caso.anno, t: 's' };
    }else{
        ws['M' + currentRow] = { v: caso.anno, t: 'n' };
    }
    ws['N'+ currentRow ] = {v: caso.partes , t: 's'};
    // ws['O'+ currentRow ] = {v: 'dato ', t: 's'};
    ws['P'+ currentRow ] = {v: caso.formatoEntrega, t: 's'};
    ws['Q'+ currentRow ] = {v: caso.porcentaje, t: 's'};
    ws['R'+ currentRow ] = {v: caso.diaEntrega, t: 's'};
    ws['S'+ currentRow ] = {v: caso.tipoDerecho, t: 's'};
    // ws['T'+ currentRow ] = {v: caso.rolPropiedad, t: 's'};
    // ws['U'+ currentRow ] = {v: 'deuda 2 ', t: 's'};
    // ws['V'+ currentRow ] = {v: 'deuda 3 ', t: 's'};
    // ws['W'+ currentRow ] = {v: 'rol ', t: 's'};
    // ws['X'+ currentRow ] = {v: 'notif ', t: 's'};
    // Formato de monto minimo segun el tipo de moneda
    if(caso.moneda === 'No aplica'){
        ws['Y' + currentRow] = { v: caso.montoMinimo, t: 's' };
        ws["Z" + currentRow] = { v: caso.moneda, t: 's' };
    }
    else if(caso.moneda == 'UF'){
        ws['Y' + currentRow] = { v:parseFloat(caso.montoMinimo), t: 'n', z: '#,##0.0000' };
    }else{
        ws['Y' + currentRow] = { v:parseFloat(caso.montoMinimo), t: 'n', z: '#,##0' };
    }
    ws['Z' + currentRow] = { v: caso.moneda, t: 's' };                
    ws['AC'+ currentRow ] = {v: caso.avaluoPropiedad, t: 'n', z: '#,##0'};
    // ws['AE' + currentRow ] = {v: 'estado civil ', t: 's'};
    // ws['AF' + currentRow ] = {v: 'Px $ compra ant ', t: 's'};
    // ws['AG' + currentRow ] = {v: 'año compr ant ', t: 's'};
    // ws['AH' + currentRow ] = {v: 'precio venta nos ', t: 's'};
}

function insertarCasoDB(caso){

}

function cambiarAnchoColumnas(ws){
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

async function obtainValueInformation(casos){
    let mapasSII = null;
    try{
        mapasSII = new MapasSII();
        await mapasSII.Initialize();
        for (let caso of casos) {
            if (caso.rolPropiedad !== null && caso.comuna !== null) {
                console.log(caso.causa,caso.rolPropiedad,caso.comuna,caso.link);
                await mapasSII.obtainDataOfCause(caso);
                await new Promise(resolve => setTimeout(resolve,1000));
            }
        }
    }catch(error){
        console.error('Error al obtener resultados:', error);
        console.log("valor del mapasSII cuando es error",mapasSII);
        return null;
    }finally{
        if(mapasSII){
            await mapasSII.closeBrowser();
        }
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
    if(juzgado == null){
        return "no especifica";
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

function fechaMenosUno(fecha){
    const nuevaFecha = new Date(fecha);
    nuevaFecha.setDate(nuevaFecha.getDate() - 1);
    return nuevaFecha;
}



module.exports = { crearBase,insertarDatos};