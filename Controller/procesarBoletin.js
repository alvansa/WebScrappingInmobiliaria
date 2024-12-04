const Caso  = require('../Model/caso.js');
const {getDatosBoletin} = require('../Model/getBoletinConcursal.js');
const fs = require('fs');
const { comunas, tribunales } = require('../Model/datosLocales.js');
const path = require('path');
const { ipcRenderer } = require( 'electron' );
const { get } = require('request');




function obtainDataRematesPdf(data,caso) {
    if (!caso) {
        console.error("No se ha recibido caso");
        return;
    }
    const fechaRemate = getfechaRemate(data);
    const causa = getCausa(data);
    const tribunal = getTribunal(data);
    const comuna = getComuna(data);
    const monto = montoMinimo(data);
    const anno = getAnno(data);
    const direccion = getDireccion(data);
    const tipoPropiedad = getTipoPropiedad(data);
    const tipoDerecho = getTipoDerecho(data);

    if(fechaRemate){
        // console.log(fechaRemate);
        caso.darFechaRemate(new Date(fechaRemate));
    }
    if(causa){
        caso.darCausa(causa[0]);
    }
    if(tribunal){
        const juzgado = tribunal[0].split(":")[1];
        caso.darJuzgado(juzgado);
    }
    if(comuna){
        // const comunaStr = comuna[0].split(":")[1];
        caso.darComuna(comuna);
    }
    if(monto){
        const montoMinimo = monto[0].match(/\d+/g);
        caso.darMontoMinimo(montoMinimo);
    }
    if(anno){
        const annoNumero = anno[0].match(/\d+/g);
        caso.darAnno(annoNumero);
    }
    if(direccion){
        caso.darDireccion(direccion);
    }
    if(tipoPropiedad){
        caso.darTipoPropiedad(tipoPropiedad[0]);
    }
    if(tipoDerecho){
        caso.darTipoDerecho(tipoDerecho[0]);
    }

}


async function getPdfData(fechaInicio,fechaFin,fechaHoy) {
    let casos = [];
    
    // Configuracion del worker de pdfjs, necesario hacerlo manualmente para que funcione en node
    // pdfjsLib.GlobalWorkerOptions.workerSrc = './node_modules/pdfjs-dist/build/pdf.worker.mjs'
    // PDFJS.workerSrc = '/static/js/pdf.worker.js';
    try{
        await getDatosBoletin(fechaInicio,fechaFin,casos,fechaHoy);
        // console.log("Casos obtenidos: ",casos);
        const pdfs = fs.readdirSync(path.join(__dirname, '../Model/downloads'));
        for (let pdf of pdfs) {
            const pdfFile = path.join(__dirname, '../Model/downloads/', pdf);
            if(fs.existsSync(pdfFile)){
                const pdfData = await new Promise((resolve, reject) => {
                    ipcRenderer.once('prefix-pdf-converted', (event, data) => resolve(data));
                    ipcRenderer.once('prefix-pdf-converted-error', (event, error) => reject(error));
                    ipcRenderer.send('prefix-convert-pdf', pdfFile);
                });
                texto = pdfData ? pdfData : "";
                // console.log(texto.length);
                const caso = getCaso(pdf,casos);
                obtainDataRematesPdf(texto,caso);
                
            }

        }
    }catch (error) {
        console.error("Error en getPdfData:", error);
        // console.log(1);
    }finally{
        deleteFiles();
        return casos;
    }
}


function deleteFiles() {
    console.log("Eliminando archivos");
    const downloadPath = path.resolve(__dirname, '../Model/downloads');
    fs.readdir(downloadPath, (err, files) => {
        if (err) {
            console.error("Error al leer el directorio:", err);
            return;
        }
        for (const file of files) {
            fs.unlink(path.join(downloadPath, file), (err) => {
                if (err) {
                    console.error("Error al eliminar el archivo:", err);
                    return;
                }
            });
        }
    });
    console.log("Archivos eliminados");
  }


function getCaso(pdf,casos){
    // console.log("Nombre del archivo: ",pdf);
    for (let caso of casos){
        if (caso.link.toLowerCase() === pdf.toLowerCase()){
            return caso;
        }
    }
}

