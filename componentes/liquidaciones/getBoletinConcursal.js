const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");
const os = require("os");

const {delay} = require('../../utils/delay');
const Caso  = require('../caso/caso');

const EXITO = 1;
const ERROR = 0;
const REINTENTAR = 2;
const DETENER = 3;
const CONTINUAR = 4;

const LIQUIDACIONES = 3;

async function getDatosBoletin (startDate,endDate,casos,fechaHoy){
    const downloadedFiles = [];
    const intentosMax = 1;
    let stopFlag = false;
    let tienePaginaSiguiente = true;
    // Configura el directorio para guardar descargas
    // Configurar la ruta de descarga
    const downloadPath = path.join(os.homedir(),"Documents","InfoRemates/pdfDownload");

    // Asegurarte de que la carpeta exista
    if (!fs.existsSync(downloadPath)) {
        fs.mkdirSync(downloadPath, { recursive: true });
    }
    // Lanza el navegador
    const browser = await puppeteer.launch({
      headless: true, // Cambia a true para ocultar el navegador
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
            // stopFlag = await getTableData(page,startDate,endDate,stopFlag,downloadPath,casos,fechaHoy,downloadedFiles);
            stopFlag = await getTableData2(page,startDate,endDate,stopFlag,downloadPath,casos,fechaHoy,downloadedFiles,intentosMax);
            
            tienePaginaSiguiente = await manejarPaginaSiguiente(page,firstRowContent);
        }
        } catch (error) {
            console.error("Error al obtener los datos:", error);
        }
    await browser.close();
};


async function getPrimeraLinea(page){
    const primeraLinea = await page.$eval('#tblRematesInmuebles tbody tr:first-child', (row) => {
        const cells = row.querySelectorAll('td');
        return Array.from(cells).map(cell => cell.innerText.trim()).join(' ');
      });
      return primeraLinea;
}


async function getTableData(page,fechaInicio,fechaFin,stopFlag,downloadPath,casos,fechaHoy,downloadedFiles) {
    
    // Espera a que la tabla esté presente
    await page.waitForSelector("#tblRematesInmuebles");

    // Obtén todas las filas de la tabla
    const rows = await page.$$('#tblRematesInmuebles tbody tr');
    for (let row of rows) {
        try{
            // Obtén el nombre, la fecha y el martillero de cada fila
            const nombreCell = await row.$eval('td:nth-child(1)', el => el.textContent.trim());
            const dateCell = await row.$eval('td:nth-child(2)', el => el.textContent.trim());
            const martillero = await row.$eval('td:nth-child(3)', el => el.textContent.trim());
            const fileDate = new Date(parseDate(dateCell));
            // console.log(`Fecha de archivo: ${fileDate}`);
            // Si la fecha es anterior a la fecha de inicio, detén la búsqueda
            if (fileDate < fechaInicio) {
                stopFlag = true;
            }
            console.log(`Fecha del remate a verificar: ${dateCell} con nombre ${nombreCell}`);
            // Verifica si la fecha está dentro del rango
            if (isbetweenDates(fileDate, fechaInicio, fechaFin)) {
                
                const button = await row.$('svg');
                if (button) {
                    // console.log(`Fecha dentro del rango: ${dateCell} y boton encontrado ${button}`);
                    await button.click();
                    // console.log(`Descargando archivo con fecha: ${dateCell} y nombre ${nombreCell}`);
                    const downloadedFile = await waitForNewFile(downloadPath,downloadedFiles);
                    downloadedFiles.push(downloadedFile);
                    // console.log(`archivo descargado: ${downloadedFile} con fecha ${fileDate}`);
                    const caso = new Caso(fechaHoy,fileDate,downloadedFile);
                    caso.darMartillero(martillero);
                    casos.push(caso);
                    await delay(150); // Pausa breve para evitar conflictos
                }else{
                    console.log("Botón no encontrado para esta fila.");
                }
            }
        }catch(rowError) {
            console.error("Error al obtener datos de la fila:", rowError);
            continue;
        }
    }
      return stopFlag;
}

