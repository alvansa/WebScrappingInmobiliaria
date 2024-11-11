//Necesario si o si
const XLSX = require('xlsx');
// var xl = require('excel4node');

const fs = require('fs');
//Probablemente no necesites este módulo
//const jsontoxml = require('jsontoxml');
const path = require('path');

const {getDatosRemate} = require('../Controller/datosRemate'); 
// const {getPaginas} = require('../Model/ObtenerDatos');

function crearExcel(){
    //Creamos un libro de excel
    const workbook = XLSX.utils.book_new();

    //Creamos una hoja de excel
    const worksheet = XLSX.utils.json_to_sheet([{nombre: 'Juan', apellido: 'Perez', edad: 25}, {nombre: 'Maria', apellido: 'Gomez', edad: 30}]);

    //Añadimos la hoja al libro
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Personas');

    //Guardamos el libro en un archivo
    XLSX.writeFile(workbook, path.join(__dirname, 'personas.xlsx'));
}

function modificarExcel(nombre){
    const workbook = XLSX.readFile(path.join(__dirname, 'personas.xlsx'));
    const worksheet = workbook.Sheets['Personas'];
    
    const fechaHoy = new Date();

    worksheet['A1'] = {v: fechaHoy, t: 'd'};
    worksheet['B1'] = {v: "Nombre", t: 's'};
    worksheet['C1'] = {v: "Causa", t: 's'};

    worksheet['!cols'] = [{ wch: 15 }];
    XLSX.writeFile(workbook, path.join(__dirname, nombre + '.xlsx'));

}


function crearBase() {
    // Crea una hoja de cálculo vacía
    const ws = {};

    // Define cada celda con el valor y el tipo
    ws['B5'] = { v: 'Link', t: 's' };
    ws['C5'] = { v: 'Fecha Obtencion', t: 's' };
    ws['D5'] = { v: 'Fecha Publicacion', t: 's' };
    ws['E5'] = { v: 'Fecha Remate', t: 's' };
    ws['F5'] = { v: 'Causa', t: 's' };
    ws['G5'] = { v: 'Juzgado', t: 's' };
    ws['H5'] = { v: 'Partes', t: 's' };
    ws['I5'] = { v: 'Que es? 1', t: 's' };
    ws['J5'] = { v: 'Direccion', t: 's' };
    ws['K5'] = { v: 'Que es? 2', t: 's' };
    ws['L5'] = { v: 'Comuna', t: 's' };
    ws['M5'] = { v: 'Foja', t: 's' };
    ws['N5'] = { v: 'Numero', t: 's' };
    ws['O5'] = { v: 'Año', t: 's' };
    ws['P5'] = { v: 'VV o Cupon', t: 's' };
    ws['Q5'] = { v: 'Porcentaje', t: 's' };
    ws['R5'] = { v: 'Dia entrega', t: 's' };
    ws['S5'] = { v: 'Monto Minimo', t: 's' };

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

async function insertarDatos(fechaHoy,maxDiffDate,maxRetries){
    const filePath = path.join(__dirname, 'Remates.xlsx');
    if(!fs.existsSync(path.join(__dirname, 'Remates.xlsx'))){
        crearBase();
    }
    const wb = XLSX.readFile(path.join(__dirname, 'Remates.xlsx'));
    const ws = wb.Sheets['Remates'];
    try{
        const datos = await getDatosRemate(fechaHoy,maxDiffDate,maxRetries);
        const datosObj = datos.map(dato => dato.toObject());
        console.log("Cantidad de casos obtenidos: ",datosObj.length);
        let i = 6;
        for(let dato of datosObj){
            console.log("caso:",i-5,"causa:",dato.causa);
            console.log("caso:",i-5,"direccion:",dato.direccion);
            ws['B' + i] = { v: dato.link, t: 's' };
            ws['C' + i] = { v: dato.fechaObtencion, t: 'd' };
            ws['D' + i] = { v: dato.fechaPublicacion, t: 'd' };
            ws['E' + i] = { v: dato.fechaRemate, t: 's' };
            ws['F' + i] = { v: dato.causa, t: 's' };
            ws['G' + i] = { v: dato.juzgado, t: 's' };
            // ws['H' + i] = { v: dato.partes, t: 's' };
            // ws['I' + i] = { v: dato.queEs1, t: 's' };
            // ws['J' + i] = { v: dato.direccion, t: 's' };
            // ws['K' + i] = { v: dato.queEs2, t: 's' };
            ws['L' + i] = { v: dato.comuna, t: 's' };
            ws['M' + i] = { v: dato.foja, t: 's' };
            // ws['N' + i] = { v: dato.numero, t: 's' };
            // ws['O' + i] = { v: dato.ano, t: 's' };
            ws['P' + i] = { v: dato.formatoEntrega, t: 's' };
            ws['Q' + i] = { v: dato.porcentaje, t: 's' };
            ws['R' + i] = { v: dato.diaEntrega, t: 's' };
            ws['S' + i] = { v: dato.montoMinimo, t: 's' };
            i++;
        }
        ws['!ref'] = 'B5:S'+i;
        XLSX.writeFile(wb, filePath);
        return true;
    }catch(error){
        console.error('Error al obtener resultados:', error);
        return false;
    }
    
}



function cambiarAnchoColumnas(ws){
    ws['!cols'] = [
        { wch: 15 },  // A
        { wch: 15 },  // B
        { wch: 20 },  // C
        { wch: 20 },  // D
        { wch: 15 },  // E
        { wch: 15 },  // F
        { wch: 15 },  // G
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
        { wch: 15 },  // S
        { wch: 15 },  // T
        { wch: 15 },  // V
        { wch: 15 },  // W
        { wch: 15 },  // X
        { wch: 15 },  // Y
        { wch: 15 },  // Z
    ];
}


//crearExcel();
// modificarExcel('personasModificado');

module.exports = {crearExcel, modificarExcel, crearBase,insertarDatos};