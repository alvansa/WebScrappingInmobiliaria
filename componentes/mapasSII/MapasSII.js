const fs = require('fs');
const {app, BrowserWindow, ipcMain, dialog,electron} = require('electron');
const path = require('path');
const pie = require('puppeteer-in-electron');

const {delay} = require('../../utils/delay');

class MapasSII {
    constructor(page, browser) {
        this.URL = 'https://www4.sii.cl/mapasui/internet/#/contenido/index.html';
        this.page = page;
        this.browser = browser;
    }

    async init() {
        try{
            await this.entryPage();
        }catch (error) {
            console.error("Error al inicializar MapasSII:", error);
            throw error; // Re-throw the error to handle it in the calling function
        }
    }
    
    async Secondinit() {
        try{
            await this.entryPage2();
        }catch (error) {
            console.error("Error al inicializar MapasSII:", error);
            throw error; // Re-throw the error to handle it in the calling function
        }
    }

    async finishPage(){
        if(this.window && !this.window.isDestroyed()){
            this.window.destroy();
        }
    }

    async obtainDataOfCause(caso) {
        const comuna = caso.comuna;
        const [manzana, predio] = caso.getRolPropiedad();
        console.log("comuna: ", comuna, "manzana y predio: ", manzana, predio);
        if (!manzana || !predio || !comuna) {
            return null;
        }
        console.log("Rellenando formulario");
        // const predio = "12345678";
        const selectorManzana = 'input[data-ng-model="manzana"]';
        const selectorPredio = 'input[data-ng-model="predio"]';
        try {

            await this.clickSearchButton();
            await this.clearInput('#rolsearch input[data-ng-model="nombreComuna"]');
            await this.clearInput(selectorManzana);
            await this.clearInput(selectorPredio);

            await this.completarComuna(comuna);

            await this.page.waitForSelector(selectorManzana);
            await this.page.type(selectorManzana, manzana,{ delay: Math.random() * 45 });

            await this.page.waitForSelector(selectorPredio);
            await this.page.type(selectorPredio, predio, { delay: Math.random() * 45 });

            await this.page.click('button[data-ng-click="validaBusqueda()"]');
            console.log("Se hizo click Buscando");
            await this.obtainTotalValue(caso);
        } catch (error) {
            console.error("Error al obtener los datos de la propiedad", error);
            return;
        }    
    }

