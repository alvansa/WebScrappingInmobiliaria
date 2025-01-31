const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const Caso = require("../caso/caso");


class PublicosYLegales{
    constructor(startDate,endDate,queryDate){
        this.startDate = startDate;
        this.endDate = endDate;
        this.queryDate = queryDate;
        this.link = "https://publicosylegales.cl/lorem-ipsum-dolor-sit-amet/";
        this.date = "2024.12.9";
        this.casos = [];
    }

    async scrapePage(){
        await this.searchAuctions();

        for(let caso of this.casos){
            await this.getDataAuction(caso);
        } 
        return this.casos;
    }

    async getDataAuction(caso){
        const { data } = await axios.get(caso.link);
        const $ = cheerio.load(data);
        const description = this.obtainDescription($);
        caso.darTexto(description);

    }

    obtainDescription($){
        let description = $("div.elementor-widget-container p:not(:has(> a))").text();
        let normalizedDescription = description.replace(/(<br\s*\/>|\n)/g, ' ').trim();
        console.log("---------------------------------------");
        if(normalizedDescription !== ""){
            console.log("Descripcion econtrada con: p");
            console.log(normalizedDescription);
            return normalizedDescription;
        }
        console.log("No se encontró la descripción");
        description = $('div[data-olk-copy-source="MessageBody"]').text();  
        if(description !== ""){
            normalizedDescription = description.replace(/(<br\s*\/>|\n)/g, ' ').trim();
            console.log(`Descripcion econtrada con: div[data-olk-copy-source="MessageBody"]`);
            console.log(normalizedDescription);
            return normalizedDescription;
        }
        description = $('div.x_elementToProof').text();
        if(description !== ""){
            normalizedDescription = description.replace(/(<br\s*\/>|\n)/g, ' ').trim();
            console.log(`Descripcion econtrada con: div.x_elementToProof`);
            console.log(normalizedDescription);
            return normalizedDescription;
        }
        
        return null;
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
