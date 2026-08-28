require("dotenv").config();
const comunas = require("./comunas");
const { normalizeText } = require("#utils/textNormalizers.js");
const logger = require("#utils/logger.js");
const { ProxyAgent } = require("undici");
const { delay } = require("#utils/delay.js");

const DEFAULT_UA =
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
    "(KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36";

class dataInmobiliaria {
    /*
     * devuelve un numero con la cantidad de metros utiles.
     * @{comuna} string con el nombre de la comuna, puede tener o no tilde, mayuscula o minuscula.
     * @{rol} string con el formato 'manzana-predio', ejemplo '3800-185'
     */

    static async obtainData(comuna, rol){
        const parameters = this.parseParamenters(comuna, rol);
        const codComuna = parameters[0];
        const manzana = parameters[1];
        const predio = parameters[2];

        const linkData = `https://datainmobiliaria.cl/reports/detalle_propiedad?cod_com=${codComuna}&cod_mz=${manzana}&cod_pr=${predio}`;

        try{

            const data = await this.fetchApi(codComuna, manzana, predio);

            const metros = await this.obtenerMetrosTotales(data,rol);

            const linkMap = await this.obtenerLinkMap(data);
            
            return {
                'metros': metros,
                'linkMap': linkMap,
                'linkData': linkData
            }

        }catch(error){
            logger.error(`DataInmobiliaria: Error obteniendo datos para comuna ${comuna} y rol ${rol}: ${error.message}`);
            return {
                metros: null,
                linkMap: null,
                linkData: linkData
            };
        }
    }

    static parseParamenters(comuna, rol){
        const normalizedComuna = this.normalizeComuna(comuna);
        const codeComuna = this.getCodeComuna(normalizedComuna);
        const [manzana, predio] = rol.split("-");
        return [codeComuna, manzana, predio];
    }
    /*
        devuelve un string con la forma 'metros utiles - metros superficie - metros totales'
    */
    static async obtenerMetrosTotales(data) {
        let metrosUtiles = null;
        let metrosTerreno = null;
        if (data.detalle_construccion) {
            for (let singleData of data.detalle_construccion) {
                metrosUtiles += singleData.superficie_m2;
            }
        }
        if (data.superficie_terreno_m2) {
            metrosTerreno = data.superficie_terreno_m2;
        }

        if (metrosUtiles && metrosTerreno) {
            return `${metrosUtiles}-${metrosTerreno}`;
        } else if (metrosUtiles) {
            return `${metrosUtiles} utiles`;
        } else if (metrosTerreno) {
            return `${metrosTerreno} terreno`;
        }
    }

    static async obtenerLinkMap(data) {
        if (data.latitud && data.longitud) {
            const latitud = data.latitud;
            const longitud = data.longitud;
            const linkMap = `https://www.google.com/maps?q=${latitud},${longitud}`;
            return linkMap;
        }
        return null;
    }

    /*
     * Cabeceras para autenticar la request como un usuario logueado.
     * DATAINMOBILIARIA_COOKIE en .env debe contener el/los cookie(s) de sesión,
     * como mínimo `remember_user_token=...` (token "remember me" de larga duración).
     * Se copia tal cual del DevTools -> Network -> Request Headers -> cookie.
     */
    static _buildHeaders(codComuna, manzana, predio) {
        const headers = {
            accept: "application/json",
            "user-agent": process.env.DATAINMOBILIARIA_UA || DEFAULT_UA,
            referer: `https://datainmobiliaria.cl/reports/detalle_propiedad?cod_com=${codComuna}&cod_mz=${manzana}&cod_pr=${predio}`,
        };
        const cookie = process.env.DATAINMOBILIARIA_COOKIE;
        if (cookie) {
            headers.cookie = cookie.trim();
        } else {
            logger.warn("DataInmobiliaria: falta DATAINMOBILIARIA_COOKIE en .env; la API responderá 402 (cuota de invitado).");
        }
        return headers;
    }

    static async fetchApi(codComuna, manzana, predio) {
        const url = `https://datainmobiliaria.cl/reports/detalle_propiedad_data_mongo?cod_com=${codComuna}&cod_mz=${manzana}&cod_pr=${predio}`;
        const headers = this._buildHeaders(codComuna, manzana, predio);
        // const intentos = Math.max(this._loadProxies().length, 1);
        const intentos = 3; // limitar a 3 intentos para no demorar demasiado

        for (let i = 0; i < intentos; i++) {
            const dispatcher = this._nextProxyAgent();
            try {
                const response = await fetch(url, {
                    headers,
                    redirect: "manual",
                    signal: AbortSignal.timeout(20000),
                    ...(dispatcher ? { dispatcher } : {}),
                });

                // 401/402/redirección a login => problema de credenciales, no de proxy: no reintentar
                if (response.status === 401 || response.status === 402 || (response.status >= 300 && response.status < 400)) {
                    logger.error(`DataInmobiliaria: sesión inválida o cuota agotada (HTTP ${response.status}) rol ${manzana}-${predio}. Renueva DATAINMOBILIARIA_COOKIE.`);
                    return null;
                }

                const ct = response.headers.get("content-type") || "";
                if (!response.ok || !ct.includes("json")) {
                    logger.warn(`DataInmobiliaria: respuesta inesperada (HTTP ${response.status}, ${ct}) intento ${i + 1}/${intentos} rol ${manzana}-${predio}`);
                    await delay(1000);
                    continue; // 5xx / bloqueo del proxy => rota al siguiente
                }

                const dataBase = await response.json();
                return dataBase && dataBase.data ? dataBase.data : null;
            } catch (error) {
                logger.warn(`DataInmobiliaria: intento ${i + 1}/${intentos} falló (rol ${manzana}-${predio}): ${error.message}`);
                await delay(1000);
            }
        }
        return null;
    }

    static getCodeComuna(comuna) {
        const comunaNormalized = this.normalizeComuna(comuna);
        return comunas[comunaNormalized];
    }

    static normalizeComuna(comuna) {
        const normalizedComuna = normalizeText(comuna).toUpperCase();

        return normalizedComuna;
    }

    // --- proxies: misma convención que PlaywrightManager ---
    static _loadProxies() {
        if (this._proxies) return this._proxies;
        let list = [];
        if (process.env.PROXY_LIST) {
            try { list = JSON.parse(process.env.PROXY_LIST); }
            catch (e) { logger.warn(`DataInmobiliaria: PROXY_LIST inválido: ${e.message}`); }
        }
        if (list.length === 0 && process.env.PROXY_SERVERS) {
            const username = process.env.PROXY_USER || "";
            const password = process.env.PROXY_PASSWORD || "";
            list = process.env.PROXY_SERVERS.split(",").map(s => ({ server: s.trim(), username, password }));
        }
        this._proxies = list;
        this._proxyIndex = 0;
        this._agentCache = new Map(); // evita fugas de sockets: 1 agente por proxy
        return list;
    }

    static _nextProxyAgent() {
        const proxies = this._loadProxies();
        if (!proxies.length) return undefined;
        const p = proxies[this._proxyIndex % proxies.length];
        this._proxyIndex++;

        if (this._agentCache.has(p.server)) return this._agentCache.get(p.server);
        const uri = p.server.includes("://") ? p.server : `http://${p.server}`;
        const opts = { uri };
        if (p.username) {
            opts.token = "Basic " + Buffer.from(`${p.username}:${p.password}`).toString("base64");
        }
        const agent = new ProxyAgent(opts);
        this._agentCache.set(p.server, agent);
        return agent;
    }

}

module.exports = dataInmobiliaria;
