//Necesario si o si
const XLSX = require('xlsx');

const fs = require('fs');

const path = require('path');

const {getDatosRemate} = require('../Controller/datosRemate'); 
const {getPJUD} = require('../Model/getPjud');
const {getPdfData} = require('./procesarBoletin');


function crearBase() {
    // Crea una hoja de cálculo vacía
    const ws = {};

    // Define cada celda con el valor y el tipo
    ws['B5'] = { v: 'Link', t: 's' };
    ws['C5'] = { v: 'Fecha Obtención', t: 's' };
    ws['D5'] = { v: 'Fecha Publicación', t: 's' };
    ws['E5'] = { v: 'Fecha Remate', t: 's' };
    ws['F5'] = { v: 'Causa', t: 's' };
    ws['G5'] = { v: 'Juzgado', t: 's' };
    ws['H5'] = { v: 'Partes', t: 's' };
    ws['I5'] = { v: 'Que es? 1', t: 's' };
    ws['J5'] = { v: 'Dirección', t: 's' };
    ws['K5'] = { v: 'Que es? 2', t: 's' };
    ws['L5'] = { v: 'Comuna', t: 's' };
    ws['M5'] = { v: 'Foja', t: 's' };
    ws['N5'] = { v: 'Numero', t: 's' };
    ws['O5'] = { v: 'Año', t: 's' };
    ws['P5'] = { v: 'VV o Cupón', t: 's' };
    ws['Q5'] = { v: 'Porcentaje', t: 's' };
    ws['R5'] = { v: 'Día entrega', t: 's' };
    ws['S5'] = { v: 'Monto Mínimo', t: 's' };

    // Ajusta el ancho de las columnas
    cambiarAnchoColumnas(ws);

    // Define el rango de la hoja para asegurar que incluya todas las celdas especificadas
    ws['!ref'] = 'B5:S5';

    // Crea un nuevo libro y agrega la hoja
    const wb = XLSX.utils.book_new();
    wb.Props = {
        Title: 'Remates',
        Subject: 'Remates'
    };

    // Agrega la hoja al libro de trabajo
    XLSX.utils.book_append_sheet(wb, ws, 'Remates');
    
    // Guarda el archivo
    XLSX.writeFile(wb, path.join(__dirname, 'Remates.xlsx'));
}

async function insertarDatos(fechaHoy,fechaInicioStr,fechaFinStr,maxRetries,saveFile) {
    var filePath = path.join(__dirname, 'Remates.xlsx');
    if(!fs.existsSync(path.join(__dirname, 'Remates.xlsx'))){
        crearBase();
        console.log('Archivo creado');
    }
    const wb = XLSX.readFile(path.join(__dirname, 'Remates.xlsx'));
    const ws = wb.Sheets['Remates'];
    cambiarAnchoColumnas(ws);
    try{
        let i = 6;
        i = await getDatosEconomicos(fechaHoy,fechaInicioStr,fechaFinStr,maxRetries,ws,i);
        i = await getDatosPjud(fechaHoy,fechaInicioStr,fechaFinStr,ws,i);
        console.log("Fechas a enviar a el boletin ",fechaInicioStr,fechaFinStr);    
        // i = await getDatosBoletin(fechaHoy,fechaInicioStr,fechaFinStr,ws,i);
        i--;
        ws['!ref'] = 'B5:S'+i;
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
        const datos = await getDatosRemate(fechaHoy,fechaInicioStr,fechaFinStr,maxRetries) || [];
        if (!Array.isArray(datos) || datos.length === 0) {
            console.log("No se encontraron datos para insertar.");
            return;
        }
        const datosObj = datos.map(dato => dato.toObject());
        console.log("Cantidad de casos obtenidos: ",datosObj.length);
        
        for(let dato of datosObj){
            ws['B' + i] = { v: dato.link, t: 's' };
            ws['C' + i] = { v: dato.fechaObtencion, t: 'd' };
            dato.fechaPublicacion.setHours( dato.fechaPublicacion.getHours() + 6);
            console.log("caso:",i-5,"fecha Obtencion:",dato.fechaPublicacion);
            ws['D' + i] = { v: dato.fechaPublicacion, t: 'd' };
            ws['E' + i] = { v: dato.fechaRemate, t: 's' };
            ws['F' + i] = { v: dato.causa, t: 's' };
            ws['G' + i] = { v: dato.juzgado, t: 's' };
            ws['H' + i] = { v: dato.partes, t: 's' };
            ws['I' + i] = { v: dato.tipoPropiedad, t: 's' };
            // ws['J' + i] = { v: dato.direccion, t: 's' };
            ws['K' + i] = { v: dato.tipoDerecho, t: 's' };
            ws['L' + i] = { v: dato.comuna, t: 's' };
            ws['M' + i] = { v: dato.foja, t: 's' };
            // ws['N' + i] = { v: dato.numero, t: 's' };
            ws['O' + i] = { v: dato.año, t: 's' };
            ws['P' + i] = { v: dato.formatoEntrega, t: 's' };
            ws['Q' + i] = { v: dato.porcentaje, t: 's' };
            ws['R' + i] = { v: dato.diaEntrega, t: 's' };
            ws['S' + i] = { v: dato.montoMinimo, t: 's' };
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
        const datoPjud = await getPJUD(fechaInicioPjud,fechaFinPjud) || [];
        for (let dato of datoPjud){
            if(dato.tribunal != ''){
                ws['B' + i] = { v:"Letra grande/ Pjud", t: 's' };
                let fecha = transformarFechaPjud(dato.fechaHora);
                fecha.setHours( fecha.getHours() + 6);
                ws['C' + i] = { v: fechaHoy, t: 'd' };
                ws['D' + i] = { v: fecha, t: 'd' };
                ws['F' + i] = { v: dato.causa, t: 's' };
                ws['G' + i] = { v: dato.tribunal, t: 's' };
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
            ws['B' + i] = { v: "Boletin concursal", t: 's' };
            ws['C' + i] = { v: caso.fechaObtencion, t: 'd' };
            // dato.fechaPublicacion.setHours( dato.fechaPublicacion.getHours() + 6);
            // console.log("caso:",i-5,"fecha Obtencion:",dato.fechaPublicacion);
            // ws['D' + i] = { v: caso.fechaPublicacion, t: 'd' };
            // ws['E' + i] = { v: caso.fechaRemate, t: 's' };
            ws['F' + i] = { v: caso.causa, t: 's' };
            ws['G' + i] = { v: caso.juzgado, t: 's' };
            // ws['H' + i] = { v: caso.partes, t: 's' };
            // ws['I' + i] = { v: caso.tipoPropiedad, t: 's' };
            // ws['J' + i] = { v: caso.direccion, t: 's' };
            // ws['K' + i] = { v: caso.tipoDerecho, t: 's' };
            // ws['L' + i] = { v: caso.comuna, t: 's' };
            // ws['M' + i] = { v: caso.foja, t: 's' };
            // ws['N' + i] = { v: caso.numero, t: 's' };
            // ws['O' + i] = { v: caso.anno, t: 's' };
            // ws['P' + i] = { v: caso.formatoEntrega, t: 's' };
            // ws['Q' + i] = { v: caso.porcentaje, t: 's' };
            // ws['R' + i] = { v: caso.diaEntrega, t: 's' };
            // ws['S' + i] = { v: caso.montoMinimo, t: 's' };
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
        { wch: 15 },  // H
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
        { wch: 30 },  // S
        { wch: 15 },  // T
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
//crearExcel();
// modificarExcel('personasModificado');

module.exports = { crearBase,insertarDatos};