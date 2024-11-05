//Necesario si o si
const XLSX = require('xlsx');

const fs = require('fs');
//Probablemente no necesites este módulo
//const jsontoxml = require('jsontoxml');
const path = require('path');

const {getPaginas} = require('../Model/ObtenerDatos');

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




//crearExcel();
modificarExcel('personasModificado');