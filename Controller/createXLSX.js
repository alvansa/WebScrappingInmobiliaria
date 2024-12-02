//Necesario si o si
const XLSX = require('xlsx');

const fs = require('fs');

const path = require('path');

const {getDatosRemate} = require('../Controller/datosRemate'); 
const {getPJUD} = require('../Model/getPjud');
const {getPdfData} = require('./procesarBoletin');


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
    ws['J5'] = { v: 'Que es? 1', t: 's' };
    ws['K5'] = { v: 'Dirección', t: 's' };
    ws['L5'] = { v: 'Que es? 2', t: 's' };
    ws['M5'] = { v: 'Comuna', t: 's' };
    ws['N5'] = { v: 'Foja', t: 's' };
    ws['O5'] = { v: 'Numero', t: 's' };
    ws['P5'] = { v: 'Año', t: 's' };
    ws['Q5'] = { v: 'VV o Cupón', t: 's' };
    ws['R5'] = { v: 'Porcentaje', t: 's' };
    ws['S5'] = { v: 'Día entrega', t: 's' };
    ws['T5'] = { v: 'Monto Mínimo', t: 's' };
    ws['U5'] = { v: 'Martillero', t: 's' };

    // Ajusta el ancho de las columnas
    cambiarAnchoColumnas(ws);

    // Define el rango de la hoja para asegurar que incluya todas las celdas especificadas
    ws['!ref'] = 'B5:U5';

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
    var filePath = path.join(saveFile, 'Remates.xlsx');
    if(!fs.existsSync(path.join(saveFile, 'Remates.xlsx'))){
        crearBase(saveFile);
        console.log('Archivo creado');
    }
    const wb = XLSX.readFile(path.join(saveFile, 'Remates.xlsx'));
    const ws = wb.Sheets['Remates'];
    cambiarAnchoColumnas(ws);
    try{
        let i = 6;
        i = await getDatosEconomicos(fechaHoy,fechaInicioStr,fechaFinStr,maxRetries,ws,i);
        console.log(`i despues de economicos: ${i}`);
        // i = await getDatosPjud(fechaHoy,fechaInicioStr,fechaFinStr,ws,i);
        // console.log(`i despues de pjud: ${i}`);
        // console.log("Fechas a enviar a el boletin ",fechaInicioStr,fechaFinStr);    
        // i = await getDatosBoletin(fechaHoy,fechaInicioStr,fechaFinStr,ws,i);
        console.log(`i despues de boletin: ${i}`);
        i--;
        ws['!ref'] = 'B5:U'+i;
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

async function getDatosEconomicos(fechaHoy,fechaInicioStr,fechaFinStr,maxRetries,ws,i){
    i_aux = i;
    try{
        const casos = await getDatosRemate(fechaHoy,fechaInicioStr,fechaFinStr,maxRetries) || [];
        if (!Array.isArray(casos) || casos.length === 0) {
            console.log("No se encontraron datos para insertar.");
            return;
        }
        const casosObj = casos.map(caso => caso.toObject());
        console.log("Cantidad de casos obtenidos: ",casosObj.length);
        
        for(let caso of casosObj){
            ws['B' + i] = { v: caso.link, t: 's' };
            ws['C' + i] = { v: caso.fechaObtencion, t: 'd' };
            caso.fechaPublicacion.setHours( caso.fechaPublicacion.getHours() + 6);
            console.log("caso:",i-5,"fecha Obtencion:",caso.fechaPublicacion);
            ws['D' + i] = { v: caso.fechaPublicacion, t: 'd' };
            ws['E' + i] = { v: caso.fechaRemate, t: 's' };
            ws['F' + i] = { v: caso.causa, t: 's' };
            ws['G' + i] = { v: caso.juzgado, t: 's' };
            const comunaJuzgado = getComunaJuzgado(caso.juzgado);
            ws['H' + i] = { v: comunaJuzgado, t: 's' };
            ws['I' + i] = { v: caso.partes, t: 's' };
            ws['J' + i] = { v: caso.tipoPropiedad, t: 's' };
            // ws['K' + i] = { v: caso.direccion, t: 's' };
            ws['L' + i] = { v: caso.tipoDerecho, t: 's' };
            ws['M' + i] = { v: caso.comuna, t: 's' };
            ws['N' + i] = { v: caso.foja, t: 's' };
            // ws['O' + i] = { v: caso.numero, t: 's' };
            ws['P' + i] = { v: caso.año, t: 's' };
            ws['Q' + i] = { v: caso.formatoEntrega, t: 's' };
            ws['R' + i] = { v: caso.porcentaje, t: 's' };
            ws['S' + i] = { v: caso.diaEntrega, t: 's' };
            ws['T' + i] = { v: caso.montoMinimo, t: 's' };
            i++;
        }
    }catch(error){
        console.error('Error al obtener resultados en el economico:', error);
        i = i_aux;
    }
    return i;
}

async function getDatosPjud(fechaHoy,fechaInicioStr,fechaFinStr,ws,i){
    i_aux = i;
    try{
        fechaInicioPjud = formatoFechaPjud(fechaInicioStr);
        fechaFinPjud = formatoFechaPjud(fechaFinStr);
        console.log("Fechas: ",fechaInicioPjud,fechaFinPjud);
        const casoPjud = await getPJUD(fechaInicioPjud,fechaFinPjud) || [];
        for (let caso of casoPjud){
            if(caso.tribunal != ''){
                ws['B' + i] = { v:"Letra grande/ Pjud", t: 's' };
                let fecha = transformarFechaPjud(caso.fechaHora);
                fecha.setHours( fecha.getHours() + 6);
                ws['C' + i] = { v: fechaHoy, t: 'd' };
                ws['D' + i] = { v: fecha, t: 'd' };
                ws['F' + i] = { v: caso.causa, t: 's' };
                caso.tribunal = caso.tribunal.toLowerCase();
                ws['G' + i] = { v: caso.tribunal, t: 's' };
                const comunaJuzgado = getComunaJuzgado(caso.tribunal);
                ws['H' + i] = { v: comunaJuzgado, t: 's' };
                i++;
            }
            
        }
    }catch(error){
        console.error('Error al obtener resultados en el pjud:', error);
        i = i_aux;
    }
    
    return i;
} 


async function getDatosBoletin(fechaHoy,fechaInicioStr,fechaFinStr,ws,i){
    i_aux = i;
    try{
        const startDate = formatoFechaBoletin(fechaInicioStr);
        const endDate = formatoFechaBoletin(fechaFinStr);
        const casos = await getPdfData(startDate,endDate,fechaHoy) || [];
        const casosObj = casos.map(caso => caso.toObject());
        for (let caso of casosObj){
            ws['B' + i] = { v: caso.link, t: 's' };
            ws['C' + i] = { v: caso.fechaObtencion, t: 'd' };
            caso.fechaPublicacion.setHours( caso.fechaPublicacion.getHours() + 6);
            // console.log("caso:",i-5,"fecha Obtencion:",dato.fechaPublicacion);
            ws['D' + i] = { v: caso.fechaPublicacion, t: 'd' };
            ws['E' + i] = { v: caso.fechaRemate, t: 's' };
            ws['F' + i] = { v: caso.causa, t: 's' };
            const juzgado = cleanText(caso.juzgado);
            ws['G' + i] = { v: juzgado, t: 's' };
            const comunaJuzgado = getComunaJuzgado(juzgado);
            ws['H' + i] = { v: comunaJuzgado, t: 's' };
            ws['I' + i] = { v: caso.partes, t: 's' };
            ws['J' + i] = { v: caso.tipoPropiedad, t: 's' };
            ws['K' + i] = { v: caso.direccion, t: 's' };
            ws['L' + i] = { v: caso.tipoDerecho, t: 's' };
            ws['M' + i] = { v: caso.comuna, t: 's' };
            ws['N' + i] = { v: caso.foja, t: 's' };
            ws['O' + i] = { v: caso.numero, t: 's' };
            ws['P' + i] = { v: caso.año, t: 's' };
            ws['Q' + i] = { v: caso.formatoEntrega, t: 's' };
            ws['R' + i] = { v: caso.porcentaje, t: 's' };
            ws['S' + i] = { v: caso.diaEntrega, t: 's' };
            ws['T' + i] = { v: caso.montoMinimo, t: 's' };
            ws['U' + i] = { v: caso.martillero, t: 's' };
            i++;
        }
    }catch(error){
        console.error('Error al obtener resultados en el boletin:', error);
        i = i_aux;
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
        { wch: 15 },  // I
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
        { wch: 40 }, // U
        { wch: 15 },  // V
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

function transformarFechaPjud(fechaHora) {
    // Separar la fecha y la hora
    const [fecha, hora] = fechaHora.split(" ");
    
    // Separar día, mes y año
    const [mes, dia, año] = fecha.split("/");
    
    // Formatear la fecha en "dd-mm-yyyy"
    const fechaFormateada = new Date(`${dia}-${mes}-${año}`);
    
    return fechaFormateada;
  }

// Función para limpiar caracteres no deseados del texto
function cleanText(text) {
    return text.replace(/[\r\n\x0B\x0C\u0085\u2028\u2029]/g, '').trim();
}
function getComunaJuzgado(juzgado){
    const comunaJuzgado = juzgado.split("de ").at(-1);
    return comunaJuzgado;
}
//crearExcel();
// modificarExcel('personasModificado');

module.exports = { crearBase,insertarDatos};