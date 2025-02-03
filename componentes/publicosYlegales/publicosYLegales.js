const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const Caso = require("../caso/caso");
const puppeteer = require('puppeteer');


class PublicosYLegales{
    constructor(startDate,endDate,queryDate){
        this.startDate = startDate;
        this.endDate = endDate;
        this.queryDate = queryDate;
        this.link = "https://publicosylegales.cl/lorem-ipsum-dolor-sit-amet/";
        this.date = "2024.12.9";
        this.casos = [];
        this.browser = null;
        this.page = null;
    }

    async scrapePage(){
        this.browser = await puppeteer.launch({headless: false});
        this.page = await this.browser.newPage();
        // await this.testSearchAuction();
        // return [];
        await this.searchAuctions();
        console.log(this.casos);
        console.log(this.casos.length);
        for(let caso of this.casos){
            await this.getDataAuction(caso);
        } 
        this.browser.close();
        return this.casos;
    }

    async testSearchAuction(){
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        await page.goto("https://publicosylegales.cl/busqueda/?jsf=jet-engine:lista_encontrada&tax=category:41&date=2024.12.9");
        await page.screenshot({path: 'example.png'});
        await browser.close();
    }

    async getDataAuction(caso){
        await this.page.goto(caso.link,{waitUntil: 'networkidle2'});
        const description = await this.page.evaluate(()=>{
            const description = document.querySelector(".elementor-element-82500aa").textContent.trim();
            return description;
        });
        const normalizedDescription = this.normalizeDescriptionFromWeb(description);
        caso.darTexto(normalizedDescription);
        console.log(normalizedDescription);
    }

    obtainDescription(){
        const div = document.querySelector(".elementor-element-82500aa");
        const description = div.textContent.trim();
        const normalizedDescription = this.normalizeDescriptionFromWeb(description);
        return description;
    }

    normalizeDescriptionFromWeb(description){
        const normalizedDescription = description
            .replace(/[\n\t+]/gi,"");
        return normalizedDescription;
    }

    async searchAuctions(){
        let currentDate = this.startDate;
        while(currentDate <= this.endDate){
            await this.obtainLinks(currentDate);
            console.log("--------------------------");
            currentDate.setDate(currentDate.getDate() + 1);
        }
    }

    async obtainLinks(date){
        const currentDate = this.formatDateToString(date);
        const searchLink = `https://publicosylegales.cl/busqueda/?jsf=jet-engine:lista_encontrada&tax=category:41&date=${currentDate}`;
        await this.page.goto(searchLink,{waitUntil: 'networkidle2'});
        const casos = await this.page.evaluate(()=>{
            const divs = document.querySelectorAll(".elementor-element-b8562e3");
            const casos = [];
            divs.forEach((div)=>{
                const fecha = div.querySelector(".elementor-heading-title.elementor-size-default").textContent.trim();
                const link = div.querySelector("a").href;
                if(fecha && link){
                    casos.push({fecha,link});
                }
            });
            return casos;
        });
        for(let publicacion of casos){
            const fecha = publicacion.fecha;
            const link = publicacion.link; 
            const caso = new Caso(this.queryDate,this.formatStringToDate(fecha),link);
            this.casos.push(caso);
        }
    }

    async obtainLinksAxios(date){
        const currentDate = this.formatDateToString(date);
        const searchLink = `https://publicosylegales.cl/busqueda/?jsf=jet-engine:lista_encontrada&tax=category:41&date=${currentDate}`;
        const { data } = await axios.get(searchLink);
        const $ = cheerio.load(data);
        const divs = $(".elementor-element-b8562e3");
        divs.each((index,element)=>{
            const div = $(element);
            const fecha = div.find(".elementor-heading-title.elementor-size-default").first().text().trim();
            const link = div.find("a").attr("href");
            const caso = new Caso(this.queryDate,this.formatStringToDate(fecha),link);
            this.casos.push(caso);
            console.log(link);
            console.log("Fecha: "+this.date+"--------------------"+fecha);
        })
    }

    formatDateToString(date) {
        const year = date.getFullYear(); // Obtiene el año completo
        const month = date.getMonth() + 1; // Obtiene el mes (de 0 a 11) y suma 1
        const day = date.getDate(); // Obtiene el día del mes

        // Construye el string con el formato "YYYY.M.D"
        return `${year}.${month}.${day}`;
    }

    formatStringToDate(date){
        const [year,month,day] = date.split(".");
        return new Date(year,month-1,day);
    }

    async obtainHTML(link,number){
        const { data } = await axios.get(link);
        const $ = cheerio.load(data);
        fs.writeFileSync(`./componentes/publicosYlegales/html/HTMLPagina${number}.html`,data);
    }
}




module.exports = PublicosYLegales;

//id del div que contiene los articulos
// class="elementor-element elementor-element-c7dc947 e-con-full e-flex e-con e-child"
// Tal vez este sea la clase del div padre
//class="elementor-element elementor-element-b8562e3 e-flex e-con-boxed e-con e-parent"
