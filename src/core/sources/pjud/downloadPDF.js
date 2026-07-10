const https = require('https');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { BrowserWindow } = require('electron');
const pie = require('puppeteer-in-electron');

require('dotenv').config();

const { delay } = require('#utils/delay.js');

const downloadPath = path.join(os.homedir(), "Documents", "infoRemates/pdfDownload");

async function downloadPdfFromUrl(browser,url) {
    const userAgents = JSON.parse(process.env.USER_AGENTS);
    const randomIndex = Math.floor(Math.random() * userAgents.length);
    let window;
    window = openWindow(window,false);
    await window.loadURL(url);
    const page = await pie.getPage(browser, window);
    const pdfName = `boletin_${Date.now()}.pdf`;
    const pdfPath = path.join(downloadPath, pdfName);
 
    console.log("probando la funcion inicial para descargar el pdf");
    try{

        page.on('request', req => {
            if (req.url() === url) {
                const file = fs.createWriteStream(pdfPath);
                https.get(req.url(), response => response.pipe(file));
            }
        });

        const customUA = userAgents[randomIndex].userAgent;
        await page.setUserAgent(customUA);
        await page.goto(url);
        // await page.setRequestInterception(true);
        await delay(3000);
        //Leer el pdf descargado
        // resultado = await ProcesarBoletin.convertPdfToText(pdfPath);

        window.destroy();
        return true;
    }catch(error){
        console.error('Error al hacer la petición:', error.message);
        await browser.close();
        return false;
    }
}

function openWindow(window, useProxy){
    if(useProxy){
        const proxyData = JSON.parse(process.env.PROXY_DATA);
        const randomIndex = Math.floor(Math.random * proxyData.length);
        window = new BrowserWindow({
            show: true,// Ocultar ventana para procesos en background
            proxy :{
                username: proxyData[randomIndex].username,
                password: proxyData[randomIndex].password,
                server: proxyData[randomIndex].server,
            }
        });
    }else{
        window = new BrowserWindow({
            show: true,// Ocultar ventana para procesos en background
        });
    }
    return window;
}

async function checkUserAgent(browser,url){
    const userAgents = JSON.parse(process.env.USER_AGENTS);
    const randomIndex = Math.floor(Math.random() * userAgents.length);
    let window;
    window = new BrowserWindow({
        show: true,// Ocultar ventana para procesos en background
    });
    await window.loadURL(url);
    const page = await pie.getPage(browser, window);
    const customUA  = userAgents[randomIndex].userAgent;
    await page.setUserAgent(customUA);
    await page.goto(url);

    await delay(4000);

    window.destroy();

    console.log("User Agent configurado:", userAgents[randomIndex]," de la lista ", userAgents);
    console.log("Tipo de los user Agents: ",typeof userAgents, " y su longitud: ", userAgents.length);  
    return customUA;
}


module.exports = { downloadPdfFromUrl,checkUserAgent };
// Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36