function getfechaRemate(texto) {
    const regex = /(\d{2}\/\d{2}\/\d{4})/g;
    let fecha = texto.match(regex);
    
    if (fecha) {
        fecha = parseDate(fecha[0]);
        return fecha;
    }
    return null;
}
function getCausa(texto) {
    const regex = /C-\d{1,7}-\d{4}/g;
    let causa = texto.match(regex);
    return causa;
}

function getTribunal(texto){
    const regex = /tribunal:\s*([a-zA-ZñÑ0123456789ºáéíóú]*\s)*/gi;
    let tribunal = texto.match(regex);
    return tribunal;
}


function parseDate(dateString) {
    const [day, month, year] = dateString.split('/');
    return`${year}/${month}/${day}`;
}

function montoMinimo(texto){
    const reMonto = /Valor\s*Mínimo\s*\(pesos\):\s*(\d{7,13})/i;
    let monto = texto.match(reMonto);
    return monto;
}

function getComuna(texto) {
    //let comuna;
    for (let comuna of comunas){
        comunaMinuscula = 'comuna de ' + comuna;
        comunaMayuscula = 'Comuna de ' + comuna;
        if (texto.includes(comuna)){
            return comuna;
        }
    }
    return "N/A";
}
function getAnno(data){
    const detalle = 'Detalle';
    const detalleIndex = data.indexOf(detalle);
    console.log("Detalle index: ",detalleIndex);
    // console.log("Data: ",data);
    if (detalleIndex === -1) {
        return null;
    }
    let dataAnno = data.slice(detalleIndex);
    dataAnno = dataAnno.toLowerCase();
    const regexAnno = /(año)\s*(\d{4})/i;
    const anno = dataAnno.match(regexAnno);
    if (anno) {
        return anno;
    }
    const indexFecha = dataAnno.indexOf('fecha');
    // const fin = dataAnno.indexOf('.');
    const dataFecha = dataAnno.slice(indexFecha);
    const regexFecha = /(\d{4})/g;
    const fecha = dataFecha.match(regexFecha);
    if (fecha) {
        return fecha;
    }
    return null;
}

function getDireccion(data){
    let dataMinuscula = data.toLowerCase();
    const detalle = 'detalle';
    const detalleIndex = dataMinuscula.indexOf(detalle);
    const tipoBienes = 'tipo bienes';
    const tipoBienesIndex = dataMinuscula.indexOf(tipoBienes);
    if (detalleIndex === -1 || tipoBienesIndex === -1) {
        return null;
    }
    dataMinuscula = dataMinuscula.slice(detalleIndex,tipoBienesIndex);
    dataMinuscula = dataMinuscula.replace(/[\r\n]+/g, ' ');
    const palabrasClave = ['propiedad','inmueble','departamento','casa'];
    const comuna = 'comuna';
    const direcciones = [];
    for(let palabra of palabrasClave){
        const index = dataMinuscula.indexOf(palabra);
        let fin = dataMinuscula.indexOf(comuna);
        if(index == -1){continue;}
        // revisar si hay una palabra comuna para finalizar la direccion
        if(fin > index){
            const direccion = dataMinuscula.substring(index,fin);
            return direccion;
        }
    }
    if(direcciones.length > 0){
        return direcciones.at(-1);
    }
    return dataMinuscula;

}

function getTipoPropiedad(data){
    const regexPropiedad = /(?:casa|departamento|terreno|parcela|sitio|local|bodega|oficina|vivienda)/i;
    const tipoPropiedad = data.match(regexPropiedad);
    return tipoPropiedad;
}

function getTipoDerecho(data){
    const regexDerecho = /(?:posesión|usufructo|nuda propiedad|bien familiar)/i;
    const tipoDerecho = data.match(regexDerecho);
    return tipoDerecho;
}

async function main() {
    try {
        const startDate = new Date('2024/11/21'); // Fecha de inicio
        const endDate = new Date('2024/11/22'); 
        const fechaHoy = new Date();
        const casos = await getPdfData(startDate,endDate,fechaHoy);
        console.log("Casos obtenidos: ",casos.length);
        casoObj = casos.map(caso => caso.toObject());
        console.log(casoObj);
        
    } catch (error) {
        console.error('Error al obtener resultados en el index.js:', error);
    }
}

module.exports = { getPdfData }

// main();
