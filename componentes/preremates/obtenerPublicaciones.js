const config =  require("../../config.js");
const puppeteer = require('puppeteer');


async function mainPage(EMAIL,PASSWORD){

    const LINK = "https://preremates.cl/content/proximos-remates";
    const browser = await puppeteer.launch({headless: false});
    const page = await browser.newPage();
    try{
        await page.goto(LINK);
        await page.waitForSelector('#ktkContentMain');
        console.log("Aparecio el cuadro");
        await page.locator("#u").fill(EMAIL);
        await page.locator("#p").fill(PASSWORD);
        await page.locator("#doLogin").click();
        await delay(5000);
    }catch(error){
        console.error('Error al obtener resultados:', error);
    }finally{
        await browser.close();
    }
    
}

function main(){
    const EMAIL = config.EMAIL;
    const PASSWORD = config.PASSWORD;
    console.log(EMAIL);
    console.log(PASSWORD);
    mainPage(EMAIL,PASSWORD);
}

async function delay(time) {
    return new Promise(function(resolve) { 
        setTimeout(resolve, time)
    });
}

main();