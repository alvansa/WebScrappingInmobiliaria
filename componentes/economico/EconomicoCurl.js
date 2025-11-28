const axios = require('axios');
const cheerio = require('cheerio');
const { HttpsProxyAgent } = require('https-proxy-agent');
const { HttpProxyAgent } = require('http-proxy-agent');

class EconomicoAxios {
    constructor() {
        this.proxyList = [
        ]
        this.currentProxyIndex = 0;
        this.axiosInstance = null;
        this.setupAxios();
    }
    setupAxios() {
        this.axiosInstance = axios.create({
            timeout: 30000,
            headers: this.getRandomHeaders()
        });
    }
    getRandomHeaders() {
        const userAgents = [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        ];

        return {
            'User-Agent': userAgents[Math.floor(Math.random() * userAgents.length)],
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

    getNextProxy() {
        const proxy = this.proxyList[this.currentProxyIndex];
        console.log(`index ${this.currentProxyIndex} y proxy ${proxy.host}`)
        this.currentProxyIndex = (this.currentProxyIndex + 1) % this.proxyList.length;
        return proxy;
    }

    createProxyAgent(proxyUrl) {
        try {
            // if (proxyUrl.startsWith('https')) {
                // return new HttpsProxyAgent({host: proxyUrl.host, port: proxyUrl.port, auth: proxyUrl.auth});
                return new HttpProxyAgent(proxyUrl)
            // } else {
                // return new HttpProxyAgent(proxyUrl);
            // }
        } catch (error) {
            console.error('Error creando proxy agent:', error);
            return null;
        }
    }
    async getPageDescription(url, maxRetries = 3) {
        let attempt = 0;
        let proxy = 'a@1';
        let agent = null;
        
        while(attempt < maxRetries) {
            // proxy = this.getNextProxy();
            // agent = this.createProxyAgent(proxy);
            try {
                // Rotar User-Agent periódicamente
                if (attempt > 0) {
                    await this.rotateUserAgent();
                }

                console.log(`🔁 Intento ${attempt + 1}/${maxRetries} - Proxy: ${proxy}`);

                const config = {
                    url: url,
                    method: 'GET',
                    timeout: 25000,
                    headers: this.getRandomHeaders(),
                    // httpsAgent: agent,
                    // httpAgent: agent,
                    validateStatus: function (status) {
                        return status >= 200 && status < 300; // Solo respuestas OK
                    }
                };

                const response = await this.axiosInstance.request(config);
                
                // // const response = await this.axiosInstance.get(url);
                const $ = cheerio.load(response.data);
                
                const description = $('div#description p').text().trim();
                
                if (!description) {
                    throw new Error('Descripción no encontrada en el HTML');
                }
                
                console.log("Descripción obtenida exitosamente");
                return description;

            } catch (error) {
                console.error(`Error en intento ${attempt + 1}:`, error.message);
                
                if (error.response && error.response.status === 503) {
                    const backoffTime = Math.pow(2, attempt) * 2000;
                    console.log(`Esperando ${backoffTime/1000} segundos...`);
                    await delay(backoffTime);
                    attempt++;
                } else {
                    return null;
                }
            }
        }
        
        return null;
    }

    async rotateUserAgent() {
        const randomUA = listUserAgents[Math.floor(Math.random() * listUserAgents.length)];
        this.axiosInstance.defaults.headers['User-Agent'] = randomUA;
        console.log(`User-Agent rotado: ${randomUA.substring(0, 50)}...`);
    }

    // PARA PÁGINAS PRINCIPALES (lista de casos)
    async extractCasesFromList(url) {
        try {
            const response = await this.axiosInstance.get(url);
            const $ = cheerio.load(response.data);
            
            const casos = [];
            
            $(SELECTORS.CASO_BLOQUE_SELECTOR).each((index, element) => {
                const $element = $(element);
                const link = $element.find('div.col2.span6 a').attr('href');
                const fechaPublicacion = $element.find('time.timeago').attr('datetime');
                
                if (link && fechaPublicacion) {
                    casos.push({
                        link: this.urlBase + link,
                        fechaPublicacion: new Date(fechaPublicacion),
                        announcement: link
                    });
                }
            });
            
            return casos;
        } catch (error) {
            console.error('Error extrayendo casos:', error);
            return [];
        }
    }

}

// async function  main(){
//     const ec = new EconomicoAxios();
//     const des = await ec.getPageDescription('https://www.economicos.cl/remates/clasificados-remates-cod48444016.html')
//     console.log(des)
// }
// main();
module.exports = EconomicoAxios;