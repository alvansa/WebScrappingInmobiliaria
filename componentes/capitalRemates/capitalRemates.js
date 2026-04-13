const listUserAgents = require('../../utils/userAgents2.json');
const logger = require('../../utils/logger');   
const axios = require('axios');
const cheerio = require('cheerio');


let link = 'https://capitalremates.cl/remate-api/list?fecha_desde=2026-04-22&fecha_hasta=2026-04-24&draw=1&length=100&start=100';

class CapitalRemates{

    static async getRemates(fechaDesde, fechaHasta){
        const remates = await this.getRematesFromApi(fechaDesde, fechaHasta);

        return remates;


    }

    static async getRematesFromApi(fechaDesde, fechaHasta){
        const remates = await this.getLinksToRemates(fechaDesde, fechaHasta);

        remates = await this.getRematesFromLinks(remates);

        return remates;
    }

    static async getRematesFromLinks(remates){
        
        for(let remate of remates){
            const response = await this.fetchSingleLink(remate.link);
            this.parseDataFromRemate(response);
        }

        return remates;
    }

    static async fetchSingleLink(link){
        const axiosInstance = this.setupAxios();

        try{
            const response = await axiosInstance.get(link);

            // const data = await response.json();
            return response.data;

        }catch(error){
            logger.error(`Error fetching data from link: ${link} - ${error.message}`);
        }

    }
    static setupAxios() {
        const axiosInstance = axios.create({
            timeout: 30000,
            headers: this.getRandomHeaders()
        });
        return axiosInstance;
    }
    static getRandomHeaders() {
        const userAgents = [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        ];

        return {
            'User-Agent': listUserAgents[Math.floor(Math.random() * listUserAgents.length)],
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
            'Accept-Encoding': 'gzip, deflate, br',
            'DNT': '1',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none'
        };
    }
}


async function main(){

}
async function testSingle(){
    const link = 'https://capitalremates.cl/remates/1859-parcela-paillaco';
    const remate = await CapitalRemates.fetchSingleLink(link);
    // console.log(remate);

    const $ = cheerio.load(remate);

    // document.querySelector("body > main > div > div > div.ficha-hero > div > div.col-lg-7 > h1")
    console.log('-------------------------')
    const direccion = $('h1.titulo-hero');
    direccion.find('span.riesgo-indicator').text('');

    logger.info(`Direccion: ${direccion}`);

}

main();