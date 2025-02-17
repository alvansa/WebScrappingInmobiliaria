const puppeteer = require('puppeteer');

class MapasSII {
    constructor(comuna, manzana, predio) {
        this.URL = 'https://www4.sii.cl/mapasui/internet/#/contenido/index.html';
        this.comuna = comuna;
        this.manzana = manzana;
        this.predio = predio;
    }

    async obtainDataOfCause() {
        this.browser = await puppeteer.launch({ headless: false });
        this.page = await this.browser.newPage();
        await this.entryPage();
        console.log("Rellenando comuna");
        const selectorComuna = 'input[data-ng-model="nombreComuna"]';
        await this.page.waitForSelector(selectorComuna);
        console.log("aparecio el selector ", this.comuna);
        await this.page.evaluate((comuna) => {
            const input = document.querySelector('input[data-ng-model="nombreComuna"]');
            if (input) {
                input.value = comuna; // Establecer el valor directamente
                // Disparar eventos de cambio para frameworks como AngularJS
                const event = new Event('input', { bubbles: true });
                input.dispatchEvent(event);
            }
        }, this.comuna);
        console.log("se relleno la comuna");
        let char = "";
        await this.page.evaluate((char) => {
            const input = document.querySelector('input[data-ng-model="nombreComuna"]');
            return input;
        });
        console.log("se relleno con", char); // Verifica que el elemento sea el correcto
        const dropdownComuna = "ul.dropdown-menu";
        await this.page.waitForSelector(dropdownComuna, { visible: true });
        console.log("aparecio el dropdown");
        const optionSelectorComuna = "ul.dropdown-menu li";
        await this.page.waitForSelector(optionSelectorComuna);
        await this.page.click(optionSelectorComuna);

        console.log("Rellenando manzana");
        await this.page.locator("data-ng-model='manzana'").fill(this.manzana);
        await this.page.locator("data-ng-model='predio'").fill(this.predio);
        await this.page.click("button.btn.btn-primary");
        console.log("Se hizo click Buscando");
        await delay(5000);
        await this.browser.close();
        return "Mapas";
    }

    async entryPage() {
        await this.page.goto(this.URL);
        await this.page.waitForSelector("div.col-xs-7 button.btn-lg");
        await this.page.click("div.col-xs-7 button.btn-lg");
        await this.page.waitForSelector(".glyphicon.glyphicon-search");
        await this.page.click(".glyphicon.glyphicon-search");

    }
}


function delay(time) {
    return new Promise(function (resolve) {
        setTimeout(resolve, time)
    });
}


module.exports = MapasSII;