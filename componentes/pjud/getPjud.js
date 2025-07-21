const puppeteer = require('puppeteer-core');
const fs = require('fs');

const Caso = require('../caso/caso.js');
const {delay, fakeDelay} = require('../../utils/delay.js');

const EXITO = 1;
const ERROR = 0;

class Pjud {
    constructor(browser,page,startDate,endDate) {
        this.browser = browser;
        this.page = page;
        this.startDate = startDate;
        this.endDate = endDate;
    }

    async getPJUD() {
        let tableData = [];
        let tienePaginaSiguiente = true;
        try {
            await this.page.evaluate(() => {
                verRemates();
            });
            await this.setValoresInciales();
            console.log("Valores fecha :", this.startDate, this.endDate);
            await this.setDates('#desde', this.startDate);
            await fakeDelay(1, 3);
            await delay(500);
            await this.setDates('#hasta', this.endDate);
            await fakeDelay(1, 3);

            await this.page.waitForSelector('#btnConsultaRemates.btn.btn-primary', { visible: true });
            try {
                await this.page.evaluate(() => {
                    document.querySelector('#btnConsultaRemates').click();
                });
                console.log("Botón de consulta clickeado")
            } catch (error) {
                console.error('Error al hacer clic en el botón de consulta:', error);
                return tableData;
            }
            // Esperar a que la tabla aparezca después de hacer clic en el botón de consulta
            console.log("Esperando tabla");
            await this.page.waitForSelector('#dtaTableDetalleRemate', { visible: true });
            console.log("Tabla encontrada");


            while (tienePaginaSiguiente) {
                try{
                    let firstRowContent = await this.getPrimeraLinea();
                    let datosTabla = await this.getDatosTabla();
                    tableData.push(...datosTabla);

                    tienePaginaSiguiente = await this.manejarPaginaSiguiente(firstRowContent);
                    fakeDelay(2, 4);
                }catch(error){
                    console.error('Error en el while de getPJUD:', error);
                    break;
                }
            }
            return tableData;
        } catch (error) {
            console.error('Error en la función getPJUD:', error);
            return tableData;
        }
    }

    // Guarda los valores inciiiales en la página de busqueda
    async setValoresInciales() {
        await this.page.waitForSelector('#competencia');
        await this.page.type('#competencia', '1');
        await fakeDelay(1,3);
        await this.page.select('#corte', '0');
        // solo para santiago corte = 90
        // await this.page.select('#corte', '90');
        await fakeDelay(1,3);
        await this.page.type('#tribunal', '0');
        await fakeDelay(1,3);
        await this.page.waitForSelector('#tipo');
        await fakeDelay(1,3);
        await this.page.type('#tipo', 'C');
    }

    // Función para establecer las fechas en los campos de fecha
    async setDates(selector, date) {
        await this.page.waitForSelector(selector);
        await this.page.evaluate((selector, date) => {
            const dateField = document.querySelector(selector);
            dateField.value = date;
            // dateField.dispatchEvent(new Event('change', { bubbles: true }));
        }, selector, date);
        console.log('seteando fecha:', selector);
    }
    // Obtiene la primera linea de la tabla
    async getPrimeraLinea() {
        const primeraLinea = await this.page.$eval('#dtaTableDetalleRemate tbody tr:first-child', (row) => {
            const cells = row.querySelectorAll('td');
            return Array.from(cells).map(cell => cell.innerText.trim()).join(' ');
        });
        return primeraLinea;
    }


    async getDatosTabla() {
        // Lista donde se guardarán los objetos de la clase Caso
        let casos = [];

        // Obtener los datos de la tabla
        const rowsData = await this.page.evaluate(() => {
            const hoy = new Date();
            const rows = Array.from(document.querySelectorAll('#dtaTableDetalleRemate tbody tr')); // Obtener todas las filas en tbody

            // Extraer los datos de las filas
            return rows.map(row => {
                const columns = Array.from(row.querySelectorAll('td')); // Obtener todas las columnas de la fila

                return {
                    tribunal: columns[1] ? columns[1].innerText.trim() : '',
                    competencia: columns[2] ? columns[2].innerText.trim() : '',
                    causa: columns[3] ? columns[3].innerText.trim() : '',
                    fechaHora: columns[4] ? columns[4].innerText.trim() : '',
                    estadoRemate: columns[5] ? columns[5].innerText.trim() : ''
                };
            });
        });

        // Ahora, fuera del evaluate, creamos objetos Caso a partir de los datos extraídos
        rowsData.forEach(data => {
            const caso = new Caso(new Date(), "N/A", "Lgr", 2);
            caso.juzgado = data.tribunal;
            caso.causa = data.causa;
            caso.fechaRemate = data.fechaHora;

            // Guardamos el objeto en la lista de casos
            casos.push(caso);
        });
        casos.pop();
        // Retornar la lista de objetos Caso
        return casos;
    }

    // Función para buscar la página siguiente, si existe se dirige a ella, revisa que se haya cargado correctamente 
    // revisando la primera linea de la tabla y retorna si existe una página siguiente.

