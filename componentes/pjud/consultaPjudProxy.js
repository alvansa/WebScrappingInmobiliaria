const puppeteer = require('puppeteer');
require('dotenv').config();

const {delay} = require('../../utils/delay.js');

async function main(){
    const proxyData = JSON.parse(process.env.PROXY_DATA);

    const randomIndex = Math.floor(Math.random() * proxyData.length);
    const url =  'https://oficinajudicialvirtual.pjud.cl/indexN.php';
    const url2 = "https://www.google.com";
    const browser = await puppeteer.launch({
        headless: false,
        proxy: {
            server: proxyData[randomIndex].server,
            username: proxyData[randomIndex].username,
            password: proxyData[randomIndex].password,
        },
    });
    const page = await browser.newPage();
    await page.goto(url,{ waitUntil: 'networkidle2', timeout: 0 });
    // await page.waitForSelector('#competencia'); 

    await delay(1000);

    browser.close();
    console.log('Browser closed');
    console.log("Se probo la conexion con el proxy numero: ",randomIndex);

}

main();

