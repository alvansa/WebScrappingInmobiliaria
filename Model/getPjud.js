const puppeteer = require('puppeteer');
const fs = require('fs');
const { get } = require('request');

async function getPJUD(fechaDesde,fechaHasta){
    const browser = await puppeteer.launch({headless: false});
    const page = await browser.newPage();
    await page.goto('https://oficinajudicialvirtual.pjud.cl/indexN.php');
    try{    
        
        await page.evaluate(() => {
            verRemates();
          });
        await setValoresInciales(page);
        console.log("Valores fecha :",fechaDesde,fechaHasta);
        await setDates(page,'#desde',fechaDesde);
        const desdeValue = await page.$eval('#desde', el => el.value);
        console.log(desdeValue);
        await setDates(page,'#hasta',fechaHasta);
        const hastaValue = await page.$eval('#hasta', el => el.value);
        console.log(hastaValue);

        await page.waitForSelector('#btnConsultaRemates.btn.btn-primary');
        await page.click('#btnConsultaRemates.btn.btn-primary').then(() => console.log("Botón de consulta clickeado"));
        // Esperar a que la tabla aparezca después de hacer clic en el botón de consulta
        console.log("Esperando tabla");
        await page.waitForSelector('#dtaTableDetalleRemate', { visible: true });
        console.log("Tabla encontrada");
      
        let tableData = [];
        let tienePaginaSiguiente = true;

        while (tienePaginaSiguiente){
            let firstRowContent = await getPrimeraLinea(page);
            let datosTabla = await getDatosTabla(page);
            tableData.push(...datosTabla);

            tienePaginaSiguiente = await manejarPaginaSiguiente(page,firstRowContent);
        }

        await browser.close();
        return tableData;
}catch(error){
    console.error('Error en la función getPJUD:', error);
    await browser.close();
    return [];
}
} 

// Guarda los valores inciiiales en la página de busqueda
async function setValoresInciales(page){
    await page.waitForSelector('#competencia');
    await page.type('#competencia', '1');
    await page.type('#corte', '0');
    await page.type('#tribunal', '0');
    await page.waitForSelector('#tipo');
    await page.type('#tipo', 'C');
}

// Función para establecer las fechas en los campos de fecha
async function setDates(page,selector,date){
    await page.waitForSelector(selector);
    await page.evaluate((selector, date) => {
        const dateField = document.querySelector(selector);
        dateField.value = date;
        // dateField.dispatchEvent(new Event('change', { bubbles: true }));
    }, selector, date);
    console.log('seteando fecha:',selector);
}
// Obtiene la primera linea de la tabla
async function getPrimeraLinea(page){
    const primeraLinea = await page.$eval('#dtaTableDetalleRemate tbody tr:first-child', (row) => {
        const cells = row.querySelectorAll('td');
        return Array.from(cells).map(cell => cell.innerText.trim()).join(' ');
      });
      return primeraLinea;
}

//Obtiene los datos de la tabla
async function getDatosTabla(page){
    tableData = await page.evaluate(() => {
        const rows = Array.from(document.querySelectorAll('#dtaTableDetalleRemate tbody tr')); // Get all rows in tbody
        return rows.map(row => {
          const columns = Array.from(row.querySelectorAll('td')); // Get all columns in the row
          return {
            tribunal: columns[1] ? columns[1].innerText.trim() : '',
            competencia: columns[2] ? columns[2].innerText.trim() : '',
            causa: columns[3] ? columns[3].innerText.trim() : '',
            fechaHora: columns[4] ? columns[4].innerText.trim() : '',
            estadoRemate: columns[5] ? columns[5].innerText.trim() : '',
          };
        });
      });
      return tableData;
}

// Función para buscar la página siguiente, si existe se dirige a ella, revisa que se haya cargado correctamente 
// revisando la primera linea de la tabla y retorna si existe una página siguiente.

async function manejarPaginaSiguiente(page,firstRowContent){
    // Busca si existe un botón de 'Siguiente'
    const nextButton = await page.$('#sigId');
    if (nextButton) {
        console.log("Elemento 'Siguiente' encontrado, haciendo clic.");
        await nextButton.click();

        // Wait for the table to update after clicking the next button
        await page.waitForFunction(
            (initialContent) => {
                const firstRow = document.querySelector('#dtaTableDetalleRemate tbody tr:first-child');
                if (firstRow) {
                    const cells = firstRow.querySelectorAll('td');
                    const newContent = Array.from(cells).map(cell => cell.innerText.trim()).join(' ');
                    return newContent !== initialContent;
                }
                return false;
            },
            { timeout: 5000 },
            firstRowContent
        );

        console.log("Esperando nueva tabla después del clic");
        return true; // Continue to the next page
    } else {
        console.log("No hay más páginas.");
        return false; // No next page, stop
    }
}

function writeData(datos){
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

async function main(){
    try {
        const fechaDesde = '11/11/2024';
        const fechaHasta = '12/11/2024';
        const datos = await getPJUD(fechaDesde,fechaHasta);
        console.log("datos conseguidos");
        // console.log(datos);
        writeData(datos);
    } catch (error) {
        console.error('Error en la funcion main:', error);
    }
}

module.exports = {getPJUD};
// main();