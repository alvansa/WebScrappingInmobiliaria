const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");
const Caso  = require('./caso');


async function getDatosBoletin (startDate,endDate,casos,fechaHoy){
    let stopFlag = false;
    let tienePaginaSiguiente = true;
    // Configura el directorio para guardar descargas
    const downloadPath = path.resolve(__dirname, "downloads");

    // Lanza el navegador
    const browser = await puppeteer.launch({
      headless: false, // Cambia a true para ocultar el navegador
      defaultViewport: null,
    });

    const page = await browser.newPage();

    try{

      const client = await page.target().createCDPSession()
      // Configura la carpeta de descargas
      await client.send("Page.setDownloadBehavior", {
          behavior: "allow",
          downloadPath: downloadPath,
        });
        
        // Navega a la página web
        await page.goto("https://www.boletinconcursal.cl/boletin/remates", { waitUntil: "networkidle2" });
        
        while (tienePaginaSiguiente && !stopFlag){
            let firstRowContent = await getPrimeraLinea(page);
            stopFlag = await getTableData(page,startDate,endDate,stopFlag,downloadPath,casos,fechaHoy);
            
            tienePaginaSiguiente = await manejarPaginaSiguiente(page,firstRowContent);
        }
        } catch (error) {
            console.error("Error al obtener los datos:", error);
        }
    await browser.close();
//   deleteFiles();
};


async function getPrimeraLinea(page){
    const primeraLinea = await page.$eval('#tblRematesInmuebles tbody tr:first-child', (row) => {
        const cells = row.querySelectorAll('td');
        return Array.from(cells).map(cell => cell.innerText.trim()).join(' ');
      });
      return primeraLinea;
}


async function getTableData(page,fechaInicio,fechaFin,stopFlag,downloadPath,casos,fechaHoy) {
    const downloadedFiles = [];
    // Espera a que la tabla esté presente
    await page.waitForSelector("#tblRematesInmuebles");

    // Obtén todas las filas de la tabla
    const rows = await page.$$('#tblRematesInmuebles tbody tr');
    for (let row of rows) {
        // Obtén la fecha de la celda correspondiente 
        const nombreCell = await row.$eval('td:nth-child(1)', el => el.textContent.trim());
        const dateCell = await row.$eval('td:nth-child(2)', el => el.textContent.trim());
        const martillero = await row.$eval('td:nth-child(3)', el => el.textContent.trim());
        const fileDate = new Date(parseDate(dateCell));
        console.log(`Fecha de archivo: ${fileDate}`);
        // Si la fecha es anterior a la fecha de inicio, detén la búsqueda
        if (fileDate < fechaInicio) {
            stopFlag = true;
        }
        // Verifica si la fecha está dentro del rango
        if (isbetweenDates(fileDate, fechaInicio, fechaFin)) {
            // console.log(`Fecha dentro del rango: ${dateCell}`);
          const button = await row.$('svg');
          if (button) {
            console.log(`Botón encontrado para la fecha: ${dateCell}`);
            await button.click();
            // console.log(`Descargando archivo con fecha: ${dateCell}`);
            const downloadedFile = await waitForNewFile(downloadPath,downloadedFiles);
            downloadedFiles.push(downloadedFile);
            console.log(`archivo descargado: ${downloadedFile} con fecha ${fileDate}`);
            const caso = new Caso(fechaHoy,fileDate,downloadedFile);
            caso.darMartillero(martillero);
            casos.push(caso);
            await delay(100); // Pausa breve para evitar conflictos
          }
        }
      }
      return stopFlag;
}

async function manejarPaginaSiguiente(page,firstRowContent){
    // Busca si existe un botón de 'Siguiente'
    const nextButton = await page.$('#tblRematesInmuebles_next');
    if (nextButton) {
        console.log("Elemento 'Siguiente' encontrado, haciendo clic.");
        await nextButton.click();

        // Wait for the table to update after clicking the next button
        await page.waitForFunction(
            (initialContent) => {
                const firstRow = document.querySelector('#tblRematesInmuebles tbody tr:first-child');
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

async function waitForNewFile(downloadPath, initialFiles) {
    return new Promise((resolve, reject) => {
        const interval = setInterval(() => {
            const currentFiles = new Set(fs.readdirSync(downloadPath));

            // Encuentra archivos nuevos que no estaban en la lista inicial
            const newFiles = [...currentFiles].filter(file => !initialFiles.includes(file));

            if (newFiles.length > 0) {
                const completeFile = newFiles.find(file => !file.endsWith('.crdownload'));
                if (completeFile) {
                    clearInterval(interval);
                    resolve(completeFile); // Devuelve el nombre del archivo completo
                }
            }
        }, 100);

        // Tiempo límite para evitar bloqueos
        setTimeout(() => {
            clearInterval(interval);
            reject(new Error('Tiempo de espera excedido para un archivo nuevo.'));
        }, 30000); // 30 segundos
    });
}

function parseDate(dateString) {
    const [day, month, year] = dateString.split('-');
    return new Date(`${year}/${month}/${day}`);
}
function isbetweenDates(date, startDate, endDate) {
    date.setHours(0, 0, 0, 0);
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);
    return date >= startDate && date <= endDate;
}

function delay(time) {
    return new Promise(function(resolve) { 
        setTimeout(resolve, time)
    });
 }


module.exports = { getDatosBoletin };