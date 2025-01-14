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
            let i = 2;
            // let tieneSiguiente = this.revisarPaginaSiguiente(i);
            await this.obtenerPublicacionesIndividuales();
            // let tieneSiguiente = true;
            // while(tieneSiguiente){
            //     await this.page.evaluate((pageIndex) => {
            //         ListView_ChangePage(pageIndex);
            //     },i);
            //     await delay(2000);
            //     i++;
            //     tieneSiguiente = await this.revisarPaginaSiguiente(i);
            //     // tieneSiguiente = false;
            // }
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

    async revisarPaginaSiguiente(index){
        console.log("Revisando si hay siguiente pagina",index.toString());
        const listPages = ".ktkPageLinks > a";
        const list = await this.page.$$eval(listPages, elements => elements.map(element => element.innerText).join(' '));
        if(list.includes(index.toString())){
            return true;
        }else{
            return false;
        }
    }

    async obtenerPublicacionesIndividuales(){
        const cssSelector = ".row.aviso-row";
        const avisoFecha = ".aviso-fecha";
        const avisoTexto = ".aviso-texto";

        // const fecha = await this.page.$(avisoFecha);
        const listFecha = await this.page.$$eval(avisoFecha, elements =>
            elements.map((element) => element.textContent.trim())
        );
        console.log(listFecha);
        await this.page.waitForSelector(cssSelector);
        const avisos = await this.page.$$eval(cssSelector,(rows)=>
            rows.map((row) => {
                const fecha = row.querySelector(".aviso-fecha")?.textContent.trim() || '';
                const texto = row.querySelector(".aviso-texto")?.textContent.trim() || '';
                return {fecha,texto};
            })
        );
        console.log("avisos: ",avisos);
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