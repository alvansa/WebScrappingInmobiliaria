
class PupperteerManager{
    constructor(){
        this.browser = null;
        this.isConnecting = false;
    }
    
    async getBrowser(){
        if (this.browser && this.browser.isConnected()) {
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

module.exports = PupperteerManager