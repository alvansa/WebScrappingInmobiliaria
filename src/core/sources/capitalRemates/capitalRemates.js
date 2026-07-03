const axios = require('axios');
const cheerio = require('cheerio');
const { log } = require('winston');

const listUserAgents = require('#utils/userAgents2.json');
const caso = require('#models/caso/caso.js')
const CasoBuilder = require('#models/caso/casoBuilder.js'); 
const {fakeDelay} = require('#utils/delay.js');
const logger = require('#utils/logger.js');   


/*
    TODO: ESTO NO ESTA FUNCIOANDO 

*/

class CapitalRemates{

    static async getRemates(fechaDesde, fechaHasta){
        return await this.getRematesFromApi(fechaDesde, fechaHasta);
    }

    static async getRematesFromApi(fechaDesde, fechaHasta){
        try{
            const listOfAuctions = await this.getLinksToRemates(fechaDesde, fechaHasta);

            const remates = await this.getRematesFromLinks(listOfAuctions);

            return remates;
        }catch(error){
            logger.error(`Error obteniendo remates desde API: ${error.message}`);
            return [];
        }
    }

    static async getLinksToRemates(fechaDesde, fechaHasta){
        let start = 0;
        let links = [];
        let areRematesAvailable = true;
        while(areRematesAvailable){
            logger.info(`Obteniendo remates desde API, fechaDesde: ${fechaDesde}, fechaHasta: ${fechaHasta}, start: ${start}`);
            //TODO: agregar cosas para que funcione, que cosas, nose
            const url = `https://capitalremates.cl/remate-api/list?fecha_desde=${fechaDesde}&fecha_hasta=${fechaHasta}&draw=1&length=100&start=${start}`;
            const index = Math.floor(Math.random() * listUserAgents.length ); 
            const userAgent = listUserAgents[0];
            const response = await fetch( url, { headers:{
                'User-Agent' : userAgent,
                'Accept': 'application/json, text/plain, */*',
                'Accept-Language': 'es-CL,es;q=0.9,en;q=0.8',
                'Accept-Encoding': 'gzip, deflate, br',
                'Referer': 'https://capitalremates.cl/', // Simula que vienes de su propia web
                'Origin': 'https://capitalremates.cl',
                'Connection': 'keep-alive',
            }}
            );

            logger.info(`Response status ${response.status} user Agent usado: ${userAgent}`)
            // logger.info(`Respuesta : ${JSON.stringify(response,null,2)}`)
            // logger.info(`Respuesta : ${response.text()}`)
            const data = await response.json();
            logger.info(`Remates obtenidos desde API: ${data.data.length}`);
            links = this.addLinks(links,data.data);

            let totalRecords = data.recordsTotal;
            start += 100;

            if(start >= totalRecords){
                areRematesAvailable = false;
            }
        }

        return links;
    }

    static addLinks(links,remates){
        for(let remate of remates){

            const link = `https://capitalremates.cl${remate.slug_url}`;
            links.push({link: link, fecha: remate.fecha_remate, tipoDerecho : remate.tipo_derecho, });
        }
        return links;
    }

    static async getRematesFromLinks(listOfAuctions){
        const remates = []; 
        let counter = 0;    
        for(let auction of listOfAuctions){
            const {link, fecha, tipoDerecho} = auction;
            if(tipoDerecho && tipoDerecho.toLowerCase().includes('derecho')){
                continue;
            }
            // logger.info(`Obteniendo datos numero: ${counter}`);
            counter++;
                
            await fakeDelay(2,5);
            // if(counter > 5){
            //     return remates;
            // }
            const response = await this.fetchSingleLink(link);
            if(!response){
                logger.warn(`No se pudo obtener datos desde el link: ${link}`);
                continue;
            }
            logger.info(`Fecha ${fecha}`);
            const caso = this.parseDataFromRemate(response, fecha);
            caso.link = link;
            remates.push(caso);
        }

        return remates;
    }

    static async fetchSingleLink(link){
        const axiosInstance = this.setupAxios();

        try{
            const response = await axiosInstance.get(link);
            // const data = await response.json();
            logger.info(`Datos obtenidos desde link: ${link}`);

            return response.data;

        }catch(error){
            logger.error(`Error fetching data from link: ${link} - ${error.message}`);
            return null;
        }

    }