    async entryPage() {
        console.log("Navegando a la página de Mapas SII");
        const defaultUserAgents = [
            { userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' },
            { userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' }
        ];

        let userAgents;

        try {
            // Intenta cargar USER_AGENTS desde .env, si no existe usa los valores por defecto
            userAgents = process.env.USER_AGENTS ? JSON.parse(process.env.USER_AGENTS) : defaultUserAgents;
        } catch (error) {
            console.error('Error parsing USER_AGENTS from .env, using default agents:', error);
            userAgents = defaultUserAgents;
        }

        // Selecciona un User-Agent aleatorio
        const randomIndex = Math.floor(Math.random() * userAgents.length);
        await this.page.setUserAgent(userAgents[randomIndex].userAgent);

        await this.page.waitForSelector("div.col-xs-7 button.btn-lg");
        await this.page.click("div.col-xs-7 button.btn-lg");
    }

    async entryPage2() {
        console.log("Navegando a la página de Mapas SII");
        const defaultUserAgents = [
            // { userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' },
            // { userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' },
            { userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' },
            { userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1' },
            { userAgent: 'Mozilla/5.0 (iPad; CPU OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1' }
        ];

        let userAgents;

        try {
            // Intenta cargar USER_AGENTS desde .env, si no existe usa los valores por defecto
            userAgents = this.readUserAgents();
        } catch (error) {
            console.error('Error parsing USER_AGENTS from .env, using default agents:', error);
            userAgents = defaultUserAgents;
        }

        console.log("User Agents cargados: ", userAgents.length);
        // Selecciona un User-Agent aleatorio
        const randomIndex = Math.floor(Math.random() * userAgents.length);

        this.window = new BrowserWindow({ show: true });
        const url = 'https://www4.sii.cl/mapasui/internet/#/contenido/index.html';
        // const url = 'https://www.google.com/';

        await this.window.loadURL(url);
        this.page = await pie.getPage(this.browser, this.window);
        await this.page.setUserAgent(userAgents[randomIndex].userAgent);

        await this.page.waitForSelector("div.col-xs-7 button.btn-lg");
        await this.page.click("div.col-xs-7 button.btn-lg");
    }

    readUserAgents(){
        try{
            const filePath = path.join(__dirname, '../../utils/userAgents.json');

            if (!fs.existsSync(filePath)) {
                console.error('❌ Archivo data.json no encontrado en:', filePath);
            } else {
                console.log("El archivo si existe")
            }

            const data = fs.readFileSync(filePath, 'utf8');
            const arrayString = JSON.parse(data);
            return arrayString;
        }catch(error){
            console.error('Error reading USER_AGENTS from json:', error.message);
            return [];
        }
    }

    async clickSearchButton() {
        await this.page.waitForSelector(".glyphicon.glyphicon-search");
        await this.page.click(".glyphicon.glyphicon-search");
    }

    async completarComuna(comuna) {
        const selectorComuna = '#rolsearch input[data-ng-model="nombreComuna"]';
        await this.page.waitForSelector(selectorComuna);
        await this.page.focus(selectorComuna);
        const randomDelay = Math.random() * 100 + 100; // Delay entre 50 y 150 ms
        comuna = comuna.slice(0, -1); // Elimina el último caracter
        await this.page.type(selectorComuna, comuna, { delay: randomDelay});
        const dropdownComuna = "#rolsearch ul.dropdown-menu";
        await this.page.waitForSelector(dropdownComuna, { visible: true });
        await this.page.focus(dropdownComuna);
        await this.page.keyboard.press('Enter'); // Seleccionar la opción
    }

    async obtainTotalValue(caso) {
        const divResultado = "strong.col-xs-6 + div.col-xs-6 span.pull-right.ng-binding";
        const divError = "span.modal-title.ng-binding";
        const botonCerrar = "div.modal-footer.ng-scope button.btn.btn-warning";
        try {
            // busca el elemento de resultado o error
            await this.page.waitForSelector(`${divResultado},${divError}`);
            // Verificar si el mensaje de error está presente
            const errorElement = await this.page.$(divError);
            if (errorElement) {
                console.log("Elemnto fallido econtrado");
                const errorText = await this.page.evaluate(el => el.textContent, errorElement);
                if (errorText.includes("No se pudo encontrar")) {
                    console.log("La búsqueda falló:", errorText);
                    // Hacer clic en el botón de cerrar
                    const cerrarButton = await this.page.$(botonCerrar);
                    if (cerrarButton) {
                        await cerrarButton.click();
                        console.log("Botón de cerrar clickeado.");
                    } else {
                        console.log("No se encontró el botón de cerrar.");
                    }
                    caso.avaluoPropiedad = null; // O puedes asignar un valor por defecto
                    console.log("1");
                    delay(500);
                    return; // Salir de la función si hay un error
                }
            }
            //Si no encontro el erro, obtiene el valor total de la propiedad
            const avaluoTotal = await this.page.evaluate(() => {
                const element = document.querySelector("strong.col-xs-6 + div.col-xs-6 span.pull-right.ng-binding");
                return element ? element.innerText.replace(/\D/g, '') : null;
            });
            let coordenadas = await this.page.evaluate(() =>{
                const element = document.querySelector("#mapaid > div.leaflet-pane.leaflet-map-pane > div.leaflet-pane.leaflet-popup-pane > div > div.leaflet-popup-content-wrapper > div > font:nth-child(3) > center");
                return element ? element.innerText : null;
            });
            console.log("Coordenadas: ", coordenadas);
            if(coordenadas){
                coordenadas = coordenadas.replace(/\s+/g," ").trim();
            }

            caso.avaluoPropiedad = avaluoTotal;
            caso.coordenadas = coordenadas;
            delay(500);

        } catch (error) {
            console.error("Error al buscar el elemento:", error);
            caso.avaluoPropiedad = null;

        }
    }

    async clearInput(selector) {
        await this.page.evaluate((selector) => document.querySelector(selector).value = "", selector);
    }

}



module.exports = MapasSII;