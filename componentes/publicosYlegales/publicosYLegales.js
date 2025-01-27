const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');


class PublicosYLegales{
    constructor(){
        this.link = "https://publicosylegales.cl/lorem-ipsum-dolor-sit-amet/";
        this.date = "2024.12.9";
        this.searchLink = `https://publicosylegales.cl/busqueda/?jsf=jet-engine:lista_encontrada&tax=category:41&date=${this.date}`;
        this.publicos = [];

        this.legales = [];
    }

    async getDataAuction(url){
        const { data } = await axios.get(url);
        const $ = cheerio.load(data);
        let normalizedTargetDiv = "";
        //console.log(data);
        //write the data in a file
        //fs.writeFileSync('publicosYLegalestest2.html', data);        
        //console.log($);
        //const description = $("div.jet-listing-grid__item jet-listing-dynamic-post-1916 p").text();
        const description = $("p").text();
        const normalizedDescription = description.replace(/(<br\s*\/>|\n)/g, ' ').trim();
        console.log("---------------------------------------");
        if(normalizedDescription !== ""){
            console.log(normalizedDescription);
            console.log(typeof(normalizedDescription));
        }
        console.log("No se encontró la descripción");
        let targetDiv = $('div[data-olk-copy-source="MessageBody"]').text();  
        if(targetDiv !== ""){
            normalizedTargetDiv = targetDiv.replace(/(<br\s*\/>|\n)/g, ' ').trim();
            console.log(normalizedTargetDiv);
        }
        targetDiv = $('div.x_elementToProof').text();
        normalizedTargetDiv = targetDiv.replace(/(<br\s*\/>|\n)/g, ' ').trim();
        console.log(normalizedTargetDiv);

    }

    async searchAuctions(){
        const startDate = new Date(2024, 11, 9);
        const endDate = new Date(2024, 11, 12);
        let currentDate = startDate;
        while(currentDate <= endDate){
            this.date = this.formatDateToString(currentDate);
            const { data } = await axios.get(this.searchLink);
            const $ = cheerio.load(data);
            fs.writeFileSync('searchPage2.html', data);
            const links = $("h3.elementor-icon-box-title > a").map((i, el) => $(el).attr("href")).get();
            console.log(links);
            const FunctionalLinks = this.obtainValidLinks(links);
            console.log(FunctionalLinks);
            const linksToVisit = [...new Set(FunctionalLinks)];
            console.log(linksToVisit);
            console.log("Fecha: "+this.date+"--------------------");
            currentDate.setDate(currentDate.getDate() + 1);
        }
        // for(let link of linksToVisit){
        //     await this.getDataAuction(link);
        // }
    }

    obtainValidLinks(links){
        const excluyedWord = ["diario","wa.me","contacto"];
        const FunctionalLinks = links.filter(link => {
            return !excluyedWord.some(keyword => link.includes(keyword));
        }
        );
        return FunctionalLinks;

    }

    formatDateToString(date) {
    const year = date.getFullYear(); // Obtiene el año completo
    const month = date.getMonth() + 1; // Obtiene el mes (de 0 a 11) y suma 1
    const day = date.getDate(); // Obtiene el día del mes

    // Construye el string con el formato "YYYY.M.D"
    return `${year}.${month}.${day}`;
}
}


async function main(){
    const publicosYLegales = new PublicosYLegales();
    await publicosYLegales.searchAuctions();
    //await publicosYLegales.getDataAuction("https://publicosylegales.cl/remate-25civil-de-santiago-rol-c-17525-2020-suaval-s-a-g-r-con-cuentas/");
}

main();