    static parseDataFromRemate(html, fechaRemate){
        let latitud, longitud, modoEntrega;
        const $ = cheerio.load(html);

        
        const htmlDireccion = $('h1.titulo-hero');
        htmlDireccion.find('span.riesgo-indicator').text('');
        const direccion = htmlDireccion.text().trim();

        const rol = $('.property-item:contains("ROL") span').text().trim();
        const tribunal = $('.property-item:contains("Tribunal") span').text().trim();
        const $div = $('.precio-hero.mb-0'); // igual de específico pero más legible
        const soloPrecio = $div.clone().find('span').remove().end().text().trim();
        const precioNumerico = soloPrecio.replace('$', '').replace(/\./g, '');

        const src = $('.map-container iframe').attr('src');
        const match = src.match(/[?&]q=([^&]+)/);
        if (match) {
            const coords = match[1].split(",");
            latitud = parseFloat(coords[0]);
            longitud = parseFloat(coords[1]);
        }

        const $p = $(".ficha-hero p").filter((i, el) => $(el).text().includes(" - "));
        const texto = $p.text().trim();
        const [fecha, hora] = texto.split(" - ");
        const linkMaps = `https://www.google.com/maps/place/${latitud},${longitud}`
        
        const [comuna, region] = $('.inmueble-stat-value').map((i, el) => $(el).text().trim()).get();
        // logger.info(labels); // ["Comuna", "Region"]
        const $primerPaso = $('.pasos-grid .paso-card').first();
        const descripcion = $primerPaso.find('.paso-desc').text().trim().toLocaleLowerCase();
        if(descripcion.includes('vale vista') || descripcion.includes('vv')){
            modoEntrega = 'VV';
        }

        const diaEntrega = $('.pasos-grid .paso-card').eq(1).find('.paso-desc').text().trim();
        const tipoJuez = $('.proceso-grid .property-item').eq(1).find('label').text().trim().toLowerCase();


        const obtainTipoDerecho = $('.property-item:contains("Que se remata") span').text().trim();
        let tipoDerecho = null;
        if(obtainTipoDerecho){
            if(obtainTipoDerecho.toLowerCase().includes('derecho')){
                tipoDerecho = 'derechos';
            }
        }

        let fechaRemateFinal = null;
        if(fechaRemate){
            fechaRemateFinal = fechaRemate.split(" ")[0];
            fechaRemateFinal = fechaRemateFinal.replace(/-/g, '/');
            fechaRemateFinal = new Date(fechaRemateFinal);
            // fechaRemateFinal.setHours(5,0,0,0);
        }

        logger.info(`
            Direccion: ${direccion}, 
            Rol: ${rol}, 
            Fecha Remate: ${fechaRemateFinal},
            Tribunal: ${tribunal}, 
            Precio: ${precioNumerico},
            src: ${src},
            Latitud: ${latitud},
            Longitud: ${longitud}
            linkMaps: ${linkMaps}
            labels: ${comuna} - ${region}
            dia Entrega: ${diaEntrega}
            tipoJuez: ${tipoJuez}
            tipoDerecho: ${tipoDerecho}
            `);


        let juzgado = tribunal;
        if(tipoJuez.includes('partidor')){
            juzgado = 'Juez Partidor';
        }

        
        const caso = new CasoBuilder(new Date(), null, null)
            .conDireccion(direccion)
            .conCausa(rol)
            .conFechaRemate(new Date(fechaRemateFinal))
            .conJuzgado(juzgado)
            .conMontoMinimo(precioNumerico)
            .conMoneda('Pesos')
            .conLinkMap(linkMaps)
            .conComuna(comuna)
            .conTipoDerecho(tipoDerecho)
            .conFormatoEntrega(modoEntrega)
            .conDiaEntrega(diaEntrega)
            .construir();
            // const caso = 'a'
        

        // console.log(`Caso : ${caso}`)
        // logger.info(`caso: ${caso}`)
        // logger.info(`Caso construido: ${JSON.stringify(caso.toObject(),null,2)}`);
        

        return caso;

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




module.exports = CapitalRemates;