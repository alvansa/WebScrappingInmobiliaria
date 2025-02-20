const puppeteer = require('puppeteer');
const fs = require('fs');

class MapasSII {
    constructor() {
        this.URL = 'https://www4.sii.cl/mapasui/internet/#/contenido/index.html';
    }

    async Initialize() {
        this.browser = await puppeteer.launch({ headless: false });
        this.page = await this.browser.newPage();
        await this.entryPage();
    }

    async obtainDataOfCause(comuna, manzana, predio) {
        await this.clickSearchButton();
        await this.completarComuna(comuna);
        console.log("Rellenando manzana");
        const selectorManzana = 'input[data-ng-model="manzana"]';
        await this.page.waitForSelector(selectorManzana);
        await this.page.type(selectorManzana, manzana);
        console.log("Rellenando predio");
        const selectorPredio = 'input[data-ng-model="predio"]';
        await this.page.waitForSelector(selectorPredio);
        await this.page.type(selectorPredio, predio);
        await this.page.click('button[data-ng-click="validaBusqueda()"]');
        console.log("Se hizo click Buscando");
        await this.obtainTotalValue();
        await delay(5000);
        await this.browser.close();
        return "Mapas";
    }

    async entryPage() {
        await this.page.goto(this.URL);
        await this.page.waitForSelector("div.col-xs-7 button.btn-lg");
        await this.page.click("div.col-xs-7 button.btn-lg");
    }
    async clickSearchButton() {
        await this.page.waitForSelector(".glyphicon.glyphicon-search");
        await this.page.click(".glyphicon.glyphicon-search");
    }

    async completarComuna(comuna) {
        const selectorComuna = '#rolsearch input[data-ng-model="nombreComuna"]';
        await this.page.waitForSelector(selectorComuna);
        await this.page.focus(selectorComuna);
        await this.page.type(selectorComuna, comuna, { delay: 100 });
        const dropdownComuna = "#rolsearch ul.dropdown-menu";
        await this.page.waitForSelector(dropdownComuna, { visible: true });
        await this.page.focus(dropdownComuna);
        await this.page.keyboard.press('Enter'); // Seleccionar la opción
    }
    async obtainTotalValue(){
        const divResultado = "strong.col-xs-6 + div.col-xs-6 span.pull-right.ng-binding";
        await this.page.waitForSelector(divResultado);
        // const avaluoTotal = await this.page.evaluate(() => {
        //     // Encontrar el <strong> que contiene "Avalúo Total"
        //     const avaluoTotalLabel = Array.from(document.querySelectorAll('strong')).find(el => el.textContent.trim() === 'Avalúo Total');

        //     if (avaluoTotalLabel) {
        //         // Obtener el siguiente hermano <div> que contiene el valor
        //         const avaluoTotalValue = avaluoTotalLabel.nextElementSibling.querySelector('span.ng-binding');
        //         return avaluoTotalValue ? avaluoTotalValue.textContent.trim() : null;
        //     }
        //     return null;
        // });
        const avaluoTotal = await this.page.evaluate(() => {
            const element = document.querySelector("strong.col-xs-6 + div.col-xs-6 span.pull-right.ng-binding");
            return element ? element.innerText.replace(/\D/g, '') : null;
        });   
        console.log(avaluoTotal);
    }
}


function delay(time) {
    return new Promise(function (resolve) {
        setTimeout(resolve, time)
    });
}


module.exports = MapasSII;