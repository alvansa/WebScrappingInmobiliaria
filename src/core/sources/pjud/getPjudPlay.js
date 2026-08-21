const fs = require('fs');

const Caso = require('#models/caso/caso.js');
const { delay, fakeDelay } = require('#utils/delay.js');
const logger = require('#utils/logger.js');

const EXITO = 1;
const ERROR = 0;

class PjudPlaywright {
    // El constructor recibe browser y page de Playwright (igual que en Puppeteer)
    constructor(browser, page, startDate, endDate) {
        this.browser = browser;
        this.page = page;
        this.startDate = startDate;
        this.endDate = endDate;
    }

    async getPJUD() {
        let tableData = [];
        let tienePaginaSiguiente = true;
        let originalPage = this.page;
        let paginaActual = 1;
        try {
            // await this.page.evaluate(() => {
            //     verRemates(); // Asegúrate de que esta función existe en el contexto de la página
            // });
            // this.page = await this.goToRemates();
            await this.setValoresInciales();
            console.log("Valores fecha :", this.startDate, this.endDate);
            await this.setDates('#desde', this.startDate);
            await fakeDelay(1, 3);
            await delay(500);
            await this.setDates('#hasta', this.endDate);
            await fakeDelay(1, 3);

            await this.page.waitForSelector('#btnConsultaRemates.btn.btn-primary', { state: 'visible' });
            // En Playwright, se recomienda usar page.click() en lugar de evaluate
            await this.page.click('#btnConsultaRemates');
            console.log("Botón de consulta clickeado");

            // Esperar a que la tabla aparezca
            console.log("Esperando tabla");
            await this.page.waitForSelector('#dtaTableDetalleRemate', { state: 'visible' });
            console.log("Tabla encontrada");

            while (tienePaginaSiguiente) {
                try {
                    const iframeSoporte = this.page.frameLocator('iframe[id^="TSBrPFrame_"]');

                    // 2. Buscamos el texto DENTRO de ese iframe
                    const avisoSoporte = iframeSoporte.getByText(/Su numero de soporte es\s*:/i);

                    // 3. Verificamos si el texto dentro del iframe es visible
                    const hayAvisoError = await avisoSoporte.isVisible();

                    if (hayAvisoError) {
                        console.warn("⚠️ Se detectó el mensaje de soporte dentro del iframe. Saliendo del bucle...");
                        break; // Sale inmediatamente del while
                    }
                    let firstRowContent = await this.getPrimeraLinea();
                    let datosTabla = await this.getDatosTabla(tableData);
                    tableData.push(...datosTabla);
                    tienePaginaSiguiente = await this.manejarPaginaSiguiente(firstRowContent);
                    paginaActual++;
                    await fakeDelay(5, 10);
                } catch (error) {
                    console.error('Error en el while de getPJUD:', error);
                    break;
                }
            }
            // this.writeData(tableData);
            this.page.close();
            // this.page = originalPage;
            // this.page.bringToFront();
            // this.page.close();
            logger.info(`Ultima pagina procesada: ${paginaActual}, cantidad de casos obtenidos: ${tableData.length}`);
            return { 'casos': tableData, 'pageNumber': paginaActual };
        } catch (error) {
            console.error('Error en la función getPJUD:', error.message);
            if(this.page && !this.page.isClosed()){
                this.page.close();
            }
            if(originalPage && !originalPage.isClosed()){
                originalPage.close();
            }
            return tableData;
        }
    }

    async goToRemates() {
        try {
            // await this.page.click('img[alt="Audiencia de Remates"]')
            // await this.page.click('a[href="https://oficinajudicialvirtual.pjud.cl/includes/sesion-consultaunificada.php"]');
            // await this.page.locator('.tz-gallery .col-md-4.mb-1').nth(2).click();
            // await this.page.locator('a[href*="remate.php"]').click();
            // this.page.waitForURL('**/indexN.php')
            // await this.page.click('img[alt="Audiencia de Remates"]')
            // await newPage.waitForLoadState();

            await this.page.getByRole('link', { name: 'Audiencia de Remates' }).click({force: true});
            // return newPage;
            return this.page;

        } catch (err) {
            console.error("Fallo al buscar la audiencia de remates:", err.message);
            // Podrías intentar un fallback: buscar el botón que ejecuta esa acción y hacer clic
            return this.page;
        }
    }

