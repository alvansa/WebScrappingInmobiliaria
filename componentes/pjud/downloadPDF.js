const puppeteer = require('puppeteer');
const https = require('https');
const fs = require('fs');

async function downloadPdfFromUrl(url, filePath) {
    const browser = await puppeteer.launch({headless: false});
    const page = await browser.newPage();
    try{
        page.on('request', req => {
            if (req.url() === url) {
                const file = fs.createWriteStream(filePath);
                https.get(req.url(), response => response.pipe(file));
            }
        });

        await page.goto(url);
        await browser.close();
        return 'PDF descargado';
    }catch(error){
        console.error('Error al hacer la petición:', error.message);
        await browser.close();
        return 'Error al hacer la petición';
    }
}

module.exports = {downloadPdfFromUrl};