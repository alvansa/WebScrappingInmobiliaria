const pie = require('puppeteer-in-electron');
const {app} = require('electron');
const puppeteer = require('puppeteer-core');

class PupperteerManager{
    constructor(){
        this.browser = null;
        this.isConnecting = false;
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

module.exports = new PupperteerManager();