    async setValoresInciales() {
        await this.page.waitForSelector('#competencia');
        await this.page.type('#competencia', '1');
        await fakeDelay(1, 3);
        await this.page.selectOption('#corte', '0'); // En Playwright es selectOption
        await fakeDelay(1, 3);
        await this.page.type('#tribunal', '0');
        await fakeDelay(1, 3);
        await this.page.waitForSelector('#tipo');
        await fakeDelay(1, 3);
        await this.page.type('#tipo', 'C');
    }

    async setDates(selector, date) {
        await this.page.waitForSelector(selector);
        await this.page.evaluate(({selector, date}) => {
            const dateField = document.querySelector(selector);
            dateField.value = date;
            // Si necesitas disparar evento change, descomenta:
            // dateField.dispatchEvent(new Event('change', { bubbles: true }));
        }, {selector, date});
        console.log('seteando fecha:', selector);
    }

    async getPrimeraLinea() {
        const primeraLinea = await this.page.$eval('#dtaTableDetalleRemate tbody tr:first-child', (row) => {
            const cells = row.querySelectorAll('td');
            return Array.from(cells).map(cell => cell.innerText.trim()).join(' ');
        });
        return primeraLinea;
    }

    async getDatosTabla(existingList = []) {
        let casos = [];
        const rowsData = await this.page.evaluate(() => {
            const rows = Array.from(document.querySelectorAll('#dtaTableDetalleRemate tbody tr'));
            return rows.map(row => {
                const columns = Array.from(row.querySelectorAll('td'));
                return {
                    tribunal: columns[1] ? columns[1].innerText.trim() : '',
                    competencia: columns[2] ? columns[2].innerText.trim() : '',
                    causa: columns[3] ? columns[3].innerText.trim() : '',
                    fechaHora: columns[4] ? columns[4].innerText.trim() : '',
                    estadoRemate: columns[5] ? columns[5].innerText.trim() : ''
                };
            });
        });

        if (rowsData.length > 0) {
            rowsData.pop();
        }

        rowsData.forEach(data => {
            if (!data.causa || !data.tribunal) return;

            const yaExisteEnLocal = casos.some(c => c.causa === data.causa && c.juzgado === data.tribunal);
            const yaExisteEnAcumulado = existingList.some(c => c.causa === data.causa && c.juzgado === data.tribunal);

            if (!yaExisteEnLocal && !yaExisteEnAcumulado) {
                const caso = new Caso(new Date(), "N/A", "Lgr", 2);
                caso.juzgado = data.tribunal;
                caso.causa = data.causa;
                caso.fechaRemate = data.fechaHora;
                casos.push(caso);
            }
        });

        return casos;
    }

    async manejarPaginaSiguiente(firstRowContent) {
        const nextButton = await this.page.$('#sigId');
        if (nextButton) {
            console.log("Elemento 'Siguiente' encontrado, haciendo clic.");
            await nextButton.click();

            // Esperar a que cambie el contenido de la primera fila
            await this.page.waitForFunction(
                (initialContent) => {
                    const firstRow = document.querySelector('#dtaTableDetalleRemate tbody tr:first-child');
                    if (firstRow) {
                        const cells = firstRow.querySelectorAll('td');
                        const newContent = Array.from(cells).map(cell => cell.innerText.trim()).join(' ');
                        return newContent !== initialContent;
                    }
                    return false;
                },
                { timeout: 10000 },
                firstRowContent
            );
            console.log("Esperando nueva tabla después del clic");
            return true;
        } else {
            console.log("No hay más páginas.");
            return false;
        }
    }

