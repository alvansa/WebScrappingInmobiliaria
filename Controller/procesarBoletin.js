const fs = require('fs');
const path = require('path');
const pdfparse = require('pdf-parse');
const Caso  = require('../Model/Caso');
const {getDatosBoletin} = require('../Model/getBoletinConcursal.js');

// const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');

function obtainDataRematesPdf(data,caso) {
    const fechaRemate = getfechaRemate(data);
    const causa = getCausa(data);
    const tribunal = getTribunal(data);

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


async function getPdfData(fechaInicio,fechaFin,fechaHoy) {
    let casos = [];
    
    // Configuracion del worker de pdfjs, necesario hacerlo manualmente para que funcione en node
    // pdfjsLib.GlobalWorkerOptions.workerSrc = './node_modules/pdfjs-dist/build/pdf.worker.mjs'
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

// main();
module.exports = { getPdfData }