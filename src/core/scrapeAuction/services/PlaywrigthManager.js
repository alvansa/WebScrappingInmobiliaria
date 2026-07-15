const { chromium, firefox, webkit  } = require('playwright-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { devices } = require('playwright');

// Aplicar el plugin stealth a Playwright
// webkit.use(StealthPlugin());

class PlaywrightManager {
    // 1. Pasamos el tipo de navegador al constructor para saber cómo actuar
    constructor(browserType) {
        this.browserType = browserType; 
        this.browser = null;
        this.isConnecting = false;

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
        return this.browserType.name(); 
    }

    async getBrowser() {
        if (this.browser && this.browser.isConnected()) {
            return this.browser;
        }

        if (this.isConnecting) {
            await new Promise(resolve => {
                const interval = setInterval(() => {
                    if (!this.isConnecting && this.browser && this.browser.isConnected()) {
                        clearInterval(interval);
                        resolve();
                    }
                }, 100);
            });
            return this.browser;
        }

        this.isConnecting = true;

        try {
            const browserName = this._getBrowserName();
            const launchOptions = {
                headless: false,
                timeout: 60000,
                args: []
            };

            // 2. Aplicar argumentos de evasión SOLO si el navegador es Chromium
            if (browserName === 'chromium') {
                launchOptions.args = [
                    '--disable-blink-features=AutomationControlled',
                    '--disable-dev-shm-usage',
                    '--no-sandbox',
                    '--disable-web-security',
                    '--disable-features=IsolateOrigins,site-per-process',
                    '--disable-site-isolation-trials',
                    '--disable-gpu',
                    '--disable-extensions'
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
            this.isConnecting = false;
        }
    }

    /**
     * Crea un nuevo contexto asegurándose de heredar las opciones stealth
     */
    async createHumanContext() {
        const browser = await this.getBrowser();
        const options = await this._getHumanContextOptions();
        return await browser.newContext(options);
    }

    /**
     * Configura opciones adaptadas al tipo de navegador activo
     */
    async _getHumanContextOptions() {
        const browserName = this._getBrowserName();
        
        // 3. Selecciona un User Agent que COINCIDA con el motor de renderizado
        const uas = this.userAgentsDb[browserName] || this.userAgentsDb['chromium'];
        const randomUA = uas[Math.floor(Math.random() * uas.length)];
        
        const randomViewport = this.viewports[Math.floor(Math.random() * this.viewports.length)];
        const languages = ['es-CL', 'es-ES', 'es', 'en-US', 'en'];
        const randomLanguage = languages[Math.floor(Math.random() * languages.length)];

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
                'Accept-Language': `${randomLanguage},${randomLanguage.split('-')[0]};q=0.9,en;q=0.8`,
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

// Exportamos una única instancia (singleton)
module.exports = new PlaywrightManager(webkit);