async function getTableData2(page, fechaInicio, fechaFin, stopFlag, downloadPath, casos, fechaHoy, downloadedFiles, maxRetries = 3) {
    try {
        //Espera a que la tabla esté presente
        await page.waitForSelector("#tblRematesInmuebles", { timeout: 10000 });

        //Obtiene las filas de la tabla
        const rows = await page.$$('#tblRematesInmuebles tbody tr');

        for (const row of rows) {
            let success = ERROR; // Track if the row is processed successfully
            let attempts = 0;    // Count attempts

            while (success != EXITO && attempts < maxRetries) {
                try {
                    attempts++;
                    success = await procesarFila(page,row, fechaInicio, fechaFin, downloadPath, downloadedFiles,casos, fechaHoy);
                } catch (error) {
                    console.error(`Error processing row on attempt ${attempts}: ${error.message}`);
                    if (attempts >= maxRetries) {
                        console.warn(`Max retries reached for a row. Skipping it.`);
                    }
                }

                // Add a small delay between retries
                if (success === REINTENTAR) { 
                    await delay(200);
                }
                if (success === CONTINUAR) {
                    break;
                }
                
            }
            if (success === DETENER) {
                stopFlag = true;
            }
        }
    } catch (error) {
        console.error(`General error processing the table: ${error.message}`);
    }

    return stopFlag;
}


async function procesarFila(page,row,fechaInicio,fechaFin,downloadPath,downloadedFiles,casos,fechaHoy){
    // Extrae la informacion de la fila
    const [nombreCell, dateCell, martillero] = await Promise.all([
        row.$eval('td:nth-child(1)', el => el.textContent.trim()),
        row.$eval('td:nth-child(2)', el => el.textContent.trim()),
        row.$eval('td:nth-child(3)', el => el.textContent.trim()),
    ]);

    const fileDate = new Date(parseDate(dateCell));
    // console.log(`Processing remate: ${dateCell} (${fileDate}) with name: ${nombreCell}`);

    // Revisa el rango
    if (fileDate < fechaInicio) {
        return DETENER;
    }

    if (isbetweenDates(fileDate, fechaInicio, fechaFin)) {
        const button = await row.$('svg');
        if (!button) {
            return REINTENTAR;
        }
        await button.click();
        // Espera hasta descargar el archivo
        const downloadedFile = await waitForNewFile(downloadPath, downloadedFiles);
        downloadedFiles.push(downloadedFile);

        // Crea y guarda el caso
        const caso = new Caso(fechaHoy, fileDate, downloadedFile,LIQUIDACIONES);
        caso.darMartillero(martillero);
        casos.push(caso);
        return EXITO;
    } else {
        return CONTINUAR;
    }
}

async function manejarPaginaSiguiente(page,firstRowContent){
    // Busca si existe un botón de 'Siguiente'
    console.log("Buscando si existe siguiente.");
    const nextButton = await page.$('#tblRematesInmuebles_next');
    if (nextButton) {
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
            { timeout: 3000 },
            firstRowContent
        );

        return true; // Continue to the next page
    } else {
        console.log("No hay más páginas.");
        return false; // No next page, stop
    }
}

async function waitForNewFile(downloadPath, initialFiles) {
    return new Promise((resolve, reject) => {
        const initialFileSet = new Set(initialFiles); // Convierte initialFiles a Set para mejor rendimiento

        const interval = setInterval(() => {
            let currentFiles;
            try {
                // Lee el directorio actual
                currentFiles = new Set(fs.readdirSync(downloadPath));
            } catch (error) {
                clearInterval(interval);
                reject(new Error(`Error al leer el directorio: ${error.message}`));
                return;
            }

            // Encuentra archivos nuevos
            const newFiles = [...currentFiles].filter(file => !initialFileSet.has(file));
            // console.log(`Archivos nuevos encontrados: ${newFiles.join(', ')}`);
            if (newFiles.length > 0) {
                const completeFile = newFiles.find(file => !file.endsWith('.crdownload'));
                // console.log(`Archivo completo encontrado: ${completeFile}`);
                if (completeFile) {
                    clearInterval(interval); // Detén el intervalo
                    resolve(completeFile); // Devuelve el nombre del archivo completo
                }
            }
        }, 100);

        // Tiempo límite para evitar bloqueos
        const timeout = setTimeout(() => {
            clearInterval(interval); // Asegura detener el intervalo si no se encuentra un archivo
            reject(new Error('Tiempo de espera excedido para un archivo nuevo.'));
        }, 8000); // 5 segundos por intento
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


module.exports = { getDatosBoletin };