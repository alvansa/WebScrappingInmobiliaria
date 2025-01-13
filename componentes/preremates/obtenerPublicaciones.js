const config =  require("../../config.js");
const puppeteer = require('puppeteer');

class PreRemates{
    constructor(Email,Password){
        this.link = "https://preremates.cl/content/proximos-remates";
        this.email = Email;
        this.password = Password;
    }

    async mainPage(){
        this.browser = await puppeteer.launch({headless: false});
        this.page = await this.browser.newPage();
        try{
            await this.page.goto(this.link, {waitUntil: 'networkidle2'});
        }catch(error){
            return new Error('Error al obtener resultados:', error);
        }
        console.log("Se inicio el navegador");
        try{
            const form = await this.fill_form();
            if(await this.checkError(form)){
                console.log("Error al llenar el formulario");
                return false;
            }

            try{
                await this.page.evaluate(() => {
                    ktkObj('doLogin').click()
                });
            }catch(error){
                console.error('Error al hacer clic en el botón de consulta:', error);
                await this.browser.close();
                return [];
            }
            await delay(2000);
            let tieneSiguiente = this.revisarPaginaSiguiente();
            let i = 2;
            while(tieneSiguiente){
                await this.page.evaluate((pageIndex) => {
                    ListView_ChangePage(pageIndex);
                },i);
                await delay(2000);
                tieneSiguiente = await this.revisarPaginaSiguiente();
                i++;
            }
        }catch(error){
            console.error('Error al obtener resultados:', error);
        }finally{
            await this.browser.close();
        }
    }

    async fill_form(){
        try{
            await this.page.waitForSelector('#u');
            await this.page.$eval('#u', (el,value) => el.value = value ,this.email);
            console.log("Se lleno el email");
        }catch(error){
            return new Error('Error al llenar el email');
        }

        try{
            await this.page.waitForSelector('#p');
            await this.page.$eval('#p', (el,value) => el.value = value ,this.password);
            console.log("Se lleno el password");
        }catch(error){
            return new Error('Error al llenar el password');
        }

        return true;
    }
    
    async checkError(instance){
        if(instance instanceof Error){
            await this.browser.close();
            console.log("Error al llenar el formulario aaaa");
            return true;
        }
        return false;
    }

    async revisarPaginaSiguiente(){
        console.log("Revisando si hay siguiente pagina");
        const nextPageButton = "#Buttons > table > tbody > tr > td:nth-child(2) > div > span > button:nth-child(8)";
        const button = await this.page.$(nextPageButton);
        console.log("Se encontro el boton de siguiente pagina: ",button);
        if(button){
                console.log("Se encontro el boton de siguiente pagina");
            return true;
        }else{
            return false;
        }
    }
}

async function main(){
    const EMAIL = config.EMAIL;
    const PASSWORD = config.PASSWORD;
    try{
        const preRemates = new PreRemates(EMAIL,PASSWORD);
        const mainPage = await preRemates.mainPage();
    }catch(error){
        console.error('Error al obtener resultados:', error);
    }
}

async function delay(time) {
    return new Promise(function(resolve) { 
        setTimeout(resolve, time)
    });
}

main();