const config =  require("../../config.js");
const puppeteer = require('puppeteer-core');
const Caso = require('../caso/caso.js');
const {procesarDatosRemate} = require('../economico/datosRemateEmol.js');
const {delay} = require('../../utils/delay.js')

const PREREMATES = 4;

class PreRemates{
    constructor(Email,Password,browser,page){
        this.link = "https://preremates.cl/content/proximos-remates";
        this.email = Email;
        this.password = Password;
        this.casos = [];
        this.browser = browser;
        this.page = page;
    }

    async getRemates(){
        // this.browser = await puppeteer.launch({headless: true});
        // this.page = await this.browser.newPage();
        // try{
        //     await this.page.goto(this.link, {waitUntil: 'networkidle2'});
        // }catch(error){
        //     return new Error('Error al obtener resultados:', error);
        // }
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
            let tieneSiguiente = true;
            while(tieneSiguiente){
                await this.obtenerPublicacionesIndividuales();
                await this.page.evaluate((pageIndex) => {
                    ListView_ChangePage(pageIndex);
                },i);
                await delay(2000);
                i++;
                tieneSiguiente = await this.revisarPaginaSiguiente(i);
                // if(i === 3){
                //     tieneSiguiente = false;
                // }
            }
            for(let caso of this.casos){
                procesarDatosRemate(caso);
            }
        }catch(error){
            console.error('Error al obtener resultados:', error);
        }
        // finally{
        //     await this.browser.close();
        // }
        return this.casos;
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
        const avisos = await this.page.$$eval(cssSelector,(rows)=>
            rows.map((row) => {
                const fecha = row.querySelector(".aviso-fecha")?.textContent.trim() || '';
                const texto = row.querySelector(".aviso-texto")?.textContent.trim() || '';
                return {fecha,texto};
            })
        );
        const hoy = new Date();
        // console.log("Avisos: ",avisos);
        avisos.forEach((aviso) => {
            const caso = new Caso(hoy,"N/A",this.link,PREREMATES);
            caso.darTexto(aviso.texto);
            const fechaRemate = this.cambiarFecha(aviso.fecha);
            caso.darFechaRemate(fechaRemate);
            this.casos.push(caso);
        });
    }

    cambiarFecha(fecha){
        const annoRegex = fecha.match(/\d{4}/);
        if(annoRegex === null){
            return false
        }
        const anno = annoRegex[0]
        const mesRegex = fecha.match(/\b[a-zA-Z]{3}\b(?=\s+\d{4},)/);
        if(mesRegex === null){
            return false
        }
        
        const mes = mesRegex[0];

        const diaRegex = fecha.match(/\b\d{1,2}(?=\s+[a-zA-Z]{3,5}\s+\d{4},)/);
        if(diaRegex === null){
            return false
        }
        const dia = diaRegex[0];
        const meses = {
            "ene": 0,
            "feb": 1,
            "mar": 2,
            "abr": 3,
            "may": 4,
            "jun": 5,
            "jul": 6,
            "ago": 7,
            "sep": 8,
            "oct": 9,
            "nov": 10,
            "dic": 11
        };
        const numeroMes = meses[mes];
        const fechaNormalizada = new Date(anno,numeroMes,dia);

        return fechaNormalizada;
    }
}


module.exports = {PreRemates};