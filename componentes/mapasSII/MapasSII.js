const puppeteer = require('puppeteer');
const fs = require('fs');

const {delay} = require('../utils/utils.js');

class MapasSII {
    constructor() {
        this.URL = 'https://www4.sii.cl/mapasui/internet/#/contenido/index.html';
    }

    async Initialize() {
        this.browser = await puppeteer.launch({ headless: false });
        this.page = await this.browser.newPage();
        await this.entryPage();
    }

    async obtainDataOfCause(caso) {
        const comuna = caso.comuna;
        const rolPropiedad = caso.getRolPropiedad();
        console.log("comuna: ", comuna, "rolPropiedad: ", rolPropiedad);
        if(rolPropiedad === null || comuna === null){
            return null;
        }
        console.log("Rellenando formulario");
        const manzana = rolPropiedad[0];
        const predio = rolPropiedad[1];
        // const predio = "12345678";
        const selectorManzana = 'input[data-ng-model="manzana"]';
        const selectorPredio = 'input[data-ng-model="predio"]';
        await this.clickSearchButton();
        await this.clearInput('#rolsearch input[data-ng-model="nombreComuna"]');
        await this.clearInput(selectorManzana);
        await this.clearInput(selectorPredio);

        await this.completarComuna(comuna);
        console.log("Rellenando manzana");
        await this.page.waitForSelector(selectorManzana);
        await this.page.type(selectorManzana, manzana);
        console.log("Rellenando predio");
        await this.page.waitForSelector(selectorPredio);
        await this.page.type(selectorPredio, predio);
        await this.page.click('button[data-ng-click="validaBusqueda()"]');
        console.log("Se hizo click Buscando");
        await this.obtainTotalValue(caso);
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

    async obtainTotalValue(caso){
        const divResultado = "strong.col-xs-6 + div.col-xs-6 span.pull-right.ng-binding";
        const divError = "span.modal-title.ng-binding";
        const botonCerrar = "div.modal-footer.ng-scope button.btn.btn-warning"; 
        try{
            // busca el elemento de resultado o error
            await this.page.waitForSelector(`${divResultado},${divError}`,{timeout: 5000});
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
            caso.avaluoPropiedad = avaluoTotal;
            delay(500);
            
        }catch(error){
            console.error("Error al buscar el elemento:", error);
            caso.avaluoPropiedad = null;
        }
    }

    async clearInput(selector){
        await this.page.evaluate((selector) => document.querySelector(selector).value = "", selector);
    }

    async closeBrowser(){
        await this.browser.close();
    }   
}



module.exports = MapasSII;