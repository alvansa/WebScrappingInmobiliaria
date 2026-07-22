const { chromium, firefox, webkit } = require('playwright-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

// Aplicar el plugin stealth a Playwright con configuraciones específicas por motor
// const stealthChromium = StealthPlugin();

// const stealthFirefox = StealthPlugin();
// // Eliminar evasiones de Puppeteer/Chromium que chocan con Firefox
// stealthFirefox.enabledEvasions.delete('user-agent-override');
// stealthFirefox.enabledEvasions.delete('chrome.app');
// stealthFirefox.enabledEvasions.delete('chrome.csi');
// stealthFirefox.enabledEvasions.delete('chrome.loadTimes');
// stealthFirefox.enabledEvasions.delete('chrome.runtime');

// const stealthWebkit = StealthPlugin();
// stealthWebkit.enabledEvasions.delete('user-agent-override');

// chromium.use(stealthChromium);
// firefox.use(stealthFirefox);
// webkit.use(stealthWebkit);

class PlaywrightManager {
    constructor(browserType = chromium) {
        this.browserType = browserType; 
        this.browser = null;
        this.launchPromise = null;
        this.proxies = this._loadProxies();

        // Base de datos de User-Agents clasificados por motor
        this.userAgentsDb = {
            chromium: [
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
                'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            ],
            webkit: [
                'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2.1 Safari/605.1.15',
                'Mozilla/5.0 (iPad; CPU OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/605.1.15'
            ],
            firefox: [
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:122.0) Gecko/20100101 Firefox/122.0',
                'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:122.0) Gecko/20100101 Firefox/122.0'
            ]
        };

        this.viewports = [
            { width: 1366, height: 768 },
            { width: 1920, height: 1080 },
            { width: 1536, height: 864 },
            { width: 1440, height: 900 }
        ];
    }

    /**
     * Obtiene el nombre del motor actual (chromium, webkit, firefox)
     */
    _getBrowserName() {
        return typeof this.browserType.name === 'function' 
            ? this.browserType.name() 
            : 'chromium'; 
    }

    _loadProxies() {
        // Intenta parsear como JSON primero
        const proxyListEnv = process.env.PROXY_LIST;
        if (proxyListEnv) {
            try {
                return JSON.parse(proxyListEnv);
            } catch (error) {
                console.warn(`Error parseando PROXY_LIST como JSON, se usará el formato alternativo. ${error.message}`);
            }
        }

        // Fallback: servidores separados por coma con credenciales comunes
        const servers = process.env.PROXY_SERVERS ? process.env.PROXY_SERVERS.split(',').map(s => s.trim()) : [];
        const user = process.env.PROXY_USER || '';
        const password = process.env.PROXY_PASSWORD || '';
        return servers.map(server => ({
            server: server,
            username: user,
            password: password
        }));
    }

    _getRandomProxy() {
        if (!this.proxies || this.proxies.length === 0) {
            return null;
        }
        const choice = Math.floor(Math.random() * this.proxies.length);
        console.log(`Proxy elegida índice: ${choice}`);
        return this.proxies[choice];
    }

    async getBrowser() {
        if (this.browser && this.browser.isConnected()) {
            return this.browser;
        }

        // Manejo concurrente de inicialización mediante promesa reutilizable (evita bucles infinitos y race conditions)
        if (this.launchPromise) {
            return await this.launchPromise;
        }

        this.launchPromise = (async () => {
            try {
                const browserName = this._getBrowserName();
                const launchOptions = {
                    headless: false,
                    timeout: 60000,
                    args: []
                };

                // Configurar proxy solo si existe una URL de servidor válida
                const proxy = this._getRandomProxy() || (process.env.PROXY_SERVER ? {
                    server: process.env.PROXY_SERVER,
                    username: process.env.PROXY_USER,
                    password: process.env.PROXY_PASSWORD
                } : null);

                if (proxy && proxy.server) {
                    launchOptions.proxy = {
                        server: proxy.server,
                        username: proxy.username,
                        password: proxy.password
                    };
                }

                // Argumentos de evasión limpios para Chromium
                if (browserName === 'chromium') {
                    launchOptions.args = [
                        '--disable-blink-features=AutomationControlled',
                        '--no-sandbox',
                        '--disable-setuid-sandbox'
                    ];
                    launchOptions.ignoreDefaultArgs = ['--enable-automation'];
                }

                this.browser = await this.browserType.launch(launchOptions);

                this.browser.on('disconnected', () => {
                    console.log(`Navegador [${browserName}] desconectado`);
                    this.browser = null;
                });

                console.log(`Navegador [${browserName}] lanzado con éxito.`);
                return this.browser;
            } catch (error) {
                console.error('Error lanzando Playwright:', error);
                throw error;
            } finally {
                this.launchPromise = null;
            }
        })();

        return await this.launchPromise;
    }

    /**
     * Crea un nuevo contexto asegurándose de heredar las opciones stealth
     */
    async createHumanContext() {
        const browser = await this.getBrowser();
        const options = await this._getHumanContextOptions();
        const proxy = this._getRandomProxy();
        if(proxy && proxy.server){
            options.proxy = {
                server : proxy.server,
                username : proxy.username,
                password : proxy.password
            }
        }

        return await browser.newContext(options);
    }

    /**
     * Configura opciones adaptadas al tipo de navegador activo
     */
    async _getHumanContextOptions() {
        const browserName = this._getBrowserName();
        
        const uas = this.userAgentsDb[browserName] || this.userAgentsDb['chromium'];
        const randomUA = uas[Math.floor(Math.random() * uas.length)];
        
        const randomViewport = this.viewports[Math.floor(Math.random() * this.viewports.length)];

        return {
            userAgent: randomUA,
            viewport: randomViewport,
            deviceScaleFactor: 1,
            isMobile: false,
            hasTouch: false,
            locale: 'es-CL',
            timezoneId: 'America/Santiago',
            permissions: ['geolocation', 'notifications'],
            extraHTTPHeaders: {
                'Accept-Language': 'es-CL,es;q=0.9,en;q=0.8',
                'Accept-Encoding': 'gzip, deflate, br',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                'Referer': 'https://www.google.com/',
                'Upgrade-Insecure-Requests': '1'
            },
            bypassCSP: true,
            javaScriptEnabled: true,
            ignoreHTTPSErrors: true
        };
    }

    async closeBrowser() {
        if (this.browser && this.browser.isConnected()) {
            await this.browser.close();
            this.browser = null;
            console.log('Navegador cerrado correctamente.');
        }
    }
}

// Exportamos singleton por defecto y también la clase y motores para usos personalizados
const defaultInstance = new PlaywrightManager(chromium);

defaultInstance.PlaywrightManager = PlaywrightManager;
defaultInstance.chromium = chromium;
defaultInstance.firefox = firefox;
defaultInstance.webkit = webkit;

module.exports = defaultInstance;
module.exports.PlaywrightManager = PlaywrightManager;
module.exports.chromium = chromium;
module.exports.firefox = firefox;
module.exports.webkit = webkit;