    writeData(datos) {
        const rutaArchivo = './datos.txt';

        // Transformamos cada elemento de la lista en una línea formateada
        const contenido = datos
            .map(dato => `${dato.causa}, ${dato.juzgado}, ${dato.fechaRemate}`)
            .join('\n');

        fs.writeFile(rutaArchivo, contenido, (err) => {
            if (err) {
                console.error('Error al escribir en el archivo:', err);
            } else {
                console.log('Datos escritos correctamente en el archivo de texto.');
            }
        });
    }

    // Los siguientes métodos no se usan en el flujo principal pero los mantengo igual
    async selectCuaderno(page) {
        await page.waitForSelector('#selCuaderno');
        const options = await page.$$eval('#selCuaderno option', (opts) => {
            return opts.map(option => ({
                text: option.textContent.trim(),
                value: option.value
            }));
        });
        const optionToSelect = options.find(option => option.text.includes('2 - Apremio Ejecutivo Obligación de Dar'));
        if (optionToSelect) {
            await page.selectOption('#selCuaderno', optionToSelect.value);
        } else {
            console.log('La opción deseada no se encuentra en el select.');
        }
    }

    async getDatosTablaRemate(page) {
        try {
            await page.waitForSelector("#historiaCiv", { timeout: 10000 });
            const rows = await page.$$('#historiaCiv .table tbody tr');
            console.log(rows.length);
            for (const row of rows) {
                try {
                    await this.procesarFila(page, row);
                } catch (error) {
                    console.error(`Error processing row: ${error.message}`);
                }
            }
        } catch (error) {
            console.error('Error en la función getDatosTablaRemate:', error);
            return [];
        }
    }

    async procesarFila(page, row) {
        const [descripcion] = await Promise.all([
            row.$eval('td:nth-child(6)', el => el.textContent.trim()),
        ]);
        if (descripcion === 'Cumple lo ordenado') {
            const button = await row.$('td:nth-child(3) a');
            if (!button) {
                console.log('No se encontró el botón');
                return ERROR;
            }
            await button.click();
            await page.waitForSelector('.modal-body table');
            const rows = await page.$$('.modal-body table tbody tr');
            for (let tableRow of rows) {
                await this.obtenerPDF(page, tableRow);
            }
            return EXITO;
        }
        return ERROR;
    }

    async obtenerPDF(page, row) {
        const [referencia] = await Promise.all([
            row.$eval('td:nth-child(2)', el => el.textContent.trim()),
        ]);
        const button = await row.$('a');
        if (!button) {
            console.log('No se encontró el botón para descargar el PDF de ', referencia);
            return ERROR;
        }
        await button.click();
        console.log('Descargando PDF de ', referencia);
    }

    async datosFromPjud() {
        const datos = await this.getPJUD();
        console.log('Datos conseguidos del pjud', datos.length);
        return datos;
    }
}

// Función auxiliar que está fuera de la clase (no usada en el original realmente)
// async function datosFromPjud(fechaInicio, fechaFin) {
//     // Esto no está implementado porque getPJUD no es global. Se deja como estaba.
//     console.warn("Esta función no está implementada correctamente en el original");
//     return [];
// }

// async function main() {
//     // Ejemplo de uso con Playwright (lanzando webkit/Safari o chromium)
//     const { webkit } = require('playwright');
//     const browser = await webkit.launch({ headless: false }); // Para ver lo que pasa
//     const page = await browser.newPage();
//     await page.goto('URL_DEL_SITIO'); // Reemplazar con la URL real

//     const pjud = new Pjud(browser, page, '11/11/2024', '12/11/2024');
//     const datos = await pjud.datosFromPjud();
//     console.log("datos conseguidos", datos.length);
//     pjud.writeData(datos);

//     await browser.close();
// }

// Si quieres ejecutar main, descomenta:
// main();

module.exports = PjudPlaywright;