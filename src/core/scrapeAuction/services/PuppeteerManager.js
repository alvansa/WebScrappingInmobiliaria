const pie = require('puppeteer-in-electron');
const {app, session} = require('electron');

// 1. Importamos puppeteer-extra en lugar del core directamente
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

// 2. Vinculamos puppeteer-core como el lanzador base para evitar conflictos en Electron
puppeteer.vanillaLauncher = require('puppeteer-core');

// 3. Ahora sí, registramos el plugin de camuflaje
puppeteer.use(StealthPlugin());

class PupperteerManager{
    constructor(proxyOptions){
        this.browser = null;
        this.isConnecting = false;
        this.proxyOptions = proxyOptions;
    }

    async setProxy(proxyOptions) {
        this.proxyOptions = proxyOptions;
        if (this.browser && this.browser.isConnected()) {
            // Aplicar cambio en caliente si ya hay conexión
            await session.defaultSession.setProxy(proxyOptions);
        }
    }
    
    async getBrowser(){
        if (this.browser && this.browser.isConnected()) {
            return this.browser;
        }

        // Evitar llamadas concurrentes que intenten crear varias conexiones
        if (this.isConnecting) {
            // Esperar a que termine la conexión en curso
            await new Promise(resolve => {
                const checkInterval = setInterval(() => {
                    if (!this.isConnecting && this.browser && this.browser.isConnected()) {
                        clearInterval(checkInterval);
                        resolve();
                    }
                }, 100);
            });
            return this.browser;
        }

        this.isConnecting = true;
        
        try {
            if (this.proxyOptions) {
                await session.defaultSession.setProxy(this.proxyOptions);
                console.log('Proxy configurado:', this.proxyOptions);
            }
            // Conectar Puppeteer con la aplicación Electron
            this.browser = await pie.connect(app, puppeteer);
            // Opcional: escuchar evento cuando el browser se cierre para limpiar referencia
            this.browser.on('disconnected', () => {
                console.log('Puppeteer browser disconnected');
                this.browser = null;
            });
            return this.browser;
        } catch (error) {
            console.error('Error conectando Puppeteer con Electron:', error);
            throw error;
        } finally {
            this.isConnecting = false;
        }
    }

    async closeBrowser(){
        if (this.browser && this.browser.isConnected()) {
            await this.browser.close();
            this.browser = null;
        }
    }

    isBrowserAvailable() {
        return this.browser !== null && this.browser.isConnected();
    }

}

module.exports = new PupperteerManager({
});