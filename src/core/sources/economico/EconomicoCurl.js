require('dotenv').config();
const axios = require('axios');
const cheerio = require('cheerio');
const { HttpsProxyAgent } = require('https-proxy-agent');
const logger = require('#utils/logger.js');

const {delay} = require('#utils/delay.js');
const listUserAgents = require('#utils/userAgents.json');


const SELECTORS =
{
    'NEXT_PAGE_SELECTOR': '.paginador a i.icon-step-forward',
    'CASO_BLOQUE_SELECTOR': 'div.result.row-fluid',
    'ELEMENTO_TEXTO': 'div.col2 a h3',
    'ELEMENTO_LINK' : 'div.col2 a',
}

const URL_BASE = 'https://www.economicos.cl';

class EconomicoAxios {
    constructor() {
        this.proxyList = this._loadProxies();
        this.currentProxyIndex = 0;
        this._agentCache = new Map(); // 1 agente por proxy, evita fugas de sockets
        this.axiosInstance = null;
        this.setupAxios();

        // economicos.cl responde 200 a una conexión directa (IP residencial CL)
        // pero 403 a las proxies datacenter de PROXY_LIST (bloqueo por ASN).
        // Por eso: 'fallback' = directo primero y proxy solo si el directo falla.
        // 'always' = siempre proxy | 'never' = nunca proxy.
        this.proxyMode = process.env.ECONOMICOS_PROXY_MODE || 'fallback';
    }

    // --- proxies: misma convención que PlaywrightManager / dataInmobiliaria ---
    // PROXY_LIST = JSON [{ server, username, password }, ...]
    // o bien PROXY_SERVERS = "host:port,host:port" + PROXY_USER + PROXY_PASSWORD
    _loadProxies() {
        let list = [];
        if (process.env.PROXY_LIST) {
            try {
                list = JSON.parse(process.env.PROXY_LIST);
            } catch (e) {
                logger.warn(`EconomicoCurl: PROXY_LIST inválido: ${e.message}`);
            }
        }
        if (list.length === 0 && process.env.PROXY_SERVERS) {
            const username = process.env.PROXY_USER || '';
            const password = process.env.PROXY_PASSWORD || '';
            list = process.env.PROXY_SERVERS.split(',')
                .map(s => s.trim())
                .filter(Boolean)
                .map(server => ({ server, username, password }));
        }
        if (list.length === 0) {
            logger.warn('EconomicoCurl: sin proxies configuradas, se harán las requests directas.');
        } else {
            logger.debug(`EconomicoCurl: ${list.length} proxies cargadas.`);
        }
        return list;
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
        if (this.proxyList.length === 0) return null;
        const proxy = this.proxyList[this.currentProxyIndex];
        this.currentProxyIndex = (this.currentProxyIndex + 1) % this.proxyList.length;
        return proxy;
    }

    createProxyAgent(proxy) {
        if (!proxy) return null;
        try {
            const raw = String(proxy.server);
            const base = raw.includes('://') ? raw : `http://${raw}`;

            if (this._agentCache.has(base)) {
                return this._agentCache.get(base);
            }

            let proxyUrl = base;
            if (proxy.username) {
                const u = new URL(base);
                u.username = encodeURIComponent(proxy.username);
                u.password = encodeURIComponent(proxy.password || '');
                proxyUrl = u.toString();
            }

            const agent = new HttpsProxyAgent(proxyUrl);
            this._agentCache.set(base, agent);
            return agent;
        } catch (error) {
            logger.error(`Error creando proxy agent: ${error.message}`);
            return null;
        }
    }

    // Decide si el intento actual va directo o por proxy y devuelve
    // { agents, viaProxy }. attempt===0 va directo salvo modo 'always'.
    getRequestAgents(attempt = 0) {
        const wantProxy =
            this.proxyMode === 'always' ||
            (this.proxyMode === 'fallback' && attempt > 0);

        if (!wantProxy || this.proxyMode === 'never') {
            console.log('🔗 Request directa (sin proxy)');
            return { agents: {}, viaProxy: false };
        }

        const proxy = this.getNextProxy();
        const agent = this.createProxyAgent(proxy);
        if (!agent) {
            console.log('🔗 Sin proxies disponibles, request directa');
            return { agents: {}, viaProxy: false };
        }
        console.log(`🌐 Usando proxy ${proxy.server}`);
        return { agents: { httpAgent: agent, httpsAgent: agent }, viaProxy: true };
    }

