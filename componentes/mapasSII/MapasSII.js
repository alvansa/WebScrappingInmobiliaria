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
        console.log("Rellenando manzana");
        const selectorManzana = 'input[data-ng-model="manzana"]';
        await this.page.waitForSelector(selectorManzana);
        await this.page.type(selectorManzana, this.manzana);
        console.log("Rellenando predio");
        const selectorPredio = 'input[data-ng-model="predio"]';
        await this.page.waitForSelector(selectorPredio);
        await this.page.type(selectorPredio, this.predio);
        await this.completarComuna();
        await this.page.click('button[data-ng-click="validaBusqueda()"]');
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

    async completarComuna() {
        console.log("Rellenando comuna");
        const selectorComuna = 'input[data-ng-model="nombreComuna"]';
        await this.page.waitForSelector(selectorComuna);
        console.log("aparecio el selector ", this.comuna);
        await this.page.focus(selectorComuna);
        await this.page.type(selectorComuna,"MAIP");
        // await this.page.type(selectorComuna, this.comuna, { delay: 100 });
        // await this.page.keyboard.type("MAI", { delay: 100 });
        // await this.page.type(selectorComuna, this.comuna, { delay: 100 });
        const char = await this.page.evaluate(() => {
            const input = document.querySelector('input[data-ng-model="nombreComuna"]');
            return input;
        });
        console.log("se relleno con", char); // Verifica que el elemento sea el correcto
        // await this.page.waitForSelector('#typeahead-28-8094-option-1'); // Asegúrate de que el ID coincida con la opción que quieres seleccionar
        // await this.page.click('#typeahead-28-8094-option-1');
        // await this.page.type(selectorComuna, this.comuna);
        // await this.page.evaluate((comuna) => {
        //     const comunaInput = document.querySelector('input[data-ng-model="nombreComuna"]');
        //     comunaInput.value = 'MAIPÚ'; // Escribir directamente en el campo
        //     comunaInput.dispatchEvent(new Event('input', { bubbles: true })); // Disparar el evento input
        // },this.comuna);
        // console.log("se relleno la comuna");
        // const dropdownComuna = "ul.dropdown-menu";
        // await this.page.waitForSelector(dropdownComuna, { visible: true });
        // await page.keyboard.press('ArrowDown'); // Navegar a la primera opción
        // await page.keyboard.press('Enter'); // Seleccionar la opción
        // console.log("aparecio el dropdown");
        // const optionSelectorComuna = "ul.dropdown-menu li";
        // await this.page.waitForSelector(optionSelectorComuna);
        // await this.page.click(optionSelectorComuna);

    }
}


function delay(time) {
    return new Promise(function (resolve) {
        setTimeout(resolve, time)
    });
}


module.exports = MapasSII;