const { chromium,  } = require('playwright-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { devices } = require('playwright');

// Aplicar el plugin stealth a Playwright
chromium.use(StealthPlugin());

class PlaywrightManager {
    constructor() {
        this.browser = null;
        this.isConnecting = false;
        // Lista de User-Agents reales (actualizados a 2025)
        this.userAgents = [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2.1 Safari/605.1.15',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:122.0) Gecko/20100101 Firefox/122.0',
            'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        ];
        // Resoluciones comunes
        this.viewports = [
            { width: 1366, height: 768 },
            { width: 1920, height: 1080 },
            { width: 1536, height: 864 },
            { width: 1440, height: 900 }
        ];
    }

    /**
     * Obtiene una instancia del navegador (singleton con reconexión automática)
     */
    async getBrowser() {
        // Si ya existe y está conectado, lo devolvemos
        if (this.browser && this.browser.isConnected()) {
            return this.browser;
        }

        // Si hay una conexión en curso, esperamos a que termine
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
            // Configurar opciones del navegador anti-detección
            const launchOptions = {
                headless: false,          // Recomendado: false evita muchas detecciones
                args: [
                    '--disable-blink-features=AutomationControlled',
                    '--disable-dev-shm-usage',
                    '--no-sandbox',
                    '--disable-web-security',
                    '--disable-features=IsolateOrigins,site-per-process',
                    '--disable-site-isolation-trials',
                    '--disable-features=BlockInsecurePrivateNetworkRequests',
                    '--disable-features=OutOfBlinkCors',
                    '--disable-gpu',
                    '--disable-software-rasterizer',
                    '--disable-extensions',
                    '--disable-setuid-sandbox',
                    '--disable-infobars',
                    '--window-position=0,0',
                    '--ignore-certificate-errors',
                    '--ignore-certificate-errors-spki-list',
                    '--disable-background-timer-throttling',
                    '--disable-backgrounding-occluded-windows',
                    '--disable-renderer-backgrounding'
                ],
                ignoreDefaultArgs: ['--enable-automation'],
                timeout: 60000
            };

            // Lanzar el navegador con Playwright + Stealth
            this.browser = await chromium.launch(launchOptions);

            // Limpiar banderas de automatización visibles
            const contextOptions = await this._getHumanContextOptions();
            const defaultContext = await this.browser.newContext(contextOptions);
            
            // Reemplazar el contexto por defecto (el que se crea automáticamente)
            // Nota: Playwright crea un contexto predeterminado al lanzar el navegador.
            // Cerramos ese y usamos el nuestro con todas las opciones.
            const oldContexts = this.browser.contexts();
            for (const ctx of oldContexts) {
                await ctx.close();
            }
            // El nuevo contexto se usará para todas las páginas nuevas por defecto
            await this.browser.newContext(contextOptions);
            
            this.browser.on('disconnected', () => {
                console.log('Playwright browser desconectado');
                this.browser = null;
            });

            console.log('Navegador Playwright lanzado con protecciones anti-detección.');
            return this.browser;
        } catch (error) {
            console.error('Error lanzando Playwright con stealth:', error);
            throw error;
        } finally {
            this.isConnecting = false;
        }
    }

    /**
     * Crea un nuevo contexto de página con opciones humanizadas
     */
    async createHumanContext() {
        const browser = await this.getBrowser();
        const options = await this._getHumanContextOptions();
        return await browser.newContext(options);
    }

    /**
     * Configura opciones del contexto para imitar un usuario real
     */
    async _getHumanContextOptions() {
        const randomUA = this.userAgents[Math.floor(Math.random() * this.userAgents.length)];
        const randomViewport = this.viewports[Math.floor(Math.random() * this.viewports.length)];
        
        // Lista de idiomas (prioriza español de Chile)
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
            colorScheme: 'light',
            reducedMotion: 'no-preference',
            extraHTTPHeaders: {
                'Accept-Language': `${randomLanguage},${randomLanguage.split('-')[0]};q=0.9,en;q=0.8`,
                'Accept-Encoding': 'gzip, deflate, br',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                'Referer': 'https://www.google.com/',
                'Sec-Fetch-Dest': 'document',
                'Sec-Fetch-Mode': 'navigate',
                'Sec-Fetch-Site': 'none',
                'Upgrade-Insecure-Requests': '1'
            },
            // Ocultar el hecho de que usamos Playwright
            bypassCSP: true,
            javaScriptEnabled: true,
            ignoreHTTPSErrors: true
        };
    }

    /**
     * Cierra el navegador actual si está abierto
     */
    async closeBrowser() {
        if (this.browser && this.browser.isConnected()) {
            await this.browser.close();
            this.browser = null;
            console.log('Navegador Playwright cerrado correctamente.');
        }
    }

    /**
     * Verifica si el navegador está disponible y conectado
     */
    isBrowserAvailable() {
        return this.browser !== null && this.browser.isConnected();
    }

    /**
     * Renueva el User-Agent y viewport en un contexto existente (útil para rotar)
     */
    async randomizeContext(context) {
        const newUA = this.userAgents[Math.floor(Math.random() * this.userAgents.length)];
        const newViewport = this.viewports[Math.floor(Math.random() * this.viewports.length)];
        await context.setExtraHTTPHeaders({
            'User-Agent': newUA
        });
        await context.setViewportSize(newViewport);
    }
}

// Exportamos una única instancia (singleton)
module.exports = new PlaywrightManager();