    async manejarPaginaSiguiente(firstRowContent) {
        // Busca si existe un botón de 'Siguiente'
        const nextButton = await this.page.$('#sigId');
        if (nextButton) {
            console.log("Elemento 'Siguiente' encontrado, haciendo clic.");
            await nextButton.click();

            // Wait for the table to update after clicking the next button
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
            return true; // Continue to the next page
        } else {
            console.log("No hay más páginas.");
            return false; // No next page, stop
        }
    }

    writeData(datos) {
        // Ruta del archivo donde se guardarán los datos
        const rutaArchivo = './datos.json';

        // Convertir el array a formato JSON
        const datosJson = JSON.stringify(datos, null, 2);  // El 'null' y '2' es para hacer el JSON más legible (con indentación)

        // Escribir los datos en el archivo JSON
        fs.writeFile(rutaArchivo, datosJson, (err) => {
            if (err) {
                console.error('Error al escribir en el archivo:', err);
            } else {
                console.log('Datos escritos correctamente en el archivo JSON');
            }
        });
    }


    async selectCuaderno(page) {
        // Esperar a que el <select> esté disponible
        // Esperar a que el <select> esté disponible    await page.waitForSelector('#selCuaderno');

        // Obtener todas las opciones del <select>
        const options = await page.$$eval('#selCuaderno option', (opts) => {
            return opts.map(option => ({
                text: option.textContent.trim(),
                value: option.value
            }));
        });

        // Buscar la opción que contiene "2 - Apremio Ejecutivo Obligación de Dar"
        const optionToSelect = options.find(option => option.text.includes('2 - Apremio Ejecutivo Obligación de Dar'));

        if (optionToSelect) {
            // Seleccionar la opción encontrada
            await page.select('#selCuaderno', optionToSelect.value);
        } else {
            console.log('La opción deseada no se encuentra en el select.');
        }
    }


    async getDatosTablaRemate(page) {
        try {
            await page.waitForSelector("#historiaCiv", { timeout: 10000 });

            // Get all rows from the table
            const rows = await page.$$('#historiaCiv .table tbody tr');
            console.log(rows.length);
            for (const row of rows) {
                // Track if the row is processed successfull
                try {
                    success = await procesarFila(page, row);
                } catch (error) {
                    console.error(`Error processing row on attempt : ${error.message}`);
                    success = ERROR;
                }
            }

        } catch (error) {
            console.error('Error en la función getDatosTablaRemate:', error);
            return [];
        }

    }

    async procesarFila(page, row) {
        const [etapa, tramite, descripcion, fecha] = await Promise.all([
            row.$eval('td:nth-child(4)', el => el.textContent.trim()),
            row.$eval('td:nth-child(5)', el => el.textContent.trim()),
            row.$eval('td:nth-child(6)', el => el.textContent.trim()),
            row.$eval('td:nth-child(7)', el => el.textContent.trim()),
        ]);
        // console.log(descripcion);
        if (descripcion === 'Cumple lo ordenado') {
            button = await row.$('td:nth-child(3) a');
            if (!button) {
                console.log('No se encontró el botón');
                return ERROR;
            }
            await page.waitForSelector('td:nth-child(3) a', { visible: true });
            console.log('Botón encontrado');
            await button.click();
            await page.waitForSelector('.modal-body table');
            const rows = await page.$$('.modal-body table tbody tr');
            for (let tableRow of rows) {
                await obtenerPDF(page, tableRow);
            }
            // await delay(5000);
            return EXITO;
        }
        return ERROR;
    }

    async obtenerPDF(page, row) {
        const [fecha, referencia] = await Promise.all([
            row.$eval('td:nth-child(1)', el => el.textContent.trim()),
            row.$eval('td:nth-child(2)', el => el.textContent.trim()),
        ]);
        button = await row.$('a');
        if (!button) {
            console.log('No se encontró el botón para descargar el PDF de ', referencia);
            return ERROR;
        }
        await page.waitForSelector('a', { visible: true });
        await button.click();
        console.log('Descargando PDF de ', referencia);
    }



    async datosFromPjud() {
        const datos = await this.getPJUD();
        console.log('Datos conseguidos del pjud', datos.length);
        // const causa = new ConsultaCausaPjud(datos);
        // const casos = await causa.getConsultaCausaPjud();
        return datos;
    }
}

async function datosFromPjud(fechaInicio,fechaFin){
    const datos = await getPJUD(fechaInicio,fechaFin);
    console.log('Datos conseguidos del pjud', datos.length);
    // const causa = new ConsultaCausaPjud(datos);
    // const casos = await causa.getConsultaCausaPjud();
    return datos;
}

async function main() {
    try {
        const fechaDesde = '11/11/2024';
        const fechaHasta = '12/11/2024';
        const datos = await getPJUD(fechaDesde, fechaHasta);
        console.log("datos conseguidos");
        // console.log(datos);
        writeData(datos);
    } catch (error) {
        console.error('Error en la funcion main:', error);
    }
}
// main();
module.exports = Pjud;
