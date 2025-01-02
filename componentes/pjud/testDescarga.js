const fs = require('fs');
const axios = require('axios');
const puppeteer = require('puppeteer');
const path = require('path');
const request = require('request');

async function descargarPdf(pdfUrl, outputFileName){

    let pdfBuffer = await axios.get(pdfUrl, {responseType: 'arraybuffer'});
    console.log('Descargando Pdf a  ' + outputFileName +"...");
    fs.writeFileSync(outputFileName, pdfBuffer);
}



const link = "https://oficinajudicialvirtual.pjud.cl/ADIR_871/civil/documentos/anexoDocCivil.php?dtaDoc=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwczpcL1wvb2ZpY2luYWp1ZGljaWFsdmlydHVhbC5wanVkLmNsIiwiYXVkIjoiaHR0cHM6XC9cL29maWNpbmFqdWRpY2lhbHZpcnR1YWwucGp1ZC5jbCIsImlhdCI6MTczNTMwODA4MiwiZXhwIjoxNzM1MzExNjgyLCJkYXRhIjoidVU3UFo3czM0S2VhRG5IZk9nUFFQSVhvb01wZ2tmanRSa1JUM3Vydm5qWlp6ZGZONEU2WDVkV0ZXblVGTjhKTTFyalFxcUduNzVnZVk1S3l4ZHQwUUE9PSJ9.IPI6FaN3Es1hIVFeF4P73FCZ2GnsgkbPht0tvJplS3g";
const linkPrueba = "https://www.turnerlibros.com/wp-content/uploads/2021/02/ejemplo.pdf";
const outputFileName = "./test.pdf";
// try{
//     descargarPdf(link,outputFileName);
// }catch(error){
//     console.log('No se encontro archivo para eliminar');
// }

async function testLink(link,outputFileName) {
    const browser = await puppeteer.launch({headless: false});
    const page = await browser.newPage();
    await page.goto(link);
    try{
        await page.pdf({
            path: outputFileName,
            format: 'A4'
            // printBackground: true
        });
    }catch(error){
        console.log('Error al descargar pdf:',error);
    }
    await delay(2000);
    await browser.close();
}

testLink(link,outputFileName);

// descargarPdf(link,outputFileName);

function delay(time) {
    return new Promise(function(resolve) { 
        setTimeout(resolve, time)
    });
 }