    // El sitio movió todo bajo /search/ (ago-2026). Reescribe enlaces con el
    // esquema viejo para que sigan funcionando aunque vengan cacheados.
    _normalizeUrl(url) {
        if (!url) return url;
        return url
            .replace('economicos.cl/remates/clasificados-remates-cod',
                     'economicos.cl/search/remates/clasificados-remates-cod')
            .replace('economicos.cl/todo_chile/remates_de_propiedades_el_mercurio',
                     'economicos.cl/search/remates/el-mercurio/0')
            .replace(/economicos\.cl\/todo_chile\/remates(?!\/)/,
                     'economicos.cl/search/remates/0');
    }

    async getPageDescription(url, maxRetries = 3) {
        let attempt = 0;
        url = this._normalizeUrl(url);

        while(attempt < maxRetries) {
            const { agents, viaProxy } = this.getRequestAgents(attempt);
            try {
                // Rotar User-Agent periódicamente
                if (attempt > 0) {
                    await this.rotateUserAgent();
                }

                console.log(`🔁 Intento ${attempt + 1}/${maxRetries}`);

                const config = {
                    url: url,
                    method: 'GET',
                    timeout: 25000,
                    headers: this.getRandomHeaders(),
                    ...agents,
                    proxy: false, // desactiva la detección de proxy por env de axios; usamos los agents
                    validateStatus: function (status) {
                        return status >= 200 && status < 300; // Solo respuestas OK
                    }
                };

                const response = await this.axiosInstance.request(config);

                const $ = cheerio.load(response.data);

                const description = $('div#description p').text().trim();

                if (!description) {
                    throw new Error('Descripción no encontrada en el HTML');
                }

                console.log("Descripción obtenida exitosamente");
                return description;

            } catch (error) {
                console.error(`Error en intento ${attempt + 1}:`, error.message);

                const status = error.response && error.response.status;

                // 404 => la URL no existe (o cambió el esquema): no reintentar.
                if (status === 404) {
                    console.error(`URL inexistente (HTTP 404) — revisar esquema /search/: ${url}`);
                    return null;
                }
                // 403 directo => nginx rechaza la ruta (esquema de URL viejo): no reintentar.
                // 403 por proxy => la IP del proxy está bloqueada por ASN: rota a la siguiente.
                if (status === 403 && !viaProxy) {
                    console.error(`URL rechazada (HTTP 403 directo) — revisar esquema /search/: ${url}`);
                    return null;
                }

                const retryable = status === 403 || status === 503 || status === 429 || !status;

                if (retryable) {
                    const backoffTime = Math.pow(2, attempt) * 2000;
                    console.log(`Esperando ${backoffTime/1000}s y ${viaProxy ? 'rotando proxy' : 'pasando a proxy'}...`);
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
    async extractCasesFromList(url, maxRetries = 3) {
        url = this._normalizeUrl(url);
        for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            const { agents } = this.getRequestAgents(attempt);
            const response = await this.axiosInstance.request({
                url,
                method: 'GET',
                headers: this.getRandomHeaders(),
                ...agents,
                proxy: false,
                validateStatus: (s) => s >= 200 && s < 300
            });
            const $ = cheerio.load(response.data);

            const casos = [];

            $(SELECTORS.CASO_BLOQUE_SELECTOR).each((index, element) => {
                const $element = $(element);
                const link = $element.find(SELECTORS.ELEMENTO_LINK).attr('href');

                // Fecha de publicación: <ul.meta> "Publicado el: 2026-08-28"
                let fechaPublicacion = null;
                $element.find('ul.meta li').each((i, li) => {
                    const txt = $(li).text();
                    if (/public/i.test(txt)) {
                        const match = txt.match(/(\d{4}-\d{2}-\d{2})/);
                        if (match) fechaPublicacion = new Date(match[1].replace(/-/g, '/'));
                    }
                });

                if (link && fechaPublicacion) {
                    casos.push({
                        link: link.startsWith('http') ? link : URL_BASE + link,
                        fechaPublicacion,
                        announcement: link
                    });
                }
            });

            return casos;
        } catch (error) {
            const status = error.response && error.response.status;
            console.error(`Error extrayendo casos (intento ${attempt + 1}/${maxRetries}, HTTP ${status || error.code || error.message}): ${url}`);
            if (status === 404) return [];
            await delay(Math.pow(2, attempt) * 2000);
        }
        }
        return [];
    }

}

module.exports = EconomicoAxios;
