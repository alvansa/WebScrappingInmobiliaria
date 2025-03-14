const puppeteer = require('puppeteer');
const fs = require('fs');
const Caso = require('../caso/caso.js');

const EXITO = 1;
const ERROR = 0;

async function getPJUD(fechaDesde,fechaHasta){
    const browser = await puppeteer.launch({headless: false});
    const page = await browser.newPage();
    try{    
        
        await page.goto('https://oficinajudicialvirtual.pjud.cl/indexN.php');
        await page.evaluate(() => {
            verRemates();
          });
        await setValoresInciales(page);
        console.log("Valores fecha :",fechaDesde,fechaHasta);
        await setDates(page,'#desde',fechaDesde);
        const desdeValue = await page.$eval('#desde', el => el.value);
        console.log(desdeValue);
        await delay(500);
        await setDates(page,'#hasta',fechaHasta);
        const hastaValue = await page.$eval('#hasta', el => el.value);
        console.log(hastaValue);
        await delay(500);

        await page.waitForSelector('#btnConsultaRemates.btn.btn-primary',{visible:true});
        try{
            await page.evaluate(() => {
                document.querySelector('#btnConsultaRemates').click();
            });
            console.log("Botón de consulta clickeado")
        }catch(error){
            console.error('Error al hacer clic en el botón de consulta:', error);
            await browser.close();
            return [];
        }
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


async function getDatosTabla(page) {
    // Lista donde se guardarán los objetos de la clase Caso
    let casos = [];

    // Obtener los datos de la tabla
    const rowsData = await page.evaluate(() => {
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
        const caso = new Caso(new Date(), "N/A","Letra grande/ Pjud" , 2);
        caso.darJuzgado(data.tribunal);
        caso.darCausa(data.causa);
        caso.darFechaRemate(data.fechaHora);

        // Guardamos el objeto en la lista de casos
        casos.push(caso);
    });
    casos.pop();
    // Retornar la lista de objetos Caso
    return casos;
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


async function selectCuaderno(page) {
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


async function getDatosTablaRemate(page){
    try{
        await page.waitForSelector("#historiaCiv", { timeout: 10000 });

        // Get all rows from the table
        const rows = await page.$$('#historiaCiv .table tbody tr');
        console.log(rows.length);
        for (const row of rows) {
            // Track if the row is processed successfull
                try {
                    success = await procesarFila(page,row);
                } catch (error) {
                    console.error(`Error processing row on attempt : ${error.message}`);
                    success = ERROR;
                }
        }

    }catch(error){
        console.error('Error en la función getDatosTablaRemate:', error);
        return [];
    }

}

async function procesarFila(page,row){
    const [etapa, tramite, descripcion, fecha] = await Promise.all([
        row.$eval('td:nth-child(4)', el => el.textContent.trim()),
        row.$eval('td:nth-child(5)', el => el.textContent.trim()),
        row.$eval('td:nth-child(6)', el => el.textContent.trim()),
        row.$eval('td:nth-child(7)', el => el.textContent.trim()),
    ]);
    // console.log(descripcion);
    if(descripcion === 'Cumple lo ordenado'){
        button = await row.$('td:nth-child(3) a');
        if(!button){
            console.log('No se encontró el botón');
            return ERROR;
        }
        await page.waitForSelector('td:nth-child(3) a',{visible:true});
        console.log('Botón encontrado');
        await button.click();
        await page.waitForSelector('.modal-body table');
        const rows = await page.$$('.modal-body table tbody tr');
        for(let tableRow of rows){
            await obtenerPDF(page,tableRow);
        }
        // await delay(5000);
        return EXITO;
    }
    return ERROR;
}

async function obtenerPDF(page,row){
    const [fecha,referencia] = await Promise.all([
        row.$eval('td:nth-child(1)', el => el.textContent.trim()),
        row.$eval('td:nth-child(2)', el => el.textContent.trim()),
    ]);
    button = await row.$('a');
    if(!button){
        console.log('No se encontró el botón para descargar el PDF de ', referencia);
        return ERROR;
    }
    await page.waitForSelector('a',{visible:true});
    await button.click();
    console.log('Descargando PDF de ',referencia);
}


function delay(time) {
    return new Promise(function(resolve) { 
        setTimeout(resolve, time)
    });
 }

async function datosFromPjud(fechaInicio,fechaFin){
    const datos = await getPJUD(fechaInicio,fechaFin);
    console.log('Datos conseguidos del pjud', datos.length);
    // const causa = new ConsultaCausaPjud(datos);
    // const casos = await causa.getConsultaCausaPjud();
    return datos;
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
// main();
module.exports = {getPJUD,datosFromPjud};
