const Caso  = require('../Model/caso.js');
const {getDatosBoletin} = require('../Model/getBoletinConcursal.js');
const fs = require('fs');
// import fs from 'fs';
const path = require('path');
// import path from 'path';
const pdfparse = require('pdf-parse');
// import pdfparse from 'pdf-parse';
// const PdfReader = require('pdfreader');
// const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');
const { ipcRenderer } = require( 'electron' );
// const PDFJS = require('../node_modules/pdf-parse/lib/pdf.js/v2.0.550/build/pdf.js')
let PDFParser = require("pdf2json");
// import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs"


function obtainDataRematesPdf(data,caso) {
    const fechaRemate = getfechaRemate(data);
    const causa = getCausa(data);
    const tribunal = getTribunal(data);``

    if(fechaRemate){
        caso.darFechaRemate(fechaRemate);
    }
    if(causa){
        caso.darCausa(causa[0]);
    }
    if(tribunal){
        const juzgado = tribunal[0].split(":")[1];
        caso.darJuzgado(juzgado);
    }

}


async function getPdfData2(fechaInicio,fechaFin,fechaHoy) {
    let casos = [];
    
    // Configuracion del worker de pdfjs, necesario hacerlo manualmente para que funcione en node
    // PDFJS.workerSrc = '../node_modules/pdf-parse/lib/pdf.js/v2.0.550/build/pdf.worker.js';
    try{
        await getDatosBoletin(fechaInicio,fechaFin,casos,fechaHoy);
        const pdfs = fs.readdirSync(path.join(__dirname, '../Model/downloads'));
        for (let pdf of pdfs) {
            const pdfFile = fs.readFileSync(path.join(__dirname, '../Model/downloads/', pdf));
            console.log("Leyendo archivo: ",path.join(__dirname, '../Model/downloads/', pdf),"con el nombre: ",pdf);
            const pdfData = await pdfparse(pdfFile);
            const pdfText = pdfData.text;
            const caso = new Caso(fechaHoy);
            obtainDataRematesPdf(pdfText,caso);
            casos.push(caso);
            // casos = pdfparse(pdfFile).then(data => getTextFromPdf(data,fechaHoy,casos));
        }
    }catch (error) {
        console.error("Error en getPdfData:", error);
    }
    deleteFiles();
    return casos;
}

async function getPdfData(fechaInicio,fechaFin,fechaHoy) {
    let casos = [];
    
    // Configuracion del worker de pdfjs, necesario hacerlo manualmente para que funcione en node
    // pdfjsLib.GlobalWorkerOptions.workerSrc = './node_modules/pdfjs-dist/build/pdf.worker.mjs'
    // PDFJS.workerSrc = '/static/js/pdf.worker.js';
    try{
        await getDatosBoletin(fechaInicio,fechaFin,casos,fechaHoy);
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
                console.log(texto.length);
                const caso = new Caso(fechaHoy);
                casos.push(caso);
            }
            
            // casos = pdfparse(pdfFile).then(data => getTextFromPdf(data,fechaHoy,casos));
        }
    }catch (error) {
        console.error("Error en getPdfData:", error);
        // console.log(1);
    }
    deleteFiles();
    return casos;
}


function deleteFiles() {

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
    const regex = /C-\d{3,5}-\d{4}/g;
    let causa = texto.match(regex);
    return causa;
}

function getTribunal(texto){
    const regex = /tribunal:\s*([a-zA-ZñÑ123456789ºáéíóú]*\s)*/gi;
    let tribunal = texto.match(regex);
    return tribunal;
}


function parseDate(dateString) {
    const [day, month, year] = dateString.split('/');
    return new Date(`${year}/${month}/${day}`);
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

function readPdf(){
    let path = "./PublicacionBoletin_49610.pdf";
    let pdfParser = new PDFParser(this,1);
    pdfParser.on("pdfParser_dataError", errData => console.error(errData.parserError) );
    pdfParser.on("pdfParser_dataReady", (pdfData) => {
        texto = pdfParser.getRawTextContent();
        console.log(texto);
    });
    console.log("Leyendo archivo: ",path,typeof path);
    pdfParser.loadPDF(path);   
}

function readerPDF(){
    
    fs.readFile("PublicacionBoletin_49610.pdf", (err, pdfBuffer) => {
      // pdfBuffer contains the file content
      new PdfReader().parseBuffer(pdfBuffer, function(err, item) {
        if (err) callback(err);
        else if (!item) callback();
        else if (item.text) console.log(item.text);
      });
    });
}
main();
// readPdf();
// readerPDF();