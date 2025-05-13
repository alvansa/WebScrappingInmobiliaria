const https = require('https');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { BrowserWindow } = require('electron');
const pie = require('puppeteer-in-electron');

require('dotenv').config();

const ProcesarBoletin = require('../liquidaciones/procesarBoletin')
const { delay } = require('../../utils/delay');
const { defaultApp } = require('process');

const downloadPath = path.join(os.homedir(), "Documents", "infoRemates/pdfDownload");

async function downloadPdfFromUrl2(browser,url) {
    const randomIndex = Math.floor(Math.random() * proxyData.length);
    // Generar nombre único para el archivo
    const pdfName = `boletin_${Date.now()}.pdf`;
    const pdfPath = path.join(downloadPath, pdfName);

    console.log(`Descargando PDF desde ${url} a ${pdfPath}`);

    let window;
    try {
        // Configurar la ventana de Electron
        window = openWindow(window,false);
        let page;

        // Configurar el listener para interceptar la descarga
        const downloadPromise = new Promise((resolve, reject) => {
            const requestHandler = async (request) => {
                if (request.url() === url) {
                    try {
                        const file = fs.createWriteStream(pdfPath);
                        response.pipe(file);
                        resolve(file);
                    } catch (err) {
                        reject(err);
                    }
                }
            };

            window.on('request',requestHandler);
        });

        // Cargar la URL y esperar la descarga
        await window.loadURL(url, {
            waitUntil: 'networkidle2'
        });
        // page = await pie.getPage(browser,window);
        // await page.setRequestInterception(true);
        await delay(3000);

        // // Esperar la descarga con timeout
        // await Promise.race([
        //     downloadPromise,
        //     new Promise((_, reject) => 
        //         setTimeout(() => reject(new Error('Timeout de descarga')), 30000)
        //     )
        // ]);

        //Leer el pdf descargado
        // await ProcesarBoletin.convertPdfToText(pdfPath);

        return {
            status: 'success',
            filePath: pdfPath,
            message: 'PDF descargado correctamente'
        };

    } catch (error) {
        console.error('Error en la descarga:', error);
        try {
            await fs.unlink(pdfPath).catch(() => {});
        } catch (cleanupError) {
            console.error('Error al limpiar archivo temporal:', cleanupError);
        }
        
        throw new Error(`Error al descargar el PDF: ${error.message}`);
    } finally {
        // Cerrar ventana y limpiar recursos
        if (window && !window.isDestroyed()) {
            window.close();
        }
    }
}

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

        customUA = userAgents[randomIndex].userAgent;
        await page.setUserAgent(customUA);
        await page.goto(url);
        // await page.setRequestInterception(true);
        await delay(3000);
        //Leer el pdf descargado
        let resultado = 'ah'
        // resultado = await ProcesarBoletin.convertPdfToText(pdfPath);

        window.destroy();
        return resultado;
    }catch(error){
        console.error('Error al hacer la petición:', error.message);
        await browser.close();
        return 'Error al hacer la petición';
    }
}

function openWindow(window, useProxy){
    if(useProxy){
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
    customUA  = userAgents[randomIndex].userAgent;
    await page.setUserAgent(customUA);
    await page.goto(url);

    await delay(4000);

    window.destroy();

    console.log("User Agent configurado:", userAgents[randomIndex]," de la lista ", userAgents);
    console.log("Tipo de los user Agents: ",typeof userAgents, " y su longitud: ", userAgents.length);  
    return customUA;
}


async function readPdf(pdfPath) {

        let resultado = 'ah'
        resultado = await ProcesarBoletin.convertPdfToText(pdfPath);

        return resultado;
}

module.exports = { downloadPdfFromUrl,checkUserAgent };
// Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36