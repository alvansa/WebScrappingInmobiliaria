const fs = require('fs');
const axios = require('axios');
const puppeteer = require('puppeteer');
const path = require('path');





async function descargarPdf(pdfUrl, outputFileName){

    let pdfBuffer = await axios.get(pdfUrl, {responseType: 'arraybuffer'});
    console.log('Descargando Pdf a  ' + outputFileName +"...");
    fs.writeFileSync(outputFileName, pdfBuffer);
}



const link = "https://oficinajudicialvirtual.pjud.cl/ADIR_871/civil/documentos/anexoDocCivil.php?dtaDoc=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwczpcL1wvb2ZpY2luYWp1ZGljaWFsdmlydHVhbC5wanVkLmNsIiwiYXVkIjoiaHR0cHM6XC9cL29maWNpbmFqdWRpY2lhbHZpcnR1YWwucGp1ZC5jbCIsImlhdCI6MTczNTIxODg0MCwiZXhwIjoxNzM1MjIyNDQwLCJkYXRhIjoidVU3UFo3czM0S2VhRG5IZk9nUFFQRTdRaWxkYjNtRm5RanNtbGQyTDNqVDFINEE3SnB5Q3Bock5ReHU1M0VLTEhjV0tuZ243dU9oVnNKRStXNUF3eVE9PSJ9.XggYFt8ViT0h3eqprx3ec1PJjdnzVXiZ0klQXicEsLc";
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
testLink(linkPrueba,outputFileName);


function delay(time) {
    return new Promise(function(resolve) { 
        setTimeout(resolve, time)
    });
 }